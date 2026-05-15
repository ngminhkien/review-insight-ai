import argparse
import json
from pathlib import Path

import pandas as pd

from .config import CLASSIFICATION_REPORT_PATH
from .preprocess import preprocess_reviews, validate_columns
from .sentiment_model import train_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train baseline sentiment model")
    parser.add_argument("--data", required=True, help="Path to CSV dataset")
    args = parser.parse_args()

    csv_path = Path(args.data)
    df = pd.read_csv(csv_path)
    missing = validate_columns(df)
    if missing:
        print(f"Warning: missing columns: {missing}")

    df = preprocess_reviews(df)
    result = train_model(df["clean_text"].tolist(), df["label"].tolist())

    CLASSIFICATION_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CLASSIFICATION_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(result["report"], f, indent=2, ensure_ascii=False)

    print("Training completed")
    print(f"Report saved to {CLASSIFICATION_REPORT_PATH}")


if __name__ == "__main__":
    main()
