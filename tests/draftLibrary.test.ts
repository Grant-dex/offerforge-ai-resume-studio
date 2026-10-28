import assert from "node:assert/strict";
import test from "node:test";
import { duplicateResume, hydrateResumeState, loadDraftEntries, loadResumeSnapshot, makeResumeDraft, normalizeDraftResume, removeResumeSnapshot, saveActiveResume, saveResumeSnapshot } from "../src/utils/draftLibrary.ts";
import type { RecentEntry, ResumeSnapshot } from "../src/utils/draftLibrary.ts";

class MemoryStorage {
  items = new Map<string, string>();
  failOnWrite: string | null = null;
  get length() { return this.items.size; }
  key(index: number) { return [...this.items.keys()][index] ?? null; }
  getItem(key: string) { return this.items.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (key === this.failOnWrite) throw new Error("QuotaExceededError");
    this.items.set(key, value);
  }
  removeItem(key: string) { this.items.delete(key); }
}

const snapshot = (id: string, template: ResumeSnapshot["template"] = "focus"): ResumeSnapshot => ({ version: 1, resume: makeResumeDraft(1, id), template, lastTouched: "10:30" });

test("each saved resume retains its own content and selected template", () => {
  const storage = new MemoryStorage();
  const first = snapshot("sales", "focus"), second = snapshot("developer", "stack");
  first.resume.personal.name = "甲";
  second.resume.personal.name = "乙";
  let entries = saveResumeSnapshot(storage, first, []);
  entries = saveResumeSnapshot(storage, second, entries);
  first.template = "lead";
  saveResumeSnapshot(storage, first, entries);
  assert.equal(loadResumeSnapshot(storage, "sales")?.template, "lead");
  assert.equal(loadResumeSnapshot(storage, "sales")?.resume.personal.name, "甲");
  assert.equal(loadResumeSnapshot(storage, "developer")?.template, "stack");
  assert.equal(loadResumeSnapshot(storage, "developer")?.resume.personal.name, "乙");
});

test("legacy raw resume snapshots keep their text and use the classic template", () => {
  const storage = new MemoryStorage(), legacy = makeResumeDraft(2, "legacy");
  legacy.personal.summary = "原有中文内容\n下一行";
  storage.setItem("offerforge-snapshot-legacy", JSON.stringify(legacy));
  const restored = loadResumeSnapshot(storage, "legacy");
  assert.equal(restored?.template, "focus");
  assert.equal(restored?.lastTouched, legacy.lastSaved);
  assert.equal(restored?.resume.personal.summary, legacy.personal.summary);
});

test("recovers more than five drafts even when the index is truncated, missing, or malformed", () => {
  const storage = new MemoryStorage();
  let entries: RecentEntry[] = [];
  for (let i = 0; i < 8; i += 1) entries = saveResumeSnapshot(storage, snapshot(`draft-${i}`), entries);
  storage.setItem("offerforge-recents", JSON.stringify([...entries.slice(0, 3), entries[0], { id: "missing" }]));
  assert.equal(loadDraftEntries(storage).length, 8);
  assert.equal(new Set(loadDraftEntries(storage).map(entry => entry.id)).size, 8);
  storage.setItem("offerforge-recents", "invalid-json");
  assert.equal(loadDraftEntries(storage).length, 8);
  storage.removeItem("offerforge-recents");
  assert.equal(loadDraftEntries(storage).length, 8);
});

test("empty experience and skill arrays stay empty across snapshot and active-state hydration", () => {
  const storage = new MemoryStorage(), empty = snapshot("empty");
  saveResumeSnapshot(storage, empty, []);
  const loaded = loadResumeSnapshot(storage, "empty")!;
  const fallback = snapshot("sample");
  fallback.resume.skills = ["示例技能"];
  const restored = hydrateResumeState(loaded, fallback);
  assert.deepEqual(restored.resume.work, []);
  assert.deepEqual(restored.resume.projects, []);
  assert.deepEqual(restored.resume.skills, []);
  assert.equal(restored.resume.personal.name, "");
});

test("copy creates an independent draft without changing the source's nested arrays", () => {
  const source = makeResumeDraft(1, "source");
  source.work = [{ id: "work-1", company: "原公司", title: "职位", city: "", startDate: "", endDate: "", bullets: ["原经历"], tags: ["原标签"] }];
  source.education.tags = ["原课程"];
  const copied = duplicateResume(source, "copy");
  copied.work[0].bullets[0] = "副本经历";
  copied.education.tags.push("新课程");
  assert.equal(copied.id, "copy");
  assert.equal(copied.personal.resumeTitle, copied.title);
  assert.equal(copied.title, "新简历 1（副本）");
  assert.equal(source.work[0].bullets[0], "原经历");
  assert.deepEqual(source.education.tags, ["原课程"]);
  assert.equal(source.title, "新简历 1");
});

test("rejects unreadable or mismatched snapshots and normalizes malformed legacy fields", () => {
  const storage = new MemoryStorage();
  for (const value of ["invalid", "null", "[]", JSON.stringify({ resume: {}, version: 99 }), JSON.stringify(snapshot("different"))]) {
    storage.setItem("offerforge-snapshot-broken", value);
    assert.equal(loadResumeSnapshot(storage, "broken"), null);
  }
  const source = makeResumeDraft(1, "partial");
  const restored = normalizeDraftResume({ ...source, personal: { name: 42 }, skills: [false, "React"], work: [null, { company: "公司", bullets: [null, "真实经历"], tags: "wrong" }], education: { school: "学校", tags: [3, "课程"] } });
  assert.equal(restored?.personal.name, "");
  assert.deepEqual(restored?.skills, ["React"]);
  assert.equal(restored?.work.length, 1);
  assert.deepEqual(restored?.work[0].bullets, ["真实经历"]);
  assert.deepEqual(restored?.work[0].tags, []);
  assert.deepEqual(restored?.education.tags, ["课程"]);
  assert.equal(normalizeDraftResume({ id: "broken", personal: null }), null);
});

test("untrusted persisted values cannot overwrite store actions or add arbitrary state", () => {
  const updatePersonal = () => "original action";
  const current = { resume: makeResumeDraft(1, "current"), template: "focus" as const, lastTouched: "09:00", updatePersonal };
  const result = hydrateResumeState({ resume: makeResumeDraft(2, "saved"), template: "unknown", lastTouched: { invalid: true }, updatePersonal: null, injected: "untrusted" }, current);
  assert.equal(result.resume.id, "saved");
  assert.equal(result.template, "focus");
  assert.equal(result.lastTouched, "09:00");
  assert.equal(result.updatePersonal, updatePersonal);
  assert.equal("injected" in result, false);
});

test("write failures are surfaced and do not remove the existing recoverable content", () => {
  const storage = new MemoryStorage(), original = snapshot("current");
  original.resume.personal.summary = "已保存内容";
  const entries = saveResumeSnapshot(storage, original, []);
  storage.failOnWrite = "offerforge-snapshot-current";
  const edited = structuredClone(original);
  edited.resume.personal.summary = "尚未保存的修改";
  assert.throws(() => saveResumeSnapshot(storage, edited, entries), /Quota/);
  assert.equal(loadResumeSnapshot(storage, "current")?.resume.personal.summary, "已保存内容");
  storage.failOnWrite = "offerforge-recents";
  assert.throws(() => saveResumeSnapshot(storage, snapshot("new"), entries), /Quota/);
  assert.ok(loadDraftEntries(storage).some(entry => entry.id === "new"), "a completed snapshot remains recoverable even if indexing fails");
  assert.throws(() => removeResumeSnapshot(storage, "current", entries), /Quota/);
  assert.ok(loadResumeSnapshot(storage, "current"), "failed deletion keeps its snapshot");
});

test("deleting a draft removes only that document and leaves other templates intact", () => {
  const storage = new MemoryStorage();
  let entries = saveResumeSnapshot(storage, snapshot("a", "lead"), []);
  entries = saveResumeSnapshot(storage, snapshot("b", "stack"), entries);
  entries = removeResumeSnapshot(storage, "a", entries);
  assert.equal(loadResumeSnapshot(storage, "a"), null);
  assert.equal(loadResumeSnapshot(storage, "b")?.template, "stack");
  assert.deepEqual(entries.map(entry => entry.id), ["b"]);
  assert.deepEqual(loadDraftEntries(storage).map(entry => entry.id), ["b"]);
});

test("active-draft persistence restores the chosen template and fails before replacing its cache", () => {
  const storage = new MemoryStorage(), active = snapshot("selected", "lead");
  saveActiveResume(storage, active);
  const payload = JSON.parse(storage.getItem("offerforge-react-resume")!);
  const restored = hydrateResumeState(payload.state, snapshot("default"));
  assert.equal(payload.version, 0);
  assert.equal(restored.resume.id, "selected");
  assert.equal(restored.template, "lead");
  storage.failOnWrite = "offerforge-react-resume";
  assert.throws(() => saveActiveResume(storage, snapshot("other")), /Quota/);
  assert.equal(JSON.parse(storage.getItem("offerforge-react-resume")!).state.resume.id, "selected");
});
