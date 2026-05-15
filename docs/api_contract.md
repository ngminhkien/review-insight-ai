# API Contract Giua Backend Va AI Service

Backend C# se goi AI Service Python qua HTTP API.

## Base URL local

```text
http://localhost:8001
```

## GET /health

Dung de kiem tra AI service con song hay khong.

Response:

```json
{
  "status": "ok",
  "service": "review-insight-ai"
}
```

## POST /analyze-single

Phan tich 1 review.

Request:

```json
{
  "review_id": "1",
  "product_id": "P001",
  "product_type": "phone",
  "rating": 1,
  "review_text": "Poor packaging and broken item",
  "date": "2024-01-03"
}
```

Response:

```json
{
  "review_id": "1",
  "product_id": "P001",
  "product_type": "phone",
  "date": "2024-01-03",
  "rating": 1,
  "review_text": "Poor packaging and broken item",
  "clean_text": "poor packaging and broken item",
  "sentiment": "negative",
  "confidence": 0.75,
  "aspects": ["quality"],
  "priority": "high"
}
```

## POST /analyze-batch

Phan tich nhieu review.

Request:

```json
{
  "reviews": [
    {
      "review_id": "1",
      "product_id": "P001",
      "product_type": "phone",
      "rating": 1,
      "review_text": "Poor packaging and broken item",
      "date": "2024-01-03"
    }
  ]
}
```

Response:

```json
{
  "results": [],
  "analytics": {
    "total_reviews": 1,
    "sentiment_distribution": {},
    "priority_distribution": {},
    "top_negative_aspects": [],
    "top_positive_aspects": [],
    "product_sentiments": {}
  },
  "insights": [],
  "recommendations": []
}
```

## POST /generate-insight

Dung khi Backend da co analytics va chi muon AI service sinh insight/recommendation.

Request:

```json
{
  "analytics": {
    "total_reviews": 1200,
    "sentiment_distribution": {
      "positive": 720,
      "neutral": 170,
      "negative": 310
    },
    "top_negative_aspects": [
      {
        "aspect": "delivery",
        "count": 130,
        "percentage": 42
      }
    ]
  }
}
```

Response:

```json
{
  "insights": ["Delivery la van de tieu cuc noi bat nhat."],
  "recommendations": ["Kiem tra lai doi tac van chuyen."]
}
```
