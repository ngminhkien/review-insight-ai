from src.insight_generator import (
    generate_executive_report,
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
