# Worklog - Person 4 Aspect + Priority

## Ngay 1 (Giai doan 5 - Aspect extraction)

Da lam:

- Doc lai trang thai du an hien tai qua `README.md`, `docs/team_plan.md`, `docs/api_contract.md`, `ai-service/src/pipeline.py`, `ai-service/src/api.py` va module aspect hien co.
- Xac dinh aspect extraction trong project duoc thiet ke theo rule-based keyword matching, khong can train model moi.
- Giu nguyen sentiment inference trong pipeline dung model da train tai `ai-service/models/sentiment_model.pkl`.
- Define cac aspect chinh theo yeu cau va theo project: `delivery`, `quality`, `price`, `packaging`, `customer_service`.
- Giu them cac aspect domain-aware da co san cho phone/food/fashion/cosmetics nhu `battery`, `screen`, `taste`, `skin`, `size`.
- Hoan thien keyword matching trong `ai-service/src/aspect_extractor.py` bang regex word-boundary de giam match nham substring.
- Them endpoint rieng `POST /extract-aspects` de test giai doan 5 truc tiep bang text moi, khong can goi full pipeline sentiment/aspect/priority.
- Endpoint moi nhan `text` va optional `product_type`, sau do clean text bang `clean_text()` va goi `detect_aspects()`.
- Them test cho input mau `"Late delivery and broken item"` tra ve `["delivery", "quality"]`.
- Cap nhat `docs/api_contract.md` va `ai-service/README.md` de nhom/backend biet cach goi endpoint moi.

Define aspects:

```text
delivery
quality
price
packaging
customer_service
```

Vi du keyword:

```python
delivery = ["ship", "shipping", "delivery", "late", "delay", "fast", "arrived"]
quality = ["quality", "broken", "durable", "material", "defect", "damaged"]
price = ["price", "expensive", "cheap", "value", "cost"]
packaging = ["package", "packaging", "box", "wrapped", "poor packaging"]
customer_service = ["support", "staff", "service", "response", "help", "customer"]
```

Input mau:

```text
Late delivery and broken item
```

Output mau:

```json
["delivery", "quality"]
```

Ket qua:

- Giai doan 5 da co core function `detect_aspects(clean_text, product_type="general")`.
- API rieng cho aspect extraction da co: `POST /extract-aspects`.
- Full pipeline `/analyze-single` va `/analyze-batch` van tra field `aspects` nhu truoc, dong thoi sentiment van lay tu model da train.
- Cau mau `"Late delivery and broken item"` detect duoc `delivery` do keyword `late/delivery`, va `quality` do keyword `broken`.

File da sua:

- `ai-service/src/aspect_extractor.py`
- `ai-service/src/api.py`
- `ai-service/tests/test_aspect.py`
- `ai-service/tests/test_api_aspect.py`
- `docs/api_contract.md`
- `ai-service/README.md`
- `docs/worklog/person4_aspect_priority.md`

Kiem thu:

- Da them unit test core aspect: `test_detect_delivery_and_quality_from_sample_input`.
- Da them API test: `test_extract_aspects_endpoint_returns_detected_aspects`.
- Da chay compile check va pass: `py -m py_compile src\aspect_extractor.py src\api.py tests\test_aspect.py tests\test_api_aspect.py`.
- Da chay smoke test truc tiep core aspect va pass:

```powershell
py -c "from src.aspect_extractor import detect_aspects; print(detect_aspects('late delivery and broken item', product_type='general'))"
```

Ket qua:

```text
['delivery', 'quality']
```

- Co the test truc tiep tren terminal, khong can Swagger:

```powershell
cd "D:\AI BTL\review-insight-ai\ai-service"
.\.venv\Scripts\activate
python -c "from src.preprocess import clean_text; from src.aspect_extractor import detect_aspects; text=clean_text('Late delivery and broken item'); print(detect_aspects(text, product_type='general'))"
```

Ket qua mong doi:

```text
['delivery', 'quality']
```

- Chua chay duoc test co `clean_text()`/API trong Python hien tai vi moi truong dang thieu dependency `pandas`, `fastapi`, `pytest`.

Van de gap:

- Keyword matching de hieu va de demo, nhung co the miss cac cach dien dat khac neu keyword chua du.
- Aspect extraction hien tai la rule-based, khong phai ML model. Cach nay phu hop voi yeu cau giai doan 5 va khong anh huong model sentiment da train.

Viec tiep theo:

- Mo rong keyword theo data that trong `data/sample_reviews.csv` va `data/domains/electronics/electronics_seed_train.csv`.
- Neu can do uu tien issue, tiep tuc sang phase priority detection dua tren sentiment + aspects + rating.

## Ngay 2 (Giai doan 6 - Priority detection)

Da lam:

- Doc lai luong project hien tai: `/analyze-single` va `/analyze-batch` dang chay theo thu tu preprocess -> sentiment model da train -> aspect extraction -> priority detection.
- Xac dinh yeu cau giai doan 6 la detect review nghiem trong, khong phai train model moi.
- Giu sentiment inference dung model da train trong `ai-service/models/sentiment_model.pkl` thong qua `predict_sentiment()`.
- Hoan thien rule priority trong `ai-service/src/priority.py`.
- Define keyword nghiem trong cho high priority: `broken`, `refund`, `scam`, `fraud`, `fake`, `damaged`, `defect`, `unsafe`, `dangerous`, `not working`, `return`, `replacement`.
- Define keyword trung binh cho medium priority: `late`, `delay`, `slow`, `poor`, `bad`, `issue`, `problem`, `support`, `warranty`, `expensive`.
- Logic chinh: sentiment `negative` + keyword nghiem trong hoac rating rat thap => `high`.
- Them endpoint rieng `POST /detect-priority` de test Stage 6 truc tiep.
- Endpoint moi co the nhan san `sentiment` va `aspects`, hoac tu goi model sentiment da train va aspect extractor neu client khong truyen.
- Them unit test cho rule priority va API test cho output `{ "priority": "high" }`.
- Cap nhat `docs/api_contract.md` va `ai-service/README.md`.

Logic mau:

```text
negative + broken/refund/scam = high priority
```

Input mau:

```json
{
  "text": "Late delivery and broken item",
  "sentiment": "negative",
  "rating": 1,
  "aspects": ["delivery", "quality"]
}
```

Output mau:

```json
{
  "priority": "high"
}
```

Ket qua:

- Da co core function `detect_priority(clean_text, sentiment, rating, aspects)`.
- Da co endpoint `POST /detect-priority`.
- Full pipeline van dung model sentiment da train truoc khi detect priority.
- Review negative co keyword `broken/refund/scam` duoc gan `high`.
- Review negative khong co keyword nghiem trong duoc gan `medium`.
- Review positive/neutral khong co dau hieu rui ro duoc gan `low`.

File da sua:

- `ai-service/src/priority.py`
- `ai-service/src/api.py`
- `ai-service/tests/test_priority.py`
- `ai-service/tests/test_api_priority.py`
- `docs/api_contract.md`
- `ai-service/README.md`
- `docs/worklog/person4_aspect_priority.md`

Kiem thu:

- Them unit test:
  - `test_negative_broken_review_is_high_priority`
  - `test_negative_refund_review_is_high_priority`
  - `test_positive_review_is_low_priority`
- Them API test:
  - `test_detect_priority_endpoint_returns_high_priority`
- Da chay compile check va pass: `py -m py_compile src\priority.py src\api.py tests\test_priority.py tests\test_api_priority.py`.
- Da chay smoke test truc tiep Stage 6 va pass:

```powershell
py -c "from src.priority import detect_priority; print({'priority': detect_priority('late delivery and broken item', sentiment='negative', rating=1, aspects=['delivery','quality'])})"
```

Ket qua:

```text
{'priority': 'high'}
```

- Da test them mot so cau:

```text
need refund this product is a scam -> {'priority': 'high'}
delivery was late and support was slow -> {'priority': 'high'}
good quality and fast delivery -> {'priority': 'low'}
```

- Co the test truc tiep tren terminal, khong can Swagger:

```powershell
cd "D:\AI BTL\review-insight-ai\ai-service"
py -c "from src.priority import detect_priority; print({'priority': detect_priority('late delivery and broken item', sentiment='negative', rating=1, aspects=['delivery','quality'])})"
```

Ket qua mong doi:

```text
{'priority': 'high'}
```

Van de gap:

- Priority hien tai la rule-based nen de giai thich va phu hop demo, nhung phu thuoc vao keyword list.
- Can cai dependency trong virtualenv neu muon chay test API day du bang `pytest`.

Viec tiep theo:

- Mo rong keyword priority theo loi review that trong data.
- Test full pipeline `/analyze-single` sau khi cai dependency day du de dam bao sentiment model -> aspect -> priority chay lien mach.
