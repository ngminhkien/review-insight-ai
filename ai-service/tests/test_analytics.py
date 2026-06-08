from src.analytics import aggregate_statistics


def test_aggregate_statistics_counts_sentiment_and_negative_aspects():
    reviews = [
        {
            "product_id": "P001",
            "sentiment": "positive",
            "priority": "low",
            "aspects": ["quality"],
        },
        {
            "product_id": "P001",
            "sentiment": "positive",
            "priority": "low",
            "aspects": ["delivery"],
        },
        {
            "product_id": "P002",
            "sentiment": "negative",
            "priority": "high",
            "aspects": ["delivery", "quality"],
        },
        {
            "product_id": "P002",
            "sentiment": "negative",
            "priority": "medium",
            "aspects": ["delivery"],
        },
    ]

    stats = aggregate_statistics(reviews)

    assert stats["total_reviews"] == 4
    assert stats["positive"] == 2
    assert stats["negative"] == 2
    assert stats["top_negative_aspects"] == {
        "delivery": 2,
        "quality": 1,
    }
