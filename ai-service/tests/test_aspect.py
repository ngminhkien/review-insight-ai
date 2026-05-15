from src.aspect_extractor import detect_aspects


def test_detect_delivery():
    aspects = detect_aspects("late delivery and slow shipping", product_type="general")
    assert "delivery" in aspects


def test_detect_phone_battery():
    aspects = detect_aspects("battery drains quickly", product_type="phone")
    assert "battery" in aspects
