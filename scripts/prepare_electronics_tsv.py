import argparse
from pathlib import Path
from typing import Optional

import pandas as pd

REQUIRED_COLUMNS = ["review_id", "product_id", "rating", "review_text", "date"]
BASE_USECOLS = ["review_id", "product_id", "star_rating", "review_body", "review_date"]


def _normalize_rating(series: pd.Series) -> pd.Series:
    rating = pd.to_numeric(series, errors="coerce").fillna(3)
    rating = rating.clip(1, 5).round().astype(int)
    return rating


def _build_review_text(chunk: pd.DataFrame, include_headline: bool) -> pd.Series:
    body = chunk["review_body"].fillna("").astype(str).str.strip()
    if not include_headline or "review_headline" not in chunk.columns:
        return body

    headline = chunk["review_headline"].fillna("").astype(str).str.strip()
    combined = (headline + ". " + body).str.strip()
    combined = combined.str.replace(r"^\.\s*", "", regex=True)
    return combined


def _transform_chunk(chunk: pd.DataFrame, include_headline: bool) -> pd.DataFrame:
    chunk = chunk.copy()
    chunk["rating"] = _normalize_rating(chunk["star_rating"])
    chunk["review_text"] = _build_review_text(chunk, include_headline)
    chunk["date"] = chunk["review_date"].fillna("").astype(str)
    chunk["review_id"] = chunk["review_id"].fillna("").astype(str)
    chunk["product_id"] = chunk["product_id"].fillna("").astype(str)

    return chunk[REQUIRED_COLUMNS]


def _append_existing_csv(path: Path, output_path: Path) -> int:
    df = pd.read_csv(path)
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in {path}: {missing}")

    df = df[REQUIRED_COLUMNS]
    df.to_csv(output_path, mode="a", index=False, header=False)
    return int(df.shape[0])


def main() -> None:
    parser = argparse.ArgumentParser(description="Filter Kaggle TSV to required review schema")
    parser.add_argument("--input", required=True, help="Path to input TSV file")
    parser.add_argument("--output", required=True, help="Path to output CSV file")
    parser.add_argument("--include-headline", action="store_true", help="Prepend review_headline to review_body")
    parser.add_argument("--chunksize", type=int, default=100000, help="Rows per chunk")
    parser.add_argument("--max-rows", type=int, default=None, help="Optional max rows to export")
    parser.add_argument(
        "--append-existing",
        default=None,
        help="Optional existing raw CSV to append after TSV conversion",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        output_path.unlink()

    usecols = list(BASE_USECOLS)
    if args.include_headline:
        usecols.append("review_headline")

    total = 0
    reader = pd.read_csv(
        input_path,
        sep="\t",
        usecols=usecols,
        chunksize=args.chunksize,
        dtype=str,
    )

    for chunk in reader:
        out = _transform_chunk(chunk, args.include_headline)
        if args.max_rows is not None:
            remaining = args.max_rows - total
            if remaining <= 0:
                break
            if len(out) > remaining:
                out = out.iloc[:remaining]

        out.to_csv(output_path, mode="a", index=False, header=total == 0)
        total += int(out.shape[0])
        if total % (args.chunksize * 5) == 0:
            print(f"Processed {total} rows")

    if args.append_existing:
        appended = _append_existing_csv(Path(args.append_existing), output_path)
        total += appended
        print(f"Appended {appended} rows from {args.append_existing}")

    print(f"Wrote {total} rows to {output_path}")


if __name__ == "__main__":
    main()
