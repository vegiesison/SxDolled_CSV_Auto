# SxDolled CSV Auto

Local tools for creating Shopify-ready product CSV files and checking existing CSVs before upload. This does not upload anything to Shopify.

## What It Does

- Generates the 96-column Shopify CSV format used in the sample Castle upload.
- Fills repeated Shopify constants from brand defaults.
- Treats `Title`, `Body (HTML)`, and `Tags` as the fixed source fields.
- Fills options, SKU, grams, and metafields only when it can read matching values from those three fields.
- Leaves uncertain fields blank instead of guessing.
- Validates height, cup size, hair colour, and original model references across the row.
- Writes a markdown QA report with warnings before upload.

## Setup

From this folder:

```powershell
python -m pip install -e .
```

## Generate A CSV

Use `examples/intake_castle.csv` as the starting format. The required columns are:

- `Title`
- `Body (HTML)`
- `Tags`

You can add optional Shopify columns such as `Variant Price` or `Status` when that value cannot be read from the three source fields.

```powershell
sxdolled-csv generate --input examples/intake_castle.csv --output outputs/castle-products.csv --qa-report outputs/castle-products-qa.md
```

If QA passes, the generated CSV is ready for manual Shopify import.

## Use The Web Form

Open the local web app:

```powershell
python -m http.server 8765 -d web
```

Then visit:

```text
http://localhost:8765/
```

Each product set has three required inputs:

- `Title`
- `Body (HTML)`
- `Tags`, generated from the tag option controls

Each product also shows `Variant SKU`. It auto-generates from the current title, body, and tag values, but you can edit it before generating the CSV. Manual edits are exported exactly and are not overwritten by later source-field changes.

Each product also has tag option controls with dropdowns and custom inputs. Common values are preselected, while frequently changing values such as height, cup size, brand, LHP, waist, hip, hair, eyes, ethnicity, and extras start blank. The title format is treated as `Doll Name (Cup Size) (Height) | Doll Description | Brand`, so pasting `Title` pre-fills cup size, height, and brand. Exact known-brand matches are accepted immediately; near brand matches are accepted only at 90% confidence or higher. Lower-confidence brand matches stay blank for manual verification.

When you paste `Body (HTML)`, the form tries to prefill blank height, cup size, waist, and hip tag controls from matching body measurements. If no labelled cup size is present, it calculates cup size from the full/upper bust minus lower/under bust using US one-inch cup steps. Use `Prefill from Body` to run that scraper again after editing the body text. Manual tag values are left alone.

Click `+ Add Product` to add product 2, product 3, and so on. Click `Generate CSV` to download one Shopify CSV containing all product sets.

## Validate An Existing CSV

```powershell
sxdolled-csv validate --input "C:\Users\Admin\Downloads\New Dolls Castle (Uploaded).csv" --qa-report outputs/castle-uploaded-qa.md
```

The command returns a non-zero exit code when it finds QA issues. That is intentional, so mistakes are visible before upload.

## Current Brand Support

The first version includes defaults for `Dolls Castle`, based on the provided sample. More brands can be added in `src/sxdolled_csv_auto/brand_defaults.py`.

## How Values Are Filled

The generator looks for exact allowed tags and parseable body lines.

- `Option1 Value`: cup size from title or tags, such as `B-Cup`.
- `Option2 Value`: height from title or tags, such as `158cm`.
- `Option3 Value`: hair colour from a hair-colour tag, such as `Blue`.
- Eye colour is separate. `Blue Eyes` fills the eye colour metafield, not hair colour.
- `Variant SKU`: built from title brand plus Body HTML details in this format: `Brand - Body/Height + MaterialCode #Original Name`.
- SKU material codes: blank for `TPE`, `S` for `Silicone`, `H` for hybrid material such as `TPE & Silicone`, and `T` for torso products.
- Weight fields: filled only when `Body (HTML)` contains a `Weight:` line.
- Metafields: filled from matching tags like `Pear`, `Perky`, `Tan`, `Neutral`, `Long Hair`, `Eyes Closed`, `Waist 52cm`, and `Hip 85cm`.

If a value cannot be found in `Title`, `Body (HTML)`, or `Tags`, the generated Shopify field stays blank unless you provide that exact Shopify column in the intake CSV.

## Run Tests

```powershell
$env:PYTHONPATH='src'
python -m unittest discover -s tests
node tests\web_generator.test.js
node tests\tag_builder.test.js
```
