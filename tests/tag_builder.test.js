const assert = require("node:assert/strict");
const {
  TAG_FIELDS,
  buildTags,
  extractBrandFromTitle,
  extractMeasurementsFromBody,
  extractTagValuesFromTitle,
  refreshTitleMeasurementsFromBody,
  removeSxdAliases,
  replaceTitleDescriptions,
} = require("../web/tag-builder.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("builds defaults and skips blank changeable tags", () => {
  const tags = buildTags({});

  assert.equal(
    tags,
    "Ass, Female, Full, Sex Doll, Tits, Vaginal & Anal, Pear, Fair, Neutral",
  );
  assert.equal(tags.includes("LHP"), false);
  assert.equal(tags.includes("Silicone"), false);
  assert.equal(tags.includes("Perky"), false);
});

test("omits default tag fields when they are explicitly blank", () => {
  const tags = buildTags({
    height: "28",
    ass: "Ass",
    cupSize: "",
    gender: "Female",
    full: "Full",
    productType: "Torsos",
    tits: "",
    vaginalAnal: "Vaginal & Anal",
    brand: "Yeloly",
    lhp: "LHP Good",
    material: "Silicone",
    breastShape: "",
    bodyShape: "",
    waistMeasurement: "60",
    hipMeasurement: "26",
    skinTone: "Fair",
    emotion: "",
  });

  assert.equal(
    tags,
    "28cm, Ass, Female, Full, Torsos, Vaginal & Anal, Yeloly, LHP Good, Silicone, Waist 60cm, Hip 26cm, Fair",
  );
  assert.equal(tags.includes("Tits"), false);
  assert.equal(tags.includes("Pear"), false);
  assert.equal(tags.includes("Neutral"), false);
});

test("formats numeric measurement inputs", () => {
  const tags = buildTags({
    height: "158",
    cupSize: "B-Cup",
    theme: "Anime",
    waistMeasurement: "52",
    hipMeasurement: "85",
    anythingExtra: ["Freckles", "Mole"],
  });

  assert.ok(tags.includes("158cm"));
  assert.ok(tags.includes("B-Cup"));
  assert.ok(tags.includes("Anime"));
  assert.ok(tags.includes("Waist 52cm"));
  assert.ok(tags.includes("Hip 85cm"));
  assert.ok(tags.includes("Freckles"));
  assert.ok(tags.includes("Mole"));
});

test("uses actual eye colour option values", () => {
  const eyeColour = TAG_FIELDS.find((field) => field.key === "eyeColour");

  assert.deepEqual(eyeColour.options, [
    "Yellow",
    "White",
    "Red",
    "Purple",
    "Pink",
    "Orange",
    "Grey",
    "Green",
    "Eyes Closed",
    "Brown",
    "Blue",
  ]);
});

test("uses actual anything extra option values", () => {
  const anythingExtra = TAG_FIELDS.find((field) => field.key === "anythingExtra");

  assert.deepEqual(anythingExtra.options, [
    "Mouth (Oral)",
    "Freckles",
    "Mole",
    "Penetrable Nipples",
    "Seamless (All In One)",
    "Detachable",
    "High End",
    "Robot Doll",
    "Tattoo",
  ]);
});

test("custom input overrides dropdown value", () => {
  const tags = buildTags({
    hairColour: "Blue",
    hairColourCustom: "Auburn",
    eyeColour: "Blue",
    eyeColourCustom: "Hazel Eyes",
    brandCustom: "New Brand Doll",
  });

  assert.ok(tags.includes("Auburn"));
  assert.ok(tags.includes("Hazel Eyes"));
  assert.ok(tags.includes("New Brand Doll"));
  assert.equal(tags.includes("Blue,"), false);
});

test("extracts labelled body measurements for tag prefill", () => {
  const measurements = extractMeasurementsFromBody(`
    <p>Height: 158 cm</p>
    <p>Weight: 27kg</p>
    <p>Material: Silicone</p>
    <p>Waist Measurement - 52CM</p>
    <p>Hips: 85 cm</p>
  `);

  assert.deepEqual(measurements, {
    height: "158",
    weight: "27",
    material: "Silicone",
    waistMeasurement: "52",
    hipMeasurement: "85",
  });
});

test("extracts cup size from body text", () => {
  const measurements = extractMeasurementsFromBody(`
    Height: 83cm
    Cup Size: D cup
    Upper Bust: 77cm
    Under Bust: 60cm
  `);

  assert.equal(measurements.height, "83");
  assert.equal(measurements.cupSize, "D-Cup");
});

test("prioritizes labelled cup size over calculated bust difference", () => {
  const measurements = extractMeasurementsFromBody(`
    Neck Circumference： 27cm
    Shoulder Width： 31cm
    Upper Bust： 93cm
    Under Bust： 62cm
    Cup Size： I cup
    Waist： 58cm
    Hip： 91cm
  `);

  assert.equal(measurements.cupSize, "I-Cup");
  assert.equal(measurements.height || "", "");
});

test("calculates cup size from upper and lower bust using US inch steps", () => {
  const measurements = extractMeasurementsFromBody(`
    Height: 83cm
    Full Bust: 77 cm
    Lower Bust: 60 cm
  `);

  assert.equal(measurements.cupSize, "G-Cup");
});

test("refreshes only cup size and height in title from body html", () => {
  const title = refreshTitleMeasurementsFromBody(
    "Arlene A (E-Cup) (76cm) | Busty Black Lingerie Sex Doll Torso | Yeloly Doll",
    `
      Weight: 18kg
      Height: 83cm
      Cup Size: D cup
      Upper Bust: 77cm
      Under Bust: 60cm
    `
  );

  assert.equal(title, "Arlene A (D-Cup) (83cm) | Busty Black Lingerie Sex Doll Torso | Yeloly Doll");
});

test("extracts supported material values from body text", () => {
  const silicone = extractMeasurementsFromBody("Material: Silicone");
  const hybrid = extractMeasurementsFromBody("Material: TPE & Silicone");

  assert.equal(silicone.material, "Silicone");
  assert.equal(hybrid.material, "TPE & Silicone");
});

test("extracts Castle first-line height and flexible hip labels", () => {
  const measurements = extractMeasurementsFromBody(`
    Dolls Castle - 163CM D #S37 (SxD Gwen A)
    Hip 90cm
    Waist: 56 cm
  `);

  assert.equal(measurements.height, "163");
  assert.equal(measurements.hipMeasurement, "90");
  assert.equal(measurements.waistMeasurement, "56");
});

test("extracts hipline and waistline labels for tag prefill", () => {
  const measurements = extractMeasurementsFromBody(`
    Waistline 53cm
    Hipline: 92 cm
    WAIST LINE listed as 54 cm
    hip line measurement is 93 cm
  `);

  assert.equal(measurements.waistMeasurement, "53");
  assert.equal(measurements.hipMeasurement, "92");
});

test("extracts hip girth and waist girth labels for tag prefill", () => {
  const measurements = extractMeasurementsFromBody(`
    Waist Girth: 54 cm
    Hip Girth - 94cm
  `);

  assert.equal(measurements.waistMeasurement, "54");
  assert.equal(measurements.hipMeasurement, "94");
});

test("extracts spaced hip line and waist line labels case-insensitively", () => {
  const measurements = extractMeasurementsFromBody(`
    WAIST LINE listed as 54 cm
    hip line measurement is 93 cm
  `);

  assert.equal(measurements.waistMeasurement, "54");
  assert.equal(measurements.hipMeasurement, "93");
});

test("extracts circumference and net weight labels for tag prefill", () => {
  const measurements = extractMeasurementsFromBody(`
    Net Weight: 28kg
    Waist Circumference: 55 cm
    Hip Circumference - 95cm
  `);

  assert.equal(measurements.weight, "28");
  assert.equal(measurements.waistMeasurement, "55");
  assert.equal(measurements.hipMeasurement, "95");
});

test("prioritizes a net line with kilograms over other body weights", () => {
  for (const netLine of [
    "Net weight (including head and tail): 34 kg",
    "nEt Weight: 34kg",
    "Weight (NET, including 2 accessories): 34 kg",
    "Net: 34 kg",
  ]) {
    const measurements = extractMeasurementsFromBody(`<p>Weight: 40kg</p><p>${netLine}</p><p>Gross weight: 45kg</p>`);
    assert.equal(measurements.weight, "34", netLine);
  }
  assert.equal(extractMeasurementsFromBody("Net weight: pending\nWeight: 40kg").weight, "40");
});

test("extracts the following number after hip and waist keywords on a line", () => {
  const measurements = extractMeasurementsFromBody(`
    waist circumference approx measurement listed: 56 cm | 22 in
    HIP CIRCUMFERENCE about measurement listed: 96 cm | 37.8 in
  `);

  assert.equal(measurements.waistMeasurement, "56");
  assert.equal(measurements.hipMeasurement, "96");
});

test("extracts exact brand from anywhere in the title", () => {
  const match = extractBrandFromTitle("Elsa Babe Doll - 148CM L Pink RAD058 Endo Fuuka The Secret of the Folding Fan (SxD )");

  assert.equal(match.brand, "Elsa Babe Doll");
  assert.equal(match.confidence, 1);
});

test("extracts Yeloly as a known brand", () => {
  const match = extractBrandFromTitle("YL-7 Clara (YL07-1) | Yeloly");

  assert.equal(match.brand, "Yeloly");
  assert.equal(match.confidence, 1);
});

test("extracts near brand match when confidence is at least 90 percent", () => {
  const match = extractBrandFromTitle("148CM L Pink Elsa Bab Doll RAD058 Endo Fuuka");

  assert.equal(match.brand, "Elsa Babe Doll");
  assert.ok(match.confidence >= 0.9);
});

test("leaves brand blank when title match is below 90 percent", () => {
  const match = extractBrandFromTitle("148CM L Pink Elsa Doll RAD058 Endo Fuuka");

  assert.equal(match.brand, "");
  assert.ok(match.confidence < 0.9);
});

test("extracts cup size, height, and brand from fixed title format", () => {
  const values = extractTagValuesFromTitle("Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Doll");

  assert.deepEqual(values, {
    cupSize: "H-Cup",
    height: "164",
    brand: "MD Doll",
  });
});

test("uses the final title segment verbatim as brand", () => {
  const values = extractTagValuesFromTitle("Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | MD Dol");

  assert.equal(values.brand, "MD Dol");
});

test("accepts brands outside the old dropdown list", () => {
  const values = extractTagValuesFromTitle("Ella B (H-Cup) (164cm) | Fit Brunette Asian Sex Doll | M Doll");

  assert.equal(values.brand, "M Doll");
  assert.equal(extractTagValuesFromTitle("Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll | Yue Doll").brand, "Yue Doll");
  assert.equal(extractTagValuesFromTitle("Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll |").brand, "");
});

test("removes only parenthesized SxD aliases without changing other names or line breaks", () => {
  assert.equal(removeSxdAliases("Model (SxD Josie B) (ROS)\nMaterial: Silicone\n(SxD Kelly K)\nWeight: 34kg"), "Model (ROS)\nMaterial: Silicone\n\nWeight: 34kg");
  assert.equal(removeSxdAliases("(sxd Josie B) Model (SxD Josie B)"), " Model");
  assert.equal(removeSxdAliases("Model (SxDoll Collection)"), "Model (SxDoll Collection)");
});

test("replaces ordered descriptions while preserving identity, product type, and brand", () => {
  const titles = [
    "Lyora (B-Cup) (155cm) | Pink-Haired Catgirl Sex Doll | Moonvale Doll",
    "Kelly K (I-Cup) (165cm) | Red Nurse Sex Doll Torso | Yue Doll",
  ];
  assert.deepEqual(replaceTitleDescriptions(titles, "Brunette Bikini Woman\r\nBlonde Lingerie Woman\r\n"), [
    "Lyora (B-Cup) (155cm) | Brunette Bikini Woman Sex Doll | Moonvale Doll",
    "Kelly K (I-Cup) (165cm) | Blonde Lingerie Woman Sex Doll Torso | Yue Doll",
  ]);
  assert.throws(() => replaceTitleDescriptions(titles, "One Description"), /2 descriptions/);
  assert.throws(() => replaceTitleDescriptions(titles, "One Description\n\nThree Description"), /2 descriptions/);
  assert.throws(() => replaceTitleDescriptions(titles, "One Description\nBad | Brand"), /Product 2/);
  assert.equal(titles[0], "Lyora (B-Cup) (155cm) | Pink-Haired Catgirl Sex Doll | Moonvale Doll");
});
