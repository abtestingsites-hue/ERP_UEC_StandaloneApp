import axios from 'axios';
import type { VitalSign, Medication, Nutrition, Invoice } from './types';

// Use same base URL mechanism as main app
const getApiBaseUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_URL || 'https://backend-erp-1-c5qf.onrender.com/api/v1';
    try {
        const appUrl = new URL(window.location.origin);
        if (!import.meta.env.VITE_API_URL && ['localhost', '127.0.0.1'].includes(appUrl.hostname)) {
            return 'https://backend-erp-1-c5qf.onrender.com/api/v1';
        }
    } catch {
        // ignore
    }
    return configuredUrl;
};

const portalApi = axios.create({
    baseURL: getApiBaseUrl() + '/patient-portal',
    timeout: 15000,
});

portalApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('patient_portal_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const PatientPortalService = {
    login: async (mobile: string, password: string) => {
        const { data } = await portalApi.post('/login', { mobile, password });
        return data.data;
    },
    logout: async () => {
        const { data } = await portalApi.post('/logout');
        localStorage.removeItem('patient_portal_token');
        return data;
    },
    getDashboard: async () => {
        const { data } = await portalApi.get('/dashboard');
        return data.data as {
            vitals: VitalSign[];
            medications: Medication[];
            nutritions: Nutrition[];
        };
    },
    getBilling: async () => {
        const { data } = await portalApi.get('/billing');
        return data.data as { invoices: Invoice[] };
    }
};
