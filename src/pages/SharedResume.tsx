import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ResumeDocument } from "../components/LivePreview";
import { readResumeShare } from "../utils/resumeShare";

export function SharedResumePage() {
  const location = useLocation();
  const shared = useMemo(() => readResumeShare(location.search), [location.search]);
  if (!shared) return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6"><div className="text-center"><h1 className="text-xl font-semibold text-neutral-700">无法读取这份简历</h1><p className="mt-2 text-sm text-neutral-500">链接可能不完整或内容格式不正确，请联系分享者重新获取。</p><a href="#/basic" className="mt-5 inline-block text-sm text-neutral-700 underline underline-offset-4">打开简历编辑器</a></div></main>;
  return <main className="resume-responsive min-h-screen bg-neutral-100 p-4 sm:p-8"><div className="mx-auto max-w-[794px]"><ResumeDocument resume={shared.resume} template={shared.template} sectionOrder={shared.sectionOrder}/></div></main>;
}
