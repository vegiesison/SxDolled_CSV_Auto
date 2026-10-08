const assert = require("node:assert/strict");
const {
  generateCsv,
  generateShopifyRow,
  parseCsv,
  refreshVariantSkuBodyDetails,
} = require("../web/csv-generator.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("fills fields from Title, Body HTML, and Tags", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml:
      "Dolls Castle - 158CM B #S37 (SxD Gwen A)\n" +
      "Material: Silicone\n" +
      "Waist: 52 cm\n" +
      "Hips: 85 cm\n" +
      "Weight: 27kg",
    tags:
      "158cm, B-Cup, Ass, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Perky, Silicone, Pear, Waist 52cm, Hip 85cm, Tan, Neutral, Long Hair, Blue, Eyes Closed, Alien",
  });

  assert.equal(row.Title, "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle");
  assert.equal(row.Vendor, "Dolls Castle");
  assert.equal(row["Option1 Value"], "B-Cup");
  assert.equal(row["Option2 Value"], "158cm");
  assert.equal(row["Option3 Value"], "Blue");
  assert.equal(row["Variant SKU"], "Dolls Castle 158B + S #S37");
  assert.equal(row["Variant Grams"], "27000");
  assert.equal(row["Eye Colour 2 (product.metafields.custom.eye_colour_2)"], "Eyes-Closed");
  assert.equal(row["Hair Colour 2 (product.metafields.custom.hair_colour_2)"], "blue");
});

test("does not treat eye colour tags as hair colour", () => {
  const row = generateShopifyRow({
    title: "Nyla B (E-Cup) (183cm) | Blue Lace Beauty Sex Doll | Dolls Castle",
    bodyHtml: "Dolls Castle - 183CM E #JS061 Nyla (SxD Nyla B)",
    tags: "183cm, E-Cup, Sex Doll, Dolls Castle, Brunette, Blue",
  });

  assert.equal(row["Option3 Value"], "Brunette");
  assert.equal(row["Hair Colour 2 (product.metafields.custom.hair_colour_2)"], "brunette");
  assert.equal(row["Eye Colour 2 (product.metafields.custom.eye_colour_2)"], "blue");
});

test("builds variant SKU from title brand and body parts", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
  });

  assert.equal(row["Variant SKU"], "MD Doll 164B + S #164B + M73 Ella");
});

test("applies Shopify defaults and detected brand for non-Castle products", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Torso | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone\nWeight: 32kg",
    tags: "164cm, H-Cup, Torsos, MD Doll, Waist 52.6cm, Hip 84.4cm",
  });

  assert.equal(row.Vendor, "MD Doll");
  assert.equal(row["Product Category"], "Mature > Erotic > Sex Toys & Erotic Games");
  assert.equal(row.Type, "Sex Torso");
  assert.equal(row.Published, "TRUE");
  assert.equal(row["Variant SKU"], "MD Doll 164B + T #164B + M73 Ella");
  assert.equal(row["Variant Inventory Tracker"], "shopify");
  assert.equal(row["Variant Inventory Qty"], "8");
  assert.equal(row["Variant Inventory Policy"], "continue");
  assert.equal(row["Variant Fulfillment Service"], "manual");
  assert.equal(row["Variant Requires Shipping"], "TRUE");
  assert.equal(row["Variant Taxable"], "TRUE");
  assert.equal(row["Gift Card"], "FALSE");
  assert.equal(row["Brand 2 (product.metafields.custom.brand_2)"], "md-doll");
  assert.equal(row["Hip Measurements (product.metafields.custom.hip_measurements)"], "84cm");
  assert.equal(row["Waist Measurements (product.metafields.custom.waist_measurements)"], "53cm");
  assert.equal(row["Variant Weight Unit"], "kg");
  [
    "Included / Australia",
    "Included / Canada",
    "Included / Europe",
    "Included / International",
    "Included / New Zealand",
    "Included / U.K.",
    "Included / U.S.",
  ].forEach((market) => assert.equal(row[market], "TRUE"));
  assert.equal(row.Status, "draft");
});

test("uses editable status and included market values", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
    status: "draft",
    includedMarkets: {
      "Included / Australia": "FALSE",
      "Included / Canada": "TRUE",
      "Included / Europe": "FALSE",
    },
  });

  assert.equal(row.Status, "draft");
  assert.equal(row["Included / Australia"], "FALSE");
  assert.equal(row["Included / Canada"], "TRUE");
  assert.equal(row["Included / Europe"], "FALSE");
  assert.equal(row["Included / U.S."], "TRUE");
});

test("exports full brand slug, theme, and multiple extras on separate lines", () => {
  const row = generateShopifyRow({
    title: "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe",
    bodyHtml: "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: Silicone",
    tags: "148cm, L-Cup, Sex Doll, Elsa Babe Doll, Anime, Mouth (Oral), Penetrable Nipples, Tattoo",
  });

  assert.equal(row["Brand 2 (product.metafields.custom.brand_2)"], "elsa-babe-doll");
  assert.equal(row["Theme (product.metafields.custom.theme)"], "Anime");
  assert.equal(row["Other (product.metafields.custom.other)"], "Mouth (Oral)\nPenetrable Nipples\nTattoo");
});

test("builds variant SKU when original name starts immediately after model id", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml: "Dolls Castle - 158CM B #S37(SxD Gwen A)\nMaterial: Silicone",
    tags: "158cm, B-Cup, Sex Doll, Dolls Castle",
  });

  assert.equal(row["Variant SKU"], "Dolls Castle 158B + S #S37");
});

test("builds variant SKU from body text with restored tag defaults", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml:
      "Dolls Castle - 158CM B #S37(SxD Gwen A)\n" +
      "Material: Silicone\n" +
      "Bust: 70 cm\n" +
      "Underbust: 58 cm\n" +
      "Waist: 52 cm\n" +
      "Hips: 85 cm",
    tags:
      "158cm, Ass, B-Cup, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Silicone, Perky, Pear, Waist 52cm, Hip 85cm, Fair, Neutral",
  });

  assert.equal(row["Variant SKU"], "Dolls Castle 158B + S #S37");
});

test("builds variant SKU from title brand when body has no brand prefix", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml:
      "158CM B #S37(SxD Gwen A)\n" +
      "Material: Silicone\n" +
      "Bust: 70 cm\n" +
      "Underbust: 58 cm\n" +
      "Waist: 52 cm\n" +
      "Hips: 85 cm",
    tags:
      "158cm, Ass, B-Cup, Female, Full, Sex Doll, Tits, Vaginal & Anal, Dolls Castle, Silicone, Perky, Pear, Waist 52cm, Hip 85cm, Fair, Neutral",
  });

  assert.equal(row["Variant SKU"], "Dolls Castle 158B + S #S37");
});

test("builds variant SKU from no-hash cm cup body line with color before model", () => {
  const row = generateShopifyRow({
    title: "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe Doll",
    bodyHtml: "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: Silicone",
    tags: "148cm, L-Cup, Sex Doll, Elsa Babe Doll",
  });

  assert.equal(row["Variant SKU"], "Elsa Babe Doll 148L + S #RAD058 Endo Fuuka The Secret of the Folding Fan");
});

test("builds variant SKU from no-hash compact body line and keeps full original name", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "164B (cm) (H cup) + M73 (Ella)--Natural\nMaterial: Silicone",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
  });

  assert.equal(row["Variant SKU"], "MD Doll 164B + S #164B + M73 Ella Natural");
});

test("builds variant SKU from name-first body with measurement lines", () => {
  const row = generateShopifyRow({
    title: "Aura (E-Cup) (163cm) | Curvy Happy Blonde AI Sex Doll | JigglyJoy",
    bodyHtml:
      "JigglyJoy Aura AI doll\n" +
      "Height with Head          163cm | 5'4\"ft\n" +
      "Net weight                38kg | 83.78lbs\n" +
      "Cup Size                  E cup\n" +
      "Waist                     53cm\n" +
      "Hips                      92cm",
    tags: "163cm, E-Cup, Sex Doll, JigglyJoy, Silicone",
  });

  assert.equal(row["Variant SKU"], "JigglyJoy 163cm + #JigglyJoy Aura AI doll");
  assert.equal(row["Variant Grams"], "38000");
  assert.equal(row["Weight (product.metafields.custom.weight)"], "38kg");
  assert.equal(row["Weight 2 (product.metafields.custom.weight_2)"], "38");
});

test("omits material code for no-hash body line when material is TPE", () => {
  const row = generateShopifyRow({
    title: "Endo Fuuka (L-Cup) (148cm) | Folding Fan Anime Sex Doll | Elsa Babe Doll",
    bodyHtml: "148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan\nMaterial: TPE",
    tags: "148cm, L-Cup, Sex Doll, Elsa Babe Doll",
  });

  assert.equal(row["Variant SKU"], "Elsa Babe Doll 148L + #RAD058 Endo Fuuka The Secret of the Folding Fan");
});

test("omits material code for TPE variant SKU", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: TPE",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
  });

  assert.equal(row["Variant SKU"], "MD Doll 164B + #164B + M73 Ella");
});

test("uses editable variant SKU override when provided", () => {
  const row = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
    variantSku: "MANUAL-SKU-001",
  });

  assert.equal(row["Variant SKU"], "MANUAL-SKU-001");
});

test("refreshes Yeloly model-code SKU prefix and body details from body html", () => {
  const sku = refreshVariantSkuBodyDetails("Yeloly Doll 76E + #18.YELOLY Silicone Torso Doll", {
    title: "Isla B (E-Cup) (76cm) | Busty Brunette Lingerie Sex Doll Torso | Yeloly",
    bodyHtml: "YL-13+head (ROS) #Y15 Isla (YL13-Y15)",
    tags: "76cm, Ass, E-Cup, Female, Full, Torsos, Tits, Vaginal & Anal, Yeloly",
  });

  assert.equal(sku, "Yeloly Doll - YL-13+head + T #YL-13+head (ROS) #Y15 Isla (YL13-Y15)");
});

test("refreshes Yeloly model-code SKU from body html with full-width brackets", () => {
  const sku = refreshVariantSkuBodyDetails("Yeloly Doll 76E + #YL-22 Blade (YL22)", {
    title: "Carey (E-Cup) (76cm) | Seductive Male Mannequin Sex Doll Torso | Yeloly",
    bodyHtml: "YL-7+head（ROS）#588 Carey（YL07-588）",
    tags: "76cm, Ass, E-Cup, Female, Full, Torsos, Tits, Vaginal & Anal, Yeloly",
  });

  assert.equal(sku, "Yeloly Doll - YL-7+head + T #YL-7+head（ROS）#588 Carey（YL07-588）");
});

test("refreshes compact Yeloly body-code SKU when tags still say sex doll", () => {
  const sku = refreshVariantSkuBodyDetails("Yeloly Doll 76E + #B11+head (ROS) 839 Freya (YLB11-839)", {
    title: "Freya K (E-Cup) (76cm) | Curvy Full-Body Silicone Sex Doll Torso | Yeloly Doll",
    bodyHtml: "B11+head (ROS) 839 Freya (YLB11-839)",
    tags: "76cm, Ass, E-Cup, Female, Full, Sex Doll, Tits, Vaginal & Anal, Yeloly, Pear, Fair, Neutral",
  });

  assert.equal(sku, "Yeloly Doll - B11+head + T #B11+head (ROS) 839 Freya (YLB11-839)");
});

test("keeps variant SKU unchanged when body html has no refreshable detail", () => {
  const sku = refreshVariantSkuBodyDetails("Yeloly Doll 76E + #18.YELOLY Silicone Torso Doll", {
    title: "Isla B (E-Cup) (76cm) | Busty Brunette Lingerie Sex Doll Torso | Yeloly",
    bodyHtml: "Height: 76cm",
    tags: "76cm, Ass, E-Cup, Female, Full, Torsos, Tits, Vaginal & Anal, Yeloly",
  });

  assert.equal(sku, "Yeloly Doll 76E + #18.YELOLY Silicone Torso Doll");
});

test("exports editable variant SKU override in CSV", () => {
  const csv = generateCsv([
    {
      title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
      bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
      tags: "164cm, H-Cup, Sex Doll, MD Doll",
      variantSku: "MANUAL-SKU-001",
    },
  ]);
  const rows = parseCsv(csv);

  assert.equal(rows[0]["Variant SKU"], "MANUAL-SKU-001");
});

test("uses editable variant price and one weight input for weight columns", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml: "Dolls Castle - 158CM B #S37 (SxD Gwen A)",
    tags: "158cm, B-Cup, Sex Doll, Dolls Castle",
    variantPrice: "1725",
    weightKg: "32",
  });

  assert.equal(row["Variant Price"], "1725");
  assert.equal(row["Variant Grams"], "32000");
  assert.equal(row["Weight (product.metafields.custom.weight)"], "32kg");
  assert.equal(row["Weight 2 (product.metafields.custom.weight_2)"], "32");
});

test("editable weight input overrides body weight for weight columns", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml: "Dolls Castle - 158CM B #S37 (SxD Gwen A)\nWeight: 27kg",
    tags: "158cm, B-Cup, Sex Doll, Dolls Castle",
    weightKg: "32",
  });

  assert.equal(row["Variant Grams"], "32000");
  assert.equal(row["Weight (product.metafields.custom.weight)"], "32kg");
  assert.equal(row["Weight 2 (product.metafields.custom.weight_2)"], "32");
});

test("prioritizes a net line with kilograms for CSV weight columns", () => {
  for (const netLine of [
    "Net weight (including head and tail): 34 kg",
    "nEt Weight: 34kg",
    "Weight (NET, including 2 accessories): 34 kg",
    "Net: 34 kg",
  ]) {
    const row = generateShopifyRow({
      title: "Gwen A (B-Cup) (158cm) | Dolls Castle",
      bodyHtml: `Weight: 40kg\n${netLine}\nGross weight: 45kg`,
      tags: "158cm, B-Cup, Dolls Castle",
    });
    assert.equal(row["Variant Grams"], "34000", netLine);
    assert.equal(row["Weight (product.metafields.custom.weight)"], "34kg", netLine);
    assert.equal(row["Weight 2 (product.metafields.custom.weight_2)"], "34", netLine);
  }
});

test("uses a filename height without inventing a body code from cup size", () => {
  const product = {
    title: "Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll | Yue Doll",
    bodyHtml: "165cm Integrated Head and Body - Kelly\nMaterial: Silicone",
    tags: "165cm, I-Cup, Sex Doll, Yue Doll",
  };
  assert.equal(generateShopifyRow(product)["Variant SKU"], "Yue Doll 165cm + S #165cm Integrated Head and Body - Kelly");
  assert.equal(refreshVariantSkuBodyDetails("Yue Doll 165I + S #Old Kelly", product), "Yue Doll 165cm + S #165cm Integrated Head and Body - Kelly");
  assert.equal(generateShopifyRow({ ...product, bodyHtml: "Integrated Head and Body - Kelly\nMaterial: Silicone" })["Variant SKU"], "Yue Doll 165cm + S #Integrated Head and Body - Kelly");
  assert.equal(generateShopifyRow({ ...product, bodyHtml: "YL-13+head (ROS) #Kelly\nMaterial: Silicone" })["Variant SKU"], "Yue Doll YL-13+head + S #YL-13+head ROS #Kelly");
});

test("rounds decimal weight input for weight metafields", () => {
  const row = generateShopifyRow({
    title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
    bodyHtml: "Dolls Castle - 158CM B #S37 (SxD Gwen A)",
    tags: "158cm, B-Cup, Sex Doll, Dolls Castle",
    weightKg: "32.6",
  });

  assert.equal(row["Variant Grams"], "32600");
  assert.equal(row["Weight (product.metafields.custom.weight)"], "33kg");
  assert.equal(row["Weight 2 (product.metafields.custom.weight_2)"], "33");
});

test("uses hybrid and torso material codes for variant SKU", () => {
  const hybridRow = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: TPE & Silicone",
    tags: "164cm, H-Cup, Sex Doll, MD Doll",
  });
  const torsoRow = generateShopifyRow({
    title: "Ella B (H-Cup) (164cm) | Fit Brunette Asian Torso | MD Doll",
    bodyHtml: "MD Doll - 164B #164B (cm) (H cup) + M73 (Ella)\nMaterial: Silicone",
    tags: "164cm, H-Cup, Torsos, MD Doll",
  });

  assert.equal(hybridRow["Variant SKU"], "MD Doll 164B + H #164B + M73 Ella");
  assert.equal(torsoRow["Variant SKU"], "MD Doll 164B + T #164B + M73 Ella");
});

test("exports one CSV row per product", () => {
  const csv = generateCsv([
    {
      title: "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle",
      bodyHtml: "Dolls Castle - 158CM B #S37 (SxD Gwen A)\nWeight: 27kg",
      tags: "158cm, B-Cup, Sex Doll, Dolls Castle, Blue, Eyes Closed",
    },
    {
      title: "Nyla B (E-Cup) (183cm) | Blue Lace Beauty Sex Doll | Dolls Castle",
      bodyHtml: "Dolls Castle - 183CM E #JS061 Nyla (SxD Nyla B)",
      tags: "183cm, E-Cup, Sex Doll, Dolls Castle, Brunette, Blue",
    },
  ]);
  const rows = parseCsv(csv);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].Title, "Gwen A (B-Cup) (158cm) | Mystical Blindfold Elf Sex Doll | Dolls Castle");
  assert.equal(rows[1].Title, "Nyla B (E-Cup) (183cm) | Blue Lace Beauty Sex Doll | Dolls Castle");
});
