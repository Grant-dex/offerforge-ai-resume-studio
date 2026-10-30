import type { ReactNode } from "react";
import { dateRange, type ResumeSectionKey } from "../../data/resumeTemplates";
import {
  BulletLines, EditChip, SECTION_META, TagLine, isSectionActive, presentSections, type EditSection, type ResumeModel,
} from "./shared";

interface TemplateProps {
  model: ResumeModel;
  documentId?: string | null;
  order: ResumeSectionKey[];
  activeSection?: string;
  onEditSection?: EditSection;
}

/** B · 网格：左侧栏目标签 + 右侧内容的瑞士式双栏，只有一个强调色。 */
export function SwissTemplate({ model, order, activeSection, onEditSection, documentId }: TemplateProps) {
  const { personal, work, projects, skills, education } = model;
  const present = presentSections(model, order);
  const numberOf = (key: ResumeSectionKey) => String(present.indexOf(key) + 1).padStart(2, "0");

  const row = (key: ResumeSectionKey, content: ReactNode) => {
    const meta = SECTION_META[key];
    return (
      <div key={key} className="r-row" data-resume-section={key} data-active={isSectionActive(activeSection, key)}>
        {onEditSection && <EditChip label={meta.title} onClick={() => onEditSection(meta.edit)} />}
        <div className="r-label"><b>{numberOf(key)}</b>{meta.en}</div>
        <div className="r-body">
          <h2 className="sr-only">{meta.title}</h2>
          {content}
        </div>
      </div>
    );
  };

  return (
    <article id={documentId ?? undefined} className="resume-paper tpl-swiss" aria-label="简历内容预览">
      <div className="r-top" aria-hidden="true" />
      <header className="r-masthead" data-resume-section="basic" data-active={isSectionActive(activeSection, "summary")} data-pdf-block>
        {onEditSection && <EditChip label="基本信息" onClick={() => onEditSection("basic")} />}
        <div className="r-id">
          <h1 className="r-name">{personal.name || "你的姓名"}</h1>
          {personal.role && <p className="r-role">{personal.role}</p>}
          {personal.seniority && <p className="r-seniority">{personal.seniority}</p>}
        </div>
        <div className="r-meta">
          {personal.city && <span>{personal.city}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.email && <span>{personal.email}</span>}
        </div>
        {personal.avatar && <img className="r-avatar" src={personal.avatar} alt={`${personal.name || "简历"}的头像`} />}
      </header>

      {order.map((key) => {
        if (!present.includes(key)) return null;
        if (key === "summary") return row(key, <p className="r-summary" data-pdf-block>{personal.summary}</p>);

        if (key === "work") return row(key, (
          <>
            {work.map((item) => (
              <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="work" data-entry-label={item.company || "工作经历"}>
                <div className="r-entry-head">
                  <p><span className="r-org">{item.company || "未填写公司"}</span>{(item.title || item.city) && <span className="r-job">{[item.title, item.city].filter(Boolean).join(" · ")}</span>}</p>
                  <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                </div>
                <BulletLines lines={item.bullets} className="r-bullets" />
                <TagLine tags={item.tags} className="r-tags" />
              </div>
            ))}
          </>
        ));

        if (key === "projects") return row(key, (
          <>
            {projects.map((item) => (
              <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="project" data-entry-label={item.name || "项目经历"}>
                <div className="r-entry-head">
                  <p><span className="r-org">{item.name || "未命名项目"}</span>{item.role && <span className="r-job">{item.role}</span>}</p>
                  <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                </div>
                <BulletLines lines={item.bullets} className="r-bullets" />
                <TagLine tags={item.tags} className="r-tags" />
              </div>
            ))}
          </>
        ));

        if (key === "education") return row(key, (
          <div className="r-entry" data-pdf-block>
            <div className="r-entry-head">
              <p><span className="r-org">{education.school || "未填写学校"}</span><span className="r-job">{[education.degree, education.major].filter(Boolean).join(" · ")}</span></p>
              <span className="r-date">{education.years}</span>
            </div>
            <BulletLines lines={education.description?.split("\n")} className="r-bullets" />
            <TagLine tags={education.tags} className="r-tags" />
          </div>
        ));

        return row(key, (
          <div className="r-skills" data-pdf-block>
            {skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        ));
      })}
    </article>
  );
}
