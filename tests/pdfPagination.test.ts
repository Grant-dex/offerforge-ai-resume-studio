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

import { paginateResume } from "../src/utils/pdfPagination.ts";
test("pagination covers all content exactly once and preserves short entries", () => {
  assert.deepEqual(paginateResume(2400, 1000, [{ top: 850, bottom: 1100 }], []), [
    { start: 0, end: 850 }, { start: 850, end: 1850 }, { start: 1850, end: 2400 },
  ]);
});
test("long entries break between text lines without depending on paper colour", () => {
  const pages = paginateResume(2050, 1000, [{ top: 0, bottom: 2050 }], [{ top: 990.5, bottom: 1010.5 }, { top: 1980, bottom: 2005 }]);
  assert.equal(pages[0].end, 989);
  assert.equal(pages[1].end, 1979);
  assert.equal(pages.at(-1)?.end, 2050);
});
test("overlapping text lines from columns move together", () => {
  assert.equal(paginateResume(1500, 1000, [], [{ top: 990, bottom: 1010 }, { top: 980, bottom: 995 }])[0].end, 979);
});
test("an exact fit has no extra blank page and empty resumes still have a page", () => {
  assert.deepEqual(paginateResume(1000, 1000, [], []), [{ start: 0, end: 1000 }]);
  assert.deepEqual(paginateResume(0, 1000, [], []), [{ start: 0, end: 0 }]);
});
test("invalid dimensions fail and oversized blocks always make progress", () => {
  assert.throws(() => paginateResume(1000, 0, [], []));
  assert.throws(() => paginateResume(Infinity, 1000, [], []));
  const pages = paginateResume(3000, 1000, [{ top: 0, bottom: 3000 }], [{ top: 0, bottom: 3000 }]);
  assert.equal(pages.length, 3);
  assert.ok(pages.every(page => page.end > page.start));
});
