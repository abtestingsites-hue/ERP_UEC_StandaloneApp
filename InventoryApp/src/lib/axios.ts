import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useInventoryDomainStore } from '../store/useInventoryDomainStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthLogout?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    skipAuthLogout?: boolean;
  }
}

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://erp-uec-backend.onrender.com/api/v1';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT and x-unit-id
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    const { token, activeUnitId, user } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const { activeDomain } = useInventoryDomainStore.getState();
    if (activeDomain && config.headers) {
      config.headers['x-inventory-domain'] = activeDomain;
    }

    const explicitUnitId = config.headers?.['x-unit-id'] || config.headers?.['X-Unit-Id'];

    if (explicitUnitId) {
      config.headers['x-unit-id'] = explicitUnitId;
    } else if (activeUnitId) {
      // Specific operating unit selected
      config.headers['x-unit-id'] = activeUnitId;
    } else if (activeUnitId === null) {
      // User explicitly selected "All Units (Facility-wide)"
      // Do not attach x-unit-id so backend does not restrict to a single unit
      if (config.headers) {
        delete config.headers['x-unit-id'];
        delete config.headers['X-Unit-Id'];
      }

      // For GET read operations, attach allUnits=true
      const method = String(config.method || 'GET').toUpperCase();
      if (method === 'GET') {
        config.params = config.params || {};
        config.params.allUnits = 'true';
      }
    } else if (user?.unitId) {
      // Uninitialized fallback only
      config.headers['x-unit-id'] = user.unitId;
    }

    if (activeDomain) {
      config.params = config.params || {};
      if (!config.params.domain && !config.params.inventoryScope) {
        config.params.domain = activeDomain;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 unauthenticated responses
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

export default api;
