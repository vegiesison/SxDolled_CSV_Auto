const assert = require("node:assert/strict");
const { upsertDraft } = require("../web/draft-store");

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
