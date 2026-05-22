import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { fetchAIOptimizeBullets } from "../utils/ai";
import { showToast } from "../components/Toast";
import { StepHeading } from "./BasicInfo";

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

export function ProjectExperiencePage() {
  const { t } = useT();
  const projects = useResumeStore((state) => state.resume.projects);
  const updateProject = useResumeStore((state) => state.updateProject);
  const addProject = useResumeStore((state) => state.addProject);
  const removeProject = useResumeStore((state) => state.removeProject);

  const [optimizeTarget, setOptimizeTarget] = useState<string | null>(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizedBullets, setOptimizedBullets] = useState<string[]>([]);
  const optimizeAbortRef = useRef<AbortController | null>(null);

  const targetProject = projects.find((p) => p.id === optimizeTarget);

  const handleOptimize = async (id: string) => {
    const p = projects.find((item) => item.id === id);
    if (!p || p.bullets.length === 0) {
      showToast(t("work.fillContentFirst"), "info");
      return;
    }
    optimizeAbortRef.current?.abort();
    const controller = new AbortController();
    optimizeAbortRef.current = controller;

    setOptimizeTarget(id);
    setOptimizedBullets([]);
    setOptimizeLoading(true);
    try {
      const result = await fetchAIOptimizeBullets(
        { type: "project", project: p.name, role: p.role },
        p.bullets,
        controller.signal
      );
      setOptimizedBullets(result);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      showToast(e.message || t("work.optimizeFailed"), "error");
      setOptimizeTarget(null);
    } finally {
      setOptimizeLoading(false);
    }
  };

  const closeOptimizeModal = () => {
    optimizeAbortRef.current?.abort();
    setOptimizeTarget(null);
    setOptimizedBullets([]);
    setOptimizeLoading(false);
  };

  const confirmOptimize = () => {
    if (optimizeTarget && optimizedBullets.length > 0) {
      updateProject(optimizeTarget, { bullets: optimizedBullets });
      showToast(t("work.optimizeApplied"), "success");
    }
    setOptimizeTarget(null);
    setOptimizedBullets([]);
  };

  return (
    <div>
      <StepHeading title={t("project.title")} subtitle={t("project.subtitle")} />
      <div className="space-y-5">
        {projects.map((project, index) => (
          <section key={project.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {project.name || t("project.name")}
              </span>
              {index === 0 && (
                <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-medium text-brand-500">
                  最近
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input value={project.name} label={t("project.name")} onChange={(name) => updateProject(project.id, { name })} />
              <Input value={project.role} label={t("project.role")} onChange={(role) => updateProject(project.id, { role })} />
              <Input value={project.startDate} label={t("project.startDate")} onChange={(startDate) => updateProject(project.id, { startDate })} />
              <Input value={project.endDate} label={t("project.endDate")} onChange={(endDate) => updateProject(project.id, { endDate })} />
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs text-slate-400">
                <span>{t("work.descHint")}</span>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
                  onClick={() => handleOptimize(project.id)}
                  disabled={optimizeLoading && optimizeTarget === project.id}
                >
                  {optimizeLoading && optimizeTarget === project.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {t("work.aiFill")}
                </button>
              </div>
              <textarea
                className="min-h-[98px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-7 outline-none"
                value={project.bullets.join("\n")}
                onChange={(event) => updateProject(project.id, { bullets: event.target.value.split("\n").filter(Boolean) })}
              />
            </div>
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-slate-400">{t("work.keywordTags")}</p>
              <TagEditor tags={project.tags} onUpdate={(tags) => updateProject(project.id, { tags })} />
            </div>
            {projects.length > 1 && (
              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  onClick={() => { if (window.confirm(t("project.confirmDelete"))) removeProject(project.id); }}
                >
                  <Trash2 size={13} />
                  {t("work.deleteItem")}
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
      <button
        className="mt-5 w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-500"
        onClick={() => addProject()}
      >
        + {t("work.addItem")}
      </button>

      {/* AI 优化对比确认弹窗 */}
      {optimizeTarget !== null && !optimizeLoading && optimizedBullets.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeOptimizeModal} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">{t("work.optimizeResult")}</h2>
              <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={closeOptimizeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold text-slate-400 uppercase">{t("work.beforeOptimize")}</p>
                <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                  {targetProject?.bullets.map((b, i) => (
                    <p key={i} className="text-sm leading-6 text-slate-500">{b}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-emerald-600 uppercase">{t("work.afterOptimize")}</p>
                <div className="space-y-1 rounded-xl bg-emerald-50 p-3">
                  {optimizedBullets.map((b, i) => (
                    <p key={i} className="text-sm leading-6 text-emerald-800">{b}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={closeOptimizeModal}
              >
                {t("work.cancel")}
              </button>
              <button
                className="h-11 flex-1 rounded-xl bg-brand-500 text-sm font-semibold text-white transition hover:bg-brand-600"
                onClick={confirmOptimize}
              >
                {t("work.applyOptimize")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <input aria-label={label} className="input" value={value} placeholder={label} onChange={(event) => onChange(event.target.value)} />;
}
