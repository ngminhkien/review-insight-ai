<?php

declare(strict_types=1);

final class CsvReviewParser
{
    private const REQUIRED_COLUMNS = ['review_text'];
    private const COLUMN_ALIASES = [
        'review_id' => ['review_id', 'id', 'reviewid', 'review id'],
        'product_id' => ['product_id', 'productid', 'product id', 'asin', 'sku', 'item_id', 'item id'],
        'product_type' => ['product_type', 'producttype', 'product type', 'category', 'type'],
        'rating' => ['rating', 'score', 'stars', 'star', 'overall'],
        'review_text' => ['review_text', 'review text', 'text', 'review', 'content', 'comment', 'body', 'message'],
        'date' => ['date', 'review_date', 'review date', 'created_at', 'created at', 'time', 'timestamp'],
        'source' => ['source', 'platform', 'channel'],
        'user_id' => ['user_id', 'userid', 'user id', 'customer_id', 'customer id', 'author'],
    ];

    /**
     * @return array<int, array<string, mixed>>
     */
    public function parseUploadedFile(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('CSV upload failed with error code ' . ($file['error'] ?? 'unknown'));
        }

        $originalName = (string)($file['name'] ?? '');
        if ($originalName !== '' && strtolower(pathinfo($originalName, PATHINFO_EXTENSION)) !== 'csv') {
            throw new InvalidArgumentException('Only .csv files are supported.');
        }

        return $this->parseFile((string)$file['tmp_name']);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function parseFile(string $path): array
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Cannot open CSV file.');
        }

        $delimiter = $this->detectDelimiter($path);
        $header = fgetcsv($handle, 0, $delimiter);
        if ($header === false) {
            fclose($handle);
            throw new InvalidArgumentException('CSV file is empty.');
        }

        $columns = array_map([$this, 'canonicalHeader'], $header);
        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, $columns));
        if ($missing !== []) {
            fclose($handle);
            $found = implode(', ', array_filter(array_map([$this, 'normalizeHeader'], $header)));
            throw new InvalidArgumentException(
                'Missing required CSV columns: ' . implode(', ', $missing)
                . '. Found columns: ' . ($found === '' ? 'none' : $found)
                . '. Accepted aliases for review_text: text, review, content, comment, body, message.'
            );
        }

        $reviews = [];
        $line = 1;
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $line++;
            if ($this->isBlankRow($row)) {
                continue;
            }

            $record = [];
            foreach ($columns as $index => $column) {
                if ($column === '') {
                    continue;
                }
                $record[$column] = trim((string)($row[$index] ?? ''));
            }

            $reviewText = $record['review_text'] ?? '';
            if ($reviewText === '') {
                throw new InvalidArgumentException("Line {$line}: review_text is required.");
            }

            $rating = $record['rating'] ?? null;
            if ($rating === '' || $rating === null) {
                $rating = 3;
            }
            if (!is_numeric($rating) || (int)$rating < 1 || (int)$rating > 5) {
                throw new InvalidArgumentException("Line {$line}: rating must be a number from 1 to 5.");
            }

            $reviews[] = [
                'review_id' => ($record['review_id'] ?? '') !== '' ? $record['review_id'] : (string)(count($reviews) + 1),
                'product_id' => $record['product_id'] ?? null,
                'product_type' => $record['product_type'] ?? 'general',
                'rating' => (int)$rating,
                'review_text' => $reviewText,
                'date' => $record['date'] ?? null,
                'source' => $record['source'] ?? null,
                'user_id' => $record['user_id'] ?? null,
            ];
        }
        fclose($handle);

        if ($reviews === []) {
            throw new InvalidArgumentException('CSV file does not contain any review rows.');
        }

        return $reviews;
    }

    private function normalizeHeader(string $value): string
    {
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
        $value = strtolower(trim($value));
        $value = str_replace(['-', '.'], '_', $value);
        return preg_replace('/\s+/', ' ', $value) ?? $value;
    }

    private function canonicalHeader(string $value): string
    {
        $normalized = $this->normalizeHeader($value);
        foreach (self::COLUMN_ALIASES as $canonical => $aliases) {
            if (in_array($normalized, $aliases, true)) {
                return $canonical;
            }
        }

        return $normalized;
    }

    private function detectDelimiter(string $path): string
    {
        $sample = file_get_contents($path, false, null, 0, 4096);
        if ($sample === false || $sample === '') {
            return ',';
        }

        $delimiters = [',' => 0, ';' => 0, "\t" => 0, '|' => 0];
        foreach (array_keys($delimiters) as $delimiter) {
            $delimiters[$delimiter] = substr_count($sample, $delimiter);
        }

        arsort($delimiters);
        $delimiter = array_key_first($delimiters);

        return $delimiter === null || $delimiters[$delimiter] === 0 ? ',' : $delimiter;
    }

    /**
     * @param array<int, string|null> $row
     */
    private function isBlankRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string)$value) !== '') {
                return false;
            }
        }

        return true;
    }
}
