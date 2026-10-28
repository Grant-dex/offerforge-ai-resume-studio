import assert from "node:assert/strict";
import test from "node:test";
import { defaultResume } from "../src/data/defaultResume.ts";
import { createResumeShareUrl, MAX_SHARE_URL_LENGTH, readResumeShare } from "../src/utils/resumeShare.ts";

const fixture = () => structuredClone(defaultResume);
const searchOf = (url: string) => url.slice(url.indexOf("?"));
const legacy = (data: unknown, template = "focus") => new URLSearchParams({ data: btoa(encodeURIComponent(JSON.stringify(data))), template }).toString();

test("Chinese, line breaks and emoji round-trip in each template", () => {
  const resume = fixture();
  resume.personal.name = "林晓🌟";
  resume.personal.summary = "负责需求沟通\n完成交付验证 & 回顾";
  for (const template of ["focus", "stack", "lead"] as const) {
    const shared = readResumeShare(searchOf(createResumeShareUrl(resume, template, "https://example.test/studio/")));
    assert.ok(shared);
    assert.equal(shared.template, template);
    assert.equal(shared.resume.personal.name, resume.personal.name);
    assert.equal(shared.resume.personal.summary, resume.personal.summary);
    assert.deepEqual(shared.resume.work[1].bullets, resume.work[1].bullets);
    assert.deepEqual(shared.resume.education, resume.education.description ? resume.education : { ...resume.education, description: "" });
  }
});

test("default sharing excludes contact fields and even a large avatar without mutating the source", () => {
  const resume = fixture();
  resume.personal.avatar = `data:image/png;base64,${"A".repeat(200_000)}`;
  const before = structuredClone(resume);
  const url = createResumeShareUrl(resume, "focus", "https://example.test/");
  const shared = readResumeShare(searchOf(url));
  assert.ok(shared);
  assert.equal(shared.resume.personal.phone, "");
  assert.equal(shared.resume.personal.email, "");
  assert.equal(shared.resume.personal.avatar, "");
  assert.ok(url.length < MAX_SHARE_URL_LENGTH);
  assert.deepEqual(resume, before);
});

test("explicit options retain phone, email and a supported inline avatar", () => {
  const resume = fixture();
  resume.personal.avatar = "data:image/png;base64,aGVsbG8=";
  const shared = readResumeShare(searchOf(createResumeShareUrl(resume, "stack", "https://example.test/", { includeContacts: true, includeAvatar: true })));
  assert.ok(shared);
  assert.equal(shared.resume.personal.email, resume.personal.email);
  assert.equal(shared.resume.personal.phone, resume.personal.phone);
  assert.equal(shared.resume.personal.avatar, resume.personal.avatar);
});

test("legacy URI/base64 links remain readable and unknown templates fall back safely", () => {
  const resume = fixture();
  const shared = readResumeShare(legacy(resume, "unknown"));
  assert.ok(shared);
  assert.equal(shared.template, "focus");
  assert.equal(shared.resume.personal.summary, resume.personal.summary);
  assert.equal(shared.resume.personal.email, resume.personal.email);
});

test("new encoding reduces Chinese payload size compared with legacy URI encoding", () => {
  const resume = fixture();
  const current = searchOf(createResumeShareUrl(resume, "focus", "https://example.test/"));
  assert.ok(current.length < legacy(resume).length / 2);
});

test("malformed payloads fail closed instead of crashing the resume renderer", () => {
  const resume = fixture();
  for (const value of [null, [], { ...resume, personal: [] }, { ...resume, personal: { ...resume.personal, summary: {} } },
    { ...resume, education: { ...resume.education, description: 55 } }, { ...resume, skills: [null] },
    { ...resume, work: [null] }, { ...resume, projects: [{ ...resume.projects[0], bullets: [42] }] },
    { ...resume, work: [{ ...resume.work[0], tags: [null] }] }, { ...resume, education: { ...resume.education, tags: [{}] } }]) {
    assert.equal(readResumeShare(legacy(value)), null);
  }
  for (const query of ["", "data=invalid", "v=99&data=e30=", "v=2&data=_w"]) assert.equal(readResumeShare(query), null);
});

test("untrusted avatars and extra fields cannot cause remote image requests", () => {
  const resume = fixture();
  for (const avatar of ["https://tracker.example.test/avatar.png", "data:image/svg+xml;base64,PHN2Zy8+", "javascript:alert(1)"]) {
    const shared = readResumeShare(legacy({ ...resume, secret: "not part of the resume", personal: { ...resume.personal, avatar } }));
    assert.ok(shared);
    assert.equal(shared.resume.personal.avatar, "");
    assert.equal((shared.resume as unknown as Record<string, unknown>).secret, undefined);
  }
});

test("oversized text and selected large avatars produce an actionable error", () => {
  const resume = fixture();
  resume.personal.summary = "较长的项目经历".repeat(5000);
  assert.throws(() => createResumeShareUrl(resume, "focus", "https://example.test/"), /PDF \/ Word/);
  resume.personal.summary = "项目经历";
  resume.personal.avatar = `data:image/png;base64,${"A".repeat(30_000)}`;
  assert.throws(() => createResumeShareUrl(resume, "focus", "https://example.test/", { includeContacts: false, includeAvatar: true }), /PDF \/ Word/);
  assert.equal(readResumeShare(`v=2&data=${"A".repeat(MAX_SHARE_URL_LENGTH)}`), null);
});

test("empty work and project arrays survive sharing without inserted sample content", () => {
  const resume = fixture();
  resume.work = []; resume.projects = []; resume.skills = [];
  const shared = readResumeShare(searchOf(createResumeShareUrl(resume, "lead", "https://example.test/#/export")));
  assert.ok(shared);
  assert.deepEqual(shared.resume.work, []);
  assert.deepEqual(shared.resume.projects, []);
  assert.deepEqual(shared.resume.skills, []);
});
