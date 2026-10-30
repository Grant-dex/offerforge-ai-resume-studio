import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { showToast } from "../components/Toast";
import { CONTENT_HEIGHT_MM, CONTENT_WIDTH_MM, PAGE_MARGIN_MM, PAPER_WIDTH, readResumeLayout } from "./resumeLayout";

const EXPORT_NODE_ID = "resume-preview";
let exporting = false;

/** Capture an independent, fixed-width copy so hidden mobile previews can export too. */
export async function exportResumePdf(fileName?: string) {
  if (exporting) return;
  exporting = true;
  let snapshot: HTMLElement | undefined;
  try {
    const previewNode = document.getElementById(EXPORT_NODE_ID);
    if (!(previewNode instanceof HTMLElement)) throw new Error("未找到简历预览区域");
    showToast("正在生成 PDF…", "info");
    snapshot = previewNode.cloneNode(true) as HTMLElement;
    snapshot.id = "resume-pdf-snapshot";
    snapshot.classList.add("resume-export-paper");
    snapshot.querySelectorAll("[data-preview-only]").forEach(element => element.remove());
    snapshot.setAttribute("aria-hidden", "true");
    const paper = getComputedStyle(previewNode);
    Object.assign(snapshot.style, {
      position: "absolute", left: "-10000px", top: "0", width: `${PAPER_WIDTH}px`, maxWidth: "none",
      minHeight: "0", height: "auto", margin: "0", display: "flex",
      border: "none", boxShadow: "none", transform: "none",
      background: paper.backgroundColor || "#ffffff", colorScheme: "light"
    });
    // Selection is expressed in CSS ([data-active="true"]); clearing the flag is enough
    // and keeps the template's own paper/band colours intact.
    snapshot.querySelectorAll<HTMLElement>("[data-resume-section]").forEach((element) => {
      element.dataset.active = "false";
    });
    document.body.appendChild(snapshot);
    await document.fonts.ready;
    await Promise.all(Array.from(snapshot.querySelectorAll("img")).map(async (image) => {
      if (!image.complete) await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("头像加载失败，请重新上传后导出")); });
      if (!image.naturalWidth) throw new Error("头像加载失败，请重新上传后导出");
    }));
    const layout = readResumeLayout(snapshot);
    const canvas = await html2canvas(snapshot, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: paper.backgroundColor || "#ffffff", logging: false, width: PAPER_WIDTH, windowWidth: 1280 });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const background = paper.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [255, 255, 255];
    for (const [index, slice] of layout.pages.entries()) {
      const start = Math.round(slice.start * canvas.width / PAPER_WIDTH);
      const end = Math.round(slice.end * canvas.width / PAPER_WIDTH);
      const page = document.createElement("canvas");
      page.width = canvas.width; page.height = Math.max(1, end - start);
      const pageContext = page.getContext("2d");
      if (!pageContext) throw new Error("无法生成 PDF 页面");
      pageContext.drawImage(canvas, 0, start, canvas.width, page.height, 0, 0, canvas.width, page.height);
      if (index > 0) pdf.addPage();
      pdf.setFillColor(background[0], background[1], background[2]);
      pdf.rect(PAGE_MARGIN_MM, PAGE_MARGIN_MM, CONTENT_WIDTH_MM, CONTENT_HEIGHT_MM, "F");
      pdf.addImage(page.toDataURL("image/png"), "PNG", PAGE_MARGIN_MM, PAGE_MARGIN_MM, CONTENT_WIDTH_MM, page.height * CONTENT_WIDTH_MM / canvas.width);
    }
    pdf.save(fileName || "resume.pdf");
    showToast(`PDF 已导出，共 ${layout.pages.length} 页`, "success");
  } catch (error) {
    showToast(`PDF 导出失败：${error instanceof Error ? error.message : "请重试"}`, "error");
  } finally {
    snapshot?.remove();
    exporting = false;
  }
}
