import type { ResumeData } from "../types/resume";

const BASE_URL = "/api/ai";
export interface AIServiceStatus { mode: "local" | "trial"; configured: boolean; remaining?: number; limit?: number; resetAt?: string }
export async function fetchAIServiceStatus(): Promise<AIServiceStatus | null> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/status`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    return ["local", "trial"].includes(data.mode) && typeof data.configured === "boolean" ? data : null;
  } catch { return null; }
}

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
  if (!token && !(await fetchAIServiceStatus())) {
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

  if (!res.headers.get("content-type")?.includes("application/json")) throw new Error("AI 后端未运行。请使用 npm run dev 打开完整功能页面。");
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return res.json();
}

export function buildResumeSummary(resume: ResumeData): string {
  const safe = (s: string | undefined | null) => s || "";
  return `
【基本信息】
目标岗位：${safe(resume.personal.role)}
资历：${safe(resume.personal.seniority)}
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
${safe(resume.education.description)}
${(resume.education.tags || []).join("、")}
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
  return callAIProxy("optimize-bullets", { context, bullets: originalBullets, model: getPreferredModel() }, signal);
}
