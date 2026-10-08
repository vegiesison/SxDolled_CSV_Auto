import unittest

from sxdolled_csv_auto.generator import generate_shopify_row


class ShopifyCsvGenerationTests(unittest.TestCase):
    def test_prioritizes_net_line_with_kilograms_for_weight_columns(self):
        for net_line in (
            "Net weight (including head and tail): 34 kg",
            "nEt Weight: 34kg",
            "Weight (NET, including 2 accessories): 34 kg",
            "Net: 34 kg",
        ):
            with self.subTest(net_line=net_line):
                row = generate_shopify_row(
                    {
                        "Title": "Gwen A (B-Cup) (158cm) | Dolls Castle",
                        "Body (HTML)": f"Weight: 40kg\n{net_line}\nGross weight: 45kg",
                        "Tags": "158cm, B-Cup, Dolls Castle",
                    }
                )
                self.assertEqual("34000", row["Variant Grams"])
                self.assertEqual("34kg", row["Weight (product.metafields.custom.weight)"])
                self.assertEqual("34", row["Weight 2 (product.metafields.custom.weight_2)"])

    def test_generates_castle_product_row_from_three_source_fields(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 158CM B #S37 (SxD Gwen A)\nMaterial: Silicone\nBust: 70 cm\nWaist: 52 cm\nHips: 85 cm\nWeight: 27kg",
                "Tags": "158cm, B-Cup, Ass, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Perky, Silicone, Pear, Waist 52cm, Hip 85cm, Tan, Neutral, Long Hair, Blue, Eyes Closed, Alien",
            }
        )

        self.assertEqual(
            "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
            row["Title"],
        )
        self.assertIn("Weight: 27kg", row["Body (HTML)"])
        self.assertEqual("Dolls Castle", row["Vendor"])
        self.assertEqual("Dolls Castle 158B + S #S37", row["Variant SKU"])
        self.assertEqual("27000", row["Variant Grams"])
        self.assertEqual("B-Cup", row["Option1 Value"])
        self.assertEqual("158cm", row["Option2 Value"])
        self.assertEqual("Blue", row["Option3 Value"])
        self.assertEqual("Eyes-Closed", row["Eye Colour 2 (product.metafields.custom.eye_colour_2)"])
        self.assertEqual("blue", row["Hair Colour 2 (product.metafields.custom.hair_colour_2)"])
        self.assertEqual("dolls-castle", row["Brand 2 (product.metafields.custom.brand_2)"])

    def test_applies_shopify_defaults_and_detected_brand_for_non_castle_products(self):
        row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Torso | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone\nWeight: 32kg",
                "Tags": "164cm, H-Cup, Torsos, MD Doll, Waist 52.6cm, Hip 84.4cm",
            }
        )

        self.assertEqual("MD Doll", row["Vendor"])
        self.assertEqual("Mature > Erotic > Sex Toys & Erotic Games", row["Product Category"])
        self.assertEqual("Sex Torso", row["Type"])
        self.assertEqual("TRUE", row["Published"])
        self.assertEqual("MD Doll 164B + T #164B + M73 Ella", row["Variant SKU"])
        self.assertEqual("shopify", row["Variant Inventory Tracker"])
        self.assertEqual("8", row["Variant Inventory Qty"])
        self.assertEqual("continue", row["Variant Inventory Policy"])
        self.assertEqual("manual", row["Variant Fulfillment Service"])
        self.assertEqual("TRUE", row["Variant Requires Shipping"])
        self.assertEqual("TRUE", row["Variant Taxable"])
        self.assertEqual("FALSE", row["Gift Card"])
        self.assertEqual("md-doll", row["Brand 2 (product.metafields.custom.brand_2)"])
        self.assertEqual("84cm", row["Hip Measurements (product.metafields.custom.hip_measurements)"])
        self.assertEqual("53cm", row["Waist Measurements (product.metafields.custom.waist_measurements)"])
        self.assertEqual("kg", row["Variant Weight Unit"])
        for market in (
            "Included / Australia",
            "Included / Canada",
            "Included / Europe",
            "Included / International",
            "Included / New Zealand",
            "Included / U.K.",
            "Included / U.S.",
        ):
            self.assertEqual("TRUE", row[market])
        self.assertEqual("active", row["Status"])

    def test_allows_status_and_included_market_overrides(self):
        row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
                "Tags": "164cm, H-Cup, Sex Doll, MD Doll",
                "Status": "draft",
                "Included / Australia": "FALSE",
                "Included / Europe": "FALSE",
            }
        )

        self.assertEqual("draft", row["Status"])
        self.assertEqual("FALSE", row["Included / Australia"])
        self.assertEqual("FALSE", row["Included / Europe"])
        self.assertEqual("TRUE", row["Included / U.S."])

    def test_exports_full_brand_slug_theme_and_multiple_other_values(self):
        row = generate_shopify_row(
            {
                "Title": "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe",
                "Body (HTML)": "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: Silicone",
                "Tags": "148cm, L-Cup, Sex Doll, Elsa Babe Doll, Anime, Mouth (Oral), Penetrable Nipples, Tattoo",
            }
        )

        self.assertEqual("elsa-babe-doll", row["Brand 2 (product.metafields.custom.brand_2)"])
        self.assertEqual("Anime", row["Theme (product.metafields.custom.theme)"])
        self.assertEqual("Mouth (Oral)\nPenetrable Nipples\nTattoo", row["Other (product.metafields.custom.other)"])

    def test_does_not_confuse_eye_colour_with_hair_colour(self):
        row = generate_shopify_row(
            {
                "Title": "Nyla B (E-Cup) (183cm) | Blue Lace Beauty Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 183CM E #JS061 Nyla (SxD Nyla B)",
                "Tags": "183cm, E-Cup, Sex Doll, Dolls Castle, Brunette, Blue",
            }
        )

        self.assertEqual("Brunette", row["Option3 Value"])
        self.assertEqual("brunette", row["Hair Colour 2 (product.metafields.custom.hair_colour_2)"])
        self.assertEqual("blue", row["Eye Colour 2 (product.metafields.custom.eye_colour_2)"])

    def test_builds_variant_sku_from_title_brand_and_body_parts(self):
        row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
                "Tags": "164cm, H-Cup, Sex Doll, MD Doll",
            }
        )

        self.assertEqual("MD Doll 164B + S #164B + M73 Ella", row["Variant SKU"])

    def test_builds_variant_sku_when_original_name_starts_immediately_after_model_id(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 158CM B #S37(SxD Gwen A)\nMaterial: Silicone",
                "Tags": "158cm, B-Cup, Sex Doll, Dolls Castle",
            }
        )

        self.assertEqual("Dolls Castle 158B + S #S37", row["Variant SKU"])

    def test_builds_variant_sku_from_title_brand_when_body_has_no_brand_prefix(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "158CM B #S37(SxD Gwen A)\nMaterial: Silicone\nBust: 70 cm\nUnderbust: 58 cm\nWaist: 52 cm\nHips: 85 cm",
                "Tags": "158cm, Ass, B-Cup, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Silicone, Perky, Pear, Waist 52cm, Hip 85cm, Fair, Neutral",
            }
        )

        self.assertEqual("Dolls Castle 158B + S #S37", row["Variant SKU"])

    def test_builds_variant_sku_from_no_hash_cm_cup_body_line_with_color_before_model(self):
        row = generate_shopify_row(
            {
                "Title": "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe Doll",
                "Body (HTML)": "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: Silicone",
                "Tags": "148cm, L-Cup, Sex Doll, Elsa Babe Doll",
            }
        )

        self.assertEqual(
            "Elsa Babe Doll 148L + S #RAD058 Endo Fuuka The Secret of the Folding Fan",
            row["Variant SKU"],
        )

    def test_builds_variant_sku_from_no_hash_compact_body_line_and_keeps_full_original_name(self):
        row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
                "Body (HTML)": "164B (cm) (H cup) + M73 (Ella)--Natural\nMaterial: Silicone",
                "Tags": "164cm, H-Cup, Sex Doll, MD Doll",
            }
        )

        self.assertEqual("MD Doll 164B + S #164B + M73 Ella Natural", row["Variant SKU"])

    def test_builds_variant_sku_from_name_first_body_with_measurement_lines(self):
        row = generate_shopify_row(
            {
                "Title": "Aura (E-Cup) (163cm) | Curvy Happy Blonde AI Sex Doll | JigglyJoy",
                "Body (HTML)": (
                    "JigglyJoy Aura AI doll\n"
                    "Height with Head          163cm | 5'4\"ft\n"
                    "Net weight                38kg | 83.78lbs\n"
                    "Cup Size                  E cup\n"
                    "Waist                     53cm\n"
                    "Hips                      92cm"
                ),
                "Tags": "163cm, E-Cup, Sex Doll, JigglyJoy, Silicone",
            }
        )

        self.assertEqual("JigglyJoy 163E + #JigglyJoy Aura AI doll", row["Variant SKU"])
        self.assertEqual("38000", row["Variant Grams"])
        self.assertEqual("38kg", row["Weight (product.metafields.custom.weight)"])
        self.assertEqual("38", row["Weight 2 (product.metafields.custom.weight_2)"])

    def test_omits_material_code_for_no_hash_body_line_when_material_is_tpe(self):
        row = generate_shopify_row(
            {
                "Title": "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe Doll",
                "Body (HTML)": "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: TPE",
                "Tags": "148cm, L-Cup, Sex Doll, Elsa Babe Doll",
            }
        )

        self.assertEqual(
            "Elsa Babe Doll 148L + #RAD058 Endo Fuuka The Secret of the Folding Fan",
            row["Variant SKU"],
        )

    def test_omits_material_code_for_tpe_variant_sku(self):
        row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: TPE",
                "Tags": "164cm, H-Cup, Sex Doll, MD Doll",
            }
        )

        self.assertEqual("MD Doll 164B + #164B + M73 Ella", row["Variant SKU"])

    def test_uses_weight_input_for_all_weight_columns(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 158CM B #S37 (SxD Gwen A)",
                "Tags": "158cm, B-Cup, Sex Doll, Dolls Castle",
                "Variant Price": "1725",
                "weight_kg": "32",
            }
        )

        self.assertEqual("1725", row["Variant Price"])
        self.assertEqual("32000", row["Variant Grams"])
        self.assertEqual("32kg", row["Weight (product.metafields.custom.weight)"])
        self.assertEqual("32", row["Weight 2 (product.metafields.custom.weight_2)"])

    def test_weight_input_overrides_body_weight(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 158CM B #S37 (SxD Gwen A)\nWeight: 27kg",
                "Tags": "158cm, B-Cup, Sex Doll, Dolls Castle",
                "weight_kg": "32",
            }
        )

        self.assertEqual("32000", row["Variant Grams"])
        self.assertEqual("32kg", row["Weight (product.metafields.custom.weight)"])
        self.assertEqual("32", row["Weight 2 (product.metafields.custom.weight_2)"])

    def test_rounds_decimal_weight_input_for_weight_metafields(self):
        row = generate_shopify_row(
            {
                "Title": "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
                "Body (HTML)": "Dolls Castle - 158CM B #S37 (SxD Gwen A)",
                "Tags": "158cm, B-Cup, Sex Doll, Dolls Castle",
                "weight_kg": "32.6",
            }
        )

        self.assertEqual("32600", row["Variant Grams"])
        self.assertEqual("33kg", row["Weight (product.metafields.custom.weight)"])
        self.assertEqual("33", row["Weight 2 (product.metafields.custom.weight_2)"])

    def test_uses_hybrid_and_torso_material_codes_for_variant_sku(self):
        hybrid_row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: TPE & Silicone",
                "Tags": "164cm, H-Cup, Sex Doll, MD Doll",
            }
        )
        torso_row = generate_shopify_row(
            {
                "Title": "Ella B (H-Cup) (164cm) | Fit Brunette Asian Torso | MD Doll",
                "Body (HTML)": "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
                "Tags": "164cm, H-Cup, Torsos, MD Doll",
            }
        )

        self.assertEqual("MD Doll 164B + H #164B + M73 Ella", hybrid_row["Variant SKU"])
        self.assertEqual("MD Doll 164B + T #164B + M73 Ella", torso_row["Variant SKU"])


if __name__ == "__main__":
    unittest.main()
