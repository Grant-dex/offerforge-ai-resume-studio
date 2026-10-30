import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let dispatch: ((updater: (prev: ToastItem[]) => ToastItem[]) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  dispatch?.((prev) => [...prev, { id: ++toastId, message, type }]);
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

const colorMap = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800"
};

const iconColorMap = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500"
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    dispatch = (updater) => setToasts(updater);
    return () => { dispatch = null; };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3500);
    return () => clearTimeout(timer);
  }, [toasts]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[200] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg animate-[slideIn_0.25s_ease-out] ${colorMap[t.type]}`}
          >
            <Icon size={16} className={iconColorMap[t.type]} />
            <span className="flex-1">{t.message}</span>
            <button className="shrink-0 rounded p-0.5 opacity-50 transition hover:opacity-100" onClick={() => remove(t.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
