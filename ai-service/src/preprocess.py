import re
from typing import Any, Dict, List

import pandas as pd

from .config import REQUIRED_COLUMNS


def clean_text(text: Any) -> str:
    """Clean raw review text for ML processing."""
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_rating(rating: Any) -> int:
    """Normalize rating to integer between 1 and 5."""
    try:
        value = int(float(rating))
    except (TypeError, ValueError):
        value = 3
    return max(1, min(5, value))


def rating_to_sentiment(rating: Any) -> str:
    """Convert star rating to sentiment label for training baseline."""
    value = normalize_rating(rating)
    if value <= 2:
        return "negative"
    if value == 3:
        return "neutral"
    return "positive"


def validate_columns(df: pd.DataFrame) -> List[str]:
    """Return missing required columns."""
    return [col for col in REQUIRED_COLUMNS if col not in df.columns]


def validate_review(row: Dict[str, Any]) -> Dict[str, Any]:
    """Validate one review row and return simple validation result."""
    errors = []
    review_text = str(row.get("review_text", "")).strip()
    if not review_text:
        errors.append("review_text is empty")
    if len(review_text) < 3:
        errors.append("review_text is too short")
    return {"is_valid": len(errors) == 0, "errors": errors}


def preprocess_reviews(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess review dataframe."""
    df = df.copy()
    if "review_text" not in df.columns:
        raise ValueError("Missing required column: review_text")
    df["clean_text"] = df["review_text"].apply(clean_text)
    if "rating" in df.columns:
        df["rating"] = df["rating"].apply(normalize_rating)
        df["label"] = df["rating"].apply(rating_to_sentiment)
    df = df[df["clean_text"].str.len() >= 3]
    return df
