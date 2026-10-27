import { useState } from "react";
import { CheckCircle2, CircleAlert, Download, FileText, Link2, Loader2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useNavigate } from "react-router-dom";
import { useResumeStore } from "../store/resumeStore";
import { showToast } from "../components/Toast";
import { TemplatePicker } from "../components/TemplatePicker";

export function PreviewExportPage() {
  const { resume, template } = useResumeStore(useShallow((state) => ({ resume: state.resume, template: state.template })));
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"pdf" | "word" | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const isLocalPreview = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const contactsComplete = !!(resume.personal.name.trim() && resume.personal.phone.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.personal.email));
  const invalidWorkDates = resume.work.some((item) => item.startDate && item.endDate && /^\d{4}-/.test(item.endDate) && item.startDate > item.endDate);
  const invalidProjectDates = resume.projects.some((item) => item.startDate && item.endDate && /^\d{4}-/.test(item.endDate) && item.startDate > item.endDate);
  const hasInvalidDates = invalidWorkDates || invalidProjectDates;
  const download = async (format: "pdf" | "word") => {
    if (busy) return;
    setBusy(format);
    const name = resume.personal.name.trim() || "我的";
    try {
      if (format === "pdf") {
        const { exportResumePdf } = await import("../utils/pdf");
        await exportResumePdf(`${name}_简历.pdf`);
      } else {
        const { exportResumeWord } = await import("../utils/exportWord");
        await exportResumeWord(resume, `${name}_简历.docx`, template);
        showToast("Word 导出成功", "success");
      }
    } catch (error) {
      showToast(`导出失败：${error instanceof Error ? error.message : "请重试"}`, "error");
    } finally { setBusy(null); }
  };
  const share = async () => {
    const shared = { ...resume, personal: { ...resume.personal, email: "", phone: "" } };
    const params = new URLSearchParams({ data: btoa(encodeURIComponent(JSON.stringify(shared))), template });
    const url = `${window.location.origin}${window.location.pathname}#/shared?${params.toString()}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      showToast("分享链接已复制，已隐藏电话与邮箱", "success");
    } catch {
      showToast("请在下方选中并复制分享链接", "info");
    }
  };
  return (
    <div className="min-w-0 space-y-6">
      <div><span className="text-[11px] tracking-[0.12em] text-neutral-400">最后一步</span><h1 className="mt-2 text-xl font-semibold text-neutral-900">检查与导出</h1><p className="mt-2 text-sm leading-6 text-neutral-500">确认细节，让每一次投递更从容。</p></div>
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">投递前检查</h2>
        <div className="divide-y divide-neutral-100">
          <CheckRow complete={contactsComplete} title="联系信息" description={contactsComplete ? "姓名、电话、邮箱已填写，请再核对一遍。" : "请补全姓名、电话与有效的邮箱。"} action={() => navigate("/basic")} />
          <CheckRow complete={!hasInvalidDates} title="经历时间" description={hasInvalidDates ? "部分结束时间早于开始时间，请修正。" : "未发现起止时间倒置，请确认真实日期。"} action={() => navigate(invalidProjectDates && !invalidWorkDates ? "/projects" : "/work")} />
          <div className="flex gap-3 py-3"><CircleAlert size={16} className="mt-0.5 shrink-0 text-neutral-400" /><div><h3 className="text-xs font-medium text-neutral-700">内容与排版</h3><p className="mt-1 text-xs leading-5 text-neutral-500">替换示例经历，核对职责与成果；打开导出文件，检查分页、头像和长段落。</p></div></div>
        </div>
      </section>
      <TemplatePicker expanded />
      <section className="border-t border-neutral-200 pt-5">
        <h2 className="text-sm font-semibold text-neutral-800">选择文件格式</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" disabled={!!busy} onClick={() => void download("pdf")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3 py-3 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50">{busy === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}导出 PDF</button>
          <button type="button" disabled={!!busy} onClick={() => void download("word")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">{busy === "word" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}导出 Word</button>
        </div>
        <p className="mt-3 text-xs leading-5 text-neutral-500">PDF 保留视觉排版，为图片版；需要可编辑文字时请选择 Word。</p>
        <button type="button" onClick={() => void share()} className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"><Link2 size={15} />复制简历分享链接</button>
        <p className="mt-2 text-[11px] leading-5 text-neutral-400">分享包含当前简历内容，默认隐藏电话与邮箱。更新内容后需重新复制链接。</p>
        {isLocalPreview && <p className="mt-2 text-xs leading-5 text-neutral-600">当前为本机预览，链接只能在这台电脑打开；网站上线后可分享给他人。</p>}
        {shareUrl && <label className="mt-3 block text-xs text-neutral-500">分享链接<input aria-label="简历分享链接" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600" /></label>}
      </section>
    </div>
  );
}

function CheckRow({ complete, title, description, action }: { complete: boolean; title: string; description: string; action: () => void }) {
  const Icon = complete ? CheckCircle2 : CircleAlert;
  return <div className="flex items-start gap-3 py-3"><Icon size={16} className={`mt-0.5 shrink-0 ${complete ? "text-neutral-600" : "text-neutral-800"}`} /><div className="min-w-0 flex-1"><h3 className="text-xs font-medium text-neutral-700">{title}</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p></div><button type="button" onClick={action} className="shrink-0 text-xs text-neutral-500 underline underline-offset-4">检查</button></div>;
}
