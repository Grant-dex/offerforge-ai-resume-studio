import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { Packer } from "docx";
import type { ResumeSectionKey, TemplateKey } from "../src/types/resume.ts";
import { defaultResume } from "../src/data/defaultResume.ts";
import { resumeTemplates } from "../src/data/resumeTemplates.ts";
import { DEFAULT_SECTION_ORDER, ORDER_PRESETS, SECTION_LABELS, legacyOrderForTemplate, matchOrderPreset, normalizeSectionOrder, resolveOrderPreset } from "../src/data/sectionOrder.ts";
import { buildResumeWordDocument } from "../src/utils/exportWord.ts";
import { createResumeShareUrl, readResumeShare } from "../src/utils/resumeShare.ts";
import { createResumeBackup, parseResumeBackup } from "../src/utils/resumeBackup.ts";
import { hydrateResumeState, loadResumeSnapshot, saveActiveResume, saveResumeSnapshot, type ResumeSnapshot } from "../src/utils/draftLibrary.ts";

const PROJECT_FIRST: ResumeSectionKey[] = ["projects", "summary", "work", "skills", "education"];

class MemoryStorage {
  items = new Map<string, string>();
  get length() { return this.items.size; }
  key(index: number) { return [...this.items.keys()][index] ?? null; }
  getItem(key: string) { return this.items.get(key) ?? null; }
  setItem(key: string, value: string) { this.items.set(key, value); }
  removeItem(key: string) { this.items.delete(key); }
}

const snapshot = (template: TemplateKey = "focus", sectionOrder: ResumeSectionKey[] = DEFAULT_SECTION_ORDER): ResumeSnapshot => ({
  version: 1, resume: structuredClone(defaultResume), template, sectionOrder,
  orderPreset: matchOrderPreset(sectionOrder), lastTouched: "10:30",
});

test("order validation drops unknown and duplicate values and keeps all five sections", () => {
  assert.deepEqual(normalizeSectionOrder(["work", "work", "unknown", 42, null]), ["work", "summary", "projects", "education", "skills"]);
  assert.deepEqual(normalizeSectionOrder(undefined), DEFAULT_SECTION_ORDER);
  assert.deepEqual(normalizeSectionOrder([]), DEFAULT_SECTION_ORDER);
  const partial = normalizeSectionOrder(["skills"]);
  assert.equal(partial.length, 5);
  assert.equal(partial[0], "skills");
  assert.equal(new Set(partial).size, 5);
});

test("legacy template orders equal the presets so upgrades do not move content", () => {
  assert.deepEqual(legacyOrderForTemplate("focus"), ORDER_PRESETS[0].order);
  assert.deepEqual(legacyOrderForTemplate("stack"), ORDER_PRESETS[1].order);
  assert.deepEqual(legacyOrderForTemplate("lead"), ORDER_PRESETS[2].order);
  for (const template of resumeTemplates) {
    assert.deepEqual(legacyOrderForTemplate(template.key), template.order, template.key);
  }
});

test("preset labels only survive when they still describe the stored order", () => {
  assert.equal(matchOrderPreset(DEFAULT_SECTION_ORDER), "work");
  assert.equal(matchOrderPreset(PROJECT_FIRST), "projects");
  assert.equal(matchOrderPreset(["summary", "work", "projects", "education", "skills"]), "work");
  assert.equal(matchOrderPreset(["skills", "work", "summary", "projects", "education"]), "custom");
  assert.equal(resolveOrderPreset("custom", PROJECT_FIRST), "custom");
  assert.equal(resolveOrderPreset("work", PROJECT_FIRST), "custom");
  assert.equal(resolveOrderPreset("projects", PROJECT_FIRST), "projects");
  assert.equal(resolveOrderPreset("bogus", PROJECT_FIRST), "projects");
});

test("share links carry the order and old links fall back to their template order", () => {
  const url = createResumeShareUrl(defaultResume, "focus", "https://example.test/", undefined, PROJECT_FIRST);
  const query = url.split("?")[1];
  assert.deepEqual(readResumeShare(query)?.sectionOrder, PROJECT_FIRST);

  const legacyParams = new URLSearchParams(query);
  legacyParams.delete("order");
  const legacyShared = readResumeShare(legacyParams.toString());
  assert.deepEqual(legacyShared?.sectionOrder, legacyOrderForTemplate("focus"));

  legacyParams.set("template", "stack");
  assert.deepEqual(readResumeShare(legacyParams.toString())?.sectionOrder, legacyOrderForTemplate("stack"));

  legacyParams.set("order", "work,work,unknown");
  const repaired = readResumeShare(legacyParams.toString())?.sectionOrder ?? [];
  assert.equal(repaired.length, 5);
  assert.equal(repaired[0], "work");
  assert.equal(new Set(repaired).size, 5);
});

test("backups keep a custom order and old backups recover the legacy template order", () => {
  const custom = snapshot("stack", ["education", "projects", "work", "summary", "skills"]);
  assert.deepEqual(parseResumeBackup(createResumeBackup(custom)).snapshot.sectionOrder, custom.sectionOrder);

  const legacyFile = JSON.parse(createResumeBackup(snapshot("lead")));
  delete legacyFile.snapshot.sectionOrder;
  delete legacyFile.snapshot.orderPreset;
  const restored = parseResumeBackup(JSON.stringify(legacyFile)).snapshot;
  assert.deepEqual(restored.sectionOrder, legacyOrderForTemplate("lead"));
  assert.equal(restored.orderPreset, "education");
});

test("old drafts freeze the order implied by their template on first load", () => {
  const storage = new MemoryStorage();
  storage.setItem(`offerforge-snapshot-${defaultResume.id}`, JSON.stringify({
    version: 1, resume: defaultResume, template: "stack", lastTouched: "09:00",
  }));
  const loaded = loadResumeSnapshot(storage, defaultResume.id)!;
  assert.deepEqual(loaded.sectionOrder, legacyOrderForTemplate("stack"));
  assert.equal(loaded.orderPreset, "projects");
});

test("switching template later does not re-derive the saved order", () => {
  const stored = snapshot("focus", PROJECT_FIRST);
  const switched = hydrateResumeState(
    { resume: stored.resume, template: "lead", sectionOrder: stored.sectionOrder, orderPreset: "projects", lastTouched: "11:00" },
    { resume: defaultResume, template: "focus" as const, sectionOrder: DEFAULT_SECTION_ORDER, orderPreset: "work" as const, lastTouched: "10:00" },
  );
  assert.equal(switched.template, "lead");
  assert.deepEqual(switched.sectionOrder, PROJECT_FIRST);
});

test("Word export follows the given order, and falls back per template when omitted", async () => {
  const textsFor = async (order?: ResumeSectionKey[]) => {
    const document = await buildResumeWordDocument(defaultResume, "focus", order);
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    const xml = await zip.file("word/document.xml")!.async("string");
    return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((match) => match[1]);
  };
  const assertFollows = (texts: string[], order: ResumeSectionKey[]) => {
    const positions = order.map((key) => texts.indexOf(SECTION_LABELS[key]));
    assert.ok(positions.every((position) => position >= 0), "every heading is present");
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, "headings follow the requested order");
  };

  assertFollows(await textsFor(PROJECT_FIRST), PROJECT_FIRST);
  assertFollows(await textsFor(["education", "work", "summary", "skills", "projects"]), ["education", "work", "summary", "skills", "projects"]);
  assertFollows(await textsFor(), legacyOrderForTemplate("focus"));
});

test("each draft keeps its own order, and the active draft restores it on reload", () => {
  const storage = new MemoryStorage();
  const first = { ...snapshot("focus", PROJECT_FIRST), resume: { ...structuredClone(defaultResume), id: "draft-a" } };
  const second = { ...snapshot("lead", ["education", "projects", "work", "summary", "skills"]), resume: { ...structuredClone(defaultResume), id: "draft-b" } };
  saveResumeSnapshot(storage, first, []);
  saveResumeSnapshot(storage, second, []);

  assert.deepEqual(loadResumeSnapshot(storage, "draft-a")?.sectionOrder, PROJECT_FIRST);
  assert.deepEqual(loadResumeSnapshot(storage, "draft-b")?.sectionOrder, ["education", "projects", "work", "summary", "skills"]);

  saveActiveResume(storage, first);
  const persisted = JSON.parse(storage.getItem("offerforge-react-resume")!).state;
  const restored = hydrateResumeState(persisted, {
    resume: defaultResume, template: "focus" as const,
    sectionOrder: DEFAULT_SECTION_ORDER, orderPreset: "work" as const, lastTouched: "10:00",
  });
  assert.deepEqual(restored.sectionOrder, PROJECT_FIRST);
  assert.equal(restored.orderPreset, "projects");
});
