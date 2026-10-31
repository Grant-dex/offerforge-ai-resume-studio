import assert from "node:assert/strict";
import test from "node:test";
import { buildResumeSummary } from "../src/utils/ai.ts";
import { defaultResume } from "../src/data/defaultResume.ts";

test("AI summaries exclude identity, contacts and avatar while retaining evidence for analysis", () => {
  const resume = structuredClone(defaultResume);
  Object.assign(resume.personal, { name: "PRIVATE_NAME_3490", email: "PRIVATE_EMAIL_3490@example.test", phone: "PRIVATE_PHONE_3490", avatar: "PRIVATE_AVATAR_3490", role: "目标销售岗位" });
  resume.education.description = "负责校内项目交付";
  const summary = buildResumeSummary(resume);
  for (const privateValue of [resume.personal.name, resume.personal.email, resume.personal.phone, resume.personal.avatar!]) assert.ok(!summary.includes(privateValue));
  assert.ok(summary.includes("目标销售岗位"));
  assert.ok(summary.includes("负责校内项目交付"));
  assert.ok(summary.includes(resume.work[0].bullets[0]));
});
