import csv
import io
import unittest

from sxdolled_csv_auto.validation import validate_shopify_rows


def rows_from_text(text):
    return list(csv.DictReader(io.StringIO(text.strip())))


class ShopifyCsvValidationTests(unittest.TestCase):
    def test_flags_height_mismatch_between_title_option_tags_and_body(self):
        rows = rows_from_text(
            """
Title,Body (HTML),Tags,Option1 Value,Option2 Value,Option3 Value,Variant SKU
Lira A (E-Cup) (164cm) | Red Nurse Fantasy Sex Doll | Dolls Castle,"Dolls Castle - 183CM E #JS063 Lira (SxD Lira A)",183cm, E-Cup, Blonde,Dolls Castle 164E + #JS063 Lira
"""
        )

        issues = validate_shopify_rows(rows)

        self.assertTrue(
            any(issue.code == "height-mismatch" for issue in issues),
            [issue.message for issue in issues],
        )

    def test_flags_model_id_mismatch_between_body_and_sku(self):
        rows = rows_from_text(
            """
Title,Body (HTML),Tags,Option1 Value,Option2 Value,Option3 Value,Variant SKU
Lira A (E-Cup) (164cm) | Red Nurse Fantasy Sex Doll | Dolls Castle,"Dolls Castle - 183CM E #JS063 Lira (SxD Lira A)","164cm, E-Cup, Blonde",E-Cup,164cm,Blonde,Dolls Castle 164E + #JS136 Lili
"""
        )

        issues = validate_shopify_rows(rows)

        self.assertTrue(
            any(issue.code == "model-id-mismatch" for issue in issues),
            [issue.message for issue in issues],
        )

    def test_accepts_consistent_product_row(self):
        rows = rows_from_text(
            """
Title,Body (HTML),Tags,Option1 Value,Option2 Value,Option3 Value,Variant SKU
Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle,"Dolls Castle - 158CM B #S37 (SxD Gwen A)","158cm, B-Cup, Blue",B-Cup,158cm,Blue,Dolls Castle 158B + #S37
"""
        )

        issues = validate_shopify_rows(rows)

        self.assertEqual([], issues)


if __name__ == "__main__":
    unittest.main()

