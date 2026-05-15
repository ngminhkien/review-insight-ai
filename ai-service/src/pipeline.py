from typing import Any, Dict, List

import pandas as pd

from .analytics import aggregate_statistics
from .aspect_extractor import detect_aspects
from .insight_generator import generate_template_insights
from .preprocess import clean_text, normalize_rating, rating_to_sentiment
from .priority import detect_priority
from .recommendation import generate_recommendations


def analyze_single_review(review: Dict[str, Any], use_model: bool = False) -> Dict[str, Any]:
    """Analyze one review. Starter version can use rating-based sentiment fallback."""
    rating = normalize_rating(review.get("rating", 3))
    clean = clean_text(review.get("review_text", ""))

    # Starter fallback: use rating-derived sentiment.
    # Later, replace with trained ML model prediction from sentiment_model.predict_sentiment.
    sentiment = rating_to_sentiment(rating)
    confidence = 0.75

    product_type = review.get("product_type", "general") or "general"
    aspects = detect_aspects(clean, product_type=product_type)
    priority = detect_priority(clean, sentiment=sentiment, rating=rating, aspects=aspects)

    return {
        "review_id": review.get("review_id"),
        "product_id": review.get("product_id"),
        "product_type": product_type,
        "date": review.get("date"),
        "rating": rating,
        "review_text": review.get("review_text", ""),
        "clean_text": clean,
        "sentiment": sentiment,
        "confidence": confidence,
        "aspects": aspects,
        "priority": priority,
    }


def analyze_batch_reviews(reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze list of review dicts and return results + analytics."""
    results = [analyze_single_review(item) for item in reviews]
    stats = aggregate_statistics(results)
    insights = generate_template_insights(stats)
    recommendations = generate_recommendations(stats)
    return {
        "results": results,
        "analytics": stats,
        "insights": insights,
        "recommendations": recommendations,
    }


def analyze_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze reviews from pandas dataframe."""
    return analyze_batch_reviews(df.to_dict(orient="records"))
