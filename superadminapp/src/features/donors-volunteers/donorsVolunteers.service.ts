import { api } from '../../services/api';
import type {
    Donation,
    CreateDonationPayload,
    Project,
    FundingAllocation,
    ProjectExpenditure,
    FundingSource,
    CreateExpenditurePayload,
    ApproveExpenditurePayload,
    RecordPaymentPayload,
    ConfirmPaymentPayload,
    ProjectCapacity,
    VolunteerMember
} from './donorsVolunteers.types';

export const donorsVolunteersService = {
    // --- 1. UNCF Donations & Donors ---
    getDonations: async (unitId?: string | null): Promise<Donation[]> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: Donation[] }>('/uncf-donations', { headers });
        return res.data?.data || [];
    },

    getDonationById: async (id: string, unitId?: string | null): Promise<Donation | null> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.get<{ success: boolean; data: Donation }>(`/uncf-donations/${id}`, { headers });
        return res.data?.data || null;
    },

    createDonation: async (payload: CreateDonationPayload, unitId?: string | null): Promise<Donation> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: Donation }>('/uncf-donations', payload, { headers });
        return res.data?.data;
    },

    markDonationReceiptSent: async (id: string, unitId?: string | null): Promise<boolean> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.patch<{ success: boolean }>(`/uncf-donations/${id}/mark-sent`, {}, { headers });
        return Boolean(res.data?.success);
    },

    // --- 2. Funding Projects ---
    getProjects: async (unitId?: string | null): Promise<Project[]> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: Project[] }>('/funding-projects/projects', { headers });
            return res.data?.data || [];
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            return [];
        }
    },

    getProjectCapacity: async (projectId: string, unitId?: string | null): Promise<ProjectCapacity | null> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: ProjectCapacity }>(`/funding-projects/projects/${projectId}/capacity`, { headers });
            return res.data?.data || null;
        } catch {
            return null;
        }
    },

    createProject: async (
        payload: { name: string; totalBudget: number; description?: string; status?: string },
        unitId?: string | null
    ): Promise<Project> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: Project }>('/funding-projects/projects', payload, { headers });
        return res.data?.data;
    },

    // --- 3. Funding Sources & Allocations ---
    getFundingSources: async (projectId?: string, unitId?: string | null): Promise<FundingSource[]> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const params = projectId ? { projectId } : undefined;
            const res = await api.get<{ success: boolean; data: FundingSource[] }>('/funding-projects/funding-sources', { headers, params });
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    getAllocations: async (unitId?: string | null): Promise<FundingAllocation[]> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: FundingAllocation[] }>('/funding-projects/funding-allocations', { headers });
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    createAllocation: async (
        payload: {
            projectId: string;
            amount: number;
            notes?: string;
            source?: string;
            sourceType?: 'DONATION' | 'GENERAL_FUND' | 'GRANT' | 'CSR_GRANT';
            sourceDonationId?: string | null;
            sourceReference?: string | null;
            idempotencyKey?: string | null;
        },
        unitId?: string | null
    ): Promise<FundingAllocation> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: FundingAllocation }>('/funding-projects/funding-allocations', payload, { headers });
        return res.data?.data;
    },

    // --- 4. Project Expenditures & Payments ---
    getExpenditures: async (unitId?: string | null): Promise<ProjectExpenditure[]> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: ProjectExpenditure[] }>('/funding-projects/project-expenditures', { headers });
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    createExpenditure: async (
        payload: CreateExpenditurePayload,
        unitId?: string | null
    ): Promise<ProjectExpenditure> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: ProjectExpenditure }>('/funding-projects/project-expenditures', payload, { headers });
        return res.data?.data;
    },

    approveExpenditure: async (
        id: string,
        payload: ApproveExpenditurePayload,
        unitId?: string | null
    ): Promise<ProjectExpenditure> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.patch<{ success: boolean; data: ProjectExpenditure }>(
            `/funding-projects/project-expenditures/${id}/approve`,
            payload,
            { headers }
        );
        return res.data?.data;
    },

    issuePaymentVoucher: async (
        id: string,
        payload: RecordPaymentPayload,
        unitId?: string | null
    ): Promise<any> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: any }>(
            `/funding-projects/project-expenditures/${id}/payments`,
            payload,
            { headers }
        );
        return res.data?.data;
    },

    recordPayment: async (
        id: string,
        payload: RecordPaymentPayload,
        unitId?: string | null
    ): Promise<any> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: any }>(
            `/funding-projects/project-expenditures/${id}/payments`,
            payload,
            { headers }
        );
        return res.data?.data;
    },

    confirmPayment: async (
        id: string,
        payload: ConfirmPaymentPayload,
        unitId?: string | null
    ): Promise<any> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: any }>(
            `/funding-projects/project-expenditures/${id}/confirm-payment`,
            payload,
            { headers }
        );
        return res.data?.data;
    },

    cancelExpenditure: async (
        id: string,
        reason: string,
        unitId?: string | null
    ): Promise<ProjectExpenditure> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: ProjectExpenditure }>(
            `/funding-projects/project-expenditures/${id}/cancel`,
            { reason },
            { headers }
        );
        return res.data?.data;
    },

    // --- 5. Volunteers & Community Outreach ---
    getVolunteers: async (unitId?: string | null): Promise<VolunteerMember[]> => {
        try {
            const headers = unitId ? { 'x-unit-id': unitId } : undefined;
            const res = await api.get<{ success: boolean; data: VolunteerMember[] }>('/funding-projects/volunteers', { headers });
            return res.data?.data || [];
        } catch (err) {
            console.error('Failed to fetch volunteers:', err);
            return [];
        }
    },

    createVolunteer: async (
        payload: {
            name: string;
            mobile?: string;
            email?: string;
            role: string;
            initiative?: string;
            availability?: string;
            status?: 'ACTIVE' | 'INACTIVE';
            joinedDate?: string;
        },
        unitId?: string | null
    ): Promise<VolunteerMember> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const res = await api.post<{ success: boolean; data: VolunteerMember; message: string }>(
            '/funding-projects/volunteers',
            payload,
            { headers }
        );
        return res.data?.data;
    }
};
