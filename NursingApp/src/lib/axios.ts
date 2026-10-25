import axios from 'axios';
import { useAuthStore } from '../store/authStore';

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipAuthLogout?: boolean;
    }

    export interface InternalAxiosRequestConfig {
        skipAuthLogout?: boolean;
    }
}

const getApiBaseUrl = () => {
    // Rely on VITE_API_URL or fallback to the same default as the ERP
    const configuredUrl = import.meta.env.VITE_API_URL || "https://backend-erp-jp2x.onrender.com/api/v1";
    return configuredUrl;
};

export const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token and x-unit-id
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData && config.headers) {
            delete config.headers['Content-Type'];
        }

        const { token, activeUnitId, user } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        const explicitUnitId = config.headers?.['x-unit-id'] || config.headers?.['X-Unit-Id'];
        const resolvedUnitId = explicitUnitId || activeUnitId || user?.unitId;
        
        if (resolvedUnitId && !explicitUnitId) {
            config.headers['x-unit-id'] = resolvedUnitId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle global errors (e.g., 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error.config?.url || '');
        const isLoginRequest = requestUrl.includes('/auth/login');
        const status = error.response?.status;
        const hadAuthHeader = Boolean(error.config?.headers?.Authorization);
        const shouldLogout = status === 401 && !isLoginRequest && !error.config?.skipAuthLogout && hadAuthHeader;

        if (shouldLogout) {
            useAuthStore.getState().logout();
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(error);
    }
);
