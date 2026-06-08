from fastapi.testclient import TestClient

from src.api import app


def test_detect_priority_endpoint_returns_high_priority():
    client = TestClient(app)

    response = client.post(
        "/detect-priority",
        json={
            "text": "Late delivery and broken item",
            "sentiment": "negative",
            "rating": 1,
            "aspects": ["delivery", "quality"],
        },
    )

    assert response.status_code == 200
    assert response.json() == {"priority": "high"}
