# Run Guide Chung

Huong dan nay mo ta cach chay toan bo project theo tung phan.

## 1. Clone repo

```bash
git clone <your-repo-url>
cd review-insight-ai
```

## 2. Chay AI Service

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

Windows:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

## 3. Test nhanh API

Mo trinh duyet:

```text
http://localhost:8001/docs
```

Hoac test health:

```text
http://localhost:8001/health
```

## 4. Train model baseline

```bash
cd ai-service
python src/train_sentiment.py --data ../data/sample_reviews.csv
```

Neu loi import khi chay script, dung:

```bash
cd review-insight-ai
python -m ai-service.src.train_sentiment --data data/sample_reviews.csv
```

Ghi chu: Cach import co the can sua lai khi nhom dong goi Python package chuan hon.

## 5. Chay Backend PHP

Mo terminal moi va chay:

```bash
cd backend
php -S localhost:8080 -t public
```

Kiem tra backend:

```bash
curl http://localhost:8080/api/health
```

Upload CSV:

```bash
curl -X POST http://localhost:8080/api/reviews/upload \
  -F "file=@backend/examples/sample_reviews.csv"
```

## 6. Backend va Frontend

- `backend/README.md`
- `frontend/README.md`

Frontend goi PHP backend tai `http://localhost:8080`, backend se goi Python AI service tai `http://localhost:8001`.
