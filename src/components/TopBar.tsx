import { Download, FileDown, FileText, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import type { AIScoreResult, AISuggestion } from "../utils/ai";
import { fetchAIScore, fetchAISuggestions } from "../utils/ai";
import { exportResumePdf } from "../utils/pdf";
import { exportResumeWord } from "../utils/exportWord";
import { isProUser } from "../utils/proGate";
import { useT } from "../i18n";
import { Modal } from "./Modal";
import { showToast } from "./Toast";

function ScoreRing({ score, label, color, loading }: { score: number; label: string; color: string; loading: boolean }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = loading ? circumference : circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle
          cx="42" cy="42" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          className="transition-all duration-700 ease-out"
        />
        <text x="42" y="42" textAnchor="middle" dominantBaseline="central" className="text-sm font-black" fill="#14151A">
          {loading ? "—" : score}
        </text>
      </svg>
      <span className="text-center text-[11px] font-medium leading-tight text-slate-500">{label}</span>
    </div>
  );
}

export function TopBar() {
  const { t } = useT();
  const resume = useResumeStore((state) => state.resume);
  const lastTouched = useResumeStore((state) => state.lastTouched);

  const [exportOpen, setExportOpen] = useState(false);
  const [proGateOpen, setProGateOpen] = useState(false);
  const [aiScoreOpen, setAiScoreOpen] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scores, setScores] = useState<AIScoreResult | null>(null);
  const scoreAbortRef = useRef<AbortController | null>(null);

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const sugAbortRef = useRef<AbortController | null>(null);

  const checkPro = () => {
    if (!isProUser()) {
      setProGateOpen(true);
      return false;
    }
    return true;
  };

  const handleAIScore = async () => {
    if (!checkPro()) return;
    scoreAbortRef.current?.abort();
    const controller = new AbortController();
    scoreAbortRef.current = controller;

    setAiScoreOpen(true);
    setScores(null);
    setScoreLoading(true);
    try {
      const result = await fetchAIScore(resume, controller.signal);
      setScores(result);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      showToast(e.message || t("misc.scoreFailed"), "error");
      setAiScoreOpen(false);
    } finally {
      setScoreLoading(false);
    }
  };

  const handleAISuggestions = async () => {
    if (!checkPro()) return;
    sugAbortRef.current?.abort();
    const controller = new AbortController();
    sugAbortRef.current = controller;

    setSuggestionsOpen(true);
    setSuggestions([]);
    setSugLoading(true);
    try {
      const result = await fetchAISuggestions(resume, controller.signal);
      setSuggestions(result);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      showToast(e.message || t("misc.sugFailed"), "error");
      setSuggestionsOpen(false);
    } finally {
      setSugLoading(false);
    }
  };

  const closeScoreModal = () => {
    scoreAbortRef.current?.abort();
    setAiScoreOpen(false);
    setScoreLoading(false);
  };

  const closeSugModal = () => {
    sugAbortRef.current?.abort();
    setSuggestionsOpen(false);
    setSugLoading(false);
  };

  const applySuggestion = (sug: AISuggestion) => {
    const store = useResumeStore.getState();
    const resumeData = store.resume;

    if (sug.module === "个人信息" || sug.field === "summary") {
      store.updatePersonal({ summary: sug.suggested } as any);
    } else if (sug.module === "工作经历" && resumeData.work.length > 0) {
      const w = resumeData.work[0];
      store.updateWork(w.id, { bullets: [...w.bullets, sug.suggested] });
    } else if (sug.module === "技能") {
      if (!resumeData.skills.includes(sug.suggested)) {
        store.updateSkills([...resumeData.skills, sug.suggested]);
      }
    }

    showToast(`${t("topbar.applied")}${sug.title}`, "success");
    setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
  };

  return (
    <>
      <header className="mb-5 flex h-[80px] items-center justify-between rounded-xl bg-white px-9 shadow-soft">
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink">{t("app.name")}</h1>
          <p className="mt-1 text-xs text-slate-500">
            <span className="mr-2 text-emerald-500">✓</span>
            {t("topbar.saved")} {lastTouched}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="top-action" onClick={handleAIScore}>
            <Sparkles size={18} className="text-amber-500" />
            {t("topbar.aiScore")}
          </button>
          <button className="top-action" onClick={handleAISuggestions}>
            <Lightbulb size={18} className="text-amber-500" />
            {t("topbar.suggestions")}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600"
            onClick={() => setExportOpen(true)}
          >
            <Download size={18} />
            {t("topbar.export")}
          </button>
        </div>
      </header>

      {/* AI 评分弹窗 */}
      <Modal open={aiScoreOpen} onClose={closeScoreModal} title={t("topbar.scoreTitle")}>
        {scoreLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={40} className="animate-spin text-brand-500" />
            <p className="text-sm text-slate-500">{t("topbar.analyzing")}</p>
          </div>
        ) : scores ? (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-3">
              <ScoreRing score={scores.keyword} label={t("topbar.keywordMatch")} color="#f59e0b" loading={false} />
              <ScoreRing score={scores.format} label={t("topbar.formatNorm")} color="#3b82f6" loading={false} />
              <ScoreRing score={scores.completeness} label={t("topbar.contentComplete")} color="#8b5cf6" loading={false} />
              <ScoreRing score={scores.quantified} label={t("topbar.quantified")} color="#10b981" loading={false} />
              <ScoreRing score={scores.overall} label={t("topbar.overall")} color="#FF5C00" loading={false} />
            </div>
            <div className="rounded-xl bg-gradient-to-r from-brand-50 to-amber-50 p-4 text-center">
              <p className="text-xs text-slate-500">{t("topbar.totalScore")}</p>
              <p className="mt-1 text-3xl font-black text-brand-500">{scores.overall}</p>
              <p className="mt-1 text-xs text-slate-400">
                {scores.overall >= 80 ? t("topbar.excellent") : scores.overall >= 60 ? t("topbar.good") : t("topbar.needsWork")}
              </p>
            </div>
            {scores.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">{t("topbar.aiTips")}</p>
                {scores.suggestions.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* PRO 门禁弹窗 */}
      <Modal open={proGateOpen} onClose={() => setProGateOpen(false)} title="升级至 PRO">
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600">AI 评分、优化建议等智能功能需要升级至 PRO 会员才能使用。</p>
          <button
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            onClick={() => setProGateOpen(false)}
          >
            我知道了
          </button>
        </div>
      </Modal>

      {/* 导出弹窗 */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="导出简历">
        <div className="grid grid-cols-2 gap-4">
          <button
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-100 bg-white p-6 transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-lg"
            onClick={() => {
              setExportOpen(false);
              exportResumePdf(`${resume.personal.name}_简历.pdf`);
            }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <FileDown size={28} className="text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">导出 PDF</p>
              <p className="mt-1 text-xs text-slate-400">还原设计效果，用于投递</p>
            </div>
          </button>
          <button
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-100 bg-white p-6 transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-lg"
            onClick={() => {
              setExportOpen(false);
              exportResumeWord(resume, `${resume.personal.name}_简历.docx`);
            }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <FileText size={28} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">导出 Word</p>
              <p className="mt-1 text-xs text-slate-400">可编辑版本，样式有所简化</p>
            </div>
          </button>
        </div>
      </Modal>

      {/* 优化建议弹窗 */}
      <Modal open={suggestionsOpen} onClose={closeSugModal} title={t("topbar.sugTitle")}>
        {sugLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={40} className="animate-spin text-brand-500" />
            <p className="text-sm text-slate-500">{t("topbar.generating")}</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((sug) => (
              <div key={sug.id} className="rounded-xl border border-slate-100 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{sug.module} · {sug.field}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    sug.priority === "高" ? "bg-red-100 text-red-600" : sug.priority === "中" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    {sug.priority === "高" ? t("topbar.priorityHigh") : sug.priority === "中" ? t("topbar.priorityMid") : t("topbar.priorityLow")}{t("topbar.priority")}
                  </span>
                </div>
                <p className="text-sm font-bold text-ink">{sug.title}</p>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="rounded-lg bg-red-50 p-2">
                    <span className="font-medium text-red-500">{t("topbar.original")}</span>
                    <span className="text-slate-500 line-through">{sug.original}</span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <span className="font-medium text-emerald-600">{t("topbar.optimized")}</span>
                    <span className="text-slate-700">{sug.suggested}</span>
                  </div>
                </div>
                <button
                  className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
                  onClick={() => applySuggestion(sug)}
                >
                  {t("topbar.apply")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
