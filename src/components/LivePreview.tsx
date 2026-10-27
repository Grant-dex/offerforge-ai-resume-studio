import { Fragment, type ReactNode } from "react";
import { useShallow } from "zustand/shallow";
import { useResumeStore } from "../store/resumeStore";
import { dateRange, getResumeTemplate, nonemptyLines, type ResumeSectionKey } from "../data/resumeTemplates";
import type { ResumeData, TemplateKey } from "../types/resume";

export function LivePreview({ activeSection }: { activeSection?: string }) {
  const { resume, template } = useResumeStore(useShallow((state) => ({ resume: state.resume, template: state.template })));
  return (
    <div className="w-full min-w-0" aria-label="简历实时预览">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span>实时预览</span><span>{getResumeTemplate(template).name} · A4 导出</span>
      </div>
      <ResumeDocument resume={resume} template={template} activeSection={activeSection} />
      <p className="mt-4 text-center text-[11px] leading-5 text-neutral-400">修改即时呈现 · 选中提示不会出现在导出文件中</p>
    </div>
  );
}

/** Shared by the editor and public resume page. Only one paper mounts per route. */
export function ResumeDocument({ resume, template = "focus", activeSection }: { resume: ResumeData; template?: TemplateKey; activeSection?: string }) {
  const { personal, education } = resume;
  const work = (Array.isArray(resume.work) ? resume.work : []).filter((item) => item.company || item.title || item.city || item.startDate || item.endDate || nonemptyLines(item.bullets).length || nonemptyLines(item.tags).length);
  const projects = (Array.isArray(resume.projects) ? resume.projects : []).filter((item) => item.name || item.role || item.startDate || item.endDate || nonemptyLines(item.bullets).length || nonemptyLines(item.tags).length);
  const skills = nonemptyLines(resume.skills);
  const hasEducation = education && (education.school || education.degree || education.major || education.years || education.description || nonemptyLines(education.tags).length);
  const selected = (section: string) => activeSection === section
    || (activeSection === "basic" && section === "summary")
    || (activeSection === "skills" && section === "education");
  const sections: Record<ResumeSectionKey, ReactNode> = {
    summary: personal.summary?.trim() && <PaperSection name="summary" title="个人简介" active={selected("summary")}><p data-pdf-block className="whitespace-pre-line">{personal.summary}</p></PaperSection>,
    work: work.length > 0 && <PaperSection name="work" title="工作经历" active={selected("work")}><div className="space-y-4">{work.map((item) => <div key={item.id} data-pdf-block>
      <EntryHeading title={item.company} date={dateRange(item.startDate, item.endDate)} />
      <p className="mb-1 text-[12px] text-neutral-600">{[item.title, item.city].filter(Boolean).join(" · ")}</p>
      <BulletList lines={item.bullets} /><Tags tags={item.tags} />
    </div>)}</div></PaperSection>,
    projects: projects.length > 0 && <PaperSection name="projects" title="项目经历" active={selected("projects")}><div className="space-y-4">{projects.map((item) => <div key={item.id} data-pdf-block>
      <EntryHeading title={item.name} date={dateRange(item.startDate, item.endDate)} />
      {item.role && <p className="mb-1 text-[12px] text-neutral-600">{item.role}</p>}
      <BulletList lines={item.bullets} /><Tags tags={item.tags} />
    </div>)}</div></PaperSection>,
    education: !!hasEducation && <PaperSection name="education" title="教育背景" active={selected("education")}>
      <div data-pdf-block><EntryHeading title={education.school} date={education.years} />
      <p className="text-[12px] text-neutral-600">{[education.degree, education.major].filter(Boolean).join(" · ")}</p>
      <BulletList lines={education.description?.split("\n")} /><Tags tags={education.tags} /></div>
    </PaperSection>,
    skills: skills.length > 0 && <PaperSection name="skills" title="专业技能" active={selected("skills")}><p data-pdf-block>{skills.join(" / ")}</p></PaperSection>
  };
  return (
    <article id="resume-preview" className="resume-paper mx-auto w-full max-w-[794px] border border-neutral-200 bg-white px-6 py-8 text-[12px] leading-[1.85] text-neutral-700 shadow-[0_4px_20px_rgba(0,0,0,0.035)] sm:px-9 sm:py-10" style={{ overflowWrap: "anywhere", minHeight: "600px", colorScheme: "light" }} aria-label="简历内容预览">
      <header data-resume-section="basic" data-active={selected("basic")} data-pdf-block className="mb-6 border-b-2 border-neutral-700 pb-5" style={selectionStyle(selected("basic"))}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-[0.08em] text-neutral-900">{personal.name || "你的姓名"}</h1>
            {personal.role && <p className="mt-2 text-sm font-medium text-neutral-800">{personal.role}</p>}
            {personal.seniority && <p className="mt-1 text-xs text-neutral-600">{personal.seniority}</p>}
          </div>
          {personal.avatar && <img src={personal.avatar} alt={`${personal.name || "简历"}的头像`} className="h-20 w-16 shrink-0 rounded-sm object-cover" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600">
          {[personal.city, personal.phone, personal.email].filter(Boolean).map((contact, index) => <span key={index}>{contact}</span>)}
        </div>
      </header>
      {getResumeTemplate(template).order.map((key) => <Fragment key={key}>{sections[key]}</Fragment>)}
    </article>
  );
}

function selectionStyle(active: boolean) {
  return active ? { backgroundColor: "#fafafa", outline: "1px dashed #d4d4d4", outlineOffset: "7px" } : undefined;
}

function PaperSection({ name, title, active, children }: { name: string; title: string; active: boolean; children: ReactNode }) {
  return <section data-resume-section={name} data-active={active} className="mb-5 last:mb-0" style={selectionStyle(active)}>
    <h2 className="mb-2 border-b border-neutral-200 pb-1 text-[13px] font-semibold tracking-[0.08em] text-neutral-900">{title}</h2>{children}
  </section>;
}

function EntryHeading({ title, date }: { title: string; date: string }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
    <h3 className="font-semibold text-neutral-900">{title}</h3>{date && <span className="text-[11px] text-neutral-500">{date}</span>}
  </div>;
}

function BulletList({ lines }: { lines?: string[] }) {
  const items = nonemptyLines(lines);
  return items.length > 0 ? <ul className="mt-1 list-disc space-y-0.5 pl-4">{items.map((line, index) => <li data-pdf-line key={index} className="whitespace-pre-line pl-0.5">{line}</li>)}</ul> : null;
}

function Tags({ tags }: { tags?: string[] }) {
  const items = nonemptyLines(tags);
  return items.length > 0 ? <p data-pdf-line className="mt-1.5 text-[11px] text-neutral-500">{items.join(" · ")}</p> : null;
}
