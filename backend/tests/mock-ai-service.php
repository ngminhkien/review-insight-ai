<?php

declare(strict_types=1);

ini_set('serialize_precision', '-1');
header('Content-Type: application/json; charset=utf-8');

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($path === '/health') {
    echo json_encode([
        'status' => 'ok',
        'service' => 'mock-review-insight-ai',
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($path !== '/analyze-reviews' && $path !== '/analyze-single') {
    http_response_code(404);
    echo json_encode(['detail' => 'Not found'], JSON_PRETTY_PRINT);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
$reviews = $path === '/analyze-single' ? [$payload] : ($payload['reviews'] ?? []);
$results = [];
$analytics = [
    'total_reviews' => count($reviews),
    'positive' => 0,
    'neutral' => 0,
    'negative' => 0,
    'sentiment_distribution' => [
        'positive' => 0,
        'neutral' => 0,
        'negative' => 0,
    ],
    'priority_distribution' => [
        'high' => 0,
        'medium' => 0,
        'low' => 0,
    ],
    'top_negative_aspects' => [],
    'top_positive_aspects' => [],
    'product_sentiments' => [],
];

foreach ($reviews as $review) {
    $rating = (int)($review['rating'] ?? 3);
    $sentiment = $rating >= 4 ? 'positive' : ($rating <= 2 ? 'negative' : 'neutral');
    $priority = $sentiment === 'negative' ? 'high' : ($sentiment === 'neutral' ? 'medium' : 'low');
    $text = strtolower((string)($review['review_text'] ?? ''));
    $aspects = [];

    foreach (['delivery', 'quality', 'price', 'packaging'] as $aspect) {
        if (str_contains($text, $aspect)) {
            $aspects[] = $aspect;
        }
    }
    if ($aspects === []) {
        $aspects[] = 'general';
    }

    $result = [
        'review_id' => (string)($review['review_id'] ?? ''),
        'product_id' => $review['product_id'] ?? null,
        'product_type' => $review['product_type'] ?? 'general',
        'date' => $review['date'] ?? null,
        'rating' => $rating,
        'review_text' => $review['review_text'] ?? '',
        'clean_text' => trim(preg_replace('/\s+/', ' ', $text) ?? $text),
        'sentiment' => $sentiment,
        'confidence' => 0.9,
        'sentiment_source' => 'mock',
        'aspects' => $aspects,
        'priority' => $priority,
    ];
    $results[] = $result;

    $analytics[$sentiment]++;
    $analytics['sentiment_distribution'][$sentiment]++;
    $analytics['priority_distribution'][$priority]++;
}

$response = $path === '/analyze-single'
    ? ($results[0] ?? [])
    : [
        'results' => $results,
        'analytics' => $analytics,
        'insights' => ['Mock insight for local backend testing.'],
        'recommendations' => ['Run the real Python AI service for production output.'],
    ];

echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
