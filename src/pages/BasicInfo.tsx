import { Camera, Check, CircleAlert, Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { showToast } from "../components/Toast";
import { isValidEmail } from "../utils/formValidation";
import { chinaCities } from "../data/chinaCities";

const inputStyle = "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100";
const buttonFocus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2";

export function BasicInfo() {
  const { t, locale } = useT();
  const resume = useResumeStore((state) => state.resume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);
  const fileRef = useRef<HTMLInputElement>(null);
  const zh = locale === "zh";

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(zh ? "头像文件不能超过 2MB" : "Photo must be smaller than 2 MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast(zh ? "请选择图片文件" : "Please choose an image file", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updatePersonal({ avatar: reader.result as string });
    reader.onerror = () => showToast(zh ? "图片读取失败，请重试" : "Unable to read this image. Please try again.", "error");
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-w-0">
      <StepHeading title={t("basic.title")} subtitle={t("basic.subtitle")} />
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <input ref={fileRef} type="file" accept="image/*" aria-label={t("basic.uploadAvatar")} className="hidden" onChange={handleAvatarUpload} />
        <button
          type="button"
          aria-label={t("basic.uploadAvatar")}
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-slate-500 ${buttonFocus}`}
          onClick={() => fileRef.current?.click()}
        >
          {resume.personal.avatar ? <img src={resume.personal.avatar} alt={t("basic.avatarLabel")} className="h-full w-full object-cover" /> : <Camera size={22} />}
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{t("basic.avatarLabel")} <span className="font-normal text-slate-400">{zh ? "（选填）" : "(optional)"}</span></p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{zh ? "点击上传图片，大小不超过 2MB" : "Upload an image up to 2 MB"}</p>
          {resume.personal.avatar && (
            <button type="button" className={`mt-1 rounded text-xs text-slate-600 underline underline-offset-4 hover:text-slate-900 ${buttonFocus}`} onClick={() => updatePersonal({ avatar: "" })}>
              {t("basic.removeAvatar")}
            </button>
          )}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <Field label={t("basic.resumeName")} value={resume.personal.resumeTitle} onChange={(resumeTitle) => updatePersonal({ resumeTitle })} placeholder={zh ? "例如：产品经理 · 社招简历" : "e.g. Product Manager Resume"} />
        <Field label={t("basic.targetRole")} value={resume.personal.role} onChange={(role) => updatePersonal({ role })} placeholder={zh ? "填写本次投递的岗位" : "Role you are applying for"} />
        <Field label={t("basic.name")} value={resume.personal.name} onChange={(name) => updatePersonal({ name })} autoComplete="name" />
        <Field label={zh ? "经验概述" : t("basic.seniority")} value={resume.personal.seniority} onChange={(seniority) => updatePersonal({ seniority })} placeholder={zh ? "例如：3 年前端开发经验 / 2026 届应届生" : "e.g. 3 years in frontend development"} />
        <Field label={t("basic.phone")} type="tel" value={resume.personal.phone} onChange={(phone) => updatePersonal({ phone })} autoComplete="tel" />
        <Field label={t("basic.email")} type="email" error={resume.personal.email.trim() && !isValidEmail(resume.personal.email) ? (zh ? "邮箱格式不正确，请检查，如 name@example.com。" : "Check the email address, e.g. name@example.com.") : ""} value={resume.personal.email} onChange={(email) => updatePersonal({ email })} autoComplete="email" />
        <CityPicker value={resume.personal.city} onChange={(city) => updatePersonal({ city })} />
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold text-slate-600">{t("basic.summary")}</span>
          <textarea
            className={`${inputStyle} min-h-[132px] resize-y leading-7`}
            value={resume.personal.summary}
            placeholder={zh ? "用 2–3 句话概括你的经验、核心能力和代表性成果。" : "Summarize your experience, strengths and key achievements in 2–3 sentences."}
            onChange={(event) => updatePersonal({ summary: event.target.value })}
          />
          <span className="mt-1.5 block text-xs leading-5 text-slate-400">{zh ? "优先写与目标岗位相关的事实和成果。" : "Focus on facts and achievements relevant to the role."}</span>
        </label>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text", autoComplete, error, disabled }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email";
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = useId();
  const [focused, setFocused] = useState(false);
  const visibleError = !focused && !disabled ? error : "";
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
      <input aria-label={label} disabled={disabled} aria-invalid={!!visibleError} aria-describedby={visibleError ? errorId : undefined} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className={`${inputStyle} ${visibleError ? "border-amber-500" : ""} disabled:bg-neutral-50 disabled:text-neutral-500`} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />
      {visibleError && <span id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-amber-800"><CircleAlert aria-hidden="true" size={13} className="mt-1 shrink-0" /><span>{visibleError}</span></span>}
    </label>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1.5 text-xs leading-6 text-slate-500">{subtitle}</p>
    </header>
  );
}

function CityPicker({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const { t, locale } = useT();
  const listId = useId();
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-slate-600">{t("basic.city")}</span>
      <input
        className={inputStyle}
        list={listId}
        value={value}
        placeholder={locale === "zh" ? "输入或选择所在城市" : "Type or select a city"}
        autoComplete="address-level2"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {chinaCities.flatMap(({ province, cities }) => cities.map((city) => <option key={`${province}-${city}`} value={province === city ? city : `${province} ${city}`} />))}
      </datalist>
    </label>
  );
}

export function TagEditor({ tags, onUpdate, label, placeholder }: {
  tags: string[];
  onUpdate: (tags: string[]) => void;
  label: string;
  placeholder?: string;
}) {
  const { locale } = useT();
  const zh = locale === "zh";
  const [input, setInput] = useState("");
  const inputId = useId();
  const addTags = (value: string) => {
    const newTags = value.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean);
    if (newTags.length) onUpdate([...new Set([...tags, ...newTags])]);
    setInput("");
  };
  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="mb-2 block text-xs font-semibold text-slate-600">{label}</label>
      {tags.length > 0 && <div className="mb-3 flex flex-wrap gap-2">
        {[...new Set(tags)].map((tag) => (
          <span key={tag} className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1.5 text-xs text-slate-600">
            <span className="min-w-0 break-words">{tag}</span>
            <button type="button" aria-label={zh ? `移除标签 ${tag}` : `Remove tag ${tag}`} className={`shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 ${buttonFocus}`} onClick={() => onUpdate(tags.filter((item) => item !== tag))}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>}
      <div className="flex min-w-0 gap-2">
        <input
          id={inputId}
          className={`${inputStyle} flex-1`}
          placeholder={placeholder || (zh ? "输入标签，回车添加" : "Type a tag, press Enter")}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter" || event.key === "," || event.key === "，") {
              event.preventDefault();
              addTags(input);
            }
          }}
        />
        <button type="button" className={`inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${buttonFocus}`} onClick={() => addTags(input)} disabled={!input.trim()}>
          <Plus size={14} />{zh ? "添加" : "Add"}
        </button>
      </div>
    </div>
  );
}

export function BulletEditor({ label, bullets, onChange, placeholder }: { label: string; bullets: string[]; onChange: (bullets: string[]) => void; placeholder?: string }) {
  const { locale } = useT();
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        className={`${inputStyle} min-h-[180px] resize-y leading-7`}
        value={bullets.join("\n")}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value.split("\n"))}
      />
      <span className="mt-1.5 block text-xs leading-5 text-slate-400">{locale === "zh" ? "每行一项，写清你的行动和实际成果。" : "One point per line. Describe your actions and results."}</span>
    </label>
  );
}

// Retain the existing public props for any template-selection consumers.
export function TemplateCard({ active, onClick, badge, title, subtitle, description, disabled, children }: {
  active: boolean;
  onClick: () => void;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  accent: string;
  activeBorder: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { locale } = useT();
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active} className={`relative flex min-w-0 flex-col rounded-xl border bg-white p-5 text-left transition ${buttonFocus} ${active ? "border-slate-700 ring-1 ring-slate-700" : "border-slate-200 hover:border-slate-400"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span>{badge}</span>
        {active && <Check size={16} className="text-slate-800" />}
      </div>
      <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{children}</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{subtitle}{active ? (locale === "zh" ? " · 当前使用" : " · Selected") : ""}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">{description}</p>
    </button>
  );
}
