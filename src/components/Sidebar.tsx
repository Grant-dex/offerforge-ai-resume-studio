import { Copy, FileText, LogIn, Plus, Settings, Sparkles, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import type { ResumeData } from "../types/resume";
import { DEFAULT_ORDER_PRESET, DEFAULT_SECTION_ORDER } from "../data/sectionOrder";
import { duplicateResume, loadDraftEntries, loadResumeSnapshot, makeResumeDraft, removeResumeSnapshot, saveActiveResume, saveResumeSnapshot, type RecentEntry, type ResumeSnapshot } from "../utils/draftLibrary";
import { useT } from "../i18n";
import { calcATSScore } from "../utils/atsScore";
import { sendEmailCode, loginByEmail, saveUser, loadUser, clearUser, type UserInfo } from "../utils/auth";
import { ConfirmDialog, PromptDialog } from "./Dialogs";
import { Modal } from "./Modal";
import { showToast } from "./Toast";
import { ResumeBackup } from "./ResumeBackup";

interface JobApp {
  id: string;
  company: string;
  role: string;
  status: "待回复" | "面试中" | "已拒绝";
  date: string;
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
  try { return loadDraftEntries(localStorage); } catch { return []; }
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

export function Sidebar({ onOpenEditor, onSaveStatus }: { onOpenEditor?: () => void; onSaveStatus?: (error: string | null) => void }) {
  const { t, locale, setLocale } = useT();
  const resume = useResumeStore((state) => state.resume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);
  const template = useResumeStore((state) => state.template);
  const sectionOrder = useResumeStore((state) => state.sectionOrder);
  const orderPreset = useResumeStore((state) => state.orderPreset);
  const lastTouched = useResumeStore((state) => state.lastTouched);
  const [proOpen, setProOpen] = useState(false);
  const [jobs, setJobs] = useState<JobApp[]>(loadJobs);
  const [recents, setRecents] = useState<RecentEntry[]>(loadRecents);
  const recentsRef = useRef(recents);
  const [saveError, setSaveError] = useState("");
  const saveErrorRef = useRef(false);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  // Dialog states
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecentEntry | null>(null);
  const [newResumeOpen, setNewResumeOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<RecentEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Settings states
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
  const reportSaveError = () => {
    const message = "浏览器存储空间不足或不可用，部分修改未保存。当前内容仍在页面中，请先导出需要保留的文件。";
    setSaveError(message);
    if (!saveErrorRef.current) showToast(message, "error");
    saveErrorRef.current = true;
  };
  const persistSnapshot = (snapshot: ResumeSnapshot): boolean => {
    try {
      const updated = saveResumeSnapshot(localStorage, snapshot, recentsRef.current);
      recentsRef.current = updated;
      setRecents(updated);
      return true;
    } catch { reportSaveError(); return false; }
  };
  const persistCurrent = () => {
    const state = useResumeStore.getState();
    const snapshot: ResumeSnapshot = {
      version: 1, resume: state.resume, template: state.template,
      sectionOrder: state.sectionOrder, orderPreset: state.orderPreset, lastTouched: state.lastTouched,
    };
    try { saveActiveResume(localStorage, snapshot); } catch { reportSaveError(); return false; }
    if (!persistSnapshot(snapshot)) return false;
    setSaveError("");
    saveErrorRef.current = false;
    return true;
  };
  const activateSnapshot = (snapshot: ResumeSnapshot): boolean => {
    try {
      // Preflight persistence before replacing the in-memory document.
      saveActiveResume(localStorage, snapshot);
      useResumeStore.setState({
        resume: { ...snapshot.resume, atsScore: calcATSScore(snapshot.resume) },
        template: snapshot.template,
        sectionOrder: snapshot.sectionOrder,
        orderPreset: snapshot.orderPreset,
        lastTouched: snapshot.lastTouched,
      });
    } catch { reportSaveError(); return false; }
    onOpenEditor?.();
    return true;
  };
  useEffect(() => {
    persistCurrent();
  }, [resume, template, lastTouched]);
  useEffect(() => { onSaveStatus?.(saveError || null); }, [saveError, onSaveStatus]);

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
    if (entry.id === resume.id) { onOpenEditor?.(); return; }
    if (loadResumeSnapshot(localStorage, entry.id)) setSwitchTarget(entry);
    else showToast("这份草稿无法读取，请检查浏览器本地数据。", "error");
  };

  const confirmSwitch = () => {
    if (!switchTarget) return;
    const snapshot = loadResumeSnapshot(localStorage, switchTarget.id);
    if (!snapshot) { showToast("这份草稿无法读取，当前简历已保留。", "error"); return; }
    if (!persistCurrent()) return;
    if (!activateSnapshot(snapshot)) return;
    showToast(t("sidebar.switchedTo", { name: snapshot.resume.title }), "success");
    setSwitchTarget(null);
  };

  const createResume = () => {
    if (!persistCurrent()) return;
    const numbers = recents.map(entry => /^新简历 (\d+)$/.exec(entry.title)).filter(Boolean).map(match => Number(match![1]));
    const draft = makeResumeDraft(Math.max(0, ...numbers) + 1);
    const snapshot: ResumeSnapshot = {
      version: 1, resume: draft, template: "focus",
      sectionOrder: DEFAULT_SECTION_ORDER, orderPreset: DEFAULT_ORDER_PRESET, lastTouched: draft.lastSaved,
    };
    if (!persistSnapshot(snapshot)) return;
    if (!activateSnapshot(snapshot)) return;
    setNewResumeOpen(false);
    showToast(t("sidebar.created"), "success");
  };

  const copyCurrentResume = () => {
    if (!persistCurrent()) return;
    const draft = duplicateResume(resume);
    const snapshot: ResumeSnapshot = {
      version: 1, resume: draft, template,
      sectionOrder: useResumeStore.getState().sectionOrder,
      orderPreset: useResumeStore.getState().orderPreset,
      lastTouched: draft.lastSaved,
    };
    if (!persistSnapshot(snapshot)) return;
    if (!activateSnapshot(snapshot)) return;
    showToast("已复制简历，可以为另一个岗位单独修改。", "success");
  };

  const importResume = (snapshot: ResumeSnapshot): boolean => {
    if (!persistCurrent() || !persistSnapshot(snapshot)) return false;
    return activateSnapshot(snapshot);
  };

  const deleteResume = () => {
    if (!deleteTarget) return;
    try {
      const isCurrent = deleteTarget.id === resume.id;
      let fallback: ResumeSnapshot | null = null;
      if (isCurrent) {
        for (const entry of recents) {
          if (entry.id !== resume.id) fallback = loadResumeSnapshot(localStorage, entry.id);
          if (fallback) break;
        }
        if (!fallback) {
          const draft = makeResumeDraft(1);
          fallback = {
            version: 1, resume: draft, template: "focus",
            sectionOrder: DEFAULT_SECTION_ORDER, orderPreset: DEFAULT_ORDER_PRESET, lastTouched: draft.lastSaved,
          };
          if (!persistSnapshot(fallback)) return;
        }
        saveActiveResume(localStorage, fallback);
      }
      const updated = removeResumeSnapshot(localStorage, deleteTarget.id, recentsRef.current);
      recentsRef.current = updated;
      setRecents(updated);
      if (fallback && !activateSnapshot(fallback)) return;
      setDeleteTarget(null);
      showToast(t("sidebar.deletedEntry", { name: deleteTarget.title }), "info");
    } catch { reportSaveError(); }
  };

  return (
    <>
      <aside className="resume-library p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-600 text-xl font-black text-white">
            O
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-ink">{t("app.name")}</div>
            <div className="text-xs text-slate-500">{t("app.subtitle")}</div>
          </div>
        </div>

        {saveError && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{saveError}</p>}

        {/* Section: 我的简历 */}
        <section className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            <span className="text-base font-bold text-slate-700">{t("sidebar.myResume")}</span>
          </div>

          {/* Module 3: Recent resumes */}
          {recents.length > 0 && (
            <div className="mb-3 max-h-64 space-y-1 overflow-y-auto" aria-label="已保存的简历">
              {recents.map((entry) => (
                <div
                  key={entry.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    entry.id === resume.id ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                    onClick={() => switchToRecent(entry)}
                    aria-current={entry.id === resume.id ? "true" : undefined}
                  >
                    <span className={`truncate font-medium ${entry.id === resume.id ? "text-brand-700" : "text-slate-700"}`}>{entry.title}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{entry.lastEdited}</span>
                  </button>
                  {recents.length > 1 && (
                    <button
                      className="rounded p-1 text-slate-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      aria-label={`删除简历 ${entry.title}`}
                      onClick={() => setDeleteTarget(entry)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Current resume card */}
          <div className="rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-600 p-4 text-white shadow-glow">
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
                onClick={() => setDeleteTarget({ id: resume.id, title: resume.title, lastEdited: lastTouched })}
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

          <button type="button" onClick={copyCurrentResume} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50"><Copy size={15} />复制当前简历</button>
          <p className="mt-2 text-xs leading-5 text-neutral-500">已保存 {recents.length} 份草稿，每份保留独立内容与模板。</p>

          <div className="mt-5"><ResumeBackup snapshot={{ version: 1, resume, template, sectionOrder, orderPreset, lastTouched }} onImport={importResume} /></div>

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
                    <p className="text-xs text-slate-400">登录后使用账户功能</p>
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
              showToast("会员支付尚未配置，请联系管理员开通。", "info");
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
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteResume}
        title={t("sidebar.deleteTitle")}
        message={`将删除“${deleteTarget?.title || "这份简历"}”及其本地内容。请先导出需要保留的文件。`}
        confirmLabel={t("sidebar.deleteLabel")}
        danger
      />

      {/* New Resume Confirm */}
      <ConfirmDialog
        open={newResumeOpen}
        onClose={() => setNewResumeOpen(false)}
        onConfirm={createResume}
        title={t("sidebar.newTitle")}
        message={locale === "zh" ? "将保存当前简历，并创建一份空白草稿。已有简历会保留在列表中。" : "Save this resume and create a blank draft. Existing resumes stay in your list."}
        confirmLabel={t("sidebar.newLabel")}
      />

      {/* Switch Resume Confirm */}
      <ConfirmDialog
        open={switchTarget !== null}
        onClose={() => setSwitchTarget(null)}
        onConfirm={confirmSwitch}
        title={t("sidebar.switchTitle")}
        message={switchTarget ? (locale === "zh" ? `将先保存当前简历，再打开“${switchTarget.title}”。` : `Save this resume, then open “${switchTarget.title}”.`) : ""}
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

          <div className="py-4">
            <p className="text-sm font-bold text-neutral-700">界面外观</p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">白色与浅灰色工作区，简历使用黑白单栏排版。</p>
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
