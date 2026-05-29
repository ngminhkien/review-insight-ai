import argparse
import json
from pathlib import Path

import pandas as pd

if __package__ in (None, ""):
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import CLASSIFICATION_REPORT_PATH, REQUIRED_COLUMNS
    from src.preprocess import preprocess_reviews, validate_columns
    from src.sentiment_model import MODEL_CHOICES, cross_validate_model, train_model
else:
    from .config import CLASSIFICATION_REPORT_PATH, REQUIRED_COLUMNS
    from .preprocess import preprocess_reviews, validate_columns
    from .sentiment_model import MODEL_CHOICES, cross_validate_model, train_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train baseline sentiment model")
    parser.add_argument("--data",            required=True,            help="Path to CSV dataset")
    parser.add_argument("--model",           default="logreg",         choices=MODEL_CHOICES)
    parser.add_argument("--max-rows",        type=int,  default=None,  help="Row limit cho quick test")
    parser.add_argument("--report",          default=None,             help="Output path cho JSON report")
    parser.add_argument(
        "--oversample-neutral",
        action="store_true",
        help="SMOTE oversample neutral class trên training split",
    )
    parser.add_argument(
        "--neutral-boost",
        type=float,
        default=2.5,
        help="Sample weight boost cho neutral class (default: 2.5). "
             "Thử 3.0–4.0 nếu neutral F1 vẫn thấp.",
    )
    parser.add_argument(
        "--use-raw-text",
        action="store_true",
        help="Train trên review_text thay vì clean_text",
    )
    parser.add_argument(
        "--no-char-ngram",
        action="store_true",
        help="Tắt char n-gram (mặc định bật). Tắt nếu RAM hạn chế.",
    )
    parser.add_argument(
        "--cross-validate",
        action="store_true",
        help="Chạy 5-fold cross-validation TRƯỚC khi train final model. "
             "Tốn ~5x thời gian nhưng cho estimate ổn định hơn.",
    )
    parser.add_argument(
        "--cv-folds",
        type=int,
        default=5,
        help="Số folds cho cross-validation (default: 5)",
    )
    args = parser.parse_args()

    csv_path = Path(args.data)

    # Đọc chỉ các cột cần thiết để tiết kiệm RAM
    try:
        df = pd.read_csv(csv_path, usecols=REQUIRED_COLUMNS, nrows=args.max_rows)
    except ValueError:
        # Một số column có thể không có trong file → đọc toàn bộ rồi warn
        df = pd.read_csv(csv_path, nrows=args.max_rows)

    missing = validate_columns(df)
    if missing:
        print(f"[WARNING] Missing columns: {missing}")

    df = preprocess_reviews(df)

    # In class distribution để debug imbalance
    dist = df["label"].value_counts()
    print("Class distribution:")
    for label, count in dist.items():
        pct = count / len(df) * 100
        print(f"  {label:12s}: {count:>8,d}  ({pct:.1f}%)")

    text_field = "review_text" if args.use_raw_text else "clean_text"
    use_char = not args.no_char_ngram

    texts = df[text_field].tolist()
    labels = df["label"].tolist()

    # --- Optional: Cross-validation trước ---
    if args.cross_validate:
        print(f"\nRunning {args.cv_folds}-fold cross-validation...")
        cv_result = cross_validate_model(
            texts,
            labels,
            model_name=args.model,
            n_splits=args.cv_folds,
            use_char_ngram=use_char,
            neutral_weight_boost=args.neutral_boost,
        )
        print(f"  CV accuracy : {cv_result['accuracy_mean']:.4f} ± {cv_result['accuracy_std']:.4f}")
        print(f"  CV neutral F1: {cv_result['neutral_f1_mean']:.4f} ± {cv_result['neutral_f1_std']:.4f}")
        for fold in cv_result["fold_results"]:
            print(f"    Fold {fold['fold']}: acc={fold['accuracy']:.4f}, neutral_f1={fold['neutral_f1']:.4f}")
    else:
        cv_result = None

    # --- Train final model ---
    print(f"\nTraining final model: {args.model} | char_ngram={use_char} | neutral_boost={args.neutral_boost}")
    result = train_model(
        texts,
        labels,
        model_name=args.model,
        oversample_neutral=args.oversample_neutral,
        neutral_weight_boost=args.neutral_boost,
        use_char_ngram=use_char,
    )

    report = result["report"]
    if cv_result:
        report["cross_validation"] = cv_result

    # Print summary
    print("\n=== Training Results ===")
    print(f"  Accuracy     : {report['accuracy_score']:.4f}")
    for cls in ["negative", "neutral", "positive"]:
        if cls in report:
            m = report[cls]
            print(
                f"  {cls:12s}: P={m['precision']:.3f}  R={m['recall']:.3f}  F1={m['f1-score']:.3f}  "
                f"(n={m['support']:.0f})"
            )

    # Kiểm tra target
    neutral_f1 = report.get("neutral", {}).get("f1-score", 0)
    if neutral_f1 >= 0.65:
        print(f"\n✓ Neutral F1 = {neutral_f1:.4f} — TARGET MET (≥ 0.65)")
    elif neutral_f1 >= 0.60:
        print(f"\n~ Neutral F1 = {neutral_f1:.4f} — gần target (0.60–0.65)")
        print("  → Thử tăng --neutral-boost lên 3.0 hoặc --oversample-neutral")
    else:
        print(f"\n✗ Neutral F1 = {neutral_f1:.4f} — chưa đạt (< 0.60)")
        print("  → Thử các bước sau:")
        print("     1. --oversample-neutral (SMOTE)")
        print("     2. --neutral-boost 3.5")
        print("     3. Bổ sung thêm data rating=3")
        print("     4. --cross-validate để kiểm tra variance")

    # Save report
    report_path = Path(args.report) if args.report else CLASSIFICATION_REPORT_PATH
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nReport saved → {report_path}")
    print("Training completed")


if __name__ == "__main__":
    main()