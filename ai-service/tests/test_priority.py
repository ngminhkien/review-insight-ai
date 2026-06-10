from src.priority import detect_priority


def test_negative_broken_review_is_high_priority():
    priority = detect_priority(
        "late delivery and broken item",
        sentiment="negative",
        rating=1,
        aspects=["delivery", "quality"],
    )

    assert priority == "high"


def test_negative_refund_review_is_high_priority():
    priority = detect_priority(
        "need refund this product is a scam",
        sentiment="negative",
        rating=1,
        aspects=["warranty"],
    )

    assert priority == "high"


def test_positive_review_is_low_priority():
    priority = detect_priority(
        "good quality and fast delivery",
        sentiment="positive",
        rating=5,
        aspects=["quality", "delivery"],
    )

    assert priority == "low"
