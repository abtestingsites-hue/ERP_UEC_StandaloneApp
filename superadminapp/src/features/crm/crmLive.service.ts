import axios from 'axios';

const CRM_LIVE_BACKEND = 'https://crm-uec-backend.onrender.com';

const crmApi = axios.create({
    baseURL: CRM_LIVE_BACKEND,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

crmApi.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('paramantra_access_token') || localStorage.getItem('crm_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export interface LiveCRMStats {
    activeCalls: number;
    queuedCalls: number;
    availableAgents: number;
    totalLeads: number;
    activeInquiries: number;
    slaMetPercent: number;
}

export const crmLiveService = {
    async getHealth(): Promise<{ status: string; uptime?: number; latencyMs?: number }> {
        const start = Date.now();
        try {
            const res = await crmApi.get('/api/v1/health');
            return {
                status: res.data?.status || 'ONLINE',
                uptime: res.data?.uptime,
                latencyMs: Date.now() - start,
            };
        } catch {
            return { status: 'OFFLINE', latencyMs: Date.now() - start };
        }
    },

    async getDashboardCalls(): Promise<{ activeCalls: any[]; queuedCalls: any[]; missedCalls: any[] }> {
        try {
            const res = await crmApi.get('/api/v1/telephony/dashboard-calls');
            return res.data || { activeCalls: [], queuedCalls: [], missedCalls: [] };
        } catch {
            return { activeCalls: [], queuedCalls: [], missedCalls: [] };
        }
    },

    async getLeads(): Promise<any[]> {
        try {
            const res = await crmApi.get('/api/v1/leads');
            return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        } catch {
            return [];
        }
    },

    async getOmnichannelStats(): Promise<any> {
        try {
            const res = await crmApi.get('/api/v1/omnichannel/conversations');
            return res.data || {};
        } catch {
            return {};
        }
    },
};
