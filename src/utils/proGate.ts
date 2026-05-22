import type { UserInfo } from "./auth";

const FREE_PRO_EMAIL = "zangxiang112@gmail.com";

function loadUser(): (UserInfo & { token: string }) | null {
  try { return JSON.parse(localStorage.getItem('offerforge-user') || 'null'); } catch { return null; }
}

export function isProUser(): boolean {
  const user = loadUser();
  if (!user) return false;
  if (user.email === FREE_PRO_EMAIL) return true;
  return user.isPro === true;
}

export function requirePro(): boolean {
  if (isProUser()) return true;
  return false;
}
