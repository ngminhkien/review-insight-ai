from fastapi.testclient import TestClient

from src import api


def test_predict_sentiment_endpoint_returns_minimal_inference(monkeypatch):
    def fake_predict_sentiment(texts):
        assert texts == ["the product is good"]
        return [{"sentiment": "positive", "confidence": 0.91}]

    monkeypatch.setattr(api, "predict_sentiment", fake_predict_sentiment)
    client = TestClient(api.app)

    response = client.post(
        "/predict-sentiment",
        json={"text": "The product is good"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "sentiment": "positive",
        "confidence": 0.91,
    }
