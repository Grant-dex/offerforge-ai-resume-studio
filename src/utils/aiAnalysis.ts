import type { ResumeData } from "../types/resume";
import type { AISuggestion } from "./ai";

export type SuggestionTarget =
  | { kind: "summary"; label: string }
  | { kind: "work" | "project"; itemId: string; bulletIndex: number; label: string }
  | { kind: "skill"; index: number; label: string }
  | { kind: "education"; label: string };

// Track the content sent to the AI, without invalidating an analysis for visual
// changes such as a new avatar or a different template.
export function resumeAnalysisKey(resume: ResumeData): string {
  const { name, role, seniority, email, phone, city, summary } = resume.personal;
  return JSON.stringify({
    personal: { name, role, seniority, email, phone, city, summary },
    skills: resume.skills,
    work: resume.work,
    projects: resume.projects,
    education: resume.education,
  });
}

export function suggestionRoute(suggestion: AISuggestion): string {
  if (/项目|project/i.test(suggestion.module)) return "/projects";
  if (/工作|work/i.test(suggestion.module)) return "/work";
  if (/技能|教育|skill|education/i.test(suggestion.module)) return "/skills";
  return "/basic";
}

/** AI responses contain no record IDs. Only a unique exact match is safe to edit. */
export function resolveSuggestionTarget(resume: ResumeData, suggestion: AISuggestion): SuggestionTarget | null {
  if (!suggestion.original.trim() || !suggestion.suggested.trim()) return null;
  const candidates: SuggestionTarget[] = [];
  const module = suggestion.module;
  if (/项目|project/i.test(module)) {
    resume.projects.forEach((item) => item.bullets.forEach((text, bulletIndex) => {
      if (text === suggestion.original) candidates.push({ kind: "project", itemId: item.id, bulletIndex, label: item.name || "未命名项目" });
    }));
  } else if (/工作|work/i.test(module)) {
    resume.work.forEach((item) => item.bullets.forEach((text, bulletIndex) => {
      if (text === suggestion.original) candidates.push({ kind: "work", itemId: item.id, bulletIndex, label: item.company || "未命名工作经历" });
    }));
  } else if (/教育|education/i.test(module)) {
    if (resume.education.description === suggestion.original) candidates.push({ kind: "education", label: "教育经历补充" });
  } else if (/技能|skill/i.test(module)) {
    resume.skills.forEach((text, index) => {
      if (text === suggestion.original) candidates.push({ kind: "skill", index, label: "专业技能" });
    });
  } else if (/个人|基本|简介|summary|personal/i.test(module) || suggestion.field === "summary") {
    if (resume.personal.summary === suggestion.original) candidates.push({ kind: "summary", label: "个人简介" });
  }
  return candidates.length === 1 ? candidates[0] : null;
}

export function suggestionTargetValue(resume: ResumeData, target: SuggestionTarget): string | undefined {
  switch (target.kind) {
    case "summary": return resume.personal.summary;
    case "education": return resume.education.description;
    case "skill": return resume.skills[target.index];
    case "work": return resume.work.find((item) => item.id === target.itemId)?.bullets[target.bulletIndex];
    case "project": return resume.projects.find((item) => item.id === target.itemId)?.bullets[target.bulletIndex];
  }
}

/** The expected value guard also prevents an undo from overwriting a later edit. */
export function replaceSuggestionText(
  resume: ResumeData,
  target: SuggestionTarget,
  expected: string,
  replacement: string,
): ResumeData | null {
  if (suggestionTargetValue(resume, target) !== expected) return null;
  switch (target.kind) {
    case "summary": return { ...resume, personal: { ...resume.personal, summary: replacement } };
    case "education": return { ...resume, education: { ...resume.education, description: replacement } };
    case "skill": return { ...resume, skills: resume.skills.map((text, index) => index === target.index ? replacement : text) };
    case "work": return { ...resume, work: resume.work.map((item) => item.id === target.itemId ? { ...item, bullets: item.bullets.map((text, index) => index === target.bulletIndex ? replacement : text) } : item) };
    case "project": return { ...resume, projects: resume.projects.map((item) => item.id === target.itemId ? { ...item, bullets: item.bullets.map((text, index) => index === target.bulletIndex ? replacement : text) } : item) };
  }
}
