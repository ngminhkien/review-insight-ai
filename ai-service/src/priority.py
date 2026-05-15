from typing import List

HIGH_RISK_KEYWORDS = [
    "broken",
    "refund",
    "scam",
    "dangerous",
    "damaged",
    "never buy",
    "irritation",
    "late",
]


def detect_priority(clean_text: str, sentiment: str, rating: int | None = None, aspects: List[str] | None = None) -> str:
    """Assign low, medium, high priority for review handling."""
    text = clean_text.lower()
    aspects = aspects or []

    if sentiment == "negative" and any(keyword in text for keyword in HIGH_RISK_KEYWORDS):
        return "high"
    if sentiment == "negative" and rating is not None and rating <= 2:
        return "high"
    if sentiment == "negative":
        return "medium"
    if sentiment == "neutral" and aspects != ["general"]:
        return "medium"
    return "low"
