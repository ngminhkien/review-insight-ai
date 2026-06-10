import html
import re
from typing import Any, Dict, List

import pandas as pd

from .config import REQUIRED_COLUMNS


URL_PATTERN = re.compile(r"http\S+|www\S+")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
REPEATED_CHAR_PATTERN = re.compile(r"(.)\1{3,}")   # "sooooo" → "soo" (giữ 2)
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002700-\U000027BF"
    "\U000024C2-\U0001F251"
    "]+",
    flags=re.UNICODE,
)

# Từ cảm xúc mạnh → signal tốt cho positive/negative, giữ nguyên
# Không xoá negation (no, not, never, don't, etc.) vì rất quan trọng cho sentiment
_NEGATION_SAFE = True  # reminder: không xoá "not", "no", "never"

CONTRACTION_MAP: Dict[str, str] = {
    "don't": "do not",
    "dont": "do not",
    "can't": "cannot",
    "cant": "cannot",
    "won't": "will not",
    "wont": "will not",
    "shouldn't": "should not",
    "shouldnt": "should not",
    "couldn't": "could not",
    "couldnt": "could not",
    "wouldn't": "would not",
    "wouldnt": "would not",
    "wasn't": "was not",
    "wasnt": "was not",
    "weren't": "were not",
    "werent": "were not",
    "isn't": "is not",
    "isnt": "is not",
    "aren't": "are not",
    "arent": "are not",
    "haven't": "have not",
    "havent": "have not",
    "hasn't": "has not",
    "hasnt": "has not",
    "didn't": "did not",
    "didnt": "did not",
    "doesn't": "does not",
    "doesnt": "does not",
    "i'm": "i am",
    "im": "i am",
    "it's": "it is",
    "you're": "you are",
    "they're": "they are",
    "we're": "we are",
    "u": "you",
    "r": "are",
    "gr8": "great",
    "awsm": "awesome",
    "w/o": "without",
    "w/": "with",
    "k": "ok",
    "okay": "ok",
}

NEGATION_WORDS = {"not", "no", "never", "none", "without", "lack"}


def expand_contractions(text: str) -> str:
    """Expand common English contractions and slangs."""
    words = text.split()
    expanded = []
    for word in words:
        cleaned_word = word.lower().strip(".,!?\"'")
        expanded_word = CONTRACTION_MAP.get(cleaned_word, word)
        expanded.append(expanded_word)
    return " ".join(expanded)


def handle_negation(text: str) -> str:
    """
    Kết hợp từ phủ định với từ tiếp theo để tránh trích xuất đặc trưng rời rạc.
    Ví dụ: "not good" -> "not_good", "no issues" -> "no_issues"
    """
    words = text.split()
    new_words = []
    i = 0
    n = len(words)
    while i < n:
        word = words[i]
        if word in NEGATION_WORDS and i + 1 < n:
            next_word = words[i+1]
            new_words.append(f"{word}_{next_word}")
            i += 2
        else:
            new_words.append(word)
            i += 1
    return " ".join(new_words)


def remove_emoji(text: str) -> str:
    """Remove emoji; thay bằng khoảng trắng để không ghép từ liền nhau."""
    return EMOJI_PATTERN.sub(" ", text)


def remove_noise(text: str) -> str:
    """Remove URLs, HTML tags, entities. Giữ nguyên dấu câu cảm xúc (!, ?)."""
    text = html.unescape(text)
    text = URL_PATTERN.sub(" ", text)
    text = HTML_TAG_PATTERN.sub(" ", text)
    text = re.sub(r"&[a-zA-Z0-9#]+;", " ", text)
    text = text.replace("_x000D_", " ")
    return text


def normalize_repeated_chars(text: str) -> str:
    """
    Chuẩn hoá ký tự lặp: "loooove" → "loove", "!!!" → "!!"
    Giữ lại 2 ký tự để còn signal về cảm xúc mạnh.
    """
    return REPEATED_CHAR_PATTERN.sub(r"\1\1", text)


def extract_sentiment_signals(text: str) -> str:
    """
    Thêm pseudo-token từ các signal cảm xúc rõ ràng.
    Ví dụ: "!!!" → thêm "EXCLAIM_STRONG", "?" → thêm "QUESTION"
    Giúp model phân biệt neutral (ít signal) vs positive/negative (nhiều signal).
    """
    signals = []
    exclaim_count = text.count("!")
    question_count = text.count("?")

    if exclaim_count >= 3:
        signals.append("EXCLAIM_STRONG")
    elif exclaim_count >= 1:
        signals.append("EXCLAIM")

    if question_count >= 2:
        signals.append("QUESTION_MULTI")
    elif question_count >= 1:
        signals.append("QUESTION")

    # Detect all-caps words (thường là nhấn mạnh cảm xúc)
    caps_words = re.findall(r"\b[A-Z]{3,}\b", text)
    if caps_words:
        signals.append("CAPS_EMPHASIS")

    return text + (" " + " ".join(signals) if signals else "")


def remove_punctuation(text: str) -> str:
    """Remove punctuation, giữ letters/numbers/spaces."""
    return re.sub(r"[\W_]+", " ", text, flags=re.UNICODE)


def clean_text(text: Any, extract_signals: bool = True) -> str:
    """
    Clean raw review text cho ML.

    Quy trình:
    1. Lowercase & Expand Contractions
    2. Remove emoji
    3. Extract sentiment signals (trước khi xoá punctuation)
    4. Remove HTML/URL noise
    5. Normalize repeated chars
    6. Remove punctuation
    7. Normalize whitespace
    8. Negation handling
    """
    if text is None:
        return ""
    text = str(text).lower()
    text = expand_contractions(text)
    text = remove_emoji(text)

    # Extract signals TRƯỚC khi lowercase punctuation bị xoá
    # (signals cần "!" và "?" còn nguyên)
    original_for_signals = str(text)
    if extract_signals:
        text = extract_sentiment_signals(original_for_signals)

    text = remove_noise(text)
    text = normalize_repeated_chars(text)
    text = remove_punctuation(text)
    text = re.sub(r"\s+", " ", text).strip()
    
    text = handle_negation(text)
    return text


def normalize_rating(rating: Any) -> int:
    """Normalize rating → int [1, 5]."""
    try:
        value = int(float(rating))
    except (TypeError, ValueError):
        value = 3
    return max(1, min(5, value))


def rating_to_sentiment(rating: Any) -> str:
    """
    Convert star rating → sentiment label.

    Boundary cũ: ≤2=neg, 3=neutral, ≥4=pos
    Boundary mới: giữ nguyên vì đây là ground truth tự nhiên nhất.
    Vấn đề neutral F1 thấp không phải do boundary mà do class imbalance
    và đặc trưng ngôn ngữ mơ hồ của neutral — giải quyết trong model, không ở đây.
    """
    value = normalize_rating(rating)
    if value <= 2:
        return "negative"
    if value == 3:
        return "neutral"
    return "positive"


def validate_columns(df: pd.DataFrame) -> List[str]:
    """Return missing required columns."""
    return [col for col in REQUIRED_COLUMNS if col not in df.columns]


def validate_review(row: Dict[str, Any]) -> Dict[str, Any]:
    """Validate một review row."""
    errors = []
    review_text = str(row.get("review_text", "")).strip()
    if not review_text:
        errors.append("review_text is empty")
    if len(review_text) < 3:
        errors.append("review_text is too short")
    return {"is_valid": len(errors) == 0, "errors": errors}


def profile_reviews(df: pd.DataFrame) -> Dict[str, Any]:
    """Basic data-quality statistics."""
    key_subset = [c for c in ["review_id", "product_id", "review_text", "date"] if c in df.columns]

    rating_distribution: Dict[str, int] = {}
    rating_distribution_percent: Dict[str, float] = {}
    if "rating" in df.columns:
        rating_series = pd.to_numeric(df["rating"], errors="coerce")
        dist = rating_series.value_counts(dropna=False).sort_index()
        rating_distribution = {str(k): int(v) for k, v in dist.items()}
        total = max(int(dist.sum()), 1)
        rating_distribution_percent = {
            str(k): round((int(v) / total) * 100.0, 2) for k, v in dist.items()
        }

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "null_counts": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
        "duplicate_rows": int(df.duplicated().sum()),
        "duplicate_by_key": int(df.duplicated(subset=key_subset).sum()) if key_subset else 0,
        "rating_distribution": rating_distribution,
        "rating_distribution_percent": rating_distribution_percent,
    }


def preprocess_reviews(
    df: pd.DataFrame,
    min_text_length: int = 10,   # tăng từ 3 → 10: loại bỏ text quá ngắn không có signal
    extract_signals: bool = True,
) -> pd.DataFrame:
    """
    Preprocess review dataframe.

    Thay đổi so với version cũ:
    - min_text_length mặc định tăng lên 10 (3 quá ngắn, không có signal)
    - clean_text nhận thêm extract_signals flag
    - Thêm cột text_length để dùng trong analysis
    """
    df = df.copy()
    if "review_text" not in df.columns:
        raise ValueError("Missing required column: review_text")

    df["review_text"] = df["review_text"].fillna("").astype(str)
    df["clean_text"] = df["review_text"].apply(
        lambda t: clean_text(t, extract_signals=extract_signals)
    )
    df["text_length"] = df["clean_text"].str.split().str.len()

    df = df[df["clean_text"].str.len() >= max(1, int(min_text_length))]

    if "rating" in df.columns:
        df["rating"] = df["rating"].apply(normalize_rating)
    else:
        df["rating"] = 3

    df["sentiment"] = df["rating"].apply(rating_to_sentiment)
    df["label"] = df["sentiment"]  # backward compat

    subset = [c for c in ["review_id", "product_id", "review_text", "date"] if c in df.columns]
    df = df.drop_duplicates(subset=subset if subset else None, keep="first")
    df = df.reset_index(drop=True)
    return df