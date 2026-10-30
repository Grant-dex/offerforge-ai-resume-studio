import { AlertCircle, Check, Download, FolderOpen, ListChecks } from "lucide-react";
import type { RefObject } from "react";
import { useResumeStore } from "../store/resumeStore";

interface TopBarProps {
  onManage: () => void;
  onCheck: () => void;
  onExport: () => void;
  checksOpen: boolean;
  managerButtonRef?: RefObject<HTMLButtonElement | null>;
  saveError?: string | null;
}
export function TopBar({ onManage, onCheck, onExport, checksOpen, managerButtonRef, saveError }: TopBarProps) {
  const title = useResumeStore(state=>state.resume.title);
  const lastTouched = useResumeStore(state=>state.lastTouched);
  return <header className="workspace-topbar"><div className="workspace-brand"><span className="wordmark">OfferForge</span><span className="brand-divider"/><div className="min-w-0"><p className="resume-title" title={title}>{title || "未命名简历"}</p><p className="save-status" role={saveError ? "alert" : undefined} title={saveError || undefined} style={saveError ? { color: "#b45309" } : undefined}>{saveError ? <><AlertCircle size={12}/>保存未完成，请先导出备份</> : <><Check size={12}/>已保存在此浏览器 · {lastTouched}</>}</p></div></div><div className="header-actions"><button ref={managerButtonRef} className="workspace-button" onClick={onManage}><FolderOpen size={16}/><span>我的简历</span></button><button className="workspace-button" onClick={onCheck} aria-expanded={checksOpen}><ListChecks size={16}/><span>投递前检查</span></button><button className="workspace-button primary" onClick={onExport}><Download size={16}/><span>导出简历</span></button></div></header>;
}
