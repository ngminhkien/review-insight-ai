<?php

declare(strict_types=1);

ini_set('max_execution_time', '300');
ini_set('memory_limit', '512M');

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
    if ($method === 'GET' && ($path === '/docs' || $path === '/api/docs')) {
        header('Content-Type: text/html; charset=UTF-8');
        echo <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Review Insight API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-16x16.png" sizes="16x16" />
    <style>
        html { box-sizing: border-box; overflow: -margin-box-bottom; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout"
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
HTML;
        exit;
    }

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

    if ($method === 'POST' && preg_match('#^/api/reports/(\d+)/generate-llm$#', $path, $matches)) {
        $reportId = (int)$matches[1];
        $report = $repository->findReport($reportId);
        if ($report === null) {
            Response::error('Report not found.', 404);
            exit;
        }

        $payload = readOptionalJsonBody();
        $rawResults = $report['raw_response']['results'] ?? [];
        $reviews = is_array($rawResults) ? $rawResults : [];
        $llmResponse = $aiClient->generateProductAdvice(
            $report['analytics'],
            $reviews,
            isset($payload['model']) ? (string)$payload['model'] : null,
        );
        $llmReport = $llmResponse['llm_report'] ?? null;

        if (!is_array($llmReport) || ($llmReport['enabled'] ?? false) !== true) {
            Response::error('OpenAI LLM is not configured.', 422, [
                'message' => $llmReport['reason'] ?? 'Set OPENAI_API_KEY and restart the services.',
            ]);
            exit;
        }

        $advice = $llmReport['advice'] ?? null;
        if (!is_array($advice)) {
            throw new RuntimeException('AI service returned an invalid LLM advice payload.');
        }

        $model = (string)($llmReport['model'] ?? 'unknown');
        $repository->saveLlmAdvice($reportId, $advice, $model);

        Response::json([
            'message' => 'LLM product advice generated successfully.',
            'report_id' => $reportId,
            'model' => $model,
            'advice' => $advice,
        ]);
        exit;
    }

    Response::error('Route not found.', 404, [
        'method' => $method,
        'path' => $path,
    ]);
} catch (InvalidArgumentException $exception) {
    Response::error($exception->getMessage(), 422);
} catch (AiServiceException $exception) {
    Response::error('AI service is unavailable. Start the AI service and try again.', 502, [
        'message' => $exception->getMessage(),
        'ai_service_url' => Config::aiServiceUrl(),
    ]);
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
 * @return array<string, mixed>
 */
function readOptionalJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $payload = json_decode($rawBody, true);
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
