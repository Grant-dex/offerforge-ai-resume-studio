import { Plus, X } from "lucide-react";
import { useState } from "react";
import { recommendedSkills } from "../data/defaultResume";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { StepHeading } from "./BasicInfo";

export function SkillsEducationPage() {
  const { t } = useT();
  const resume = useResumeStore((state) => state.resume);
  const updateSkills = useResumeStore((state) => state.updateSkills);
  const updateEducation = useResumeStore((state) => state.updateEducation);
  const [skillInput, setSkillInput] = useState("");
  const [skillLevel, setSkillLevel] = useState<"featured"|"beginner"|"proficient"|"expert">("beginner");

  const removeSkill = (skill: string) => updateSkills(resume.skills.filter((item) => item !== skill));
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !resume.skills.includes(trimmed)) {
      updateSkills([...resume.skills, trimmed]);
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addSkill(skillInput.replace(/[,，]/g, ""));
      setSkillInput("");
    }
  };

  const displayedSkills = skillLevel === "featured" ? resume.skills.slice(0, 5) : resume.skills;

  const skillTagStyle =
    skillLevel === "proficient" ? "bg-blue-100 text-blue-900"
    : skillLevel === "expert" ? "bg-purple-100 text-purple-900"
    : "bg-orange-100 text-orange-900";

  const skillProgressWidth = skillLevel === "expert" ? "90%" : "60%";

  return (
    <div>
      <StepHeading title={t("skills.title")} subtitle={t("skills.subtitle")} />
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">
            {t("skills.keywordTags")}
            {skillLevel === "featured" && <span className="ml-2 text-xs font-normal text-amber-500">精选展示</span>}
          </h3>
          <div className="flex rounded-lg bg-slate-50 p-0.5 text-xs">
            {([
              { key: "featured", labelKey: "skills.featured" as const },
              { key: "beginner", labelKey: "skills.beginner" as const },
              { key: "proficient", labelKey: "skills.proficient" as const },
              { key: "expert", labelKey: "skills.expert" as const }
            ]).map(({ key, labelKey }) => (
              <button
                key={key}
                className={`rounded-md px-2.5 py-1 transition ${skillLevel === key ? "bg-white text-brand-600 font-semibold shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setSkillLevel(key as typeof skillLevel)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          {skillLevel === "expert" && (
            <p className="mb-3 text-xs font-medium text-purple-600">专家级别将在简历中突出展示</p>
          )}
          <div className="flex flex-wrap gap-2">
            {displayedSkills.map((skill) => (
              <div key={skill} className="flex items-center gap-2">
                <button className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${skillTagStyle}`} onClick={() => removeSkill(skill)}>
                  {skill}
                  <X size={13} />
                </button>
                {(skillLevel === "proficient" || skillLevel === "expert") && (
                  <div className="h-1.5 w-10 rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${skillLevel === "expert" ? "bg-purple-400" : "bg-blue-400"}`} style={{ width: skillProgressWidth }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {skillLevel === "featured" && resume.skills.length > 5 && (
            <p className="mt-2 text-xs text-slate-400">仅展示前5个技能，其余 {resume.skills.length - 5} 个已隐藏</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <input
              className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder={t("skills.placeholder")}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
            <button
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition hover:border-brand-200 hover:text-brand-500"
              onClick={() => { addSkill(skillInput); setSkillInput(""); }}
              disabled={!skillInput.trim()}
            >
              <Plus size={14} />
              添加
            </button>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-ink">{t("skills.aiRecommend")}</p>
          <div className="flex flex-wrap gap-2">
            {recommendedSkills.map((skill) => (
              <button key={skill} className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700" onClick={() => addSkill(skill)}>
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-700">教育背景</h3>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-white p-4">
          <Input label={t("skills.school")} value={resume.education.school} onChange={(school) => updateEducation({ school })} />
          <Input label={t("skills.major")} value={resume.education.major} onChange={(major) => updateEducation({ major })} />
          <Input label={t("skills.degree")} value={resume.education.degree} onChange={(degree) => updateEducation({ degree })} />
          <Input label={t("skills.years")} value={resume.education.years} onChange={(years) => updateEducation({ years })} />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
            <span className="text-xs font-medium text-slate-500">在校经历描述 · 每行自动转为 bullet</span>
          </div>
          <textarea
            className="min-h-[98px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-7 outline-none"
            placeholder={"例如：\n主导校学生会技术部，负责官网开发与维护\n获得国家奖学金，GPA 3.9/4.0\n参与导师科研项目，发表论文1篇"}
            value={resume.education.description || ""}
            onChange={(e) => updateEducation({ description: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-slate-400">{t("skills.eduTags")}</p>
          <TagEditor
            tags={resume.education.tags || []}
            onUpdate={(tags) => updateEducation({ tags })}
          />
        </div>
        <button className="mt-5 w-full rounded-xl border-2 border-dashed border-slate-200 bg-transparent py-3 text-sm font-medium text-slate-400 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-500">
          + {t("skills.addEdu")}
        </button>
      </section>
    </div>
  );
}

function TagEditor({ tags, onUpdate }: { tags: string[]; onUpdate: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTags = (value: string) => {
    const newTags = value
      .split(/[,，\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (newTags.length > 0) onUpdate([...tags, ...newTags]);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">
            {tag}
            <button className="rounded-full p-0.5 text-orange-400 transition hover:bg-orange-200 hover:text-orange-700" onClick={() => onUpdate(tags.filter((t) => t !== tag))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          placeholder="输入标签，回车添加"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.includes(",") || e.target.value.includes("，")) addTags(e.target.value);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTags(input); } }}
        />
        <button className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition hover:border-brand-200 hover:text-brand-500" onClick={() => addTags(input)} disabled={!input.trim()}>
          <Plus size={14} />添加
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <input aria-label={label} className="input" value={value} placeholder={label} onChange={(event) => onChange(event.target.value)} />;
}
