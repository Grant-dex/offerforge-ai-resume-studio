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
