<?php

declare(strict_types=1);

final class Config
{
    public static function aiServiceUrl(): string
    {
        return rtrim(getenv('AI_SERVICE_URL') ?: 'http://localhost:8001', '/');
    }

    public static function databasePath(): string
    {
        return getenv('DB_PATH') ?: dirname(__DIR__) . '/storage/review_insight.sqlite';
    }

    public static function uploadDir(): string
    {
        return getenv('UPLOAD_DIR') ?: dirname(__DIR__) . '/storage/uploads';
    }
}
