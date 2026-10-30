import type { UserInfo } from "./auth";

function loadUser(): (UserInfo & { token: string }) | null {
  try { return JSON.parse(localStorage.getItem('offerforge-user') || 'null'); } catch { return null; }
}

export function isProUser(): boolean {
  const user = loadUser();
  if (!user) return false;
  return user.isPro === true;
}

export function requirePro(): boolean {
  if (isProUser()) return true;
  return false;
}
