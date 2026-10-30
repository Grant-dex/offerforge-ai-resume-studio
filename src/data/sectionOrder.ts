import type { TemplateKey } from "../types/resume";
import { getResumeTemplate, type ResumeSectionKey } from "./resumeTemplates";

export type OrderPreset = "work" | "projects" | "education" | "custom";
export type FixedOrderPreset = Exclude<OrderPreset, "custom">;

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "个人简介",
  work: "工作经历",
  projects: "项目经历",
  education: "教育背景",
  skills: "专业技能",
};

export const SECTION_ORDER: ResumeSectionKey[] = ["summary", "work", "projects", "education", "skills"];

export interface OrderPresetDefinition {
  key: FixedOrderPreset;
  name: string;
  hint: string;
  order: ResumeSectionKey[];
}

/**
 * Presets intentionally reuse the orders older templates implied, so a user who
 * upgrades sees the same document until they choose otherwise.
 */
export const ORDER_PRESETS: OrderPresetDefinition[] = [
  { key: "work", name: "工作优先", hint: "先讲职业经历，适合有连续履历的投递。", order: ["summary", "work", "projects", "education", "skills"] },
  { key: "projects", name: "项目优先", hint: "先讲项目成果，适合技术、转行。", order: ["projects", "summary", "work", "skills", "education"] },
  { key: "education", name: "教育优先", hint: "先讲教育背景，适合应届、校招。", order: ["education", "summary", "projects", "work", "skills"] },
];

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = ORDER_PRESETS[0].order;
export const DEFAULT_ORDER_PRESET: FixedOrderPreset = "work";

const known = new Set<string>(SECTION_ORDER);

export function presetByKey(key: FixedOrderPreset): OrderPresetDefinition {
  return ORDER_PRESETS.find((preset) => preset.key === key) ?? ORDER_PRESETS[0];
}

/**
 * Single validation gate for every persisted source (store, drafts, backups, shares).
 * Unknown values are dropped, duplicates removed, and missing sections appended so
 * the result is always a complete five-section order.
 */
export function normalizeSectionOrder(value: unknown, fallback: ResumeSectionKey[] = DEFAULT_SECTION_ORDER): ResumeSectionKey[] {
  const result: ResumeSectionKey[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (typeof item !== "string" || !known.has(item) || result.includes(item as ResumeSectionKey)) continue;
    result.push(item as ResumeSectionKey);
  }
  for (const key of [...fallback, ...SECTION_ORDER]) {
    if (!result.includes(key)) result.push(key);
  }
  return result;
}

export function sameSectionOrder(left: ResumeSectionKey[], right: ResumeSectionKey[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

export function matchOrderPreset(order: ResumeSectionKey[]): OrderPreset {
  return ORDER_PRESETS.find((preset) => sameSectionOrder(preset.order, order))?.key ?? "custom";
}

export function isOrderPreset(value: unknown): value is OrderPreset {
  return value === "work" || value === "projects" || value === "education" || value === "custom";
}

/** Drafts created before the split had no order field: the template implied one. */
export function legacyOrderForTemplate(template: TemplateKey): ResumeSectionKey[] {
  return normalizeSectionOrder(getResumeTemplate(template).order);
}

/** Resolve a persisted order, falling back to the order the old template implied. */
export function resolveSectionOrder(value: unknown, template: TemplateKey): ResumeSectionKey[] {
  return normalizeSectionOrder(value, legacyOrderForTemplate(template));
}

/** Keep a stored preset label only when it still describes the stored order. */
export function resolveOrderPreset(value: unknown, order: ResumeSectionKey[]): OrderPreset {
  if (!isOrderPreset(value) || value === "custom") return isOrderPreset(value) ? "custom" : matchOrderPreset(order);
  return sameSectionOrder(presetByKey(value).order, order) ? value : "custom";
}
