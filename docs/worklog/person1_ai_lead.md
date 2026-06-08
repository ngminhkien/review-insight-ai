# Worklog - Person 1 AI Lead + API Integration

## Ngay 1 (Giai doan 9 - AI Service API)

Da lam:

- Doc yeu cau giai doan 9: expose AI thanh service rieng bang FastAPI.
- Kiem tra kien truc project hien tai: Backend se goi AI Service Python FastAPI va nhan JSON response.
- Giu endpoint `GET /health` de backend/monitor kiem tra service con song.
- Giu endpoint `POST /analyze-single` de phan tich mot review.
- Them endpoint `POST /analyze-reviews` theo dung yeu cau docs de phan tich nhieu review.
- Giu endpoint cu `POST /analyze-batch` de tuong thich nguoc voi code/docs da co truoc do.
- Endpoint `/analyze-reviews` goi lai pipeline `analyze_batch_reviews()` nen van chay du luong:
  - preprocess text
  - sentiment model da train
  - aspect extraction
  - priority detection
  - analytics engine
  - insight generation
  - recommendation
- Cap nhat `docs/api_contract.md` de backend biet request/response JSON.
- Cap nhat `ai-service/README.md` de liet ke endpoint chinh.
- Them API tests cho `/health`, `/analyze-single`, `/analyze-reviews`.

Kien truc:

```text
Backend
-> goi AI Service FastAPI
-> nhan JSON
-> tra ve dashboard/frontend
```

Endpoint chinh:

```text
GET /health
POST /analyze-single
POST /analyze-reviews
```

Input mau `/analyze-reviews`:

```json
{
  "reviews": [
    {
      "review_id": "1",
      "product_id": "P001",
      "product_type": "general",
      "rating": 1,
      "review_text": "Late delivery and broken item",
      "date": "2024-01-03"
    }
  ]
}
```

Output mau:

```json
{
  "results": [
    {
      "review_id": "1",
      "sentiment": "negative",
      "aspects": ["delivery", "quality"],
      "priority": "high"
    }
  ],
  "analytics": {
    "total_reviews": 1,
    "negative": 1
  },
  "insights": [],
  "recommendations": []
}
```

Ket qua:

- AI Service da co endpoint dung yeu cau giai doan 9.
- Backend co the goi `/analyze-single` hoac `/analyze-reviews` va nhan JSON.
- `/analyze-batch` van con de khong lam hong cac test/script cu.

File da sua:

- `ai-service/src/api.py`
- `ai-service/tests/test_api_service.py`
- `docs/api_contract.md`
- `ai-service/README.md`
- `docs/worklog/person1_ai_lead.md`

Kiem thu:

- Them test:
  - `test_health_endpoint`
  - `test_analyze_single_endpoint`
  - `test_analyze_reviews_endpoint`
- Da chay compile check va pass: `py -m py_compile src\api.py tests\test_api_service.py`.
- Da import FastAPI app bang Python trong `.venv` va xac nhan co du route:

```text
['/health', '/analyze-single', '/analyze-reviews']
```

- Co the test truc tiep health tren terminal sau khi chay service:

```powershell
cd "D:\AI BTL\review-insight-ai\ai-service"
.\.venv\Scripts\activate
uvicorn src.api:app --reload --port 8001
```

Terminal khac:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/health"
```

Test `/analyze-reviews`:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8001/analyze-reviews" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"reviews":[{"review_id":"1","product_id":"P001","product_type":"general","rating":1,"review_text":"Late delivery and broken item","date":"2024-01-03"}]}'
```

Van de gap:

- `/analyze-reviews` chay full pipeline nen can dependency Python va file model sentiment da train.
- Neu model `.pkl` khong load duoc, endpoint full analysis se loi o buoc sentiment model.

Viec tiep theo:

- Chay service local va test request tu Backend.
- Neu backend dang goi `/analyze-batch`, co the doi sang `/analyze-reviews` theo docs moi hoac giu endpoint cu.
