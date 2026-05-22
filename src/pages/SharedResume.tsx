import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { ResumeData } from "../types/resume";

export function SharedResumePage() {
  const location = useLocation();

  const resume = useMemo<ResumeData | null>(() => {
    try {
      const params = new URLSearchParams(location.search || location.hash.replace(/^[^?]*\?/, "?"));
      const data = params.get("data");
      if (!data) return null;
      const json = decodeURIComponent(atob(data));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [location]);

  if (!resume) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F6F8FB]">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-400">链接已失效</p>
          <p className="mt-2 text-sm text-slate-400">该分享链接已过期或无效，请联系分享者重新获取。</p>
        </div>
      </div>
    );
  }

  const { personal, skills, work, projects, education } = resume;

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-8">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-10 shadow-soft print:shadow-none">
        {/* Header */}
        <section className="mb-7">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[2rem] font-black tracking-[0.03em] text-ink">
                {personal.name || "未命名"}
              </h1>
              <p className="mt-2 text-base font-bold text-brand-500">{personal.role}</p>
            </div>
            {personal.avatar && (
              <img
                src={personal.avatar}
                alt="头像"
                className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {[personal.email, personal.phone, personal.city].filter(Boolean).map((item, i, arr) => (
              <span key={i}>
                {item}
                {i < arr.length - 1 && <span className="mx-1 text-slate-300">|</span>}
              </span>
            ))}
          </div>
        </section>

        {/* Summary */}
        {personal.summary && (
          <section className="border-t border-slate-100 py-5">
            <p className="text-sm leading-7 text-slate-600">{personal.summary}</p>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="border-t border-slate-100 py-5">
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-brand-500">技能</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {work.length > 0 && work.some((w) => w.company || w.bullets.length > 0) && (
          <section className="border-t border-slate-100 py-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-brand-500">工作经历</h3>
            {work.map((item) => (
              <div key={item.id} className="mb-4 last:mb-0">
                <p className="text-sm font-bold text-ink">{item.company}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {item.title}{item.startDate ? ` · ${item.startDate}` : ""}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && projects.some((p) => p.name) && (
          <section className="border-t border-slate-100 py-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-brand-500">项目经历</h3>
            {projects.map((project) => (
              <div key={project.id} className="mb-4 last:mb-0">
                <p className="text-sm font-bold text-ink">{project.name}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {project.role}{project.startDate ? ` · ${project.startDate} ~ ${project.endDate}` : ""}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {project.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {(education.school || education.degree) && (
          <section className="border-t border-slate-100 py-5">
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-brand-500">教育背景</h3>
            <p className="text-sm font-bold text-ink">{education.school}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {[education.degree, education.major, education.years].filter(Boolean).join(" · ")}
            </p>
            {education.description && (
              <ul className="mt-3 space-y-1.5">
                {education.description.split("\n").filter(Boolean).map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
