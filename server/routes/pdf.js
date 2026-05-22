const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

function buildDocument({ headMarkup, bodyMarkup }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${headMarkup || ""}
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f8fafc;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        display: flex;
        justify-content: center;
        box-sizing: border-box;
      }

      *, *::before, *::after {
        box-sizing: inherit;
      }

      .pdf-export-shell {
        width: 100%;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 12px 0 20px;
        background: #f8fafc;
      }

      .pdf-export-shell .resume-paper {
        width: 810px !important;
        max-width: 810px !important;
        margin: 0 auto !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body>
    <div class="pdf-export-shell">${bodyMarkup || ""}</div>
  </body>
</html>`;
}

router.post("/export", async (req, res) => {
  const { headMarkup, bodyMarkup, fileName } = req.body || {};

  if (!bodyMarkup || typeof bodyMarkup !== "string") {
    return res.status(400).json({ error: "缺少简历 HTML 内容" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 2048, deviceScaleFactor: 3 });
    await page.setContent(buildDocument({ headMarkup, bodyMarkup }), {
      waitUntil: "networkidle0"
    });

    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const images = Array.from(document.images);
      await Promise.all(
        images.map(async (image) => {
          if (image.complete) return;
          await new Promise((resolve) => {
            const done = () => resolve();
            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      scale: 1.06,
      margin: {
        top: "8mm",
        right: "8mm",
        bottom: "8mm",
        left: "8mm"
      }
    });

    const safeFileName =
      typeof fileName === "string" && fileName.trim()
        ? fileName.trim()
        : "resume.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(safeFileName)}"`
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "PDF 导出失败"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

module.exports = router;
