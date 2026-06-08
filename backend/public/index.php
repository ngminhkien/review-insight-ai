<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/CsvReviewParser.php';
require_once __DIR__ . '/../src/AiServiceClient.php';
require_once __DIR__ . '/../src/ReviewRepository.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$database = new Database(Config::databasePath());
$repository = new ReviewRepository($database->pdo());
$aiClient = new AiServiceClient(Config::aiServiceUrl());
$parser = new CsvReviewParser();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

try {
    if ($method === 'GET' && $path === '/api/health') {
        Response::json([
            'status' => 'ok',
            'service' => 'review-insight-php-backend',
            'ai_service' => tryAiHealth($aiClient),
        ]);
        exit;
    }

    if ($method === 'POST' && $path === '/api/reviews/upload') {
        $file = $_FILES['file'] ?? null;
        if (!is_array($file)) {
            Response::error('Upload field "file" is required.', 422);
            exit;
        }

        $reviews = $parser->parseUploadedFile($file);
        $datasetId = $repository->createDataset((string)($file['name'] ?? 'reviews.csv'), count($reviews));

        try {
            $aiResponse = $aiClient->analyzeReviews($reviews);
            $saved = $repository->saveAnalysisRun($datasetId, $reviews, $aiResponse);
        } catch (Throwable $exception) {
            $repository->updateDatasetStatus($datasetId, 'failed', $exception->getMessage());
            throw $exception;
        }

        Response::json([
            'message' => 'CSV uploaded and analyzed successfully.',
            'dataset_id' => $datasetId,
            'report_id' => $saved['report_id'],
            'total_reviews' => count($reviews),
            'analytics' => $aiResponse['analytics'] ?? [],
            'insights' => $aiResponse['insights'] ?? [],
            'recommendations' => $aiResponse['recommendations'] ?? [],
            'results' => $aiResponse['results'] ?? [],
        ], 201);
        exit;
    }

    if ($method === 'POST' && $path === '/api/reviews/analyze-single') {
        $payload = readJsonBody();
        validateSingleReviewPayload($payload);

        $analysis = $aiClient->analyzeSingle($payload);
        $reviewId = $repository->insertReview(null, $payload);
        $repository->insertAnalysis($reviewId, $analysis);

        Response::json([
            'message' => 'Review analyzed successfully.',
            'review_id' => $reviewId,
            'result' => $analysis,
        ], 201);
        exit;
    }

    if ($method === 'GET' && $path === '/api/reviews') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        Response::json([
            'data' => $repository->listReviews($limit),
        ]);
        exit;
    }

    if ($method === 'GET' && preg_match('#^/api/reviews/(\d+)$#', $path, $matches)) {
        $review = $repository->findReview((int)$matches[1]);
        if ($review === null) {
            Response::error('Review not found.', 404);
            exit;
        }

        Response::json($review);
        exit;
    }

    if ($method === 'GET' && $path === '/api/dashboard') {
        Response::json($repository->dashboard());
        exit;
    }

    if ($method === 'GET' && preg_match('#^/api/reports/(\d+)$#', $path, $matches)) {
        $report = $repository->findReport((int)$matches[1]);
        if ($report === null) {
            Response::error('Report not found.', 404);
            exit;
        }

        Response::json($report);
        exit;
    }

    Response::error('Route not found.', 404, [
        'method' => $method,
        'path' => $path,
    ]);
} catch (InvalidArgumentException $exception) {
    Response::error($exception->getMessage(), 422);
} catch (Throwable $exception) {
    Response::error('Internal server error.', 500, [
        'message' => $exception->getMessage(),
    ]);
}

/**
 * @return array<string, mixed>
 */
function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody === false ? '' : $rawBody, true);
    if (!is_array($payload)) {
        throw new InvalidArgumentException('Request body must be valid JSON.');
    }

    return $payload;
}

/**
 * @param array<string, mixed> $payload
 */
function validateSingleReviewPayload(array $payload): void
{
    if (trim((string)($payload['review_text'] ?? '')) === '') {
        throw new InvalidArgumentException('review_text is required.');
    }

    if (isset($payload['rating']) && (!is_numeric($payload['rating']) || (int)$payload['rating'] < 1 || (int)$payload['rating'] > 5)) {
        throw new InvalidArgumentException('rating must be a number from 1 to 5.');
    }
}

/**
 * @return array<string, mixed>
 */
function tryAiHealth(AiServiceClient $client): array
{
    try {
        return $client->health();
    } catch (Throwable $exception) {
        return [
            'status' => 'unavailable',
            'message' => $exception->getMessage(),
        ];
    }
}
