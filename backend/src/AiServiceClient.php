<?php

declare(strict_types=1);

final class AiServiceClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly int $timeoutSeconds = 300,
    ) {
    }

    /**
     * @param array<int, array<string, mixed>> $reviews
     * @return array<string, mixed>
     */
    public function analyzeReviews(array $reviews): array
    {
        $payload = [
            'reviews' => array_map([$this, 'toAiReview'], $reviews),
        ];

        return $this->post('/analyze-reviews', $payload);
    }

    /**
     * @param array<string, mixed> $review
     * @return array<string, mixed>
     */
    public function analyzeSingle(array $review): array
    {
        return $this->post('/analyze-single', $this->toAiReview($review));
    }

    /**
     * @return array<string, mixed>
     */
    public function health(): array
    {
        return $this->get('/health');
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function post(string $path, array $payload): array
    {
        return $this->request('POST', $path, $payload);
    }

    /**
     * @return array<string, mixed>
     */
    private function get(string $path): array
    {
        return $this->request('GET', $path);
    }

    /**
     * @param array<string, mixed>|null $payload
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $payload = null): array
    {
        $url = $this->baseUrl . $path;
        $body = $payload === null ? null : json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if (function_exists('curl_init')) {
            return $this->requestWithCurl($method, $url, $body);
        }

        return $this->requestWithStreams($method, $url, $body);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestWithCurl(string $method, string $url, ?string $body): array
    {
        $curl = curl_init($url);
        if ($curl === false) {
            throw new RuntimeException('Cannot initialize cURL.');
        }

        $headers = ['Accept: application/json'];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
        }

        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
        ]);

        if ($body !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        }

        $responseBody = curl_exec($curl);
        $statusCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($responseBody === false) {
            throw new RuntimeException('AI service request failed: ' . $error);
        }

        return $this->decodeResponse($responseBody, $statusCode);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestWithStreams(string $method, string $url, ?string $body): array
    {
        $headers = "Accept: application/json\r\n";
        if ($body !== null) {
            $headers .= "Content-Type: application/json\r\n";
        }

        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => $headers,
                'content' => $body ?? '',
                'ignore_errors' => true,
                'timeout' => $this->timeoutSeconds,
            ],
        ]);

        $responseBody = file_get_contents($url, false, $context);
        if ($responseBody === false) {
            throw new RuntimeException('AI service request failed.');
        }

        $statusCode = 200;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $statusCode = (int)$matches[1];
        }

        return $this->decodeResponse($responseBody, $statusCode);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeResponse(string $responseBody, int $statusCode): array
    {
        $decoded = json_decode($responseBody, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('AI service returned invalid JSON.');
        }

        if ($statusCode < 200 || $statusCode >= 300) {
            throw new RuntimeException('AI service returned HTTP ' . $statusCode . ': ' . json_encode($decoded));
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $review
     * @return array<string, mixed>
     */
    private function toAiReview(array $review): array
    {
        return [
            'review_id' => isset($review['review_id']) ? (string)$review['review_id'] : null,
            'product_id' => $review['product_id'] ?? null,
            'product_type' => $review['product_type'] ?? 'general',
            'rating' => isset($review['rating']) ? (int)$review['rating'] : 3,
            'review_text' => (string)($review['review_text'] ?? ''),
            'date' => $review['date'] ?? null,
        ];
    }
}
