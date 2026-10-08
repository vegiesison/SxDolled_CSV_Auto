// Isolated desktop and touch flows for persistent saved-workspace ordering.
async (page) => {
  const browser = page.context().browser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const browserPage = await context.newPage();
  const errors = [];
  browserPage.on("pageerror", (error) => errors.push(error.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const names = ["Kelly K", "Half Body", "Half Body (Spliced Version)", "Breast Display Collection", "Lyora", "Besty B"];
  const drafts = names.map((name, index) => ({
    id: `draft-${index}`,
    title: name,
    customTitle: name,
    savedAt: "2026-10-08T09:00:00.000Z",
    products: [{
      title: "Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll | Yue Doll",
      bodyHtml: "165cm Integrated Head and Body - Kelly\nMaterial: Silicone",
      variantSku: `MANUAL-SKU-${index}`,
      tagValues: { hairColour: "Brunette" },
    }],
  }));
  const seed = (drafts) => {
    if (!localStorage.getItem("sxdolledCsvDrafts")) {
      localStorage.setItem("sxdolledCsvDrafts", JSON.stringify(drafts));
      localStorage.setItem("sxdolledCsvAutoDraft", JSON.stringify({ id: "current", activeDraftId: "draft-2", products: drafts[2].products }));
    }
  };
  const waitForOrder = async (targetPage, order) => {
    await targetPage.waitForFunction((order) => {
      const drafts = JSON.parse(localStorage.getItem("sxdolledCsvDrafts"));
      return drafts.map((draft) => draft.id).join(",") === order.join(",");
    }, order);
  };
  let touchContext;
  await context.addInitScript(seed, drafts);
  try {
    await browserPage.goto("http://127.0.0.1:8766/");
    await browserPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const list = browserPage.locator("#saved-drafts");
    const card = (id) => list.locator(`[data-draft-id="${id}"]`);
    await card("draft-4").locator(".saved-draft-grip").dragTo(card("draft-0"), { targetPosition: { x: 30, y: 5 } });
    await waitForOrder(browserPage, ["draft-4", "draft-0", "draft-1", "draft-2", "draft-3", "draft-5"]);
    const afterDrag = await browserPage.evaluate(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")));
    check(afterDrag.every((draft) => JSON.stringify(draft) === JSON.stringify(drafts.find((original) => original.id === draft.id))), "Dragging changed workspace content");
    const targetBounds = await card("draft-3").boundingBox();
    await card("draft-4").locator(".saved-draft-grip").dragTo(card("draft-3"), { targetPosition: { x: 30, y: targetBounds.height - 4 } });
    await waitForOrder(browserPage, ["draft-0", "draft-1", "draft-2", "draft-3", "draft-4", "draft-5"]);

    await card("draft-0").locator(".saved-draft-grip").focus();
    await browserPage.keyboard.press("ArrowDown");
    const chosenOrder = ["draft-1", "draft-0", "draft-2", "draft-3", "draft-4", "draft-5"];
    await waitForOrder(browserPage, chosenOrder);
    await browserPage.locator('[data-field="title"]').fill("Kelly K (I-Cup) (165cm) | Blonde Lingerie Woman Sex Doll | Yue Doll");
    await browserPage.waitForFunction(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "draft-2").products[0].title.includes("Blonde Lingerie Woman"));
    await waitForOrder(browserPage, chosenOrder);
    await card("draft-5").locator(".saved-draft-rename").click();
    await browserPage.locator("#draft-name").fill("Wishlist - 35cm");
    await browserPage.getByRole("button", { name: "Save Name", exact: true }).click();
    await waitForOrder(browserPage, chosenOrder);
    await browserPage.reload();
    await waitForOrder(browserPage, chosenOrder);
    check(await card("draft-5").locator(".saved-draft-load").innerText() === "Wishlist - 35cm", "Reload lost a renamed draft");
    check(await list.locator(".saved-draft").count() === 6, "Reordering or reload lost a saved workspace");
    await browserPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await browserPage.screenshot({ path: ".playwright-mcp/draft-reorder-desktop.png" });
    await card("draft-3").locator(".saved-draft-load").click();
    check(await browserPage.locator('[data-field="variantSku"]').inputValue() === "MANUAL-SKU-3", "Reordered cards load the wrong workspace");
    await card("draft-2").locator(".saved-draft-load").click();
    await waitForOrder(browserPage, chosenOrder);

    await browserPage.locator('[data-field="title"]').fill("Kelly K (I-Cup) (165cm) | Red Bikini Woman Sex Doll | Yue Doll");
    const gripBounds = await card("draft-4").locator(".saved-draft-grip").boundingBox();
    const aboveBounds = await card("draft-3").boundingBox();
    await browserPage.mouse.move(gripBounds.x + gripBounds.width / 2, gripBounds.y + gripBounds.height / 2);
    await browserPage.mouse.down();
    await browserPage.mouse.move(aboveBounds.x + aboveBounds.width / 2, aboveBounds.y + 6, { steps: 12 });
    await browserPage.waitForFunction(() => document.querySelector('.saved-draft[data-draft-id="draft-4"]').classList.contains("saved-draft-chosen"));
    await browserPage.waitForFunction(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "draft-2").products[0].title.includes("Red Bikini Woman"));
    check(await card("draft-4").locator(".saved-draft-grip").count() === 1, "Autosave replaced the card during dragging");
    await browserPage.mouse.up();
    await waitForOrder(browserPage, ["draft-1", "draft-0", "draft-2", "draft-4", "draft-3", "draft-5"]);

    touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await touchContext.addInitScript(seed, drafts);
    const touchPage = await touchContext.newPage();
    touchPage.on("pageerror", (error) => errors.push(error.message));
    await touchPage.goto("http://127.0.0.1:8766/");
    await touchPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const touchList = touchPage.locator("#saved-drafts");
    const source = await touchList.locator('[data-draft-id="draft-1"] .saved-draft-grip').boundingBox();
    const destination = await touchList.locator('[data-draft-id="draft-0"]').boundingBox();
    const cdp = await touchContext.newCDPSession(touchPage);
    const sourceX = source.x + source.width / 2;
    const sourceY = source.y + source.height / 2;
    const targetX = destination.x + destination.width / 2;
    const targetY = destination.y + 8;
    const point = (x, y) => [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(sourceX, sourceY) });
    await touchPage.waitForFunction(() => document.querySelector('.saved-draft[data-draft-id="draft-1"]').classList.contains("saved-draft-chosen"));
    for (let step = 1; step <= 12; step += 1) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(sourceX + (targetX - sourceX) * step / 12, sourceY + (targetY - sourceY) * step / 12) });
    }
    await touchPage.waitForFunction(() => document.querySelector("#saved-drafts .saved-draft").dataset.draftId === "draft-1");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await waitForOrder(touchPage, ["draft-1", "draft-0", "draft-2", "draft-3", "draft-4", "draft-5"]);
    check(await touchPage.locator('[data-field="variantSku"]').inputValue() === "MANUAL-SKU-2", "Touch dragging loaded a workspace accidentally");
    check(await touchPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Touch layout overflows");
    await touchPage.screenshot({ path: ".playwright-mcp/draft-reorder-touch.png" });
    check(errors.length === 0, `Browser errors: ${errors.join(", ")}`);
    return { passed: true, savedDrafts: 6, desktopDragging: true, touchDragging: true, keyboardReordering: true, autosaveDuringDrag: true, orderSurvivesAutosaveRenameSwitchAndReload: true, browserErrors: errors };
  } finally {
    if (touchContext) await touchContext.close();
    await context.close();
  }
}
