from collections import Counter
from typing import List, Dict, Any, Optional
from pathlib import Path

from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
import joblib
import re
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.utils.class_weight import compute_sample_weight
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from .config import SENTIMENT_MODEL_PATH, TFIDF_VECTORIZER_PATH


MODEL_CHOICES = ["logreg", "nb", "svm"]

# Neutral class thường dùng ngôn ngữ mơ hồ, ngắn → cần thêm char n-gram
# để bắt signal hình thức (câu ngắn, ít tính từ, v.v.)
_TFIDF_WORD = dict(
    max_features=30_000,
    ngram_range=(1, 3),
    min_df=2,
    max_df=0.95,
    sublinear_tf=True,        # log(1+tf) — giảm ảnh hưởng của từ rất phổ biến
    analyzer="word",
    strip_accents="unicode",
)

_TFIDF_CHAR = dict(
    max_features=20_000,
    ngram_range=(3, 5),
    min_df=3,
    max_df=0.95,
    sublinear_tf=True,
    analyzer="char_wb",        # char n-gram trong word boundary — tốt cho neutral
    strip_accents="unicode",
)


def _build_tfidf_stack() -> tuple:
    """
    Trả về (word_tfidf, char_tfidf).
    Kết hợp word + char n-gram bằng FeatureUnion bên ngoài.
    """
    return TfidfVectorizer(**_TFIDF_WORD), TfidfVectorizer(**_TFIDF_CHAR)


def _build_classifier(model_name: str, calibrate: bool = False):
    """
    Build classifier. SVM được wrap bằng CalibratedClassifierCV để có predict_proba.
    calibrate=True force calibration cho tất cả model (hữu ích khi đánh giá confidence).
    """
    if model_name == "logreg":
        clf = LogisticRegression(
            max_iter=2000,
            C=1.0,
            class_weight="balanced",
            solver="lbfgs",
        )
        return CalibratedClassifierCV(clf, cv=3) if calibrate else clf

    if model_name == "nb":
        # MultinomialNB không hỗ trợ class_weight → bù bằng sample_weight khi fit
        return MultinomialNB(alpha=0.5)

    if model_name == "svm":
        base = LinearSVC(
            class_weight="balanced",
            C=0.5,              # regularisation mạnh hơn mặc định (1.0) → ít overfit neutral
            max_iter=3000,
            dual=True,
        )
        # CalibratedClassifierCV giúp SVM có predict_proba + softens decision boundary
        return CalibratedClassifierCV(base, cv=3, method="sigmoid")

    raise ValueError(f"Unsupported model: {model_name}")


def build_pipeline(
    model_name: str = "logreg",
    use_char_ngram: bool = True,
    calibrate: bool = False,
) -> Pipeline:
    """
    Build TF-IDF + classifier pipeline.

    use_char_ngram=True: kết hợp word + char n-gram qua FeatureUnion.
    Char n-gram đặc biệt hữu ích cho neutral vì bắt được pattern hình thức
    (câu ngắn, ít dấu câu cảm xúc).
    """
    from sklearn.pipeline import FeatureUnion

    clf = _build_classifier(model_name, calibrate=calibrate)

    if use_char_ngram and model_name != "nb":
        # FeatureUnion nối hai vector TF-IDF
        features = FeatureUnion([
            ("word", TfidfVectorizer(**_TFIDF_WORD)),
            ("char", TfidfVectorizer(**_TFIDF_CHAR)),
        ])
        return Pipeline([
            ("features", features),
            ("clf", clf),
        ])
    else:
        # NB cần non-negative → chỉ dùng word TF-IDF, không char
        return Pipeline([
            ("tfidf", TfidfVectorizer(**_TFIDF_WORD)),
            ("clf", clf),
        ])


def _compute_neutral_weight_boost(
    y_train: List[str],
    neutral_boost: float = 2.0,
) -> np.ndarray:
    """
    Tính sample_weight với neutral được boost thêm neutral_boost lần
    so với balanced weight chuẩn.

    Thay vì chỉ dùng compute_sample_weight("balanced"), ta tăng thêm
    weight cho neutral để model chú ý hơn tới class khó này.
    """
    weights = compute_sample_weight(class_weight="balanced", y=y_train)
    y_arr = np.array(y_train)
    neutral_mask = y_arr == "neutral"
    weights[neutral_mask] *= neutral_boost
    # Re-normalize để tổng weight không thay đổi quá nhiều
    weights = weights / weights.mean()
    return weights


def _smote_resample(
    x_train: List[str],
    y_train: List[str],
    random_state: int = 42,
) -> tuple:
    """
    Dùng SMOTE trên TF-IDF features để tạo synthetic samples cho neutral.
    SMOTE tốt hơn RandomOverSampler vì tạo điểm mới thay vì duplicate.

    Lưu ý: SMOTE trên text cần vectorize trước, nên ta tách bước này
    ra ngoài pipeline chính.
    """
    from imblearn.over_sampling import SMOTE

    counts = Counter(y_train)
    neutral_count = counts.get("neutral", 0)
    if neutral_count == 0:
        return x_train, y_train

    majority = max(v for k, v in counts.items() if k != "neutral")
    # Chỉ SMOTE nếu neutral < 80% của majority (tránh over-balance)
    if neutral_count >= int(majority * 0.8):
        return x_train, y_train

    # Vectorize tạm để SMOTE hoạt động trên feature space
    temp_vec = TfidfVectorizer(max_features=10_000, ngram_range=(1, 2), sublinear_tf=True)
    x_vec = temp_vec.fit_transform(x_train)

    target_neutral = min(int(majority * 0.7), neutral_count * 4)
    smote = SMOTE(
        sampling_strategy={"neutral": target_neutral},
        random_state=random_state,
        k_neighbors=min(5, neutral_count - 1),
    )
    try:
        x_res, y_res = smote.fit_resample(x_vec, y_train)
    except ValueError:
        # Fallback nếu SMOTE không đủ neighbors
        return x_train, y_train

    # Inverse transform: SMOTE trên TF-IDF không có inverse_transform thực sự,
    # nên ta dùng chiến lược khác: lấy n gần nhất và ghép text
    # Đây là heuristic — synthetic samples là average của neighbors trong feature space
    # Ta dùng kết quả SMOTE dưới dạng "pseudo-texts" qua trick sau:
    from sklearn.metrics.pairwise import cosine_similarity

    original_vec = x_vec.toarray()
    smote_samples = x_res.toarray()[len(x_train):]  # chỉ lấy synthetic

    synthetic_texts = []
    x_arr = np.array(x_train)
    neutral_indices = np.where(np.array(y_train) == "neutral")[0]
    neutral_vecs = original_vec[neutral_indices]

    for sv in smote_samples:
        sims = cosine_similarity(sv.reshape(1, -1), neutral_vecs)[0]
        top2 = neutral_indices[np.argsort(sims)[-2:]]
        # Ghép 2 text neutral gần nhất → synthetic text đơn giản
        combined = x_arr[top2[0]] + " " + x_arr[top2[1]]
        synthetic_texts.append(combined)

    x_new = list(x_train) + synthetic_texts
    y_new = list(y_train) + ["neutral"] * len(synthetic_texts)
    return x_new, y_new

def handle_negation(texts):
    print("-> Đang xử lý ghép từ phủ định (English Negation Handling)...")
    
    # Danh sách các từ phủ định phổ biến trong tiếng Anh
    negation_words = r"\b(not|never|no|cannot|can't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|won't|wouldn't)\s+(\w+)\b"
    
    processed_texts = []
    for text in texts:
        text = str(text).lower()
        # Nối từ: "not good" -> "not_good", "doesn't work" -> "doesn't_work"
        text_with_negation = re.sub(negation_words, r'\1_\2', text)
        processed_texts.append(text_with_negation)
        
    return processed_texts


def train_model(texts, labels, use_char_ngram=True, neutral_boost=2.0, **kwargs):
    #Gọi hàm nối từ phủ định ngay đầu tiên
    texts = handle_negation(texts)
    print("\n1. Khởi tạo TfidfVectorizer (Bộ não ngôn ngữ sắc bén)...")
    analyzer = 'char_wb' if use_char_ngram else 'word'
    vectorizer = TfidfVectorizer(
        analyzer=analyzer, 
        ngram_range=(1, 3), 
        max_features=25000  # Giới hạn 25.000 cụm từ quan trọng nhất để chống tràn RAM
    )
    
    print("2. Chuyển đổi văn bản thành Ma trận thưa (Rất nhẹ RAM)...")
    # Biến 1.1 triệu câu thành ma trận toán học cực kỳ nhanh
    X_train = vectorizer.fit_transform(texts)
    
    print("3. Khởi tạo thuật toán LinearSVC (Chuẩn xác cao)...")
    # Thay vì SMOTE, ta tăng nhẹ trọng số Neutral lên gấp đôi là đủ
    class_weight = {'positive': 1.0, 'negative': 1.0, 'neutral': float(neutral_boost)}
    model = LinearSVC(class_weight=class_weight, random_state=42, max_iter=2000)
    
    print("4. Đang huấn luyện mô hình (Sẽ mất khoảng 1-3 phút)...")
    model.fit(X_train, labels)
    
    print("5. Đang đánh giá mô hình và lưu biểu đồ...")
    y_pred = model.predict(X_train)
    report = classification_report(labels, y_pred, output_dict=True)
    report["accuracy_score"] = report["accuracy"]
    report["confusion_matrix"] = confusion_matrix(labels, y_pred).tolist()
    
    return {
        "vectorizer": vectorizer,
        "model": model,
        "report": report
    }


def cross_validate_model(
    texts: List[str],
    labels: List[str],
    model_name: str = "logreg",
    n_splits: int = 5,
    use_char_ngram: bool = True,
    neutral_weight_boost: float = 2.5,
) -> Dict[str, Any]:
    """
    Stratified K-Fold cross-validation để đánh giá ổn định hơn.
    Trả về mean ± std của accuracy và neutral F1.
    """
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    texts_arr = np.array(texts, dtype=object)
    labels_arr = np.array(labels)

    fold_results = []
    for fold, (train_idx, test_idx) in enumerate(skf.split(texts_arr, labels_arr)):
        x_tr = texts_arr[train_idx].tolist()
        y_tr = labels_arr[train_idx].tolist()
        x_te = texts_arr[test_idx].tolist()
        y_te = labels_arr[test_idx].tolist()

        model = build_pipeline(model_name=model_name, use_char_ngram=use_char_ngram)
        fit_params: Dict[str, Any] = {}
        if model_name != "nb" and "neutral" in set(y_tr):
            fit_params["clf__sample_weight"] = _compute_neutral_weight_boost(
                y_tr, neutral_boost=neutral_weight_boost
            )

        model.fit(x_tr, y_tr, **fit_params)
        y_pred = model.predict(x_te)

        rep = classification_report(y_te, y_pred, output_dict=True, zero_division=0)
        neutral_f1 = rep.get("neutral", {}).get("f1-score", 0.0)
        fold_results.append({
            "fold": fold + 1,
            "accuracy": accuracy_score(y_te, y_pred),
            "neutral_f1": neutral_f1,
        })

    accs = [r["accuracy"] for r in fold_results]
    n_f1s = [r["neutral_f1"] for r in fold_results]
    return {
        "fold_results": fold_results,
        "accuracy_mean": float(np.mean(accs)),
        "accuracy_std": float(np.std(accs)),
        "neutral_f1_mean": float(np.mean(n_f1s)),
        "neutral_f1_std": float(np.std(n_f1s)),
    }


def save_model(model: Pipeline, model_path: Optional[Path] = None) -> None:
    """Save whole pipeline. Lưu thêm vectorizer riêng nếu cần."""
    m_path = model_path or SENTIMENT_MODEL_PATH
    m_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, m_path)
    
    # Xác định đường dẫn vectorizer dựa trên m_path
    v_path = m_path.parent / (m_path.stem.replace("model", "vectorizer") + ".pkl")
    
    # Với FeatureUnion pipeline, lưu cả hai vectorizer
    if "features" in model.named_steps:
        fu = model.named_steps["features"]
        for name, transformer in fu.transformer_list:
            path = v_path.with_stem(f"{v_path.stem}_{name}")
            joblib.dump(transformer, path)
    elif "tfidf" in model.named_steps:
        joblib.dump(model.named_steps["tfidf"], v_path)


_MODEL_CACHE = None

def load_model() -> Pipeline:
    """Load trained model."""
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
        
    if not SENTIMENT_MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {SENTIMENT_MODEL_PATH}")
    _MODEL_CACHE = joblib.load(SENTIMENT_MODEL_PATH)
    return _MODEL_CACHE


def predict_sentiment(texts: List[str]) -> List[Dict[str, Any]]:
    """Predict sentiment cho list texts đã clean."""
    model = load_model()
    preds = model.predict(texts)

    confidences: List[Optional[float]] = [None] * len(texts)
    clf = model.named_steps.get("clf")
    if clf is not None and hasattr(clf, "predict_proba"):
        proba = model.predict_proba(texts)
        confidences = np.max(proba, axis=1).tolist()

    return [
        {
            "sentiment": str(pred),
            "confidence": None if conf is None else round(float(conf), 4),
        }
        for pred, conf in zip(preds, confidences)
    ]