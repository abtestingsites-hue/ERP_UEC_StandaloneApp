export const getApiBaseUrl = (): string => {
  const envApiUrl = typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL 
    : (import.meta as any)?.env?.VITE_CRM_API_URL;
  if (envApiUrl && envApiUrl.startsWith('http') && !envApiUrl.includes('erp-uec-backend')) {
    return envApiUrl.replace(/\/$/, '');
  }
  // CRM API server is hosted at crm-uec-backend.onrender.com (the ERP port 4000 backend does not host CRM telephony/analytics routes)
  return 'https://crm-uec-backend.onrender.com';
};

export const sanitizeRecordingUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const baseUrl = getApiBaseUrl();
  if (url.includes('localhost:4000') || url.includes('127.0.0.1:4000')) {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):4000/g, baseUrl);
  }
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return url;
};

export const parseJwtPayload = (token: string | null | undefined): any => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (_) {
    return null;
  }
};

export const isCrmToken = (token: string | null | undefined): boolean => {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  // An ERP token only has roleId/tenantId/unitId and lacks sub/userId/agentId
  if (payload.tenantId && payload.roleId && !payload.sub && !payload.userId) {
    return false;
  }
  const hasCrmIdentity = Boolean(payload.sub || payload.userId || payload.agentId || payload.department);
  if (!hasCrmIdentity) return false;
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return false;
  }
  return true;
};

const BASE_URL = getApiBaseUrl();
let crmAuthPromise: Promise<string | null> | null = null;

export async function ensureCrmAuthSession(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const currentToken =
    localStorage.getItem('paramantra_access_token') ||
    localStorage.getItem('crm_token');

  if (currentToken && isCrmToken(currentToken)) {
    return currentToken.trim().replace(/^["']|["']$/g, '');
  }

  if (crmAuthPromise) return crmAuthPromise;

  crmAuthPromise = (async () => {
    try {
      const activeBaseUrl = getApiBaseUrl();

      // 1. Try refreshing with existing refresh token if present
      const refreshToken =
        localStorage.getItem('paramantra_refresh_token') ||
        localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${activeBaseUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.accessToken) {
              const cleanToken = data.accessToken.trim().replace(/^["']|["']$/g, '');
              localStorage.setItem('paramantra_access_token', cleanToken);
              localStorage.setItem('crm_token', cleanToken);
              if (data.refreshToken) {
                localStorage.setItem('paramantra_refresh_token', data.refreshToken);
              }
              window.dispatchEvent(
                new CustomEvent('auth-token-refreshed', { detail: { token: cleanToken } })
              );
              return cleanToken;
            }
          }
        } catch (_) {}
      }

      // 2. If user is SuperAdmin inside ERP shell, authenticate with CRM admin credentials
      const erpSessionStr =
        sessionStorage.getItem('superadmin-erp-session') ||
        localStorage.getItem('superadmin-erp-session');

      let isSuperAdminUser = false;
      if (erpSessionStr) {
        try {
          const parsed = JSON.parse(erpSessionStr);
          const rawRole = parsed.user?.role
            ? typeof parsed.user.role === 'string'
              ? parsed.user.role
              : parsed.user.role.name
            : '';
          const roleStr = String(rawRole).toUpperCase();
          const email = String(parsed.user?.email || '').toLowerCase();
          if (roleStr.includes('ADMIN') || email.includes('raghav') || email.includes('admin')) {
            isSuperAdminUser = true;
          }
        } catch (_) {}
      }

      if (isSuperAdminUser) {
        const loginRes = await fetch(`${activeBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'Raghav@uec.com', password: 'raghav@uec.com' }),
        });

        if (loginRes.ok) {
          const data = await loginRes.json();
          if (data.accessToken) {
            const cleanToken = data.accessToken.trim().replace(/^["']|["']$/g, '');
            localStorage.setItem('paramantra_access_token', cleanToken);
            localStorage.setItem('crm_token', cleanToken);
            if (data.refreshToken) {
              localStorage.setItem('paramantra_refresh_token', data.refreshToken);
            }
            if (data.session) {
              const userObj = {
                id: data.session.userId || data.session.id,
                email: data.session.email,
                name: data.session.name,
                role: data.session.role,
                agentId: data.session.agentId || data.session.userId || data.session.id,
              };
              localStorage.setItem('paramantra_user', JSON.stringify(userObj));
              localStorage.setItem('crm_user', JSON.stringify(userObj));
            }
            window.dispatchEvent(
              new CustomEvent('auth-token-refreshed', { detail: { token: cleanToken } })
            );
            return cleanToken;
          }
        }
      }

      return null;
    } catch (e) {
      console.warn('[CRM-AUTH-SESSION] Failed to ensure CRM auth session:', e);
      return null;
    } finally {
      crmAuthPromise = null;
    }
  })();

  return crmAuthPromise;
}

class APIClient {
  private refreshPromise: Promise<string | null> | null = null;

  private getToken() {
    if (typeof window === 'undefined') return null;
    const token =
      localStorage.getItem('paramantra_access_token') ||
      localStorage.getItem('crm_token');
    if (!token) return null;
    const clean = token.trim().replace(/^["']|["']$/g, '');
    return isCrmToken(clean) ? clean : null;
  }

  private getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('paramantra_refresh_token') ||
      localStorage.getItem('refresh_token')
    );
  }

  private clearSessionAndRedirect() {
    if (typeof window === 'undefined') return;
    console.warn('[CRM-API] 401 Unauthorized encountered on CRM API endpoint');
    localStorage.removeItem('paramantra_access_token');
    localStorage.removeItem('paramantra_refresh_token');
    localStorage.removeItem('crm_token');
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      const activeBaseUrl = getApiBaseUrl();

      if (refreshToken) {
        try {
          const res = await fetch(`${activeBaseUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.accessToken) {
              const cleanToken = data.accessToken.trim().replace(/^["']|["']$/g, '');
              localStorage.setItem('paramantra_access_token', cleanToken);
              localStorage.setItem('crm_token', cleanToken);
              if (data.refreshToken) {
                localStorage.setItem('paramantra_refresh_token', data.refreshToken);
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('auth-token-refreshed', { detail: { token: cleanToken } })
                );
              }
              return cleanToken;
            }
          }
        } catch (_) {}
      }

      // If refresh token failed or was invalid, attempt session recovery
      return await ensureCrmAuthSession();
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async request<T = Response>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = this.getToken();

    const isAuthEndpoint =
      endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');

    // Auto-acquire CRM session if missing on CRM-scoped request
    if (!token && !isAuthEndpoint && typeof window !== 'undefined') {
      token = await ensureCrmAuthSession();
    }

    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const activeBaseUrl = getApiBaseUrl();
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${activeBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      let res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized: attempt refresh if token expired or rejected
      if (res.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryRes = await fetch(url, {
            ...options,
            headers,
          });
          return retryRes as unknown as T;
        }
      }

      return res as unknown as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'GET' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }
}

export const api = new APIClient();
export const apiFetch = <T = Response>(endpoint: string, options?: RequestInit) =>
  api.request<T>(endpoint, options);
export const API_BASE_URL = BASE_URL;
