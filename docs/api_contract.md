# API Contract Giua Backend Va AI Service

Backend PHP se goi AI Service Python qua HTTP API.

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

## POST /analyze-reviews

Endpoint chinh de Backend gui nhieu review sang AI service va nhan JSON da phan tich.

Request:

```json
{
  "reviews": [
    {
      "review_id": "1",
      "product_id": "P001",
      "product_type": "phone",
      "rating": 1,
      "review_text": "Late delivery and broken item",
      "date": "2024-01-03"
    }
  ]
}
```

Response:

```json
{
  "results": [
    {
      "review_id": "1",
      "product_id": "P001",
      "product_type": "phone",
      "date": "2024-01-03",
      "rating": 1,
      "review_text": "Late delivery and broken item",
      "clean_text": "late delivery and broken item",
      "sentiment": "negative",
      "confidence": 0.91,
      "sentiment_source": "trained_model",
      "aspects": ["delivery", "quality"],
      "priority": "high"
    }
  ],
  "analytics": {
    "total_reviews": 1,
    "positive": 0,
    "neutral": 0,
    "negative": 1,
    "sentiment_distribution": {
      "positive": 0,
      "neutral": 0,
      "negative": 1
    },
    "priority_distribution": {
      "high": 1,
      "medium": 0,
      "low": 0
    },
    "top_negative_aspects": {
      "delivery": 1,
      "quality": 1
    },
    "top_positive_aspects": {},
    "product_sentiments": {
      "P001": {
        "positive": 0,
        "neutral": 0,
        "negative": 1
      }
    }
  },
  "insights": [],
  "recommendations": []
}
```

Ghi chu: `/analyze-batch` duoc giu lai de tuong thich nguoc, con `/analyze-reviews` la ten endpoint theo yeu cau giai doan 9.

## POST /predict-sentiment

Du doan sentiment cho review moi bang model AI da train.

Request:

```json
{
  "text": "The product is good"
}
```

Response:

```json
{
  "sentiment": "positive",
  "confidence": 0.91
}
```

## POST /extract-aspects

Phat hien review dang noi ve van de/aspect nao bang keyword matching.

Request:

```json
{
  "text": "Late delivery and broken item",
  "product_type": "general"
}
```

Response:

```json
[
  "delivery",
  "quality"
]
```

## POST /detect-priority

Phat hien review nao nghiem trong dua tren sentiment, keyword rui ro, rating va aspect.

Logic mau:

```text
negative + broken/refund/scam = high priority
```

Request:

```json
{
  "text": "Late delivery and broken item",
  "sentiment": "negative",
  "rating": 1,
  "aspects": ["delivery", "quality"],
  "product_type": "general"
}
```

Response:

```json
{
  "priority": "high"
}
```

Ghi chu:

- Neu khong truyen `sentiment`, AI service se dung model sentiment da train de predict sentiment truoc.
- Neu khong truyen `aspects`, AI service se detect aspects bang keyword matching truoc.

## POST /aggregate-analytics

Tong hop cac review da duoc phan tich thanh so lieu dashboard.

Request:

```json
{
  "reviews": [
    {
      "product_id": "P001",
      "sentiment": "positive",
      "priority": "low",
      "aspects": ["quality"]
    },
    {
      "product_id": "P002",
      "sentiment": "negative",
      "priority": "high",
      "aspects": ["delivery", "quality"]
    },
    {
      "product_id": "P002",
      "sentiment": "negative",
      "priority": "medium",
      "aspects": ["delivery"]
    }
  ]
}
```

Response:

```json
{
  "total_reviews": 3,
  "positive": 1,
  "neutral": 0,
  "negative": 2,
  "sentiment_distribution": {
    "positive": 1,
    "neutral": 0,
    "negative": 2
  },
  "priority_distribution": {
    "high": 1,
    "medium": 1,
    "low": 1
  },
  "top_negative_aspects": {
    "delivery": 2,
    "quality": 1
  },
  "top_positive_aspects": {
    "quality": 1
  },
  "product_sentiments": {
    "P001": {
      "positive": 1,
      "neutral": 0,
      "negative": 0
    },
    "P002": {
      "positive": 0,
      "neutral": 0,
      "negative": 2
    }
  }
}
```

## POST /generate-insight

Dung khi Backend da co analytics va chi muon AI service sinh insight/recommendation/executive report.

Version 1 mac dinh la template-based, khong can API key.

Version 2 optional dung LLM API khi `use_llm=true` va server co `GEMINI_API_KEY`.

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
  },
  "use_llm": false
}
```

Response:

```json
{
  "summary": "He thong da phan tich 1200 review: 720 tich cuc, 170 trung tinh, 310 tieu cuc. Van de can uu tien xu ly la delivery.",
  "insights": [
    "Ty le review tich cuc la 60.0% tren tong 1200 review.",
    "Ty le review tieu cuc la 25.83% tren tong 1200 review.",
    "Delivery la van de tieu cuc lon nhat voi 130 lan duoc nhac den."
  ],
  "recommendations": [
    "Kiem tra lai doi tac van chuyen, thoi gian giao hang va quy trinh cap nhat trang thai don hang."
  ],
  "executive_report": "Executive report:\nSummary:\n- ...",
  "llm_report": null
}
```

Neu bat LLM, request co the gui them ket qua review da duoc model noi bo phan tich:

```json
{
  "analytics": {},
  "reviews": [
    {
      "product_id": "P001",
      "review_text": "Poor packaging and broken item",
      "sentiment": "negative",
      "confidence": 0.91,
      "aspects": ["quality"],
      "priority": "high"
    }
  ],
  "use_llm": true,
  "llm_model": "gemini-2.5-flash"
}
```

Response LLM co cau truc:

```json
{
  "llm_report": {
    "enabled": true,
    "provider": "google",
    "model": "gemini-2.5-flash",
    "advice": {
      "executive_summary": "Tom tat cho quan ly.",
      "key_findings": ["Phat hien chinh."],
      "product_assessments": [
        {
          "product_id": "P001",
          "product_type": "phone",
          "overview": "Nhan xet tong quan.",
          "strengths": ["Diem manh."],
          "issues": ["Van de."],
          "recommendations": ["De xuat hanh dong."]
        }
      ],
      "priority_actions": ["Hanh dong uu tien."],
      "limitations": ["Gioi han cua du lieu."]
    }
  }
}
```

Khi chua cau hinh `GEMINI_API_KEY`, `llm_report.enabled=false` va API van tra
template insight binh thuong.
