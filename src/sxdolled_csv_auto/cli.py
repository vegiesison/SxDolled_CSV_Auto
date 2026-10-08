from __future__ import annotations

import argparse
from pathlib import Path

from .csv_workflow import generate_csv, validate_csv


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate and validate SxDolled Shopify CSV files.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate_parser = subparsers.add_parser("generate", help="Generate a Shopify CSV from an intake CSV.")
    generate_parser.add_argument("--input", required=True, type=Path, help="Product intake CSV path.")
    generate_parser.add_argument("--output", required=True, type=Path, help="Shopify CSV output path.")
    generate_parser.add_argument("--qa-report", type=Path, help="Optional markdown QA report path.")

    validate_parser = subparsers.add_parser("validate", help="Validate an existing Shopify CSV.")
    validate_parser.add_argument("--input", required=True, type=Path, help="Shopify CSV path to validate.")
    validate_parser.add_argument("--qa-report", type=Path, help="Optional markdown QA report path.")

    args = parser.parse_args(argv)
    if args.command == "generate":
        issues = generate_csv(args.input, args.output, args.qa_report)
        print(f"Wrote {args.output}")
    else:
        issues = validate_csv(args.input, args.qa_report)

    if args.qa_report:
        print(f"Wrote {args.qa_report}")
    if issues:
        print(f"Found {len(issues)} QA issue(s).")
        return 1
    print("QA passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

