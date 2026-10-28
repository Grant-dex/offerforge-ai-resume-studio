import { DateRangeFields } from "../components/DateRangeFields";
import { ExperienceEditor } from "../components/ExperienceEditor";
import { dateRange } from "../data/resumeTemplates";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { BulletEditor, Field, StepHeading, TagEditor } from "./BasicInfo";

export function WorkExperiencePage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  const resumeId = useResumeStore(state => state.resume.id);
  const work = useResumeStore(state => state.resume.work);
  const updateWork = useResumeStore(state => state.updateWork);
  const addWork = useResumeStore(state => state.addWork);
  const moveWork = useResumeStore(state => state.moveWork);
  const removeWork = useResumeStore(state => state.removeWork);
  const restoreWork = useResumeStore(state => state.restoreWork);

  return <div className="min-w-0">
    <StepHeading title={t("work.title")} subtitle={zh ? "按时间倒序整理经历，重点写清你带来的改变。" : "List your roles in reverse order and highlight your impact."}/>
    <ExperienceEditor key={resumeId} items={work} resumeId={resumeId} zh={zh} kind="work" title={item => item.company} summary={item => [item.title, dateRange(item.startDate, item.endDate)].filter(Boolean).join(" · ")} onAdd={addWork} onMove={moveWork} onRemove={removeWork} onRestore={restoreWork}>
      {item => <>
        <Field value={item.company} label={t("work.company")} onChange={company => updateWork(item.id, { company })}/>
        <Field value={item.title} label={zh ? "职位名称" : t("work.jobTitle")} onChange={title => updateWork(item.id, { title })}/>
        <Field value={item.city} label={t("work.city")} onChange={city => updateWork(item.id, { city })}/>
        <DateRangeFields startDate={item.startDate} endDate={item.endDate} zh={zh} onChange={patch => updateWork(item.id, patch)} />
        <BulletEditor label={zh ? "工作内容与成果" : "Responsibilities & achievements"} bullets={item.bullets} onChange={bullets => updateWork(item.id, { bullets })} placeholder={zh ? "负责什么工作、采取什么行动、取得什么结果？\n如有数据，请填写你能够核实的成果。" : "What did you own, what action did you take, and what changed?\nInclude results you can verify."}/>
        <TagEditor label={t("work.keywordTags")} tags={item.tags} onUpdate={tags => updateWork(item.id, { tags })} placeholder={t("work.tagPlaceholder")}/>
      </>}
    </ExperienceEditor>
  </div>;
}
