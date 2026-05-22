import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { showToast } from "../components/Toast";

const EXPORT_NODE_ID = "resume-preview-export";

export async function exportResumePdf(fileName?: string) {
  try {
    const previewNode = document.getElementById(EXPORT_NODE_ID);
    if (!(previewNode instanceof HTMLElement)) {
      throw new Error("未找到简历预览区域");
    }

    showToast("正在生成 PDF...", "info");

    const canvas = await html2canvas(previewNode, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [210, imgHeight]
    });

    pdf.addImage(imgData, "PNG", 0, 0, 210, imgHeight);
    pdf.save(fileName || "resume.pdf");
    showToast("PDF 导出成功", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    showToast(`PDF 导出失败: ${message}`, "error");
    console.error("PDF export error:", error);
  }
}
