from __future__ import annotations

import csv
from pathlib import Path
from typing import Iterable

from .generator import generate_shopify_row
from .schema import SHOPIFY_HEADERS
from .validation import ValidationIssue, validate_shopify_rows


def generate_csv(input_path: Path, output_path: Path, report_path: Path | None = None) -> list[ValidationIssue]:
    intake_rows = _read_csv(input_path)
    shopify_rows = [generate_shopify_row(row) for row in intake_rows]
    issues = validate_shopify_rows(shopify_rows)
    _write_csv(output_path, SHOPIFY_HEADERS, shopify_rows)
    if report_path:
        _write_report(report_path, issues, row_count=len(shopify_rows), mode="generated")
    return issues


def validate_csv(input_path: Path, report_path: Path | None = None) -> list[ValidationIssue]:
    rows = _read_csv(input_path)
    issues = validate_shopify_rows(rows)
    if report_path:
        _write_report(report_path, issues, row_count=len(rows), mode="validated")
    return issues


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _write_csv(path: Path, headers: list[str], rows: Iterable[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def _write_report(path: Path, issues: list[ValidationIssue], row_count: int, mode: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Shopify CSV QA Report",
        "",
        f"Mode: {mode}",
        f"Rows checked: {row_count}",
        f"Issues found: {len(issues)}",
        f"Status: {'FAIL' if issues else 'PASS'}",
        "",
    ]
    if issues:
        lines.append("## Issues")
        lines.append("")
        for issue in issues:
            lines.append(f"- Row {issue.row_number} [{issue.code}]: {issue.message}")
    else:
        lines.append("No validation issues found.")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

