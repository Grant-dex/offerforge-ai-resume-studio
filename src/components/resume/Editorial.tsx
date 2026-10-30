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

/** A · 编辑部：暖纸、宋体标题、编号章节、细线分隔。 */
export function EditorialTemplate({ model, order, activeSection, onEditSection, documentId }: TemplateProps) {
  const { personal, work, projects, skills, education } = model;
  const present = presentSections(model, order);
  const numberOf = (key: ResumeSectionKey) => String(present.indexOf(key) + 1).padStart(2, "0");
  const edit = (label: string, section: "basic" | "work" | "projects" | "skills") =>
    onEditSection && <EditChip label={label} onClick={() => onEditSection(section)} />;

  return (
    <article id={documentId ?? undefined} className="resume-paper tpl-editorial" aria-label="简历内容预览">
      <header className={`r-head ${personal.avatar ? "has-avatar" : ""}`} data-resume-section="basic" data-active={isSectionActive(activeSection, "summary")} data-pdf-block>
        {edit("基本信息", "basic")}
        <p className="r-kicker">Curriculum Vitae · 2026</p>
        <h1 className="r-name">{personal.name || "你的姓名"}</h1>
        {(personal.role || personal.seniority) && <p className="r-role">{personal.role}{personal.seniority ? <span className="r-role-sub">{personal.role ? " · " : ""}{personal.seniority}</span> : null}</p>}
        <div className="r-contact">
          {[personal.city, personal.phone, personal.email].filter(Boolean).map((item) => <span key={item}>{item}</span>)}
        </div>
        {personal.avatar && <img className="r-avatar" src={personal.avatar} alt={`${personal.name || "简历"}的头像`} />}
      </header>

      {order.map((key) => {
        if (!present.includes(key)) return null;
        const meta = SECTION_META[key];
        return (
          <section key={key} className="r-section" data-resume-section={key} data-active={isSectionActive(activeSection, key)}>
            <h2 className="r-h2">
              <span className="r-idx">{numberOf(key)}</span>{meta.title}
              {onEditSection && <EditChip label={meta.title} onClick={() => onEditSection(meta.edit)} />}
            </h2>

            {key === "summary" && <p className="r-text" data-pdf-block>{personal.summary}</p>}

            {key === "work" && work.map((item) => (
              <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="work" data-entry-label={item.company || "工作经历"}>
                <div className="r-entry-head">
                  <p className="r-org">{item.company || "未填写公司"}</p>
                  <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                </div>
                {(item.title || item.city) && <p className="r-job">{[item.title, item.city].filter(Boolean).join(" · ")}</p>}
                <BulletLines lines={item.bullets} className="r-bullets" />
                <TagLine tags={item.tags} className="r-tags" />
              </div>
            ))}

            {key === "projects" && projects.map((item) => (
              <div className="r-entry" key={item.id} data-pdf-block data-entry-id={item.id} data-entry-kind="project" data-entry-label={item.name || "项目经历"}>
                <div className="r-entry-head">
                  <p className="r-org">{item.name || "未命名项目"}</p>
                  <span className="r-date">{dateRange(item.startDate, item.endDate)}</span>
                </div>
                {item.role && <p className="r-job">{item.role}</p>}
                <BulletLines lines={item.bullets} className="r-bullets" />
                <TagLine tags={item.tags} className="r-tags" />
              </div>
            ))}

            {key === "education" && (
              <div data-pdf-block>
                <div className="r-entry-head">
                  <p className="r-org">{education.school || "未填写学校"}</p>
                  <span className="r-date">{education.years}</span>
                </div>
                <p className="r-job">{[education.degree, education.major].filter(Boolean).join(" · ")}</p>
                <BulletLines lines={education.description?.split("\n")} className="r-bullets" />
                <TagLine tags={education.tags} className="r-tags" />
              </div>
            )}

            {key === "skills" && (
              <p className="r-skills" data-pdf-block>
                {skills.map((skill) => <span key={skill}>{skill}</span>)}
              </p>
            )}
          </section>
        );
      })}
    </article>
  );
}
