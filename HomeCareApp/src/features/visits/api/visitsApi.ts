import { api } from '../../../lib/axios';

export interface VisitTask {
    id: string;
    refNo?: string;
    title: string;
    description?: string;
    type?: string;
    status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
    dueDate?: string;
    completedAt?: string;
    remarks?: string;
    assignedStaffId?: string;
    enquiryId?: string;
    patientId?: string;
    metadata?: any;
    createdAt?: string;
    updatedAt?: string;
    assignedStaff?: {
        id: string;
        fullName?: string;
        user?: { name?: string };
    };
    enquiry?: {
        id: string;
        clientName?: string;
        patientName?: string;
        mobile?: string;
        address?: string;
        careRequirements?: string;
        admission?: {
            id: string;
            patientId?: string;
            patient?: {
                id: string;
                name?: string;
            };
        };
    };
}

export const visitsApi = {
    async getMyVisits(): Promise<VisitTask[]> {
        try {
            const res = await api.get('/tasks?scope=mine&homeCare=true');
            const data = res.data?.data || res.data || [];
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching caregiver visits:', error);
            throw error;
        }
    },

    async getVisitById(id: string): Promise<VisitTask | null> {
        try {
            // First try single endpoint
            const res = await api.get(`/tasks/${id}`).catch(() => null);
            if (res?.data?.data) return res.data.data;
            if (res?.data && !res.data.data && res.data.id) return res.data;

            // Fallback: lookup in list
            const listRes = await api.get('/tasks?scope=mine&homeCare=true').catch(() => ({ data: [] }));
            const list = listRes.data?.data || listRes.data || [];
            if (Array.isArray(list)) {
                const found = list.find((t: any) => t.id === id);
                if (found) return found;
            }

            return null;
        } catch (error) {
            console.error(`Error fetching visit ${id}:`, error);
            return null;
        }
    },

    async updateVisitStatus(id: string, payload: {
        status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
        completedAt?: string | null;
        remarks?: string | null;
    }): Promise<VisitTask> {
        const res = await api.patch(`/tasks/${id}/status`, payload);
        return res.data?.data || res.data;
    }
};
