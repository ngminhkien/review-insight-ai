from collections import Counter, defaultdict
from typing import Any, Dict, List


SENTIMENT_LABELS = ("positive", "neutral", "negative")
PRIORITY_LABELS = ("high", "medium", "low")


def _count_sentiments(reviews: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = Counter(str(item.get("sentiment", "neutral")).lower() for item in reviews)
    return {label: int(counts.get(label, 0)) for label in SENTIMENT_LABELS}


def _count_priorities(reviews: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = Counter(str(item.get("priority", "low")).lower() for item in reviews)
    return {label: int(counts.get(label, 0)) for label in PRIORITY_LABELS}


def _count_aspects_by_sentiment(
    reviews: List[Dict[str, Any]],
    sentiment: str,
) -> Dict[str, int]:
    counts: Counter[str] = Counter()
    for item in reviews:
        if str(item.get("sentiment", "")).lower() != sentiment:
            continue
        aspects = item.get("aspects") or []
        for aspect in aspects:
            counts[str(aspect)] += 1
    return dict(counts.most_common())


def _product_sentiments(reviews: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
    product_counts: Dict[str, Counter[str]] = defaultdict(Counter)
    for item in reviews:
        product_id = str(item.get("product_id") or "unknown")
        sentiment = str(item.get("sentiment", "neutral")).lower()
        product_counts[product_id][sentiment] += 1

    return {
        product_id: {label: int(counts.get(label, 0)) for label in SENTIMENT_LABELS}
        for product_id, counts in product_counts.items()
    }


def aggregate_statistics(reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Convert analyzed review rows into dashboard-ready aggregate statistics.

    Input reviews are expected to already contain fields such as sentiment,
    aspects, priority, and product_id from the analysis pipeline.
    """
    total_reviews = len(reviews)
    sentiment_distribution = _count_sentiments(reviews)
    priority_distribution = _count_priorities(reviews)
    top_negative_aspects = _count_aspects_by_sentiment(reviews, "negative")
    top_positive_aspects = _count_aspects_by_sentiment(reviews, "positive")

    return {
        "total_reviews": total_reviews,
        "positive": sentiment_distribution["positive"],
        "neutral": sentiment_distribution["neutral"],
        "negative": sentiment_distribution["negative"],
        "sentiment_distribution": sentiment_distribution,
        "priority_distribution": priority_distribution,
        "top_negative_aspects": top_negative_aspects,
        "top_positive_aspects": top_positive_aspects,
        "product_sentiments": _product_sentiments(reviews),
    }
