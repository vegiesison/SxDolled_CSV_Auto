// Run as a Playwright browser_run_code_unsafe filename; fixtures use an isolated context.
async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 960 } });
  const browserPage = await context.newPage();
  const errors = [];
  browserPage.on("pageerror", (error) => errors.push(error.message));
  browserPage.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const products = [
    {
      title: "Lyora (B-Cup) (155cm) | Pink-Haired Catgirl Sex Doll | Moonvale Doll",
      bodyHtml: "155cm Integrated Head and Body - Lyora (SxD Lyora A)\nMaterial: Silicone\nWeight: 40kg\nNet weight (including head and tail): 34 kg",
      variantSku: "Moonvale Doll 155B + S #Old Lyora (SxD Lyora A)",
      variantPrice: "1725",
      weightKg: "34",
      status: "active",
      tagValues: { brand: "MD Doll", brandCustom: "Old Brand", hairColour: "Blue", hairColourCustom: "Silver Glitter", eyeColour: "Brown", material: "Silicone", anythingExtra: ["Mole"] },
      includedMarkets: { "Included / Australia": "FALSE" },
    },
    {
      title: "Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll | Yue Doll",
      bodyHtml: "165cm Integrated Head and Body - Kelly (SxD Kelly K)\nMaterial: Silicone\nWeight: 32kg",
      variantSku: "Yue Doll 165I + S #Old Kelly (SxD Kelly K)",
      status: "active",
      tagValues: { brand: "MD Doll", hairColour: "Red", eyeColour: "Green", material: "Silicone", anythingExtra: ["Freckles"] },
    },
  ];
  const untouched = { id: "workspace-two", title: "Untouched Workspace", savedAt: "2026-10-07T10:00:00.000Z", products: [{ title: "Original saved product", bodyHtml: "Original saved body (SxD Saved Name)", variantSku: "Original manual SKU", status: "active", tagValues: { hairColour: "Pink", brandCustom: "Original Brand" } }] };
  const active = { id: "workspace-one", title: "Active Workspace", savedAt: "2026-10-07T10:00:00.000Z", products };
  await context.addInitScript(({ active, untouched }) => {
    if (!localStorage.getItem("sxdolledCsvDrafts")) {
      localStorage.setItem("sxdolledCsvDrafts", JSON.stringify([active, untouched]));
      localStorage.setItem("sxdolledCsvAutoDraft", JSON.stringify({ id: "current", activeDraftId: active.id, products: active.products }));
    }
  }, { active, untouched });
  try {
    await browserPage.goto("http://127.0.0.1:8766/");
    const sections = browserPage.locator("#products .product");
    await sections.nth(1).waitFor();
    check(await sections.count() === 2, "Older workspace did not restore its products");
    check(await browserPage.locator('[data-field="status"]').count() === 0, "Status control is still visible");
    check(await sections.nth(1).locator('[data-tag-key="brand"]').inputValue() === "Yue Doll", "Unknown title brand was not derived");
    check(await sections.nth(0).locator('[data-tag-key="brand"]').inputValue() === "Moonvale Doll", "Old custom brand overrode title brand");
    check(await sections.nth(1).locator('[data-tag-key="brand"]').getAttribute("readonly") !== null, "Brand is editable");
    check(await browserPage.locator('select[data-tag-key="brand"]').count() === 0, "Brand dropdown remains");

    await browserPage.getByRole("button", { name: "Edit Doll Descriptions", exact: true }).click();
    await browserPage.locator("#description-lines").fill("Brunette Bikini Woman");
    await browserPage.getByRole("button", { name: "Update Titles", exact: true }).click();
    check((await browserPage.locator("#description-error").innerText()).includes("2 descriptions"), "Description count error was not shown");
    check(await sections.nth(0).locator('[data-field="title"]').inputValue() === products[0].title, "Invalid batch partially changed titles");
    await browserPage.locator("#description-lines").fill("Brunette Bikini Woman\nBlonde Lingerie Woman\n");
    check(await browserPage.locator("#description-preview tr").count() === 2, "Description preview lost product order");
    await browserPage.screenshot({ path: ".playwright-mcp/descriptions-desktop.png" });
    await browserPage.getByRole("button", { name: "Update Titles", exact: true }).click();
    const expectedTitle = "Lyora (B-Cup) (155cm) | Brunette Bikini Woman Sex Doll | Moonvale Doll";
    check(await sections.nth(0).locator('[data-field="title"]').inputValue() === expectedTitle, "First description was not assigned to product 1");
    check((await sections.nth(1).locator('[data-field="title"]').inputValue()).includes("Blonde Lingerie Woman Sex Doll | Yue Doll"), "Second description mapping failed");

    await browserPage.getByRole("button", { name: "Bulk Edit Tag Options", exact: true }).click();
    const modal = browserPage.locator("#bulk-tags-dialog");
    check(await modal.locator('[data-tag-key="brand"]').count() === 0, "Bulk modal can overwrite title brands");
    check(await modal.locator("input[type=checkbox]:checked").count() === 0, "Bulk multi-selects were not blank");
    check(await modal.locator(".tag-primary, .tag-custom").evaluateAll((inputs) => inputs.every((input) => input.value === "")), "Bulk controls had default values");
    await modal.getByRole("button", { name: "Apply to Workspace" }).click();
    check((await browserPage.locator("#bulk-tags-error").innerText()).includes("No tag options"), "Empty bulk edit was accepted");
    await modal.locator('[data-tag-key="hairColour"]').selectOption("Brunette");
    await modal.locator('[data-tag-key="skinTone"]').selectOption("Tan");
    await modal.locator('[data-tag-custom-key="theme"]').fill("Pin Up");
    await modal.locator('[data-tag-multi-key="anythingExtra"][value="Tattoo"]').check();
    await browserPage.screenshot({ path: ".playwright-mcp/bulk-tags-desktop.png" });
    await modal.getByRole("button", { name: "Apply to Workspace" }).click();
    for (let index = 0; index < 2; index += 1) {
      check(await sections.nth(index).locator('[data-tag-key="hairColour"]').inputValue() === "Brunette", "Bulk colour was not applied");
      check(await sections.nth(index).locator('[data-tag-custom-key="hairColour"]').inputValue() === "", "Previous custom colour still overrides selection");
      check(await sections.nth(index).locator('[data-tag-key="eyeColour"]').inputValue() === products[index].tagValues.eyeColour, "Untouched eye colour was changed");
      check(await sections.nth(index).locator('[data-tag-multi-key="anythingExtra"]:checked').count() === 1, "Bulk multi-select did not replace the selected field");
      check((await sections.nth(index).locator('[data-field="tags"]').inputValue()).includes("Pin Up"), "Bulk custom value did not update tags");
    }
    check(await sections.nth(0).locator('[data-included-market="Included / Australia"]').isChecked() === false, "Bulk editing changed markets");
    check(await sections.nth(0).locator('[data-field="variantPrice"]').inputValue() === "1725", "Bulk editing changed price");

    await browserPage.getByRole("button", { name: "Remove SxD Names", exact: true }).click();
    check(await sections.locator('[data-field="title"], [data-field="bodyHtml"], [data-field="variantSku"]').evaluateAll((inputs) => inputs.every((input) => !/\(SxD\b/i.test(input.value))), "Alias cleanup missed a product field");
    await browserPage.locator("#refresh-sku-details").click();
    check((await sections.nth(1).locator('[data-field="variantSku"]').inputValue()).startsWith("Yue Doll 165cm + S #"), "Refresh retained the invented height/cup prefix");
    await browserPage.waitForFunction(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "workspace-one").products[1].variantSku.startsWith("Yue Doll 165cm"));
    const preserved = await browserPage.evaluate(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "workspace-two"));
    check(JSON.stringify(preserved) === JSON.stringify(untouched), "Bulk edits modified another saved workspace");

    const downloadPromise = browserPage.waitForEvent("download");
    await browserPage.getByRole("button", { name: "Generate CSV", exact: true }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let csv = "";
    for await (const chunk of stream) csv += chunk.toString("utf8");
    const rows = await browserPage.evaluate((csv) => window.SxDolledCsvGenerator.parseCsv(csv.replace(/^\uFEFF/, "")), csv);
    check(rows.length === 2 && rows.every((row) => row.Status === "draft"), "CSV did not export all old active products as draft");
    check(rows[0]["Weight (product.metafields.custom.weight)"] === "34kg", "Net weight was lost");
    check(rows[1]["Vendor"] === "Yue Doll", "Title brand was lost in CSV");

    await browserPage.reload();
    await browserPage.waitForFunction(() => document.querySelector('[data-field="title"]').value.includes("Brunette Bikini Woman"));
    check(await sections.count() === 2, "Reload lost workspace products");
    check(await sections.nth(0).locator('[data-field="title"]').inputValue() === expectedTitle, "Reload lost title edits");
    await browserPage.getByRole("button", { name: "Untouched Workspace", exact: true }).click();
    check(await sections.count() === 1, "Other saved workspace could not be loaded");
    check(await sections.nth(0).locator('[data-field="variantSku"]').inputValue() === "Original manual SKU", "Loading another workspace lost its manual SKU");
    const stillPreserved = await browserPage.evaluate(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "workspace-two"));
    check(JSON.stringify(stillPreserved) === JSON.stringify(untouched), "Loading a saved workspace rewrote its stored data");
    await browserPage.locator(".saved-draft-load").filter({ hasText: "Lyora" }).click();

    await browserPage.setViewportSize({ width: 390, height: 844 });
    await browserPage.evaluate(() => window.scrollTo(0, 0));
    check(await browserPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Mobile page overflows horizontally");
    await browserPage.screenshot({ path: ".playwright-mcp/workspace-mobile.png" });
    await browserPage.getByRole("button", { name: "Bulk Edit Tag Options", exact: true }).click();
    check(await modal.locator(".tag-primary, .tag-custom").evaluateAll((inputs) => inputs.every((input) => input.value === "")), "Reopening bulk edit retained prior values");
    const bounds = await modal.boundingBox();
    check(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.y >= 0 && bounds.y + bounds.height <= 844, "Mobile modal does not fit viewport");
    await browserPage.screenshot({ path: ".playwright-mcp/bulk-tags-mobile.png" });
    await modal.locator('[data-tag-key="material"]').selectOption("TPE");
    await browserPage.keyboard.press("Escape");
    check(await sections.nth(0).locator('[data-tag-key="material"]').inputValue() === "Silicone", "Cancelling bulk edit changed a product");
    await browserPage.getByRole("button", { name: "Edit Doll Descriptions", exact: true }).click();
    await browserPage.screenshot({ path: ".playwright-mcp/descriptions-mobile.png" });
    await browserPage.keyboard.press("Escape");
    for (const width of [320, 768, 1024]) {
      await browserPage.setViewportSize({ width, height: 844 });
      check(await browserPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Page overflows at ${width}px`);
      await browserPage.getByRole("button", { name: "Bulk Edit Tag Options", exact: true }).click();
      const layoutFits = await modal.evaluate((dialog) => {
        const bounds = dialog.getBoundingClientRect();
        const buttonsFit = Array.from(dialog.querySelectorAll(".modal-actions button")).every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom;
        });
        return bounds.left >= 0 && bounds.right <= window.innerWidth && dialog.scrollWidth <= dialog.clientWidth && buttonsFit;
      });
      check(layoutFits, `Modal content or actions overflow at ${width}px`);
      await browserPage.screenshot({ path: `.playwright-mcp/bulk-tags-${width}.png` });
      await browserPage.keyboard.press("Escape");
    }
    check(errors.length === 0, `Browser errors: ${errors.join(", ")}`);
    return { passed: true, products: 2, savedWorkspacePreserved: true, csvStatus: "draft", browserErrors: errors, viewports: ["1440x960", "390x844", "320x844", "768x844", "1024x844"] };
  } finally {
    await context.close();
  }
}
