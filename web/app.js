const productsRoot = document.querySelector("#products");
const addProductButton = document.querySelector("#add-product");
const newWorkspaceButton = document.querySelector("#new-workspace");
const saveDraftButton = document.querySelector("#save-draft");
const refreshSkuDetailsButton = document.querySelector("#refresh-sku-details");
const generateButton = document.querySelector("#generate-csv");
const statusText = document.querySelector("#status");
const template = document.querySelector("#product-template");
const productNavButtons = document.querySelector("#product-nav-buttons");
const savedDraftsRoot = document.querySelector("#saved-drafts");
const descriptionDialog = document.querySelector("#description-dialog");
const descriptionInput = document.querySelector("#description-lines");
const bulkTagsDialog = document.querySelector("#bulk-tags-dialog");
const renameDraftDialog = document.querySelector("#rename-draft-dialog");
const draftNameInput = document.querySelector("#draft-name");
const bulkDirtyKeys = new Set();
const DRAFTS_STORAGE_KEY = "sxdolledCsvDrafts";
const AUTO_DRAFT_STORAGE_KEY = "sxdolledCsvAutoDraft";

let nextProductId = 1;
let autoSaveTimer = 0;
let suppressAutoSave = false;
let activeDraftId = null;
let pendingDeleteDraftId = null;
let pendingRenameDraftId = null;
let activeProductSection = null;
let scrollSpyFrame = 0;
let draftDragActive = false;

function addProduct(seed = {}) {
  const id = nextProductId;
  nextProductId += 1;
  const fragment = template.content.cloneNode(true);
  const section = fragment.querySelector(".product");
  section.tabIndex = -1;
  section.dataset.productId = String(id);
  section.querySelector(".product-title").textContent = `Product ${id}`;
  const titleInput = section.querySelector("[data-field='title']");
  titleInput.value = seed.title || "";
  const bodyInput = section.querySelector("[data-field='bodyHtml']");
  bodyInput.value = seed.bodyHtml || "";
  const skuInput = section.querySelector("[data-field='variantSku']");
  skuInput.value = seed.variantSku || "";
  skuInput.dataset.autofilled = seed.variantSku ? "false" : "true";
  const variantPriceInput = section.querySelector("[data-field='variantPrice']");
  variantPriceInput.value = seed.variantPrice || "";
  const weightInput = section.querySelector("[data-field='weightKg']");
  weightInput.value = seed.weightKg || "";
  weightInput.dataset.autofilled = seed.weightKg ? "false" : "true";
  const includedMarkets = seed.includedMarkets || {};
  section.querySelectorAll("[data-included-market]").forEach((input) => {
    const value = includedMarkets[input.dataset.includedMarket];
    input.checked = value ? value === "TRUE" : true;
  });
  buildTagControls(section, seed.tagValues || {});
  section.querySelector("[data-field='tags']").value = seed.tags || window.SxDolledTagBuilder.buildTags(readTagValues(section));
  section.addEventListener("focusin", () => setActiveProduct(section, { syncNavScroll: true }));
  titleInput.addEventListener("input", () => {
    syncProductFromSources(section);
    scheduleAutoSave();
  });
  titleInput.addEventListener("change", () => {
    syncProductFromSources(section);
    scheduleAutoSave();
  });
  bodyInput.addEventListener("input", () => {
    syncProductFromSources(section);
    scheduleAutoSave();
  });
  bodyInput.addEventListener("change", () => {
    syncProductFromSources(section);
    scheduleAutoSave();
  });
  skuInput.addEventListener("input", () => {
    skuInput.dataset.autofilled = "false";
    scheduleAutoSave();
  });
  skuInput.addEventListener("focus", () => updateVariantSku(section));
  variantPriceInput.addEventListener("input", scheduleAutoSave);
  variantPriceInput.addEventListener("change", scheduleAutoSave);
  weightInput.addEventListener("input", () => {
    weightInput.dataset.autofilled = "false";
    scheduleAutoSave();
  });
  weightInput.addEventListener("change", () => {
    weightInput.dataset.autofilled = "false";
    scheduleAutoSave();
  });
  section.querySelectorAll("[data-included-market]").forEach((input) => input.addEventListener("change", scheduleAutoSave));
  section.querySelector(".prefill-tags").addEventListener("click", () => {
    applyBodyPrefill(section, { announce: true });
    scheduleAutoSave();
  });
  section.querySelector(".refresh-tags").addEventListener("click", () => {
    refreshTagsFromOptions(section, { announce: true });
    scheduleAutoSave();
  });
  section.querySelector(".remove-product").addEventListener("click", () => removeProduct(section));
  productsRoot.appendChild(fragment);
  syncProductFromSources(section);
  requestAnimationFrame(() => syncProductFromSources(section));
  window.setTimeout(() => syncProductFromSources(section), 150);
  refreshProductControls();
  if (!activeProductSection) setActiveProduct(section);
}

function removeProduct(section) {
  const sectionsBeforeRemoval = productSections();
  const removedIndex = sectionsBeforeRemoval.indexOf(section);
  const wasActive = activeProductSection === section;
  section.remove();
  if (wasActive) {
    const remainingSections = productSections();
    activeProductSection = remainingSections[Math.min(removedIndex, remainingSections.length - 1)] || null;
  }
  refreshProductControls();
  scheduleAutoSave();
  setStatus(`${productSections().length} product set${productSections().length === 1 ? "" : "s"} ready.`);
}

function refreshProductControls() {
  const sections = productSections();
  sections.forEach((section, index) => {
    section.querySelector(".product-title").textContent = `Product ${index + 1}`;
    section.querySelector(".remove-product").disabled = sections.length === 1;
  });
  renderProductNav(sections);
  updateProductNavActiveState();
}

function renderProductNav(sections = productSections()) {
  productNavButtons.innerHTML = "";
  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-nav-button";
    button.dataset.productId = section.dataset.productId;
    button.textContent = `Product ${index + 1}`;
    button.addEventListener("click", () => {
      setActiveProduct(section, { syncNavScroll: true });
      scrollToProduct(section);
    });
    productNavButtons.appendChild(button);
  });
}

function scrollToProduct(section) {
  setActiveProduct(section, { syncNavScroll: true });
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  section.focus({ preventScroll: true });
}

function setActiveProduct(section, options = {}) {
  if (!section || activeProductSection === section) {
    if (options.syncNavScroll) scrollActiveProductNavButtonIntoView();
    return;
  }
  activeProductSection = section;
  updateProductNavActiveState();
  if (options.syncNavScroll) scrollActiveProductNavButtonIntoView();
}

function updateProductNavActiveState() {
  const activeProductId = activeProductSection?.dataset.productId || "";
  productSections().forEach((section) => {
    section.classList.toggle("product-active", section.dataset.productId === activeProductId);
  });
  productNavButtons.querySelectorAll(".product-nav-button").forEach((button) => {
    const isActive = button.dataset.productId === activeProductId;
    button.classList.toggle("product-nav-button-active", isActive);
    if (isActive) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

function scrollActiveProductNavButtonIntoView() {
  const activeProductId = activeProductSection?.dataset.productId;
  if (!activeProductId) return;
  const button = productNavButtons.querySelector(`[data-product-id="${CSS.escape(activeProductId)}"]`);
  button?.scrollIntoView({ block: "nearest" });
}

function updateActiveProductFromViewport() {
  const sections = productSections();
  if (!sections.length) return;
  const targetY = document.querySelector(".sticky-controls").getBoundingClientRect().bottom + 18;
  const currentSection =
    sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= targetY && rect.bottom > targetY;
    }) || sections.find((section) => section.getBoundingClientRect().bottom > targetY) || sections.at(-1);
  setActiveProduct(currentSection, { syncNavScroll: true });
}

function scheduleActiveProductFromViewport() {
  const activeElement = document.activeElement;
  if (activeElement?.closest?.(".product") && activeElement.matches("input, textarea, select, button")) return;
  if (scrollSpyFrame) return;
  scrollSpyFrame = requestAnimationFrame(() => {
    scrollSpyFrame = 0;
    updateActiveProductFromViewport();
  });
}

function productSections() {
  return Array.from(productsRoot.querySelectorAll(".product"));
}

function readProducts() {
  return productSections().map((section) => {
    const tags = updateTags(section);
    updateVariantSku(section);
    return {
      title: section.querySelector("[data-field='title']").value,
      bodyHtml: section.querySelector("[data-field='bodyHtml']").value,
      tags,
      variantSku: section.querySelector("[data-field='variantSku']").value,
      variantPrice: section.querySelector("[data-field='variantPrice']").value,
      weightKg: section.querySelector("[data-field='weightKg']").value,
      status: "draft",
      includedMarkets: readIncludedMarkets(section),
      tagValues: readTagValues(section),
    };
  });
}

function saveDraft() {
  const products = readProducts();
  const result = saveWorkspaceDraft(products);
  if (!result) {
    setStatus("Add product details before saving a draft.", true);
    return;
  }
  setStatus(`${result.action === "updated" ? "Updated" : "Saved"} draft "${result.draft.title}".`);
}

function scheduleAutoSave() {
  if (suppressAutoSave) return;
  window.clearTimeout(autoSaveTimer);
  autoSaveTimer = window.setTimeout(saveAutoDraft, 350);
}

function saveAutoDraft() {
  if (suppressAutoSave) return;
  const products = readProducts();
  if (activeDraftId && saveWorkspaceDraft(products, { createIfMissing: false })) return;
  persistAutoDraft(products);
  renderSavedDrafts();
}

function saveWorkspaceDraft(products = readProducts(), options = {}) {
  if (!hasMeaningfulWorkspace(products)) return null;
  const result = window.SxDolledDraftStore.upsertDraft(readDrafts(), products, {
    activeDraftId,
    createIfMissing: options.createIfMissing,
    now: new Date(),
  });
  if (!result.draft) return null;
  writeDrafts(result.drafts);
  activeDraftId = result.activeDraftId;
  pendingDeleteDraftId = null;
  localStorage.removeItem(AUTO_DRAFT_STORAGE_KEY);
  renderSavedDrafts();
  return result;
}

function preserveCurrentWorkspace() {
  const products = readProducts();
  if (activeDraftId && saveWorkspaceDraft(products, { createIfMissing: false })) return;
  persistAutoDraft(products);
  renderSavedDrafts();
}

function persistAutoDraft(products) {
  window.clearTimeout(autoSaveTimer);
  if (!hasMeaningfulWorkspace(products)) {
    localStorage.removeItem(AUTO_DRAFT_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    AUTO_DRAFT_STORAGE_KEY,
    JSON.stringify({
      id: "current",
      title: "Current Unsaved Work",
      savedAt: new Date().toISOString(),
      activeDraftId,
      products,
    })
  );
}

function readAutoDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(AUTO_DRAFT_STORAGE_KEY) || "null");
    return draft && Array.isArray(draft.products) ? draft : null;
  } catch {
    return null;
  }
}

function hasMeaningfulWorkspace(products) {
  return products.some(hasMeaningfulProduct);
}

function hasMeaningfulProduct(product) {
  const defaultTags = window.SxDolledTagBuilder.buildTags(window.SxDolledTagBuilder.defaultTagValues());
  return (
    clean(product.title) ||
    clean(product.bodyHtml) ||
    clean(product.variantSku) ||
    clean(product.variantPrice) ||
    clean(product.weightKg) ||
    clean(product.tags) !== defaultTags ||
    Object.values(product.includedMarkets || {}).some((value) => value !== "TRUE")
  );
}

function readDrafts() {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY) || "[]");
    return Array.isArray(drafts) ? drafts.filter((draft) => draft && Array.isArray(draft.products)) : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts) {
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

function renderSavedDrafts() {
  if (draftDragActive) return;
  const previousScrollTop = savedDraftsRoot.scrollTop;
  const drafts = readDrafts();
  const autoDraft = readAutoDraft();
  const autoDraftIsSavedWorkspace = autoDraft?.activeDraftId && drafts.some((draft) => draft.id === autoDraft.activeDraftId);
  const visibleAutoDraft = autoDraft && !autoDraftIsSavedWorkspace ? autoDraft : null;
  savedDraftsRoot.innerHTML = "";
  if (!visibleAutoDraft && !drafts.length) {
    const empty = document.createElement("p");
    empty.className = "saved-drafts-empty";
    empty.textContent = "No saved drafts";
    savedDraftsRoot.appendChild(empty);
    return;
  }
  if (visibleAutoDraft) {
    savedDraftsRoot.appendChild(createSavedDraftElement(visibleAutoDraft, {
      className: "saved-draft saved-draft-recovery",
      metaPrefix: "Autosaved",
      onLoad: loadAutoDraft,
      deleteText: "Clear",
      onDelete: clearAutoDraft,
    }));
  }
  drafts.forEach((draft) => {
    savedDraftsRoot.appendChild(createSavedDraftElement(draft, {
      className: draft.id === activeDraftId ? "saved-draft saved-draft-active" : "saved-draft",
      metaPrefix: draft.id === activeDraftId ? "Current workspace" : "",
      onLoad: () => loadDraft(draft.id),
      onRename: () => openRenameDraftDialog(draft.id),
      deleteText: "Delete",
      onDelete: () => requestDeleteDraft(draft.id),
      deletePending: pendingDeleteDraftId === draft.id,
      onConfirmDelete: () => deleteDraft(draft.id),
      onCancelDelete: cancelDeleteDraft,
    }));
  });
  savedDraftsRoot.scrollTop = previousScrollTop;
}

function createSavedDraftElement(draft, options = {}) {
  const item = document.createElement("div");
  item.className = options.className || "saved-draft";
  item.dataset.draftId = draft.id;

  const title = draft.title || "Untitled draft";
  const loadButton = document.createElement("button");
  loadButton.type = "button";
  loadButton.className = "saved-draft-load";
  loadButton.textContent = title;
  loadButton.addEventListener("click", options.onLoad);

  const heading = document.createElement("div");
  heading.className = "saved-draft-heading";
  heading.appendChild(loadButton);
  if (options.onRename) {
    const grip = document.createElement("button");
    grip.type = "button";
    grip.className = "saved-draft-grip";
    grip.title = "Reorder workspace";
    grip.setAttribute("aria-label", `Reorder ${title}`);
    grip.setAttribute("aria-description", "Use the up and down arrow keys to move this workspace.");
    const icon = document.createElement("img");
    icon.src = "vendor/grip-vertical.svg";
    icon.alt = "";
    icon.width = 16;
    icon.height = 16;
    grip.appendChild(icon);
    grip.addEventListener("keydown", (event) => moveDraftWithKeyboard(event, draft.id));
    heading.appendChild(grip);
  }

  const meta = document.createElement("span");
  meta.className = "saved-draft-meta";
  const productCount = `${draft.products.length} product${draft.products.length === 1 ? "" : "s"}`;
  const dateLabel = options.metaPrefix ? `${options.metaPrefix} · ${formatSavedDate(draft.savedAt)}` : formatSavedDate(draft.savedAt);
  meta.textContent = `${productCount} · ${dateLabel}`;

  item.append(heading, meta);
  if (options.deletePending) {
    const prompt = document.createElement("span");
    prompt.className = "saved-draft-confirmation";
    prompt.textContent = "Delete this draft?";

    const actions = document.createElement("div");
    actions.className = "saved-draft-actions";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "saved-draft-delete saved-draft-delete-confirm";
    confirmButton.textContent = "Confirm";
    confirmButton.setAttribute("aria-label", `Confirm delete ${title}`);
    confirmButton.addEventListener("click", options.onConfirmDelete);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "saved-draft-cancel";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", options.onCancelDelete);

    actions.append(confirmButton, cancelButton);
    item.append(prompt, actions);
  } else {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "saved-draft-delete";
    deleteButton.textContent = options.deleteText || "Delete";
    deleteButton.setAttribute("aria-label", `${options.deleteText || "Delete"} ${title}`);
    deleteButton.addEventListener("click", options.onDelete);
    if (options.onRename) {
      const actions = document.createElement("div");
      actions.className = "saved-draft-actions";
      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "saved-draft-rename";
      renameButton.textContent = "Rename";
      renameButton.setAttribute("aria-label", `Rename ${title}`);
      renameButton.addEventListener("click", options.onRename);
      actions.append(renameButton, deleteButton);
      item.append(actions);
    } else {
      item.append(deleteButton);
    }
  }
  return item;
}

function saveDraftOrder(orderedIds, focusId) {
  try {
    const drafts = readDrafts();
    const ordered = window.SxDolledDraftStore.reorderDrafts(drafts, orderedIds);
    const changed = ordered.some((draft, index) => draft.id !== drafts[index].id);
    if (changed) writeDrafts(ordered);
    renderSavedDrafts();
    savedDraftsRoot.querySelector(`[data-draft-id="${CSS.escape(String(focusId))}"] .saved-draft-grip`)?.focus({ preventScroll: true });
    if (changed) {
      const index = ordered.findIndex((draft) => String(draft.id) === String(focusId));
      setStatus(`Moved "${ordered[index].title}" to position ${index + 1} of ${ordered.length}.`);
    }
  } catch (error) {
    renderSavedDrafts();
    setStatus(error.message, true);
  }
}

function moveDraftWithKeyboard(event, id) {
  if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const ids = readDrafts().map((draft) => String(draft.id));
  const index = ids.indexOf(String(id));
  const target = index + (event.key === "ArrowUp" ? -1 : 1);
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  saveDraftOrder(ids, id);
}

function initializeDraftSorting() {
  new window.Sortable(savedDraftsRoot, {
    draggable: ".saved-draft:not(.saved-draft-recovery)",
    filter: "button:not(.saved-draft-grip), input, textarea",
    preventOnFilter: false,
    animation: 150,
    delay: 150,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    scroll: savedDraftsRoot,
    scrollSensitivity: 36,
    bubbleScroll: false,
    ghostClass: "saved-draft-drop-target",
    chosenClass: "saved-draft-chosen",
    onStart: () => { draftDragActive = true; },
    onEnd: (event) => {
      draftDragActive = false;
      const ids = Array.from(savedDraftsRoot.querySelectorAll(".saved-draft:not(.saved-draft-recovery)"))
        .map((item) => item.dataset.draftId);
      saveDraftOrder(ids, event.item.dataset.draftId);
    },
  });
}

function formatSavedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function openRenameDraftDialog(id) {
  const draft = readDrafts().find((candidate) => candidate.id === id);
  if (!draft) {
    setStatus("Saved draft was not found.", true);
    return;
  }
  pendingRenameDraftId = id;
  draftNameInput.value = draft.customTitle || draft.title || "";
  document.querySelector("#rename-draft-error").textContent = "";
  renameDraftDialog.showModal();
  draftNameInput.select();
}

function applyDraftRename(event) {
  event.preventDefault();
  const id = pendingRenameDraftId;
  try {
    const drafts = window.SxDolledDraftStore.renameDraft(readDrafts(), id, draftNameInput.value);
    writeDrafts(drafts);
    renameDraftDialog.close();
    renderSavedDrafts();
    savedDraftsRoot.querySelector(`[data-draft-id="${CSS.escape(id)}"] .saved-draft-rename`)?.focus({ preventScroll: true });
    setStatus(`Renamed workspace to "${drafts.find((draft) => draft.id === id).title}".`);
  } catch (error) {
    document.querySelector("#rename-draft-error").textContent = error.message;
  }
}

function loadDraft(id) {
  const draft = readDrafts().find((candidate) => candidate.id === id);
  if (!draft) {
    renderSavedDrafts();
    setStatus("Saved draft was not found.", true);
    return;
  }
  if (id === activeDraftId) {
    const result = saveWorkspaceDraft(readProducts(), { createIfMissing: false });
    setStatus(result ? `Updated draft "${result.draft.title}".` : `Loaded draft "${draft.title}".`);
    return;
  }
  preserveCurrentWorkspace();
  const latestDraft = readDrafts().find((candidate) => candidate.id === id) || draft;
  activeDraftId = draft.id;
  pendingDeleteDraftId = null;
  loadWorkspace(latestDraft.products);
  setStatus(`Loaded draft "${latestDraft.title}".`);
}

function loadAutoDraft() {
  const draft = readAutoDraft();
  if (!draft) {
    renderSavedDrafts();
    setStatus("Autosaved current work was not found.", true);
    return;
  }
  activeDraftId = draft.activeDraftId || null;
  pendingDeleteDraftId = null;
  loadWorkspace(draft.products);
  setStatus("Loaded autosaved current work.");
}

function loadWorkspace(products) {
  suppressAutoSave = true;
  productsRoot.innerHTML = "";
  activeProductSection = null;
  nextProductId = 1;
  products.forEach((product) => addProduct(product));
  if (!products.length) addProduct();
  refreshProductControls();
  setActiveProduct(productSections()[0], { syncNavScroll: true });
  suppressAutoSave = false;
  renderSavedDrafts();
  productSections()[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestDeleteDraft(id) {
  pendingDeleteDraftId = id;
  renderSavedDrafts();
}

function cancelDeleteDraft() {
  pendingDeleteDraftId = null;
  renderSavedDrafts();
}

function deleteDraft(id) {
  const drafts = readDrafts();
  const draft = drafts.find((candidate) => candidate.id === id);
  writeDrafts(drafts.filter((candidate) => candidate.id !== id));
  pendingDeleteDraftId = null;
  if (activeDraftId === id) {
    activeDraftId = null;
    persistAutoDraft(readProducts());
  }
  renderSavedDrafts();
  setStatus(draft ? `Deleted draft "${draft.title}".` : "Deleted saved draft.");
}

function clearAutoDraft() {
  window.clearTimeout(autoSaveTimer);
  localStorage.removeItem(AUTO_DRAFT_STORAGE_KEY);
  renderSavedDrafts();
  setStatus("Cleared autosaved current work.");
}

function startNewWorkspace() {
  const saved = saveWorkspaceDraft(readProducts());
  activeDraftId = null;
  pendingDeleteDraftId = null;
  localStorage.removeItem(AUTO_DRAFT_STORAGE_KEY);
  loadWorkspace([]);
  setStatus(saved ? "Started a new workspace. Previous workspace was saved." : "Started a new workspace.");
}

function validateProducts(products) {
  const missing = [];
  products.forEach((product, index) => {
    if (!product.title.trim()) missing.push(`Product ${index + 1}: Title`);
    if (!product.bodyHtml.trim()) missing.push(`Product ${index + 1}: Body (HTML)`);
    if (!product.tags.trim()) missing.push(`Product ${index + 1}: Tags`);
  });
  return missing;
}

function downloadCsv() {
  const products = readProducts();
  const missing = validateProducts(products);
  if (missing.length) {
    setStatus(`Missing required input: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`, true);
    return;
  }
  const csv = window.SxDolledCsvGenerator.generateCsv(products);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  const draft = readDrafts().find((candidate) => candidate.id === activeDraftId);
  const draftName = String(draft?.customTitle || draft?.title || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim()
    .replace(/\.csv$/i, "")
    .replace(/[. ]+$/, "");
  link.href = url;
  link.download = `${draftName || `sxdolled-products-${stamp}`}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`CSV generated for ${products.length} product${products.length === 1 ? "" : "s"}.`);
}

function refreshAllProductDetails() {
  let skuChangedCount = 0;
  let productTypeChangedCount = 0;
  let titleChangedCount = 0;
  const sections = productSections();
  sections.forEach((section) => {
    const skuInput = section.querySelector("[data-field='variantSku']");
    if (!skuInput) return;
    if (refreshTitleFromBody(section)) titleChangedCount += 1;
    const currentSku = skuInput.value;
    if (applySkuRefreshTitleRules(section)) productTypeChangedCount += 1;
    const refreshedSku = window.SxDolledCsvGenerator.refreshVariantSkuBodyDetails(currentSku, {
      title: section.querySelector("[data-field='title']").value,
      bodyHtml: section.querySelector("[data-field='bodyHtml']").value,
      tags: updateTags(section),
    });
    if (refreshedSku === currentSku) return;
    skuInput.value = refreshedSku;
    skuInput.dataset.autofilled = "false";
    skuChangedCount += 1;
  });

  if (skuChangedCount || productTypeChangedCount || titleChangedCount) {
    scheduleAutoSave();
    setStatus(refreshProductDetailsStatus(titleChangedCount, skuChangedCount, productTypeChangedCount, sections.length));
  } else {
    setStatus("No product details changed. Check that Body (HTML) has refreshable title or SKU details.", true);
  }
}

function refreshTitleFromBody(section) {
  const titleInput = section.querySelector("[data-field='title']");
  const bodyInput = section.querySelector("[data-field='bodyHtml']");
  const measurements = window.SxDolledTagBuilder.extractMeasurementsFromBody(bodyInput.value);
  const currentTitle = titleInput.value;
  const refreshedTitle = window.SxDolledTagBuilder.refreshTitleMeasurementsFromBody(currentTitle, bodyInput.value);
  const titleChanged = refreshedTitle !== currentTitle;
  if (titleChanged) titleInput.value = refreshedTitle;
  const tagChanged = [
    forceTagValue(section, "height", measurements.height, "body"),
    forceTagValue(section, "cupSize", measurements.cupSize, "body"),
  ].some(Boolean);
  if (titleChanged || tagChanged) updateTags(section);
  return titleChanged;
}

function applySkuRefreshTitleRules(section) {
  const title = section.querySelector("[data-field='title']").value;
  if (!/\btorso\b/i.test(title)) return false;
  const productType = section.querySelector('[data-tag-key="productType"]');
  const productTypeCustom = section.querySelector('[data-tag-custom-key="productType"]');
  if (!productType) return false;

  let changed = false;
  if (clean(productTypeCustom?.value)) {
    productTypeCustom.value = "";
    productTypeCustom.dataset.autofilled = "true";
    productTypeCustom.dataset.autofillSource = "title";
    changed = true;
  }
  if (productType.value !== "Torsos") {
    productType.value = "Torsos";
    changed = true;
  }
  productType.dataset.autofilled = "true";
  productType.dataset.autofillSource = "title";
  return changed;
}

function refreshProductDetailsStatus(titleChangedCount, skuChangedCount, productTypeChangedCount, totalCount) {
  const updates = [];
  if (titleChangedCount) updates.push(`Title for ${titleChangedCount}`);
  if (skuChangedCount) updates.push(`Variant SKU details for ${skuChangedCount}`);
  if (productTypeChangedCount) updates.push(`Product Type for ${productTypeChangedCount}`);
  return `Refreshed ${updates.join(" and ")} of ${totalCount} product${totalCount === 1 ? "" : "s"}.`;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.dataset.state = isError ? "error" : "ok";
}

function buildTagControls(section, seedValues, options = {}) {
  const controlsRoot = section.querySelector("[data-tag-controls]");
  const defaults = options.bulk ? {} : { ...window.SxDolledTagBuilder.defaultTagValues(), ...seedValues };
  const onChange = (input, key) => {
    input.dataset.autofilled = "false";
    if (options.bulk) {
      bulkDirtyKeys.add(key);
      input.closest(".tag-control").classList.add("tag-control-changed");
      updateBulkTagCount();
    } else {
      updateTags(section);
      updateVariantSku(section);
      scheduleAutoSave();
    }
  };
  controlsRoot.innerHTML = "";
  window.SxDolledTagBuilder.TAG_FIELDS.forEach((field) => {
    if (options.bulk && field.type === "derived") return;
    const row = document.createElement("div");
    row.className = "tag-control";

    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", `product-${section.dataset.productId}-${field.key}`);

    const fieldGroup = document.createElement("div");
    fieldGroup.className = "tag-control-fields";

    const primary = ["number", "multi", "derived"].includes(field.type) ? document.createElement("input") : document.createElement("select");
    primary.id = `product-${section.dataset.productId}-${field.key}`;
    primary.dataset.tagKey = field.key;
    primary.className = "tag-primary";
    if (field.type === "derived") {
      primary.type = "text";
      primary.readOnly = true;
      primary.value = defaults[field.key] || "";
      fieldGroup.classList.add("tag-control-fields-derived");
    } else if (field.type === "number") {
      primary.type = "number";
      primary.min = "0";
      primary.step = "0.1";
      primary.inputMode = "decimal";
      primary.placeholder = field.suffix ? field.suffix : "";
      primary.value = defaults[field.key] || "";
    } else if (field.type === "multi") {
      fieldGroup.classList.add("tag-control-fields-multi");
      primary.type = "hidden";
      const selectedValues = Array.isArray(defaults[field.key]) ? defaults[field.key] : clean(defaults[field.key]).split(",").map((value) => value.trim()).filter(Boolean);
      const choices = document.createElement("div");
      choices.className = "tag-multi-options";
      field.options.forEach((option) => {
        const choiceLabel = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.tagMultiKey = field.key;
        checkbox.value = option;
        checkbox.checked = selectedValues.includes(option);
        checkbox.addEventListener("change", () => onChange(checkbox, field.key));
        choiceLabel.append(checkbox, document.createTextNode(option));
        choices.appendChild(choiceLabel);
      });
      fieldGroup.appendChild(choices);
    } else {
      primary.appendChild(new Option("", ""));
      field.options.forEach((option) => primary.appendChild(new Option(option, option)));
      primary.value = defaults[field.key] || "";
    }

    const custom = document.createElement("input");
    custom.type = "text";
    custom.dataset.tagCustomKey = field.key;
    custom.className = "tag-custom";
    custom.placeholder = "Custom";
    custom.value = defaults[`${field.key}Custom`] || "";

    primary.addEventListener("input", () => onChange(primary, field.key));
    primary.addEventListener("change", () => onChange(primary, field.key));
    custom.addEventListener("input", () => onChange(custom, field.key));

    fieldGroup.prepend(primary);
    if (field.type !== "derived") fieldGroup.append(custom);
    row.append(label, fieldGroup);
    controlsRoot.appendChild(row);
  });
}

function syncProductFromSources(section) {
  applyTitlePrefill(section);
  applyBodyPrefill(section);
  updateVariantSku(section);
}

function applyTitlePrefill(section, options = {}) {
  const titleValues = window.SxDolledTagBuilder.extractTagValuesFromTitle(section.querySelector("[data-field='title']").value);
  const fields = ["cupSize", "height"];
  const changed = fields.filter((key) => prefillTagValue(section, key, titleValues[key], "title")).length;
  updateTags(section);
  updateVariantSku(section);

  if (options.announce) {
    if (changed) {
      setStatus(`Prefilled ${changed} tag field${changed === 1 ? "" : "s"} from Title.`);
    } else if (fields.some((key) => titleValues[key])) {
      setStatus("Title values were found, but the tag fields already have manual values.");
    } else {
      setStatus("No confident title values found. Please verify cup size, height, and brand manually.", true);
    }
  }
}

function applyBodyPrefill(section, options = {}) {
  const measurements = window.SxDolledTagBuilder.extractMeasurementsFromBody(section.querySelector("[data-field='bodyHtml']").value);
  const fields = ["height", "material", "waistMeasurement", "hipMeasurement"];
  const changed = [
    ...fields.filter((key) => prefillTagValue(section, key, measurements[key], "body")),
    prefillDataFieldValue(section, "weightKg", measurements.weight, "body"),
  ].filter(Boolean).length;
  updateTags(section);
  updateVariantSku(section);

  if (options.announce) {
    const found = fields.filter((key) => measurements[key]).length + (measurements.weight ? 1 : 0);
    if (changed) {
      setStatus(`Prefilled ${changed} field${changed === 1 ? "" : "s"} from Body (HTML).`);
    } else if (found) {
      setStatus("Body values were found, but the tag fields already have manual values.");
    } else {
      setStatus("No height, material, waist, or hip values found in Body (HTML).", true);
    }
  }
}

function refreshTagsFromOptions(section, options = {}) {
  const tags = updateTags(section);
  updateVariantSku(section);
  if (options.announce) setStatus(tags ? "Refreshed Tags from Tag Options." : "Tags are empty. Add Tag Options values before generating CSV.", true);
  return tags;
}

function prefillDataFieldValue(section, field, value, source = "auto") {
  if (!value) return false;
  const input = section.querySelector(`[data-field="${field}"]`);
  if (!input) return false;
  const current = clean(input.value);
  if (current && input.dataset.autofilled !== "true") return false;
  if (source === "body" && input.dataset.autofillSource === "title") return false;
  if (current === value) return false;
  input.value = value;
  input.dataset.autofilled = "true";
  input.dataset.autofillSource = source;
  return true;
}

function prefillTagValue(section, key, value, source = "auto") {
  if (!value) return false;
  const primary = section.querySelector(`[data-tag-key="${key}"]`);
  const custom = section.querySelector(`[data-tag-custom-key="${key}"]`);
  if (!primary || clean(custom?.value)) return false;
  const current = clean(primary.value);
  if (current && primary.dataset.autofilled !== "true") return false;
  if (source === "body" && primary.dataset.autofillSource === "title") return false;
  if (current === value) return false;
  primary.value = value;
  primary.dataset.autofilled = "true";
  primary.dataset.autofillSource = source;
  return true;
}

function forceTagValue(section, key, value, source = "auto") {
  if (!value) return false;
  const primary = section.querySelector(`[data-tag-key="${key}"]`);
  const custom = section.querySelector(`[data-tag-custom-key="${key}"]`);
  if (!primary) return false;
  let changed = false;
  if (custom && clean(custom.value)) {
    custom.value = "";
    custom.dataset.autofilled = "true";
    custom.dataset.autofillSource = source;
    changed = true;
  }
  if (primary.value !== value) {
    primary.value = value;
    changed = true;
  }
  primary.dataset.autofilled = "true";
  primary.dataset.autofillSource = source;
  return changed;
}

function readTagValues(section) {
  const values = {};
  section.querySelectorAll("[data-tag-key]").forEach((input) => {
    values[input.dataset.tagKey] = input.value;
  });
  section.querySelectorAll("[data-tag-multi-key]").forEach((input) => {
    const key = input.dataset.tagMultiKey;
    if (!values[key]) values[key] = [];
    if (input.checked) values[key].push(input.value);
  });
  section.querySelectorAll("[data-tag-custom-key]").forEach((input) => {
    values[`${input.dataset.tagCustomKey}Custom`] = input.value;
  });
  return values;
}

function readIncludedMarkets(section) {
  return Object.fromEntries(
    Array.from(section.querySelectorAll("[data-included-market]")).map((input) => [
      input.dataset.includedMarket,
      input.checked ? "TRUE" : "FALSE",
    ])
  );
}

function updateTags(section) {
  const brand = section.querySelector('[data-tag-key="brand"]');
  if (brand) brand.value = window.SxDolledTagBuilder.extractTagValuesFromTitle(section.querySelector('[data-field="title"]').value).brand;
  const tags = window.SxDolledTagBuilder.buildTags(readTagValues(section));
  section.querySelector("[data-field='tags']").value = tags;
  return tags;
}

function updateVariantSku(section) {
  const input = section.querySelector("[data-field='variantSku']");
  if (!input || input.dataset.autofilled === "false") return input?.value || "";
  const autoSku = window.SxDolledCsvGenerator.generateShopifyRow({
    title: section.querySelector("[data-field='title']").value,
    bodyHtml: section.querySelector("[data-field='bodyHtml']").value,
    tags: section.querySelector("[data-field='tags']").value,
  })["Variant SKU"];
  input.value = autoSku;
  input.dataset.autofilled = "true";
  return autoSku;
}

function clean(value) {
  return String(value ?? "").trim();
}

function removeAllSxdAliases() {
  let changed = 0;
  productSections().forEach((section) => {
    let productChanged = false;
    ["title", "bodyHtml", "variantSku"].forEach((key) => {
      const input = section.querySelector(`[data-field="${key}"]`);
      const updated = window.SxDolledTagBuilder.removeSxdAliases(input.value);
      if (updated !== input.value) {
        input.value = updated;
        productChanged = true;
      }
    });
    if (productChanged) {
      changed += 1;
      syncProductFromSources(section);
    }
  });
  if (changed) scheduleAutoSave();
  setStatus(changed ? `Removed SxD names from ${changed} product${changed === 1 ? "" : "s"}.` : "No SxD names found in this workspace.");
}

function updateDescriptionPreview() {
  const descriptions = window.SxDolledTagBuilder.descriptionLines(descriptionInput.value);
  const sections = productSections();
  document.querySelector("#description-count").textContent = `${descriptions.length} / ${sections.length} descriptions`;
  const preview = document.querySelector("#description-preview");
  preview.replaceChildren();
  sections.forEach((section, index) => {
    const row = document.createElement("tr");
    const productCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const title = section.querySelector('[data-field="title"]').value.split("|")[0].trim();
    productCell.textContent = `Product ${index + 1}: ${title}`;
    descriptionCell.textContent = descriptions[index] || "";
    row.append(productCell, descriptionCell);
    preview.appendChild(row);
  });
  document.querySelector("#description-error").textContent = "";
}

function openDescriptionDialog() {
  descriptionInput.value = "";
  updateDescriptionPreview();
  descriptionDialog.showModal();
}

function applyDescriptionUpdates(event) {
  event.preventDefault();
  const sections = productSections();
  try {
    const titles = window.SxDolledTagBuilder.replaceTitleDescriptions(
      sections.map((section) => section.querySelector('[data-field="title"]').value),
      descriptionInput.value
    );
    sections.forEach((section, index) => {
      section.querySelector('[data-field="title"]').value = titles[index];
      syncProductFromSources(section);
    });
    descriptionDialog.close();
    scheduleAutoSave();
    setStatus(`Updated descriptions for ${sections.length} products.`);
  } catch (error) {
    document.querySelector("#description-error").textContent = error.message;
  }
}

function updateBulkTagCount() {
  document.querySelector("#bulk-tags-count").textContent = `${bulkDirtyKeys.size} fields / ${productSections().length} products`;
  document.querySelector("#bulk-tags-error").textContent = "";
}

function openBulkTagsDialog() {
  bulkDirtyKeys.clear();
  bulkTagsDialog.dataset.productId = "bulk";
  buildTagControls(bulkTagsDialog, {}, { bulk: true });
  updateBulkTagCount();
  bulkTagsDialog.showModal();
}

function applyBulkTagUpdates(event) {
  event.preventDefault();
  if (!bulkDirtyKeys.size) {
    document.querySelector("#bulk-tags-error").textContent = "No tag options changed.";
    return;
  }
  const values = readTagValues(bulkTagsDialog);
  productSections().forEach((section) => {
    bulkDirtyKeys.forEach((key) => {
      const primary = section.querySelector(`[data-tag-key="${key}"]`);
      const custom = section.querySelector(`[data-tag-custom-key="${key}"]`);
      primary.value = Array.isArray(values[key]) ? "" : values[key];
      primary.dataset.autofilled = "false";
      custom.value = values[`${key}Custom`] || "";
      custom.dataset.autofilled = "false";
      section.querySelectorAll(`[data-tag-multi-key="${key}"]`).forEach((checkbox) => {
        checkbox.checked = Array.isArray(values[key]) && values[key].includes(checkbox.value);
        checkbox.dataset.autofilled = "false";
      });
    });
    refreshTagsFromOptions(section);
  });
  bulkTagsDialog.close();
  scheduleAutoSave();
  setStatus(`Updated ${bulkDirtyKeys.size} tag options for ${productSections().length} products in this workspace.`);
}

const restoredDraft = readAutoDraft();
if (restoredDraft) {
  activeDraftId = restoredDraft.activeDraftId || null;
  loadWorkspace(restoredDraft.products);
  setStatus("Restored autosaved current work.");
} else {
  addProduct();
  renderSavedDrafts();
}
initializeDraftSorting();
addProductButton.addEventListener("click", () => {
  addProduct();
  productSections().at(-1).querySelector("[data-field='title']").focus();
  scheduleAutoSave();
  setStatus(`${productSections().length} product sets ready.`);
});
newWorkspaceButton.addEventListener("click", startNewWorkspace);
saveDraftButton.addEventListener("click", saveDraft);
refreshSkuDetailsButton.addEventListener("click", refreshAllProductDetails);
generateButton.addEventListener("click", downloadCsv);
document.querySelector("#remove-sxd-aliases").addEventListener("click", removeAllSxdAliases);
document.querySelector("#edit-descriptions").addEventListener("click", openDescriptionDialog);
document.querySelector("#bulk-edit-tags").addEventListener("click", openBulkTagsDialog);
descriptionInput.addEventListener("input", updateDescriptionPreview);
document.querySelector("#description-form").addEventListener("submit", applyDescriptionUpdates);
document.querySelector("#bulk-tags-form").addEventListener("submit", applyBulkTagUpdates);
document.querySelector("#rename-draft-form").addEventListener("submit", applyDraftRename);
renameDraftDialog.addEventListener("close", () => { pendingRenameDraftId = null; });
draftNameInput.addEventListener("input", () => { document.querySelector("#rename-draft-error").textContent = ""; });
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
window.addEventListener("scroll", scheduleActiveProductFromViewport, { passive: true });
window.addEventListener("pageshow", () => {
  productSections().forEach(syncProductFromSources);
  updateActiveProductFromViewport();
});
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && !suppressAutoSave) persistAutoDraft(readProducts());
});
window.addEventListener("beforeunload", () => {
  if (!suppressAutoSave) persistAutoDraft(readProducts());
});
