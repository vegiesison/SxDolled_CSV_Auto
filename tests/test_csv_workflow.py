import csv
from pathlib import Path
import tempfile
import unittest

from sxdolled_csv_auto.csv_workflow import generate_csv, validate_csv


class CsvWorkflowTests(unittest.TestCase):
    def test_generate_csv_writes_shopify_file_and_pass_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            intake = tmpdir / "intake.csv"
            output = tmpdir / "output.csv"
            report = tmpdir / "qa.md"
            intake.write_text(
                "\n".join(
                    [
                        "Title,Body (HTML),Tags,Variant Price",
                        '"Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle","Dolls Castle - 158CM B #S37 (SxD Gwen A)\nMaterial: Silicone\nBust: 70 cm\nWaist: 52 cm\nHips: 85 cm\nWeight: 27kg","158cm, B-Cup, Ass, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Perky, Silicone, Pear, Waist 52cm, Hip 85cm, Tan, Neutral, Long Hair, Blue, Eyes Closed, Alien",1725',
                    ]
                ),
                encoding="utf-8",
            )

            issues = generate_csv(intake, output, report)

            self.assertEqual([], issues)
            with output.open(encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(1, len(rows))
            self.assertEqual("Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle", rows[0]["Title"])
            self.assertEqual("Blue", rows[0]["Option3 Value"])
            self.assertEqual("Eyes-Closed", rows[0]["Eye Colour 2 (product.metafields.custom.eye_colour_2)"])
            self.assertIn("Status: PASS", report.read_text(encoding="utf-8"))

    def test_validate_csv_reports_swap_issue(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            source = tmpdir / "bad.csv"
            report = tmpdir / "qa.md"
            source.write_text(
                "\n".join(
                    [
                        "Title,Body (HTML),Tags,Option1 Value,Option2 Value,Option3 Value,Variant SKU",
                        'Lira A (E-Cup) (164cm) | Red Nurse Fantasy Sex Doll | Dolls Castle,"Dolls Castle - 183CM E #JS063 Lira (SxD Lira A)","183cm, E-Cup, Blonde",E-Cup,164cm,Blonde,Dolls Castle 164E + #JS136 Lili',
                    ]
                ),
                encoding="utf-8",
            )

            issues = validate_csv(source, report)

            self.assertGreaterEqual(len(issues), 2)
            report_text = report.read_text(encoding="utf-8")
            self.assertIn("height-mismatch", report_text)
            self.assertIn("model-id-mismatch", report_text)


if __name__ == "__main__":
    unittest.main()
