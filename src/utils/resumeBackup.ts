import type { ResumeData, TemplateKey } from "../types/resume";
import type { ResumeSnapshot } from "./draftLibrary";
import { resolveOrderPreset, resolveSectionOrder } from "../data/sectionOrder";

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const BACKUP_FORMAT = "offerforge-resume-backup";
const INVALID_BACKUP = "文件内容不是有效的 OfferForge 简历备份，请重新选择由本网站导出的 JSON 文件。";
const SAFE_AVATAR = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export interface ParsedResumeBackup {
  snapshot: ResumeSnapshot;
  exportedAt: string;
  avatarRemoved: boolean;
}

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(INVALID_BACKUP);
  return value as RecordValue;
}
function text(value: unknown, optional = false): string {
  if (optional && value === undefined) return "";
  if (typeof value !== "string") throw new Error(INVALID_BACKUP);
  return value;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error(INVALID_BACKUP);
  return value;
}
const strings = (value: unknown): string[] => list(value).map(item => text(item));
function score(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(INVALID_BACKUP);
  return value;
}
function template(value: unknown): TemplateKey {
  if (value !== "focus" && value !== "stack" && value !== "lead") throw new Error(INVALID_BACKUP);
  return value;
}

/** Rebuild known fields only; importing a file must not trigger external image requests. */
function readResume(value: unknown): { resume: ResumeData; avatarRemoved: boolean } {
  const source = object(value), personal = object(source.personal), education = object(source.education);
  const avatar = text(personal.avatar, true);
  const avatarRemoved = !!avatar && !SAFE_AVATAR.test(avatar);
  const id = text(source.id);
  if (!id.trim()) throw new Error(INVALID_BACKUP);
  return {
    avatarRemoved,
    resume: {
      id, title: text(source.title), subtitle: text(source.subtitle), lastSaved: text(source.lastSaved),
      aiScore: score(source.aiScore), atsScore: score(source.atsScore),
      personal: {
        resumeTitle: text(personal.resumeTitle), name: text(personal.name), role: text(personal.role), seniority: text(personal.seniority),
        email: text(personal.email), phone: text(personal.phone), city: text(personal.city), summary: text(personal.summary), avatar: avatarRemoved ? "" : avatar,
      },
      education: {
        school: text(education.school), major: text(education.major), degree: text(education.degree), years: text(education.years),
        description: text(education.description, true), tags: strings(education.tags),
      },
      skills: strings(source.skills),
      work: list(source.work).map(value => {
        const entry = object(value);
        return { id: text(entry.id), company: text(entry.company), title: text(entry.title), city: text(entry.city), startDate: text(entry.startDate), endDate: text(entry.endDate), bullets: strings(entry.bullets), tags: strings(entry.tags) };
      }),
      projects: list(source.projects).map(value => {
        const entry = object(value);
        return { id: text(entry.id), name: text(entry.name), role: text(entry.role), startDate: text(entry.startDate), endDate: text(entry.endDate), bullets: strings(entry.bullets), tags: strings(entry.tags) };
      }),
    },
  };
}

function checkSize(value: string): void {
  if (new TextEncoder().encode(value).byteLength > MAX_BACKUP_BYTES) throw new Error("备份文件超过 5 MB，请缩小头像或简历内容后重试。");
}

export function createResumeBackup(snapshot: ResumeSnapshot, exportedAt = new Date().toISOString()): string {
  const output = JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt, snapshot }, null, 2);
  // Do not download a backup this version could not restore.
  parseResumeBackup(output);
  return output;
}

export function parseResumeBackup(input: string): ParsedResumeBackup {
  checkSize(input);
  let data: RecordValue;
  try { data = object(JSON.parse(input.replace(/^\uFEFF/, ""))); }
  catch { throw new Error(INVALID_BACKUP); }
  if (data.format !== BACKUP_FORMAT) throw new Error(INVALID_BACKUP);
  if (data.version !== 1) throw new Error("此备份使用了暂不支持的版本，请使用相同或更新版本的 OfferForge 恢复。");
  const saved = object(data.snapshot);
  if (saved.version !== 1) throw new Error(INVALID_BACKUP);
  const exportedAt = text(data.exportedAt);
  if (!exportedAt || !Number.isFinite(Date.parse(exportedAt))) throw new Error(INVALID_BACKUP);
  const { resume, avatarRemoved } = readResume(saved.resume);
  const parsedTemplate = template(saved.template);
  const sectionOrder = resolveSectionOrder(saved.sectionOrder, parsedTemplate);
  return {
    snapshot: {
      version: 1, resume, template: parsedTemplate, sectionOrder,
      orderPreset: resolveOrderPreset(saved.orderPreset, sectionOrder),
      lastTouched: text(saved.lastTouched),
    },
    exportedAt, avatarRemoved,
  };
}

/** Every import is a new document, including when the same file is imported twice. */
export function makeImportedSnapshot(source: ResumeSnapshot): ResumeSnapshot {
  const resume = structuredClone(source.resume);
  resume.id = `resume-${crypto.randomUUID()}`;
  resume.work = resume.work.map(entry => ({ ...entry, id: `work-${crypto.randomUUID()}` }));
  resume.projects = resume.projects.map(entry => ({ ...entry, id: `project-${crypto.randomUUID()}` }));
  resume.title = `${resume.title.trim() || "未命名简历"}（导入）`;
  resume.personal.resumeTitle = resume.title;
  const lastTouched = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  resume.lastSaved = lastTouched;
  return { version: 1, resume, template: source.template, sectionOrder: [...source.sectionOrder], orderPreset: source.orderPreset, lastTouched };
}

export function resumeBackupFilename(title: string): string {
  const clean = title.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_").replace(/[. ]+$/g, "").trim();
  const base = [...clean].slice(0, 70).join("") || "我的简历";
  return `${base}_OfferForge备份.json`;
}
