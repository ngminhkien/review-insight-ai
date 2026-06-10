from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

SENTIMENT_MODEL_PATH = MODEL_DIR / "sentiment_model_v2.pkl"
TFIDF_VECTORIZER_PATH = MODEL_DIR / "tfidf_vectorizer.pkl"
CLASSIFICATION_REPORT_PATH = REPORT_DIR / "classification_report.json"

REQUIRED_COLUMNS = ["review_id", "product_id", "rating", "review_text", "date"]

DEFAULT_ASPECTS = [
    "price",
    "quality",
    "delivery",
    "packaging",
    "customer_service",
    "warranty",
    "usability",
]
