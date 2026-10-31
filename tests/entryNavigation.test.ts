import assert from "node:assert/strict";
import test from "node:test";
import { entriesStartingOnPage, findEntryById, type EntryAnchor } from "../src/utils/entryNavigation.ts";

const anchor = (id: string, top: number, bottom: number, kind: "work" | "project" = "work"): EntryAnchor => ({ id, kind, top, bottom, label: id });
const pages = [{ start: 0, end: 1000 }, { start: 1000, end: 2000 }];

test("an entry spanning two pages keeps its edit button on the start page only", () => {
  const entries = [anchor("long", 900, 1400), anchor("next", 1500, 1700)];
  assert.deepEqual(entriesStartingOnPage(entries, pages, 0).map((entry) => entry.id), ["long"]);
  assert.deepEqual(entriesStartingOnPage(entries, pages, 1).map((entry) => entry.id), ["next"]);
});

test("an entry exactly on a page boundary belongs to the next page", () => {
  const entries = [anchor("edge", 1000, 1100)];
  assert.deepEqual(entriesStartingOnPage(entries, pages, 0), []);
  assert.deepEqual(entriesStartingOnPage(entries, pages, 1).map((entry) => entry.id), ["edge"]);
});

test("missing pages and empty entries never throw", () => {
  assert.deepEqual(entriesStartingOnPage([], pages, 0), []);
  assert.deepEqual(entriesStartingOnPage([anchor("a", 10, 20)], pages, 9), []);
});

test("entry lookup uses the stable ID and never falls back to a position", () => {
  const items = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
  assert.equal(findEntryById(items, "b")?.name, "B");
  const reordered = [items[2], items[0], items[1]];
  assert.equal(findEntryById(reordered, "b")?.name, "B");
  assert.equal(findEntryById(reordered, "c")?.name, "C");
  assert.equal(findEntryById(reordered, "deleted"), null);
  assert.equal(findEntryById([], "a"), null);
});

import { previewEditTargetAtY, entryHitPadding } from "../src/utils/entryNavigation.ts";
const sections = [{ key: "work", top: 100, bottom: 1600 }, { key: "skills", top: 1700, bottom: 1900 }];
test("hover targets the entry before its enclosing section and clears in page margins", () => {
  const entries = [anchor("first", 200, 400), anchor("second", 500, 800)];
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, 250), "entry:first");
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, 450), "section:work");
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, 600), "entry:second");
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, -10), null);
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, 1000), null);
  assert.equal(previewEditTargetAtY(sections, entries, pages, 3, 100), null);
});
test("continued entries never reveal a control belonging to an earlier page", () => {
  const entries = [anchor("long", 900, 1400), anchor("next", 1500, 1650)];
  assert.equal(previewEditTargetAtY(sections, entries, pages, 0, 950), "entry:long");
  assert.equal(previewEditTargetAtY(sections, entries, pages, 1, 1200), null);
  assert.equal(previewEditTargetAtY(sections, entries, pages, 1, 1550), "entry:next");
  assert.equal(previewEditTargetAtY(sections, entries, pages, 1, 1750), "section:skills");
});
test("touch hit areas grow only into available space at the current zoom", () => {
  const entries = [anchor("a", 0, 50), anchor("b", 100, 150)];
  assert.deepEqual(entryHitPadding(entries, entries[0], 1), { top: 10, bottom: 10 });
  assert.deepEqual(entryHitPadding(entries, entries[1], .4), { top: 8, bottom: 10 });
  const dense = [anchor("a", 0, 10), anchor("b", 30, 40)];
  assert.deepEqual(entryHitPadding(dense, dense[0], .5), { top: 10, bottom: 0 });
  assert.deepEqual(entryHitPadding(dense, dense[1], .5), { top: 0, bottom: 10 });
});
