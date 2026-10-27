import { BookOpen, BriefcaseBusiness, FileCheck2, FileText, GraduationCap, Menu, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AIAnalysisPanel } from "./components/AIAnalysisPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LivePreview } from "./components/LivePreview";
import { TemplatePicker } from "./components/TemplatePicker";
import { Sidebar } from "./components/Sidebar";
import { ToastContainer } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { WritingGuide } from "./components/WritingGuide";
import { BasicInfo } from "./pages/BasicInfo";
import { PreviewExportPage } from "./pages/PreviewExport";
import { ProjectExperiencePage } from "./pages/ProjectExperience";
import { SharedResumePage } from "./pages/SharedResume";
import { SkillsEducationPage } from "./pages/SkillsEducation";
import { WorkExperiencePage } from "./pages/WorkExperience";
import { useResumeStore } from "./store/resumeStore";
import { getResumeChecks } from "./utils/resumeChecks";

const sections = [
  { path: "/basic", label: "基本信息", icon: UserRound },
  { path: "/work", label: "工作经历", icon: BriefcaseBusiness },
  { path: "/projects", label: "项目经历", icon: FileText },
  { path: "/skills", label: "教育与技能", icon: GraduationCap },
  { path: "/export", label: "预览与导出", icon: FileCheck2 }
];
type ToolTab = "edit" | "guide" | "ai";

function MainEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const resume = useResumeStore(state => state.resume);
  const [tab, setTab] = useState<ToolTab>("edit");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [managerOpen, setManagerOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const toolsRef = useRef<HTMLElement>(null);
  const managerButton = useRef<HTMLButtonElement>(null);
  const managerPanel = useRef<HTMLElement>(null);
  const checks = getResumeChecks(resume);

  useEffect(() => { setTab("edit"); setMobileView("edit"); toolsRef.current?.scrollTo({ top: 0 }); }, [location.pathname, location.key]);
  useEffect(() => {
    const open = () => { setTab("edit"); setMobileView("edit"); };
    window.addEventListener("offerforge:open-editor", open);
    return () => window.removeEventListener("offerforge:open-editor", open);
  }, []);
  useEffect(() => {
    if (!managerOpen) return;
    const panel = managerPanel.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      // Nested account dialogs own their keyboard navigation.
      if ((event.target as HTMLElement).closest('[role="dialog"]') !== panel) return;
      if (event.key === "Escape") { event.stopPropagation(); setManagerOpen(false); }
      if (event.key === "Tab") {
        const elements = focusable(), first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    panel?.addEventListener("keydown", onKey);
    return () => { panel?.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; managerButton.current?.focus(); };
  }, [managerOpen]);

  return (
    <div className="editor-app">
      <TopBar onManage={() => setManagerOpen(true)} onCheck={() => setChecksOpen(!checksOpen)} checksOpen={checksOpen} onExport={() => navigate('/export')} managerButtonRef={managerButton} />
      <div className="workspace-toolbar">
        <TemplatePicker />
        <span className="workflow-caption">完善经历 <span aria-hidden="true">→</span> 针对岗位优化 <span aria-hidden="true">→</span> 检查与导出</span>
      </div>
      {checksOpen && <section className="preflight-panel" aria-label="投递前检查">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">投递前检查</h2><p className="mt-1 text-xs text-neutral-500">检查可填写项，最终内容和事实由你确认。</p></div><button className="icon-button" aria-label="关闭检查" onClick={() => setChecksOpen(false)}><X size={18}/></button></div>
        <div className="preflight-grid">{checks.map(check => <button key={check.id} className="preflight-item" onClick={() => { navigate(check.path); setChecksOpen(false); }}><span className="font-medium">{check.title}</span><span>{check.detail}</span><span className="text-xs text-neutral-500">{check.action} →</span></button>)}</div>
      </section>}
      <div className="mobile-view-switch" role="group" aria-label="工作区视图">
        <button aria-pressed={mobileView === "edit"} onClick={() => setMobileView("edit")}>编辑简历</button><button aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")}>查看预览</button>
      </div>
      <div className="workspace-grid" data-mobile-view={mobileView}>
        <nav className="section-outline" aria-label="简历章节"><p className="outline-caption">内容大纲</p>{sections.map(({path,label,icon:Icon}) => <NavLink key={path} to={path} className={({isActive}) => `outline-link ${isActive ? "active" : ""}`}><Icon size={16}/><span>{label}</span></NavLink>)}<div className="outline-tip"><BookOpen size={16}/><p>先写真实经历，再用参考与建议完善表达。</p></div></nav>
        <main className="preview-workspace" aria-label="实时简历预览"><LivePreview activeSection={location.pathname.slice(1)} /></main>
        <aside ref={toolsRef} className="editor-tools" aria-label="简历编辑与辅助">
          <div className="editor-tool-tabs" role="tablist" aria-label="写作工具">{([{key:"edit",label:"编辑内容",icon:FileText},{key:"guide",label:"写作参考",icon:BookOpen},{key:"ai",label:"岗位建议",icon:Sparkles}] as const).map(item=><button id={`tool-tab-${item.key}`} role="tab" aria-selected={tab===item.key} aria-controls={`tool-panel-${item.key}`} key={item.key} onClick={()=>setTab(item.key)}><item.icon size={14}/>{item.label}</button>)}</div>
          <div role="tabpanel" id="tool-panel-edit" aria-labelledby="tool-tab-edit" hidden={tab!=="edit"} className="editor-form-panel"><ErrorBoundary><Routes><Route path="/" element={<Navigate to="/basic" replace/>}/><Route path="/basic" element={<BasicInfo/>}/><Route path="/work" element={<WorkExperiencePage/>}/><Route path="/projects" element={<ProjectExperiencePage/>}/><Route path="/skills" element={<SkillsEducationPage/>}/><Route path="/export" element={<PreviewExportPage/>}/><Route path="*" element={<Navigate to="/basic" replace/>}/></Routes></ErrorBoundary></div>
          <div role="tabpanel" id="tool-panel-guide" aria-labelledby="tool-tab-guide" hidden={tab!=="guide"} className="editor-form-panel"><WritingGuide/></div>
          <div role="tabpanel" id="tool-panel-ai" aria-labelledby="tool-tab-ai" hidden={tab!=="ai"} className="editor-form-panel"><AIAnalysisPanel/></div>
        </aside>
      </div>
      <div className="resume-manager" hidden={!managerOpen}>
        <button className="manager-backdrop" aria-label="关闭我的简历" onClick={()=>setManagerOpen(false)}/>
        <section ref={managerPanel} className="manager-drawer" role="dialog" aria-modal="true" aria-label="我的简历与账户"><div className="manager-heading"><span className="flex items-center gap-2 font-semibold"><Menu size={17}/>我的简历与账户</span><button className="icon-button" aria-label="关闭我的简历与账户" onClick={()=>setManagerOpen(false)}><X size={18}/></button></div><Sidebar/></section>
      </div>
    </div>
  );
}
export function App() { return <ErrorBoundary><ToastContainer/><Routes><Route path="/shared" element={<SharedResumePage/>}/><Route path="/*" element={<MainEditor/>}/></Routes></ErrorBoundary>; }
