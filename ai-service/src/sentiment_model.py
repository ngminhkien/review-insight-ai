from typing import List, Dict, Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from .config import SENTIMENT_MODEL_PATH, TFIDF_VECTORIZER_PATH


def build_pipeline() -> Pipeline:
    """Build baseline TF-IDF + Logistic Regression pipeline."""
    return Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )


def train_model(texts: List[str], labels: List[str]) -> Dict[str, Any]:
    """Train baseline sentiment classifier and return evaluation report."""
    if len(set(labels)) < 2:
        raise ValueError("Need at least 2 sentiment classes to train model")

    x_train, x_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels if len(set(labels)) > 1 else None
    )

    model = build_pipeline()
    model.fit(x_train, y_train)
    y_pred = model.predict(x_test)

    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    report["accuracy_score"] = accuracy_score(y_test, y_pred)
    report["confusion_matrix"] = confusion_matrix(y_test, y_pred).tolist()

    save_model(model)
    return {"model": model, "report": report}


def save_model(model: Pipeline) -> None:
    """Save whole pipeline and also vectorizer separately if needed."""
    SENTIMENT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, SENTIMENT_MODEL_PATH)
    if "tfidf" in model.named_steps:
        joblib.dump(model.named_steps["tfidf"], TFIDF_VECTORIZER_PATH)


def load_model() -> Pipeline:
    """Load trained model. Fallback model is not trained, so train first for real use."""
    if not SENTIMENT_MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {SENTIMENT_MODEL_PATH}")
    return joblib.load(SENTIMENT_MODEL_PATH)


def predict_sentiment(texts: List[str]) -> List[Dict[str, Any]]:
    """Predict sentiment for a list of cleaned texts."""
    model = load_model()
    preds = model.predict(texts)

    confidences = []
    if hasattr(model.named_steps.get("clf"), "predict_proba"):
        proba = model.predict_proba(texts)
        confidences = np.max(proba, axis=1).tolist()
    else:
        confidences = [None] * len(texts)

    return [
        {"sentiment": str(pred), "confidence": None if conf is None else round(float(conf), 4)}
        for pred, conf in zip(preds, confidences)
    ]
