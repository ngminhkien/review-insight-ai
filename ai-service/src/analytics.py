from collections import Counter, defaultdict
import re
from typing import Any, Dict, List

try:
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
except ImportError:
    ENGLISH_STOP_WORDS = set()

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


def _get_frequent_words(reviews: List[Dict[str, Any]], sentiment: str) -> Dict[str, int]:
    """Get top 15 frequent meaningful words from reviews of a specific sentiment."""
    word_counter: Counter[str] = Counter()
    for item in reviews:
        if str(item.get("sentiment", "")).lower() != sentiment:
            continue
        text = str(item.get("clean_text") or item.get("review_text", "")).lower()
        words = re.findall(r'\b[a-z]{3,}\b', text)
        for w in words:
            if w not in ENGLISH_STOP_WORDS and w not in ["br", "href", "quot"]:
                word_counter[w] += 1
    return dict(word_counter.most_common(15))


def _aspect_sentiment_breakdown(reviews: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
    """Count sentiments for each aspect."""
    aspect_counts: Dict[str, Counter[str]] = defaultdict(Counter)
    for item in reviews:
        sentiment = str(item.get("sentiment", "neutral")).lower()
        aspects = item.get("aspects") or []
        for aspect in aspects:
            aspect_counts[str(aspect)][sentiment] += 1

    return {
        aspect: {label: int(counts.get(label, 0)) for label in SENTIMENT_LABELS}
        for aspect, counts in aspect_counts.items()
    }


def _get_frequent_words_by_aspect(reviews: List[Dict[str, Any]]) -> Dict[str, Dict[str, Dict[str, int]]]:
    """Get top frequent meaningful words for each aspect, separated by sentiment."""
    # aspect -> sentiment -> Counter
    aspect_words: Dict[str, Dict[str, Counter[str]]] = defaultdict(
        lambda: {"positive": Counter(), "negative": Counter()}
    )
    
    for item in reviews:
        sentiment = str(item.get("sentiment", "neutral")).lower()
        if sentiment not in ["positive", "negative"]:
            continue
            
        aspects = item.get("aspects") or []
        text = str(item.get("clean_text") or item.get("review_text", "")).lower()
        words = re.findall(r'\b[a-z]{3,}\b', text)
        filtered_words = [w for w in words if w not in ENGLISH_STOP_WORDS and w not in ["br", "href", "quot"]]
        
        for aspect in aspects:
            for w in filtered_words:
                aspect_words[str(aspect)][sentiment][w] += 1
                
    result = {}
    for aspect, sents in aspect_words.items():
        result[aspect] = {
            "positive": dict(sents["positive"].most_common(10)),
            "negative": dict(sents["negative"].most_common(10)),
        }
    return result


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
        "frequent_words_positive": _get_frequent_words(reviews, "positive"),
        "frequent_words_negative": _get_frequent_words(reviews, "negative"),
        "aspect_sentiment_breakdown": _aspect_sentiment_breakdown(reviews),
        "aspect_word_stats": _get_frequent_words_by_aspect(reviews),
    }
