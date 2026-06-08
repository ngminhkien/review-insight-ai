<?php

declare(strict_types=1);

final class Response
{
    public static function json(mixed $payload, int $statusCode = 200): void
    {
        ini_set('serialize_precision', '-1');
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    public static function error(string $message, int $statusCode = 400, array $details = []): void
    {
        self::json([
            'error' => $message,
            'details' => $details,
        ], $statusCode);
    }
}
