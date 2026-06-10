from typing import Iterable, List


HIGH_PRIORITY_KEYWORDS = [
    "broken",
    "refund",
    "scam",
    "fraud",
    "fake",
    "damaged",
    "defect",
    "defective",
    "unsafe",
    "dangerous",
    "not working",
    "does not work",
    "return",
    "replacement",
]

MEDIUM_PRIORITY_KEYWORDS = [
    "late",
    "delay",
    "delayed",
    "slow",
    "poor",
    "bad",
    "issue",
    "problem",
    "support",
    "warranty",
    "expensive",
]

HIGH_PRIORITY_ASPECTS = {"quality", "warranty", "customer_service"}
MEDIUM_PRIORITY_ASPECTS = {"delivery", "packaging", "price"}


def _contains_any(text: str, keywords: Iterable[str]) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in keywords)


def detect_priority(
    clean_text: str,
    sentiment: str = "neutral",
    rating: int = 3,
    aspects: List[str] | None = None,
) -> str:
    """Detect review priority from sentiment, issue keywords, rating, and aspects."""
    aspects = aspects or []
    sentiment = (sentiment or "neutral").lower()
    has_high_keyword = _contains_any(clean_text, HIGH_PRIORITY_KEYWORDS)
    has_medium_keyword = _contains_any(clean_text, MEDIUM_PRIORITY_KEYWORDS)
    has_high_aspect = any(aspect in HIGH_PRIORITY_ASPECTS for aspect in aspects)
    has_medium_aspect = any(aspect in MEDIUM_PRIORITY_ASPECTS for aspect in aspects)

    if sentiment == "negative" and (has_high_keyword or rating <= 1):
        return "high"
    if rating <= 1 and has_high_aspect:
        return "high"
    if sentiment == "negative" and has_high_aspect and has_medium_keyword:
        return "high"

    if sentiment == "negative":
        return "medium"
    if rating <= 2:
        return "medium"
    if has_medium_keyword and (has_medium_aspect or has_high_aspect):
        return "medium"

    return "low"
