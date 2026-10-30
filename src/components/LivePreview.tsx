import { useLayoutEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { getResumeTemplate } from "../data/resumeTemplates";
import { useResumeStore } from "../store/resumeStore";
import { entriesStartingOnPage } from "../utils/entryNavigation";
import { CONTENT_HEIGHT, PAGE_HEIGHT, PAGE_MARGIN, PAGE_WIDTH, PAPER_WIDTH, readResumeLayout, type ResumeLayout } from "../utils/resumeLayout";
import { ResumeDocument } from "./resume";

export { ResumeDocument } from "./resume";
const sectionNames: Record<string, string> = { basic: "基本信息", summary: "个人简介", work: "工作经历", projects: "项目经历", education: "教育背景", skills: "专业技能" };
const sectionTarget = (key: string): "basic" | "work" | "projects" | "skills" => key === "summary" || key === "basic" ? "basic" : key === "education" || key === "skills" ? "skills" : key === "work" ? "work" : "projects";

export interface EditEntryRequest {
  kind: "work" | "project";
  id: string;
}

export function LivePreview({ activeSection, onEditSection, onEditEntry }: {
  activeSection?: string;
  onEditSection?: (section: "basic" | "work" | "projects" | "skills") => void;
  onEditEntry?: (request: EditEntryRequest) => void;
}) {
  const { resume, template, sectionOrder } = useResumeStore(useShallow((state) => ({ resume: state.resume, template: state.template, sectionOrder: state.sectionOrder })));
  const viewport = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoom, setZoom] = useState("fit");
  const [layout, setLayout] = useState<ResumeLayout>({ pages: [{ start: 0, end: CONTENT_HEIGHT }], sections: [], entries: [] });
  useLayoutEffect(() => {
    const host = viewport.current;
    const paper = source.current?.querySelector<HTMLElement>('.resume-paper');
    if (!host || !paper) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const width = host.clientWidth;
      if (width > 0) setAvailableWidth(width);
      if (paper.getBoundingClientRect().height > 0) setLayout(readResumeLayout(paper));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host); observer.observe(paper);
    void document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [resume, template, sectionOrder]);
  const scale = zoom === "fit" ? Math.min(1, Math.max(0.1, (availableWidth || PAGE_WIDTH) / PAGE_WIDTH)) : Number(zoom);
  const paperColor = getResumeTemplate(template).style.paper;
  return (
    <div className="w-full min-w-0" aria-label="简历实时预览">
      <div className="a4-toolbar">
        <div><span className="font-medium text-neutral-700">A4 分页预览</span><span className="ml-2">{layout.pages.length} 页 · {getResumeTemplate(template).name}</span></div>
        <label className="a4-zoom">缩放<select aria-label="预览缩放" value={zoom} onChange={event => setZoom(event.target.value)}>
          <option value="fit">适应宽度</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option>
        </select><span className="a4-scale">{Math.round(scale * 100)}%</span></label>
      </div>
      {/* One accessible, unscaled source; visual page copies are hidden from assistive technology. */}
      <div className="a4-source" ref={source}><div className="a4-document" style={{ width: PAPER_WIDTH }}><ResumeDocument resume={resume} template={template} sectionOrder={sectionOrder} /></div></div>
      <div className="a4-viewport" ref={viewport}>
        {layout.pages.map((page, index) => (
          <div className="a4-page-group" key={index} style={{ width: PAGE_WIDTH * scale }}>
            <div className="a4-page-label">第 {index + 1} 页 / 共 {layout.pages.length} 页</div>
            <div className="a4-page-frame" style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}>
              <div className="a4-page" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${scale})` }}>
                <div className="a4-content" aria-hidden="true" style={{ left: PAGE_MARGIN, top: PAGE_MARGIN, width: PAPER_WIDTH, height: CONTENT_HEIGHT, background: paperColor }}>
                  <div style={{ height: page.end - page.start, overflow: "hidden" }}>
                    <div className="a4-document" style={{ width: PAPER_WIDTH, transform: `translateY(${-page.start}px)` }}>
                      <ResumeDocument resume={resume} template={template} sectionOrder={sectionOrder} activeSection={activeSection} documentId={null} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Overlay lives outside the scaled page, so buttons keep a usable size at every zoom level. */}
              <div className="a4-overlay">
                {onEditSection && layout.sections.filter(section => section.top >= page.start && section.top < page.end).map(section => (
                  <button key={section.key} type="button" className="a4-edit" aria-label={`编辑${sectionNames[section.key]}（第 ${index + 1} 页）`} onClick={() => onEditSection(sectionTarget(section.key))} style={{ top: (PAGE_MARGIN + section.top - page.start) * scale, right: PAGE_MARGIN * scale + 6 }}><Pencil size={12}/>编辑{sectionNames[section.key]}</button>
                ))}
                {onEditEntry && entriesStartingOnPage(layout.entries, layout.pages, index).map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    className="a4-entry-edit"
                    aria-label={`编辑「${entry.label || (entry.kind === "work" ? "工作经历" : "项目经历")}」`}
                    title={`编辑「${entry.label || (entry.kind === "work" ? "工作经历" : "项目经历")}」`}
                    onClick={() => onEditEntry({ kind: entry.kind, id: entry.id })}
                    style={{ top: (PAGE_MARGIN + entry.top - page.start) * scale, left: Math.max(2, PAGE_MARGIN * scale - 28) }}
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-neutral-500">与 PDF 使用相同的纸张尺寸、页边距和分页规则 · 缩放不改变排版</p>
    </div>
  );
}
