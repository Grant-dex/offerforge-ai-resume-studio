import { Check, ChevronRight, Lightbulb, Loader2, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { useBrandColors } from "../utils/useBrandColors";
import { isProUser } from "../utils/proGate";
import type { AIScoreResult, AISuggestion, JDMatchResult } from "../utils/ai";
import { fetchAIScore, fetchAISuggestions, fetchJDMatch } from "../utils/ai";
import { Modal } from "./Modal";
import { showToast } from "./Toast";

function ScoreRing({ score, size = 100, strokeColor, strokeColor2 }: { score: number; size?: number; strokeColor?: string; strokeColor2?: string }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const gradientId = `scoreGradient-${strokeColor || "default"}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={strokeColor || "#6C63FF"} />
            <stop offset="100%" stopColor={strokeColor2 || "#a78bfa"} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800">{score}</span>
        <span className="text-[10px] font-medium text-slate-400">分</span>
      </div>
    </div>
  );
}

export function AIAnalysisPanel() {
  const { t } = useT();
  const brand = useBrandColors();
  const resume = useResumeStore((state) => state.resume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);
  const updateWork = useResumeStore((state) => state.updateWork);
  const updateSkills = useResumeStore((state) => state.updateSkills);

  const [scoreLoading, setScoreLoading] = useState(false);
  const [scores, setScores] = useState<AIScoreResult | null>(null);
  const scoreAbortRef = useRef<AbortController | null>(null);

  const [sugLoading, setSugLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const sugAbortRef = useRef<AbortController | null>(null);

  const [jdInput, setJdInput] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const [jdMatch, setJdMatch] = useState<JDMatchResult | null>(null);
  const jdAbortRef = useRef<AbortController | null>(null);

  const [proGateOpen, setProGateOpen] = useState(false);

  // 确认优化弹窗
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeList, setOptimizeList] = useState<AISuggestion[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const checkPro = () => {
    if (!isProUser()) {
      setProGateOpen(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    loadScore();
    loadSuggestions();
  }, []);

  // 简历内容变化时自动刷新评分（2 秒防抖）
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadScore();
      loadSuggestions();
    }, 2000);
    return () => clearTimeout(debounceRef.current);
  }, [resume]);

  const loadScore = async () => {
    if (!isProUser()) return;
    scoreAbortRef.current?.abort();
    const controller = new AbortController();
    scoreAbortRef.current = controller;
    setScoreLoading(true);
    try {
      const result = await fetchAIScore(resume, controller.signal);
      setScores(result);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        showToast("AI 评分加载失败，请重试", "error");
      }
    }
    finally { setScoreLoading(false); }
  };

  const loadSuggestions = async () => {
    if (!isProUser()) return;
    sugAbortRef.current?.abort();
    const controller = new AbortController();
    sugAbortRef.current = controller;
    setSugLoading(true);
    try {
      const result = await fetchAISuggestions(resume, controller.signal);
      setSuggestions(result.slice(0, 5));
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        showToast("优化建议加载失败，请重试", "error");
      }
    }
    finally { setSugLoading(false); }
  };

  const handleJDMatch = async () => {
    if (!checkPro()) return;
    if (!jdInput.trim()) return;
    jdAbortRef.current?.abort();
    const controller = new AbortController();
    jdAbortRef.current = controller;
    setJdLoading(true);
    setJdMatch(null);
    try {
      const result = await fetchJDMatch(resume, jdInput, controller.signal);
      setJdMatch(result);
    } catch {
      showToast("JD 匹配分析失败，请重试", "error");
    } finally {
      setJdLoading(false);
    }
  };

  const handleOneClickOptimize = async () => {
    if (!checkPro()) return;
    setOptimizeLoading(true);
    setOptimizeOpen(true);
    setAppliedIds(new Set());
    try {
      const result = await fetchAISuggestions(resume);
      setOptimizeList(result.slice(0, 5));
      setSuggestions(result.slice(0, 5));
    } catch {
      showToast("AI 建议加载失败，请重试", "error");
      setOptimizeOpen(false);
    } finally {
      setOptimizeLoading(false);
    }
  };

  const applySuggestion = (sug: AISuggestion) => {
    if (appliedIds.has(sug.id)) return;
    if (sug.module === "个人信息" || sug.field === "summary") {
      updatePersonal({ summary: sug.suggested } as any);
    } else if (sug.module === "工作经历" && resume.work.length > 0) {
      updateWork(resume.work[0].id, { bullets: [...resume.work[0].bullets, sug.suggested] });
    } else if (sug.module === "技能") {
      if (!resume.skills.includes(sug.suggested)) {
        updateSkills([...resume.skills, sug.suggested]);
      }
    } else if (sug.module === "项目经历" && resume.projects.length > 0) {
      const p = resume.projects[0];
      useResumeStore.getState().updateProject(p.id, { bullets: [...p.bullets, sug.suggested] });
    }
    setAppliedIds(new Set([...appliedIds, sug.id]));
    showToast(`已应用：${sug.title}`, "success");
  };

  const applyAll = () => {
    for (const sug of optimizeList) {
      if (!appliedIds.has(sug.id)) {
        applySuggestion(sug);
      }
    }
  };

  const appliedCount = optimizeList.filter(s => appliedIds.has(s.id)).length;
  const allApplied = appliedCount === optimizeList.length && optimizeList.length > 0;

  const strengths = [
    { icon: Zap, text: "工作经验丰富", show: resume.work.length > 0 },
    { icon: Target, text: "项目经历匹配", show: resume.projects.length > 0 },
    { icon: Sparkles, text: "技能标签完整", show: resume.skills.length >= 3 },
  ].filter(s => s.show);

  const weaknesses = [
    { text: "自我评价偏空泛", show: (resume.personal.summary?.length || 0) < 30 },
    { text: "项目数据缺少量化", show: resume.projects.some(p => p.bullets.join("").match(/\d+%?/g) === null) },
    { text: "缺少 ATS 关键词", show: resume.atsScore < 70 },
  ].filter(w => w.show);

  return (
    <>
      {/* PRO 门禁弹窗 */}
      <Modal open={proGateOpen} onClose={() => setProGateOpen(false)} title="升级至 PRO">
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600">AI 评分、优化建议、JD 匹配等智能功能需要升级至 PRO 会员才能使用。</p>
          <button
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            onClick={() => setProGateOpen(false)}
          >
            我知道了
          </button>
        </div>
      </Modal>

      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-100 bg-[#F6F7FB] p-5 xl:flex">
        {/* 简历评分卡片 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-[#6C63FF]" />
            <h3 className="text-sm font-bold text-slate-700">简历评分</h3>
          </div>
          <div className="flex flex-col items-center py-3">
            {scoreLoading ? (
              <Loader2 size={40} className="animate-spin text-[#6C63FF]" />
            ) : (
              <ScoreRing score={scores?.overall ?? resume.atsScore} strokeColor={brand["500"]} strokeColor2={brand["600"]} />
            )}
            <p className="mt-2 text-xs text-slate-400">
              超过 <span className="font-bold text-slate-600">76%</span> 求职者
            </p>
          </div>

          {strengths.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-3">
              <p className="text-[10px] font-semibold uppercase text-emerald-500">优势项</p>
              {strengths.map((s) => (
                <div key={s.text} className="flex items-center gap-2 text-xs text-slate-600">
                  <s.icon size={12} className="text-emerald-400" />
                  {s.text}
                </div>
              ))}
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-3">
              <p className="text-[10px] font-semibold uppercase text-amber-500">待优化项</p>
              {weaknesses.map((w) => (
                <div key={w.text} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-amber-400">✖</span>
                  {w.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI 优化建议卡片 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-700">AI 优化建议</h3>
          </div>

          {sugLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((sug) => (
                <div key={sug.id} className="rounded-xl border border-slate-50 bg-slate-50/50 p-3 text-xs leading-5 text-slate-600">
                  <span className="font-medium text-slate-700">{sug.title}</span>
                  <p className="mt-1 text-slate-400 line-clamp-2">{sug.suggested}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-400 leading-5">
              <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-3">建议增加量化成果，如"提升转化率 30%"</div>
              <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-3">建议突出核心技能，匹配目标岗位要求</div>
              <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-3">建议优化 ATS 关键词，提高通过率</div>
            </div>
          )}

          <button
            onClick={handleOneClickOptimize}
            className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${brand["500"]}, ${brand["600"]})`,
              boxShadow: `0 4px 12px ${brand["500"]}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 6px 20px ${brand["500"]}59`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 12px ${brand["500"]}40`;
            }}
          >
            ⚡ 一键优化
          </button>
        </div>

        {/* JD 匹配度卡片 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#6C63FF]" />
            <h3 className="text-sm font-bold text-slate-700">JD 匹配度</h3>
          </div>

          <textarea
            className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 outline-none transition placeholder:text-slate-400 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/10"
            placeholder="粘贴目标职位 JD，检查匹配度..."
            value={jdInput}
            onChange={(e) => setJdInput(e.target.value)}
          />

          <button
            onClick={handleJDMatch}
            disabled={!jdInput.trim() || jdLoading}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-500 transition hover:border-[#6C63FF]/30 hover:text-[#6C63FF] disabled:opacity-40"
          >
            {jdLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                AI 分析中...
              </span>
            ) : (
              "检测匹配度"
            )}
          </button>

          {jdMatch && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">匹配度</span>
                <span className="text-lg font-black text-[#6C63FF]">{jdMatch.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${jdMatch.score}%` }}
                />
              </div>
              {jdMatch.matchedSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-medium text-slate-400">匹配关键词</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jdMatch.matchedSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-[#6C63FF]/5 px-2.5 py-1 text-[10px] font-medium text-[#6C63FF]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {jdMatch.suggestion && (
                <p className="rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-700">
                  {jdMatch.suggestion}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* AI 优化确认弹窗 — 与表单/预览联动 */}
      <Modal open={optimizeOpen} onClose={() => setOptimizeOpen(false)} title="AI 优化建议">
        {optimizeLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={40} className="animate-spin text-[#6C63FF]" />
            <p className="text-sm text-slate-500">AI 正在分析你的简历...</p>
          </div>
        ) : optimizeList.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              已应用 <span className="font-bold text-[#6C63FF]">{appliedCount}</span> / {optimizeList.length} 条建议，表单和预览已实时更新
            </p>
            {optimizeList.map((sug) => {
              const applied = appliedIds.has(sug.id);
              return (
                <div key={sug.id} className={`rounded-xl border p-4 transition ${applied ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-white"}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">{sug.module} · {sug.field}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      sug.priority === "高" ? "bg-red-100 text-red-600" : sug.priority === "中" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {sug.priority}优先级
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink">{sug.title}</p>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="rounded-lg bg-red-50 p-2">
                      <span className="font-medium text-red-500">原文</span>
                      <span className="ml-1 text-slate-500 line-through">{sug.original}</span>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <span className="font-medium text-emerald-600">优化</span>
                      <span className="ml-1 text-slate-700">{sug.suggested}</span>
                    </div>
                  </div>
                  <button
                    className={`mt-3 w-full rounded-lg py-2 text-xs font-bold transition ${
                      applied
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-500 cursor-default"
                        : "bg-[#6C63FF] text-white hover:bg-[#5A52E0]"
                    }`}
                    onClick={() => applySuggestion(sug)}
                    disabled={applied}
                  >
                    {applied ? (
                      <span className="inline-flex items-center gap-1"><Check size={12} />已应用到表单</span>
                    ) : (
                      "应用到简历"
                    )}
                  </button>
                </div>
              );
            })}

            {!allApplied && (
              <button
                className="w-full rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#a78bfa] py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(108,99,255,0.25)] transition hover:shadow-[0_6px_20px_rgba(108,99,255,0.35)]"
                onClick={applyAll}
              >
                ⚡ 一键全部应用
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">
            暂无优化建议，请先完善简历内容
          </div>
        )}
      </Modal>
    </>
  );
}
