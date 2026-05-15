from collections import Counter, defaultdict
from typing import Any, Dict, List


def aggregate_statistics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate review analysis results into dashboard-ready statistics."""
    total = len(results)
    sentiment_counter = Counter(item.get("sentiment", "unknown") for item in results)
    priority_counter = Counter(item.get("priority", "unknown") for item in results)

    negative_aspects = Counter()
    positive_aspects = Counter()
    product_sentiments = defaultdict(Counter)

    for item in results:
        sentiment = item.get("sentiment", "unknown")
        product_id = item.get("product_id", "unknown")
        aspects = item.get("aspects", [])
        product_sentiments[product_id][sentiment] += 1

        if sentiment == "negative":
            negative_aspects.update(aspects)
        elif sentiment == "positive":
            positive_aspects.update(aspects)

    return {
        "total_reviews": total,
        "sentiment_distribution": dict(sentiment_counter),
        "priority_distribution": dict(priority_counter),
        "top_negative_aspects": _counter_to_list(negative_aspects),
        "top_positive_aspects": _counter_to_list(positive_aspects),
        "product_sentiments": {pid: dict(counter) for pid, counter in product_sentiments.items()},
    }


def _counter_to_list(counter: Counter, top_n: int = 10) -> List[Dict[str, Any]]:
    total = sum(counter.values()) or 1
    return [
        {
            "aspect": name,
            "count": count,
            "percentage": round(count * 100 / total, 2),
        }
        for name, count in counter.most_common(top_n)
    ]
