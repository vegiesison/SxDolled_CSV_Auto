// Run with the Playwright browser tool; saved data is seeded in a fresh context only.
async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 960 } });
  const browserPage = await context.newPage();
  const errors = [];
  browserPage.on("pageerror", (error) => errors.push(error.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const drafts = Array.from({ length: 28 }, (_, index) => ({
    id: `draft-${index}`,
    title: `Imported workspace ${index + 1}`,
    savedAt: "2026-10-08T09:00:00.000Z",
    products: [{
      title: "Kelly K (I-Cup) (165cm) | Brunette Bikini Woman Sex Doll | Yue Doll",
      bodyHtml: "165cm Integrated Head and Body - Kelly\nMaterial: Silicone",
      variantSku: `MANUAL-SKU-${index}`,
      tagValues: { hairColour: "Brunette" },
    }],
  }));
  await context.addInitScript((drafts) => {
    if (!localStorage.getItem("sxdolledCsvDrafts")) {
      localStorage.setItem("sxdolledCsvDrafts", JSON.stringify(drafts));
      localStorage.setItem("sxdolledCsvAutoDraft", JSON.stringify({ id: "current", activeDraftId: drafts[0].id, products: drafts[0].products }));
    }
  }, drafts);
  try {
    await browserPage.goto("http://127.0.0.1:8766/");
    const sidebar = browserPage.locator(".saved-drafts-panel");
    const list = browserPage.locator("#saved-drafts");
    const editorBounds = await browserPage.locator(".app-shell").boundingBox();
    const sidebarBounds = await sidebar.boundingBox();
    check(sidebarBounds.x >= editorBounds.x + editorBounds.width, "Saved Drafts is not on the right of the editor");
    check(sidebarBounds.y >= 0 && sidebarBounds.y + sidebarBounds.height <= 960, "Draft panel does not fit the desktop viewport");
    check(await browserPage.locator(".product-nav #saved-drafts").count() === 0, "Drafts still share the product navigation");
    check(await list.locator(".saved-draft").count() === 28, "Moving the panel lost saved workspaces");
    check(await list.evaluate((element) => element.scrollHeight > element.clientHeight), "Draft list does not scroll");
    await browserPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await list.hover();
    const initialPageScroll = await browserPage.evaluate(() => window.scrollY);
    await browserPage.mouse.wheel(0, 560);
    await browserPage.waitForFunction(() => document.querySelector("#saved-drafts").scrollTop > 0);
    const pageScrollAfterWheel = await browserPage.evaluate(() => window.scrollY);
    check(pageScrollAfterWheel === initialPageScroll, `Scrolling drafts moved the editor from ${initialPageScroll} to ${pageScrollAfterWheel}`);

    const target = list.locator('[data-draft-id="draft-20"]');
    await target.locator(".saved-draft-rename").click();
    check(await browserPage.locator("#draft-name").inputValue() === drafts[20].title, "Rename did not prefill the workspace name");
    await browserPage.locator("#draft-name").fill("  ");
    await browserPage.getByRole("button", { name: "Save Name", exact: true }).click();
    check((await browserPage.locator("#rename-draft-error").innerText()).includes("name"), "Empty name was accepted");
    await browserPage.locator("#draft-name").fill("Yue Doll - October Batch");
    await browserPage.screenshot({ path: ".playwright-mcp/rename-workspace-desktop.png" });
    const beforeRenameScroll = await list.evaluate((element) => element.scrollTop);
    await browserPage.getByRole("button", { name: "Save Name", exact: true }).click();
    check(Math.abs(await list.evaluate((element) => element.scrollTop) - beforeRenameScroll) < 2, "Renaming reset the draft list scroll position");
    const afterRename = await browserPage.evaluate(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")));
    check(afterRename.length === drafts.length, "Rename removed a workspace");
    check(afterRename[20].title === "Yue Doll - October Batch" && afterRename[20].customTitle === "Yue Doll - October Batch", "Custom name was not saved");
    check(JSON.stringify(afterRename[20].products) === JSON.stringify(drafts[20].products), "Renaming changed product data");
    check(afterRename.every((draft, index) => index === 20 || JSON.stringify(draft) === JSON.stringify(drafts[index])), "Renaming changed another saved workspace");
    check(await browserPage.locator('[data-field="variantSku"]').inputValue() === "MANUAL-SKU-0", "Renaming an inactive workspace loaded it");

    await list.locator('[data-draft-id="draft-0"] .saved-draft-rename').click();
    await browserPage.locator("#draft-name").fill("Torso edits October");
    await browserPage.getByRole("button", { name: "Save Name", exact: true }).click();
    await browserPage.locator('[data-field="title"]').fill("Kelly K (I-Cup) (165cm) | Blonde Lingerie Woman Sex Doll | Yue Doll");
    await browserPage.waitForFunction(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "draft-0").products[0].title.includes("Blonde Lingerie Woman"));
    const afterAutosave = await browserPage.evaluate(() => JSON.parse(localStorage.getItem("sxdolledCsvDrafts")).find((draft) => draft.id === "draft-0"));
    check(afterAutosave.title === "Torso edits October", "Autosave replaced the custom workspace name");
    await browserPage.reload();
    await browserPage.getByRole("button", { name: "Torso edits October", exact: true }).waitFor();
    check(await list.locator(".saved-draft").count() === 28, "Reload lost saved workspaces");
    await browserPage.evaluate(() => window.scrollTo(0, 0));
    await browserPage.screenshot({ path: ".playwright-mcp/drafts-right-desktop.png" });
    await list.locator('[data-draft-id="draft-20"] .saved-draft-load').click();
    check(await browserPage.locator('[data-field="variantSku"]').inputValue() === "MANUAL-SKU-20", "Renamed workspace could not be loaded");
    await list.locator('[data-draft-id="draft-20"] .saved-draft-rename').click();
    await browserPage.locator("#draft-name").fill("Cancelled name");
    await browserPage.keyboard.press("Escape");
    check(await target.locator(".saved-draft-load").innerText() === "Yue Doll - October Batch", "Cancelling rename changed the workspace name");
    for (const width of [1024, 768, 390, 320]) {
      await browserPage.setViewportSize({ width, height: 844 });
      await browserPage.evaluate(() => window.scrollTo(0, 0));
      check(await browserPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Layout overflows at ${width}px`);
      check(await list.evaluate((element) => element.scrollHeight > element.clientHeight), `Draft scrolling was lost at ${width}px`);
      if (width === 390) await browserPage.screenshot({ path: ".playwright-mcp/drafts-sidebar-mobile.png" });
    }
    check(errors.length === 0, `Browser errors: ${errors.join(", ")}`);
    return { passed: true, savedDrafts: 28, rightSidebar: true, independentScrolling: true, renameSurvivesAutosaveAndReload: true, browserErrors: errors };
  } finally {
    await context.close();
  }
}
