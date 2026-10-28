import assert from "node:assert/strict";
import test from "node:test";
import { keepBlocksTogether } from "../src/utils/pdfPagination.ts";

test("moves a short experience and its heading onto the next page", () => {
  assert.equal(keepBlocksTogether(1000, 0, 1000, [{ top: 800, bottom: 1100 }]), 800);
});
test("resolves overlapping heading and entry boundaries", () => {
  assert.equal(keepBlocksTogether(1000, 0, 1000, [{ top: 940, bottom: 1100 }, { top: 900, bottom: 965 }]), 900);
});
test("allows long entries to continue without producing mostly empty pages", () => {
  assert.equal(keepBlocksTogether(1000, 0, 1000, [{ top: 300, bottom: 1400 }, { top: 400, bottom: 1050 }]), 1000);
});
test("uses absolute offsets on subsequent pages and ignores invalid ranges", () => {
  assert.equal(keepBlocksTogether(2000, 1000, 1000, [{ top: 1800, bottom: 2100 }, { top: NaN, bottom: 2200 }, { top: 1700, bottom: 1600 }]), 1800);
});
