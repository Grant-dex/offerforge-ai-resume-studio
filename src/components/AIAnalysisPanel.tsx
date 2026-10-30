import { ArrowRight, Check, Lightbulb, Loader2, RefreshCw, Target, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeStore } from "../store/resumeStore";
import { isProUser } from "../utils/proGate";
import type { AIScoreResult, AISuggestion, JDMatchResult } from "../utils/ai";
import { fetchAIScore, fetchAISuggestions, fetchJDMatch } from "../utils/ai";
import {
  replaceSuggestionText, resolveSuggestionTarget, resumeAnalysisKey,
  suggestionRoute, suggestionTargetValue, type SuggestionTarget,
} from "../utils/aiAnalysis";
import { Modal } from "./Modal";
import { showToast } from "./Toast";

type Result<T> = { data: T | null; key: string; pending: boolean; error: string | null };
const emptyResult = <T,>(): Result<T> => ({ data: null, key: "", pending: false, error: null });
const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40";
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "请求未完成，请重试。";
const validScore = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

function Status({ pending, error, stale }: { pending: boolean; error: string | null; stale: boolean }) {
  return (
    <div className="space-y-2 text-xs leading-6" aria-live="polite">
      {pending && <p className="flex items-center gap-2 text-neutral-600"><Loader2 size={14} className="animate-spin" />正在分析，请稍候…</p>}
      {error && <p role="alert" className="rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-neutral-700">{error}</p>}
      {stale && <p className="rounded-lg bg-neutral-100 p-3 text-neutral-600">内容已更新，以下结果对应此前的内容。请重新分析以获取最新建议。</p>}
    </div>
  );
}

export function AIAnalysisPanel() {
  const navigate = useNavigate();
  const resume = useResumeStore((state) => state.resume);
  const currentKey = resumeAnalysisKey(resume);
  const [score, setScore] = useState<Result<AIScoreResult>>(emptyResult);
  const [suggestions, setSuggestions] = useState<Result<AISuggestion[]>>(emptyResult);
  const [jd, setJd] = useState<Result<JDMatchResult>>(emptyResult);
  const [jdInput, setJdInput] = useState("");
  const [proGateOpen, setProGateOpen] = useState(false);
  const [applied, setApplied] = useState<Record<string, { target: SuggestionTarget; before: string; after: string }>>({});
  const analysisRequest = useRef<AbortController | null>(null);
  const jdRequest = useRef<AbortController | null>(null);
  const pending = score.pending || suggestions.pending;
  const currentJdKey = JSON.stringify([currentKey, jdInput.trim()]);

  useEffect(() => () => {
    analysisRequest.current?.abort();
    jdRequest.current?.abort();
  }, []);

  function checkPro() {
    if (isProUser()) return true;
    setProGateOpen(true);
    return false;
  }

  async function analyzeResume() {
    if (!checkPro()) return;
    analysisRequest.current?.abort();
    const controller = new AbortController();
    analysisRequest.current = controller;
    const snapshot = useResumeStore.getState().resume;
    const key = resumeAnalysisKey(snapshot);
    setScore((previous) => ({ ...previous, pending: true, error: null }));
    setSuggestions((previous) => ({ ...previous, pending: true, error: null }));
    await Promise.allSettled([
      (async () => {
        try {
          const data = await fetchAIScore(snapshot, controller.signal);
          if (!validScore(data?.overall) || ![data.keyword, data.format, data.completeness, data.quantified].every(validScore) || !Array.isArray(data.suggestions)) {
            throw new Error("评分返回格式不完整，请重新分析。");
          }
          if (data.suggestions.some((text) => text === "解析失败")) throw new Error("评分结果解析失败，请重新分析。");
          if (!controller.signal.aborted) setScore({ data, key, pending: false, error: null });
        } catch (error) {
          if (!controller.signal.aborted) setScore((previous) => ({ ...previous, pending: false, error: errorMessage(error) }));
        }
      })(),
      (async () => {
        try {
          const data = await fetchAISuggestions(snapshot, controller.signal);
          if (!Array.isArray(data) || data.some((item) => !item || ![item.id, item.module, item.field, item.title, item.original, item.suggested].every((value) => typeof value === "string"))) {
            throw new Error("建议返回格式不完整，请重新分析。");
          }
          if (!controller.signal.aborted) {
            setSuggestions({ data, key, pending: false, error: null });
            setApplied({});
          }
        } catch (error) {
          if (!controller.signal.aborted) setSuggestions((previous) => ({ ...previous, pending: false, error: errorMessage(error) }));
        }
      })(),
    ]);
  }

  async function analyzeJob() {
    if (!jdInput.trim() || !checkPro()) return;
    jdRequest.current?.abort();
    const controller = new AbortController();
    jdRequest.current = controller;
    const snapshot = useResumeStore.getState().resume;
    const description = jdInput.trim();
    const key = JSON.stringify([resumeAnalysisKey(snapshot), description]);
    setJd((previous) => ({ ...previous, pending: true, error: null }));
    try {
      const data = await fetchJDMatch(snapshot, description, controller.signal);
      if (!validScore(data?.score) || !Array.isArray(data.matchedSkills) || data.matchedSkills.some((skill) => typeof skill !== "string") || typeof data.suggestion !== "string") {
        throw new Error("岗位分析返回格式不完整，请重试。");
      }
      if (data.suggestion === "分析失败，请重试") throw new Error("岗位分析未完成，请重试。");
      if (!controller.signal.aborted) setJd({ data, key, pending: false, error: null });
    } catch (error) {
      if (!controller.signal.aborted) setJd((previous) => ({ ...previous, pending: false, error: errorMessage(error) }));
    }
  }

  function commitReplacement(target: SuggestionTarget, before: string, after: string): boolean {
    const store = useResumeStore.getState();
    const updated = replaceSuggestionText(store.resume, target, before, after);
    if (!updated) return false;
    switch (target.kind) {
      case "summary": store.updatePersonal({ summary: updated.personal.summary }); break;
      case "education": store.updateEducation({ description: updated.education.description }); break;
      case "skill": store.updateSkills(updated.skills); break;
      case "work": store.updateWork(target.itemId, { bullets: updated.work.find((item) => item.id === target.itemId)!.bullets }); break;
      case "project": store.updateProject(target.itemId, { bullets: updated.projects.find((item) => item.id === target.itemId)!.bullets }); break;
    }
    return true;
  }

  function apply(suggestion: AISuggestion, key: string) {
    const target = resolveSuggestionTarget(useResumeStore.getState().resume, suggestion);
    if (!target || !commitReplacement(target, suggestion.original, suggestion.suggested)) {
      showToast("未能唯一定位原文，请前往对应章节编辑。", "info");
      return;
    }
    setApplied((previous) => ({ ...previous, [key]: { target, before: suggestion.original, after: suggestion.suggested } }));
    showToast(`已更新：${target.label}`, "success");
  }

  function undo(key: string) {
    const change = applied[key];
    if (!change || !commitReplacement(change.target, change.after, change.before)) {
      showToast("这段内容已再次修改，请前往对应章节检查。", "info");
      return;
    }
    setApplied((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    showToast("已撤销这条修改", "success");
  }

  function editSection(suggestion: AISuggestion) {
    const path = suggestionRoute(suggestion);
    navigate(path, { state: { editorTab: "edit" } });
    window.dispatchEvent(new CustomEvent("offerforge:open-editor", { detail: { path } }));
  }

  return (
    <div className="offerforge-ai-tools min-w-0 space-y-6 text-neutral-800">
      <section className="space-y-4" aria-labelledby="ai-job-heading">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500"><Target size={14} />按岗位调整</p>
          <h2 id="ai-job-heading" className="text-lg font-semibold tracking-tight">让岗位要求有据可查</h2>
          <p className="mt-2 text-xs leading-6 text-neutral-500">粘贴职位要求，结合你的真实经历，找到可以补充和强调的内容。</p>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-neutral-700">目标岗位描述（JD）</span>
          <textarea value={jdInput} onChange={(event) => setJdInput(event.target.value)} rows={6} placeholder="粘贴工作职责、技能要求与任职条件…" className="w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300" />
        </label>
        <button type="button" onClick={analyzeJob} disabled={jd.pending || !jdInput.trim()} className={`${primaryButton} w-full`}>
          {jd.pending ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
          {jd.pending ? "分析岗位要求…" : jd.data ? "重新分析岗位" : "分析岗位匹配"}
        </button>
        <Status pending={false} error={jd.error} stale={Boolean(jd.data && jd.key !== currentJdKey)} />
        {jd.data && <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-baseline justify-between gap-3"><h3 className="text-xs font-medium text-neutral-600">AI 岗位匹配参考</h3><span className="text-xl font-semibold">{Math.round(jd.data.score)}<span className="text-xs font-normal text-neutral-500"> / 100</span></span></div>
          <p className="text-xs text-neutral-500">基于本次输入，不代表实际录用概率。</p>
          {jd.data.matchedSkills.length > 0 && <div className="flex flex-wrap gap-1.5">{jd.data.matchedSkills.map((skill, index) => <span key={`${index}-${skill}`} className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs">{skill}</span>)}</div>}
          <p className="whitespace-pre-wrap break-words text-xs leading-6 text-neutral-700">{jd.data.suggestion}</p>
        </div>}
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6" aria-labelledby="ai-resume-heading">
        <div><p className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500"><Lightbulb size={14} />检查内容表达</p><h2 id="ai-resume-heading" className="text-base font-semibold">简历分析与修改建议</h2><p className="mt-2 text-xs leading-6 text-neutral-500">主动分析当前内容，查看评分依据与逐条修改建议。</p></div>
        <button type="button" className={`${secondaryButton} w-full`} onClick={analyzeResume} disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}{pending ? "分析简历中…" : score.data || suggestions.data ? "重新分析简历" : "分析当前简历"}
        </button>
        <Status pending={false} error={score.error} stale={Boolean(score.data && score.key !== currentKey)} />
        {score.data && <div className="rounded-lg border border-neutral-200 p-4">
          <div className="mb-4 flex items-baseline justify-between"><h3 className="text-xs font-medium text-neutral-600">AI 简历评分</h3><strong className="text-2xl font-semibold">{Math.round(score.data.overall)}<span className="text-xs font-normal text-neutral-500"> / 100</span></strong></div>
          <div className="space-y-3">{([
            ["关键词", score.data.keyword], ["结构与格式", score.data.format], ["内容完整度", score.data.completeness], ["成果表达", score.data.quantified],
          ] as const).map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-xs text-neutral-600"><span>{label}</span><span>{Math.round(value)}</span></div><div className="h-1 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-500" style={{ width: `${value}%` }} /></div></div>)}</div>
          {score.data.suggestions.length > 0 && <ul className="mt-4 list-disc space-y-1 border-t border-neutral-100 pl-4 pt-3 text-xs leading-6 text-neutral-600">{score.data.suggestions.filter((text) => typeof text === "string").map((text, index) => <li key={index}>{text}</li>)}</ul>}
          <p className="mt-3 text-[11px] leading-5 text-neutral-500">AI 内容评估，仅作为修改参考；实际分页请在导出前预览。</p>
        </div>}
        <Status pending={false} error={suggestions.error} stale={Boolean(suggestions.data && suggestions.key !== currentKey && (!score.data || score.key === currentKey))} />
        {suggestions.data?.length === 0 && <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-6 text-neutral-600">本次未返回具体修改建议，仍可参考评分提示并自行检查。</p>}
        {suggestions.data?.map((suggestion, index) => {
          const key = `${index}:${suggestion.id}:${suggestion.original}`;
          const change = applied[key];
          const target = resolveSuggestionTarget(resume, suggestion);
          const canUndo = Boolean(change && suggestionTargetValue(resume, change.target) === change.after);
          return <article key={key} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
            <div><p className="mb-1 text-[11px] text-neutral-500">{suggestion.module}{target ? ` · ${target.label}` : ""}</p><h3 className="break-words text-sm font-medium">{suggestion.title}</h3></div>
            {suggestion.original && <div><p className="mb-1 text-[11px] text-neutral-500">原文</p><p className="whitespace-pre-wrap break-words text-xs leading-6 text-neutral-500">{suggestion.original}</p></div>}
            <div className="rounded-md bg-neutral-50 p-3"><p className="mb-1 text-[11px] text-neutral-500">建议表达 · 请核实事实</p><p className="whitespace-pre-wrap break-words text-xs leading-6 text-neutral-800">{suggestion.suggested}</p></div>
            <div className="flex flex-wrap gap-2">
              {change ? <button type="button" onClick={() => undo(key)} disabled={!canUndo || pending} className={secondaryButton}><Undo2 size={13} />撤销修改</button> : target && <button type="button" onClick={() => apply(suggestion, key)} disabled={pending || suggestion.original === suggestion.suggested} className={primaryButton}><Check size={13} />采纳这一处</button>}
              <button type="button" onClick={() => editSection(suggestion)} className={secondaryButton}>前往编辑<ArrowRight size={13} /></button>
            </div>
            {change && <p className="text-[11px] leading-5 text-neutral-500">{canUndo ? "已替换对应原文，可撤销本次修改。" : "此段已再次修改，保留你最新的编辑。"}</p>}
            {!change && !target && <p className="text-[11px] leading-5 text-neutral-500">未能唯一定位原文，请在对应章节核对后手动修改。</p>}
          </article>;
        })}
        {!score.data && !suggestions.data && !pending && !score.error && !suggestions.error && <p className="rounded-lg bg-neutral-50 p-3 text-xs leading-6 text-neutral-500">尚未分析。准备好内容后，点击上方按钮开始。</p>}
      </section>
      <p className="text-[11px] leading-5 text-neutral-500">AI 分析需登录并拥有 PRO 权限。建议只使用能够核实的经历与成果。</p>
      <Modal open={proGateOpen} onClose={() => setProGateOpen(false)} title="使用 AI 分析">
        <p className="text-sm leading-7 text-neutral-600">AI 评分、修改建议与岗位匹配需要登录并拥有 PRO 权限。你可以继续编辑简历、查看写作参考和预览排版。</p>
        <button type="button" onClick={() => setProGateOpen(false)} className={`${primaryButton} mt-5 w-full`}>继续编辑</button>
      </Modal>
    </div>
  );
}
