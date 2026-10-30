import { Pencil } from "lucide-react";
import { nonemptyLines, type ResumeSectionKey } from "../../data/resumeTemplates";
import type { Education, PersonalInfo, ProjectExperience, ResumeData, WorkExperience } from "../../types/resume";

export type EditableSection = "basic" | "work" | "projects" | "skills";
export type EditSection = (section: EditableSection) => void;

export interface ResumeModel {
  personal: PersonalInfo;
  work: WorkExperience[];
  projects: ProjectExperience[];
  skills: string[];
  education: Education;
  hasEducation: boolean;
}

/** One place decides what counts as "written", so every template drops the same empty rows. */
export function prepareResume(resume: ResumeData): ResumeModel {
  const education = resume.education;
  const work = (Array.isArray(resume.work) ? resume.work : []).filter((item) =>
    item.company || item.title || item.city || item.startDate || item.endDate || nonemptyLines(item.bullets).length || nonemptyLines(item.tags).length);
  const projects = (Array.isArray(resume.projects) ? resume.projects : []).filter((item) =>
    item.name || item.role || item.startDate || item.endDate || nonemptyLines(item.bullets).length || nonemptyLines(item.tags).length);
  return {
    personal: resume.personal,
    work,
    projects,
    skills: nonemptyLines(resume.skills),
    education,
    hasEducation: !!(education && (education.school || education.degree || education.major || education.years || education.description || nonemptyLines(education.tags).length)),
  };
}

export const SECTION_META: Record<ResumeSectionKey, { title: string; en: string; edit: EditableSection }> = {
  summary: { title: "个人简介", en: "Profile", edit: "basic" },
  work: { title: "工作经历", en: "Experience", edit: "work" },
  projects: { title: "项目经历", en: "Projects", edit: "projects" },
  education: { title: "教育背景", en: "Education", edit: "skills" },
  skills: { title: "专业技能", en: "Skills", edit: "skills" },
};

export function hasSection(model: ResumeModel, key: ResumeSectionKey): boolean {
  switch (key) {
    case "summary": return !!model.personal.summary?.trim();
    case "work": return model.work.length > 0;
    case "projects": return model.projects.length > 0;
    case "education": return model.hasEducation;
    case "skills": return model.skills.length > 0;
  }
}

/** Only rendered sections take a number in the outline. */
export function presentSections(model: ResumeModel, order: ResumeSectionKey[]): ResumeSectionKey[] {
  return order.filter((key) => hasSection(model, key));
}

export function isSectionActive(activeSection: string | undefined, key: ResumeSectionKey): boolean {
  const target = SECTION_META[key].edit;
  return activeSection === key || activeSection === target || (target === "basic" && activeSection === "basic");
}

export function BulletLines({ lines, className }: { lines?: string[]; className?: string }) {
  const items = nonemptyLines(lines);
  if (!items.length) return null;
  return <ul className={className}>{items.map((line, index) => <li data-pdf-line key={index}>{line}</li>)}</ul>;
}

export function TagLine({ tags, className }: { tags?: string[]; className?: string }) {
  const items = nonemptyLines(tags);
  if (!items.length) return null;
  return <p data-pdf-line className={className}>{items.join(" · ")}</p>;
}

/** Edit affordances are hover/focus-only on pointer devices and always visible on touch. */
export function EditChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span data-preview-only className="edit-chip">
      <button type="button" onClick={onClick} aria-label={`编辑${label}`} title={`编辑${label}`}>
        <Pencil size={11} aria-hidden="true" />编辑
      </button>
    </span>
  );
}
