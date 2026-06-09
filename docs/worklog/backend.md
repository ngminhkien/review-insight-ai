# Worklog - PHP Backend Integration

## Tong quan

Backend PHP dong vai tro cau noi giua giao dien va Python AI Service:

```text
Dashboard / Frontend
-> PHP Backend
-> Python FastAPI AI Service
-> Sentiment, Aspect, Priority, Analytics, Insight
```

Backend khong chay model AI truc tiep. Backend nhan du lieu, validate, goi AI
Service qua HTTP, luu ket qua vao SQLite va tra JSON cho frontend.

## Cong viec da lam

### 1. Tao HTTP API bang PHP

- Tao router API tai `backend/public/index.php`.
- Them CORS header de frontend co the goi backend.
- Ho tro request JSON, upload file CSV va JSON response thong nhat.
- Xu ly loi validation voi HTTP `422`.
- Xu ly route khong ton tai voi HTTP `404`.
- Xu ly loi he thong va loi ket noi AI Service voi HTTP `500`.

Endpoint da co:

```text
GET  /api/health
POST /api/reviews/upload
POST /api/reviews/analyze-single
GET  /api/reviews
GET  /api/reviews/{id}
GET  /api/dashboard
GET  /api/reports/{id}
```

### 2. Xu ly va validate CSV

- Tao `backend/src/CsvReviewParser.php`.
- Chi chap nhan file co phan mo rong `.csv`.
- Tu dong nhan biet dau phan cach:
  - dau phay `,`
  - cham phay `;`
  - tab
  - dau `|`
- Bat buoc CSV phai co noi dung review.
- Ho tro alias cho cot `review_text`:

```text
review_text, review text, text, review, content, comment, body, message
```

- Ho tro alias cho cac cot `review_id`, `product_id`, `product_type`,
  `rating`, `date`, `source`, `user_id`.
- Tu dong gan `review_id` neu CSV khong co.
- Mac dinh `rating=3` va `product_type=general` neu bi thieu.
- Validate rating nam trong khoang tu 1 den 5.
- Bo qua dong trong va thong bao ro dong CSV bi loi.

### 3. Tich hop Python AI Service

- Tao `backend/src/AiServiceClient.php`.
- Backend goi AI Service mac dinh tai:

```text
http://localhost:8001
```

- Upload CSV se goi:

```text
POST /analyze-reviews
```

- Phan tich mot review se goi:

```text
POST /analyze-single
```

- Health check backend se goi:

```text
GET /health
```

- Client uu tien su dung PHP cURL va co fallback bang PHP stream.
- Co timeout request va kiem tra HTTP status.
- Kiem tra response cua AI Service phai la JSON hop le.

### 4. Luu du lieu bang SQLite

- Tao `backend/src/Database.php`.
- Database duoc tu dong tao va migrate khi backend khoi dong.
- File mac dinh:

```text
backend/storage/review_insight.sqlite
```

Bang da tao:

```text
datasets
reviews
review_analyses
analysis_reports
```

- `datasets`: luu thong tin moi lan upload CSV va trang thai xu ly.
- `reviews`: luu review goc.
- `review_analyses`: luu sentiment, confidence, aspects va priority.
- `analysis_reports`: luu analytics, insights, recommendations va response goc.
- Su dung transaction khi luu mot lan phan tich CSV.
- Neu AI Service hoac database loi, dataset duoc danh dau `failed`.

### 5. Tao repository truy van du lieu

- Tao `backend/src/ReviewRepository.php`.
- Luu review va ket qua phan tich.
- Luu report sau moi lan upload.
- Lay danh sach review, gioi han toi da 500 ban ghi moi request.
- Lay chi tiet review theo ID.
- Lay report theo ID.
- Tong hop du lieu dashboard:
  - tong review
  - positive
  - neutral
  - negative
  - high priority
  - dataset gan day
  - report gan day

### 6. Tao dashboard demo

- Tao `backend/public/dashboard.html`.
- Cho phep upload file CSV tren trinh duyet.
- Hien thi ket qua analytics, insights, recommendations va danh sach review.
- Doc du lieu dashboard va lich su da luu tu PHP Backend.
- Co the truy cap tai:

```text
http://localhost:8080/dashboard.html
```

### 7. Tao mock AI Service

- Tao `backend/tests/mock-ai-service.php`.
- Mock ho tro:

```text
GET  /health
POST /analyze-reviews
POST /analyze-single
```

- Mock suy ra sentiment tu rating va tim mot so aspect co ban.
- Dung de test backend khi chua cai dependency Python hoac model sentiment.
- Mock chi phuc vu test tich hop, khong thay the model AI that.

### 8. Cau hinh bang bien moi truong

Backend ho tro:

```text
AI_SERVICE_URL
DB_PATH
```

Gia tri mac dinh:

```text
AI_SERVICE_URL=http://localhost:8001
DB_PATH=backend/storage/review_insight.sqlite
```

`UPLOAD_DIR` da co ham cau hinh du phong trong `Config.php`, nhung luong upload
hien tai doc truc tiep file tam do PHP tao va chua luu ban sao vao thu muc nay.

## File backend chinh

```text
backend/
|-- public/
|   |-- index.php
|   `-- dashboard.html
|-- src/
|   |-- AiServiceClient.php
|   |-- Config.php
|   |-- CsvReviewParser.php
|   |-- Database.php
|   |-- Response.php
|   `-- ReviewRepository.php
|-- tests/
|   `-- mock-ai-service.php
|-- examples/
|   `-- sample_reviews.csv
`-- storage/
    `-- review_insight.sqlite
```

## Yeu cau moi truong

- PHP 8.1 tro len.
- PHP extension `pdo_sqlite`.
- PHP extension `curl` duoc khuyen nghi, nhung backend co stream fallback.
- Python 3.10 tro len neu chay AI Service that.
- Cac Python package trong `ai-service/requirements.txt`.

Kiem tra nhanh:

```bash
php -v
php -m | grep -E "pdo_sqlite|curl"
python --version
```

## Huong dan chay voi AI Service that

Mo terminal thu nhat tai thu muc goc project:

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

Tren Windows, kich hoat moi truong bang:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

Kiem tra AI Service:

```bash
curl http://localhost:8001/health
```

Mo terminal thu hai tai thu muc goc project:

```bash
cd backend
php -S localhost:8080 -t public
```

Kiem tra toan bo backend:

```bash
curl http://localhost:8080/api/health
```

Mo dashboard:

```text
http://localhost:8080/dashboard.html
```

Chon file:

```text
backend/examples/sample_reviews.csv
```

Sau khi upload, backend se:

```text
Parse CSV
-> goi /analyze-reviews
-> luu SQLite
-> tra analytics va ket qua
-> cap nhat dashboard
```

## Huong dan chay nhanh bang mock AI Service

Mo terminal thu nhat:

```bash
cd backend
php -S localhost:8001 tests/mock-ai-service.php
```

Mo terminal thu hai:

```bash
cd backend
php -S localhost:8080 -t public
```

Sau do mo:

```text
http://localhost:8080/dashboard.html
```

Cach nay khong can Python, nhung output chi la du lieu mock.

## Lenh test API

Health check:

```bash
curl http://localhost:8080/api/health
```

Upload CSV:

```bash
curl -X POST http://localhost:8080/api/reviews/upload \
  -F "file=@backend/examples/sample_reviews.csv"
```

Neu dang dung terminal trong thu muc `backend`:

```bash
curl -X POST http://localhost:8080/api/reviews/upload \
  -F "file=@examples/sample_reviews.csv"
```

Phan tich mot review:

```bash
curl -X POST http://localhost:8080/api/reviews/analyze-single \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "manual-1",
    "product_id": "P001",
    "product_type": "phone",
    "rating": 1,
    "review_text": "Late delivery and broken item",
    "date": "2026-06-09"
  }'
```

Lay danh sach review:

```bash
curl "http://localhost:8080/api/reviews?limit=50"
```

Lay dashboard:

```bash
curl http://localhost:8080/api/dashboard
```

Lay chi tiet report:

```bash
curl http://localhost:8080/api/reports/1
```

## Chay voi cau hinh tuy chinh

Doi dia chi AI Service:

```bash
cd backend
AI_SERVICE_URL=http://localhost:9000 php -S localhost:8080 -t public
```

Doi file database:

```bash
cd backend
DB_PATH=/tmp/review_insight.sqlite php -S localhost:8080 -t public
```

## Ghi chu ve AI va LLM

- Backend PHP hien tai goi model sentiment va pipeline AI thong qua
  `/analyze-reviews` hoac `/analyze-single`.
- Insight trong luong upload CSV hien tai duoc tao bang template.
- OpenAI LLM da duoc chuan bi trong AI Service tai endpoint
  `/generate-insight`, nhung backend PHP chua goi endpoint nay.
- De dung LLM can cau hinh `OPENAI_API_KEY`, gui `use_llm=true` va tich hop
  response `llm_report` vao backend/dashboard.

## Ket qua

- Backend da ket noi duoc frontend voi Python AI Service.
- Da co luong upload CSV, phan tich mot review va luu lich su.
- Da co SQLite database va API phuc vu dashboard.
- Da co dashboard demo chay truc tiep bang PHP built-in server.
- Da co mock AI Service de test backend doc lap.
- He thong co the demo offline bang mock hoac chay full pipeline bang AI Service
  that.

## Han che hien tai

- Backend chua co authentication va authorization.
- Chua co gioi han kich thuoc file upload o tang ung dung.
- Chua co pagination day du cho danh sach review.
- Chua co migration versioning; schema hien duoc tao bang
  `CREATE TABLE IF NOT EXISTS`.
- LLM la tuy chon trong AI Service va chua nam trong luong upload cua backend.
- PHP built-in server chi phu hop phat trien va demo local.
