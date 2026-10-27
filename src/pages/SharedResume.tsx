import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ResumeDocument } from "../components/LivePreview";
import type { ResumeData, TemplateKey } from "../types/resume";

export function SharedResumePage() {
  const location = useLocation();
  const shared = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      const encoded = params.get("data");
      if (!encoded) return null;
      const resume = JSON.parse(decodeURIComponent(atob(encoded))) as ResumeData;
      if (!resume.personal || !resume.education || !Array.isArray(resume.work) || !Array.isArray(resume.projects) || !Array.isArray(resume.skills)) return null;
      const selected = params.get('template');
      const template: TemplateKey = selected === 'stack' || selected === 'lead' ? selected : 'focus';
      return {resume,template};
    } catch { return null; }
  }, [location.search]);
  if (!shared) return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6"><div className="text-center"><h1 className="text-xl font-semibold text-neutral-700">无法读取这份简历</h1><p className="mt-2 text-sm text-neutral-500">链接可能不完整，请联系分享者重新获取。</p></div></main>;
  return <main className="min-h-screen bg-neutral-100 p-4 sm:p-8"><div className="mx-auto max-w-[794px]"><ResumeDocument resume={shared.resume} template={shared.template}/></div></main>;
}
