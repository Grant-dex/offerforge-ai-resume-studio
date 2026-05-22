import { ChevronRight, Crown, FileText, Lightbulb, Loader2, LogIn, Palette, Plus, Settings, Sparkles, Trash2, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import { defaultResume } from "../data/defaultResume";
import type { ResumeData } from "../types/resume";
import { useT } from "../i18n";
import { applyTheme, getStoredTheme, getStoredCustomColor, type ThemeColor } from "../utils/theme";
import { calcATSScore } from "../utils/atsScore";
import { sendEmailCode, loginByEmail, saveUser, loadUser, clearUser, type UserInfo } from "../utils/auth";
import { ConfirmDialog, PromptDialog } from "./Dialogs";
import { Modal } from "./Modal";
import { showToast } from "./Toast";

const DAILY_TIPS = [
  "用数字量化成果，如'提升销售额30%'比'提升销售额'更有说服力",
  "简历中的关键词要与目标岗位JD高度匹配，ATS系统会优先筛选",
  "每段工作经历控制在3-5个要点，聚焦最核心的成就",
  "项目经历用STAR法则描述：情境、任务、行动、结果",
  "简历不要超过一页A4纸，HR平均只花6秒浏览一份简历",
  "使用行业专业术语，但避免过于生僻的缩写",
  "简历命名格式：姓名_岗位_工作年限.pdf，方便HR归档",
  "定期更新简历，即使不找工作也能保持对自身成长的感知",
  "在LinkedIn上保持与简历一致的经历描述，增加可信度",
  "简历开头用一句话总结核心竞争力，形成强烈的第一印象"
];

interface JobApp {
  id: string;
  company: string;
  role: string;
  status: "待回复" | "面试中" | "已拒绝";
  date: string;
}

interface RecentEntry {
  id: string;
  title: string;
  lastEdited: string;
}

const STATUS_LABELS: Record<string, string> = {
  "待回复": "sidebar.statusPending",
  "面试中": "sidebar.statusInterview",
  "已拒绝": "sidebar.statusRejected"
};

const STATUS_STYLE: Record<JobApp["status"], string> = {
  "待回复": "bg-amber-100 text-amber-700 border border-amber-200",
  "面试中": "bg-blue-100 text-blue-700 border border-blue-200",
  "已拒绝": "bg-slate-100 text-slate-500 border border-slate-200"
};

function loadJobs(): JobApp[] {
  try {
    return JSON.parse(localStorage.getItem("offerforge-jobs") || "[]");
  } catch { return []; }
}

function saveJobs(jobs: JobApp[]) {
  localStorage.setItem("offerforge-jobs", JSON.stringify(jobs));
}

function loadRecents(): RecentEntry[] {
  try {
    return (JSON.parse(localStorage.getItem("offerforge-recents") || "[]") as Partial<RecentEntry>[])
      .map((entry) => ({
        id: entry.id || `legacy-${entry.title || Date.now()}`,
        title: entry.title || "未命名简历",
        lastEdited: entry.lastEdited || "--:--"
      }));
  } catch { return []; }
}

function saveRecents(recents: RecentEntry[]) {
  localStorage.setItem("offerforge-recents", JSON.stringify(recents));
}

function saveResumeSnapshot(resume: ResumeData) {
  localStorage.setItem(`offerforge-snapshot-${resume.id}`, JSON.stringify(resume));
}

function loadResumeSnapshot(id: string): ResumeData | null {
  try {
    return JSON.parse(localStorage.getItem(`offerforge-snapshot-${id}`) || "null");
  } catch { return null; }
}

function removeResumeSnapshot(id: string) {
  localStorage.removeItem(`offerforge-snapshot-${id}`);
}

function makeResumeDraft(index: number): ResumeData {
  const nextId = `resume-${Date.now()}`;
  const draft: ResumeData = {
    ...JSON.parse(JSON.stringify(defaultResume)),
    id: nextId,
    title: `新简历 ${index}`,
    subtitle: "请完善目标岗位信息",
    lastSaved: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    personal: {
      ...JSON.parse(JSON.stringify(defaultResume.personal)),
      resumeTitle: `新简历 ${index}`,
      name: "",
      role: "",
      seniority: "",
      email: "",
      phone: "",
      city: "",
      summary: "",
      avatar: ""
    },
    skills: [],
    work: [],
    projects: [],
    education: {
      ...JSON.parse(JSON.stringify(defaultResume.education)),
      school: "",
      major: "",
      degree: "",
      years: "",
      description: "",
      tags: []
    }
  };
  draft.atsScore = calcATSScore(draft);
  return draft;
}

function calcCompleteness(resume: ResumeData): number {
  let score = 0;
  const p = resume.personal;
  if (p.name?.trim()) score += 10;
  if (p.phone?.trim()) score += 10;
  if (p.email?.trim()) score += 10;
  if (p.city?.trim()) score += 5;
  if (p.role?.trim()) score += 10;
  if ((p.summary?.length ?? 0) > 10) score += 15;
  if (resume.skills.length >= 3) score += 15;
  if (resume.work.length > 0 && resume.work[0].bullets.length > 0) score += 10;
  if (resume.education.school?.trim()) score += 10;
  if (resume.projects.length > 0) score += 5;
  return score;
}

export function Sidebar() {
  const { t, locale, setLocale } = useT();
  const resume = useResumeStore((state) => state.resume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);
  const [proOpen, setProOpen] = useState(false);
  const [jobs, setJobs] = useState<JobApp[]>(loadJobs);
  const [recents, setRecents] = useState<RecentEntry[]>(loadRecents);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  // Dialog states
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newResumeOpen, setNewResumeOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<RecentEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Settings states
  const [themeColor, setThemeColor] = useState<ThemeColor>(getStoredTheme);
  const [customColor, setCustomColor] = useState<string>(getStoredCustomColor);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [aiModel, setAiModel] = useState<string>(() => {
    try { return localStorage.getItem("offerforge-ai-model") || "flash"; } catch { return "flash"; }
  });
  const [proPlan, setProPlan] = useState<"monthly" | "yearly">("yearly");
  const [userInfo, setUserInfo] = useState<(UserInfo & { token: string }) | null>(() => loadUser());
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginCountdown, setLoginCountdown] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSendEmailCode = async () => {
    setLoginError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) { setLoginError('请输入正确的邮箱'); return; }
    try {
      const returnedCode = await sendEmailCode(loginEmail);
      setLoginCountdown(60);
      const t = setInterval(() => setLoginCountdown((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
      if (returnedCode) {
        showToast(`验证码：${returnedCode}（学习模式，验证码直接显示）`, "success");
      } else {
        showToast("验证码已发送至邮箱", "success");
      }
    } catch (e: any) { setLoginError(e.message); }
  };

  const handleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      if (!loginEmail || !loginCode) { setLoginError('请填写邮箱和验证码'); setLoginLoading(false); return; }
      const result = await loginByEmail(loginEmail, loginCode);
      saveUser(result.token, result.user);
      setUserInfo({ ...result.user, token: result.token });
      showToast(`欢迎，${result.user.nickname}！`, "success");
      setLoginOpen(false);
      resetLoginForm();
    } catch (e: any) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const resetLoginForm = () => {
    setLoginEmail("");
    setLoginCode("");
    setLoginCountdown(0);
    setLoginError("");
  };

  const completeness = calcCompleteness(resume);
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const tipKey = `tip.${(dayOfYear % DAILY_TIPS.length) + 1}`;

  useEffect(() => {
    const entry: RecentEntry = {
      id: resume.id,
      title: resume.title,
      lastEdited: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    };

    setRecents((current) => {
      const updated = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 5);
      saveRecents(updated);
      return updated;
    });

    saveResumeSnapshot(resume);
  }, [resume]);

  const addJob = () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    const job: JobApp = {
      id: Date.now().toString(),
      company: newCompany.trim(),
      role: newRole.trim(),
      status: "待回复",
      date: new Date().toLocaleDateString("zh-CN")
    };
    const updated = [job, ...jobs];
    setJobs(updated);
    saveJobs(updated);
    setNewCompany("");
    setNewRole("");
    setAddJobOpen(false);
  };

  const cycleStatus = (id: string) => {
    const order: JobApp["status"][] = ["待回复", "面试中", "已拒绝"];
    const updated = jobs.map((j) => {
      if (j.id !== id) return j;
      const idx = order.indexOf(j.status);
      return { ...j, status: order[(idx + 1) % order.length] };
    });
    setJobs(updated);
    saveJobs(updated);
  };

  const removeJob = (id: string) => {
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    saveJobs(updated);
  };

  const switchToRecent = (entry: RecentEntry) => {
    const snap = loadResumeSnapshot(entry.id);
    if (snap) {
      setSwitchTarget(entry);
    }
  };

  const confirmSwitch = () => {
    if (!switchTarget) return;
    const snap = loadResumeSnapshot(switchTarget.id);
    if (snap) {
      useResumeStore.setState({ resume: { ...snap, atsScore: calcATSScore(snap) }, lastTouched: switchTarget.lastEdited });
      showToast(t("sidebar.switchedTo", { name: switchTarget.title }), "success");
    }
    setSwitchTarget(null);
  };

  const createResume = () => {
    const existingNumbers = recents
      .map((entry) => Number(entry.title.replace("新简历 ", "")))
      .filter((value) => Number.isFinite(value));
    const nextIndex = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : recents.length + 1;
    const draft = makeResumeDraft(nextIndex);
    useResumeStore.setState({ resume: draft, lastTouched: draft.lastSaved });
    setNewResumeOpen(false);
    showToast(t("sidebar.created"), "success");
  };

  const deleteCurrentResume = () => {
    const remaining = recents.filter((entry) => entry.id !== resume.id);
    removeResumeSnapshot(resume.id);
    setRecents(remaining);
    saveRecents(remaining);

    if (remaining.length > 0) {
      const fallback = loadResumeSnapshot(remaining[0].id);
      if (fallback) {
        useResumeStore.setState({ resume: { ...fallback, atsScore: calcATSScore(fallback) }, lastTouched: remaining[0].lastEdited });
      } else {
        const draft = makeResumeDraft(1);
        useResumeStore.setState({ resume: draft, lastTouched: draft.lastSaved });
      }
    } else {
      const draft = makeResumeDraft(1);
      useResumeStore.setState({ resume: draft, lastTouched: draft.lastSaved });
    }

    setDeleteOpen(false);
    showToast(t("sidebar.deleted"), "info");
  };

  return (
    <>
      <aside className="hidden h-screen w-[280px] shrink-0 overflow-y-auto border-r border-slate-100 bg-[#F6F8FB] p-6 lg:block">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-400 text-xl font-black text-white">
            O
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-ink">{t("app.name")}</div>
            <div className="text-xs text-slate-500">{t("app.subtitle")}</div>
          </div>
        </div>

        {/* Section: 我的简历 */}
        <section className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            <span className="text-base font-bold text-slate-700">{t("sidebar.myResume")}</span>
          </div>

          {/* Module 3: Recent resumes */}
          {recents.length > 0 && (
            <div className="mb-3 space-y-1">
              {recents.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    entry.id === resume.id ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                    onClick={() => switchToRecent(entry)}
                  >
                    <span className={`truncate font-medium ${entry.id === resume.id ? "text-brand-700" : "text-slate-700"}`}>{entry.title}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{entry.lastEdited}</span>
                  </button>
                  {recents.length > 1 && (
                    <button
                      className="rounded p-1 text-slate-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      onClick={() => {
                        if (entry.id === resume.id) {
                          setDeleteOpen(true);
                          return;
                        }
                        const updated = recents.filter((item) => item.id !== entry.id);
                        removeResumeSnapshot(entry.id);
                        setRecents(updated);
                        saveRecents(updated);
                        showToast(t("sidebar.deletedEntry", { name: entry.title }), "info");
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Current resume card */}
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-orange-400 p-4 text-white shadow-glow">
            <h3 className="text-base font-bold">{resume.title}</h3>
            <p className="mt-1 text-xs text-white/85">{resume.subtitle}</p>
            <div className="mt-3 flex gap-2">
              <button
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-xs backdrop-blur transition hover:bg-white/25"
                onClick={() => setRenameOpen(true)}
              >
                <FileText size={14} />
                {t("sidebar.rename")}
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-xs backdrop-blur transition hover:bg-white/25"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} />
                {t("sidebar.delete")}
              </button>
            </div>

            {/* Module 1: Completeness */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/90">
                <span>{t("sidebar.completeness")}</span>
                <span className="font-bold">{completeness}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>

          <button
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
            onClick={() => setNewResumeOpen(true)}
          >
            <Plus size={16} />
            {t("sidebar.newResume")}
          </button>

          <div className="my-5 h-px bg-slate-100" />

          {/* Settings */}
          <button
            className="mb-5 flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} />
            {t("sidebar.settings")}
          </button>

          {/* Module 2: Job Tracker */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-slate-700">{t("sidebar.jobTracker")}</span>
              <button
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                onClick={() => setAddJobOpen(true)}
              >
                <Plus size={14} />
                {t("sidebar.add")}
              </button>
            </div>
            {jobs.length === 0 && !addJobOpen && (
              <p className="py-2 text-center text-xs text-slate-400">{t("sidebar.noJobs")}</p>
            )}
            {addJobOpen && (
              <div className="mb-3 space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
                  placeholder={t("sidebar.companyPlaceholder")}
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
                  placeholder={t("sidebar.rolePlaceholder")}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
                    onClick={addJob}
                  >
                    {t("sidebar.confirmAdd")}
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500"
                    onClick={() => { setAddJobOpen(false); setNewCompany(""); setNewRole(""); }}
                  >
                    {t("sidebar.cancel")}
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-[200px] space-y-1.5 overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{job.company}</p>
                    <p className="truncate text-xs text-slate-400">{job.role} · {job.date}</p>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    <button
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[job.status]}`}
                      onClick={() => cycleStatus(job.id)}
                    >
                      {t(STATUS_LABELS[job.status] as any)}
                    </button>
                    <button
                      className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      onClick={() => removeJob(job.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-5 h-px bg-slate-100" />

          {/* Module 4: Daily Tip */}
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-blue-500">{t("sidebar.dailyTip")}</span>
            </div>
            <p className="text-xs leading-5 text-slate-600">{t(tipKey as any)}</p>
          </div>

          {/* Pro Upgrade */}
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-amber-500" />
              <h4 className="text-sm font-bold text-amber-700">{t("sidebar.upgradePro")}</h4>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
              <li className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-amber-400" />
                {t("sidebar.proFeature1")}
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-amber-400" />
                {t("sidebar.proFeature2")}
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-amber-400" />
                {t("sidebar.proFeature3")}
              </li>
            </ul>
            <button
              className="mt-4 h-11 w-full rounded-xl border border-amber-300 bg-white text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
              onClick={() => { if (userInfo) { setProOpen(true); } else { setLoginOpen(true); } }}
            >
              {t("sidebar.upgradeNow")}
            </button>
          </div>

          {/* Login State Block */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            {userInfo ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                    {userInfo.nickname.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{userInfo.nickname}</p>
                    <p className="text-xs text-emerald-600">已登录</p>
                  </div>
                </div>
                <button
                  className="mt-3 h-9 w-full rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  onClick={() => {
                    clearUser();
                    setUserInfo(null);
                    showToast("已退出登录", "info");
                  }}
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">未登录</p>
                    <p className="text-xs text-slate-400">同步数据到云端</p>
                  </div>
                </div>
                <button
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-xs font-semibold text-white transition hover:bg-brand-600"
                  onClick={() => setLoginOpen(true)}
                >
                  <LogIn size={14} />
                  点击登录/注册
                </button>
              </div>
            )}
          </div>
        </section>
      </aside>

      {/* Pro Modal */}
      <Modal open={proOpen} onClose={() => setProOpen(false)} title={t("sidebar.proModalTitle")}>
        <div className="space-y-4">
          {/* AI model info */}
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {aiModel === "flash"
              ? "升级后将解锁精准模式（Pro Model）"
              : "您已选择精准模式，升级后立即生效"}
          </div>

          {/* Plan selection */}
          <div className="flex gap-3">
            <button
              className={`flex-1 rounded-xl border p-3 text-left transition ${
                proPlan === "monthly" ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : "border-slate-200 bg-white"
              }`}
              onClick={() => setProPlan("monthly")}
            >
              <p className="text-sm font-bold text-ink">月付</p>
              <p className="mt-1 text-xl font-black text-ink">¥29<span className="text-xs font-normal text-slate-500">/月</span></p>
            </button>
            <button
              className={`flex-1 rounded-xl border p-3 text-left transition relative ${
                proPlan === "yearly" ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : "border-slate-200 bg-white"
              }`}
              onClick={() => setProPlan("yearly")}
            >
              <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">推荐</span>
              <p className="text-sm font-bold text-ink">年付</p>
              <p className="mt-1 text-xl font-black text-ink">¥199<span className="text-xs font-normal text-slate-500">/年</span></p>
              <p className="text-[10px] text-emerald-600 mt-1">节省¥149</p>
            </button>
          </div>

          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("sidebar.proAll1")}</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("sidebar.proAll2")}</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("sidebar.proAll3")}</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("sidebar.proAll4")}</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("sidebar.proAll5")}</li>
          </ul>
          <button
            className="h-11 w-full rounded-xl bg-amber-500 text-sm font-bold text-white transition hover:bg-amber-600"
            onClick={() => {
              const payUrl = `https://pay.yoursite.com/checkout?plan=${proPlan}&model=${aiModel}`;
              window.open(payUrl, "_blank");
              showToast(t("sidebar.subThanks"), "success");
              setProOpen(false);
            }}
          >
            {t("sidebar.confirmUpgrade")}
          </button>
          <p className="text-center text-xs text-slate-400">{t("sidebar.securePayment")}</p>
        </div>
      </Modal>

      {/* Rename Dialog */}
      <PromptDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => { updatePersonal({ resumeTitle: name }); showToast(t("sidebar.renamed"), "success"); }}
        title={t("sidebar.renameTitle")}
        label={t("sidebar.renameLabel")}
        defaultValue={resume.title}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteCurrentResume}
        title={t("sidebar.deleteTitle")}
        message={t("sidebar.deleteMsg")}
        confirmLabel={t("sidebar.deleteLabel")}
        danger
      />

      {/* New Resume Confirm */}
      <ConfirmDialog
        open={newResumeOpen}
        onClose={() => setNewResumeOpen(false)}
        onConfirm={createResume}
        title={t("sidebar.newTitle")}
        message={t("sidebar.newMsg")}
        confirmLabel={t("sidebar.newLabel")}
      />

      {/* Switch Resume Confirm */}
      <ConfirmDialog
        open={switchTarget !== null}
        onClose={() => setSwitchTarget(null)}
        onConfirm={confirmSwitch}
        title={t("sidebar.switchTitle")}
        message={switchTarget ? t("sidebar.switchMsg", { name: switchTarget.title }) : ""}
        confirmLabel={t("sidebar.switchLabel")}
      />

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t("settings.title")}>
        <div className="space-y-0">
          {/* Language */}
          <div className="py-4">
            <p className="text-sm font-bold text-slate-700">{t("settings.language")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("settings.languageDesc")}</p>
            <div className="mt-3 flex gap-2">
              {(["zh", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    locale === lang
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                  onClick={() => setLocale(lang)}
                >
                  {lang === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Theme Color */}
          <div className="py-4">
            <p className="text-sm font-bold text-slate-700">{t("settings.theme")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("settings.themeDesc")}</p>
            <div className="mt-3 flex items-center gap-2">
              {([
                { key: "orange", color: "#FF5C00", ring: "ring-orange-400" },
                { key: "blue", color: "#3B82F6", ring: "ring-blue-400" },
                { key: "purple", color: "#8B5CF6", ring: "ring-purple-400" },
                { key: "green", color: "#10B981", ring: "ring-emerald-400" },
                { key: "rose", color: "#EC4899", ring: "ring-pink-400" }
              ] as const).map(({ key, color, ring }) => (
                <button
                  key={key}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    themeColor === key
                      ? `border-white ring-2 ${ring} scale-110`
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => { setThemeColor(key); applyTheme(key); }}
                  title={key}
                />
              ))}
              {/* Divider */}
              <span className="mx-1 h-6 w-px bg-slate-200" />
              {/* Custom color picker */}
              <input
                ref={colorInputRef}
                type="color"
                value={customColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  setCustomColor(hex);
                  setThemeColor("custom");
                  applyTheme("custom", hex);
                }}
                className={`h-9 w-9 cursor-pointer rounded-full border-2 p-0 transition hover:scale-105 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none ${
                  themeColor === "custom"
                    ? "border-white ring-2 ring-slate-400 scale-110"
                    : "border-slate-200"
                }`}
                title="自定义颜色"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* AI Model Preference */}
          <div className="py-4">
            <p className="text-sm font-bold text-slate-700">{t("settings.aiModel")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("settings.aiModelDesc")}</p>
            <div className="mt-3 flex gap-2">
              <button
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                  aiModel === "flash"
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
                onClick={() => { setAiModel("flash"); try { localStorage.setItem("offerforge-ai-model", "flash"); } catch { /* ignore */ } }}
              >
                <Sparkles size={14} className="mb-1" />
                <span className="block font-semibold">{t("settings.fastMode")}</span>
              </button>
              <button
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left text-xs transition relative ${
                  aiModel === "pro"
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
                onClick={() => {
                  setAiModel("pro");
                  try { localStorage.setItem("offerforge-ai-model", "pro"); } catch { /* ignore */ }
                }}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">PRO</span>
                <Sparkles size={14} className="mb-1" />
                <span className="block font-semibold">{t("settings.preciseMode")}</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Clear Local Data */}
          <div className="py-4">
            <p className="text-sm font-bold text-slate-700">{t("settings.clearData")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("settings.clearDataDesc")}</p>
            <button
              className="mt-3 h-10 w-full rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-500 transition hover:bg-red-50"
              onClick={() => setClearConfirmOpen(true)}
            >
              {t("settings.clearBtn")}
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Account Info */}
          <div className="py-4">
            <p className="text-sm font-bold text-slate-700">{t("settings.account")}</p>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                  <User size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t("settings.notLoggedIn")}</p>
                  <p className="text-xs text-slate-400">{t("settings.loginHint")}</p>
                </div>
              </div>
              <button
                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => { setSettingsOpen(false); setLoginOpen(true); }}
              >
                <LogIn size={14} />
                {t("settings.login")}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Clear Data Confirm */}
      <ConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={() => {
          try { localStorage.clear(); } catch { /* ignore */ }
          showToast(t("settings.cleared"), "success");
          setTimeout(() => window.location.reload(), 800);
        }}
        title={t("settings.clearData")}
        message={t("settings.clearConfirm")}
        confirmLabel={t("settings.clearBtn")}
        danger
      />

      {/* Login Modal */}
      <Modal open={loginOpen} onClose={() => { setLoginOpen(false); resetLoginForm(); }} title="邮箱登录 / 注册">
        <div className="space-y-4">
          {loginError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{loginError}</p>
          )}

          <div className="space-y-3">
            <input
              className="input"
              type="email"
              placeholder="请输入邮箱"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="请输入验证码"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                maxLength={6}
              />
              <button
                className="h-11 shrink-0 rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                onClick={handleSendEmailCode}
                disabled={loginCountdown > 0 || !loginEmail.trim()}
              >
                {loginCountdown > 0 ? `${loginCountdown}s` : "获取验证码"}
              </button>
            </div>
            <button
              className="h-11 w-full rounded-xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
              onClick={handleLogin}
              disabled={loginLoading || !loginEmail.trim() || !loginCode.trim()}
            >
              {loginLoading ? "登录中..." : "登录 / 注册"}
            </button>
            <p className="text-center text-xs text-slate-400">未注册的邮箱将自动创建账号</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
