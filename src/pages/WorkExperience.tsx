import { Plus, Trash2 } from "lucide-react";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { BulletEditor, Field, StepHeading, TagEditor } from "./BasicInfo";

export function WorkExperiencePage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  const work = useResumeStore((state) => state.resume.work);
  const updateWork = useResumeStore((state) => state.updateWork);
  const addWork = useResumeStore((state) => state.addWork);
  const removeWork = useResumeStore((state) => state.removeWork);

  return (
    <div className="min-w-0">
      <StepHeading title={t("work.title")} subtitle={zh ? "按时间倒序整理经历，重点写清你带来的改变。" : "List your roles in reverse order and highlight your impact."} />
      <div className="space-y-6">
        {work.map((item, index) => (
          <section key={item.id} aria-label={`${t("work.title")} ${index + 1}`} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-5 flex min-w-0 items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="min-w-0 break-words text-sm font-semibold text-slate-800">{item.company || (zh ? "新工作经历" : "New work experience")}</h3>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4">
              <Field value={item.company} label={t("work.company")} onChange={(company) => updateWork(item.id, { company })} />
              <Field value={item.title} label={zh ? "职位名称" : t("work.jobTitle")} onChange={(title) => updateWork(item.id, { title })} />
              <Field value={item.city} label={t("work.city")} onChange={(city) => updateWork(item.id, { city })} />
              <div className="grid min-w-0 grid-cols-2 gap-3">
                <Field value={item.startDate} label={t("work.startDate")} placeholder="2023-06" onChange={(startDate) => updateWork(item.id, { startDate })} />
                <Field value={item.endDate} label={zh ? "结束时间" : "End date"} placeholder={zh ? "2025-09 / 至今" : "2025-09 / Present"} onChange={(endDate) => updateWork(item.id, { endDate })} />
              </div>
              <BulletEditor label={zh ? "工作内容与成果" : "Responsibilities & achievements"} bullets={item.bullets} onChange={(bullets) => updateWork(item.id, { bullets })} placeholder={zh ? "负责什么工作、采取什么行动、取得什么结果？\n如有数据，请填写你能够核实的成果。" : "What did you own, what action did you take, and what changed?\nInclude results you can verify."} />
              <TagEditor label={t("work.keywordTags")} tags={item.tags} onUpdate={(tags) => updateWork(item.id, { tags })} placeholder={t("work.tagPlaceholder")} />
            </div>
            {work.length > 1 && <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button type="button" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" onClick={() => { if (window.confirm(t("work.confirmDelete"))) removeWork(item.id); }}>
                <Trash2 size={13} />{t("work.deleteItem")}
              </button>
            </div>}
          </section>
        ))}
      </div>
      <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" onClick={addWork}>
        <Plus size={16} />{zh ? "添加工作经历" : "Add work experience"}
      </button>
    </div>
  );
}
