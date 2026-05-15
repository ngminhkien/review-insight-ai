from typing import Any, Dict, List


def generate_template_insights(stats: Dict[str, Any]) -> List[str]:
    """Generate simple business insights from analytics without LLM."""
    insights = []
    total = stats.get("total_reviews", 0)
    sentiment = stats.get("sentiment_distribution", {})
    negative = sentiment.get("negative", 0)
    positive = sentiment.get("positive", 0)

    if total > 0:
        negative_pct = round(negative * 100 / total, 2)
        positive_pct = round(positive * 100 / total, 2)
        insights.append(f"Ty le review tich cuc la {positive_pct}% tren tong {total} review.")
        insights.append(f"Ty le review tieu cuc la {negative_pct}% tren tong {total} review.")

    top_negative = stats.get("top_negative_aspects", [])
    if top_negative:
        top = top_negative[0]
        insights.append(
            f"Van de tieu cuc noi bat nhat la {top['aspect']}, chiem {top['percentage']}% trong nhom aspect tieu cuc."
        )

    top_positive = stats.get("top_positive_aspects", [])
    if top_positive:
        top = top_positive[0]
        insights.append(
            f"Diem manh duoc khach hang nhac den nhieu nhat la {top['aspect']}."
        )

    return insights


def generate_llm_prompt(stats: Dict[str, Any]) -> str:
    """Create prompt for external LLM API. This function does not call API yet."""
    return f"""
Ban la tro ly phan tich review san pham cho nguoi ban.
Hay dua ra insight ngan gon dua tren so lieu sau.
Khong bia them thong tin ngoai so lieu.

Du lieu thong ke:
{stats}

Yeu cau output:
- 3 insight quan trong
- 3 de xuat cai thien
- Viet bang tieng Viet, ngan gon, ro rang
""".strip()
