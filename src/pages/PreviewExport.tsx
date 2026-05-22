import { BarChart3, Braces, Building2, Code2, Cpu, Download, FileText, Link2, Network, TrendingUp, Users, Zap } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { exportResumePdf } from "../utils/pdf";
import { exportResumeWord } from "../utils/exportWord";
import { showToast } from "../components/Toast";
import { StepHeading, TemplateCard } from "./BasicInfo";

export function PreviewExportPage() {
  const { t } = useT();
  const { resume, template, setTemplate } = useResumeStore(
    useShallow((state) => ({ resume: state.resume, template: state.template, setTemplate: state.setTemplate }))
  );

  return (
    <div>
      <StepHeading title={t("preview.title")} subtitle={t("preview.subtitle")} />

      {/* ── Template Selection ── */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">选择模板</p>
            <p className="mt-1 text-sm text-slate-500">为你的简历选择最佳展示风格</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Focus */}
          <TemplateCard
            active={template === "focus"}
            onClick={() => setTemplate("focus")}
            badge="FREE"
            title="Focus"
            subtitle="销售类"
            description="强调业绩数据与增长曲线，用 KPI 和量化成果打动招聘方"
            gradient="from-[#FFF0E5] via-white to-[#FFF7F2]"
            accent="#FF6A00"
            activeBorder="border-[#FF6A00]/40 ring-[#FF6A00]/10"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-[48%] h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,137,61,0.2)_0%,_rgba(255,175,64,0.08)_45%,_transparent_72%)] blur-xl" />
              <div className="absolute left-10 top-10 h-16 w-16 rounded-full bg-white/55 blur-2xl" />
              <div className="absolute bottom-7 right-8 h-14 w-14 rounded-full bg-orange-100/60 blur-2xl" />
              <div className="absolute right-5 top-7 rounded-full bg-emerald-50/90 px-2.5 py-1 text-[10px] font-bold text-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.12)]">
                +128%
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/35 via-white/10 to-transparent" />
            </div>
            <div className="relative flex h-full items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <TrendingUp size={11} className="text-emerald-500" />
                <div className="h-12 w-8 rounded-[10px] bg-gradient-to-b from-[#FFB27A] to-[#FF6A00] shadow-[0_10px_24px_rgba(255,106,0,0.18)]" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <BarChart3 size={11} className="text-orange-300" />
                <div className="h-8 w-8 rounded-[10px] bg-gradient-to-b from-[#FFD77A] to-[#F5A300] shadow-[0_10px_20px_rgba(245,163,0,0.16)]" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Zap size={11} className="text-orange-500" />
                <div className="h-14 w-8 rounded-[10px] bg-gradient-to-b from-[#FF9A52] to-[#FF6A00] shadow-[0_10px_24px_rgba(255,106,0,0.2)]" />
              </div>
            </div>
          </TemplateCard>

          {/* Stack */}
          <TemplateCard
            active={template === "stack"}
            onClick={() => setTemplate("stack")}
            badge="FREE"
            title="Stack"
            subtitle="技术类"
            description="展示技术栈深度与项目经验，极简开发者风格，代码感十足"
            gradient="from-[#F0F4FF] via-white to-[#F6F8FF]"
            accent="#3B82F6"
            activeBorder="border-blue-400/40 ring-blue-400/10"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-[48%] h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(96,165,250,0.18)_0%,_rgba(129,140,248,0.08)_48%,_transparent_72%)] blur-xl" />
              <div className="absolute left-9 top-9 h-16 w-16 rounded-full bg-white/50 blur-2xl" />
              <div className="absolute bottom-6 right-8 h-14 w-14 rounded-full bg-blue-100/55 blur-2xl" />
              <div className="absolute right-5 top-7 rounded-full bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold text-blue-600 shadow-[0_10px_20px_rgba(59,130,246,0.12)]">
                clean
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/35 via-white/10 to-transparent" />
            </div>
            <div className="relative flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/72 px-3 py-1.5 shadow-[0_8px_22px_rgba(59,130,246,0.08)] backdrop-blur">
                <Braces size={10} className="text-violet-500" />
                <div className="h-1.5 w-10 rounded-full bg-slate-200" />
                <div className="h-1.5 w-6 rounded-full bg-blue-200" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/72 px-3 py-1.5 shadow-[0_8px_22px_rgba(59,130,246,0.08)] backdrop-blur">
                <Code2 size={10} className="text-blue-500" />
                <div className="h-1.5 w-8 rounded-full bg-blue-200" />
                <div className="h-1.5 w-9 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/72 px-3 py-1.5 shadow-[0_8px_22px_rgba(59,130,246,0.08)] backdrop-blur">
                <Cpu size={10} className="text-cyan-500" />
                <div className="h-1.5 w-11 rounded-full bg-slate-200" />
                <div className="h-1.5 w-5 rounded-full bg-cyan-200" />
              </div>
            </div>
          </TemplateCard>

          {/* Lead */}
          <TemplateCard
            active={template === "lead"}
            onClick={() => setTemplate("lead")}
            badge="PRO"
            title="Lead"
            subtitle="管理类"
            description="突出领导力与团队管理，用组织结构和战略视野展现高管气质"
            gradient="from-[#F5F3FF] via-white to-[#FAF8FF]"
            accent="#8B5CF6"
            activeBorder="border-purple-400/40 ring-purple-400/10"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-[48%] h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(167,139,250,0.18)_0%,_rgba(129,140,248,0.08)_48%,_transparent_72%)] blur-xl" />
              <div className="absolute left-9 top-9 h-16 w-16 rounded-full bg-white/50 blur-2xl" />
              <div className="absolute bottom-6 right-8 h-14 w-14 rounded-full bg-violet-100/55 blur-2xl" />
              <div className="absolute right-5 top-7 rounded-full bg-amber-50/90 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-[0_10px_20px_rgba(245,158,11,0.12)]">
                PRO
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/35 via-white/10 to-transparent" />
            </div>
            <div className="relative flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
                <Building2 size={13} />
              </div>
              <div className="h-3 w-px bg-violet-200" />
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-violet-500 shadow-sm">
                  <Users size={10} />
                </div>
                <div className="h-px w-4 bg-violet-200" />
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-indigo-500 shadow-sm">
                  <Network size={10} />
                </div>
                <div className="h-px w-4 bg-violet-200" />
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-violet-500 shadow-sm">
                  <Users size={10} />
                </div>
              </div>
            </div>
          </TemplateCard>
        </div>
      </div>

      {/* ── 导出按钮区 ── */}
      <div className="mt-10 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          {/* PDF */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-4 text-sm font-bold text-white shadow-glow"
            onClick={() => exportResumePdf(`${resume.personal.name}_简历.pdf`)}
          >
            <Download size={18} />
            {t("preview.exportPdf")}
          </button>

          {/* Word */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-4 text-sm font-bold text-orange-700"
            onClick={() => exportResumeWord(resume, `${resume.personal.name}_简历.docx`)}
          >
            <FileText size={18} />
            {t("preview.exportWord")}
          </button>

          {/* 复制链接 */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-4 text-sm font-bold text-slate-600"
            onClick={async () => {
              // Strip sensitive fields from shared data
              const shareData = {
                ...resume,
                personal: { ...resume.personal, email: "", phone: "" }
              };
              const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
              const shareUrl = `${window.location.origin}${window.location.pathname}#/shared?data=${encoded}`;
              try {
                await navigator.clipboard.writeText(shareUrl);
                showToast("链接已复制，可直接发送给他人查看简历 🎉", "success");
              } catch {
                const input = document.createElement("input");
                input.value = shareUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand("copy");
                document.body.removeChild(input);
                showToast("链接已复制！", "success");
              }
            }}
          >
            <Link2 size={18} />
            {t("preview.copyLink")}
          </button>
        </div>

        {/* ── 格式说明文字 ── */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Download size={11} className="text-slate-400" />
            <span className="font-medium text-slate-500">PDF</span>
            <span>还原设计效果，用于投递</span>
          </div>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <FileText size={11} className="text-slate-400" />
            <span className="font-medium text-slate-500">Word</span>
            <span>可编辑版本，样式有所简化</span>
          </div>
        </div>
      </div>
    </div>
  );
}
