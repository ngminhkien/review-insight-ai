<?php

declare(strict_types=1);

final class ReviewRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function createDataset(string $filename, int $totalReviews): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO datasets (filename, total_reviews, status) VALUES (:filename, :total_reviews, :status)'
        );
        $statement->execute([
            ':filename' => $filename,
            ':total_reviews' => $totalReviews,
            ':status' => 'processing',
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    public function updateDatasetStatus(int $datasetId, string $status, ?string $errorMessage = null): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE datasets SET status = :status, error_message = :error_message WHERE id = :id'
        );
        $statement->execute([
            ':id' => $datasetId,
            ':status' => $status,
            ':error_message' => $errorMessage,
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $reviews
     * @param array<string, mixed> $aiResponse
     * @return array<string, int>
     */
    public function saveAnalysisRun(int $datasetId, array $reviews, array $aiResponse): array
    {
        $this->pdo->beginTransaction();
        try {
            $reviewIdsByExternalId = [];
            foreach ($reviews as $review) {
                $localId = $this->insertReview($datasetId, $review);
                $externalId = (string)($review['review_id'] ?? $localId);
                $reviewIdsByExternalId[$externalId] = $localId;
            }

            foreach (($aiResponse['results'] ?? []) as $result) {
                if (!is_array($result)) {
                    continue;
                }
                $externalId = (string)($result['review_id'] ?? '');
                $localReviewId = $reviewIdsByExternalId[$externalId] ?? null;
                if ($localReviewId === null) {
                    continue;
                }
                $this->insertAnalysis($localReviewId, $result);
            }

            $reportId = $this->insertReport($datasetId, $aiResponse);
            $this->updateDatasetStatus($datasetId, 'completed');
            $this->pdo->commit();

            return ['report_id' => $reportId];
        } catch (Throwable $exception) {
            $this->pdo->rollBack();
            $this->updateDatasetStatus($datasetId, 'failed', $exception->getMessage());
            throw $exception;
        }
    }

    /**
     * @param array<string, mixed> $review
     */
    public function insertReview(?int $datasetId, array $review): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO reviews (
                dataset_id, external_review_id, product_id, product_type, rating,
                review_text, review_date, source, user_id
            ) VALUES (
                :dataset_id, :external_review_id, :product_id, :product_type, :rating,
                :review_text, :review_date, :source, :user_id
            )'
        );
        $statement->execute([
            ':dataset_id' => $datasetId,
            ':external_review_id' => $review['review_id'] ?? null,
            ':product_id' => $review['product_id'] ?? null,
            ':product_type' => $review['product_type'] ?? 'general',
            ':rating' => $review['rating'] ?? 3,
            ':review_text' => $review['review_text'],
            ':review_date' => $review['date'] ?? null,
            ':source' => $review['source'] ?? null,
            ':user_id' => $review['user_id'] ?? null,
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    /**
     * @param array<string, mixed> $analysis
     */
    public function insertAnalysis(int $reviewId, array $analysis): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO review_analyses (
                review_id, clean_text, sentiment, confidence, sentiment_source,
                aspects_json, priority, raw_json
            ) VALUES (
                :review_id, :clean_text, :sentiment, :confidence, :sentiment_source,
                :aspects_json, :priority, :raw_json
            )'
        );
        $statement->execute([
            ':review_id' => $reviewId,
            ':clean_text' => $analysis['clean_text'] ?? null,
            ':sentiment' => $analysis['sentiment'] ?? null,
            ':confidence' => $analysis['confidence'] ?? null,
            ':sentiment_source' => $analysis['sentiment_source'] ?? null,
            ':aspects_json' => json_encode($analysis['aspects'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':priority' => $analysis['priority'] ?? null,
            ':raw_json' => json_encode($analysis, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    /**
     * @param array<string, mixed> $aiResponse
     */
    public function insertReport(int $datasetId, array $aiResponse): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO analysis_reports (
                dataset_id, analytics_json, insights_json, recommendations_json, raw_response_json
            ) VALUES (
                :dataset_id, :analytics_json, :insights_json, :recommendations_json, :raw_response_json
            )'
        );
        $statement->execute([
            ':dataset_id' => $datasetId,
            ':analytics_json' => json_encode($aiResponse['analytics'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':insights_json' => json_encode($aiResponse['insights'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':recommendations_json' => json_encode($aiResponse['recommendations'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':raw_response_json' => json_encode($aiResponse, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listReviews(int $limit = 50): array
    {
        $statement = $this->pdo->prepare(
            'SELECT
                r.id, r.dataset_id, r.external_review_id AS review_id, r.product_id,
                r.product_type, r.rating, r.review_text, r.review_date AS date,
                r.source, r.user_id, r.created_at,
                a.clean_text, a.sentiment, a.confidence, a.sentiment_source,
                a.aspects_json, a.priority
            FROM reviews r
            LEFT JOIN review_analyses a ON a.review_id = r.id
            ORDER BY r.id DESC
            LIMIT :limit'
        );
        $statement->bindValue(':limit', max(1, min($limit, 500)), PDO::PARAM_INT);
        $statement->execute();

        return array_map([$this, 'hydrateReview'], $statement->fetchAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findReview(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT
                r.id, r.dataset_id, r.external_review_id AS review_id, r.product_id,
                r.product_type, r.rating, r.review_text, r.review_date AS date,
                r.source, r.user_id, r.created_at,
                a.clean_text, a.sentiment, a.confidence, a.sentiment_source,
                a.aspects_json, a.priority
            FROM reviews r
            LEFT JOIN review_analyses a ON a.review_id = r.id
            WHERE r.id = :id'
        );
        $statement->execute([':id' => $id]);
        $row = $statement->fetch();

        return $row === false ? null : $this->hydrateReview($row);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findReport(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT ar.*, d.filename, d.total_reviews, d.status
            FROM analysis_reports ar
            INNER JOIN datasets d ON d.id = ar.dataset_id
            WHERE ar.id = :id'
        );
        $statement->execute([':id' => $id]);
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->hydrateReport($row);
    }

    /**
     * @param array<string, mixed> $advice
     */
    public function saveLlmAdvice(int $reportId, array $advice, string $model): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE analysis_reports
            SET llm_advice_json = :llm_advice_json,
                llm_model = :llm_model,
                llm_generated_at = CURRENT_TIMESTAMP
            WHERE id = :id'
        );
        $statement->execute([
            ':id' => $reportId,
            ':llm_advice_json' => json_encode($advice, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':llm_model' => $model,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(): array
    {
        $summary = $this->pdo->query(
            'SELECT
                COUNT(*) AS total_reviews,
                SUM(CASE WHEN a.sentiment = "positive" THEN 1 ELSE 0 END) AS positive,
                SUM(CASE WHEN a.sentiment = "neutral" THEN 1 ELSE 0 END) AS neutral,
                SUM(CASE WHEN a.sentiment = "negative" THEN 1 ELSE 0 END) AS negative,
                SUM(CASE WHEN a.priority = "high" THEN 1 ELSE 0 END) AS high_priority
            FROM reviews r
            LEFT JOIN review_analyses a ON a.review_id = r.id'
        )->fetch() ?: [];

        $datasets = $this->pdo->query(
            'SELECT id, filename, total_reviews, status, created_at
            FROM datasets
            ORDER BY id DESC
            LIMIT 10'
        )->fetchAll();

        $reports = $this->pdo->query(
            'SELECT id, dataset_id, created_at
            FROM analysis_reports
            ORDER BY id DESC
            LIMIT 10'
        )->fetchAll();

        return [
            'summary' => [
                'total_reviews' => (int)($summary['total_reviews'] ?? 0),
                'positive' => (int)($summary['positive'] ?? 0),
                'neutral' => (int)($summary['neutral'] ?? 0),
                'negative' => (int)($summary['negative'] ?? 0),
                'high_priority' => (int)($summary['high_priority'] ?? 0),
            ],
            'recent_datasets' => $datasets,
            'recent_reports' => $reports,
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function hydrateReview(array $row): array
    {
        $row['id'] = (int)$row['id'];
        $row['dataset_id'] = $row['dataset_id'] === null ? null : (int)$row['dataset_id'];
        $row['rating'] = $row['rating'] === null ? null : (int)$row['rating'];
        $row['confidence'] = $row['confidence'] === null ? null : (float)$row['confidence'];
        $row['aspects'] = json_decode((string)($row['aspects_json'] ?? '[]'), true) ?: [];
        unset($row['aspects_json']);

        return $row;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function hydrateReport(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'dataset_id' => (int)$row['dataset_id'],
            'filename' => $row['filename'],
            'total_reviews' => (int)$row['total_reviews'],
            'status' => $row['status'],
            'analytics' => json_decode((string)$row['analytics_json'], true) ?: [],
            'insights' => json_decode((string)$row['insights_json'], true) ?: [],
            'recommendations' => json_decode((string)$row['recommendations_json'], true) ?: [],
            'raw_response' => json_decode((string)$row['raw_response_json'], true) ?: [],
            'llm_advice' => isset($row['llm_advice_json']) && $row['llm_advice_json'] !== null
                ? (json_decode((string)$row['llm_advice_json'], true) ?: null)
                : null,
            'llm_model' => $row['llm_model'] ?? null,
            'llm_generated_at' => $row['llm_generated_at'] ?? null,
            'created_at' => $row['created_at'],
        ];
    }
}
