import type { ResumeData, TemplateKey } from "../types/resume";
import type { ResumeSectionKey } from "../data/resumeTemplates";
import { legacyOrderForTemplate, normalizeSectionOrder, resolveSectionOrder } from "../data/sectionOrder";

export interface ShareOptions { includeContacts: boolean; includeAvatar: boolean; }
export const DEFAULT_SHARE_OPTIONS: ShareOptions = { includeContacts: false, includeAvatar: false };
export const MAX_SHARE_URL_LENGTH = 24_000;
const MAX_LEGACY_PAYLOAD_LENGTH = 4_000_000;
const TOO_LONG_MESSAGE = "简历内容较长，无法生成可靠的分享链接。请取消包含头像，或改用 PDF / Word 文件分享。";

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object");
  return value as RecordValue;
}
function string(value: unknown, maximum = 20_000): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error("Invalid text");
  if (value.length > maximum) throw new RangeError("Text too long");
  return value;
}
function list(value: unknown, maximum = 200): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Invalid list");
  if (value.length > maximum) throw new RangeError("List too long");
  return value;
}
const strings = (value: unknown) => list(value).map(item => {
  if (typeof item !== "string") throw new Error("Invalid list item");
  return string(item);
});
const templateKey = (value: unknown): TemplateKey => value === "stack" || value === "lead" ? value : "focus";

/** Copy known fields only; a shared URL must never cause an external avatar request. */
function normalizeSharedResume(value: unknown): ResumeData {
  const data = object(value), personal = object(data.personal), education = object(data.education);
  const avatar = string(personal.avatar, MAX_LEGACY_PAYLOAD_LENGTH);
  const safeAvatar = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar) ? avatar : "";
  return {
    id: string(data.id) || "shared-resume", title: string(data.title), subtitle: string(data.subtitle), lastSaved: string(data.lastSaved),
    aiScore: 0, atsScore: 0,
    personal: {
      resumeTitle: string(personal.resumeTitle), name: string(personal.name), role: string(personal.role), seniority: string(personal.seniority),
      email: string(personal.email), phone: string(personal.phone), city: string(personal.city), summary: string(personal.summary), avatar: safeAvatar,
    },
    education: {
      school: string(education.school), major: string(education.major), degree: string(education.degree), years: string(education.years),
      description: string(education.description), tags: strings(education.tags),
    },
    skills: strings(data.skills),
    work: list(data.work, 100).map((entry, index) => {
      const item = object(entry);
      return {
        id: `shared-work-${index}`, company: string(item.company), title: string(item.title), city: string(item.city),
        startDate: string(item.startDate), endDate: string(item.endDate), bullets: strings(item.bullets), tags: strings(item.tags),
      };
    }),
    projects: list(data.projects, 100).map((entry, index) => {
      const item = object(entry);
      return {
        id: `shared-project-${index}`, name: string(item.name), role: string(item.role), startDate: string(item.startDate), endDate: string(item.endDate),
        bullets: strings(item.bullets), tags: strings(item.tags),
      };
    }),
  };
}

function utf8Base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createResumeShareUrl(
  resume: ResumeData,
  template: TemplateKey,
  baseUrl: string,
  options: ShareOptions = DEFAULT_SHARE_OPTIONS,
  sectionOrder: ResumeSectionKey[] = legacyOrderForTemplate(template),
): string {
  // Remove unselected personal data before normalization or encoding.
  const source = {
    ...resume,
    personal: {
      ...resume.personal,
      phone: options.includeContacts ? resume.personal.phone : "",
      email: options.includeContacts ? resume.personal.email : "",
      avatar: options.includeAvatar ? resume.personal.avatar : "",
    },
  };
  if (JSON.stringify(source).length > MAX_SHARE_URL_LENGTH) throw new Error(TOO_LONG_MESSAGE);
  let shared: ResumeData;
  try { shared = normalizeSharedResume(source); }
  catch (error) {
    if (error instanceof RangeError) throw new Error(TOO_LONG_MESSAGE);
    throw new Error("部分简历内容格式不正确，请检查填写内容后重新生成链接。");
  }
  const params = new URLSearchParams({
    v: "2",
    data: utf8Base64(JSON.stringify(shared)),
    template: templateKey(template),
    order: normalizeSectionOrder(sectionOrder).join(","),
  });
  const url = `${baseUrl.split("#")[0]}#/shared?${params.toString()}`;
  if (url.length > MAX_SHARE_URL_LENGTH) throw new Error(TOO_LONG_MESSAGE);
  return url;
}

export function readResumeShare(search: string): { resume: ResumeData; template: TemplateKey; sectionOrder: ResumeSectionKey[] } | null {
  try {
    if (search.length > MAX_LEGACY_PAYLOAD_LENGTH) return null;
    const params = new URLSearchParams(search);
    const encoded = params.get("data");
    if (!encoded) return null;
    const version = params.get("v");
    if (version && version !== "2") return null;
    if (version === "2" && search.length > MAX_SHARE_URL_LENGTH) return null;
    const json = version === "2"
      ? new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")), character => character.charCodeAt(0)))
      : decodeURIComponent(atob(encoded));
    const template = templateKey(params.get("template"));
    const sectionOrder = resolveSectionOrder(params.get("order")?.split(","), template);
    return { resume: normalizeSharedResume(JSON.parse(json)), template, sectionOrder };
  } catch { return null; }
}
