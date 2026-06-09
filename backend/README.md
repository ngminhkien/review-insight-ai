# Backend PHP - Review Insight AI

Backend nay la cau noi giua Frontend va Python AI Service.

```text
Frontend
  -> PHP Backend
    -> Python AI Service
      -> Sentiment, Aspect, Priority, Analytics, Insight
```

## Backend lam gi?

- Nhan upload CSV tu frontend.
- Validate va parse du lieu review.
- Goi Python AI Service qua HTTP.
- Luu review, ket qua AI va report vao SQLite.
- Tra JSON cho frontend.
- Cung cap API xem lich su, dashboard va report.

## Cong nghe

- PHP 8.1+ thuan, khong can Composer.
- SQLite qua PDO.
- PHP built-in server de demo local.
- AI Service mac dinh: `http://localhost:8001`.

## Cau truc

```text
backend/
├── public/index.php          # Router HTTP API
├── src/
│   ├── AiServiceClient.php   # Goi Python AI Service
│   ├── Config.php            # Env config
│   ├── CsvReviewParser.php   # Doc va validate CSV
│   ├── Database.php          # Tao bang SQLite
│   ├── Response.php          # JSON response helper
│   └── ReviewRepository.php  # Luu/lay du lieu
└── storage/                  # SQLite va upload tam, khong commit data
```

## Chay local

Chay AI service truoc:

```bash
cd ai-service
uvicorn src.api:app --reload --port 8001
```

Chay PHP backend:

```bash
cd backend
php -S localhost:8080 -t public
```

Neu AI service chay port khac:

```bash
AI_SERVICE_URL=http://localhost:8001 php -S localhost:8080 -t public
```

Kiem tra health:

```bash
curl http://localhost:8080/api/health
```

Mo test dashboard tren trinh duyet:

```text
http://localhost:8080/dashboard.html
```

Neu chua cai Python AI Service, co the test backend bang mock AI service:

```bash
cd backend
php -S localhost:8001 tests/mock-ai-service.php
```

Sau do mo terminal khac chay backend nhu binh thuong.

## Dinh dang CSV

Cot bat buoc:

```text
review_text
```

Backend cung chap nhan cac ten cot tuong duong cho noi dung review:

```text
text, review, content, comment, body, message
```

Cot nen co:

```text
review_id,product_id,product_type,rating,date,source,user_id
```

Mot so alias duoc ho tro:

```text
rating: score, stars, overall
product_id: asin, sku, item_id
product_type: category, type
date: review_date, created_at, timestamp
```

CSV co the dung dau phay `,`, cham phay `;`, tab hoac `|` lam dau phan cach.

Vi du:

```csv
review_id,product_id,product_type,rating,review_text,date
1,P001,phone,5,"Good quality and fast delivery",2024-01-02
2,P001,phone,1,"Poor packaging and broken item",2024-01-03
```

## API

### `GET /docs` hoặc `GET /api/docs`

Giao diện tài liệu API trực quan (Swagger UI).

### `GET /swagger.json`

Tệp cấu hình OpenAPI specification dùng cho Swagger UI.

### `GET /api/health`

Kiem tra backend va trang thai AI service.

### `POST /api/reviews/upload`

Upload CSV, parse, goi AI service, luu database va tra ket qua.

```bash
curl -X POST http://localhost:8080/api/reviews/upload \
  -F "file=@examples/sample_reviews.csv"
```

Response chinh:

```json
{
  "message": "CSV uploaded and analyzed successfully.",
  "dataset_id": 1,
  "report_id": 1,
  "total_reviews": 2,
  "analytics": {},
  "insights": [],
  "recommendations": [],
  "results": []
}
```

### `POST /api/reviews/analyze-single`

Phan tich 1 review va luu ket qua.

```bash
curl -X POST http://localhost:8080/api/reviews/analyze-single \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "manual-1",
    "product_id": "P001",
    "product_type": "phone",
    "rating": 1,
    "review_text": "Late delivery and broken item",
    "date": "2024-01-03"
  }'
```

### `GET /api/reviews`

Lay danh sach review da luu.

```bash
curl "http://localhost:8080/api/reviews?limit=50"
```

### `GET /api/reviews/{id}`

Lay chi tiet 1 review.

```bash
curl http://localhost:8080/api/reviews/1
```

### `GET /api/dashboard`

Lay thong ke tong quan tu database.

```bash
curl http://localhost:8080/api/dashboard
```

### `GET /api/reports/{id}`

Lay report da luu sau khi upload CSV.

```bash
curl http://localhost:8080/api/reports/1
```

### `POST /api/reports/{id}/generate-llm`

Lay analytics va ket qua model tho cua report, goi OpenAI LLM de tao nhan xet
va de xuat theo tung san pham. Ket qua duoc luu vao report.

Can cau hinh `OPENAI_API_KEY` trong file `.env` tai thu muc goc project.

```bash
curl -X POST http://localhost:8080/api/reports/1/generate-llm \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Database

Backend tu tao SQLite file tai:

```text
backend/storage/review_insight.sqlite
```

Bang du lieu:

- `datasets`: moi lan upload CSV.
- `reviews`: review goc.
- `review_analyses`: ket qua sentiment/aspect/priority.
- `analysis_reports`: analytics, insights, recommendations.

Co the doi duong dan DB:

```bash
DB_PATH=/tmp/review_insight.sqlite php -S localhost:8080 -t public
```

## Ghi chu tich hop frontend

Frontend chi can goi PHP backend, khong goi truc tiep Python AI Service.

```text
Upload CSV form field: file
Base URL local: http://localhost:8080
```
