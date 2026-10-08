from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable, Mapping


HEIGHT_RE = re.compile(r"(?P<height>\d+(?:\.\d+)?)\s*cm", re.IGNORECASE)
CUP_RE = re.compile(r"(?P<cup>[A-Z])-Cup|(?P<compact>\d+(?:\.\d+)?\s*[A-Z])", re.IGNORECASE)
MODEL_ID_RE = re.compile(r"#(?P<model>[A-Za-z0-9-]+(?:\s+[A-Za-z0-9-]+)?)")


@dataclass(frozen=True)
class ValidationIssue:
    row_number: int
    code: str
    message: str


def validate_shopify_rows(rows: Iterable[Mapping[str, str]]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for index, row in enumerate(rows, start=2):
        issues.extend(_validate_row(index, row))
    return issues


def _validate_row(row_number: int, row: Mapping[str, str]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    title_height = _height(row.get("Title", ""))
    option_height = _height(row.get("Option2 Value", ""))
    tag_height = _first_tag_height(row.get("Tags", ""))
    body_height = _body_height(row.get("Body (HTML)", ""))
    sku_height = _sku_height(row.get("Variant SKU", ""))

    height_values = {
        "Title": title_height,
        "Option2 Value": option_height,
        "Tags": tag_height,
        "Body (HTML)": body_height,
        "Variant SKU": sku_height,
    }
    _append_mismatch_issue(
        issues,
        row_number,
        "height-mismatch",
        "Height values do not match",
        height_values,
    )

    cup_values = {
        "Title": _title_cup(row.get("Title", "")),
        "Option1 Value": _clean(row.get("Option1 Value", "")),
        "Tags": _first_tag_cup(row.get("Tags", "")),
        "Body (HTML)": _body_cup(row.get("Body (HTML)", "")),
        "Variant SKU": _sku_cup(row.get("Variant SKU", "")),
    }
    _append_mismatch_issue(
        issues,
        row_number,
        "cup-mismatch",
        "Cup size values do not match",
        cup_values,
    )

    model_values = {
        "Body (HTML)": _model_id(row.get("Body (HTML)", "")),
        "Variant SKU": _model_id(row.get("Variant SKU", "")),
    }
    _append_mismatch_issue(
        issues,
        row_number,
        "model-id-mismatch",
        "Original model IDs do not match",
        model_values,
    )

    option3 = _clean(row.get("Option3 Value", ""))
    if option3 and option3.lower() not in {tag.lower() for tag in _tags(row.get("Tags", ""))}:
        issues.append(
            ValidationIssue(
                row_number=row_number,
                code="hair-colour-missing-from-tags",
                message=f"Hair colour option '{option3}' is not present in Tags.",
            )
        )

    return issues


def _append_mismatch_issue(
    issues: list[ValidationIssue],
    row_number: int,
    code: str,
    label: str,
    values: Mapping[str, str | None],
) -> None:
    populated = {field: value for field, value in values.items() if value}
    unique = sorted(set(populated.values()))
    if len(unique) <= 1:
        return

    detail = ", ".join(f"{field}={value}" for field, value in populated.items())
    issues.append(
        ValidationIssue(
            row_number=row_number,
            code=code,
            message=f"{label}: {detail}.",
        )
    )


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _height(value: str | None) -> str | None:
    if not value:
        return None
    match = HEIGHT_RE.search(value)
    if not match:
        return None
    return f"{_normalize_decimal(match.group('height'))}cm"


def _body_height(value: str | None) -> str | None:
    first_line = (value or "").splitlines()[0] if value else ""
    return _height(first_line)


def _sku_height(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"\b(?P<height>\d+(?:\.\d+)?)(?P<cup>[A-Z])\s*\+", value)
    if not match:
        return None
    return f"{_normalize_decimal(match.group('height'))}cm"


def _title_cup(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"\((?P<cup>[A-Z])-Cup\)", value, re.IGNORECASE)
    return _format_cup(match.group("cup")) if match else None


def _body_cup(value: str | None) -> str | None:
    first_line = (value or "").splitlines()[0] if value else ""
    match = re.search(r"\b\d+(?:\.\d+)?\s*CM\s+(?P<cup>[A-Z])\b", first_line, re.IGNORECASE)
    return _format_cup(match.group("cup")) if match else None


def _sku_cup(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"\b\d+(?:\.\d+)?(?P<cup>[A-Z])\s*\+", value)
    return _format_cup(match.group("cup")) if match else None


def _first_tag_height(value: str | None) -> str | None:
    for tag in _tags(value):
        height = _height(tag)
        if height:
            return height
    return None


def _first_tag_cup(value: str | None) -> str | None:
    for tag in _tags(value):
        match = re.fullmatch(r"(?P<cup>[A-Z])-Cup", tag, re.IGNORECASE)
        if match:
            return _format_cup(match.group("cup"))
    return None


def _tags(value: str | None) -> list[str]:
    return [tag.strip() for tag in (value or "").split(",") if tag.strip()]


def _model_id(value: str | None) -> str | None:
    if not value:
        return None
    match = MODEL_ID_RE.search(value)
    if not match:
        return None
    return match.group("model").strip()


def _format_cup(cup: str | None) -> str | None:
    if not cup:
        return None
    return f"{cup.upper()}-Cup"


def _normalize_decimal(value: str) -> str:
    numeric = float(value)
    if numeric.is_integer():
        return str(int(numeric))
    return str(numeric).rstrip("0").rstrip(".")

