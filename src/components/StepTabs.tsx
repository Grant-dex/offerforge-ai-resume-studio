import { Briefcase, Eye, FileText, GraduationCap, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useT } from "../i18n";

const stepKeys = [
  { index: 1, key: "step.basic" as const, path: "/basic", icon: UserRound },
  { index: 2, key: "step.work" as const, path: "/work", icon: Briefcase },
  { index: 3, key: "step.projects" as const, path: "/projects", icon: FileText },
  { index: 4, key: "step.skills" as const, path: "/skills", icon: GraduationCap },
  { index: 5, key: "step.export" as const, path: "/export", icon: Eye }
];

export function StepTabs() {
  const { t } = useT();
  return (
    <nav className="mb-8 flex gap-1 rounded-xl bg-slate-50 p-1">
      {stepKeys.map((step) => {
        const Icon = step.icon;
        return (
          <NavLink
            key={step.path}
            to={step.path}
            className={({ isActive }) =>
              [
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-[#6C63FF] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                  : "text-slate-400 hover:text-slate-600"
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-[#6C63FF]" : "text-slate-300"} />
                <span className="hidden sm:inline leading-none translate-y-[1px]">{t(step.key)}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
