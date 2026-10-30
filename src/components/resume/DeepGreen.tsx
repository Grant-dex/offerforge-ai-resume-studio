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

/** C · 墨绿：深色头图承载身份信息，正文留白，菱形做章节锚点。 */
export function DeepGreenTemplate({ model, order, activeSection, onEditSection, documentId }: TemplateProps) {
  const { personal, work, projects, skills, education } = model;
  const present = presentSections(model, order);

  return (
    <article id={documentId ?? undefined} className="resume-paper tpl-deep" aria-label="简历内容预览">
      <header className={`r-band ${personal.avatar ? "has-avatar" : ""}`} data-resume-section="basic" data-active={isSectionActive(activeSection, "summary")} data-pdf-block>
        {onEditSection && <EditChip label="基本信息" onClick={() => onEditSection("basic")} />}
        <p className="r-kicker">Curriculum Vitae</p>
        <h1 className="r-name">{personal.name || "你的姓名"}</h1>
        {(personal.role || personal.seniority) && <p className="r-role">{personal.role}{personal.seniority ? <span className="r-role-sub">{personal.role ? " · " : ""}{personal.seniority}</span> : null}</p>}
        <div className="r-contact">
          {[personal.city, personal.phone, personal.email].filter(Boolean).map((item) => <span key={item}>{item}</span>)}
        </div>
        {personal.avatar && <img className="r-avatar" src={personal.avatar} alt={`${personal.name || "简历"}的头像`} />}
      </header>

      <div className="r-body">
        {order.map((key) => {
          if (!present.includes(key)) return null;
          const meta = SECTION_META[key];
          return (
            <section key={key} className="r-section" data-resume-section={key} data-active={isSectionActive(activeSection, key)}>
              <h2 className="r-h2">
                <span className="zh">{meta.title}</span><span className="en">{meta.en}</span>
                {onEditSection && <EditChip label={meta.title} onClick={() => onEditSection(meta.edit)} />}
              </h2>

              {key === "summary" && <p className="r-text" data-pdf-block>{personal.summary}</p>}

              {key === "work" && work.map((item) => (
                <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="work" data-entry-label={item.company || "工作经历"}>
                  <div className="r-entry-head">
                    <p><span className="r-org">{item.company || "未填写公司"}</span>{[item.title, item.city].filter(Boolean).length > 0 && <span className="r-job">{[item.title, item.city].filter(Boolean).join(" · ")}</span>}</p>
                    <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                  </div>
                  <BulletLines lines={item.bullets} className="r-bullets" />
                  <TagLine tags={item.tags} className="r-tags" />
                </div>
              ))}

              {key === "projects" && projects.map((item) => (
                <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="project" data-entry-label={item.name || "项目经历"}>
                  <div className="r-entry-head">
                    <p><span className="r-org">{item.name || "未命名项目"}</span>{item.role && <span className="r-job">{item.role}</span>}</p>
                    <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                  </div>
                  <BulletLines lines={item.bullets} className="r-bullets" />
                  <TagLine tags={item.tags} className="r-tags" />
                </div>
              ))}

              {key === "education" && (
                <div className="r-entry" data-pdf-block>
                  <div className="r-entry-head">
                    <p><span className="r-org">{education.school || "未填写学校"}</span><span className="r-job">{[education.degree, education.major].filter(Boolean).join(" · ")}</span></p>
                    <span className="r-date">{education.years}</span>
                  </div>
                  <BulletLines lines={education.description?.split("\n")} className="r-bullets" />
                  <TagLine tags={education.tags} className="r-tags" />
                </div>
              )}

              {key === "skills" && (
                <div className="r-skills" data-pdf-block>
                  {skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
