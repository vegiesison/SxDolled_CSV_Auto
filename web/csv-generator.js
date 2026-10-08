(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SxDolledCsvGenerator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SHOPIFY_HEADERS = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option1 Linked To",
    "Option2 Name",
    "Option2 Value",
    "Option2 Linked To",
    "Option3 Name",
    "Option3 Value",
    "Option3 Linked To",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Google Shopping / Gender",
    "Google Shopping / Age Group",
    "Google Shopping / MPN",
    "Google Shopping / Condition",
    "Google Shopping / Custom Product",
    "Google Shopping / Custom Label 0",
    "Google Shopping / Custom Label 1",
    "Google Shopping / Custom Label 2",
    "Google Shopping / Custom Label 3",
    "Google Shopping / Custom Label 4",
    "Body Shape (product.metafields.custom.body_shape)",
    "Brand 2 (product.metafields.custom.brand_2)",
    "Breast Shape 2 (product.metafields.custom.breast_shape_2)",
    "Emotion 2 (product.metafields.custom.emotion_2)",
    "Ethnicity (product.metafields.custom.ethnicity)",
    "Eye Colour 2 (product.metafields.custom.eye_colour_2)",
    "Gender (product.metafields.custom.gender)",
    "Hair Colour 2 (product.metafields.custom.hair_colour_2)",
    "Hair Length 2 (product.metafields.custom.hair_length_2)",
    "Hip Measurements (product.metafields.custom.hip_measurements)",
    "LHP (product.metafields.custom.lhp)",
    "Material (product.metafields.custom.material)",
    "Other (product.metafields.custom.other)",
    "Skin Tone 2 (product.metafields.custom.skin_tone_2)",
    "Theme (product.metafields.custom.theme)",
    "Waist Measurements (product.metafields.custom.waist_measurements)",
    "Weight (product.metafields.custom.weight)",
    "Weight 2 (product.metafields.custom.weight_2)",
    "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)",
    "Product rating count (product.metafields.reviews.rating_count)",
    "Hidden (product.metafields.seo.hidden)",
    "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)",
    "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)",
    "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)",
    "Search product boosts (product.metafields.shopify--discovery--product_search_boost.queries)",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Included / Australia",
    "Price / Australia",
    "Compare At Price / Australia",
    "Included / Canada",
    "Price / Canada",
    "Compare At Price / Canada",
    "Included / Europe",
    "Price / Europe",
    "Compare At Price / Europe",
    "Included / International",
    "Price / International",
    "Compare At Price / International",
    "Included / New Zealand",
    "Price / New Zealand",
    "Compare At Price / New Zealand",
    "Included / U.K.",
    "Price / U.K.",
    "Compare At Price / U.K.",
    "Included / U.S.",
    "Price / U.S.",
    "Compare At Price / U.S.",
    "Status",
  ];

  const BRAND_DEFAULTS = {
    "Dolls Castle": {
      titleBrand: "Dolls Castle",
      bodyBrand: "Dolls Castle",
      skuBrand: "Dolls Castle",
      vendor: "Dolls Castle",
      tagBrand: "Dolls Castle",
      brand2: "dolls-castle",
    },
  };

  const GLOBAL_DEFAULTS = {
    productCategory: "Mature > Erotic > Sex Toys & Erotic Games",
    published: "TRUE",
    inventoryTracker: "shopify",
    inventoryQty: "8",
    inventoryPolicy: "continue",
    fulfillmentService: "manual",
    requiresShipping: "TRUE",
    taxable: "TRUE",
    giftCard: "FALSE",
    weightUnit: "kg",
    status: "draft",
    includedMarkets: {
      "Included / Australia": "TRUE",
      "Included / Canada": "TRUE",
      "Included / Europe": "TRUE",
      "Included / International": "TRUE",
      "Included / New Zealand": "TRUE",
      "Included / U.K.": "TRUE",
      "Included / U.S.": "TRUE",
    },
  };

  const SETS = {
    productTypes: new Set(["Mini Dolls", "Sex Doll", "Sex Doll Head", "Torsos"]),
    genders: new Set(["Female", "Male", "Shemale"]),
    cups: new Set(["A-Cup", "B-Cup", "C-Cup", "D-Cup", "E-Cup", "F-Cup", "G-Cup", "H-Cup", "I-Cup", "J-Cup", "K-Cup", "L-Cup", "M-Cup", "N-Cup", "O-Cup", "P-Cup", "Z-Cup"]),
    materials: new Set(["TPE", "S-TPE", "TPE & Silicone", "S-TPE & Silicone", "Silicone"]),
    breastShapes: new Set(["Perky", "Moderately Sagging", "Sagging"]),
    bodyShapes: new Set(["Apple", "BBW", "hourglass", "Hourglass", "Inverted Triangle", "Muscle", "Pear", "Rectangle", "Slim", "Thick", "One Piece", "Bimbo"]),
    skinTones: new Set(["Ebony", "Fair", "Natural", "Tan", "Blue Skin", "Green Skin", "Pink Skin", "Purple Skin", "Red Skin", "Yellow Skin"]),
    emotions: new Set(["Angry", "Happy", "Neutral", "Smiling", "Worried", "Surprised", "Sad", "Interested", "Fearful"]),
    hairLengths: new Set(["Long Hair", "Short Hair"]),
    hairColours: new Set(["Black", "Blonde", "Blue", "Brunette", "Green", "Grey", "Ombre", "Orange", "Pink", "Purple", "Red", "Silver", "White"]),
    eyeColours: new Set(["Yellow", "White", "Red", "Purple", "Pink", "Orange", "Grey", "Green", "Eyes Closed", "Brown", "Blue"]),
    ethnicities: new Set(["African American", "Asian", "Caucasian", "Latino", "Middle Eastern", "Indian"]),
    themes: new Set(["Anime", "Cosplay", "School Uniform", "Ahegao", "Alien", "Angel", "Animal", "Avatar", "Bunny", "Christmas Edition", "Cowgirl", "Cyborg", "Demon", "Elf", "Goblin", "Halloween Edition", "Kitty", "Maid", "MILF", "Nun", "Nurse", "Officer", "Pornstar", "Pregnant", "Puppy", "Star Wars", "Tail", "Tongue Out", "Vampire"]),
    other: new Set(["Mouth (Oral)", "Freckles", "Mole", "Penetrable Nipples", "Seamless (All In One)", "Detachable", "High End", "Robot Doll", "Tattoo"]),
    lhp: new Set(["LHP Bad", "LHP Okay", "LHP Good"]),
  };

  function generateShopifyRow(product) {
    const title = clean(product.title);
    const bodyHtml = clean(product.bodyHtml);
    const tagsText = clean(product.tags);
    const tags = splitTags(tagsText);
    const defaults = findBrandDefaults(title, bodyHtml, tagsText);
    const bodyParts = parseBodyFirstLine(bodyHtml);
    const productBrand = productBrandValue(title, defaults);
    const height = firstPresent(titleHeight(title), tagValue(tags, isHeight), bodyParts.height);
    const cup = firstPresent(titleCup(title), tagValue(tags, (tag) => SETS.cups.has(tag)), bodyParts.cup);
    const hairColour = tagValue(tags, (tag) => SETS.hairColours.has(tag));
    const eyeColour = lastTagValue(tags, (tag) => SETS.eyeColours.has(tag));
    const material = firstPresent(tagValue(tags, (tag) => SETS.materials.has(tag)), bodyLineValue(bodyHtml, "Material"));
    const weightKg = firstPresent(clean(product.weightKg), bodyWeight(bodyHtml));
    const productType = firstPresent(tagValue(tags, (tag) => SETS.productTypes.has(tag)), titleProductType(title));
    const variantSkuOverride = clean(product.variantSku);
    const variantPrice = clean(product.variantPrice);
    const row = Object.fromEntries(SHOPIFY_HEADERS.map((header) => [header, ""]));

    Object.assign(row, {
      Title: title,
      "Body (HTML)": bodyHtml,
      Vendor: defaults?.vendor || productBrand,
      "Product Category": GLOBAL_DEFAULTS.productCategory,
      Type: shopifyProductType(productType),
      Tags: tagsText,
      Published: GLOBAL_DEFAULTS.published,
      "Option1 Name": cup ? "Cup Size" : "",
      "Option1 Value": cup,
      "Option2 Name": height ? "Height" : "",
      "Option2 Value": height,
      "Option3 Name": hairColour ? "Hair Colour" : "",
      "Option3 Value": hairColour,
      "Variant SKU": variantSkuOverride || variantSku(title, bodyHtml, defaults, bodyParts, productType),
      "Variant Grams": weightKg ? String(Number(weightKg) * 1000) : "",
      "Variant Inventory Tracker": GLOBAL_DEFAULTS.inventoryTracker,
      "Variant Inventory Qty": GLOBAL_DEFAULTS.inventoryQty,
      "Variant Inventory Policy": GLOBAL_DEFAULTS.inventoryPolicy,
      "Variant Fulfillment Service": GLOBAL_DEFAULTS.fulfillmentService,
      "Variant Price": variantPrice,
      "Variant Requires Shipping": GLOBAL_DEFAULTS.requiresShipping,
      "Variant Taxable": GLOBAL_DEFAULTS.taxable,
      "Gift Card": GLOBAL_DEFAULTS.giftCard,
      "Body Shape (product.metafields.custom.body_shape)": bodyShapeMetafield(tagValue(tags, (tag) => SETS.bodyShapes.has(tag))),
      "Brand 2 (product.metafields.custom.brand_2)": defaults?.brand2 || brandSlug(productBrand, tags),
      "Breast Shape 2 (product.metafields.custom.breast_shape_2)": slug(tagValue(tags, (tag) => SETS.breastShapes.has(tag))),
      "Emotion 2 (product.metafields.custom.emotion_2)": slug(tagValue(tags, (tag) => SETS.emotions.has(tag))),
      "Ethnicity (product.metafields.custom.ethnicity)": ethnicityMetafield(tagValue(tags, (tag) => SETS.ethnicities.has(tag))),
      "Eye Colour 2 (product.metafields.custom.eye_colour_2)": eyeColourMetafield(eyeColour),
      "Gender (product.metafields.custom.gender)": tagValue(tags, (tag) => SETS.genders.has(tag)),
      "Hair Colour 2 (product.metafields.custom.hair_colour_2)": slug(hairColour),
      "Hair Length 2 (product.metafields.custom.hair_length_2)": hairLengthMetafield(tagValue(tags, (tag) => SETS.hairLengths.has(tag))),
      "Hip Measurements (product.metafields.custom.hip_measurements)": tagMeasurement(tags, "Hip"),
      "LHP (product.metafields.custom.lhp)": lhpMetafield(tagValue(tags, (tag) => SETS.lhp.has(tag))),
      "Material (product.metafields.custom.material)": material,
      "Other (product.metafields.custom.other)": tagValues(tags, (tag) => SETS.other.has(tag)).join("\n"),
      "Skin Tone 2 (product.metafields.custom.skin_tone_2)": slug(tagValue(tags, (tag) => SETS.skinTones.has(tag))),
      "Theme (product.metafields.custom.theme)": tagValue(tags, (tag) => SETS.themes.has(tag)),
      "Waist Measurements (product.metafields.custom.waist_measurements)": tagMeasurement(tags, "Waist"),
      "Weight (product.metafields.custom.weight)": weightKg ? `${roundedWeightText(weightKg)}kg` : "",
      "Weight 2 (product.metafields.custom.weight_2)": weightKg ? roundedWeightText(weightKg) : "",
      "Variant Weight Unit": GLOBAL_DEFAULTS.weightUnit,
      Status: statusValue(product.status),
    });

    Object.assign(row, includedMarketValues(product.includedMarkets));
    return row;
  }

  function generateCsv(products) {
    const rows = products.map(generateShopifyRow);
    return [SHOPIFY_HEADERS.join(","), ...rows.map((row) => SHOPIFY_HEADERS.map((header) => csvCell(row[header])).join(","))].join("\r\n");
  }

  function refreshVariantSkuBodyDetails(currentSku, product) {
    const sku = clean(currentSku);
    const firstLine = bodyFirstLine(product.bodyHtml);
    const modelCode = skuModelCodeFromBodyFirstLine(firstLine);
    const details = variantSkuBodyDetails(product, { preserveFirstLine: Boolean(modelCode) });
    if (!details) return sku;

    if (modelCode) {
      const brandBase = skuBrandBase(product.title, sku);
      if (brandBase) return `${brandBase} - ${modelCode} + ${details}`;
    }

    const title = clean(product.title);
    const bodyHtml = clean(product.bodyHtml);
    const tagsText = clean(product.tags);
    const tags = splitTags(tagsText);
    const defaults = findBrandDefaults(title, bodyHtml, tagsText);
    const productType = firstPresent(titleProductType(title), tagValue(tags, (tag) => SETS.productTypes.has(tag)));
    const generatedSku = variantSku(title, bodyHtml, defaults, parseBodyFirstLine(bodyHtml), productType);
    return generatedSku || sku;
  }

  function parseCsv(csv) {
    const rows = [];
    const cells = [];
    let cell = "";
    let row = [];
    let quoted = false;
    for (let i = 0; i < csv.length; i += 1) {
      const char = csv[i];
      const next = csv[i + 1];
      if (quoted && char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (!quoted && char === ",") {
        row.push(cell);
        cell = "";
      } else if (!quoted && (char === "\n" || char === "\r")) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        cells.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    if (cell || row.length) {
      row.push(cell);
      cells.push(row);
    }
    const headers = cells.shift() || [];
    for (const item of cells) {
      rows.push(Object.fromEntries(headers.map((header, index) => [header, item[index] || ""])));
    }
    return rows;
  }

  function findBrandDefaults(title, bodyHtml, tagsText) {
    const haystack = `${title}\n${bodyHtml}\n${tagsText}`.toLowerCase();
    return Object.entries(BRAND_DEFAULTS).find(([brand, defaults]) => {
      return [brand, defaults.titleBrand, defaults.bodyBrand, defaults.tagBrand].some((candidate) => haystack.includes(candidate.toLowerCase()));
    })?.[1] || null;
  }

  function productBrandValue(title, defaults) {
    return titleBrand(title) || defaults?.vendor || defaults?.titleBrand || "";
  }

  function splitTags(value) {
    return clean(value).split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  function parseBodyFirstLine(bodyHtml) {
    const firstLine = bodyFirstLine(bodyHtml);
    const compactMatch = firstLine.match(/^(?:(.*?)\s+-\s+)?(\d+(?:\.\d+)?\s*[A-Z])\b\s*#(.+)$/i);
    const spacedMatch = firstLine.match(/^(?:(.*?)\s+-\s+)?(\d+(?:\.\d+)?)\s*CM\s+([A-Z])\s+#(.+)$/i);
    const compactNoHashMatch = firstLine.match(/^(?:(.*?)\s+-\s+)?(\d+(?:\.\d+)?\s*[A-Z])\b(\s+.+)$/i);
    const spacedNoHashMatch = firstLine.match(/^(?:(.*?)\s+-\s+)?(\d+(?:\.\d+)?)\s*CM\s+([A-Z])\b(\s+.+)$/i);
    const match = compactMatch || spacedMatch || compactNoHashMatch || spacedNoHashMatch;
    if (!match) {
      const originalName = skuOriginalName(firstLine);
      return isSkuOriginalNameCandidate(originalName) ? { originalName } : {};
    }
    if (compactMatch || compactNoHashMatch) {
      const bodyHeight = match[2].replace(/\s+/g, "").toUpperCase();
      const bodyHeightMatch = bodyHeight.match(/^(\d+(?:\.\d+)?)([A-Z])$/);
      const height = bodyHeightMatch ? `${numberText(bodyHeightMatch[1])}cm` : "";
      const cupLetter = bodyHeightMatch ? bodyHeightMatch[2].toUpperCase() : "";
      return {
        brand: clean(match[1]),
        height,
        cup: cupLetter ? `${cupLetter}-Cup` : "",
        cupLetter,
        bodyHeight,
        originalName: compactMatch ? skuOriginalName(match[3]) : skuOriginalName(firstLine),
      };
    }
    return {
      brand: clean(match[1]),
      height: `${numberText(match[2])}cm`,
      cup: `${match[3].toUpperCase()}-Cup`,
      cupLetter: match[3].toUpperCase(),
      bodyHeight: `${numberText(match[2])}${match[3].toUpperCase()}`,
      originalName: spacedMatch ? skuOriginalName(match[4]) : skuOriginalNameFromCmLine(match[4]),
    };
  }

  function variantSku(title, bodyHtml, defaults, bodyParts, productType) {
    if (!bodyParts.originalName) return "";
    const brand = titleBrand(title) || defaults?.skuBrand || bodyParts.brand || "";
    if (!brand) return "";
    const bodyHeight = bodyParts.bodyHeight || skuBodyHeightFromBody(bodyHtml) || skuBodyHeightFromTitle(title);
    if (!bodyHeight) return "";
    const materialCode = skuMaterialCode(bodyLineValue(bodyHtml, "Material"), productType);
    const materialPart = materialCode ? `${materialCode} ` : "";
    return `${brand} ${bodyHeight} + ${materialPart}#${cleanSkuOriginalName(bodyParts.originalName)}`;
  }

  function variantSkuBodyDetails(product, options = {}) {
    const title = clean(product.title);
    const bodyHtml = clean(product.bodyHtml);
    const tags = splitTags(clean(product.tags));
    const bodyParts = parseBodyFirstLine(bodyHtml);
    if (!bodyParts.originalName) return "";
    const productType = firstPresent(titleProductType(title), tagValue(tags, (tag) => SETS.productTypes.has(tag)));
    const materialCode = skuMaterialCode(bodyLineValue(bodyHtml, "Material"), productType);
    const materialPart = materialCode ? `${materialCode} ` : "";
    const originalName = options.preserveFirstLine ? bodyFirstLine(bodyHtml) : cleanSkuOriginalName(bodyParts.originalName);
    return `${materialPart}#${originalName}`;
  }

  function skuBrandBase(title, currentSku) {
    const existingPrefix = clean(currentSku).match(/^(.+?)\s+\+/)?.[1] || "";
    const existingBrand = existingPrefix
      .replace(/\s+-\s+.+$/, "")
      .replace(/\s+\d+(?:\.\d+)?(?:cm|[A-Z])\b.*$/i, "")
      .trim();
    if (existingBrand) return existingBrand;
    const brand = titleBrand(title);
    return brand.toLowerCase() === "yeloly" ? "Yeloly Doll" : brand;
  }

  function skuModelCodeFromBodyFirstLine(firstLine) {
    return clean(firstLine).match(/^([A-Z]+-?\d+(?:\+[A-Z0-9]+)?)/i)?.[1] || "";
  }

  function bodyFirstLine(bodyHtml) {
    return clean(bodyHtml).split(/\r?\n/)[0] || "";
  }

  function titleBrand(title) {
    const parts = clean(title).split("|").map((part) => part.trim()).filter(Boolean);
    return parts.length >= 2 ? parts.at(-1) : "";
  }

  function skuMaterialCode(material, productType) {
    const materialLower = clean(material).toLowerCase();
    if (clean(productType).toLowerCase() === "torsos" || materialLower.includes("torso")) return "T";
    if (materialLower.includes("hybrid") || (materialLower.includes("tpe") && materialLower.includes("silicone"))) return "H";
    if (materialLower.includes("silicone")) return "S";
    return "";
  }

  function skuOriginalName(value) {
    return cleanSkuOriginalName(value);
  }

  function cleanSkuOriginalName(value) {
    return clean(value)
      .replace(/\s*\(SxD[^)]*\)/gi, "")
      .replace(/\s*\((?:\s*cm\s*|[A-Z]\s*-?\s*cup)\)\s*/gi, " ")
      .replace(/\(([^)]*)\)/g, "$1")
      .replace(/[-–—]{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function skuOriginalNameFromCmLine(value) {
    const words = clean(value).split(/\s+/).filter(Boolean);
    if (words.length >= 2 && SETS.hairColours.has(capitalize(words[0]))) {
      words.shift();
    }
    return skuOriginalName(words.join(" "));
  }

  function isSkuOriginalNameCandidate(value) {
    if (!value || value.includes(":") || !/[A-Za-z]/.test(value)) return false;
    const measurementLabels = [
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
    ];
    return !measurementLabels.some((label) => new RegExp(`^${escapeRegex(label)}\\b`, "i").test(value));
  }

  function skuBodyHeightFromBody(bodyHtml) {
    const firstLine = bodyFirstLine(bodyHtml);
    const modelCode = skuModelCodeFromBodyFirstLine(firstLine);
    if (modelCode) return modelCode;
    const filenameHeight = firstLine.match(/\b(\d+(?:\.\d+)?)\s*cm\b/i);
    if (filenameHeight) return `${numberText(filenameHeight[1])}cm`;
    const height = bodyLineValue(bodyHtml, "Height with Head") || bodyLineValue(bodyHtml, "Height");
    return skuBodyHeightFromValues(height);
  }

  function skuBodyHeightFromTitle(title) {
    return skuBodyHeightFromValues(titleHeight(title));
  }

  function skuBodyHeightFromValues(height) {
    const heightMatch = clean(height).match(/\d+(?:\.\d+)?/);
    return heightMatch ? `${numberText(heightMatch[0])}cm` : "";
  }

  function capitalize(value) {
    const lower = clean(value).toLowerCase();
    return lower ? `${lower[0].toUpperCase()}${lower.slice(1)}` : "";
  }

  function titleHeight(title) {
    return title.match(/\((\d+(?:\.\d+)?cm)\)/i)?.[1] || "";
  }

  function titleCup(title) {
    const match = title.match(/\(([A-Z])-Cup\)/i);
    return match ? `${match[1].toUpperCase()}-Cup` : "";
  }

  function titleProductType(title) {
    if (/\btorso\b/i.test(title)) return "Torsos";
    return Array.from(SETS.productTypes).sort((a, b) => b.length - a.length).find((type) => new RegExp(`\\b${escapeRegex(type)}\\b`, "i").test(title)) || "";
  }

  function bodyLineValue(bodyHtml, label) {
    const regex = new RegExp(`^${escapeRegex(label)}\\s*(?::\\s*|\\s+)(.+)$`, "i");
    for (const line of clean(bodyHtml).split(/\r?\n/)) {
      const match = line.trim().match(regex);
      if (match) return match[1].trim();
    }
    return "";
  }

  function bodyWeight(bodyHtml) {
    for (const line of clean(bodyHtml).split(/\r?\n/)) {
      if (!/\bnet\b/i.test(line)) continue;
      const match = line.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
      if (match) return match[1];
    }
    const value = bodyLineValue(bodyHtml, "Weight") || bodyLineValue(bodyHtml, "Net Weight");
    return value.match(/\d+(?:\.\d+)?/)?.[0] || "";
  }

  function tagValue(tags, predicate) {
    return tags.find(predicate) || "";
  }

  function lastTagValue(tags, predicate) {
    return tags.findLast(predicate) || "";
  }

  function tagValues(tags, predicate) {
    return tags.filter(predicate);
  }

  function isHeight(tag) {
    return /^\d+(?:\.\d+)?cm$/i.test(tag);
  }

  function tagMeasurement(tags, label) {
    const regex = new RegExp(`^${escapeRegex(label)}\\s+(\\d+(?:\\.\\d+)?cm)$`, "i");
    for (const tag of tags) {
      const match = tag.match(regex);
      if (match) return `${roundedNumberText(match[1])}cm`;
    }
    return "";
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function firstPresent(...values) {
    return values.find(Boolean) || "";
  }

  function shopifyProductType(productType) {
    return productType === "Torsos" ? "Sex Torso" : productType;
  }

  function includedMarketValues(values) {
    const rowValues = { ...GLOBAL_DEFAULTS.includedMarkets };
    if (!values || typeof values !== "object") return rowValues;
    for (const header of Object.keys(GLOBAL_DEFAULTS.includedMarkets)) {
      rowValues[header] = trueFalseValue(values[header], rowValues[header]);
    }
    return rowValues;
  }

  function trueFalseValue(value, fallback) {
    const normalized = clean(value).toUpperCase();
    if (normalized === "TRUE" || normalized === "FALSE") return normalized;
    return fallback;
  }

  function statusValue(value) {
    const normalized = clean(value).toLowerCase();
    return normalized === "draft" || normalized === "active" ? normalized : GLOBAL_DEFAULTS.status;
  }

  function slug(value) {
    return value ? value.replace(/\s+/g, "-").toLowerCase() : "";
  }

  function brandSlug(productBrand, tags) {
    const knownBrand = tags.find((tag) => productBrand && tag.toLowerCase().includes(productBrand.toLowerCase()) && tag.length > productBrand.length);
    return slug(knownBrand || productBrand);
  }

  function bodyShapeMetafield(value) {
    return value.toLowerCase() === "hourglass" ? "Hourglass" : value;
  }

  function ethnicityMetafield(value) {
    return value.toLowerCase() === "african american" ? "Black" : value;
  }

  function eyeColourMetafield(value) {
    if (!value) return "";
    if (value === "Eyes Closed") return "Eyes-Closed";
    return slug(value);
  }

  function hairLengthMetafield(value) {
    return value ? slug(value.replace(/\s+Hair$/, "")) : "";
  }

  function lhpMetafield(value) {
    return value ? value.replace(/^LHP\s+/, "") : "";
  }

  function numberText(value) {
    const number = Number(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(number)) return "";
    return Number.isInteger(number) ? String(number) : String(number).replace(/0+$/, "").replace(/\.$/, "");
  }

  function roundedNumberText(value) {
    const number = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(number) ? String(Math.round(number)) : "";
  }

  function roundedWeightText(value) {
    return roundedNumberText(value);
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return {
    SHOPIFY_HEADERS,
    generateCsv,
    generateShopifyRow,
    parseCsv,
    refreshVariantSkuBodyDetails,
  };
});
