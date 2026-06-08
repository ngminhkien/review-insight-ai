from typing import Any, Dict, List

import pandas as pd

from .analytics import aggregate_statistics
from .aspect_extractor import detect_aspects
from .insight_generator import generate_template_insights
from .preprocess import clean_text, normalize_rating, rating_to_sentiment
from .priority import detect_priority
from .recommendation import generate_recommendations
from .sentiment_model import predict_sentiment

def analyze_single_review(review: Dict[str, Any], use_model: bool = True) -> Dict[str, Any]:
    """Analyze one review using the trained ML model with a rating fallback."""
    rating = normalize_rating(review.get("rating", 3))
    clean = clean_text(review.get("review_text", ""))

    # Lắp não thật: Gọi mô hình AI vừa train để dự đoán câu chữ
    if use_model:
        try:
            model_result = predict_sentiment([clean])[0]
            sentiment = model_result["sentiment"]
            confidence = model_result["confidence"] if model_result["confidence"] is not None else 0.75
            sentiment_source = "trained_model"
        except Exception as e:
            raise RuntimeError(
                f"Trained sentiment model could not be loaded or used: {e}"
            )
    else:
        sentiment = rating_to_sentiment(rating)
        confidence = 0.50
        sentiment_source = "rating_fallback"

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
        "sentiment_source": sentiment_source,
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
