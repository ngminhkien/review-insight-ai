<?php

declare(strict_types=1);

final class Database
{
    private PDO $pdo;

    public function __construct(string $databasePath)
    {
        $directory = dirname($databasePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $this->pdo = new PDO('sqlite:' . $databasePath);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->pdo->exec('PRAGMA foreign_keys = ON');
        $this->migrate();
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    private function migrate(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                total_reviews INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT "pending",
                error_message TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )'
        );

        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER,
                external_review_id TEXT,
                product_id TEXT,
                product_type TEXT,
                rating INTEGER,
                review_text TEXT NOT NULL,
                review_date TEXT,
                source TEXT,
                user_id TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )'
        );

        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS review_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                clean_text TEXT,
                sentiment TEXT,
                confidence REAL,
                sentiment_source TEXT,
                aspects_json TEXT NOT NULL DEFAULT "[]",
                priority TEXT,
                raw_json TEXT NOT NULL DEFAULT "{}",
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
            )'
        );

        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS analysis_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                analytics_json TEXT NOT NULL DEFAULT "{}",
                insights_json TEXT NOT NULL DEFAULT "[]",
                recommendations_json TEXT NOT NULL DEFAULT "[]",
                raw_response_json TEXT NOT NULL DEFAULT "{}",
                llm_advice_json TEXT,
                llm_model TEXT,
                llm_generated_at TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )'
        );

        $this->addColumnIfMissing('analysis_reports', 'llm_advice_json', 'TEXT');
        $this->addColumnIfMissing('analysis_reports', 'llm_model', 'TEXT');
        $this->addColumnIfMissing('analysis_reports', 'llm_generated_at', 'TEXT');
    }

    private function addColumnIfMissing(string $table, string $column, string $definition): void
    {
        $columns = $this->pdo->query("PRAGMA table_info({$table})")->fetchAll();
        foreach ($columns as $existingColumn) {
            if (($existingColumn['name'] ?? null) === $column) {
                return;
            }
        }

        $this->pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    }
}
