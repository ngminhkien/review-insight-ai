from typing import Any, Dict, List

RECOMMENDATION_RULES = {
    "delivery": "Kiem tra lai doi tac van chuyen, thoi gian giao hang va quy trinh cap nhat trang thai don hang.",
    "packaging": "Cai thien vat lieu dong goi, them buoc QC truoc khi giao hang va giam rui ro san pham bi hong.",
    "quality": "Kiem tra lai quy trinh QC, nha cung cap va cac lo san pham bi khach hang phan anh.",
    "price": "Danh gia lai chien luoc gia, uu dai va cach truyen thong gia tri san pham.",
    "customer_service": "Tang toc do phan hoi, dao tao nhan vien CSKH va chuan hoa quy trinh xu ly khieu nai.",
    "warranty": "Lam ro chinh sach bao hanh, doi tra va hoan tien de giam bat man cua khach hang.",
    "usability": "Cai thien huong dan su dung, onboarding va tai lieu ho tro nguoi dung.",
}


def generate_recommendations(stats: Dict[str, Any]) -> List[str]:
    """Generate recommendations from top negative aspects."""
    recommendations = []
    top_negative = stats.get("top_negative_aspects", {})
    if isinstance(top_negative, dict):
        aspects = list(top_negative.keys())[:5]
    else:
        aspects = [item.get("aspect") for item in top_negative[:5] if isinstance(item, dict)]

    for aspect in aspects:
        rule = RECOMMENDATION_RULES.get(aspect)
        if rule:
            recommendations.append(rule)
    if not recommendations:
        recommendations.append("Tiep tuc theo doi review moi va uu tien xu ly cac review co priority high.")
    return recommendations
