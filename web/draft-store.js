(function (global) {
  function clean(value) {
    return String(value ?? "").trim();
  }

  function draftTitle(products, number) {
    const title = clean(products.find((product) => clean(product.title))?.title);
    if (!title) return `Draft ${number}`;
    return title.length > 56 ? `${title.slice(0, 53)}...` : title;
  }

  function moveToFront(drafts, draft) {
    return [draft, ...drafts.filter((candidate) => candidate.id !== draft.id)];
  }

  function upsertDraft(drafts, products, options = {}) {
    const now = options.now || new Date();
    const savedAt = typeof now === "string" ? now : now.toISOString();
    const activeDraftId = options.activeDraftId || null;
    const existing = activeDraftId ? drafts.find((draft) => draft.id === activeDraftId) : null;

    if (existing) {
      const updated = {
        ...existing,
        title: draftTitle(products, drafts.indexOf(existing) + 1),
        savedAt,
        products,
      };
      return {
        action: "updated",
        activeDraftId: updated.id,
        draft: updated,
        drafts: moveToFront(drafts, updated),
      };
    }

    if (options.createIfMissing === false) {
      return {
        action: "none",
        activeDraftId: null,
        draft: null,
        drafts,
      };
    }

    const draft = {
      id: options.id || String(new Date(savedAt).getTime()),
      title: draftTitle(products, drafts.length + 1),
      savedAt,
      products,
    };
    return {
      action: "created",
      activeDraftId: draft.id,
      draft,
      drafts: moveToFront(drafts, draft),
    };
  }

  const api = { draftTitle, upsertDraft };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.SxDolledDraftStore = api;
})(typeof window !== "undefined" ? window : globalThis);
