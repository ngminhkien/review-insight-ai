# Worklog - Person 3 Sentiment Model

## Ngay 1

Da lam:

- Train tren raw_us (200k rows) voi 3 model: nb, svm, logreg.
- Luu report so sanh, chot logreg la model chinh.

Ket qua:

- NB: acc=0.9031, macro_f1=0.7400.
- SVM: acc=0.9107, macro_f1=0.7879.
- LogReg: acc=0.8799, macro_f1=0.7627 (model duoc luu).

File da sua:

- `ai-service/src/train_sentiment.py`
- `ai-service/src/sentiment_model.py`

Van de gap:

- Neutral class kho hoc (precision thap, recall cao).

Viec tiep theo:

- Thu can bang class hoac sampling neu can.
- Tich hop model vao pipeline predict.

## Ngay 2

Da lam:

- Them class_weight balance (NB dung sample_weight), retrain 200k rows.
- So sanh SVM vs LogReg sau balance, luu report rieng.

Ket qua:

- NB balanced: acc=0.8098, neutral_f1=0.4099.
- SVM balanced: acc=0.9107, neutral_f1=0.5501.
- LogReg balanced: acc=0.8799, neutral_f1=0.5071.
- Chon SVM tot hon LogReg.

File da sua:

- `ai-service/src/sentiment_model.py`
- `ai-service/src/train_sentiment.py`

Van de gap:

- Neutral F1 < 0.65, can bo sung data rating=3 (oversample/bo sung data).

Viec tiep theo:

- Bo sung neutral data va retrain.
- Co the train full dataset bang cach bo `--max-rows`.

## Ngay 3

Da lam:

- Them RandomOverSampler cho neutral, retrain SVM (200k rows).
- Thu chay full dataset SVM (khong max-rows).

Ket qua:

- SVM over neutral: acc=0.8756, neutral_f1=0.4962 (chua dat 0.60-0.65).
- Full dataset: chua co report (can thoi gian/nguon luc lon hon de chay xong).

File da sua:

- `ai-service/src/sentiment_model.py`
- `ai-service/src/train_sentiment.py`
- `ai-service/requirements.txt`

Van de gap:

- Neutral F1 van < 0.65 du da oversample.
- Train full dataset chua hoan tat (report chua sinh ra).

Viec tiep theo:

- Bo sung data neutral rating=3 neu can.
- Chay full dataset tren may manh hon hoac chay qua dem.

## Ngay 4

Da lam:

- Train tren balanced dataset (svm, char_ngram=False, neutral_boost=2.5).

Ket qua:

- Class distribution: positive=499,836 (43.9%), negative=399,907 (35.1%), neutral=238,298 (20.9%).
- Accuracy=0.7732.
- negative: P=0.937 R=0.674 F1=0.784.
- neutral: P=0.486 R=0.896 F1=0.630.
- positive: P=0.966 R=0.794 F1=0.872.
- Neutral F1=0.6299 (gan target 0.60-0.65).

Van de gap:

- Neutral F1 chua vuot 0.65.

Viec tiep theo:

- Thu tang `--neutral-boost` len 3.0 hoac `--oversample-neutral`.
- Neu chua tot hon, bo sung them neutral rating=3.

## Ngay 5

Da lam:

- Chay full dataset SVM tren file `data/domains/electronics/raw_reviews_amazon_us.csv`.
- Cap nhat script `scripts/train_full_svm.cmd` va luu report vao `ai-service/reports/classification_report_svm_full.json`.

Ket qua:

- Accuracy=0.8663.
- neutral: P=0.3461, R=0.8452, F1=0.4911.
- negative: P=0.8975, R=0.7931, F1=0.8421.
- positive: P=0.9917, R=0.8837, F1=0.9346.
- Class distribution train: positive=613,196, negative=129,474, neutral=56,731.

File da sua:

- `scripts/train_full_svm.cmd`
- `ai-service/reports/classification_report_svm_full.json`

Van de gap:

- Neutral F1 con thap 0.4911 tren full dataset.
- Model hien tai van gap can bang neutral de cai thien precision/recall cua nhom neutral.

Viec tiep theo:

- Thu `--neutral-boost` len 3.0 hoac ap dung `--oversample-neutral` tren full dataset.
- Xem xet bo sung du lieu neutral hoac tinh lai class weight de nang cao neutral F1.
