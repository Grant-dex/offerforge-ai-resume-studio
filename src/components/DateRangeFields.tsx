import { useRef } from "react";
import { Field } from "../pages/BasicInfo";
import { isPresentDate, validateExperienceDates } from "../utils/formValidation";

export function DateRangeFields({ startDate, endDate, onChange, zh }: { startDate: string; endDate: string; onChange: (patch: { startDate?: string; endDate?: string }) => void; zh: boolean }) {
  const previousEnd = useRef("");
  const present = isPresentDate(endDate);
  const { startError, endError } = validateExperienceDates(startDate, endDate, zh);
  return <div className="experience-dates min-w-0">
    <div className="grid min-w-0 grid-cols-2 gap-3">
      <Field value={startDate} label={zh ? "开始时间" : "Start date"} placeholder="2023-06" error={startError} onChange={startDate => onChange({ startDate })} />
      <Field value={endDate} label={zh ? "结束时间" : "End date"} placeholder="2025-09" disabled={present} error={endError} onChange={endDate => onChange({ endDate })} />
    </div>
    <label className="ongoing-date-toggle mt-3 inline-flex items-center gap-2 text-xs text-neutral-600"><input className="h-4 w-4 accent-neutral-700" type="checkbox" checked={present} onChange={event => {
      if (event.target.checked) { previousEnd.current = endDate; onChange({ endDate: zh ? "至今" : "Present" }); }
      else onChange({ endDate: previousEnd.current });
    }} />{zh ? "至今（仍在进行）" : "Present (ongoing)"}</label>
  </div>;
}
