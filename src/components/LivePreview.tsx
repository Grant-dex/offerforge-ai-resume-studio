import { ChevronDown, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useShallow } from "zustand/shallow";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { useBrandColors, type BrandColors } from "../utils/useBrandColors";
import type { ResumeData, TemplateKey } from "../types/resume";

const templateOptions: { key: TemplateKey; labelKey: "preview.templateFocus" | "preview.templateStack" | "preview.templateLead" }[] = [
  { key: "focus", labelKey: "preview.templateFocus" },
  { key: "stack", labelKey: "preview.templateStack" },
  { key: "lead", labelKey: "preview.templateLead" }
];

const templateTheme: Record<
  TemplateKey,
  {
    accent: string;
    accentSoft: string;
    accentBorder: string;
    accentBg: string;
    accentGlow: string;
    dotColor: string;
    mutedHeading: string;
  }
> = {
  focus: {
    accent: "text-orange-600",
    accentSoft: "text-orange-500",
    accentBorder: "border-orange-200",
    accentBg: "bg-orange-50",
    accentGlow: "from-orange-500 via-amber-400 to-orange-300",
    dotColor: "bg-orange-500",
    mutedHeading: "text-orange-700/80"
  },
  stack: {
    accent: "text-cyan-300",
    accentSoft: "text-blue-300",
    accentBorder: "border-slate-700",
    accentBg: "bg-slate-900",
    accentGlow: "from-cyan-400 via-blue-500 to-indigo-500",
    dotColor: "bg-cyan-400",
    mutedHeading: "text-cyan-200/80"
  },
  lead: {
    accent: "text-indigo-700",
    accentSoft: "text-violet-600",
    accentBorder: "border-indigo-200",
    accentBg: "bg-indigo-50",
    accentGlow: "from-indigo-600 via-violet-500 to-fuchsia-400",
    dotColor: "bg-indigo-500",
    mutedHeading: "text-indigo-700/80"
  }
};

const tagColors = [
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-blue-50 text-blue-800 border-blue-200",
  "bg-purple-50 text-purple-800 border-purple-200",
  "bg-rose-50 text-rose-800 border-rose-200",
  "bg-cyan-50 text-cyan-800 border-cyan-200"
];

export function LivePreview() {
  const { t } = useT();
  const { resume, template, setTemplate } = useResumeStore(
    useShallow((state) => ({
      resume: state.resume,
      template: state.template,
      setTemplate: state.setTemplate
    }))
  );
  const [atsRulesOpen, setAtsRulesOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const currentLabelKey = templateOptions.find((item) => item.key === template)?.labelKey ?? "preview.templateFocus";

  const templateLabels: Record<string, string> = {
    focus: "销售类 · Focus",
    stack: "技术类 · Stack",
    lead: "管理类 · Lead"
  };

  return (
    <aside className="hidden h-full w-full shrink-0 overflow-y-auto xl:block">
      <div className="w-full rounded-xl bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">{t("preview.live")}</h2>
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              onBlur={() => setTimeout(() => setTemplateMenuOpen(false), 150)}
            >
              {templateLabels[template] || t(currentLabelKey)}
              <ChevronDown size={14} className={`transition-transform ${templateMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {templateMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                {templateOptions.map((opt) => (
                  <button
                    key={opt.key}
                    className={`w-full px-4 py-2.5 text-left text-xs font-medium transition ${
                      template === opt.key
                        ? "bg-brand-50 text-brand-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => { setTemplate(opt.key); setTemplateMenuOpen(false); }}
                  >
                    {templateLabels[opt.key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {template === "focus" && <FocusLayout resume={resume} t={t} />}
        {template === "stack" && <StackLayout resume={resume} t={t} />}
        {template === "lead" && <LeadLayout resume={resume} t={t} />}

        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">{t("preview.atsScore")}</span>
              <button
                className="inline-flex items-center justify-center rounded-full p-0.5 text-slate-400 transition hover:text-brand-500"
                onClick={() => setAtsRulesOpen(true)}
                title="查看评分规则"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{resume.atsScore}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${resume.atsScore}%` }} />
          </div>
        </div>

        {atsRulesOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAtsRulesOpen(false)} />
            <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">ATS 匹配度评分规则</h2>
                <button onClick={() => setAtsRulesOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-bold text-brand-500">个人信息（25 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 姓名 +5 · 电话 +5 · 邮箱 +5</li>
                    <li>· 所在城市 +3 · 目标岗位 +5</li>
                    <li>· 个人简介超过20字 +2</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">工作经历（30 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 经历数量越多，得分越高（最高 8 分）</li>
                    <li>· 工作描述详细度（最高 10 分）</li>
                    <li>· 量化成果（含数字的 bullet 加分，最高 12 分）</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">技能标签（15 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 每个技能 +2 分，最高 15 分</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">教育背景（10 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 学校 +4 · 专业 +3 · 学历 +3</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">项目经历（10 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 项目数量（最高 5 分）</li>
                    <li>· 项目描述详细度（最高 5 分）</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">关键词标签（10 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 工作/项目/教育标签总数（最高 10 分）</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-brand-500">加分项（3 分）</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    <li>· 教育经历描述行数（最高 3 分）</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-brand-50 p-3 text-center">
                  <p className="text-xs font-bold text-brand-600">总分 100 分</p>
                  <p className="mt-1 text-[11px] text-brand-500">≥80 优秀 · ≥60 良好 · &lt;60 需完善</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function FocusLayout({ resume, t }: { resume: ResumeData; t: (k: any, vars?: any) => string }) {
  const brand = useBrandColors();
  const theme = templateTheme.focus;
  const skills = toArray(resume.skills);
  const work = toArray(resume.work);
  const projects = toArray(resume.projects);
  const heroStats = buildFocusStats(resume);

  return (
    <div id="resume-preview-export" className={`resume-paper overflow-hidden rounded-[28px] border ${theme.accentBorder} bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]`}>
      <section className="relative overflow-hidden border-b border-orange-100 px-8 pb-8 pt-7" style={{ background: `radial-gradient(circle at top right, ${brand["50"]}, transparent 40%), linear-gradient(135deg, ${brand["50"]} 0%, #ffffff 58%, ${brand["100"]} 100%)` }}>
        <div className={`absolute -right-14 top-0 h-36 w-36 rounded-full bg-gradient-to-br ${theme.accentGlow} opacity-15 blur-2xl`} />
        <div className="relative flex items-start justify-between gap-6">
          <div className="max-w-[68%]">
            <p className="text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: brand["500"] }}>Focus Resume</p>
            <h1 className="mt-3 text-[2.2rem] font-black tracking-[-0.04em] text-slate-900">{resume.personal.name || "你的名字"}</h1>
            <p className="mt-2 text-base font-bold" style={{ color: brand["500"] }}>{resume.personal.role || "目标岗位"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
              {resume.personal.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} />{resume.personal.email}</span>}
              {resume.personal.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} />{resume.personal.phone}</span>}
              {resume.personal.city && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{resume.personal.city}</span>}
            </div>
            <p className="mt-5 max-w-xl text-[13px] leading-6 text-slate-600">
              {resume.personal.summary || "用一句能打动招聘经理的话，突出你的成交能力、增长结果和关键资源整合能力。"}
            </p>
          </div>

          <div className="w-44 shrink-0 rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-[0_18px_40px_rgba(251,146,60,0.16)] backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Performance</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Top</span>
            </div>
            <div className="mt-4 space-y-3">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>{stat.label}</span>
                    <span style={{ color: brand["500"] }}>{stat.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full" style={{ backgroundColor: brand["50"] }}>
                    <div className="h-full rounded-full" style={{ width: `${stat.progress}%`, background: `linear-gradient(90deg, ${brand["500"]}, ${brand["600"]})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 px-8 py-7">
        <div className="space-y-6">
          <SectionTitle title={t("preview.workExperience")} eyebrow="Impact Timeline" accentClass={theme.mutedHeading} />
          {work.map((item) => (
            <div key={item.id} className="rounded-[22px] border bg-white p-5" style={{ borderColor: brand["100"] }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-black tracking-[-0.02em] text-slate-900">{item.company || "公司名称"}</p>
                  <p className="mt-1 text-[12px] font-semibold" style={{ color: brand["500"] }}>{item.title || "岗位名称"}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{joinLine([item.city, formatDateRange(item.startDate, item.endDate)])}</p>
                </div>
                <MetricBadge text={pickMetric(item.bullets)} />
              </div>
              <ul className="mt-4 space-y-2.5">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-[12px] leading-6 text-slate-600">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: brand["500"] }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span key={tag} className={`rounded-full border px-3 py-1 text-[10px] font-bold ${tagColors[index % tagColors.length]}`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {projects.length > 0 && (
            <div>
              <SectionTitle title={t("preview.projectExperience")} eyebrow="Growth Projects" accentClass={theme.mutedHeading} />
              <div className="mt-4 grid gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">{project.name || "项目名称"}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{joinLine([project.role, formatDateRange(project.startDate, project.endDate)])}</p>
                      </div>
                      <MetricBadge text={pickMetric(project.bullets)} subtle />
                    </div>
                    <ul className="mt-3 space-y-2">
                      {project.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: brand["500"] }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border p-5" style={{ borderColor: brand["100"], background: `linear-gradient(180deg, ${brand["50"]} 0%, rgba(255,255,255,0.98) 100%)` }}>
            <SectionTitle title={t("preview.coreSkills")} eyebrow="Sales Toolkit" accentClass={theme.mutedHeading} compact />
            <div className="mt-4 space-y-3">
              {skills.map((skill, index) => (
                <div key={skill}>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>{skill}</span>
                    <span style={{ color: brand["500"] }}>{92 - index * 6}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white shadow-inner">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(52, 92 - index * 6)}%`, background: `linear-gradient(90deg, ${brand["500"]}, ${brand["600"]})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border p-5" style={{ borderColor: brand["100"], background: `linear-gradient(135deg, ${brand["50"]}, #ffffff)` }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: brand["500"] }}>Value Pitch</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border bg-white p-3" style={{ borderColor: brand["100"] }}>
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <SectionTitle title={t("preview.education")} eyebrow="Foundation" accentClass={theme.mutedHeading} compact />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{resume.education.school || "学校名称"}</p>
            <p className="mt-1 text-[12px] text-slate-500">{joinLine([resume.education.degree, resume.education.major, resume.education.years])}</p>
            {resume.education.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {resume.education.tags.map((tag, index) => (
                  <span key={tag} className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${tagColors[index % tagColors.length]}`}>{tag}</span>
                ))}
              </div>
            )}
            {resume.education.description && (
              <ul className="mt-4 space-y-2">
                {resume.education.description.split("\n").filter(Boolean).map((line, index) => (
                  <li key={index} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StackLayout({ resume, t }: { resume: ResumeData; t: (k: any, vars?: any) => string }) {
  const brand = useBrandColors();
  const theme = templateTheme.stack;
  const skills = toArray(resume.skills);
  const work = toArray(resume.work);
  const projects = toArray(resume.projects);

  return (
    <div id="resume-preview-export" className="resume-paper overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]" style={{ borderColor: brand["100"] }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b px-8 pb-6 pt-7" style={{ borderColor: brand["100"], background: `radial-gradient(circle at top right, ${brand["50"]}, transparent 40%), linear-gradient(135deg, ${brand["50"]} 0%, #ffffff 58%, ${brand["100"]} 100%)` }}>
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[72%]">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ borderColor: brand["500"], color: brand["500"] }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brand["500"] }} />
              Stack Build
            </div>
            <h1 className="mt-4 font-mono text-[2rem] font-black tracking-[-0.04em] text-slate-900">{resume.personal.name || "Your_Name"}</h1>
            <p className="mt-2 font-mono text-[13px] font-semibold" style={{ color: brand["500"] }}>{resume.personal.role || "Full Stack Engineer"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500">
              {resume.personal.email && <span>{resume.personal.email}</span>}
              {resume.personal.phone && <span>{resume.personal.phone}</span>}
              {resume.personal.city && <span>{resume.personal.city}</span>}
            </div>
            <p className="mt-5 max-w-2xl font-mono text-[12px] leading-6 text-slate-600">
              {resume.personal.summary || "用简洁、可靠、可量化的方式描述你的系统设计、性能优化和业务交付能力。"}
            </p>
          </div>

          <div className="w-44 shrink-0 rounded-[22px] border bg-white/80 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.04)] backdrop-blur" style={{ borderColor: brand["100"] }}>
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>system_health</span>
              <span className="font-bold text-emerald-500">stable</span>
            </div>
            <div className="mt-4 space-y-3 font-mono text-[11px]">
              {skills.slice(0, 4).map((skill, index) => (
                <div key={skill}>
                  <div className="mb-1 flex items-center justify-between text-slate-600">
                    <span>{skill}</span>
                    <span style={{ color: brand["500"] }}>{88 - index * 7}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: brand["100"] }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(56, 88 - index * 7)}%`, background: `linear-gradient(90deg, ${brand["500"]}, ${brand["600"]})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[0.82fr_1.18fr] gap-0">
        {/* Left sidebar */}
        <div className="border-r px-6 py-6" style={{ borderColor: brand["100"], background: `linear-gradient(180deg, ${brand["50"]}30 0%, #ffffff 100%)` }}>
          <StackSection title="summary.ts" subtitle="about_candidate" accentColor={brand["500"]} />
          <CodePanel brand={brand}>
            <CodeLine dim label={"const profile = {"} />
            <CodeLine label="level" value={resume.personal.seniority || "mid-senior"} brandColor={brand["500"]} />
            <CodeLine label="target" value={resume.personal.role || "frontend-engineer"} brandColor={brand["500"]} />
            <CodeLine label="location" value={resume.personal.city || "remote-ready"} brandColor={brand["500"]} />
            <CodeLine dim label="}" />
          </CodePanel>

          <StackSection title="skills.json" subtitle={t("preview.coreSkills")} accentColor={brand["500"]} />
          <div className="grid gap-2">
            {skills.map((skill, index) => (
              <div key={skill} className="rounded-2xl border px-3 py-2 font-mono text-[11px] text-slate-700" style={{ borderColor: brand["100"], backgroundColor: brand["50"] }}>
                <div className="flex items-center justify-between gap-2">
                  <span>{skill}</span>
                  <span className="font-bold" style={{ color: brand["500"] }}>{String(index + 1).padStart(2, "0")}</span>
                </div>
              </div>
            ))}
          </div>

          <StackSection title="education.md" subtitle={t("preview.education")} accentColor={brand["500"]} />
          <div className="rounded-[22px] border p-4 font-mono text-[11px] leading-6 text-slate-600" style={{ borderColor: brand["100"], backgroundColor: brand["50"] }}>
            <p className="font-bold" style={{ color: brand["500"] }}>{resume.education.school || "University Name"}</p>
            <p>{joinLine([resume.education.degree, resume.education.major]) || "Degree · Major"}</p>
            <p className="text-slate-400">{resume.education.years || "2018 - 2022"}</p>
            {resume.education.description && (
              <ul className="mt-3 space-y-1 text-slate-500">
                {resume.education.description.split("\n").filter(Boolean).map((line, index) => (
                  <li key={index}>- {line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right main area */}
        <div className="px-6 py-6">
          <StackSection title="experience.log" subtitle={t("preview.workExperience")} accentColor={brand["500"]} />
          <div className="space-y-4">
            {work.map((item, index) => (
              <div key={item.id} className="rounded-[24px] border bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ borderColor: brand["100"] }}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[14px] font-bold text-slate-900">{item.company || "company_name"}</p>
                    <p className="mt-1 font-mono text-[11px] font-semibold" style={{ color: brand["500"] }}>{item.title || "role_name"}</p>
                  </div>
                  <div className="rounded-full px-3 py-1 font-mono text-[10px] font-bold" style={{ border: `1px solid ${brand["500"]}30`, backgroundColor: `${brand["500"]}10`, color: brand["500"] }}>
                    #{String(index + 1).padStart(2, "0")} {formatDateRange(item.startDate, item.endDate) || "active"}
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 font-mono text-[11px] leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: brand["500"] }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full border px-3 py-1 font-mono text-[10px] text-slate-500" style={{ borderColor: brand["100"], backgroundColor: brand["50"] }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {projects.length > 0 && (
            <>
              <StackSection title="projects.deploy" subtitle={t("preview.projectExperience")} accentColor={brand["500"]} />
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-[22px] border p-5" style={{ borderColor: brand["100"], background: `linear-gradient(180deg, #ffffff 0%, ${brand["50"]} 100%)` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[13px] font-bold text-slate-900">{project.name || "project_name"}</p>
                        <p className="mt-1 font-mono text-[11px] font-semibold" style={{ color: brand["500"] }}>{joinLine([project.role, formatDateRange(project.startDate, project.endDate)])}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold" style={{ border: `1px solid ${brand["500"]}30`, backgroundColor: `${brand["500"]}10`, color: brand["500"] }}>
                        {pickMetric(project.bullets)}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {project.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 font-mono text-[11px] leading-5 text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: brand["500"] }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadLayout({ resume, t }: { resume: ResumeData; t: (k: any, vars?: any) => string }) {
  const brand = useBrandColors();
  const theme = templateTheme.lead;
  const skills = toArray(resume.skills);
  const work = toArray(resume.work);
  const projects = toArray(resume.projects);
  const leadershipStats = buildLeadStats(resume);

  return (
    <div id="resume-preview-export" className="resume-paper overflow-hidden rounded-[28px] border border-indigo-200 bg-white shadow-[0_28px_80px_rgba(79,70,229,0.12)]">
      <section className="relative overflow-hidden border-b px-8 pb-8 pt-8" style={{ borderColor: brand["100"], background: `radial-gradient(circle at top, ${brand["50"]}, transparent 32%), linear-gradient(180deg, ${brand["50"]} 0%, #ffffff 100%)` }}>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${brand["500"]}, ${brand["600"]}, ${brand["500"]})` }} />
        <div className="relative text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: brand["500"] }}>Executive Profile</p>
          <h1 className="mt-4 text-[2.3rem] font-black tracking-[-0.05em] text-slate-900">{resume.personal.name || "你的名字"}</h1>
          <p className="mt-2 text-base font-bold" style={{ color: brand["500"] }}>{resume.personal.role || "目标岗位"}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
            {resume.personal.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} />{resume.personal.email}</span>}
            {resume.personal.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} />{resume.personal.phone}</span>}
            {resume.personal.city && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{resume.personal.city}</span>}
          </div>
          <div className="mx-auto mt-6 max-w-3xl rounded-[24px] border bg-white/90 px-6 py-5" style={{ borderColor: brand["100"] }}>
            <p className="text-[13px] leading-7 text-slate-600">
              {resume.personal.summary || "强调你的战略判断、团队领导、跨部门协同和经营结果，让简历呈现更强的高阶管理者气质。"}
            </p>
          </div>
        </div>
      </section>

      <div className="px-8 py-7">
        <div className="grid grid-cols-3 gap-4">
          {leadershipStats.map((stat) => (
            <div key={stat.label} className="rounded-[24px] border p-5" style={{ borderColor: brand["100"], background: `linear-gradient(180deg, #ffffff 0%, ${brand["50"]} 100%)` }}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: brand["500"] }}>{stat.label}</p>
              <p className="mt-3 text-[1.5rem] font-black tracking-[-0.04em] text-slate-900">{stat.value}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{stat.caption}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-[1.15fr_0.85fr] gap-6">
          <div>
            <SectionTitle title={t("preview.workExperience")} eyebrow="Leadership Journey" accentClass={theme.mutedHeading} />
            <div className="mt-4 space-y-5">
              {work.map((item) => (
                <div key={item.id} className="relative rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                  <div className="absolute left-0 top-6 h-12 w-1 rounded-r-full" style={{ background: `linear-gradient(180deg, ${brand["500"]}, ${brand["600"]})` }} />
                  <div className="pl-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-black text-slate-900">{item.company || "公司名称"}</p>
                        <p className="mt-1 text-[12px] font-semibold" style={{ color: brand["500"] }}>{item.title || "岗位名称"}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{joinLine([item.city, formatDateRange(item.startDate, item.endDate)])}</p>
                      </div>
                      <MetricBadge text={pickMetric(item.bullets)} executive />
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-[12px] leading-6 text-slate-600">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: brand["500"] }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    {item.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag, index) => (
                          <span key={tag} className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${tagColors[index % tagColors.length]}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {projects.length > 0 && (
              <div className="mt-7">
                <SectionTitle title={t("preview.projectExperience")} eyebrow="Strategic Initiatives" accentClass={theme.mutedHeading} />
                <div className="mt-4 grid gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="rounded-[22px] border p-5" style={{ borderColor: brand["100"], backgroundColor: brand["50"] }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{project.name || "项目名称"}</p>
                          <p className="mt-1 text-[11px] font-semibold text-indigo-600">{joinLine([project.role, formatDateRange(project.startDate, project.endDate)])}</p>
                        </div>
                        <MetricBadge text={pickMetric(project.bullets)} subtle />
                      </div>
                      <ul className="mt-3 space-y-2">
                        {project.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-indigo-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f5f7ff_100%)] p-5">
              <SectionTitle title={t("preview.coreSkills")} eyebrow="Leadership Stack" accentClass={theme.mutedHeading} compact />
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={skill} className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold ${tagColors[index % tagColors.length]}`}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border p-5" style={{ borderColor: brand["100"], background: `linear-gradient(135deg, ${brand["50"]}, #ffffff)` }}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: brand["500"] }}>Board Notes</p>
              <div className="mt-4 space-y-3">
                {leadershipStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border bg-white p-3" style={{ borderColor: brand["100"] }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{stat.label}</span>
                      <span className="text-sm font-bold text-slate-900">{stat.value}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">{stat.caption}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <SectionTitle title={t("preview.education")} eyebrow="Academic Foundation" accentClass={theme.mutedHeading} compact />
              <p className="mt-3 text-[14px] font-bold text-slate-900">{resume.education.school || "学校名称"}</p>
              <p className="mt-1 text-[12px] text-slate-500">{joinLine([resume.education.degree, resume.education.major, resume.education.years])}</p>
              {resume.education.description && (
                <ul className="mt-4 space-y-2">
                  {resume.education.description.split("\n").filter(Boolean).map((line, index) => (
                    <li key={index} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  eyebrow,
  accentClass,
  compact = false
}: {
  title: string;
  eyebrow: string;
  accentClass: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mb-4"}>
      <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${accentClass}`}>{eyebrow}</p>
      <h3 className="mt-1 text-[15px] font-black tracking-[-0.02em] text-slate-900">{title}</h3>
    </div>
  );
}

function StackSection({ title, subtitle, accentColor }: { title: string; subtitle: string; accentColor?: string }) {
  return (
    <div className="mb-3 mt-5 first:mt-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <h3 className="mt-1 font-mono text-sm font-bold" style={{ color: accentColor || "#67e8f9" }}>{subtitle}</h3>
    </div>
  );
}

function CodePanel({ children, brand }: { children: ReactNode; brand?: BrandColors }) {
  return (
    <div className="rounded-[22px] border p-4 font-mono" style={{ borderColor: brand?.["100"] || "#e2e8f0", backgroundColor: brand?.["50"] || "#f8fafc" }}>
      {children}
    </div>
  );
}

function CodeLine({
  label,
  value,
  dim = false,
  brandColor
}: {
  label?: string;
  value?: string;
  dim?: boolean;
  brandColor?: string;
}) {
  if (dim) {
    return <p className="text-[11px] leading-6 text-slate-400">{label || value}</p>;
  }

  return (
    <p className="text-[11px] leading-6 text-slate-600">
      <span style={{ color: brandColor || "#6366f1" }}>{label}</span>
      <span className="text-slate-400">:</span>{" "}
      <span className="text-slate-800 font-medium">&quot;{value || "n/a"}&quot;</span>
    </p>
  );
}

function MetricBadge({
  text,
  subtle = false,
  executive = false
}: {
  text: string;
  subtle?: boolean;
  executive?: boolean;
}) {
  const className = executive
    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
    : subtle
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : "border-orange-200 bg-orange-50 text-orange-700";

  return <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${className}`}>{text}</span>;
}

function buildFocusStats(resume: ResumeData) {
  return [
    { label: "ATS", value: `${resume.atsScore}%`, progress: Math.max(30, resume.atsScore) },
    { label: "Skills", value: `${resume.skills.length}`, progress: Math.min(100, 38 + resume.skills.length * 8) },
    { label: "Experience", value: `${resume.work.length}`, progress: Math.min(100, 40 + resume.work.length * 12) }
  ];
}

function buildLeadStats(resume: ResumeData) {
  return [
    {
      label: "Leadership Scope",
      value: `${resume.work.length}+ roles`,
      caption: "覆盖关键岗位历程，体现组织影响半径。"
    },
    {
      label: "Strategic Signals",
      value: `${resume.projects.length}+ initiatives`,
      caption: "展示跨团队项目与关键经营抓手。"
    },
    {
      label: "Capability Mix",
      value: `${resume.skills.length} strengths`,
      caption: "让招聘方快速理解你的管理能力结构。"
    }
  ];
}

function pickMetric(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/(\d+(?:\.\d+)?%?|\+\d+(?:\.\d+)?%?)/);
    if (match) return match[1];
  }
  return "Key Result";
}

function formatDateRange(start?: string, end?: string) {
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
}

function joinLine(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function toArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
}
