import assert from "node:assert/strict";
import test from "node:test";
import { defaultResume } from "../src/data/defaultResume.ts";
import { createResumeBackup, makeImportedSnapshot, MAX_BACKUP_BYTES, parseResumeBackup, resumeBackupFilename } from "../src/utils/resumeBackup.ts";
import type { ResumeSnapshot } from "../src/utils/draftLibrary.ts";
import { DEFAULT_ORDER_PRESET, DEFAULT_SECTION_ORDER } from "../src/data/sectionOrder.ts";

const fixture = (): ResumeSnapshot => ({
  version: 1, resume: structuredClone(defaultResume), template: "stack",
  sectionOrder: DEFAULT_SECTION_ORDER, orderPreset: DEFAULT_ORDER_PRESET, lastTouched: "12:34",
});
const exportedAt = "2026-10-28T05:00:00.000Z";
const envelope = () => JSON.parse(createResumeBackup(fixture(), exportedAt));

test("backup round-trip retains full Chinese content, contacts, avatar and all templates", () => {
  const snapshot = fixture();
  snapshot.resume.personal.name = "林晓🌟";
  snapshot.resume.personal.summary = "第一行\n第二行";
  snapshot.resume.personal.avatar = "data:image/png;base64,aGVsbG8=";
  snapshot.resume.education.description = "主修课程\n毕业项目";
  for (const template of ["focus", "stack", "lead"] as const) {
    snapshot.template = template;
    const parsed = parseResumeBackup(createResumeBackup(snapshot, exportedAt));
    assert.deepEqual(parsed.snapshot, snapshot);
    assert.equal(parsed.exportedAt, exportedAt);
    assert.equal(parsed.avatarRemoved, false);
  }
});

test("empty sections remain empty after backup and BOM is accepted", () => {
  const snapshot = fixture();
  snapshot.resume.work = []; snapshot.resume.projects = []; snapshot.resume.skills = [];
  const parsed = parseResumeBackup(`\uFEFF${createResumeBackup(snapshot)}`);
  assert.deepEqual(parsed.snapshot.resume.work, []);
  assert.deepEqual(parsed.snapshot.resume.projects, []);
  assert.deepEqual(parsed.snapshot.resume.skills, []);
});

test("each import allocates fresh resume and experience IDs without changing the backup", () => {
  const source = fixture(), before = structuredClone(source);
  const first = makeImportedSnapshot(source), second = makeImportedSnapshot(source);
  assert.notEqual(first.resume.id, source.resume.id);
  assert.notEqual(first.resume.id, second.resume.id);
  assert.equal(first.resume.title, `${source.resume.title}（导入）`);
  assert.equal(first.resume.personal.resumeTitle, first.resume.title);
  assert.equal(first.template, source.template);
  for (const key of ["work", "projects"] as const) {
    first.resume[key].forEach((entry, index) => {
      assert.notEqual(entry.id, source.resume[key][index].id);
      assert.notEqual(entry.id, second.resume[key][index].id);
      assert.deepEqual(entry.bullets, source.resume[key][index].bullets);
    });
  }
  first.resume.work[0].bullets.push("后续编辑");
  assert.deepEqual(source, before);
});

test("malformed content, unknown format and unsupported versions are rejected", () => {
  for (const input of ["", "not-json", "null", "[]", "{}"]) assert.throws(() => parseResumeBackup(input), /有效/);
  for (const patch of [{ format: "other" }, { version: 2 }, { exportedAt: "yesterday" }, { snapshot: null }]) {
    assert.throws(() => parseResumeBackup(JSON.stringify({ ...envelope(), ...patch })));
  }
  for (const patch of [{ version: 9 }, { template: "unrecognized" }, { lastTouched: null }]) {
    const data = envelope(); Object.assign(data.snapshot, patch);
    assert.throws(() => parseResumeBackup(JSON.stringify(data)));
  }
});

test("invalid nested data is rejected instead of silently losing resume fields", () => {
  for (const change of [
    (resume: any) => { delete resume.personal.name; },
    (resume: any) => { resume.personal.phone = 123; },
    (resume: any) => { resume.education = []; },
    (resume: any) => { resume.skills = [null]; },
    (resume: any) => { resume.work = [null]; },
    (resume: any) => { resume.projects[0].bullets = [55]; },
    (resume: any) => { resume.atsScore = null; },
    (resume: any) => { resume.id = ""; },
  ]) {
    const data = envelope(); change(data.snapshot.resume);
    assert.throws(() => parseResumeBackup(JSON.stringify(data)), /有效/);
  }
});

test("external images and unknown fields are removed at import boundary", () => {
  for (const avatar of ["https://example.test/tracker.png", "data:image/svg+xml;base64,PHN2Zy8+", "javascript:alert(1)"]) {
    const data = envelope();
    data.snapshot.resume.personal.avatar = avatar;
    data.snapshot.resume.privateToken = "unexpected";
    data.snapshot.resume.personal.__proto__ = { injected: true };
    const parsed = parseResumeBackup(JSON.stringify(data));
    assert.equal(parsed.snapshot.resume.personal.avatar, "");
    assert.equal(parsed.avatarRemoved, true);
    assert.equal((parsed.snapshot.resume as any).privateToken, undefined);
    assert.equal((parsed.snapshot.resume.personal as any).injected, undefined);
  }
});

test("5 MB bound counts UTF-8 bytes and applies to both export and import", () => {
  const input = "中".repeat(Math.ceil(MAX_BACKUP_BYTES / 3));
  assert.ok(input.length < MAX_BACKUP_BYTES);
  assert.throws(() => parseResumeBackup(input), /5 MB/);
  const snapshot = fixture(); snapshot.resume.personal.summary = input;
  assert.throws(() => createResumeBackup(snapshot), /5 MB/);
});

test("backup download names remove path/control characters and preserve Chinese", () => {
  assert.equal(resumeBackupFilename("  林晓/产品:经理\n "), "林晓_产品_经理__OfferForge备份.json");
  assert.equal(resumeBackupFilename(" ... "), "我的简历_OfferForge备份.json");
  assert.ok(!/[<>:"/\\|?*\u0000-\u001f]/.test(resumeBackupFilename("a?b*c")));
  assert.equal([...resumeBackupFilename("名".repeat(200)).split("_")[0]].length, 70);
});
