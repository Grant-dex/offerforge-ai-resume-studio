import assert from "node:assert/strict";
import test from "node:test";
import { getResumeTemplate, resumeTemplates } from "../src/data/resumeTemplates.ts";

test("three templates keep distinct paper styles and complete section orders", () => {
  assert.equal(resumeTemplates.length, 3);
  for (const template of resumeTemplates) {
    assert.equal(template.order.length, 5, `${template.key} orders every section`);
    assert.equal(new Set(template.order).size, 5, `${template.key} has no duplicate section`);
    assert.match(template.style.accent, /^#[0-9A-F]{6}$/i);
    assert.match(template.style.rule, /^#[0-9A-F]{6}$/i);
    assert.match(template.style.paper, /^#[0-9A-F]{6}$/i);
    assert.ok(template.style.nameSize > 0);
  }
  assert.equal(new Set(resumeTemplates.map((item) => item.style.accent)).size, 3, "each paper has its own accent");
  assert.equal(new Set(resumeTemplates.map((item) => item.style.paper)).size, 3, "each paper has its own paper colour");
});

test("template keys stay stable so saved drafts and share links keep working", () => {
  assert.deepEqual(resumeTemplates.map((item) => item.key), ["focus", "stack", "lead"]);
  assert.equal(getResumeTemplate("focus").name, "暖纸衬线");
  assert.equal(getResumeTemplate("lead").style.accent, "#1E3A33");
});
