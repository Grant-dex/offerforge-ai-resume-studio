import { ArrowDown, ArrowUp, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { captureRemovedExperience, type IdentifiedExperience, type RemovedExperience } from "../utils/experienceEditing";
import { findEntryById } from "../utils/entryNavigation";
import { showToast } from "./Toast";

interface ExperienceEditorProps<T extends IdentifiedExperience> {
  items: T[];
  resumeId: string;
  zh: boolean;
  kind: "work" | "project";
  title: (item: T) => string;
  summary: (item: T) => string;
  onAdd: () => string;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onRestore: (entry: RemovedExperience<T>, resumeId: string) => void;
  focusRequest?: { id: string; nonce: number } | null;
  onFocusHandled?: (found: boolean) => void;
  children: (item: T) => ReactNode;
}

/** This editor is keyed by the draft ID in each page, keeping its undo history local to one draft. */
export function ExperienceEditor<T extends IdentifiedExperience>({ items, resumeId, zh, kind, title, summary, onAdd, onMove, onRemove, onRestore, focusRequest, onFocusHandled, children }: ExperienceEditorProps<T>) {
  const [collapsed, setCollapsed] = useState(() => new Set(items.slice(1).map(item => item.id)));
  const [removed, setRemoved] = useState<RemovedExperience<T>[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [focusTarget, setFocusTarget] = useState<{ id: string; edit?: boolean } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const lastFocusRequest = useRef(0);
  const flashTimer = useRef<number | null>(null);
  const cards = useRef(new Map<string, HTMLElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const prefix = useId();
  const label = zh ? kind === "work" ? "工作经历" : "项目经历" : kind === "work" ? "work experience" : "project";
  const fallbackTitle = zh ? `新${label}` : kind === "work" ? "New work experience" : "New project";
  const visibleTitle = (item: T) => title(item).trim() || fallbackTitle;
  const allCollapsed = items.length > 0 && items.every(item => collapsed.has(item.id));
  const latestRemoved = removed[removed.length - 1];

  useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);
  useEffect(() => {
    if (!focusTarget) return;
    const card = cards.current.get(focusTarget.id);
    const target = focusTarget.edit ? card?.querySelector<HTMLElement>("input,textarea") : card?.querySelector<HTMLElement>("button[aria-expanded]");
    (target ?? addButton.current)?.focus();
    setFocusTarget(null);
  }, [focusTarget, items]);

  // Jump from an entry's edit button in the preview: expand, scroll, focus, then flash briefly.
  useEffect(() => {
    if (!focusRequest || focusRequest.nonce === lastFocusRequest.current) return;
    lastFocusRequest.current = focusRequest.nonce;
    const item = findEntryById(items, focusRequest.id);
    if (!item) {
      setAnnouncement(zh ? "这段经历已不存在，可能刚被删除。" : "That entry no longer exists.");
      showToast(zh ? "要编辑的经历已被删除，无法定位。" : "That entry was deleted, so it cannot be opened.", "info");
      onFocusHandled?.(false);
      return;
    }
    setCollapsed(current => {
      if (!current.has(item.id)) return current;
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setFlashId(item.id);
    setAnnouncement(zh ? `正在编辑「${visibleTitle(item)}」。` : `Editing “${visibleTitle(item)}”.`);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashId(null), 1900);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const card = cards.current.get(item.id);
      if (!card) { onFocusHandled?.(false); return; }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      card.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled])")?.focus({ preventScroll: true });
      onFocusHandled?.(true);
    }));
  }, [focusRequest]);

  const remove = (id: string) => {
    const entry = captureRemovedExperience(items, id);
    if (!entry) return;
    // Register recovery before the store can synchronously notify listeners or persist.
    setRemoved(current => [...current, entry]);
    onRemove(id);
    requestAnimationFrame(() => undoButton.current?.focus());
  };
  const restore = () => {
    if (!latestRemoved) return;
    onRestore(latestRemoved, resumeId);
    setRemoved(current => current.slice(0, -1));
    setCollapsed(current => { const next = new Set(current); next.delete(latestRemoved.item.id); return next; });
    setFocusTarget({ id: latestRemoved.item.id });
    setAnnouncement(zh ? "已恢复经历，其它修改已保留。" : "Experience restored. Other edits are preserved.");
  };

  return <div className="min-w-0">
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    {items.length > 0 && <div className="mb-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
      <span>{zh ? `共 ${items.length} 条 · 顺序同步到预览` : `${items.length} entries · Preview uses this order`}</span>
      <button type="button" className="shrink-0 rounded px-1 py-2 text-neutral-600 hover:text-neutral-900" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(items.map(item => item.id)))}>{zh ? allCollapsed ? "全部展开" : "全部收起" : allCollapsed ? "Expand all" : "Collapse all"}</button>
    </div>}
    {latestRemoved && <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-xs leading-5 text-neutral-700" role="status">{zh ? `已移除「${visibleTitle(latestRemoved.item)}」` : `Removed “${visibleTitle(latestRemoved.item)}”`}{removed.length > 1 && <span className="mt-1 block text-neutral-500">{zh ? `可依次撤销 ${removed.length} 次移除` : `${removed.length} removals can be undone`}</span>}</p>
        <button ref={undoButton} type="button" className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-200" onClick={restore}><RotateCcw size={13}/>{zh ? "撤销" : "Undo"}</button>
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">{zh ? "离开此章节前可撤销移除。" : "Undo is available until you leave this section."}</p>
    </div>}
    {items.length === 0 && <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-6 text-center">
      <p className="text-sm font-medium text-neutral-700">{zh ? `还没有${label}` : `No ${label} yet`}</p>
      <p className="mt-2 text-xs leading-6 text-neutral-500">{zh ? kind === "work" ? "可以填写正式工作或实习。暂无相关经历时，直接填写项目或教育背景。" : "课程、个人作品和实际项目都可以。选择与目标岗位相关的一项开始。" : kind === "work" ? "Add a job or internship. You can also continue with projects or education." : "Coursework, personal work, and real projects all count. Start with one relevant example."}</p>
    </div>}
    <div className="space-y-4">
      {items.map((item, index) => {
        const open = !collapsed.has(item.id), panelId = `${prefix}-${item.id}`;
        return <section key={item.id} ref={node => { if (node) cards.current.set(item.id, node); else cards.current.delete(item.id); }} aria-label={`${zh ? label : kind === "work" ? "Work experience" : "Project"} ${index + 1}`} className={`min-w-0 rounded-xl border border-neutral-200 bg-white ${flashId === item.id ? "entry-focus-flash" : ""}`}>
          <h3><button type="button" aria-expanded={open} aria-controls={panelId} className="flex w-full items-start gap-2.5 rounded-t-xl p-4 text-left hover:bg-neutral-50" onClick={() => setCollapsed(current => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-medium text-neutral-500">{String(index + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold leading-6 text-neutral-800">{visibleTitle(item)}</span><span className="mt-1 block break-words text-[11px] font-normal leading-5 text-neutral-500">{summary(item) || (zh ? "待补充岗位与时间" : "Add a role and dates")}</span></span>
            <ChevronDown aria-hidden="true" size={16} className={`mt-1 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}/>
          </button></h3>
          <div id={panelId} hidden={!open} className="grid min-w-0 grid-cols-1 gap-4 border-t border-neutral-100 p-4">{children(item)}</div>
          <div className="flex items-center gap-1 border-t border-neutral-100 px-3 py-2">
            {([-1, 1] as const).map(direction => {
              const Icon = direction === -1 ? ArrowUp : ArrowDown;
              const word = zh ? direction === -1 ? "上移" : "下移" : direction === -1 ? "Move up" : "Move down";
              return <button key={direction} type="button" disabled={direction === -1 ? index === 0 : index === items.length - 1} aria-label={zh ? `${word}第 ${index + 1} 条${label}` : `${word} ${label} ${index + 1}`} className="inline-flex items-center gap-1 rounded px-2 py-2 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:hover:bg-transparent" onClick={() => { onMove(item.id, direction); setFocusTarget({ id: item.id }); setAnnouncement(zh ? `已将「${visibleTitle(item)}」移至第 ${index + direction + 1} 条。` : `Moved “${visibleTitle(item)}” to position ${index + direction + 1}.`); }}><Icon size={13}/>{word}</button>;
            })}
            <button type="button" aria-label={zh ? `移除第 ${index + 1} 条${label}` : `Remove ${label} ${index + 1}`} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-2 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800" onClick={() => remove(item.id)}><Trash2 size={13}/>{zh ? "移除" : "Remove"}</button>
          </div>
        </section>;
      })}
    </div>
    <button ref={addButton} type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-3 text-sm font-medium text-neutral-600 transition hover:border-neutral-500 hover:bg-neutral-100" onClick={() => { const id = onAdd(); setFocusTarget({ id, edit: true }); }}><Plus size={16}/>{zh ? `添加${label}` : kind === "work" ? "Add work experience" : "Add project experience"}</button>
  </div>;
}
