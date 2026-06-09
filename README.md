# Review Insight AI

Review Insight AI la du an demo he thong AI phan tich review san pham.

Muc tieu cua du an:

- Upload file review dang CSV.
- Lam sach va chuan hoa review text.
- Du doan sentiment: positive, neutral, negative.
- Phat hien aspect: delivery, quality, price, packaging, customer_service, warranty, usability.
- Danh gia priority: low, medium, high.
- Tong hop thong ke phuc vu dashboard.
- Sinh insight va recommendation cho nguoi ban.

> Ghi chu: Repo nay la starter template de nhom bat dau lam viec. Code chua can chay hoan hao ngay tu dau.

## Kien truc tong quan

```text
Frontend React
    -> Backend PHP
        -> AI Service Python FastAPI
            -> Preprocessing
            -> Sentiment Model
            -> Aspect Extraction
            -> Analytics
            -> Insight + Recommendation
```

## Cau truc folder

```text
review-insight-ai/
├── ai-service/          # Phan AI xu ly review
├── backend/             # Backend PHP bridge giua frontend va AI service
├── frontend/            # Tai lieu goi y cho frontend React
├── data/                # Du lieu mau
├── docs/                # Tai lieu, API contract, phan cong, worklog
├── notebooks/           # Notebook EDA/train thu nghiem
├── scripts/             # Script ho tro
└── README.md
```

## Cach chay tong quan

1. Chay AI service truoc.
2. Backend se goi API cua AI service.
3. Frontend se goi API cua backend.

Chay frontend, backend va Python AI service cung luc tu thu muc goc:

```bash
./scripts/dev.sh
```

Script tu dong cai dependency con thieu trong lan chay dau. Neu chi can mock AI:

```bash
AI_MODE=mock ./scripts/dev.sh
```

Chi tiet xem:

- `ai-service/README.md`
- `backend/README.md`
- `frontend/README.md`
- `docs/team_plan.md`
- `docs/api_contract.md`

## Luong xu ly AI

```text
CSV reviews
  -> validate columns
  -> preprocessing
  -> sentiment prediction
  -> aspect extraction
  -> priority detection
  -> analytics aggregation
  -> insight generation
  -> recommendation
  -> JSON response
```

## Nguon du lieu CSV demo

File CSV nen co cac cot:

```csv
review_id,product_id,product_type,rating,review_text,date
1,P001,phone,5,"Good quality and fast delivery",2024-01-02
2,P001,phone,1,"Poor packaging and broken item",2024-01-03
```

## Phan cong nhanh

- Person 1: AI Lead + API Integration
- Person 2: Data + Preprocessing
- Person 3: Sentiment Model
- Person 4: Aspect + Priority
- Person 5: Analytics + Insight + Recommendation

Xem chi tiet tai `docs/team_plan.md`.
