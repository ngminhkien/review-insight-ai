from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .insight_generator import generate_template_insights
from .pipeline import analyze_batch_reviews, analyze_single_review
from .recommendation import generate_recommendations

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


class InsightRequest(BaseModel):
    analytics: Dict[str, Any]


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


@app.post("/generate-insight")
def generate_insight(payload: InsightRequest) -> Dict[str, Any]:
    insights = generate_template_insights(payload.analytics)
    recommendations = generate_recommendations(payload.analytics)
    return {"insights": insights, "recommendations": recommendations}
