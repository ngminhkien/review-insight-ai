from src import insight_generator
from src.insight_generator import (
    ProductAdvice,
    ProductAssessment,
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
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    result = generate_llm_business_report({"total_reviews": 0})

    assert result["enabled"] is False
    assert result["provider"] == "google"
    assert result["reason"] == "GEMINI_API_KEY is not set"


def test_llm_report_uses_gemini_structured_output(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test")

    def fake_request(api_key, model, prompt):
        assert api_key == "test-key"
        assert model == "gemini-test"
        assert "Du lieu:" in prompt
        return ProductAdvice(
            executive_summary="Tong quan",
            key_findings=["Chat luong can cai thien"],
            product_assessments=[
                ProductAssessment(
                    product_id="P001",
                    overview="Can theo doi",
                    issues=["Chat luong"],
                    recommendations=["Kiem tra dau ra"],
                )
            ],
            priority_actions=["Kiem tra P001"],
        )

    monkeypatch.setattr(insight_generator, "_request_gemini_advice", fake_request)

    result = generate_llm_business_report(
        {"total_reviews": 1},
        [{"product_id": "P001", "sentiment": "negative"}],
    )

    assert result["enabled"] is True
    assert result["provider"] == "google"
    assert result["model"] == "gemini-test"
    assert result["advice"]["product_assessments"][0]["product_id"] == "P001"
