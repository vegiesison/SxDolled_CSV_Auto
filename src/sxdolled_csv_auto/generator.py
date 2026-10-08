from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import re
from typing import Mapping

from .brand_defaults import BRAND_DEFAULTS, GLOBAL_DEFAULTS
from .schema import SHOPIFY_HEADERS


PRODUCT_TYPES = {"Mini Dolls", "Sex Doll", "Sex Doll Head", "Torsos"}
GENDERS = {"Female", "Male", "Shemale"}
CUP_SIZES = {
    "A-Cup",
    "B-Cup",
    "C-Cup",
    "D-Cup",
    "E-Cup",
    "F-Cup",
    "G-Cup",
    "H-Cup",
    "I-Cup",
    "J-Cup",
    "K-Cup",
    "L-Cup",
    "M-Cup",
    "N-Cup",
    "O-Cup",
    "P-Cup",
    "Z-Cup",
}
MATERIALS = {"TPE", "S-TPE", "TPE & Silicone", "S-TPE & Silicone", "Silicone"}
BREAST_SHAPES = {"Perky", "Moderately Sagging", "Sagging"}
BODY_SHAPES = {
    "Apple",
    "BBW",
    "hourglass",
    "Hourglass",
    "Inverted Triangle",
    "Muscle",
    "Pear",
    "Rectangle",
    "Slim",
    "Thick",
    "One Piece",
    "Bimbo",
}
SKIN_TONES = {
    "Ebony",
    "Fair",
    "Natural",
    "Tan",
    "Blue Skin",
    "Green Skin",
    "Pink Skin",
    "Purple Skin",
    "Red Skin",
    "Yellow Skin",
}
EMOTIONS = {
    "Angry",
    "Happy",
    "Neutral",
    "Smiling",
    "Worried",
    "Surprised",
    "Sad",
    "Interested",
    "Fearful",
}
HAIR_LENGTHS = {"Long Hair", "Short Hair"}
HAIR_COLOURS = {
    "Black",
    "Blonde",
    "Blue",
    "Brunette",
    "Green",
    "Grey",
    "Ombre",
    "Orange",
    "Pink",
    "Purple",
    "Red",
    "Silver",
    "White",
}
HAIR_COLOURS_LOWER = {value.lower() for value in HAIR_COLOURS}
EYE_COLOURS = {
    "Blue",
    "Brown",
    "Eyes Closed",
    "Green",
    "Grey",
    "Orange",
    "Pink",
    "Purple",
    "Red",
    "White",
    "Yellow",
}
ETHNICITIES = {"African American", "Asian", "Caucasian", "Latino", "Middle Eastern", "Indian"}
THEMES = {
    "Anime",
    "Cosplay",
    "School Uniform",
    "Ahegao",
    "Alien",
    "Angel",
    "Animal",
    "Avatar",
    "Bunny",
    "Christmas Edition",
    "Cowgirl",
    "Cyborg",
    "Demon",
    "Elf",
    "Goblin",
    "Halloween Edition",
    "Kitty",
    "Maid",
    "MILF",
    "Nun",
    "Nurse",
    "Officer",
    "Pornstar",
    "Pregnant",
    "Puppy",
    "Star Wars",
    "Tail",
    "Tongue Out",
    "Vampire",
}
OTHER_TAGS = {
    "Mouth (Oral)",
    "Freckles",
    "Mole",
    "Penetrable Nipples",
    "Seamless (All In One)",
    "Detachable",
    "High End",
    "Robot Doll",
    "Tattoo",
}
LHP_TAGS = {"LHP Bad", "LHP Okay", "LHP Good"}


def generate_shopify_row(intake: Mapping[str, str]) -> dict[str, str]:
    title = _input_value(intake, "Title", "title")
    body = _input_value(intake, "Body (HTML)", "body_html", "body")
    tags_text = _input_value(intake, "Tags", "tags")
    tags = _tags(tags_text)
    defaults = _brand_defaults(title, body, tags_text)
    body_parts = _parse_body_first_line(body)
    product_brand = _product_brand(title, tags, defaults)

    height = _first_present(_title_height(title), _tag_value(tags, _is_height), body_parts.get("height", ""))
    cup = _first_present(_title_cup(title), _tag_value(tags, lambda tag: tag in CUP_SIZES), body_parts.get("cup", ""))
    hair_colour = _tag_value(tags, lambda tag: tag in HAIR_COLOURS)
    eye_colour = _last_tag_value(tags, lambda tag: tag in EYE_COLOURS)
    material = _first_present(_tag_value(tags, lambda tag: tag in MATERIALS), _body_line_value(body, "Material"))
    weight_kg = _first_present(_input_weight_kg(intake), _body_weight(body))
    waist = _tag_measurement(tags, "Waist")
    hip = _tag_measurement(tags, "Hip")
    product_type = _first_present(_tag_value(tags, lambda tag: tag in PRODUCT_TYPES), _title_product_type(title))

    row = {header: "" for header in SHOPIFY_HEADERS}
    row.update(
        {
            "Title": title,
            "Body (HTML)": body,
            "Vendor": _default(defaults, "vendor") or product_brand,
            "Product Category": _global_default("product_category"),
            "Type": _shopify_product_type(product_type),
            "Tags": tags_text,
            "Published": _global_default("published"),
            "Option1 Name": "Cup Size" if cup else "",
            "Option1 Value": cup,
            "Option2 Name": "Height" if height else "",
            "Option2 Value": height,
            "Option3 Name": "Hair Colour" if hair_colour else "",
            "Option3 Value": hair_colour,
            "Variant SKU": _variant_sku(title, body, defaults, body_parts, product_type),
            "Variant Grams": _grams(weight_kg) if weight_kg else "",
            "Variant Inventory Tracker": _global_default("inventory_tracker"),
            "Variant Inventory Qty": _global_default("inventory_qty"),
            "Variant Inventory Policy": _global_default("inventory_policy"),
            "Variant Fulfillment Service": _global_default("fulfillment_service"),
            "Variant Price": _input_value(intake, "Variant Price", "price", "variant_price"),
            "Variant Requires Shipping": _global_default("requires_shipping"),
            "Variant Taxable": _global_default("taxable"),
            "Gift Card": _global_default("gift_card"),
            "Body Shape (product.metafields.custom.body_shape)": _body_shape_metafield(
                _tag_value(tags, lambda tag: tag in BODY_SHAPES)
            ),
            "Brand 2 (product.metafields.custom.brand_2)": _default(defaults, "brand_2")
            or _brand_slug(product_brand, tags),
            "Breast Shape 2 (product.metafields.custom.breast_shape_2)": _slug_value(
                _tag_value(tags, lambda tag: tag in BREAST_SHAPES)
            ),
            "Emotion 2 (product.metafields.custom.emotion_2)": _slug_value(
                _tag_value(tags, lambda tag: tag in EMOTIONS)
            ),
            "Ethnicity (product.metafields.custom.ethnicity)": _ethnicity_metafield(
                _tag_value(tags, lambda tag: tag in ETHNICITIES)
            ),
            "Eye Colour 2 (product.metafields.custom.eye_colour_2)": _eye_colour_metafield(eye_colour),
            "Gender (product.metafields.custom.gender)": _tag_value(tags, lambda tag: tag in GENDERS),
            "Hair Colour 2 (product.metafields.custom.hair_colour_2)": _slug_value(hair_colour),
            "Hair Length 2 (product.metafields.custom.hair_length_2)": _hair_length_metafield(
                _tag_value(tags, lambda tag: tag in HAIR_LENGTHS)
            ),
            "Hip Measurements (product.metafields.custom.hip_measurements)": hip,
            "LHP (product.metafields.custom.lhp)": _lhp_metafield(_tag_value(tags, lambda tag: tag in LHP_TAGS)),
            "Material (product.metafields.custom.material)": material,
            "Other (product.metafields.custom.other)": "\n".join(_tag_values(tags, lambda tag: tag in OTHER_TAGS)),
            "Skin Tone 2 (product.metafields.custom.skin_tone_2)": _slug_value(
                _tag_value(tags, lambda tag: tag in SKIN_TONES)
            ),
            "Theme (product.metafields.custom.theme)": _tag_value(tags, lambda tag: tag in THEMES),
            "Waist Measurements (product.metafields.custom.waist_measurements)": waist,
            "Weight (product.metafields.custom.weight)": f"{_rounded_weight_text(weight_kg)}kg" if weight_kg else "",
            "Weight 2 (product.metafields.custom.weight_2)": _rounded_weight_text(weight_kg) if weight_kg else "",
            "Variant Weight Unit": _global_default("weight_unit"),
            "Status": _input_value(intake, "Status", "status") or _global_default("status"),
        }
    )
    row.update(GLOBAL_DEFAULTS["included_markets"])
    _apply_exact_overrides(row, intake)
    return row


def _input_value(intake: Mapping[str, str], *keys: str) -> str:
    for key in keys:
        value = intake.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def _input_weight_kg(intake: Mapping[str, str]) -> str:
    return _input_value(intake, "Weight (kg)", "Product Weight", "weight_kg", "weightKg", "weight")


def _brand_defaults(title: str, body: str, tags: str) -> Mapping[str, object] | None:
    haystack = f"{title}\n{body}\n{tags}".lower()
    for brand_name, defaults in BRAND_DEFAULTS.items():
        candidates = {
            brand_name,
            str(defaults["title_brand"]),
            str(defaults["body_brand"]),
            str(defaults["tag_brand"]),
        }
        if any(candidate.lower() in haystack for candidate in candidates):
            return defaults
    return None


def _product_brand(title: str, tags: list[str], defaults: Mapping[str, object] | None) -> str:
    return _first_present(_title_brand(title), _default(defaults, "vendor"), _default(defaults, "title_brand"))


def _default(defaults: Mapping[str, object] | None, key: str) -> str:
    if not defaults:
        return ""
    return str(defaults.get(key, ""))


def _global_default(key: str) -> str:
    return str(GLOBAL_DEFAULTS.get(key, ""))


def _shopify_product_type(product_type: str) -> str:
    return "Sex Torso" if product_type == "Torsos" else product_type


def _tags(value: str) -> list[str]:
    return [tag.strip() for tag in value.split(",") if tag.strip()]


def _tag_value(tags: list[str], predicate) -> str:
    for tag in tags:
        if predicate(tag):
            return tag
    return ""


def _last_tag_value(tags: list[str], predicate) -> str:
    for tag in reversed(tags):
        if predicate(tag):
            return tag
    return ""


def _tag_values(tags: list[str], predicate) -> list[str]:
    return [tag for tag in tags if predicate(tag)]


def _is_height(tag: str) -> bool:
    return bool(re.fullmatch(r"\d+(?:\.\d+)?cm", tag, re.IGNORECASE))


def _tag_measurement(tags: list[str], label: str) -> str:
    pattern = re.compile(rf"^{re.escape(label)}\s+(?P<value>\d+(?:\.\d+)?cm)$", re.IGNORECASE)
    for tag in tags:
        match = pattern.match(tag)
        if match:
            return _normalize_cm_rounded(match.group("value"))
    return ""


def _title_height(title: str) -> str:
    match = re.search(r"\((?P<height>\d+(?:\.\d+)?cm)\)", title, re.IGNORECASE)
    return _normalize_cm(match.group("height")) if match else ""


def _title_cup(title: str) -> str:
    match = re.search(r"\((?P<cup>[A-Z])-Cup\)", title, re.IGNORECASE)
    return f"{match.group('cup').upper()}-Cup" if match else ""


def _title_product_type(title: str) -> str:
    for product_type in sorted(PRODUCT_TYPES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(product_type)}\b", title, re.IGNORECASE):
            return product_type
    return ""


def _parse_body_first_line(body: str) -> dict[str, str]:
    first_line = body.splitlines()[0].strip() if body else ""
    compact_match = re.search(
        r"^(?:(?P<brand>.*?)\s+-\s+)?(?P<body_height>\d+(?:\.\d+)?\s*[A-Z])\b\s*#(?P<original_name>.+)$",
        first_line,
        re.IGNORECASE,
    )
    spaced_match = re.search(
        r"^(?:(?P<brand>.*?)\s+-\s+)?(?P<height>\d+(?:\.\d+)?)\s*CM\s+(?P<cup>[A-Z])\s+#(?P<original_name>.+)$",
        first_line,
        re.IGNORECASE,
    )
    compact_no_hash_match = re.search(
        r"^(?:(?P<brand>.*?)\s+-\s+)?(?P<body_height>\d+(?:\.\d+)?\s*[A-Z])\b(?P<rest>\s+.+)$",
        first_line,
        re.IGNORECASE,
    )
    spaced_no_hash_match = re.search(
        r"^(?:(?P<brand>.*?)\s+-\s+)?(?P<height>\d+(?:\.\d+)?)\s*CM\s+(?P<cup>[A-Z])\b(?P<rest>\s+.+)$",
        first_line,
        re.IGNORECASE,
    )
    match = compact_match or spaced_match or compact_no_hash_match or spaced_no_hash_match
    if not match:
        original_name = _sku_original_name(first_line)
        if _is_sku_original_name_candidate(original_name):
            return {"original_name": original_name}
        return {}
    if compact_match or compact_no_hash_match:
        body_height = re.sub(r"\s+", "", match.group("body_height")).upper()
        height_match = re.match(r"(?P<height>\d+(?:\.\d+)?)(?P<cup>[A-Z])", body_height)
        height = f"{_number_text(height_match.group('height'))}cm" if height_match else ""
        cup = f"{height_match.group('cup').upper()}-Cup" if height_match else ""
        cup_letter = height_match.group("cup").upper() if height_match else ""
        original_name = (
            _sku_original_name(match.group("original_name"))
            if compact_match
            else _sku_original_name(first_line)
        )
    else:
        body_height = f"{_number_text(match.group('height'))}{match.group('cup').upper()}"
        height = f"{_number_text(match.group('height'))}cm"
        cup = f"{match.group('cup').upper()}-Cup"
        cup_letter = match.group("cup").upper()
        original_name = (
            _sku_original_name(match.group("original_name"))
            if spaced_match
            else _sku_original_name_from_cm_line(match.group("rest"))
        )
    return {
        "brand": (match.group("brand") or "").strip(),
        "height": height,
        "cup": cup,
        "cup_letter": cup_letter,
        "body_height": body_height,
        "original_name": original_name,
    }


def _body_line_value(body: str, label: str) -> str:
    pattern = re.compile(rf"^{re.escape(label)}\s*(?::\s*|\s+)(?P<value>.+)$", re.IGNORECASE)
    for line in body.splitlines():
        match = pattern.match(line.strip())
        if match:
            return match.group("value").strip()
    return ""


def _body_weight(body: str) -> str:
    for line in body.splitlines():
        if not re.search(r"\bnet\b", line, re.IGNORECASE):
            continue
        match = re.search(r"(\d+(?:\.\d+)?)\s*kg\b", line, re.IGNORECASE)
        if match:
            return _number_text(match.group(1))
    value = _body_line_value(body, "Weight") or _body_line_value(body, "Net Weight")
    if not value:
        return ""
    match = re.search(r"\d+(?:\.\d+)?", value)
    return _number_text(match.group(0)) if match else ""


def _variant_sku(
    title: str,
    body: str,
    defaults: Mapping[str, object] | None,
    body_parts: Mapping[str, str],
    product_type: str,
) -> str:
    if not body_parts:
        return ""
    brand = _title_brand(title) or _default(defaults, "sku_brand") or body_parts.get("brand", "")
    body_height = body_parts.get("body_height", "") or _sku_body_height_from_body(body) or _sku_body_height_from_title(title)
    original_name = body_parts.get("original_name", "")
    if not all([brand, body_height, original_name]):
        return ""
    material_code = _sku_material_code(_body_line_value(body, "Material"), product_type)
    material_part = f"{material_code} " if material_code else ""
    return f"{brand} {body_height} + {material_part}#{_clean_sku_original_name(original_name)}"


def _title_brand(title: str) -> str:
    parts = [part.strip() for part in title.split("|") if part.strip()]
    return parts[-1] if len(parts) >= 2 else ""


def _sku_material_code(material: str, product_type: str) -> str:
    material_lower = material.lower()
    if product_type.lower() == "torsos" or "torso" in material_lower:
        return "T"
    if "hybrid" in material_lower or ("tpe" in material_lower and "silicone" in material_lower):
        return "H"
    if "silicone" in material_lower:
        return "S"
    return ""


def _sku_original_name(value: str) -> str:
    return _clean_sku_original_name(value)


def _clean_sku_original_name(value: str) -> str:
    cleaned = re.sub(r"\s*\(SxD[^)]*\)", "", value, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*\((?:\s*cm\s*|[A-Z]\s*-?\s*cup)\)\s*", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\(([^)]*)\)", r"\1", cleaned)
    cleaned = re.sub(r"[-–—]{2,}", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def _sku_original_name_from_cm_line(value: str) -> str:
    words = value.strip().split()
    if len(words) >= 2 and words[0].lower() in HAIR_COLOURS_LOWER:
        words = words[1:]
    return _sku_original_name(" ".join(words))


def _is_sku_original_name_candidate(value: str) -> bool:
    if not value or ":" in value or not re.search(r"[A-Za-z]", value):
        return False
    measurement_labels = (
        "height",
        "weight",
        "net weight",
        "cup size",
        "width",
        "full bust",
        "under bust",
        "waist",
        "hips",
        "hip",
        "shoulder",
        "arm length",
        "hand length",
        "leg length",
        "foot length",
        "calf",
        "thigh",
        "vaginal",
        "anal",
    )
    return not any(re.match(rf"^{re.escape(label)}\b", value, re.IGNORECASE) for label in measurement_labels)


def _sku_body_height_from_body(body: str) -> str:
    height = _body_line_value(body, "Height with Head") or _body_line_value(body, "Height")
    cup = _body_line_value(body, "Cup Size")
    return _sku_body_height_from_values(height, cup)


def _sku_body_height_from_title(title: str) -> str:
    return _sku_body_height_from_values(_title_height(title), _title_cup(title))


def _sku_body_height_from_values(height: str, cup: str) -> str:
    height_match = re.search(r"\d+(?:\.\d+)?", height)
    cup_match = re.search(r"\b(?P<cup>[A-Z])\s*-?\s*Cup\b", cup, re.IGNORECASE)
    if not height_match or not cup_match:
        return ""
    return f"{_number_text(height_match.group(0))}{cup_match.group('cup').upper()}"


def _apply_exact_overrides(row: dict[str, str], intake: Mapping[str, str]) -> None:
    for header in SHOPIFY_HEADERS:
        if header in {"Title", "Body (HTML)", "Tags"}:
            continue
        value = intake.get(header)
        if value is not None and str(value).strip():
            row[header] = str(value).strip()


def _first_present(*values: str) -> str:
    return next((value for value in values if value), "")


def _grams(value: str) -> str:
    return str(int(_decimal(value) * 1000))


def _number_text(value: str) -> str:
    decimal = _decimal(value)
    if decimal == decimal.to_integral():
        return str(int(decimal))
    return format(decimal.normalize(), "f")


def _rounded_weight_text(value: str) -> str:
    return str(int(_decimal(value).quantize(Decimal("1"), rounding=ROUND_HALF_UP)))


def _decimal(value: str) -> Decimal:
    cleaned = re.sub(r"[^0-9.]", "", value)
    try:
        return Decimal(cleaned)
    except InvalidOperation as exc:
        raise ValueError(f"Expected a numeric value, got '{value}'.") from exc


def _normalize_cm(value: str) -> str:
    return f"{_number_text(value)}cm"


def _normalize_cm_rounded(value: str) -> str:
    return f"{round(_decimal(value))}cm"


def _slug_value(value: str) -> str:
    return value.strip().replace(" ", "-").lower() if value else ""


def _brand_slug(product_brand: str, tags: list[str]) -> str:
    known_brand = next(
        (
            tag
            for tag in tags
            if product_brand and product_brand.lower() in tag.lower() and len(tag) > len(product_brand)
        ),
        "",
    )
    return _slug_value(known_brand or product_brand)


def _body_shape_metafield(value: str) -> str:
    if value.lower() == "hourglass":
        return "Hourglass"
    return value


def _ethnicity_metafield(value: str) -> str:
    if value.lower() == "african american":
        return "Black"
    return value


def _eye_colour_metafield(value: str) -> str:
    if not value:
        return ""
    if value == "Eyes Closed":
        return "Eyes-Closed"
    return _slug_value(value)


def _hair_length_metafield(value: str) -> str:
    return _slug_value(value.removesuffix(" Hair")) if value else ""


def _lhp_metafield(value: str) -> str:
    return value.removeprefix("LHP ").strip() if value else ""
