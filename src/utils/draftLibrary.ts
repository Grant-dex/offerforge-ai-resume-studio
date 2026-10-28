import type { ResumeData, TemplateKey } from "../types/resume";

export interface RecentEntry { id: string; title: string; lastEdited: string; }
export interface ResumeSnapshot { version: 1; resume: ResumeData; template: TemplateKey; lastTouched: string; }
type DraftStorage = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;
const PREFIX = "offerforge-snapshot-";
const INDEX_KEY = "offerforge-recents";
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown) => typeof value === "string" ? value : "";
const lines = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
export const savedTemplate = (value: unknown): TemplateKey => value === "stack" || value === "lead" ? value : "focus";

/** Persisted JSON can only restore data fields, never replace store actions. */
export function hydrateResumeState<T extends { resume: ResumeData; template: TemplateKey; lastTouched: string }>(persisted: unknown, current: T): T {
  const saved = record(persisted);
  return {
    ...current,
    resume: normalizeDraftResume(saved?.resume) ?? current.resume,
    template: saved ? savedTemplate(saved.template) : current.template,
    lastTouched: typeof saved?.lastTouched === "string" ? saved.lastTouched : current.lastTouched,
  };
}

/** Repair missing legacy fields without filling a user's draft with sample content. */
export function normalizeDraftResume(value: unknown): ResumeData | null {
  const source = record(value), personal = record(source?.personal), education = record(source?.education);
  if (!source || !personal || !education || !text(source.id)) return null;
  return {
    id: text(source.id), title: text(source.title) || text(personal.resumeTitle) || "未命名简历",
    subtitle: text(source.subtitle), lastSaved: text(source.lastSaved),
    personal: { resumeTitle: text(personal.resumeTitle) || text(source.title), name: text(personal.name), role: text(personal.role), seniority: text(personal.seniority), email: text(personal.email), phone: text(personal.phone), city: text(personal.city), summary: text(personal.summary), avatar: text(personal.avatar) },
    education: { school: text(education.school), major: text(education.major), degree: text(education.degree), years: text(education.years), description: text(education.description), tags: lines(education.tags) },
    skills: lines(source.skills),
    work: (Array.isArray(source.work) ? source.work : []).flatMap((value, index) => {
      const item = record(value);
      return item ? [{ id: text(item.id) || `work-restored-${index}`, company: text(item.company), title: text(item.title), city: text(item.city), startDate: text(item.startDate), endDate: text(item.endDate), bullets: lines(item.bullets), tags: lines(item.tags) }] : [];
    }),
    projects: (Array.isArray(source.projects) ? source.projects : []).flatMap((value, index) => {
      const item = record(value);
      return item ? [{ id: text(item.id) || `project-restored-${index}`, name: text(item.name), role: text(item.role), startDate: text(item.startDate), endDate: text(item.endDate), bullets: lines(item.bullets), tags: lines(item.tags) }] : [];
    }),
    aiScore: typeof source.aiScore === "number" && Number.isFinite(source.aiScore) ? source.aiScore : 0,
    atsScore: typeof source.atsScore === "number" && Number.isFinite(source.atsScore) ? source.atsScore : 0,
  };
}

export function loadResumeSnapshot(storage: DraftStorage, id: string): ResumeSnapshot | null {
  try {
    const raw = record(JSON.parse(storage.getItem(`${PREFIX}${id}`) || "null"));
    if (!raw) return null;
    const envelope = record(raw.resume);
    if (envelope && raw.version !== 1) return null;
    const resume = normalizeDraftResume(envelope ?? raw);
    if (!resume || resume.id !== id) return null;
    return { version: 1, resume, template: savedTemplate(raw.template), lastTouched: text(raw.lastTouched) || resume.lastSaved || "--:--" };
  } catch { return null; }
}

/** Recover snapshots that older versions dropped from their five-item index. */
export function loadDraftEntries(storage: DraftStorage): RecentEntry[] {
  const entries: RecentEntry[] = [];
  const seen = new Set<string>();
  const add = (id: string, lastEdited?: unknown) => {
    if (seen.has(id)) return;
    const snapshot = loadResumeSnapshot(storage, id);
    if (!snapshot) return;
    seen.add(id);
    entries.push({ id, title: snapshot.resume.title, lastEdited: text(lastEdited) || snapshot.lastTouched });
  };
  try {
    let index: unknown;
    try { index = JSON.parse(storage.getItem(INDEX_KEY) || "[]"); } catch { index = []; }
    if (Array.isArray(index)) for (const value of index) { const entry = record(value); if (entry && text(entry.id)) add(text(entry.id), entry.lastEdited); }
    for (let i = 0; i < storage.length; i += 1) { const key = storage.key(i); if (key?.startsWith(PREFIX)) add(key.slice(PREFIX.length)); }
  } catch { /* Storage may be unavailable; editing can continue in memory. */ }
  return entries;
}

export function saveResumeSnapshot(storage: DraftStorage, snapshot: ResumeSnapshot, entries: RecentEntry[]): RecentEntry[] {
  const entry = { id: snapshot.resume.id, title: snapshot.resume.title, lastEdited: snapshot.lastTouched };
  const next = [entry, ...entries.filter(item => item.id !== entry.id)];
  // Keep the recoverable document even if writing the lightweight index fails.
  storage.setItem(`${PREFIX}${entry.id}`, JSON.stringify(snapshot));
  storage.setItem(INDEX_KEY, JSON.stringify(next));
  return next;
}

/** Match Zustand's persisted envelope so refresh restores the selected draft. */
export function saveActiveResume(storage: DraftStorage, snapshot: ResumeSnapshot): void {
  storage.setItem("offerforge-react-resume", JSON.stringify({ version: 0, state: { resume: snapshot.resume, template: snapshot.template, lastTouched: snapshot.lastTouched } }));
}

export function removeResumeSnapshot(storage: DraftStorage, id: string, entries: RecentEntry[]): RecentEntry[] {
  const next = entries.filter(entry => entry.id !== id);
  storage.setItem(INDEX_KEY, JSON.stringify(next));
  storage.removeItem(`${PREFIX}${id}`);
  return next;
}

export function makeResumeDraft(index: number, id = `resume-${crypto.randomUUID()}`): ResumeData {
  const title = `新简历 ${index}`;
  return { id, title, subtitle: "请完善目标岗位信息", lastSaved: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), personal: { resumeTitle: title, name: "", role: "", seniority: "", email: "", phone: "", city: "", summary: "", avatar: "" }, education: { school: "", major: "", degree: "", years: "", description: "", tags: [] }, work: [], projects: [], skills: [], aiScore: 0, atsScore: 0 };
}

export function duplicateResume(source: ResumeData, id = `resume-${crypto.randomUUID()}`): ResumeData {
  const draft = structuredClone(source);
  draft.id = id;
  draft.title = `${source.title || "未命名简历"}（副本）`;
  draft.personal.resumeTitle = draft.title;
  draft.lastSaved = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return draft;
}
