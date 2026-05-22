import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AIAnalysisPanel } from "./components/AIAnalysisPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LivePreview } from "./components/LivePreview";
import { Sidebar } from "./components/Sidebar";
import { StepTabs } from "./components/StepTabs";
import { ToastContainer } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { BasicInfo } from "./pages/BasicInfo";
import { PreviewExportPage } from "./pages/PreviewExport";
import { ProjectExperiencePage } from "./pages/ProjectExperience";
import { SharedResumePage } from "./pages/SharedResume";
import { SkillsEducationPage } from "./pages/SkillsEducation";
import { WorkExperiencePage } from "./pages/WorkExperience";

function MainEditor() {
  const location = useLocation();
  const [editorOpen, setEditorOpen] = useState(true);
  const [previewHeight, setPreviewHeight] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("offerforge-preview-height");
      return stored ? parseInt(stored) : 420;
    } catch { return 420; }
  });
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(420);
  const mainRef = useRef<HTMLElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = previewHeight;
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - dragStartY.current;
      const mainHeight = mainRef.current?.clientHeight ?? window.innerHeight;
      const maxHeight = mainHeight - 260;
      const newHeight = Math.max(200, Math.min(maxHeight, dragStartHeight.current + delta));
      setPreviewHeight(newHeight);
    };

    const handleMouseUp = () => {
      setDragging(false);
      setPreviewHeight((h) => {
        try { localStorage.setItem("offerforge-preview-height", String(h)); } catch { /* ignore */ }
        return h;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div className={`h-screen overflow-hidden bg-[#F6F7FB] text-ink ${dragging ? "select-none cursor-row-resize" : ""}`}>
      <div className="flex h-screen min-w-[1280px]">
        <Sidebar />

        {/* 中间主工作区 */}
        <main ref={mainRef} className="flex h-screen flex-1 flex-col overflow-hidden px-6 pt-6">
          <TopBar />

          {/* 实时预览区 — 白色悬浮卡片 */}
          <div
            style={{ height: editorOpen ? previewHeight : undefined }}
            className={`mx-auto w-full max-w-[1100px] shrink-0 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_8px_32px_rgba(0,0,0,0.04)] ${!editorOpen ? "flex-1" : ""}`}
          >
            <LivePreview />
          </div>

          {/* 拖拽手柄 — 仅编辑区展开时显示 */}
          {editorOpen && (
            <div
              className={`group relative flex h-3 shrink-0 cursor-row-resize items-center justify-center ${
                dragging ? "cursor-row-resize" : ""
              }`}
              onMouseDown={handleMouseDown}
            >
              <div
                className={`h-0.5 rounded-full transition-all duration-200 ${
                  dragging
                    ? "w-20 bg-[#6C63FF]"
                    : "w-0 bg-transparent group-hover:w-12 group-hover:bg-slate-300"
                }`}
              />
            </div>
          )}

          {/* 折叠编辑条 — 毛玻璃胶囊 */}
          <div className="relative flex shrink-0 items-center justify-center py-2">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
            <button
              onClick={() => setEditorOpen(!editorOpen)}
              className="group relative z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm backdrop-blur transition hover:border-[#6C63FF]/30 hover:text-[#6C63FF] hover:shadow-md"
            >
              {editorOpen ? "收起编辑区" : "展开编辑区"}
              <ChevronUp size={14} className={`transition-transform duration-200 ${editorOpen ? "" : "rotate-180"}`} />
            </button>
          </div>

          {/* 编辑表单区 — 白色悬浮卡片 */}
          {editorOpen && (
            <div className="mx-auto w-full max-w-[1200px] flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_8px_32px_rgba(0,0,0,0.04)]">
              <StepTabs />
              <div key={location.pathname} className="animate-fadeIn">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Navigate to="/basic" replace />} />
                    <Route path="/basic" element={<BasicInfo />} />
                    <Route path="/work" element={<WorkExperiencePage />} />
                    <Route path="/projects" element={<ProjectExperiencePage />} />
                    <Route path="/skills" element={<SkillsEducationPage />} />
                    <Route path="/export" element={<PreviewExportPage />} />
                  </Routes>
                </ErrorBoundary>
              </div>
            </div>
          )}
        </main>

        {/* 右侧 AI 分析面板 */}
        <AIAnalysisPanel />
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Routes>
        <Route path="/shared" element={<SharedResumePage />} />
        <Route path="/*" element={<MainEditor />} />
      </Routes>
    </ErrorBoundary>
  );
}
