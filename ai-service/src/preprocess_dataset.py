import argparse
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict

import pandas as pd
from tqdm import tqdm

if __package__ in (None, ""):
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import REQUIRED_COLUMNS
    from src.preprocess import preprocess_reviews, profile_reviews, validate_columns
else:
    from .config import REQUIRED_COLUMNS
    from .preprocess import preprocess_reviews, profile_reviews, validate_columns


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

def setup_logging() -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    return logging.getLogger(__name__)


logger = setup_logging()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fmt_rows(n: int) -> str:
    return f"{n:,}"


def _count_csv_rows(path: Path) -> int:
    """Count rows in CSV efficiently (line count minus header)."""
    logger.info("Counting rows in input file...")
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        row_count = sum(1 for _ in f) - 1  # subtract header
    return max(row_count, 0)


def read_csv_chunked(path: Path, chunk_size: int = 50_000) -> pd.DataFrame:
    """
    Read a large CSV in chunks with a progress bar.
    Falls back to a single read if the file is small enough (<= 100k rows).
    """
    total_rows = _count_csv_rows(path)
    logger.info(f"Total rows detected: {_fmt_rows(total_rows)}")

    if total_rows <= 100_000:
        logger.info("File is small — reading in one pass...")
        return pd.read_csv(path)

    logger.info(f"Reading in chunks of {_fmt_rows(chunk_size)} rows...")
    chunks = []
    total_chunks = (total_rows // chunk_size) + 1

    reader = pd.read_csv(path, chunksize=chunk_size, low_memory=False)

    with tqdm(total=total_chunks, desc="📥 Reading CSV", unit="chunk", colour="cyan") as pbar:
        for chunk in reader:
            chunks.append(chunk)
            pbar.update(1)
            pbar.set_postfix({"rows_loaded": _fmt_rows(len(chunks) * chunk_size)})

    logger.info("Concatenating chunks...")
    df = pd.concat(chunks, ignore_index=True)
    logger.info(f"Done reading — shape: {df.shape}")
    return df


def build_quality_report(
    df_before: pd.DataFrame,
    df_after: pd.DataFrame,
    missing_columns: list[str],
) -> Dict[str, Any]:
    """Build before/after quality report for preprocessing step."""
    logger.info("Building quality report...")
    report: Dict[str, Any] = {
        "required_columns": REQUIRED_COLUMNS,
        "missing_required_columns": missing_columns,
        "before": profile_reviews(df_before),
        "after": profile_reviews(df_after),
    }
    if "sentiment" in df_after.columns:
        sentiment_dist = df_after["sentiment"].value_counts(dropna=False).to_dict()
        report["after"]["sentiment_distribution"] = {
            str(k): int(v) for k, v in sentiment_dist.items()
        }
        logger.info(f"Sentiment distribution: {report['after']['sentiment_distribution']}")
    return report


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Preprocess review CSV and export clean dataset + quality report"
    )
    parser.add_argument("--input",          required=True,            help="Path to input raw CSV")
    parser.add_argument("--output",         required=True,            help="Path to output processed CSV")
    parser.add_argument("--report",         required=False,           help="Optional path to JSON quality report")
    parser.add_argument("--min-text-length",type=int, default=3,      help="Minimum clean_text length to keep")
    parser.add_argument("--chunk-size",     type=int, default=50_000, help="Rows per chunk when reading large CSVs")
    parser.add_argument("--nrows",          type=int, default=None,   help="Only read first N rows (for quick testing)")
    args = parser.parse_args()

    input_path  = Path(args.input)
    output_path = Path(args.output)
    report_path = Path(args.report) if args.report else None

    t_start = time.time()
    logger.info("=" * 60)
    logger.info(f"INPUT  : {input_path}")
    logger.info(f"OUTPUT : {output_path}")
    if report_path:
        logger.info(f"REPORT : {report_path}")
    logger.info("=" * 60)

    # ------------------------------------------------------------------
    # 1. Read
    # ------------------------------------------------------------------
    if args.nrows:
        logger.info(f"[TEST MODE] Reading only first {_fmt_rows(args.nrows)} rows...")
        df_before = pd.read_csv(input_path, nrows=args.nrows, low_memory=False)
    else:
        df_before = read_csv_chunked(input_path, chunk_size=args.chunk_size)

    logger.info(f"Loaded {_fmt_rows(df_before.shape[0])} rows × {df_before.shape[1]} columns")

    # ------------------------------------------------------------------
    # 2. Validate columns
    # ------------------------------------------------------------------
    logger.info("Validating required columns...")
    missing_columns = validate_columns(df_before)
    if missing_columns:
        logger.warning(f"Missing columns: {missing_columns}")
    else:
        logger.info("All required columns present ✓")

    # ------------------------------------------------------------------
    # 3. Preprocess
    # ------------------------------------------------------------------
    logger.info(f"Preprocessing (min_text_length={args.min_text_length})...")
    t_preprocess = time.time()
    df_after = preprocess_reviews(df_before, min_text_length=args.min_text_length)
    elapsed_preprocess = time.time() - t_preprocess
    logger.info(
        f"Preprocessing done in {elapsed_preprocess:.1f}s — "
        f"{_fmt_rows(df_before.shape[0])} → {_fmt_rows(df_after.shape[0])} rows "
        f"({df_before.shape[0] - df_after.shape[0]:,} removed)"
    )

    # ------------------------------------------------------------------
    # 4. Save output CSV
    # ------------------------------------------------------------------
    output_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Saving processed CSV to {output_path} ...")
    df_after.to_csv(output_path, index=False)
    logger.info("CSV saved ✓")

    # ------------------------------------------------------------------
    # 5. Quality report
    # ------------------------------------------------------------------
    quality_report = build_quality_report(df_before, df_after, missing_columns)
    if report_path is not None:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(quality_report, f, indent=2, ensure_ascii=False)
        logger.info(f"Quality report saved to {report_path} ✓")

    # ------------------------------------------------------------------
    # 6. Summary
    # ------------------------------------------------------------------
    total_elapsed = time.time() - t_start
    logger.info("=" * 60)
    logger.info(f"Input rows  : {_fmt_rows(df_before.shape[0])}")
    logger.info(f"Output rows : {_fmt_rows(df_after.shape[0])}")
    logger.info(f"Total time  : {total_elapsed:.1f}s")
    logger.info(f"Output CSV  : {output_path}")
    if report_path:
        logger.info(f"Report      : {report_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()