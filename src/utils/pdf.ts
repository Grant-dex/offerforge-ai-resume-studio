import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { showToast } from "../components/Toast";
import { keepBlocksTogether, type PageBlock } from "./pdfPagination";

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
    snapshot.setAttribute("aria-hidden", "true");
    Object.assign(snapshot.style, {
      position: "absolute", left: "-10000px", top: "0", width: "794px", maxWidth: "none",
      minHeight: "0", height: "auto", padding: "44px 48px", margin: "0", display: "block",
      border: "none", boxShadow: "none", transform: "none", background: "#ffffff", colorScheme: "light"
    });
    snapshot.querySelectorAll<HTMLElement>("[data-resume-section]").forEach((element) => {
      element.dataset.active = "false";
      element.style.outline = "none";
      element.style.backgroundColor = "transparent";
    });
    document.body.appendChild(snapshot);
    await document.fonts.ready;
    await Promise.all(Array.from(snapshot.querySelectorAll("img")).map(async (image) => {
      if (!image.complete) await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("头像加载失败，请重新上传后导出")); });
      if (!image.naturalWidth) throw new Error("头像加载失败，请重新上传后导出");
    }));
    const snapshotTop = snapshot.getBoundingClientRect().top;
    const blocks: PageBlock[] = Array.from(snapshot.querySelectorAll<HTMLElement>("[data-pdf-block], [data-pdf-line], h2")).map(element => {
      const rect = element.getBoundingClientRect();
      // A heading travels with the first content line, rather than ending a page alone.
      const bottom = element.tagName === "H2" ? Math.max(rect.bottom, element.nextElementSibling?.getBoundingClientRect().top ?? rect.bottom) + 40 : rect.bottom;
      return { top: (rect.top - snapshotTop) * 2, bottom: (bottom - snapshotTop) * 2 };
    });
    const canvas = await html2canvas(snapshot, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", logging: false, width: 794, windowWidth: 1280 });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageWidth = 190;
    const pageHeight = 277;
    const maxHeight = Math.floor(canvas.width * pageHeight / pageWidth);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法读取简历画面");
    let position = 0;
    let pageCount = 0;
    while (position < canvas.height) {
      const target = Math.min(position + maxHeight, canvas.height);
      const preferred = keepBlocksTogether(target, position, maxHeight, blocks);
      const end = target < canvas.height ? findWhiteBreak(context, canvas.width, preferred, position) : target;
      const height = end - position;
      const page = document.createElement("canvas");
      page.width = canvas.width; page.height = height;
      const pageContext = page.getContext("2d");
      if (!pageContext) throw new Error("无法生成 PDF 页面");
      pageContext.drawImage(canvas, 0, position, canvas.width, height, 0, 0, canvas.width, height);
      if (pageCount > 0) pdf.addPage();
      pdf.addImage(page.toDataURL("image/png"), "PNG", 10, 10, pageWidth, height * pageWidth / canvas.width);
      pageCount += 1; position = end;
    }
    pdf.save(fileName || "resume.pdf");
    showToast(`PDF 已导出，共 ${pageCount} 页`, "success");
  } catch (error) {
    showToast(`PDF 导出失败：${error instanceof Error ? error.message : "请重试"}`, "error");
  } finally {
    snapshot?.remove();
    exporting = false;
  }
}

// Move the page break into the nearest inter-line gap to avoid slicing through text.
function findWhiteBreak(context: CanvasRenderingContext2D, width: number, target: number, pageStart: number) {
  const top = Math.max(pageStart + 1, target - 240);
  const pixels = context.getImageData(0, top, width, target - top).data;
  let blankRows = 0;
  for (let y = target - top - 1; y >= 0; y -= 1) {
    let blank = true;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (pixels[offset] < 245 || pixels[offset + 1] < 245 || pixels[offset + 2] < 245) { blank = false; break; }
    }
    blankRows = blank ? blankRows + 1 : 0;
    if (blankRows >= 8) return top + y + 4;
  }
  return target;
}
