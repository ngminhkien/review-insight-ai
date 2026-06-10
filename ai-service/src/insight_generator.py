import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError


load_dotenv(Path(__file__).resolve().parents[2] / ".env")
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class ProductAssessment(BaseModel):
    product_id: str
    product_type: str | None = None
    overview: str
    strengths: List[str] = Field(default_factory=list)
    issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class ProductAdvice(BaseModel):
    executive_summary: str
    key_findings: List[str] = Field(default_factory=list)
    product_assessments: List[ProductAssessment] = Field(default_factory=list)
    priority_actions: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class GeminiResponseError(RuntimeError):
    pass


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


def build_llm_context(
    stats: Dict[str, Any],
    reviews: List[Dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    reviews = reviews or []
    product_stats: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {
            "product_type": "general",
            "total_reviews": 0,
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "priority": {"high": 0, "medium": 0, "low": 0},
            "aspects": defaultdict(int),
            "representative_reviews": [],
        }
    )

    for review in reviews:
        product_id = str(review.get("product_id") or "unknown")
        product = product_stats[product_id]
        product["product_type"] = str(review.get("product_type") or "general")
        product["total_reviews"] += 1

        sentiment = str(review.get("sentiment") or "neutral")
        if sentiment in product["sentiment"]:
            product["sentiment"][sentiment] += 1

        priority = str(review.get("priority") or "low")
        if priority in product["priority"]:
            product["priority"][priority] += 1

        for aspect in review.get("aspects") or []:
            product["aspects"][str(aspect)] += 1

        examples = product["representative_reviews"]
        should_include = len(examples) < 8 or priority == "high"
        if should_include and len(examples) < 12:
            examples.append(
                {
                    "rating": review.get("rating"),
                    "review_text": str(review.get("review_text") or "")[:500],
                    "sentiment": sentiment,
                    "confidence": review.get("confidence"),
                    "aspects": review.get("aspects") or [],
                    "priority": priority,
                }
            )

    products = []
    for product_id, product in product_stats.items():
        product["aspects"] = dict(
            sorted(product["aspects"].items(), key=lambda item: item[1], reverse=True)
        )
        products.append({"product_id": product_id, **product})

    return {
        "analytics": stats,
        "products": products,
        "review_sample_policy": (
            "Moi san pham chi gui toi da 12 review dai dien, uu tien review high priority."
        ),
    }


def generate_llm_prompt(context: Dict[str, Any]) -> str:
    """Create an outcome-focused prompt for product review analysis."""
    return f"""
Muc tieu: dua ra nhan xet va de xuat hanh dong cho tung san pham dua tren ket qua
phan tich tho cua model sentiment/aspect/priority.

Yeu cau:
- Viet bang tieng Viet ro rang, phu hop cho quan ly san pham.
- Chi su dung du lieu duoc cung cap. Khong bia them doanh thu, khach hang hay nguyen nhan.
- Phan biet diem manh, van de va de xuat cho tung product_id.
- Uu tien van de co priority high, sentiment negative va aspect lap lai.
- De xuat phai cu the, co the hanh dong va gan voi bang chung trong du lieu.
- Neu mau review nho hoac thieu du lieu, ghi ro trong limitations.

Du lieu:
{json.dumps(context, ensure_ascii=False, indent=2)}
""".strip()


def _request_gemini_advice(
    api_key: str,
    model: str,
    prompt: str,
) -> ProductAdvice:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "Ban la chuyen gia product analytics. Hay bien ket qua model "
                    "phan tich review thanh nhan xet va de xuat co bang chung."
                ),
                response_mime_type="application/json",
                response_schema=ProductAdvice,
                temperature=0.2,
            ),
        )

        try:
            if isinstance(response.parsed, ProductAdvice):
                return response.parsed
            if response.parsed is not None:
                return ProductAdvice.model_validate(response.parsed)
            if response.text:
                return ProductAdvice.model_validate_json(response.text)
        except ValidationError as exc:
            raise GeminiResponseError(
                "Gemini returned data that does not match the product advice schema."
            ) from exc

        raise GeminiResponseError(
            "Gemini did not return a structured product advice response."
        )
    finally:
        client.close()


def _gemini_error_response(model: str, exc: Exception) -> Dict[str, Any]:
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    try:
        status_code = int(status_code) if status_code is not None else None
    except (TypeError, ValueError):
        status_code = None

    if status_code in {401, 403}:
        reason = "GEMINI_API_KEY khong hop le, bi thu hoi hoac khong co quyen truy cap."
        error_code = "authentication_error"
    elif status_code == 404:
        reason = f"Model {model} khong ton tai hoac API key khong co quyen truy cap."
        error_code = "model_not_found"
    elif status_code == 429:
        reason = "Gemini API da vuot quota hoac dang gioi han toc do. Hay thu lai sau."
        error_code = "rate_limit"
    elif status_code == 400:
        reason = "Gemini API tu choi request. Hay kiem tra model va du lieu dau vao."
        error_code = "bad_request"
    elif status_code is not None and status_code >= 500:
        reason = "Gemini API dang tam thoi gian doan. Hay thu lai sau."
        error_code = "service_error"
    else:
        reason = "Khong the ket noi toi Gemini API. Hay kiem tra Internet va thu lai."
        error_code = "connection_error"

    return {
        "enabled": False,
        "provider": "google",
        "model": model,
        "reason": reason,
        "error_code": error_code,
    }


def generate_llm_business_report(
    stats: Dict[str, Any],
    reviews: List[Dict[str, Any]] | None = None,
    model: str | None = None,
) -> Dict[str, Any]:
    """
    Generate an insight report with Gemini when GEMINI_API_KEY is set.

    The project still works without an API key because template-based insights are
    the default implementation for demo and local testing.
    """
    context = build_llm_context(stats, reviews)
    selected_model = model or os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "enabled": False,
            "provider": "google",
            "reason": "GEMINI_API_KEY is not set",
            "model": selected_model,
        }

    try:
        advice = _request_gemini_advice(
            api_key=api_key,
            model=selected_model,
            prompt=generate_llm_prompt(context),
        )
    except ImportError:
        return {
            "enabled": False,
            "provider": "google",
            "model": selected_model,
            "reason": "Chua cai package google-genai cho AI service.",
            "error_code": "dependency_error",
        }
    except GeminiResponseError:
        return {
            "enabled": False,
            "provider": "google",
            "model": selected_model,
            "reason": "Gemini khong tra ve dung cau truc nhan xet san pham.",
            "error_code": "invalid_response",
        }
    except Exception as exc:
        return _gemini_error_response(selected_model, exc)

    return {
        "enabled": True,
        "provider": "google",
        "model": selected_model,
        "advice": advice.model_dump(),
    }
