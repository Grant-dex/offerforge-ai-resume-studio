const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UserInfo {
  userId: number;
  nickname: string;
  email?: string;
  isPro: boolean;
}

export function saveUser(token: string, user: UserInfo) {
  localStorage.setItem('offerforge-user', JSON.stringify({ token, ...user }));
}

export function loadUser(): (UserInfo & { token: string }) | null {
  try { return JSON.parse(localStorage.getItem('offerforge-user') || 'null'); } catch { return null; }
}

export function clearUser() {
  localStorage.removeItem('offerforge-user');
}

export async function sendEmailCode(email: string): Promise<string | undefined> {
  const res = await fetch(`${BASE}/auth/send-email-code`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '发送失败');
  return data.code as string | undefined;
}

export async function loginByEmail(email: string, code: string) {
  const res = await fetch(`${BASE}/auth/login-email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '登录失败');
  return data as { token: string; user: UserInfo };
}
