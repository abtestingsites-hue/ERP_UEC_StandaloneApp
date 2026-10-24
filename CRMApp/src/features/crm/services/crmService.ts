import { api } from '../../../lib/axios';

export interface B2PPartner {
    id: string;
    name: string;
    type: string;
    contact?: string;
    email?: string;
    tenantId?: string;
    unitId?: string;
    createdAt?: string;
    _count?: {
        referrals?: number;
    };
}

export interface MarketingCampaign {
    id: string;
    title: string;
    type: string;
    status: string;
    budget: number;
    leadsGen?: number;
    startDate?: string;
    endDate?: string;
    tenantId?: string;
    unitId?: string;
    createdAt?: string;
}

export interface WorkflowStage {
    key: string;
    label: string;
    status: string;
    complete: boolean;
}

export interface WorkflowTimeline {
    id: string;
    refNo: string;
    clientName: string;
    mobile: string | null;
    service: string;
    status: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
    currentStep: string;
    openItems: string[];
    summary: {
        followUps: number;
        tasks: number;
        invoices: number;
        invoiceAmount: number;
        balanceAmount?: number;
    };
    renewal?: {
        convertedEnquiryRefNo?: string | null;
    };
    stages: WorkflowStage[];
}

export const crmService = {
    getPartners: async (): Promise<B2PPartner[]> => {
        try {
            const res = await api.get('/crm/partners');
            return Array.isArray(res.data?.data) ? res.data.data : [];
        } catch (error) {
            console.warn('Failed to fetch B2P partners:', error);
            return [];
        }
    },
    createPartner: async (data: { name: string; type: string; contact?: string; email?: string }): Promise<B2PPartner> => {
        const res = await api.post('/crm/partners', data);
        return res.data?.data;
    },
    getCampaigns: async (): Promise<MarketingCampaign[]> => {
        try {
            const res = await api.get('/marketing/campaigns');
            return Array.isArray(res.data?.data) ? res.data.data : [];
        } catch (error) {
            console.warn('Failed to fetch marketing campaigns:', error);
            return [];
        }
    },
    createCampaign: async (data: { title: string; type: string; budget: number; startDate?: string; endDate?: string }): Promise<MarketingCampaign> => {
        const res = await api.post('/marketing/campaigns', data);
        return res.data?.data;
    },
    getWorkflowTimelines: async (search?: string): Promise<WorkflowTimeline[]> => {
        try {
            const res = await api.get('/workflow/timeline', { params: search ? { search } : {} });
            return Array.isArray(res.data?.data) ? res.data.data : [];
        } catch (error) {
            console.warn('Failed to fetch workflow timelines:', error);
            return [];
        }
    }
};
