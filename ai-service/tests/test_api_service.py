from fastapi.testclient import TestClient

from src import api


def test_health_endpoint():
    client = TestClient(api.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "review-insight-ai",
    }


def test_analyze_single_endpoint(monkeypatch):
    def fake_analyze_single_review(review):
        assert review["review_text"] == "Late delivery and broken item"
        return {
            "review_id": review["review_id"],
            "sentiment": "negative",
            "aspects": ["delivery", "quality"],
            "priority": "high",
        }

    monkeypatch.setattr(api, "analyze_single_review", fake_analyze_single_review)
    client = TestClient(api.app)

    response = client.post(
        "/analyze-single",
        json={
            "review_id": "1",
            "product_id": "P001",
            "product_type": "general",
            "rating": 1,
            "review_text": "Late delivery and broken item",
        },
    )

    assert response.status_code == 200
    assert response.json()["priority"] == "high"


def test_analyze_reviews_endpoint(monkeypatch):
    def fake_analyze_batch_reviews(reviews):
        assert len(reviews) == 1
        return {
            "results": [
                {
                    "review_id": "1",
                    "sentiment": "negative",
                    "aspects": ["delivery", "quality"],
                    "priority": "high",
                }
            ],
            "analytics": {"total_reviews": 1, "negative": 1},
            "insights": [],
            "recommendations": [],
        }

    monkeypatch.setattr(api, "analyze_batch_reviews", fake_analyze_batch_reviews)
    client = TestClient(api.app)

    response = client.post(
        "/analyze-reviews",
        json={
            "reviews": [
                {
                    "review_id": "1",
                    "product_id": "P001",
                    "product_type": "general",
                    "rating": 1,
                    "review_text": "Late delivery and broken item",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["analytics"]["total_reviews"] == 1
