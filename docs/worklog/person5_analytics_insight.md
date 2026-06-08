# Worklog - Person 5 Analytics + Insight

## Ngay 1 (Giai doan 7 - Analytics engine)

Da lam:

- Doc yeu cau giai doan 7: bien tung review da phan tich thanh so lieu tong hop.
- Xac dinh input cua analytics engine la list review da co `sentiment`, `priority`, `aspects`, `product_id`.
- Tao lai module `ai-service/src/analytics.py` voi ham chinh `aggregate_statistics(reviews)`.
- Engine tinh `total_reviews`, so luong `positive`, `neutral`, `negative`.
- Engine tao `sentiment_distribution` de dashboard doc theo object.
- Engine tao `priority_distribution` gom `high`, `medium`, `low`.
- Engine dem `top_negative_aspects` bang cach chi lay aspect trong review co sentiment `negative`.
- Engine dem `top_positive_aspects` bang cach chi lay aspect trong review co sentiment `positive`.
- Engine tao `product_sentiments` de so sanh sentiment theo tung product.
- Giu output tuong thich voi pipeline hien tai: `/analyze-batch` van goi `aggregate_statistics()` va tra ve analytics.
- Them endpoint rieng `POST /aggregate-analytics` de test truc tiep analytics ma khong can chay model sentiment.
- Them unit test cho case tong hop sentiment va top negative aspects.
- Cap nhat `docs/api_contract.md` va `ai-service/README.md`.

Ket qua:

- Da co analytics engine cho dashboard.
- Input la cac review da duoc xu ly qua sentiment/aspect/priority.
- Output co dang ngan gon theo yeu cau:

```json
{
  "total_reviews": 3,
  "positive": 1,
  "negative": 2,
  "top_negative_aspects": {
    "delivery": 2,
    "quality": 1
  }
}
```

- Output day du con co them `neutral`, `sentiment_distribution`, `priority_distribution`, `top_positive_aspects`, `product_sentiments`.

File da sua:

- `ai-service/src/analytics.py`
- `ai-service/src/api.py`
- `ai-service/tests/test_analytics.py`
- `docs/api_contract.md`
- `ai-service/README.md`
- `docs/worklog/person5_analytics_insight.md`

Kiem thu:

- Da them unit test `test_aggregate_statistics_counts_sentiment_and_negative_aspects`.
- Da chay compile check va pass: `py -m py_compile src\analytics.py src\api.py tests\test_analytics.py`.
- Da chay smoke test truc tiep Stage 7 va pass.
- Co the test truc tiep tren terminal:

```powershell
cd "D:\AI BTL\review-insight-ai\ai-service"
py -c "from src.analytics import aggregate_statistics; reviews=[{'product_id':'P001','sentiment':'positive','priority':'low','aspects':['quality']},{'product_id':'P002','sentiment':'negative','priority':'high','aspects':['delivery','quality']},{'product_id':'P002','sentiment':'negative','priority':'medium','aspects':['delivery']}]; print(aggregate_statistics(reviews))"
```

Ket qua thuc te:

```text
{'total_reviews': 3, 'positive': 1, 'neutral': 0, 'negative': 2, 'sentiment_distribution': {'positive': 1, 'neutral': 0, 'negative': 2}, 'priority_distribution': {'high': 1, 'medium': 1, 'low': 1}, 'top_negative_aspects': {'delivery': 2, 'quality': 1}, 'top_positive_aspects': {'quality': 1}, 'product_sentiments': {'P001': {'positive': 1, 'neutral': 0, 'negative': 0}, 'P002': {'positive': 0, 'neutral': 0, 'negative': 2}}}
```

Van de gap:

- Analytics phu thuoc vao review da duoc gan sentiment/aspect/priority dung o cac giai doan truoc.
- Can cai dependency day du neu muon chay test API bang `pytest`.

Viec tiep theo:

- Chay test terminal va pytest sau khi moi truong Python co dependency.
- Ket hop analytics voi insight/recommendation o giai doan tiep theo.

## Ngay 2 (Giai doan 8 - Insight generation)

Da lam:

- Doc yeu cau giai doan 8: bien analytics thanh business insight.
- Kiem tra module hien co `ai-service/src/insight_generator.py` va `ai-service/src/recommendation.py`.
- Phat hien insight template cu dang doc `top_negative_aspects` theo dang list dict, trong khi analytics engine giai doan 7 tra ve dict.
- Sua insight generator de tuong thich voi analytics moi va van chiu duoc format cu.
- Hoan thien Version 1 template-based, khong can API key:
  - Tao summary ngan gon cho quan ly.
  - Tao danh sach insight business.
  - Neu aspect tieu cuc lon nhat la delivery, sinh cau: `Delivery la van de tieu cuc lon nhat...`
  - Tao executive report gom summary, key insights, recommendations.
- Sua recommendation generator de doc `top_negative_aspects` dang dict.
- Them Version 2 optional dung OpenAI LLM API:
  - Ham `generate_llm_prompt(stats)` tao prompt dua tren analytics.
  - Ham `generate_llm_business_report(stats, model="gpt-4.1")` chi goi OpenAI khi co `OPENAI_API_KEY`.
  - Neu chua co API key, he thong khong loi ma tra `enabled=false` va prompt mau.
- Cap nhat endpoint `POST /generate-insight` de tra `summary`, `insights`, `recommendations`, `executive_report`, `llm_report`.
- Cap nhat `docs/api_contract.md`.
- Them unit test cho insight template, summary, executive report.

Ket qua:

- Version 1 template-based chay duoc offline, phu hop demo.
- Version 2 LLM-ready da co san cau truc, chi can cau hinh `OPENAI_API_KEY` de goi OpenAI.
- Endpoint insight khong phu thuoc vao model sentiment; no nhan analytics tu giai doan 7.

Input mau:

```json
{
  "analytics": {
    "total_reviews": 3,
    "positive": 1,
    "neutral": 0,
    "negative": 2,
    "top_negative_aspects": {
      "delivery": 2,
      "quality": 1
    }
  },
  "use_llm": false
}
```

Output mau:

```json
{
  "summary": "He thong da phan tich 3 review: 1 tich cuc, 0 trung tinh, 2 tieu cuc. Van de can uu tien xu ly la delivery.",
  "insights": [
    "Ty le review tich cuc la 33.33% tren tong 3 review.",
    "Ty le review tieu cuc la 66.67% tren tong 3 review.",
    "Delivery la van de tieu cuc lon nhat voi 2 lan duoc nhac den."
  ],
  "recommendations": [
    "Kiem tra lai doi tac van chuyen, thoi gian giao hang va quy trinh cap nhat trang thai don hang."
  ],
  "executive_report": "Executive report: ...",
  "llm_report": null
}
```

File da sua:

- `ai-service/src/insight_generator.py`
- `ai-service/src/recommendation.py`
- `ai-service/src/api.py`
- `ai-service/tests/test_insight_generator.py`
- `docs/api_contract.md`
- `docs/worklog/person5_analytics_insight.md`

Kiem thu:

- Them unit test:
  - `test_template_insights_identify_top_negative_aspect`
  - `test_template_summary_and_report_are_generated`
- Da chay compile check va pass: `py -m py_compile src\insight_generator.py src\recommendation.py src\api.py tests\test_insight_generator.py`.
- Da chay smoke test truc tiep Stage 8 va pass.
- Co the test truc tiep tren terminal:

```powershell
cd "D:\AI BTL\review-insight-ai\ai-service"
py -c "from src.insight_generator import generate_template_insights, generate_template_summary; from src.recommendation import generate_recommendations; stats={'total_reviews':3,'positive':1,'neutral':0,'negative':2,'top_negative_aspects':{'delivery':2,'quality':1},'top_positive_aspects':{'quality':1}}; print(generate_template_summary(stats)); print(generate_template_insights(stats)); print(generate_recommendations(stats))"
```

Ket qua thuc te:

```text
He thong da phan tich 3 review: 1 tich cuc, 0 trung tinh, 2 tieu cuc. Van de can uu tien xu ly la delivery.
['Ty le review tich cuc la 33.33% tren tong 3 review.', 'Ty le review tieu cuc la 66.67% tren tong 3 review.', 'Delivery la van de tieu cuc lon nhat voi 2 lan duoc nhac den.', 'Quality la diem manh noi bat voi 1 lan duoc nhac den trong review tich cuc.']
['Kiem tra lai doi tac van chuyen, thoi gian giao hang va quy trinh cap nhat trang thai don hang.', 'Kiem tra lai quy trinh QC, nha cung cap va cac lo san pham bi khach hang phan anh.']
```

Van de gap:

- LLM API can `OPENAI_API_KEY` trong environment va package `openai`.
- Template-based insight tot cho demo, nhung chua linh hoat bang LLM khi can executive report dai hon.

Viec tiep theo:

- Chay smoke test terminal.
- Neu demo co API key, test `use_llm=true`; neu khong, dung template-based la du on dinh.

## Ngay 3 (Giai doan 9 - AI Service API)

Da lam:

- Tiep tuc theo yeu cau giai doan 9: expose AI thanh service rieng bang FastAPI.
- Ghi nhan kien truc tich hop: Backend goi AI Service API va nhan JSON de tra ve dashboard/frontend.
- Giu endpoint `GET /health` de kiem tra service con song.
- Giu endpoint `POST /analyze-single` de phan tich mot review.
- Them endpoint `POST /analyze-reviews` theo dung ten endpoint trong yeu cau docs.
- Giu lai endpoint cu `POST /analyze-batch` de tuong thich nguoc voi code/docs da co.
- Endpoint `/analyze-reviews` goi chung pipeline `analyze_batch_reviews()` nen van gom day du:
  - sentiment model da train
  - aspect extraction
  - priority detection
  - analytics engine
  - insight generation
  - recommendation
- Cap nhat `docs/api_contract.md` va `ai-service/README.md`.
- Them API tests cho `/health`, `/analyze-single`, `/analyze-reviews`.

Endpoint chinh:

```text
GET /health
POST /analyze-single
POST /analyze-reviews
```

Kien truc:

```text
Backend
-> goi AI API
-> nhan JSON
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

Ket qua:

- AI Service da expose endpoint dung yeu cau.
- Backend co the goi `/analyze-single` cho 1 review hoac `/analyze-reviews` cho nhieu review.
- JSON response gom `results`, `analytics`, `insights`, `recommendations`.

File da sua:

- `ai-service/src/api.py`
- `ai-service/tests/test_api_service.py`
- `docs/api_contract.md`
- `ai-service/README.md`
- `docs/worklog/person1_ai_lead.md`
- `docs/worklog/person5_analytics_insight.md`

Kiem thu:

- Da chay compile check va pass: `py -m py_compile src\api.py tests\test_api_service.py`.
- Da import FastAPI app bang Python trong `.venv` va xac nhan co du route:

```text
['/health', '/analyze-single', '/analyze-reviews']
```

Lenh test terminal:

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
- Neu backend da tich hop endpoint cu `/analyze-batch`, co the doi sang `/analyze-reviews` hoac giu ca hai.

Viec tiep theo:

- Chay service local va test request that tu Backend.
- Neu demo can nhanh, test `/health` truoc roi test `/analyze-reviews`.
