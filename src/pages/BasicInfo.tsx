import { Camera, CheckCircle2, ChevronDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useResumeStore } from "../store/resumeStore";
import { useT } from "../i18n";
import { showToast } from "../components/Toast";
import { chinaCities } from "../data/chinaCities";

export function BasicInfo() {
  const { t } = useT();
  const resume = useResumeStore((state) => state.resume);
  const updatePersonal = useResumeStore((state) => state.updatePersonal);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("头像文件不能超过 2MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("请选择图片文件", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updatePersonal({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <StepHeading title={t("basic.title")} subtitle={t("basic.subtitle")} />

      <div className="mb-6 flex items-center gap-6">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <button
          className="group relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-brand-300 hover:bg-brand-50"
          onClick={() => fileRef.current?.click()}
        >
          {resume.personal.avatar ? (
            <img src={resume.personal.avatar} alt="头像" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-brand-500">
              <Camera size={20} />
              <span className="text-[10px] font-medium">{t("basic.uploadAvatar")}</span>
            </div>
          )}
        </button>
        <div>
          <p className="text-sm font-bold text-slate-700">{t("basic.avatarLabel")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("basic.avatarHint")}</p>
          {resume.personal.avatar && (
            <button
              className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
              onClick={() => updatePersonal({ avatar: "" })}
            >
              {t("basic.removeAvatar")}
            </button>
          )}
        </div>
      </div>

      <h3 className="mb-4 text-xl font-black text-ink">{t("basic.personalInfo")}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("basic.resumeName")} value={resume.personal.resumeTitle} onChange={(resumeTitle) => updatePersonal({ resumeTitle })} />
        <Field label={t("basic.targetRole")} value={resume.personal.role} onChange={(role) => updatePersonal({ role })} />
        <Field label={t("basic.name")} value={resume.personal.name} onChange={(name) => updatePersonal({ name })} />
        <Field label={t("basic.seniority")} value={resume.personal.seniority} onChange={(seniority) => updatePersonal({ seniority })} />
        <Field label={t("basic.phone")} value={resume.personal.phone} onChange={(phone) => updatePersonal({ phone })} />
        <Field label={t("basic.email")} value={resume.personal.email} onChange={(email) => updatePersonal({ email })} />
        <CityPicker value={resume.personal.city} onChange={(city) => updatePersonal({ city })} />
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-semibold text-slate-600">{t("basic.summary")}</span>
        <textarea
          className="input min-h-[110px] resize-none py-3"
          value={resume.personal.summary}
          onChange={(event) => updatePersonal({ summary: event.target.value })}
        />
      </label>
    </div>
  );
}

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const filled = value.trim().length > 0;
  return (
    <label className="group block rounded-xl border border-slate-100 bg-white p-4 transition focus-within:border-brand-500">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        {label}
        <CheckCircle2 size={16} className={filled ? "text-emerald-500" : "text-slate-200"} />
      </span>
      <input className="w-full border-0 bg-transparent text-sm font-semibold text-ink outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const routes = ["/basic", "/work", "/projects", "/skills", "/export"];
  const currentIndex = Math.max(0, routes.indexOf(location.pathname));
  const prev = routes[Math.max(0, currentIndex - 1)];
  const next = routes[Math.min(routes.length - 1, currentIndex + 1)];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-500 disabled:opacity-30 leading-none"
          disabled={currentIndex === 0}
          onClick={() => navigate(prev)}
        >
          ← {t("basic.prev")}
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-500 disabled:opacity-30 leading-none"
          disabled={currentIndex === routes.length - 1}
          onClick={() => navigate(next)}
        >
          {t("basic.next")}
        </button>
        <span className="ml-auto text-[11px] text-slate-300">
          {currentIndex + 1} / {routes.length}
        </span>
      </div>
    </div>
  );
}

function CityPicker({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const parsed = useMemo(() => {
    const parts = value ? value.split(/\s+|\s*·\s*/).filter(Boolean) : [];
    return { province: parts[0] || "", city: parts[1] || "" };
  }, [value]);

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const selectedProvince = chinaCities.find((p) => p.province === parsed.province);
  const cities = selectedProvince?.cities ?? [];

  const handleProvinceSelect = (province: string) => {
    onChange(province);
    setProvinceOpen(false);
  };

  const handleCitySelect = (city: string) => {
    onChange(`${parsed.province} ${city}`);
    setCityOpen(false);
  };

  return (
    <div className="group block rounded-xl border border-slate-100 bg-white p-4 transition focus-within:border-brand-500">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        所在城市
        <CheckCircle2 size={16} className={parsed.province ? "text-emerald-500" : "text-slate-200"} />
      </span>
      <div className="flex gap-2">
        {/* Province */}
        <div className="relative flex-1">
          <button
            className="flex h-full w-full items-center justify-between rounded-lg bg-transparent text-sm font-semibold text-ink outline-none"
            onClick={() => { setProvinceOpen(!provinceOpen); setCityOpen(false); }}
          >
            <span className={parsed.province ? "text-ink" : "text-slate-400"}>{parsed.province || "选择省份"}</span>
            <ChevronDown size={14} className={`text-slate-400 transition ${provinceOpen ? "rotate-180" : ""}`} />
          </button>
          {provinceOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-36 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
              {chinaCities.map((p) => (
                <button
                  key={p.province}
                  className={`block w-full px-3 py-2 text-left text-xs transition hover:bg-brand-50 ${
                    parsed.province === p.province ? "bg-brand-50 font-semibold text-brand-600" : "text-slate-600"
                  }`}
                  onClick={() => handleProvinceSelect(p.province)}
                >
                  {p.province}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* City */}
        <div className="relative flex-1">
          <button
            className="flex h-full w-full items-center justify-between rounded-lg bg-transparent text-sm font-semibold outline-none"
            onClick={() => { setCityOpen(!cityOpen); setProvinceOpen(false); }}
            disabled={!parsed.province}
          >
            <span className={parsed.city ? "text-ink" : "text-slate-400"}>
              {parsed.city || (parsed.province ? "选择城市" : "请先选省份")}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition ${cityOpen ? "rotate-180" : ""}`} />
          </button>
          {cityOpen && cities.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-36 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
              {cities.map((city) => (
                <button
                  key={city}
                  className={`block w-full px-3 py-2 text-left text-xs transition hover:bg-brand-50 ${
                    parsed.city === city ? "bg-brand-50 font-semibold text-brand-600" : "text-slate-600"
                  }`}
                  onClick={() => handleCitySelect(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Close dropdowns on outside click */}
      {(provinceOpen || cityOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setProvinceOpen(false); setCityOpen(false); }} />
      )}
    </div>
  );
}

// ── Template Card Component ────────────────────────────────────────────
export function TemplateCard({
  active,
  onClick,
  badge,
  title,
  subtitle,
  description,
  gradient,
  accent,
  activeBorder,
  disabled,
  children
}: {
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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col overflow-hidden rounded-[34px] border bg-white p-7 text-left transition-all duration-500 ${
        active
          ? `${activeBorder} border bg-gradient-to-br ${gradient} shadow-[0_24px_60px_-24px_rgba(15,23,42,0.16)] ring-1`
          : disabled
            ? "border-slate-100 opacity-60 cursor-not-allowed"
            : "border-slate-200/80 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.14)] hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_60px_-24px_rgba(15,23,42,0.16)]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(255,255,255,0.78)_38%,_transparent_72%)] opacity-95" />

      {/* Badge */}
      <div className="absolute right-5 top-5 z-10">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide backdrop-blur ${
            badge === "PRO"
              ? "bg-amber-100/90 text-amber-700 border border-amber-200"
              : badge === "COMING SOON"
                ? "bg-slate-100/90 text-slate-500 border border-slate-200"
                : "bg-white/80 text-slate-500 border border-slate-100"
          }`}
        >
          {badge}
        </span>
      </div>

      {/* Active check */}
      {active && (
        <div className="absolute left-5 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_4px_12px_rgba(255,106,0,0.35)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Illustration area */}
      <div
        className={`relative z-[1] mb-5 flex h-[146px] items-center justify-center overflow-hidden rounded-[28px] border bg-gradient-to-br ${gradient}`}
        style={{ borderColor: active ? accent : "rgba(226,232,240,0.85)" }}
      >
        <div className="absolute inset-x-6 top-5 h-px bg-white/80" />
        <div className="absolute inset-x-6 bottom-5 h-px bg-white/35" />
        {children}
      </div>

      {/* Text content */}
      <div className="relative z-[1] mb-2 flex items-center gap-2.5">
        <h3 className="text-[17px] font-black tracking-tight text-slate-900">{title}</h3>
        <span className="text-sm font-bold" style={{ color: accent }}>{subtitle}</span>
        <span className={`ml-auto flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${
          active ? "bg-[#FFF0E5] text-[#FF6A00]" : "bg-slate-100 text-slate-400"
        }`}>
          {active ? "当前" : "可选"}
        </span>
      </div>
      <p className="relative z-[1] text-[13px] leading-7 text-slate-400">{description}</p>
    </button>
  );
}
