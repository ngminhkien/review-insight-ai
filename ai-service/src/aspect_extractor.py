from typing import Dict, List

ASPECT_KEYWORDS: Dict[str, List[str]] = {
    "delivery": ["ship", "shipping", "delivery", "late", "delay", "fast", "arrived"],
    "quality": ["quality", "broken", "durable", "material", "defect", "damaged"],
    "price": ["price", "expensive", "cheap", "value", "cost"],
    "packaging": ["package", "packaging", "box", "wrapped", "poor packaging"],
    "customer_service": ["support", "staff", "service", "response", "help", "customer"],
    "warranty": ["warranty", "return", "refund", "replace", "exchange"],
    "usability": ["easy", "hard", "use", "setup", "install", "interface"],
    "battery": ["battery", "charge", "charging", "drains"],
    "screen": ["screen", "display", "flickering"],
    "taste": ["taste", "delicious", "salty", "cold food", "food"],
    "skin": ["skin", "irritation", "oily", "fragrance"],
    "size": ["size", "fit", "wrong size"],
}

PRODUCT_TYPE_ASPECTS: Dict[str, List[str]] = {
    "phone": ["battery", "screen", "quality", "price", "delivery", "customer_service"],
    "food": ["taste", "delivery", "price", "customer_service"],
    "fashion": ["size", "quality", "price", "delivery", "customer_service"],
    "cosmetics": ["skin", "quality", "price", "delivery"],
    "general": ["delivery", "quality", "price", "packaging", "customer_service", "warranty", "usability"],
}


def detect_aspects(clean_text: str, product_type: str = "general") -> List[str]:
    """Detect aspects from text using keyword dictionary."""
    allowed = PRODUCT_TYPE_ASPECTS.get(product_type, PRODUCT_TYPE_ASPECTS["general"])
    detected = []
    text = clean_text.lower()
    for aspect in allowed:
        keywords = ASPECT_KEYWORDS.get(aspect, [])
        if any(keyword in text for keyword in keywords):
            detected.append(aspect)
    return detected or ["general"]
