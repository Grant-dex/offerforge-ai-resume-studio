import { ArrowDown, ArrowUp, Check, ChevronDown, LayoutTemplate } from "lucide-react";
import { useId, useState } from "react";
import { useShallow } from "zustand/shallow";
import { getResumeTemplate, resumeTemplates, type TemplateStyle } from "../data/resumeTemplates";
import { ORDER_PRESETS, SECTION_LABELS, presetByKey, type OrderPreset } from "../data/sectionOrder";
import { useResumeStore } from "../store/resumeStore";
import type { TemplateKey } from "../types/resume";

/** A tiny, honest sketch of each paper — enough to tell the three apart. */
function TemplateThumb({ templateKey, style }: { templateKey: TemplateKey; style: TemplateStyle }) {
  const line = (width: string, color: string, height = 2) => (
    <div style={{ width, height, background: color, borderRadius: 1 }} />
  );
  if (templateKey === "stack") {
    return (
      <div className="relative h-[88px] overflow-hidden rounded-[3px] border border-black/5 bg-white" aria-hidden="true">
        <div className="absolute inset-x-3 top-[10px] h-[3px]" style={{ background: "#0f0f0f" }} />
        <div className="absolute inset-x-3 top-[20px] flex items-start justify-between">
          <div className="space-y-[4px]">
            <div style={{ width: 46, height: 8, background: "#0f0f0f" }} />
            <div style={{ width: 34, height: 3, background: style.accent }} />
          </div>
          <div className="space-y-[3px] pt-[2px]">
            {line("30px", "#d4d4d4")}{line("24px", "#d4d4d4")}
          </div>
        </div>
        <div className="absolute inset-x-3 top-[52px] space-y-[6px]">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-2">
              <div style={{ width: 16, height: 2, background: "#c4c4c4", marginTop: 1 }} />
              <div className="flex-1 space-y-[3px]">
                {line(row === 2 ? "76%" : "96%", "#e3e3e3")}
                {line(row === 2 ? "52%" : "84%", "#eeeeee")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (templateKey === "lead") {
    return (
      <div className="relative h-[88px] overflow-hidden rounded-[3px] border border-black/5" style={{ background: style.paper }} aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[34px] px-3 pt-[8px]" style={{ background: style.accent }}>
          <div style={{ width: 40, height: 7, background: "rgba(244,239,227,.92)" }} />
          <div style={{ width: 26, height: 2, background: "rgba(216,198,166,.85)", marginTop: 5 }} />
        </div>
        <div className="absolute inset-x-3 top-[44px] space-y-[6px]">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-2">
              <div style={{ width: 4, height: 4, background: style.accent, transform: "rotate(45deg)" }} />
              <div className="flex-1 space-y-[3px]">
                {line(row === 1 ? "68%" : "92%", "#dcd6c7")}
                {line(row === 2 ? "48%" : "80%", "#eae4d6")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-[88px] overflow-hidden rounded-[3px] border border-black/5" style={{ background: style.paper }} aria-hidden="true">
      <div className="absolute inset-x-3 top-[10px] space-y-[4px]">
        <div style={{ width: 18, height: 2, background: style.accent }} />
        <div style={{ width: 48, height: 8, background: "#1c1a17" }} />
        <div style={{ width: 30, height: 3, background: style.accent, opacity: 0.55 }} />
      </div>
      <div className="absolute inset-x-3 top-[48px] space-y-[7px]">
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-[3px]">
            <div className="flex items-center justify-between">
              {line(row === 0 ? "34px" : "28px", "#c3b7a6")}
              {line("20px", "#d8cfc2")}
            </div>
            {line(row === 2 ? "70%" : "94%", "#e0d7c9")}
          </div>
        ))}
      </div>
    </div>
  );
}

function presetLabel(preset: OrderPreset): string {
  return preset === "custom" ? "自定义" : presetByKey(preset).name;
}

function SectionOrderPicker() {
  const { sectionOrder, orderPreset, moveSection, applyOrderPreset } = useResumeStore(useShallow((state) => ({
    sectionOrder: state.sectionOrder,
    orderPreset: state.orderPreset,
    moveSection: state.moveSection,
    applyOrderPreset: state.applyOrderPreset,
  })));
  const orderText = sectionOrder.map((key) => SECTION_LABELS[key]).join(" → ");
  const moveButton = "inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-200 disabled:hover:text-neutral-600";
  return (
    <section className="mt-4 border-t border-neutral-200 pt-4" aria-labelledby="section-order-heading">
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4 id="section-order-heading" className="text-sm font-semibold text-neutral-800">章节顺序</h4>
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">{presetLabel(orderPreset)}</span>
      </div>
      <p className="mb-3 text-xs leading-5 text-neutral-500">切换纸面不会改变顺序。点预设直接套用，或在列表里上移、下移。</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}>
        {ORDER_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            aria-pressed={orderPreset === preset.key}
            onClick={() => applyOrderPreset(preset.key)}
            className={`rounded-lg border bg-white p-2.5 text-left transition ${orderPreset === preset.key ? "border-neutral-700 ring-1 ring-neutral-700" : "border-neutral-200 hover:border-neutral-400"}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-800">{preset.name}</span>
              {orderPreset === preset.key && <Check size={13} className="shrink-0 text-neutral-700" />}
            </span>
            <span className="mt-1 block text-[10px] leading-4 text-neutral-500">{preset.order.map((key) => SECTION_LABELS[key]).join(" → ")}</span>
            <span className="mt-1 block text-[10px] leading-4 text-neutral-400">{preset.hint}</span>
          </button>
        ))}
      </div>
      <ol className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {sectionOrder.map((key, index) => (
          <li key={key} className="flex items-center gap-2 px-3 py-1.5">
            <span className="w-4 shrink-0 text-[10px] tabular-nums text-neutral-400">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-700">{SECTION_LABELS[key]}</span>
            <button type="button" className={moveButton} aria-label={`上移${SECTION_LABELS[key]}（第 ${index + 1} 位）`} disabled={index === 0} onClick={() => moveSection(key, -1)}><ArrowUp size={13} aria-hidden="true" /></button>
            <button type="button" className={moveButton} aria-label={`下移${SECTION_LABELS[key]}（第 ${index + 1} 位）`} disabled={index === sectionOrder.length - 1} onClick={() => moveSection(key, 1)}><ArrowDown size={13} aria-hidden="true" /></button>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">当前章节顺序：{orderText}</p>
    </section>
  );
}

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
            <h3 className="text-sm font-semibold text-neutral-800">纸面外观</h3>
            <p className="text-xs text-neutral-500">只改外观，内容和章节顺序都不动</p>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
            {resumeTemplates.map((item) => (
              <button key={item.key} type="button" aria-pressed={template === item.key} onClick={() => { setTemplate(item.key); onSelect?.(); }} className={`rounded-lg border bg-white p-2.5 text-left transition ${template === item.key ? "border-neutral-700 ring-1 ring-neutral-700" : "border-neutral-200 hover:border-neutral-400"}`}>
                <TemplateThumb templateKey={item.key} style={item.style} />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                  {template === item.key ? <Check size={15} className="shrink-0 text-neutral-700" /> : <span className="shrink-0 text-[10px] text-neutral-400">{item.audience}</span>}
                </div>
                <span className="mt-1 block text-xs leading-5 text-neutral-500">{item.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">当前纸面：{getResumeTemplate(template).name}</p>
          <SectionOrderPicker />
        </div>
      )}
    </div>
  );
}
