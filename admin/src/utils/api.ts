const API_BASE = '/api/admin';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('offerforge-admin-token');
    return stored || null;
  } catch { return null; }
}

export function setToken(token: string) {
  localStorage.setItem('offerforge-admin-token', token);
}

export function clearToken() {
  localStorage.removeItem('offerforge-admin-token');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.hash = '#/login';
    throw new Error('未登录');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

// Auth
export const adminApi = {
  login: (username: string, password: string) =>
    request<{ token: string; admin: any }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request('/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Dashboard
  dashboard: () => request('/dashboard'),

  // Users
  listUsers: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any || {}).toString();
    return request(`/users${qs ? '?' + qs : ''}`);
  },

  getUser: (id: number) => request(`/users/${id}`),

  setUserStatus: (id: number, status: number) =>
    request(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  setUserPro: (id: number, isPro: boolean, proExpiresAt?: string) =>
    request(`/users/${id}/pro`, {
      method: 'PUT',
      body: JSON.stringify({ isPro, proExpiresAt: proExpiresAt || null }),
    }),

  deleteUser: (id: number) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  // Logs
  listLogs: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any || {}).toString();
    return request(`/logs${qs ? '?' + qs : ''}`);
  },
};
