const assert = require("node:assert/strict");
const { upsertDraft, renameDraft, reorderDrafts } = require("../web/draft-store");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

const products = [{ title: "Ella H (K-Cup) (95cm) | Brown Haired Curvy Sex Doll", bodyHtml: "" }];

test("creates a draft when no active draft exists", () => {
  const result = upsertDraft([], products, { now: "2026-09-24T09:00:00.000Z" });

  assert.equal(result.action, "created");
  assert.equal(result.drafts.length, 1);
  assert.equal(result.activeDraftId, result.draft.id);
});

test("updates the active draft instead of creating a duplicate", () => {
  const existing = {
    id: "draft-1",
    title: "Old title",
    savedAt: "2026-09-24T08:00:00.000Z",
    products: [{ title: "Old title", bodyHtml: "" }],
  };
  const result = upsertDraft([existing], products, {
    activeDraftId: "draft-1",
    now: "2026-09-24T09:00:00.000Z",
  });

  assert.equal(result.action, "updated");
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0].id, "draft-1");
  assert.equal(result.drafts[0].savedAt, "2026-09-24T09:00:00.000Z");
  assert.equal(result.drafts[0].products[0].title, products[0].title);
});

test("does not create a draft when creation is disabled", () => {
  const result = upsertDraft([], products, {
    activeDraftId: "missing-draft",
    createIfMissing: false,
    now: "2026-09-24T09:00:00.000Z",
  });

  assert.equal(result.action, "none");
  assert.equal(result.drafts.length, 0);
  assert.equal(result.draft, null);
});

test("renames one workspace without changing its products or other drafts", () => {
  const existing = { id: "draft-1", title: "Auto title", savedAt: "2026-10-08T09:00:00.000Z", products };
  const other = { id: "draft-2", title: "Other workspace", products: [{ title: "Other product" }] };
  const renamed = renameDraft([existing, other], "draft-1", "  Yue Doll - October Batch  ");
  assert.equal(renamed[0].title, "Yue Doll - October Batch");
  assert.equal(renamed[0].customTitle, "Yue Doll - October Batch");
  assert.strictEqual(renamed[0].products, products);
  assert.equal(renamed[0].savedAt, existing.savedAt);
  assert.strictEqual(renamed[1], other);
  assert.equal(existing.title, "Auto title");
});

test("keeps a renamed workspace name through autosaves and product title changes", () => {
  const renamed = renameDraft([{ id: "draft-1", title: "Auto title", products }], "draft-1", "Torso edits");
  const updated = upsertDraft(renamed, [{ title: "A completely different product title" }], { activeDraftId: "draft-1" });
  assert.equal(updated.draft.title, "Torso edits");
  assert.equal(updated.draft.customTitle, "Torso edits");
});

test("rejects empty names and missing drafts without changing saved workspaces", () => {
  const drafts = [{ id: "draft-1", title: "Existing workspace", products }];
  assert.throws(() => renameDraft(drafts, "draft-1", "   "), /name/i);
  assert.throws(() => renameDraft(drafts, "missing-draft", "New name"), /not found/i);
  assert.equal(drafts[0].title, "Existing workspace");
  assert.equal(drafts.length, 1);
});

test("reorders workspaces without changing names, timestamps, products, or the source list", () => {
  const drafts = [
    { id: "one", title: "First", products, savedAt: "2026-10-08T09:00:00.000Z" },
    { id: "two", title: "Second", customTitle: "Second", products: [{ title: "Another product" }] },
    { id: "three", title: "Third", products: [] },
  ];
  const reordered = reorderDrafts(drafts, ["three", "one", "two"]);
  assert.deepEqual(reordered.map((draft) => draft.id), ["three", "one", "two"]);
  assert.strictEqual(reordered[0], drafts[2]);
  assert.strictEqual(reordered[1], drafts[0]);
  assert.strictEqual(reordered[2], drafts[1]);
  assert.deepEqual(drafts.map((draft) => draft.id), ["one", "two", "three"]);
  assert.deepEqual(reorderDrafts([], []), []);
});

test("rejects incomplete, duplicate, and unknown reorder lists without deleting saved data", () => {
  const drafts = [{ id: "one", products }, { id: "two", products: [] }];
  for (const ids of [["one"], ["one", "one"], ["one", "missing"]]) {
    assert.throws(() => reorderDrafts(drafts, ids), /order/i);
  }
  assert.equal(drafts.length, 2);
});

test("autosave preserves the chosen order even when editing a lower workspace", () => {
  const drafts = [{ id: "one", title: "First", products }, { id: "two", title: "Second", products: [] }];
  const reordered = reorderDrafts(drafts, ["two", "one"]);
  const result = upsertDraft(reordered, [{ title: "Edited first product" }], { activeDraftId: "one" });
  assert.deepEqual(result.drafts.map((draft) => draft.id), ["two", "one"]);
  assert.equal(result.drafts[1].products[0].title, "Edited first product");
});
