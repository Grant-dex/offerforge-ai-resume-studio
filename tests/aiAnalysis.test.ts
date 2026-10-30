import assert from "node:assert/strict";
import test from "node:test";
import { defaultResume } from "../src/data/defaultResume.ts";
import { replaceSuggestionText, resolveSuggestionTarget, resumeAnalysisKey, suggestionRoute } from "../src/utils/aiAnalysis.ts";
import type { AISuggestion } from "../src/utils/ai.ts";

const fixture = () => structuredClone(defaultResume);
const suggestion = (original: string, module = "工作经历"): AISuggestion => ({
  id: "suggestion-1", module, field: "bullets", title: "说明交付结果", original,
  suggested: "与业务团队共同完成交付，并用验收记录确认结果。", priority: "中",
});

test("replaces the matching second work record without appending to the first", () => {
  const resume = fixture();
  const before = structuredClone(resume);
  const advice = suggestion(resume.work[1].bullets[0]);
  const target = resolveSuggestionTarget(resume, advice);
  assert.ok(target && target.kind === "work");
  assert.equal(target.itemId, resume.work[1].id);
  const result = replaceSuggestionText(resume, target, advice.original, advice.suggested);
  assert.ok(result);
  assert.deepEqual(result.work[0], before.work[0]);
  assert.equal(result.work[1].bullets[0], advice.suggested);
  assert.equal(result.work[1].bullets.length, before.work[1].bullets.length);
  assert.deepEqual(resume, before, "the helper must not mutate source state");
});

test("refuses duplicate source text within a module", () => {
  const resume = fixture();
  resume.work[1].bullets.push(resume.work[0].bullets[0]);
  assert.equal(resolveSuggestionTarget(resume, suggestion(resume.work[0].bullets[0])), null);
});

test("refuses blank, partial, or missing source text instead of appending", () => {
  const resume = fixture();
  assert.equal(resolveSuggestionTarget(resume, suggestion("")), null);
  assert.equal(resolveSuggestionTarget(resume, suggestion(resume.work[0].bullets[0].slice(0, 5))), null);
  assert.equal(resolveSuggestionTarget(resume, suggestion("不存在的原文")), null);
  assert.equal(resolveSuggestionTarget(resume, { ...suggestion(resume.work[0].bullets[0]), suggested: " " }), null);
});

test("honors the module even when field is unexpectedly summary", () => {
  const resume = fixture();
  assert.equal(resolveSuggestionTarget(resume, { ...suggestion(resume.personal.summary), field: "summary" }), null);
  assert.equal(suggestionRoute(suggestion("text", "项目经历")), "/projects");
});

test("uses stable record IDs after work items are reordered", () => {
  const resume = fixture();
  const advice = suggestion(resume.work[1].bullets[0]);
  const target = resolveSuggestionTarget(resume, advice);
  assert.ok(target && target.kind === "work");
  const reordered = { ...resume, work: [...resume.work].reverse() };
  const result = replaceSuggestionText(reordered, target, advice.original, advice.suggested);
  assert.ok(result);
  assert.equal(result.work.find((item) => item.id === target.itemId)?.bullets[0], advice.suggested);
});

test("cannot apply a suggestion after its source has changed or its record was deleted", () => {
  const resume = fixture();
  const advice = suggestion(resume.work[1].bullets[0]);
  const target = resolveSuggestionTarget(resume, advice);
  assert.ok(target);
  resume.work[1].bullets[0] = "用户刚刚手动输入的内容";
  assert.equal(replaceSuggestionText(resume, target, advice.original, advice.suggested), null);
  resume.work.splice(1, 1);
  assert.equal(replaceSuggestionText(resume, target, advice.original, advice.suggested), null);
});

test("undo restores the original text, but never overwrites a subsequent edit", () => {
  const resume = fixture();
  const advice = suggestion(resume.projects[1].bullets[0], "项目经历");
  const target = resolveSuggestionTarget(resume, advice);
  assert.ok(target);
  const applied = replaceSuggestionText(resume, target, advice.original, advice.suggested);
  assert.ok(applied);
  const undone = replaceSuggestionText(applied, target, advice.suggested, advice.original);
  assert.deepEqual(undone, resume);
  applied.projects[1].bullets[0] = "之后补充的真实结果";
  assert.equal(replaceSuggestionText(applied, target, advice.suggested, advice.original), null);
});

test("analysis freshness follows resume content, excluding display-only changes", () => {
  const resume = fixture();
  const key = resumeAnalysisKey(resume);
  const visualChange = { ...resume, lastSaved: "12:00", atsScore: 20, personal: { ...resume.personal, avatar: "data:image/png;base64,...", resumeTitle: "改名" } };
  assert.equal(resumeAnalysisKey(visualChange), key);
  assert.notEqual(resumeAnalysisKey({ ...resume, skills: [...resume.skills, "新技能"] }), key);
});
