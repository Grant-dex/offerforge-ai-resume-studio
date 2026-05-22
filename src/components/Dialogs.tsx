import { useState } from "react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "确认",
  danger = false
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={onClose}
        >
          取消
        </button>
        <button
          className={`h-11 flex-1 rounded-xl text-sm font-semibold text-white transition ${
            danger ? "bg-red-500 hover:bg-red-600" : "bg-brand-500 hover:bg-brand-600"
          }`}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  label,
  defaultValue = ""
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          autoFocus
        />
      </label>
      <div className="mt-6 flex gap-3">
        <button
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={onClose}
        >
          取消
        </button>
        <button
          className="h-11 flex-1 rounded-xl bg-brand-500 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          确认
        </button>
      </div>
    </Modal>
  );
}
