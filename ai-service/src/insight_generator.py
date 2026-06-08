import json
import os
from typing import Any, Dict, List, Tuple


def _top_aspect(aspects: Any) -> Tuple[str | None, int]:
    if isinstance(aspects, dict) and aspects:
        aspect, count = next(iter(aspects.items()))
        return str(aspect), int(count)

    if isinstance(aspects, list) and aspects:
        first = aspects[0]
        if isinstance(first, dict):
            aspect = first.get("aspect")
            count = first.get("count", first.get("percentage", 0))
            return str(aspect), int(count or 0)
        return str(first), 0

    return None, 0


def _sentiment_counts(stats: Dict[str, Any]) -> Dict[str, int]:
    distribution = stats.get("sentiment_distribution") or {}
    return {
        "positive": int(stats.get("positive", distribution.get("positive", 0)) or 0),
        "neutral": int(stats.get("neutral", distribution.get("neutral", 0)) or 0),
        "negative": int(stats.get("negative", distribution.get("negative", 0)) or 0),
    }


def generate_template_insights(stats: Dict[str, Any]) -> List[str]:
    """Generate business insights from analytics without calling an LLM."""
    insights: List[str] = []
    total = int(stats.get("total_reviews", 0) or 0)
    counts = _sentiment_counts(stats)

    if total <= 0:
        return ["Chua co du lieu review de tao insight."]

    positive_pct = round(counts["positive"] * 100 / total, 2)
    negative_pct = round(counts["negative"] * 100 / total, 2)
    insights.append(f"Ty le review tich cuc la {positive_pct}% tren tong {total} review.")
    insights.append(f"Ty le review tieu cuc la {negative_pct}% tren tong {total} review.")

    top_negative, top_negative_count = _top_aspect(stats.get("top_negative_aspects"))
    if top_negative:
        insights.append(
            f"{top_negative.capitalize()} la van de tieu cuc lon nhat voi {top_negative_count} lan duoc nhac den."
        )

    top_positive, top_positive_count = _top_aspect(stats.get("top_positive_aspects"))
    if top_positive:
        insights.append(
            f"{top_positive.capitalize()} la diem manh noi bat voi {top_positive_count} lan duoc nhac den trong review tich cuc."
        )

    return insights


def generate_template_summary(stats: Dict[str, Any]) -> str:
    counts = _sentiment_counts(stats)
    total = int(stats.get("total_reviews", 0) or 0)
    top_negative, _ = _top_aspect(stats.get("top_negative_aspects"))

    if total <= 0:
        return "Chua co du lieu review de tong hop."

    if top_negative:
        return (
            f"He thong da phan tich {total} review: {counts['positive']} tich cuc, "
            f"{counts['neutral']} trung tinh, {counts['negative']} tieu cuc. "
            f"Van de can uu tien xu ly la {top_negative}."
        )

    return (
        f"He thong da phan tich {total} review: {counts['positive']} tich cuc, "
        f"{counts['neutral']} trung tinh, {counts['negative']} tieu cuc."
    )


def generate_executive_report(stats: Dict[str, Any], recommendations: List[str]) -> str:
    insights = generate_template_insights(stats)
    lines = ["Executive report:", "Summary:", f"- {generate_template_summary(stats)}", "Key insights:"]
    lines.extend(f"- {item}" for item in insights)
    lines.append("Recommendations:")
    lines.extend(f"- {item}" for item in recommendations)
    return "\n".join(lines)


def generate_llm_prompt(stats: Dict[str, Any]) -> str:
    """Create prompt for external LLM API."""
    return f"""
Ban la tro ly phan tich review san pham cho nguoi ban.
Chi dua ra nhan dinh dua tren so lieu duoc cung cap, khong bia them du lieu.

Du lieu thong ke:
{json.dumps(stats, ensure_ascii=False, indent=2)}

Hay viet bang tieng Viet:
1. Summary ngan gon cho quan ly.
2. 3 insight business quan trong.
3. 3 recommendation hanh dong.
4. Executive report ngan gon.
""".strip()


def generate_llm_business_report(
    stats: Dict[str, Any],
    model: str = "gpt-4.1",
) -> Dict[str, Any]:
    """
    Generate insight report with OpenAI Responses API when OPENAI_API_KEY is set.

    The project still works without an API key because template-based insights are
    the default implementation for demo and local testing.
    """
    if not os.getenv("OPENAI_API_KEY"):
        return {
            "enabled": False,
            "provider": "openai",
            "reason": "OPENAI_API_KEY is not set",
            "prompt": generate_llm_prompt(stats),
        }

    from openai import OpenAI

    client = OpenAI()
    response = client.responses.create(
        model=model,
        input=generate_llm_prompt(stats),
    )
    return {
        "enabled": True,
        "provider": "openai",
        "model": model,
        "report": response.output_text,
    }
