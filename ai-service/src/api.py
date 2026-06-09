from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .analytics import aggregate_statistics
from .aspect_extractor import detect_aspects
from .insight_generator import (
    generate_executive_report,
    generate_llm_business_report,
    generate_template_insights,
    generate_template_summary,
)
from .pipeline import analyze_batch_reviews, analyze_single_review
from .priority import detect_priority
from .preprocess import clean_text
from .recommendation import generate_recommendations
from .sentiment_model import predict_sentiment

app = FastAPI(title="Review Insight AI Service", version="0.1.0")


class ReviewInput(BaseModel):
    review_id: str | None = None
    product_id: str | None = None
    product_type: str | None = "general"
    rating: int | None = 3
    review_text: str = Field(..., min_length=1)
    date: str | None = None


class BatchAnalyzeRequest(BaseModel):
    reviews: List[ReviewInput]


class SentimentInferenceRequest(BaseModel):
    text: str = Field(..., min_length=1)


class SentimentInferenceResponse(BaseModel):
    sentiment: str
    confidence: float | None


class AspectExtractionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    product_type: str | None = "general"


class PriorityDetectionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    sentiment: str | None = None
    rating: int | None = 3
    aspects: List[str] | None = None
    product_type: str | None = "general"


class AnalyticsRequest(BaseModel):
    reviews: List[Dict[str, Any]]


class InsightRequest(BaseModel):
    analytics: Dict[str, Any]
    reviews: List[Dict[str, Any]] = Field(default_factory=list)
    use_llm: bool | None = False
    llm_model: str | None = None


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "review-insight-ai"}


@app.post("/analyze-single")
def analyze_single(payload: ReviewInput) -> Dict[str, Any]:
    return analyze_single_review(payload.model_dump())


@app.post("/analyze-batch")
def analyze_batch(payload: BatchAnalyzeRequest) -> Dict[str, Any]:
    reviews = [item.model_dump() for item in payload.reviews]
    return analyze_batch_reviews(reviews)


@app.post("/analyze-reviews")
def analyze_reviews(payload: BatchAnalyzeRequest) -> Dict[str, Any]:
    reviews = [item.model_dump() for item in payload.reviews]
    return analyze_batch_reviews(reviews)


@app.post("/predict-sentiment", response_model=SentimentInferenceResponse)
def infer_sentiment(payload: SentimentInferenceRequest) -> Dict[str, Any]:
    cleaned = clean_text(payload.text)
    return predict_sentiment([cleaned])[0]


@app.post("/extract-aspects", response_model=List[str])
def extract_aspects(payload: AspectExtractionRequest) -> List[str]:
    cleaned = clean_text(payload.text)
    product_type = payload.product_type or "general"
    return detect_aspects(cleaned, product_type=product_type)


@app.post("/detect-priority")
def infer_priority(payload: PriorityDetectionRequest) -> Dict[str, str]:
    cleaned = clean_text(payload.text)
    product_type = payload.product_type or "general"
    aspects = payload.aspects or detect_aspects(cleaned, product_type=product_type)
    sentiment = payload.sentiment
    if sentiment is None:
        sentiment = predict_sentiment([cleaned])[0]["sentiment"]
    priority = detect_priority(
        cleaned,
        sentiment=sentiment,
        rating=payload.rating or 3,
        aspects=aspects,
    )
    return {"priority": priority}


@app.post("/aggregate-analytics")
def aggregate_analytics(payload: AnalyticsRequest) -> Dict[str, Any]:
    return aggregate_statistics(payload.reviews)


@app.post("/generate-insight")
def generate_insight(payload: InsightRequest) -> Dict[str, Any]:
    insights = generate_template_insights(payload.analytics)
    recommendations = generate_recommendations(payload.analytics)
    response: Dict[str, Any] = {
        "summary": generate_template_summary(payload.analytics),
        "insights": insights,
        "recommendations": recommendations,
        "executive_report": generate_executive_report(payload.analytics, recommendations),
        "llm_report": None,
    }
    if payload.use_llm:
        response["llm_report"] = generate_llm_business_report(
            payload.analytics,
            reviews=payload.reviews,
            model=payload.llm_model,
        )
    return response
