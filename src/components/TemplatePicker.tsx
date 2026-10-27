import { Check, ChevronDown, LayoutTemplate } from "lucide-react";
import { useId, useState } from "react";
import { useShallow } from "zustand/shallow";
import { getResumeTemplate, resumeTemplates } from "../data/resumeTemplates";
import { useResumeStore } from "../store/resumeStore";

export function TemplatePicker({ expanded, onSelect }: { expanded?: boolean; onSelect?: () => void }) {
  const { template, setTemplate } = useResumeStore(useShallow((state) => ({ template: state.template, setTemplate: state.setTemplate })));
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const visible = expanded ?? open;
  return (
    <div className="min-w-0">
      {expanded === undefined && (
        <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50" onClick={() => setOpen(!open)} aria-expanded={visible} aria-controls={panelId}>
          <LayoutTemplate size={15} />模板与排版<ChevronDown size={14} className={visible ? "rotate-180" : ""} />
        </button>
      )}
      {visible && (
        <div id={panelId} className={expanded === undefined ? "mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4" : ""}>
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-neutral-800">按经历选结构</h3>
            <p className="text-xs text-neutral-500">切换顺序，保留所有已写内容</p>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
            {resumeTemplates.map((item) => (
              <button key={item.key} type="button" aria-pressed={template === item.key} onClick={() => { setTemplate(item.key); onSelect?.(); }} className={`rounded-lg border bg-white p-3 text-left transition ${template === item.key ? "border-neutral-700 ring-1 ring-neutral-700" : "border-neutral-200 hover:border-neutral-400"}`}>
                <div className="mb-3 flex items-center justify-between" aria-hidden="true">
                  <div className="space-y-1"><div className="h-1.5 w-8 rounded-sm bg-neutral-600" /><div className="h-1 w-14 rounded-sm bg-neutral-200" /><div className="h-1 w-10 rounded-sm bg-neutral-200" /></div>
                  {template === item.key && <Check size={15} className="text-neutral-700" />}
                </div>
                <span className="block text-sm font-semibold text-neutral-800">{item.name}</span>
                <span className="mt-1 block text-xs text-neutral-500">{item.audience}</span>
                <span className="mt-2 block text-xs leading-5 text-neutral-500">{item.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">当前：{getResumeTemplate(template).name} · 白纸黑字，单栏排版</p>
        </div>
      )}
    </div>
  );
}
