import re
from typing import Dict, List

ASPECT_KEYWORDS: Dict[str, List[str]] = {
    "delivery": ["ship", "shipping", "delivery", "late", "delay", "fast", "arrived"],
    "quality": ["quality", "broken", "durable", "material", "defect", "damaged", "build"],
    "price": ["price", "expensive", "cheap", "value", "cost"],
    "packaging": ["package", "packaging", "box", "wrapped"],
    "customer_service": ["support", "staff", "service", "response", "help", "customer"],
    "warranty": ["warranty", "return", "refund", "replace", "exchange"],
    "usability": ["easy", "hard", "use", "setup", "install", "interface", "software"],
    "battery": ["battery", "charge", "charging", "drains", "power"],
    "screen": ["screen", "display", "flickering", "pixel", "touch", "brightness"],
    "performance": ["speed", "fast", "slow", "lag", "heat", "hot", "performance", "fps", "smooth"],
    "camera": ["camera", "photo", "video", "lens", "blur", "focus"],
    "audio": ["sound", "audio", "speaker", "volume", "bass", "mic", "microphone"],
    "connectivity": ["wifi", "bluetooth", "connection", "signal", "network", "drop", "disconnect"],
}

PRODUCT_TYPE_ASPECTS: Dict[str, List[str]] = {
    "phone": ["battery", "screen", "camera", "performance", "audio", "connectivity", "quality", "price", "customer_service", "delivery"],
    "laptop": ["battery", "screen", "performance", "audio", "connectivity", "usability", "quality", "price", "warranty", "customer_service"],
    "audio_device": ["audio", "battery", "connectivity", "quality", "price", "usability", "delivery"],
    "smartwatch": ["battery", "screen", "performance", "connectivity", "quality", "price", "usability"],
    "general": ["quality", "price", "delivery", "packaging", "customer_service", "warranty", "usability", "performance", "battery", "screen", "connectivity"],
}


def _keyword_matches(text: str, keyword: str) -> bool:
    pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
    return re.search(pattern, text) is not None


def detect_aspects(clean_text: str, product_type: str = "general") -> List[str]:
    """Detect aspects from text using keyword dictionary."""
    allowed = PRODUCT_TYPE_ASPECTS.get(product_type, PRODUCT_TYPE_ASPECTS["general"])
    detected = []
    text = clean_text.lower()
    for aspect in allowed:
        keywords = ASPECT_KEYWORDS.get(aspect, [])
        if any(_keyword_matches(text, keyword) for keyword in keywords):
            detected.append(aspect)
    return detected or ["general"]
