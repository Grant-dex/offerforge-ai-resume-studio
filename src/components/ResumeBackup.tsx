import { Download, FileJson, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { getResumeTemplate } from "../data/resumeTemplates";
import type { ResumeSnapshot } from "../utils/draftLibrary";
import { createResumeBackup, makeImportedSnapshot, MAX_BACKUP_BYTES, parseResumeBackup, resumeBackupFilename, type ParsedResumeBackup } from "../utils/resumeBackup";
import { Modal } from "./Modal";
import { showToast } from "./Toast";

export function ResumeBackup({ snapshot, onImport }: { snapshot: ResumeSnapshot; onImport: (snapshot: ResumeSnapshot) => boolean }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const importing = useRef(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ filename: string; backup: ParsedResumeBackup } | null>(null);
  useEffect(() => {
    request.current += 1;
    setPending(null); setError(""); setReading(false);
    return () => { request.current += 1; };
  }, [snapshot.resume.id]);

  const download = () => {
    setError("");
    try {
      const file = new Blob([createResumeBackup(snapshot)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = resumeBackupFilename(snapshot.resume.title);
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      showToast("已开始下载备份，可在其他设备导入继续编辑。", "success");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "备份下载失败，请重试。"); }
  };
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const current = ++request.current;
    setError(""); setPending(null); setReading(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("备份文件超过 5 MB，请选择较小的 JSON 备份。");
      const backup = parseResumeBackup(await file.text());
      if (current !== request.current) return;
      setPending({ filename: file.name, backup });
    } catch (cause) {
      if (current === request.current) setError(cause instanceof Error ? cause.message : "无法读取该文件，请重新选择。");
    } finally { if (current === request.current) setReading(false); }
  };
  const importBackup = () => {
    if (!pending || importing.current) return;
    importing.current = true;
    setError("");
    try {
      if (!onImport(makeImportedSnapshot(pending.backup.snapshot))) {
        setError("尚未完成导入，请检查本地保存提示后重试。备份文件和现有简历仍然保留。");
        return;
      }
      setPending(null);
      showToast("已导入为独立草稿，可以继续编辑。", "success");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "导入失败，请重试。"); }
    finally { importing.current = false; }
  };

  return <section aria-label="简历备份与恢复" className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800"><FileJson size={16} />备份与恢复</h3>
    <p className="mt-2 text-xs leading-6 text-neutral-500">下载当前简历及模板，在其他设备导入后可继续编辑。文件仅在本机处理。</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={download} className="workspace-button flex-1"><Download size={14} />下载备份</button>
      <button type="button" disabled={reading} onClick={() => inputRef.current?.click()} className="workspace-button flex-1"><Upload size={14} />{reading ? "读取中…" : "导入备份"}</button>
      <input ref={inputRef} id={inputId} type="file" accept=".json,application/json" onChange={readFile} aria-label="选择简历 JSON 备份文件" className="hidden" />
    </div>
    <p className="mt-2 text-[11px] leading-5 text-neutral-500">备份包含联系方式等简历信息，请妥善保存。仅支持 OfferForge JSON 文件，最大 5 MB。</p>
    {error && !pending && <p role="alert" className="mt-3 text-xs leading-6 text-amber-800">{error}</p>}
    <Modal open={!!pending} title="导入简历备份" onClose={() => { setPending(null); setError(""); }}>
      {pending && <div className="space-y-4 text-sm text-neutral-600">
        <p className="leading-6">确认后将新增一份独立草稿，现有简历会保留。</p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="break-words font-semibold text-neutral-800">{pending.backup.snapshot.resume.title || "未命名简历"}</p>
          <p className="mt-1 break-all text-xs leading-5 text-neutral-500">{pending.filename}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs leading-5">
            <dt>模板</dt><dd>{getResumeTemplate(pending.backup.snapshot.template).name}</dd>
            <dt>内容</dt><dd>{pending.backup.snapshot.resume.work.length} 段工作 · {pending.backup.snapshot.resume.projects.length} 个项目 · {pending.backup.snapshot.resume.skills.length} 项技能</dd>
            <dt>备份时间</dt><dd>{new Date(pending.backup.exportedAt).toLocaleString("zh-CN")}</dd>
          </dl>
        </div>
        {pending.backup.avatarRemoved && <p className="text-xs leading-6 text-amber-800">该文件包含外部或不支持的头像，导入时会移除。你可以在基本信息中重新上传。</p>}
        {error && <p role="alert" className="text-xs leading-6 text-amber-800">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="workspace-button" onClick={() => { setPending(null); setError(""); }}>取消</button>
          <button type="button" className="workspace-button primary" onClick={importBackup}>导入为新草稿</button>
        </div>
      </div>}
    </Modal>
  </section>;
}
