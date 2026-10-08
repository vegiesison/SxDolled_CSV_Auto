(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SxDolledTagBuilder = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TAG_FIELDS = [
    { key: "height", label: "Height", type: "number", suffix: "cm" },
    { key: "ass", label: "Ass", options: ["Ass", "EU In Stock", "US In Stock", "CA In Stock"], defaultValue: "Ass" },
    { key: "cupSize", label: "Cup Size", options: ["A-Cup", "B-Cup", "C-Cup", "D-Cup", "E-Cup", "F-Cup", "G-Cup", "H-Cup", "I-Cup", "J-Cup", "K-Cup", "L-Cup", "M-Cup", "N-Cup", "O-Cup", "P-Cup", "Z-Cup"] },
    { key: "gender", label: "Gender", options: ["Female", "Male", "Shemale"], defaultValue: "Female" },
    { key: "full", label: "Full", options: ["Full"], defaultValue: "Full" },
    { key: "productType", label: "Product Type", options: ["Mini Dolls", "Sex Doll", "Sex Doll Head", "Torsos"], defaultValue: "Sex Doll" },
    { key: "tits", label: "Tits", options: ["Tits"], defaultValue: "Tits" },
    { key: "vaginalAnal", label: "Vaginal & Anal", options: ["Vaginal & Anal"], defaultValue: "Vaginal & Anal" },
    {
      key: "brand",
      label: "Brand",
      options: [
        "6YE Doll",
        "AF Doll",
        "Aibei Doll",
        "AITIA",
        "Angel Kiss",
        "AS Doll",
        "Bezlya",
        "B2.0",
        "B2.1",
        "B2.2",
        "B2.2CF",
        "B2.2L",
        "B2.2Max",
        "B2.2U",
        "Dolls Castle",
        "Climax Doll",
        "CLM Pro",
        "CLM Ultra",
        "Elsa Babe Doll",
        "EX Doll",
        "SEVO(EX)",
        "EVO(EX)",
        "Fanreal",
        "Fire Doll",
        "Firefly Diary",
        "FJ Doll",
        "Funwest Doll",
        "Galatea Doll",
        "Galaxy Doll",
        "Gynoid Doll",
        "HR Doll",
        "IDODOLL",
        "IronTech Doll",
        "Jarliet Doll",
        "JigglyJoy",
        "Jiusheng Doll",
        "JX Doll",
        "JY Doll",
        "Lily Doll",
        "Lusandy Doll",
        "Lushdoll",
        "MD Doll",
        "MMX Doll",
        "Normon Doll",
        "Orangein Doll",
        "Real Lady",
        "Ridmii Doll",
        "Rosretty Doll",
        "SE Doll",
        "SHEDOLL",
        "Sigafun",
        "SM Doll",
        "Starpery",
        "SY Doll",
        "Top CY Doll",
        "Top Fire Doll",
        "WM Doll",
        "XT Doll",
        "XYColo Doll",
        "Yeloly",
        "Yearn Doll",
      ],
    },
    { key: "lhp", label: "LHP", options: ["LHP Bad", "LHP Okay", "LHP Good"] },
    { key: "material", label: "Material", options: ["TPE", "S-TPE", "TPE & Silicone", "S-TPE & Silicone", "Silicone"] },
    { key: "breastShape", label: "Breast Shape", options: ["Perky", "Moderately Sagging", "Sagging"] },
    { key: "bodyShape", label: "Body Shape", options: ["Apple", "BBW", "hourglass", "Inverted Triangle", "Muscle", "Pear", "Rectangle", "Slim", "Thick", "One Piece", "Bimbo"], defaultValue: "Pear" },
    { key: "waistMeasurement", label: "Waist Measurement", type: "number", prefix: "Waist ", suffix: "cm" },
    { key: "hipMeasurement", label: "Hip Measurement", type: "number", prefix: "Hip ", suffix: "cm" },
    { key: "skinTone", label: "Skin Tone", options: ["Ebony", "Fair", "Natural", "Tan", "Blue Skin", "Green Skin", "Pink Skin", "Purple Skin", "Red Skin", "Yellow Skin"], defaultValue: "Fair" },
    { key: "emotion", label: "Emotion", options: ["Angry", "Happy", "Neutral", "Smiling", "Worried", "Surprised", "Sad", "Interested", "Fearful"], defaultValue: "Neutral" },
    { key: "hairLength", label: "Hair Length", options: ["Long Hair", "Short Hair"] },
    { key: "hairColour", label: "Hair Colour", options: ["Black", "Blonde", "Blue", "Brunette", "Green", "Grey", "Ombre", "Orange", "Pink", "Purple", "Red", "Silver", "White"] },
    { key: "eyeColour", label: "Eye Colour", options: ["Yellow", "White", "Red", "Purple", "Pink", "Orange", "Grey", "Green", "Eyes Closed", "Brown", "Blue"] },
    { key: "ethnicity", label: "Ethnicity", options: ["African American", "Asian", "Caucasian", "Latino", "Middle Eastern", "Indian"] },
    {
      key: "theme",
      label: "Theme",
      options: [
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
      ],
    },
    { key: "anythingExtra", label: "Anything Extra", type: "multi", options: ["Mouth (Oral)", "Freckles", "Mole", "Penetrable Nipples", "Seamless (All In One)", "Detachable", "High End", "Robot Doll", "Tattoo"] },
  ];
  const LABEL_SEPARATOR_PATTERN = "[:\\uFF1A=\\-\\u2013\\u2014]|is";
  const CM_PER_INCH = 2.54;
  const US_CUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Z"];

  function buildTags(values) {
    return TAG_FIELDS.map((field) => fieldValue(field, values)).filter(Boolean).join(", ");
  }

  function defaultTagValues() {
    return Object.fromEntries(TAG_FIELDS.map((field) => [field.key, field.defaultValue || ""]));
  }

  function extractMeasurementsFromBody(bodyHtml) {
    const text = htmlToText(bodyHtml);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const joined = lines.join("\n");
    const firstLine = lines[0] || "";
    const measurements = {};

    measurements.height = firstPresent(
      labelledMeasurement(joined, ["height", "body height", "standing height", "tall"], "cm"),
      firstLineHeightFallback(firstLine),
    );
    const netWeight = lines.filter((line) => /\bnet\b/i.test(line))
      .map((line) => line.match(/(\d+(?:\.\d+)?)\s*kg\b/i)?.[1]).find(Boolean);
    measurements.weight = netWeight ? numberText(netWeight) : labelledMeasurement(joined, ["weight", "net weight"], "kg");
    measurements.material = labelledOption(joined, "Material", TAG_FIELDS.find((field) => field.key === "material")?.options || []);
    measurements.cupSize = firstPresent(
      labelledCupSize(joined),
      calculatedCupSize(
        labelledFollowingNumber(joined, ["upper bust", "upper breast", "full bust", "over bust", "overbust", "bust", "chest"]),
        labelledFollowingNumber(joined, ["lower bust", "under bust", "underbust", "under breast", "underbreast", "under chest", "lower chest"])
      )
    );
    measurements.waistMeasurement = labelledFollowingNumber(joined, ["waist", "waist girth", "waist circumference", "waist line", "waistline", "waist measurement", "waist measurements"]);
    measurements.hipMeasurement = labelledFollowingNumber(joined, ["hip", "hip circumference", "hip line", "hipline", "hip measurement", "hip measurements", "hip girth", "hips"]);

    return Object.fromEntries(Object.entries(measurements).filter(([, value]) => Boolean(value)));
  }

  function refreshTitleMeasurementsFromBody(title, bodyHtml) {
    const measurements = extractMeasurementsFromBody(bodyHtml);
    const cup = measurements.cupSize;
    const height = measurements.height ? `${measurements.height}cm` : "";
    if (!cup && !height) return title;

    const parts = clean(title).split("|");
    let lead = parts.shift() || "";
    if (cup) lead = replaceOrAppendTitleToken(lead, /\([A-Z]\s*-\s*Cup\)/i, `(${cup})`);
    if (height) lead = replaceOrAppendTitleToken(lead, /\(\d+(?:\.\d+)?\s*cm\)/i, `(${height})`);

    return [lead.trim(), ...parts.map((part) => part.trim())].filter(Boolean).join(" | ");
  }

  function extractBrandFromTitle(title) {
    const brandField = TAG_FIELDS.find((field) => field.key === "brand");
    const candidates = brandField?.options || [];
    const titleTokens = tokenize(title);
    let best = { brand: "", confidence: 0 };

    for (const brand of candidates) {
      const brandTokens = tokenize(brand);
      if (!brandTokens.length || titleTokens.length < brandTokens.length) continue;

      for (let index = 0; index <= titleTokens.length - brandTokens.length; index += 1) {
        const windowTokens = titleTokens.slice(index, index + brandTokens.length);
        const confidence = phraseSimilarity(windowTokens, brandTokens);
        if (isBetterBrandMatch(confidence, brand, best)) {
          best = { brand, confidence };
        }
      }
    }

    return best.confidence >= 0.9 ? best : { brand: "", confidence: best.confidence };
  }

  function extractTagValuesFromTitle(title) {
    const values = {};
    const cup = title.match(/\(([A-Z])\s*-\s*Cup\)/i);
    const height = title.match(/\((\d+(?:\.\d+)?)\s*cm\)/i);
    const brandSegment = clean(title).split("|").map((part) => part.trim()).filter(Boolean).at(-1) || "";
    const brandMatch = extractBrandFromTitle(brandSegment || title);

    if (cup) values.cupSize = `${cup[1].toUpperCase()}-Cup`;
    if (height) values.height = numberText(height[1]);
    values.brand = brandMatch.brand || "";

    return values;
  }

  function fieldValue(field, values) {
    const custom = clean(values[`${field.key}Custom`]);
    if (custom) return custom;
    if (field.type === "multi") {
      const raw = Object.hasOwn(values, field.key) ? values[field.key] : field.defaultValue || [];
      return Array.isArray(raw) ? raw.filter(Boolean).join(", ") : clean(raw);
    }
    const raw = clean(Object.hasOwn(values, field.key) ? values[field.key] : field.defaultValue || "");
    if (!raw) return "";
    if (field.type === "number") {
      return measurement(raw, field);
    }
    return raw;
  }

  function measurement(raw, field) {
    const number = clean(raw).replace(/[^0-9.]/g, "");
    if (!number) return "";
    return `${field.prefix || ""}${number}${field.suffix || ""}`;
  }

  function labelledMeasurement(text, labels, unit) {
    for (const label of labels.sort((a, b) => b.length - a.length)) {
      const match = text.match(new RegExp(`(?:^|[^a-z])${escapeRegex(label)}\\s*(?:measurement|measurements)?\\s*(?:[:：=\\-–—]|is)?\\s*(\\d+(?:\\.\\d+)?)\\s*${escapeRegex(unit)}\\b`, "i"));
      if (match) return numberText(match[1]);
    }
    return "";
  }

  function labelledFollowingNumber(text, labels) {
    const lines = text.split(/\r?\n/);
    const sortedLabels = labels.slice().sort((a, b) => b.length - a.length);
    for (const line of lines) {
      for (const label of sortedLabels) {
        const match = line.match(new RegExp(`(?:^|[^a-z])${escapeRegex(label)}\\b`, "i"));
        if (!match) continue;
        const followingText = line.slice((match.index || 0) + match[0].length);
        const number = followingText.match(/\d+(?:\.\d+)?/);
        if (number) return numberText(number[0]);
      }
    }
    return "";
  }

  function labelledCupSize(text) {
    const labelledMatch = text.match(new RegExp(`(?:^|\\n)\\s*(?:cup size|cup|breast cup|bra size)\\s*(?:${LABEL_SEPARATOR_PATTERN})?\\s*([A-Z])\\s*(?:-?\\s*cup)?\\b`, "i"));
    if (labelledMatch) return `${labelledMatch[1].toUpperCase()}-Cup`;

    const labels = ["cup size", "cup", "breast cup", "bra size"];
    for (const label of labels) {
      const match = text.match(new RegExp(`(?:^|[^a-z])${escapeRegex(label)}\\s*(?:[:ï¼š=\\-â€“â€”]|is)?\\s*([A-Z])\\s*(?:-?\\s*cup)?\\b`, "i"));
      if (match) return `${match[1].toUpperCase()}-Cup`;
    }
    return "";
  }

  function calculatedCupSize(upperBust, lowerBust) {
    const upper = Number(upperBust);
    const lower = Number(lowerBust);
    if (!Number.isFinite(upper) || !Number.isFinite(lower) || upper <= lower) return "";
    const differenceInInches = (upper - lower) / CM_PER_INCH;
    const cupStep = Math.round(differenceInInches);
    if (cupStep < 1) return "";
    const index = Math.min(cupStep - 1, US_CUP_LETTERS.length - 1);
    return `${US_CUP_LETTERS[index]}-Cup`;
  }

  function replaceOrAppendTitleToken(value, pattern, replacement) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
    return `${value.trim()} ${replacement}`;
  }

  function firstLineHeightFallback(line) {
    const blockedLabels = /\b(?:neck|shoulder|bust|breast|chest|waist|hip|thigh|arm|leg|foot|feet|circumference|width|girth)\b/i;
    if (blockedLabels.test(line)) return "";
    return line.match(/\b(\d+(?:\.\d+)?)\s*cm\b/i)?.[1] || "";
  }

  function labelledOption(text, label, options) {
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${escapeRegex(label)}\\s*(?:[:：=\\-–—]|is)?\\s*([^\\n]+)`, "i"));
    if (!match) return "";
    const value = clean(match[1]);
    return options
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((option) => new RegExp(`\\b${escapeRegex(option)}\\b`, "i").test(value)) || "";
  }

  function htmlToText(value) {
    return clean(value)
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\r?\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ");
  }

  function tokenize(value) {
    return clean(value).toLowerCase().match(/[a-z0-9]+/g) || [];
  }

  function phraseSimilarity(leftTokens, rightTokens) {
    if (leftTokens.length !== rightTokens.length || !leftTokens.length) return 0;
    const score = rightTokens.reduce((total, rightToken, index) => {
      return total + tokenSimilarity(leftTokens[index], rightToken);
    }, 0);
    return score / rightTokens.length;
  }

  function tokenSimilarity(left, right) {
    if (left === right) return 1;
    if (right.length <= 2) return 0;
    const distance = levenshteinDistance(left, right);
    const ratio = (Math.max(left.length, right.length) - distance) / Math.max(left.length, right.length);
    return distance === 1 ? Math.max(ratio, 0.9) : ratio;
  }

  function isBetterBrandMatch(confidence, brand, best) {
    if (confidence > best.confidence) return true;
    if (confidence < best.confidence) return false;
    return brand.length > best.brand.length;
  }

  function levenshteinDistance(left, right) {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          previous[rightIndex - 1] + substitutionCost,
        );
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function firstPresent(...values) {
    return values.find(Boolean) || "";
  }

  function numberText(value) {
    const number = Number(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(number)) return "";
    return Number.isInteger(number) ? String(number) : String(number).replace(/0+$/, "").replace(/\.$/, "");
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return {
    TAG_FIELDS,
    buildTags,
    defaultTagValues,
    extractBrandFromTitle,
    extractMeasurementsFromBody,
    extractTagValuesFromTitle,
    refreshTitleMeasurementsFromBody,
  };
});
