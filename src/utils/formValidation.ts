export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isPresentDate = (value: string) => /^(至今|现在|present|current)$/i.test(value.trim());

// Compare date intervals: a month-only value should not invent a specific day.
function dateInterval(value: string): [number, number] | null {
  const match = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = match[3] ? Number(match[3]) : null;
  if (year < 1000 || month < 1 || month > 12) return null;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day !== null && (day < 1 || day > days)) return null;
  return [Date.UTC(year, month - 1, day ?? 1), Date.UTC(year, month - 1, day ?? days)];
}
export function validateExperienceDates(startDate: string, endDate: string, zh = true) {
  const start = startDate.trim(), end = endDate.trim();
  const from = dateInterval(start), to = dateInterval(end);
  const format = zh ? '请填写有效日期，如 2024-06 或 2024-06-15。' : 'Enter a valid date, e.g. 2024-06 or 2024-06-15.';
  const startError = start && !from ? format : '';
  const endError = end && !isPresentDate(end) && !to ? format : from && to && from[0] > to[1] ? (zh ? '结束时间早于开始时间，请检查。' : 'End date is before start date.') : '';
  return { startError, endError, invalid: !!(startError || endError) };
}
