import type { TemplateKey } from "../types/resume";

export type ResumeSectionKey = "summary" | "work" | "projects" | "education" | "skills";

export interface TemplateStyle {
  /** Paper colour, also used by the PDF snapshot. */
  paper: string;
  accent: string;
  /** Hairline colour used between sections, shared with Word export. */
  rule: string;
  /** Word/PDF heading family; the live preview uses the CSS stack. */
  headingFont: string;
  /** Word name size in half-points. */
  nameSize: number;
}

export const resumeTemplates: {
  key: TemplateKey;
  name: string;
  audience: string;
  description: string;
  order: ResumeSectionKey[];
  style: TemplateStyle;
}[] = [
  {
    key: "focus",
    name: "暖纸衬线",
    audience: "通用投递",
    description: "编号章节、细线分隔、宋体标题，读起来像一份纸质简历。",
    order: ["summary", "work", "projects", "education", "skills"],
    style: { paper: "#FBF8F3", accent: "#A8452B", rule: "#E0D7C9", headingFont: "宋体", nameSize: 52 },
  },
  {
    key: "stack",
    name: "冷灰网格",
    audience: "理性、克制",
    description: "左侧栏目标签、右侧内容对齐，信息密度高。",
    order: ["projects", "summary", "work", "skills", "education"],
    style: { paper: "#FFFFFF", accent: "#1F4FD8", rule: "#E3E3E3", headingFont: "Arial", nameSize: 54 },
  },
  {
    key: "lead",
    name: "墨绿商务",
    audience: "稳重、正式",
    description: "深色头图承载身份与联系方式，正文留白，稳重有识别度。",
    order: ["education", "summary", "projects", "work", "skills"],
    style: { paper: "#FFFDF8", accent: "#1E3A33", rule: "#DCD6C7", headingFont: "宋体", nameSize: 50 },
  },
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
