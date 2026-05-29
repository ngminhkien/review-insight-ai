import pandas as pd

from src.preprocess import clean_text, normalize_rating, preprocess_reviews, rating_to_sentiment


def test_clean_text_basic():
    assert clean_text("Poor packaging!!!") == "poor packaging"


def test_clean_text_remove_emoji_noise_and_spaces():
    raw = "Poor packaging 😡  <br />  https://example.com  "
    assert clean_text(raw) == "poor packaging"


def test_normalize_rating():
    assert normalize_rating(10) == 5
    assert normalize_rating(0) == 1
    assert normalize_rating("bad") == 3


def test_rating_to_sentiment():
    assert rating_to_sentiment(1) == "negative"
    assert rating_to_sentiment(3) == "neutral"
    assert rating_to_sentiment(5) == "positive"


def test_preprocess_reviews_add_sentiment_and_drop_duplicates():
    df = pd.DataFrame(
        [
            {
                "review_id": "1",
                "product_id": "P1",
                "rating": 5,
                "review_text": "Great quality!!!",
                "date": "2024-01-01",
            },
            {
                "review_id": "1",
                "product_id": "P1",
                "rating": 5,
                "review_text": "Great quality!!!",
                "date": "2024-01-01",
            },
            {
                "review_id": "2",
                "product_id": "P2",
                "rating": 1,
                "review_text": "Poor packaging 😡",
                "date": "2024-01-02",
            },
        ]
    )

    out = preprocess_reviews(df)
    assert len(out) == 2
    assert "clean_text" in out.columns
    assert "sentiment" in out.columns
    assert "label" in out.columns
    assert set(out["sentiment"].tolist()) == {"positive", "negative"}
