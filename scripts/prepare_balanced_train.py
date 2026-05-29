import argparse
import csv
import random
from pathlib import Path
from typing import Dict, Tuple


REQUIRED_COLUMNS = ["review_id", "product_id", "rating", "review_text", "date"]


def normalize_rating(value: str) -> int:
    try:
        rating = int(float(value))
    except (TypeError, ValueError):
        rating = 3
    return max(1, min(5, rating))


def label_from_rating(rating: int) -> str:
    if rating <= 2:
        return "negative"
    if rating == 3:
        return "neutral"
    return "positive"


def is_valid_row(row: Dict[str, str], min_text_length: int) -> bool:
    text = (row.get("review_text") or "").strip()
    return len(text) >= min_text_length


def count_by_class(path: Path, min_text_length: int, encoding: str) -> Dict[str, int]:
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    with path.open("r", encoding=encoding, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not is_valid_row(row, min_text_length):
                continue
            rating = normalize_rating(row.get("rating"))
            label = label_from_rating(rating)
            counts[label] += 1
    return counts


def _sampling_step(remaining: int, need: int, rng: random.Random) -> bool:
    if need <= 0:
        return False
    if remaining <= 0:
        return False
    return rng.random() < (need / remaining)


def sample_balanced(
    input_path: Path,
    output_path: Path,
    target_pos: int,
    target_neg: int,
    keep_all_neutral: bool,
    min_text_length: int,
    seed: int,
    encoding: str,
) -> Tuple[Dict[str, int], Dict[str, int]]:
    counts = count_by_class(input_path, min_text_length, encoding)

    targets = {
        "positive": min(target_pos, counts["positive"]) if target_pos else counts["positive"],
        "negative": min(target_neg, counts["negative"]) if target_neg else counts["negative"],
        "neutral": counts["neutral"] if keep_all_neutral else 0,
    }

    remaining = counts.copy()
    kept = {"positive": 0, "negative": 0, "neutral": 0}

    rng = random.Random(seed)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with input_path.open("r", encoding=encoding, newline="") as f_in, output_path.open(
        "w", encoding="utf-8", newline=""
    ) as f_out:
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=REQUIRED_COLUMNS)
        writer.writeheader()

        for row in reader:
            if not is_valid_row(row, min_text_length):
                continue

            rating = normalize_rating(row.get("rating"))
            label = label_from_rating(rating)

            remaining[label] -= 1
            need = targets[label] - kept[label]

            if label == "neutral" and keep_all_neutral:
                writer.writerow(
                    {
                        "review_id": row.get("review_id", ""),
                        "product_id": row.get("product_id", ""),
                        "rating": rating,
                        "review_text": row.get("review_text", ""),
                        "date": row.get("date", ""),
                    }
                )
                kept[label] += 1
                continue

            if _sampling_step(remaining[label] + 1, need, rng):
                writer.writerow(
                    {
                        "review_id": row.get("review_id", ""),
                        "product_id": row.get("product_id", ""),
                        "rating": rating,
                        "review_text": row.get("review_text", ""),
                        "date": row.get("date", ""),
                    }
                )
                kept[label] += 1

    return counts, kept


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare balanced training dataset from large raw CSV")
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--output", required=True, help="Output CSV path")
    parser.add_argument("--target-positive", type=int, default=500000, help="Target number of positive samples")
    parser.add_argument("--target-negative", type=int, default=400000, help="Target number of negative samples")
    parser.add_argument("--keep-all-neutral", action="store_true", help="Keep all neutral samples")
    parser.add_argument("--min-text-length", type=int, default=3, help="Minimum review_text length to keep")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--encoding", default="utf-8", help="File encoding")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    counts, kept = sample_balanced(
        input_path=input_path,
        output_path=output_path,
        target_pos=args.target_positive,
        target_neg=args.target_negative,
        keep_all_neutral=args.keep_all_neutral,
        min_text_length=args.min_text_length,
        seed=args.seed,
        encoding=args.encoding,
    )

    print("Counts in source:")
    for label, value in counts.items():
        print(f"  {label}: {value}")
    print("Counts in output:")
    for label, value in kept.items():
        print(f"  {label}: {value}")
    print(f"Output written to: {output_path}")


if __name__ == "__main__":
    main()
