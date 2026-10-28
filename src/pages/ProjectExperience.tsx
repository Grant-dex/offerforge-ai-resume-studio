import { ExperienceEditor } from "../components/ExperienceEditor";
import { dateRange } from "../data/resumeTemplates";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { BulletEditor, Field, StepHeading, TagEditor } from "./BasicInfo";

export function ProjectExperiencePage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  const resumeId = useResumeStore(state => state.resume.id);
  const projects = useResumeStore(state => state.resume.projects);
  const updateProject = useResumeStore(state => state.updateProject);
  const addProject = useResumeStore(state => state.addProject);
  const moveProject = useResumeStore(state => state.moveProject);
  const removeProject = useResumeStore(state => state.removeProject);
  const restoreProject = useResumeStore(state => state.restoreProject);

  return <div className="min-w-0">
    <StepHeading title={zh ? "项目经历" : t("project.title")} subtitle={zh ? "选择与岗位相关的项目，突出你的具体贡献。" : "Choose relevant projects and describe your contribution."}/>
    <ExperienceEditor key={resumeId} items={projects} resumeId={resumeId} zh={zh} kind="project" title={item => item.name} summary={item => [item.role, dateRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")} onAdd={addProject} onMove={moveProject} onRemove={removeProject} onRestore={restoreProject}>
      {project => <>
        <Field value={project.name} label={t("project.name")} onChange={name => updateProject(project.id, { name })}/>
        <Field value={project.role} label={t("project.role")} onChange={role => updateProject(project.id, { role })}/>
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <Field value={project.startDate} label={t("project.startDate")} placeholder="2023-06" onChange={startDate => updateProject(project.id, { startDate })}/>
          <Field value={project.endDate} label={zh ? "结束时间" : "End date"} placeholder={zh ? "2025-09 / 至今" : "2025-09 / Present"} onChange={endDate => updateProject(project.id, { endDate })}/>
        </div>
        <BulletEditor label={zh ? "项目内容与成果" : "Project details & results"} bullets={project.bullets} onChange={bullets => updateProject(project.id, { bullets })} placeholder={zh ? "项目要解决什么问题？你负责了哪一部分？\n描述关键行动和能够核实的项目结果。" : "What problem did the project solve? What did you own?\nDescribe key actions and verified outcomes."}/>
        <TagEditor label={t("work.keywordTags")} tags={project.tags} onUpdate={tags => updateProject(project.id, { tags })} placeholder={t("work.tagPlaceholder")}/>
      </>}
    </ExperienceEditor>
  </div>;
}
