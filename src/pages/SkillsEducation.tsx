import { Check, Plus } from "lucide-react";
import { recommendedSkills } from "../data/defaultResume";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { Field, StepHeading, TagEditor } from "./BasicInfo";

export function SkillsEducationPage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  const resume = useResumeStore((state) => state.resume);
  const updateSkills = useResumeStore((state) => state.updateSkills);
  const updateEducation = useResumeStore((state) => state.updateEducation);
  const addSkill = (skill: string) => {
    if (!resume.skills.includes(skill)) updateSkills([...resume.skills, skill]);
  };

  return (
    <div className="min-w-0">
      <StepHeading title={zh ? "技能与教育" : t("skills.title")} subtitle={zh ? "补充与你的目标岗位相关的技能和教育经历。" : "Add skills and education relevant to your target role."} />
      <section className="mb-7 min-w-0">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">{zh ? "专业技能" : "Professional skills"}</h3>
        <TagEditor label={zh ? "已掌握的技能" : "Your skills"} tags={resume.skills} onUpdate={updateSkills} placeholder={t("skills.placeholder")} />
        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer rounded text-xs font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">{zh ? "销售与业务类技能参考" : "Sales & business skill examples"}</summary>
          <p className="mb-3 mt-3 text-xs leading-5 text-slate-500">{zh ? "仅添加你确实掌握的技能，也可以在上方输入其他技能。" : "Add only skills you have. You can enter other skills above."}</p>
          <div className="flex flex-wrap gap-2">
            {recommendedSkills.map((skill) => {
              const added = resume.skills.includes(skill);
              return <button type="button" key={skill} disabled={added} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500" onClick={() => addSkill(skill)}>
                {added ? <Check size={12} /> : <Plus size={12} />}{skill}
              </button>;
            })}
          </div>
        </details>
      </section>
      <section className="min-w-0 border-t border-slate-200 pt-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">{zh ? "教育背景" : "Education"}</h3>
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <Field label={t("skills.school")} value={resume.education.school} onChange={(school) => updateEducation({ school })} />
          <Field label={t("skills.major")} value={resume.education.major} onChange={(major) => updateEducation({ major })} />
          <Field label={t("skills.degree")} value={resume.education.degree} onChange={(degree) => updateEducation({ degree })} placeholder={zh ? "例如：本科 / 硕士" : "e.g. Bachelor's / Master's"} />
          <Field label={t("skills.years")} value={resume.education.years} onChange={(years) => updateEducation({ years })} placeholder="2020-09 – 2024-06" />
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold text-slate-600">{zh ? "在校经历与荣誉（选填）" : "Activities & honors (optional)"}</span>
            <textarea
              className="min-h-[140px] w-full min-w-0 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              placeholder={zh ? "可填写与岗位相关的课程、奖项或在校项目，每行一项。" : "Add relevant courses, awards or school projects, one per line."}
              value={resume.education.description || ""}
              onChange={(event) => updateEducation({ description: event.target.value })}
            />
          </label>
          <TagEditor label={t("skills.eduTags")} tags={resume.education.tags || []} onUpdate={(tags) => updateEducation({ tags })} />
        </div>
      </section>
    </div>
  );
}
