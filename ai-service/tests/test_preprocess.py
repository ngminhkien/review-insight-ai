from src.preprocess import clean_text, normalize_rating, rating_to_sentiment


def test_clean_text_basic():
    assert clean_text("Poor packaging!!!") == "poor packaging"


def test_normalize_rating():
    assert normalize_rating(10) == 5
    assert normalize_rating(0) == 1
    assert normalize_rating("bad") == 3


def test_rating_to_sentiment():
    assert rating_to_sentiment(1) == "negative"
    assert rating_to_sentiment(3) == "neutral"
    assert rating_to_sentiment(5) == "positive"
