# Team Plan - AI Processing Only

Nhom co 5 nguoi, chi tap trung phan AI Processing Service. Frontend va Backend se lam rieng sau.

## Person 1 - AI Lead + API Integration

Phu trach:

- Thiet ke JSON input/output.
- Tao FastAPI skeleton.
- Ghep cac module preprocess, sentiment, aspect, analytics vao API.
- Lam endpoint cho Backend goi.
- Review code va merge PR.
- Viet README tong cho ai-service.

File chinh:

- `ai-service/src/api.py`
- `ai-service/src/pipeline.py`
- `docs/api_contract.md`

Deliverables:

- API chay duoc local.
- Endpoint `/health`, `/analyze-single`, `/analyze-batch`.
- Output JSON on dinh cho Backend.

## Person 2 - Data + Preprocessing

Phu trach:

- Validate CSV.
- Lam sach review text.
- Chuan hoa rating.
- Bo review rong/qua ngan.
- Convert rating thanh label sentiment de train baseline.

File chinh:

- `ai-service/src/preprocess.py`
- `data/sample_reviews.csv`

Deliverables:

- Ham `clean_text()`.
- Ham `preprocess_reviews()`.
- Bao cao cac cot CSV can co.

## Person 3 - Sentiment Model

Phu trach:

- Train TF-IDF + Logistic Regression.
- Luu model.
- Tao classification report.
- Neu kip, so sanh Naive Bayes/SVM/BERT.

File chinh:

- `ai-service/src/sentiment_model.py`
- `ai-service/src/train_sentiment.py`
- `ai-service/reports/`
- `ai-service/models/`

Deliverables:

- `sentiment_model.pkl`.
- `classification_report.json`.
- Metric: accuracy, precision, recall, F1-score.

## Person 4 - Aspect Extraction + Priority

Phu trach:

- Xay keyword dictionary theo aspect.
- Them aspect theo product_type.
- Detect aspect trong review.
- Detect priority low/medium/high.

File chinh:

- `ai-service/src/aspect_extractor.py`
- `ai-service/src/priority.py`

Deliverables:

- Output aspects cho moi review.
- Priority rule ro rang.

## Person 5 - Analytics + Insight + Recommendation

Phu trach:

- Tong hop sentiment distribution.
- Top negative aspects.
- Top positive aspects.
- Product comparison.
- Sinh insight bang template.
- Sinh recommendation theo rule.
- Neu kip, tao prompt cho LLM API.

File chinh:

- `ai-service/src/analytics.py`
- `ai-service/src/insight_generator.py`
- `ai-service/src/recommendation.py`

Deliverables:

- JSON analytics cho dashboard.
- Insight text.
- Recommendation text.

## Quy tac lam viec

- Khong code truc tiep vao `main`.
- Moi nguoi tao branch rieng.
- Moi task tao Pull Request.
- Moi PR can co mo ta: da lam gi, test nhu the nao, file nao bi sua.
- Moi nguoi cap nhat worklog sau moi ngay lam viec.

## Branch goi y

```text
main
├── ai-lead-api
├── data-preprocessing
├── sentiment-model
├── aspect-priority
└── analytics-insight
```
