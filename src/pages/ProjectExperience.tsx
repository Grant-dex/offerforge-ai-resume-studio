import { Plus, Trash2 } from "lucide-react";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { BulletEditor, Field, StepHeading, TagEditor } from "./BasicInfo";

export function ProjectExperiencePage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  const projects = useResumeStore((state) => state.resume.projects);
  const updateProject = useResumeStore((state) => state.updateProject);
  const addProject = useResumeStore((state) => state.addProject);
  const removeProject = useResumeStore((state) => state.removeProject);

  return (
    <div className="min-w-0">
      <StepHeading title={zh ? "项目经历" : t("project.title")} subtitle={zh ? "选择与岗位相关的项目，突出你的具体贡献。" : "Choose relevant projects and describe your contribution."} />
      <div className="space-y-6">
        {projects.map((project, index) => (
          <section key={project.id} aria-label={`${zh ? "项目经历" : "Project"} ${index + 1}`} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-5 flex min-w-0 items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="min-w-0 break-words text-sm font-semibold text-slate-800">{project.name || (zh ? "新项目经历" : "New project")}</h3>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4">
              <Field value={project.name} label={t("project.name")} onChange={(name) => updateProject(project.id, { name })} />
              <Field value={project.role} label={t("project.role")} onChange={(role) => updateProject(project.id, { role })} />
              <div className="grid min-w-0 grid-cols-2 gap-3">
                <Field value={project.startDate} label={t("project.startDate")} placeholder="2023-06" onChange={(startDate) => updateProject(project.id, { startDate })} />
                <Field value={project.endDate} label={zh ? "结束时间" : "End date"} placeholder={zh ? "2025-09 / 至今" : "2025-09 / Present"} onChange={(endDate) => updateProject(project.id, { endDate })} />
              </div>
              <BulletEditor label={zh ? "项目内容与成果" : "Project details & results"} bullets={project.bullets} onChange={(bullets) => updateProject(project.id, { bullets })} placeholder={zh ? "项目要解决什么问题？你负责了哪一部分？\n描述关键行动和能够核实的项目结果。" : "What problem did the project solve? What did you own?\nDescribe key actions and verified outcomes."} />
              <TagEditor label={t("work.keywordTags")} tags={project.tags} onUpdate={(tags) => updateProject(project.id, { tags })} placeholder={t("work.tagPlaceholder")} />
            </div>
            {projects.length > 1 && <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button type="button" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" onClick={() => { if (window.confirm(t("project.confirmDelete"))) removeProject(project.id); }}>
                <Trash2 size={13} />{t("work.deleteItem")}
              </button>
            </div>}
          </section>
        ))}
      </div>
      <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" onClick={addProject}>
        <Plus size={16} />{zh ? "添加项目经历" : "Add project experience"}
      </button>
    </div>
  );
}
