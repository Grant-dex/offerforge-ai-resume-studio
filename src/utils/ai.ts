import type { ResumeData } from "../types/resume";

const BASE_URL = "/api/ai";

function getAuthToken(): string {
  try {
    const stored = JSON.parse(localStorage.getItem("offerforge-user") || "null");
    return stored?.token || "";
  } catch { return ""; }
}

function getPreferredModel(): string {
  try {
    const stored = localStorage.getItem("offerforge-ai-model");
    if (stored === "flash") return "flash";
    if (stored === "pro") return "pro";
  } catch { /* ignore */ }
  return "flash";
}

async function callAIProxy(
  endpoint: string,
  body: Record<string, any>,
  signal?: AbortSignal
): Promise<any> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("请先登录后再使用 AI 功能");
  }

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return res.json();
}

function buildResumeSummary(resume: ResumeData): string {
  const safe = (s: string | undefined | null) => s || "";
  return `
【基本信息】
姓名：${safe(resume.personal.name)}
目标岗位：${safe(resume.personal.role)}
资历：${safe(resume.personal.seniority)}
邮箱：${safe(resume.personal.email)}
电话：${safe(resume.personal.phone)}
城市：${safe(resume.personal.city)}
个人简介：${safe(resume.personal.summary)}

【技能标签】
${(resume.skills || []).join("、")}

【工作经历】
${(resume.work || []).map((w, i) => `
${i + 1}. ${safe(w.company)} - ${safe(w.title)} (${safe(w.startDate)} ~ ${safe(w.endDate)}, ${safe(w.city)})
${(w.bullets || []).map((b) => `   - ${b}`).join("\n")}
${w.tags?.length ? `   标签：${w.tags.join("、")}` : ""}
`).join("\n")}

【项目经历】
${(resume.projects || []).map((p, i) => `
${i + 1}. ${safe(p.name)} - ${safe(p.role)} (${safe(p.startDate)} ~ ${safe(p.endDate)})
${(p.bullets || []).map((b) => `   - ${b}`).join("\n")}
${p.tags?.length ? `   标签：${p.tags.join("、")}` : ""}
`).join("\n")}

【教育背景】
${safe(resume.education.school)} · ${safe(resume.education.degree)} · ${safe(resume.education.major)} · ${safe(resume.education.years)}
`.trim();
}

export interface AIScoreResult {
  keyword: number;
  format: number;
  completeness: number;
  quantified: number;
  overall: number;
  suggestions: string[];
}

export async function fetchAIScore(resume: ResumeData, signal?: AbortSignal): Promise<AIScoreResult> {
  const summary = buildResumeSummary(resume);
  return callAIProxy("score", { summary, model: getPreferredModel() }, signal);
}

export interface AISuggestion {
  id: string;
  module: string;
  field: string;
  title: string;
  original: string;
  suggested: string;
  priority: "高" | "中" | "低";
}

export async function fetchAISuggestions(resume: ResumeData, signal?: AbortSignal): Promise<AISuggestion[]> {
  const summary = buildResumeSummary(resume);
  return callAIProxy("suggestions", { summary, model: getPreferredModel() }, signal);
}

export interface JDMatchResult {
  score: number;
  matchedSkills: string[];
  suggestion: string;
}

export async function fetchJDMatch(resume: ResumeData, jdText: string, signal?: AbortSignal): Promise<JDMatchResult> {
  const summary = buildResumeSummary(resume);
  return callAIProxy("jd-match", { summary, jdText, model: getPreferredModel() }, signal);
}

export async function fetchAIOptimizeBullets(
  context: { type: "work" | "project"; company?: string; title?: string; project?: string; role?: string },
  originalBullets: string[],
  signal?: AbortSignal
): Promise<string[]> {
  // This function currently not proxied - returns original bullets
  // Can be extended later with a server-side endpoint
  return originalBullets;
}
