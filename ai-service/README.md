# AI Service

Module nay phu trach xu ly AI cho review product.

## Chuc nang

- Validate du lieu review.
- Preprocess text.
- Predict sentiment bang model ML baseline.
- Detect aspect bang keyword dictionary.
- Detect priority.
- Tong hop analytics.
- Sinh insight va recommendation.
- Cung cap API cho Backend C# goi.

## Cai dat

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Tren Windows:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Train model baseline

```bash
python src/train_sentiment.py --data ../data/sample_reviews.csv
```

Output du kien:

```text
models/sentiment_model.pkl
models/tfidf_vectorizer.pkl
reports/classification_report.json
```

## Chay API

```bash
uvicorn src.api:app --reload --port 8001
```

Kiem tra:

```text
GET http://localhost:8001/health
```

## Endpoint chinh

```text
POST /analyze-single
POST /analyze-batch
POST /generate-insight
GET /health
```

## Ghi chu

Code hien tai la starter template. Nhom co the sua lai theo dataset that, model that va output contract voi backend.
