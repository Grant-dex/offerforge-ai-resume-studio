import { AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { dateRange, getResumeTemplate, nonemptyLines, type ResumeSectionKey } from "../data/resumeTemplates";
import type { ResumeData, TemplateKey } from "../types/resume";
import { normalizeSectionOrder } from "../data/sectionOrder";

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };
const run = (text: string, bold = false, size = 21, color = "333333", font = "Arial") => new TextRun({ text, bold, size, color, font });
const body = (text: string, options: { bold?: boolean; color?: string; size?: number; font?: string } = {}) => new Paragraph({ spacing: { after: 80 }, children: text.split("\n").flatMap((line, index) => index ? [new TextRun({ break: 1 }), run(line, options.bold, options.size, options.color, options.font)] : [run(line, options.bold, options.size, options.color, options.font)]) });
const sectionHeading = (text: string, accent: string, headingFont: string, rule: string) => new Paragraph({ keepNext: true, spacing: { before: 280, after: 110 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: rule, space: 5 } }, children: [run(text, true, 24, accent, headingFont)] });
const bulletParagraphs = (lines?: string[]) => nonemptyLines(lines).map((text) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: text.split("\n").flatMap((line, index) => index ? [new TextRun({ break: 1 }), run(line)] : [run(line)]) }));
const tagParagraphs = (tags?: string[]) => nonemptyLines(tags).length ? [body(nonemptyLines(tags).join(" · "), { size: 18, color: "666666" })] : [];

function entryHeading(title: string, dates: string) {
  return new Paragraph({ keepNext: true, spacing: { before: 100, after: 40 }, children: [run(title, true, 22, "222222"), ...(dates ? [run(`    ${dates}`, false, 18, "666666")] : [])] });
}

async function avatarImage(source: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("头像加载失败，请重新上传头像后导出")); image.src = source; });
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法生成头像");
  const ratio = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  context.drawImage(image, (canvas.width - image.naturalWidth * ratio) / 2, (canvas.height - image.naturalHeight * ratio) / 2, image.naturalWidth * ratio, image.naturalHeight * ratio);
  const bytes = Uint8Array.from(atob(canvas.toDataURL("image/png").split(",")[1]), (character) => character.charCodeAt(0));
  return new ImageRun({ type: "png", data: bytes, transformation: { width: 64, height: 80 } });
}

/** The same section ordering is used by the live preview and Word export. */
export async function buildResumeWordDocument(resume: ResumeData, template: TemplateKey = "focus", sectionOrder?: ResumeSectionKey[]) {
  const { personal, education } = resume;
  const style = getResumeTemplate(template).style;
  const accent = style.accent.replace("#", "");
  const rule = style.rule.replace("#", "");
  const children: (Paragraph | Table)[] = [];
  const header = [body(personal.name || "你的姓名", { bold: true, size: style.nameSize, color: "1C1A17", font: style.headingFont })];
  if (personal.role) header.push(body(personal.role, { bold: true, size: 24, color: accent, font: style.headingFont }));
  if (personal.seniority) header.push(body(personal.seniority, { size: 20, color: "555555" }));
  if (personal.avatar) {
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders, rows: [new TableRow({ children: [
      new TableCell({ width: { size: 82, type: WidthType.PERCENTAGE }, borders: noBorders, children: header }),
      new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, borders: noBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [await avatarImage(personal.avatar)] })] })
    ] })] }));
  } else children.push(...header);
  children.push(new Paragraph({ spacing: { before: 40, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: rule, space: 10 } }, children: [run([personal.city, personal.phone, personal.email].filter(Boolean).join("    ·    "), false, 18, "555555")] }));
  const sections: Record<ResumeSectionKey, Paragraph[]> = { summary: [], work: [], projects: [], education: [], skills: [] };
  if (personal.summary?.trim()) sections.summary.push(sectionHeading("个人简介", accent, style.headingFont, rule), body(personal.summary));
  for (const item of Array.isArray(resume.work) ? resume.work : []) {
    if (![item.company, item.title, item.city, item.startDate, item.endDate, ...nonemptyLines(item.bullets), ...nonemptyLines(item.tags)].some(Boolean)) continue;
    if (!sections.work.length) sections.work.push(sectionHeading("工作经历", accent, style.headingFont, rule));
    sections.work.push(entryHeading(item.company, dateRange(item.startDate, item.endDate)));
    if (item.title || item.city) sections.work.push(body([item.title, item.city].filter(Boolean).join(" · "), { size: 20, color: "555555" }));
    sections.work.push(...bulletParagraphs(item.bullets), ...tagParagraphs(item.tags));
  }
  for (const item of Array.isArray(resume.projects) ? resume.projects : []) {
    if (![item.name, item.role, item.startDate, item.endDate, ...nonemptyLines(item.bullets), ...nonemptyLines(item.tags)].some(Boolean)) continue;
    if (!sections.projects.length) sections.projects.push(sectionHeading("项目经历", accent, style.headingFont, rule));
    sections.projects.push(entryHeading(item.name, dateRange(item.startDate, item.endDate)));
    if (item.role) sections.projects.push(body(item.role, { size: 20, color: "555555" }));
    sections.projects.push(...bulletParagraphs(item.bullets), ...tagParagraphs(item.tags));
  }
  if (education && [education.school, education.degree, education.major, education.years, education.description, ...nonemptyLines(education.tags)].some(Boolean)) {
    sections.education.push(sectionHeading("教育背景", accent, style.headingFont, rule), entryHeading(education.school, education.years));
    if (education.degree || education.major) sections.education.push(body([education.degree, education.major].filter(Boolean).join(" · "), { size: 20, color: "555555" }));
    sections.education.push(...bulletParagraphs(education.description?.split("\n")), ...tagParagraphs(education.tags));
  }
  if (nonemptyLines(resume.skills).length) sections.skills.push(sectionHeading("专业技能", accent, style.headingFont, rule), body(nonemptyLines(resume.skills).join(" / ")));
  const order = normalizeSectionOrder(sectionOrder, getResumeTemplate(template).order);
  for (const key of order) children.push(...sections[key]);
  return new Document({
    styles: { default: { document: { run: { font: "Arial", size: 21, color: "333333" }, paragraph: { spacing: { line: 310 } } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 1000, right: 1000 } } }, children }]
  });
}

export async function exportResumeWord(resume: ResumeData, fileName: string, template: TemplateKey = "focus", sectionOrder?: ResumeSectionKey[]) {
  const documentFile = await buildResumeWordDocument(resume, template, sectionOrder);
  const blob = await Packer.toBlob(documentFile);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = fileName;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
