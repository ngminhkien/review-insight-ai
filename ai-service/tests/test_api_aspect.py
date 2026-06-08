from fastapi.testclient import TestClient

from src.api import app


def test_extract_aspects_endpoint_returns_detected_aspects():
    client = TestClient(app)

    response = client.post(
        "/extract-aspects",
        json={"text": "Late delivery and broken item"},
    )

    assert response.status_code == 200
    assert response.json() == ["delivery", "quality"]
