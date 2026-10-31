import { paginateResume, type PageBlock } from "./pdfPagination";

// A4 with 10 mm margins. Preview and PDF share these exact dimensions.
export const PAPER_WIDTH = 794;
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const PAGE_MARGIN_MM = 10;
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
export const PAGE_WIDTH = PAPER_WIDTH * PAGE_WIDTH_MM / CONTENT_WIDTH_MM;
export const PAGE_HEIGHT = PAPER_WIDTH * PAGE_HEIGHT_MM / CONTENT_WIDTH_MM;
export const PAGE_MARGIN = PAPER_WIDTH * PAGE_MARGIN_MM / CONTENT_WIDTH_MM;
export const CONTENT_HEIGHT = PAPER_WIDTH * CONTENT_HEIGHT_MM / CONTENT_WIDTH_MM;
export interface PageSlice { start: number; end: number }
export interface SectionPosition { key: string; top: number; bottom: number }
export interface EntryPosition { id: string; kind: "work" | "project"; top: number; bottom: number; label: string }
export interface ResumeLayout { pages: PageSlice[]; sections: SectionPosition[]; entries: EntryPosition[] }

/** Measure actual text lines, independent of paper colour or display scale. */
export function readResumeLayout(root: HTMLElement): ResumeLayout {
  const origin = root.getBoundingClientRect().top;
  const lines: PageBlock[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent?.trim() || node.parentElement?.closest('[data-preview-only], .sr-only')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.height > 2 && rect.width > 0) lines.push({ top: rect.top - origin, bottom: rect.bottom - origin });
    }
  }
  const blocks: PageBlock[] = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-block]')).map(element => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top - origin, bottom: rect.bottom - origin };
  });
  for (const heading of Array.from(root.querySelectorAll<HTMLElement>('h2:not(.sr-only), .r-label'))) {
    const rect = heading.getBoundingClientRect();
    const top = rect.top - origin;
    const bottom = rect.bottom - origin;
    const section = heading.closest('[data-resume-section]');
    const content = section?.querySelector<HTMLElement>('[data-pdf-block]');
    const contentTop = content ? content.getBoundingClientRect().top - origin : bottom;
    const first = lines.filter(line => line.top >= Math.max(top, contentTop) - 1).sort((a,b) => a.top - b.top)[0];
    blocks.push({ top, bottom: Math.max(bottom, first?.bottom ?? bottom) });
  }
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-resume-section]')).map(element => ({
    key: element.dataset.resumeSection!, top: element.getBoundingClientRect().top - origin, bottom: element.getBoundingClientRect().bottom - origin,
  }));
  const entries: EntryPosition[] = Array.from(root.querySelectorAll<HTMLElement>("[data-entry-id]")).map((element) => {
    const rect = element.getBoundingClientRect();
    const kind: "work" | "project" = element.dataset.entryKind === "project" ? "project" : "work";
    return {
      id: element.dataset.entryId || "",
      kind,
      top: rect.top - origin,
      bottom: rect.bottom - origin,
      label: element.dataset.entryLabel || "",
    };
  }).filter((entry) => entry.id);
  return { pages: paginateResume(Math.ceil(root.getBoundingClientRect().height), CONTENT_HEIGHT, blocks, lines), sections, entries };
}
