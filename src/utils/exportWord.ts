import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TableRow,
  TableCell,
  Table,
  WidthType,
  VerticalAlign,
  ShadingType,
} from "docx";
import type { ResumeData } from "../types/resume";

function getBrandHex(): string {
  try {
    const root = document.documentElement;
    return (
      root.style.getPropertyValue("--brand-500") ||
      getComputedStyle(root).getPropertyValue("--brand-500")
    ).trim() || "#4F46E5";
  } catch {
    return "#4F46E5";
  }
}

function stripHash(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

// 品牌色 → 极浅背景色（用于节标题）
function lightShade(hex: string): string {
  const h = hex.replace("#", "");
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + 210);
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + 210);
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + 210);
  return [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export async function exportResumeWord(resume: ResumeData, fileName: string) {
  const { personal, work, projects, education, skills } = resume;
  const brandHex = getBrandHex();
  const brand = stripHash(brandHex);
  const shade = lightShade(brandHex);
  const children: any[] = [];

  // ── 顶部品牌色粗线 ──
  children.push(
    new Paragraph({
      spacing: { after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 24, color: brand, space: 0 } },
      children: [],
    })
  );

  // ── 姓名 ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: personal.name || "姓名",
          bold: true,
          size: 52,
          font: { name: "PingFang SC" },
          color: "111111",
        }),
      ],
    })
  );

  // ── 职位（品牌色） ──
  if (personal.role) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: personal.role,
            size: 26,
            bold: true,
            color: brand,
            font: { name: "PingFang SC" },
          }),
        ],
      })
    );
  }

  // ── 联系信息 ──
  const contacts = [personal.email, personal.phone, personal.city].filter(Boolean);
  if (contacts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD", space: 8 } },
        children: [
          new TextRun({
            text: contacts.join("   ·   "),
            size: 18,
            color: "666666",
            font: { name: "PingFang SC" },
          }),
        ],
      })
    );
  }

  // ── 个人简介 ──
  if (personal.summary) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 200 },
        border: { left: { style: BorderStyle.SINGLE, size: 10, color: brand, space: 10 } },
        indent: { left: 160 },
        children: [
          new TextRun({
            text: personal.summary,
            size: 20,
            color: "444444",
            font: { name: "PingFang SC" },
          }),
        ],
      })
    );
  }

  // ── 节标题（浅色背景 + 左侧品牌色粗线） ──
  const addSection = (label: string) => {
    children.push(
      new Paragraph({
        spacing: { before: 360, after: 120 },
        shading: { type: ShadingType.SOLID, color: shade, fill: shade },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: brand, space: 0 } },
        indent: { left: 120 },
        children: [
          new TextRun({
            text: label,
            size: 24,
            bold: true,
            color: brand,
            font: { name: "PingFang SC" },
          }),
        ],
      })
    );
  };

  // ── 无边框表格辅助（用于左右对齐） ──
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };

  // ── 工作经历 ──
  const workList = Array.isArray(work) ? work : [];
  if (workList.length > 0) {
    addSection("工作经历");
    for (const w of workList) {
      if (!w.company) continue;

      const dateStr = [w.startDate, w.endDate].filter(Boolean).join(" — ");

      // 公司名（左）+ 日期（右）
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorders,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 62, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [
                    new Paragraph({
                      spacing: { before: 180, after: 0 },
                      children: [
                        new TextRun({
                          text: w.company,
                          bold: true,
                          size: 24,
                          font: { name: "PingFang SC" },
                          color: "111111",
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 38, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 180, after: 0 },
                      children: [
                        new TextRun({
                          text: dateStr,
                          size: 18,
                          color: "888888",
                          font: { name: "PingFang SC" },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );

      // 职位 + 城市
      if (w.title) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 60 },
            children: [
              new TextRun({ text: w.title, size: 20, bold: true, color: brand, font: { name: "PingFang SC" } }),
              w.city
                ? new TextRun({ text: `   ·   ${w.city}`, size: 18, color: "999999", font: { name: "PingFang SC" } })
                : new TextRun({ text: "" }),
            ],
          })
        );
      }

      // Bullets
      for (const b of w.bullets || []) {
        if (!b) continue;
        children.push(
          new Paragraph({
            spacing: { before: 44, after: 0 },
            indent: { left: 320, hanging: 200 },
            children: [
              new TextRun({ text: "▸  ", size: 19, color: brand, bold: true }),
              new TextRun({ text: b, size: 20, font: { name: "PingFang SC" }, color: "333333" }),
            ],
          })
        );
      }

      // Tags
      if (w.tags?.length) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: w.tags.join("  ·  "),
                size: 17,
                color: "888888",
                italics: true,
                font: { name: "PingFang SC" },
              }),
            ],
          })
        );
      }
    }
  }

  // ── 项目经历 ──
  const projectList = Array.isArray(projects) ? projects : [];
  if (projectList.length > 0) {
    addSection("项目经历");
    for (const p of projectList) {
      if (!p.name) continue;
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: p.name, bold: true, size: 22, font: { name: "PingFang SC" }, color: "111111" }),
            p.role
              ? new TextRun({ text: `    ${p.role}`, size: 19, color: "666666", font: { name: "PingFang SC" } })
              : new TextRun({ text: "" }),
          ],
        })
      );
      for (const b of p.bullets || []) {
        if (!b) continue;
        children.push(
          new Paragraph({
            spacing: { before: 36, after: 0 },
            indent: { left: 320, hanging: 200 },
            children: [
              new TextRun({ text: "▸  ", size: 19, color: brand, bold: true }),
              new TextRun({ text: b, size: 19, font: { name: "PingFang SC" }, color: "333333" }),
            ],
          })
        );
      }
    }
  }

  // ── 核心技能 ──
  const skillList = Array.isArray(skills) ? skills : [];
  if (skillList.length > 0) {
    addSection("核心技能");
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: skillList.flatMap((s, i) => [
          new TextRun({ text: s, size: 20, font: { name: "PingFang SC" }, color: brand, bold: true }),
          i < skillList.length - 1
            ? new TextRun({ text: "   /   ", size: 20, color: "CCCCCC" })
            : new TextRun({ text: "" }),
        ]),
      })
    );
  }

  // ── 教育背景 ──
  addSection("教育背景");
  const eduLine = [education.school, education.degree, education.major].filter(Boolean);
  children.push(
    new Paragraph({
      spacing: { before: 160, after: 20 },
      children: [
        new TextRun({ text: eduLine.join("  ·  "), bold: true, size: 22, font: { name: "PingFang SC" }, color: "111111" }),
        education.years
          ? new TextRun({ text: `    ${education.years}`, size: 18, color: "888888", font: { name: "PingFang SC" } })
          : new TextRun({ text: "" }),
      ],
    })
  );
  if (education.description) {
    for (const line of education.description.split("\n").filter(Boolean)) {
      children.push(
        new Paragraph({
          spacing: { before: 36, after: 0 },
          indent: { left: 320, hanging: 200 },
          children: [
            new TextRun({ text: "▸  ", size: 19, color: brand, bold: true }),
            new TextRun({ text: line, size: 19, font: { name: "PingFang SC" }, color: "333333" }),
          ],
        })
      );
    }
  }
  if (education.tags?.length) {
    children.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: education.tags.join("  ·  "),
            size: 17,
            color: "888888",
            italics: true,
            font: { name: "PingFang SC" },
          }),
        ],
      })
    );
  }

  // ── 底部品牌色线 ──
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: brand, space: 0 } },
      children: [],
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: { name: "PingFang SC" }, size: 21, color: "333333" },
          paragraph: { spacing: { line: 320 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
