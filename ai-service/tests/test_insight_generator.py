from src.insight_generator import (
    build_llm_context,
    generate_executive_report,
    generate_llm_business_report,
    generate_template_insights,
    generate_template_summary,
)
from src.recommendation import generate_recommendations


def test_template_insights_identify_top_negative_aspect():
    stats = {
        "total_reviews": 3,
        "positive": 1,
        "neutral": 0,
        "negative": 2,
        "top_negative_aspects": {"delivery": 2, "quality": 1},
        "top_positive_aspects": {"quality": 1},
    }

    insights = generate_template_insights(stats)

    assert "Delivery la van de tieu cuc lon nhat voi 2 lan duoc nhac den." in insights


def test_template_summary_and_report_are_generated():
    stats = {
        "total_reviews": 3,
        "positive": 1,
        "neutral": 0,
        "negative": 2,
        "top_negative_aspects": {"delivery": 2},
    }
    recommendations = generate_recommendations(stats)

    summary = generate_template_summary(stats)
    report = generate_executive_report(stats, recommendations)

    assert "3 review" in summary
    assert "delivery" in summary
    assert "Executive report:" in report
    assert "Recommendations:" in report


def test_llm_context_groups_reviews_by_product():
    context = build_llm_context(
        {"total_reviews": 2},
        [
            {
                "product_id": "P001",
                "product_type": "phone",
                "rating": 1,
                "review_text": "Broken item",
                "sentiment": "negative",
                "aspects": ["quality"],
                "priority": "high",
            },
            {
                "product_id": "P001",
                "product_type": "phone",
                "rating": 5,
                "review_text": "Good screen",
                "sentiment": "positive",
                "aspects": ["quality"],
                "priority": "low",
            },
        ],
    )

    product = context["products"][0]
    assert product["product_id"] == "P001"
    assert product["sentiment"] == {"positive": 1, "neutral": 0, "negative": 1}
    assert product["aspects"] == {"quality": 2}


def test_llm_report_is_disabled_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    result = generate_llm_business_report({"total_reviews": 0})

    assert result["enabled"] is False
    assert result["reason"] == "OPENAI_API_KEY is not set"
