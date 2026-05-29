# Worklog - Person 2 Data + Preprocessing

## Giai doan 2 - Data Preprocessing Plan (Toi uu cho multi-domain)

### 1) Muc tieu

- Lam sach du lieu de model hoc tot va giam nhieu.
- Chuan hoa pipeline de tai su dung cho nhieu domain (electronics, books, ...).
- Tao output on dinh cho train va API.

### 2) Input/Output chuan

- Input: `data/domains/<domain>/raw_reviews_<source>.csv`
- Required columns: `review_id,product_id,rating,review_text,date`
- Output:
- `data/domains/<domain>/processed_reviews_<source>.csv`
- Cot bat buoc sau preprocess: `review_id,product_id,rating,review_text,clean_text,date,sentiment`

### 3) Ke hoach thuc hien

#### Buoc 2.1 - Doc du lieu va Data Quality Check (pandas)

1. Doc CSV bang `pandas.read_csv()`.
2. In thong ke:

- So dong, so cot.
- So luong null theo cot.
- So duplicate theo 2 muc:
- Duplicate toan dong.
- Duplicate theo khoa: `review_id + product_id + review_text + date`.
- Phan bo `rating` (count + percent).

3. Rule xu ly:

- Null `review_text`: loai bo.
- Null `rating`: gan mac dinh `3` (neutral) hoac loai bo neu ty le null cao (quyet dinh theo report).
- Duplicate: giu ban ghi dau tien.

4. Luu report thong ke (de review nhanh):

- Goi y tao file `data/domains/<domain>/quality_report_<source>.json`.

#### Buoc 2.2 - Clean text trong `ai-service/src/preprocess.py`

Can cap nhat `clean_text()` theo thu tu sau:

1. Lowercase.
2. Remove emoji.
3. Remove URL/HTML tags/noise (`<br>`, html entities, ky tu la).
4. Remove punctuation.
5. Normalize spaces (mot khoang trang, trim dau/cuoi).

Goi y ham nho nen co:

- `remove_emoji(text)`
- `remove_noise(text)` cho URL/HTML/entities.
- `clean_text(text)` goi tong hop cac buoc tren.

#### Buoc 2.3 - Convert sentiment

1. Dung `rating_to_sentiment()`:

- `1-2 -> negative`
- `3 -> neutral`
- `4-5 -> positive`

2. Tao cot `sentiment` trong dataframe da clean.
3. Validate output:

- Chi cho phep 3 nhan: `positive|neutral|negative`.
- Khong de trong `clean_text` va `sentiment`.

### 4) Acceptance criteria (Done definition)

- File processed co day du cot: `review_id,product_id,rating,review_text,clean_text,date,sentiment`.
- 100% `rating` nam trong [1..5].
- 100% `sentiment` hop le theo rule.
- `clean_text` khong con emoji, punctuation, nhieu khoang trang lien tiep.
- Da co report thong ke data quality cho moi file input.

### 5) Thu tu uu tien toi uu

1. Chot schema + validation (de tranh sua nguoc ve sau).
2. Hoan thien `clean_text()` va unit test nho.
3. Chay preprocess tren 1 domain (electronics) de chot logic.
4. Dong goi thanh ham tai su dung cho domain moi.

### 6) Test nhanh bat buoc

- Case 1: `"Poor packaging [emoji]"` -> `clean_text="poor packaging"`, `sentiment="negative"`.
- Case 2: Text co URL + HTML -> URL/HTML bi xoa dung.
- Case 3: Rating null/0/6 -> duoc normalize ve [1..5].
- Case 4: Dong duplicate -> bi loai dung rule.

### 7) Cong viec ngay tiep theo (task list)

- [ ] Cap nhat `ai-service/src/preprocess.py` theo Buoc 2.2.
- [ ] Them ham profile data (row/null/dup/rating distribution).
- [ ] Chay preprocess cho `data/domains/electronics/raw_reviews_amazon_pc.csv`.
- [ ] Xuat `processed_reviews_amazon_pc.csv` + report quality.
- [ ] Cap nhat lai worklog ket qua, metric, van de gap.

## Ngay 2

Da lam:

- Tao file raw tu TSV: `data/domains/electronics/raw_reviews_amazon_us.csv` (schema chuan).
- Chay preprocess (Giai doan 2) cho dataset \_us va xuat report.
- Them log khi chay `preprocess_dataset.py` (theo nhuom cau hinh local).
- Chon phuong an A: dung dataset \_us cho train, don dep file \_pc de tranh nham.

Ket qua:

- Report \_us: 3,091,203 rows truoc, 3,091,170 rows sau preprocess.
- Rating distribution (after): 1=357,853; 2=179,034; 3=238,391; 4=536,417; 5=1,779,475.
- Sentiment distribution: positive=2,315,892; neutral=238,391; negative=536,887.

File da cap nhat/tao:

- `data/domains/electronics/raw_reviews_amazon_us.csv`
- `data/domains/electronics/processed_reviews_amazon_us.csv`
- `data/domains/electronics/quality_report_amazon_us.json`
- `scripts/prepare_electronics_tsv.py`

Van de gap:

- 24 dong co `date` null (giu lai, can theo doi neu can loc).
- File raw \_us lon, can can nhac sampling khi train.

Viec tiep theo:

- Chot file train dau vao (raw \_us hoac sample theo ty le).
- Chay train baseline (TF-IDF + Logistic Regression) va xuat model/report.
