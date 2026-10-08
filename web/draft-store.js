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
        title: clean(existing.customTitle) || draftTitle(products, drafts.indexOf(existing) + 1),
        savedAt,
        products,
      };
      return {
        action: "updated",
        activeDraftId: updated.id,
        draft: updated,
        drafts: drafts.map((draft) => draft.id === updated.id ? updated : draft),
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

  function renameDraft(drafts, id, name) {
    const customTitle = clean(name);
    if (!customTitle) throw new Error("Enter a workspace name.");
    if (customTitle.length > 120) throw new Error("Workspace names must be 120 characters or fewer.");
    if (!drafts.some((draft) => draft.id === id)) throw new Error("Saved draft was not found.");
    return drafts.map((draft) => draft.id === id ? { ...draft, title: customTitle, customTitle } : draft);
  }

  function reorderDrafts(drafts, orderedIds) {
    const byId = new Map(drafts.map((draft) => [String(draft.id), draft]));
    const ids = orderedIds.map(String);
    if (ids.length !== drafts.length || new Set(ids).size !== drafts.length || ids.some((id) => !byId.has(id))) {
      throw new Error("Draft order changed. Try reordering the saved workspaces again.");
    }
    return ids.map((id) => byId.get(id));
  }

  const api = { draftTitle, upsertDraft, renameDraft, reorderDrafts };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.SxDolledDraftStore = api;
})(typeof window !== "undefined" ? window : globalThis);
