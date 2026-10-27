import type { TemplateKey } from "../types/resume";

export type ResumeSectionKey = "summary" | "work" | "projects" | "education" | "skills";

export const resumeTemplates: { key: TemplateKey; name: string; audience: string; description: string; order: ResumeSectionKey[] }[] = [
  { key: "focus", name: "经典单栏", audience: "通用投递", description: "简介开篇，清晰呈现职业经历。", order: ["summary", "work", "projects", "education", "skills"] },
  { key: "stack", name: "项目优先", audience: "技术 / 转行", description: "先呈现项目，突出实际解决问题的能力。", order: ["projects", "summary", "work", "skills", "education"] },
  { key: "lead", name: "教育优先", audience: "应届 / 实习", description: "教育背景在前，衔接项目与实践。", order: ["education", "projects", "work", "skills", "summary"] }
];

export function getResumeTemplate(key: TemplateKey) {
  return resumeTemplates.find((item) => item.key === key) ?? resumeTemplates[0];
}

export function nonemptyLines(value?: string[]) {
  return Array.isArray(value) ? value.filter((line) => typeof line === "string" && line.trim()) : [];
}

export function dateRange(start?: string, end?: string) {
  return [start, end].filter(Boolean).join(" — ");
}
