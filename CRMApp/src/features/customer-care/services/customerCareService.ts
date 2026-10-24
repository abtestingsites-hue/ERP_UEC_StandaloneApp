import { api } from '../../../lib/axios';

export interface Complaint {
    id: string;
    ticketNo: string;
    date: string;
    clientName: string;
    category: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    description: string;
    assignedTo?: string;
    assignedStaffId?: string;
    resolutionNotes?: string;
    resolvedAt?: string;
    closedAt?: string;
    unitId?: string;
}

export interface PendingFeedbackItem {
    id: string;
    ref: string;
    allocationRef?: string;
    service: string;
    clientName: string;
    patientName?: string;
    status: string;
    paymentStatus?: string;
    allocatedDetails?: string;
    unitId?: string;
}

export interface ServiceHistoryItem {
    id: string;
    ref: string;
    allocationRef?: string;
    service: string;
    clientName: string;
    patientName?: string;
    status: string;
    paymentStatus?: string;
    invoiceNo?: string;
    receiptNo?: string;
    paidAmount?: number;
    feedbackStatus?: string;
    feedbackRating?: number;
    feedbackComments?: string;
    complaintRefNo?: string;
    finalClosureStatus?: string;
    allocatedDetails?: string;
    unitId?: string;
}

export interface WelcomeCall {
    id: string;
    ref?: string;
    clientId?: string;
    clientName?: string;
    service?: string;
    status: 'PENDING' | 'COMPLETED' | string;
    notes?: string;
    callDate?: string;
    createdAt?: string;
}

const formatDate = (value?: string) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
};

const normalizePriority = (value?: string): Complaint['priority'] => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (normalized === 'high') return 'High';
    if (normalized === 'medium') return 'Medium';
    return 'Low';
};

const normalizeStatus = (value?: string): Complaint['status'] => {
    const normalized = String(value || '').toUpperCase().replace(/[\s-]+/g, '_');
    if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'In Progress';
    if (normalized === 'RESOLVED') return 'Resolved';
    if (normalized === 'CLOSED') return 'Closed';
    return 'Open';
};

const mapComplaint = (c: any): Complaint => ({
    id: c.id,
    ticketNo: c.ticketNo || c.refNo || c.ref || String(c.id || '').split('-')[0],
    date: c.date || formatDate(c.createdAt),
    clientName: c.clientName || c.metadata?.clientName || 'Walk-in Client',
    category: c.category || c.type || c.metadata?.category || 'General Complaint',
    priority: normalizePriority(c.priority || c.metadata?.priority),
    status: normalizeStatus(c.status),
    description: c.description || '',
    assignedTo: c.assignedTo || c.staff || c.metadata?.assignedStaffName || c.metadata?.assignedTo || undefined,
    assignedStaffId: c.metadata?.assignedStaffId || undefined,
    resolutionNotes: c.metadata?.resolutionNotes || undefined,
    resolvedAt: c.metadata?.resolvedAt || undefined,
    closedAt: c.metadata?.closedAt || undefined,
    unitId: c.unitId || 'U-001'
});

const isDemoOrSeedRecord = (row: any) =>
    [row?.id, row?.ref, row?.refNo, row?.ticketNo, row?.allocationRef].some((value) =>
        /(^|[^a-z0-9])(DEMO|SEED)[-_]/i.test(String(value || ''))
    );

export const customerCareService = {
    getComplaints: async (): Promise<Complaint[]> => {
        try {
            const res = await api.get('/customer-care/complaints');
            const complaints = Array.isArray(res.data?.data)
                ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row))
                : [];
            return complaints.map(mapComplaint);
        } catch (error) {
            console.warn('Failed to fetch complaints:', error);
            return [];
        }
    },
    createComplaint: async (data: { clientName: string; category: string; priority: string; description: string; unitId?: string }): Promise<Complaint> => {
        const res = await api.post('/customer-care/complaints', data);
        return mapComplaint(res.data?.data);
    },
    updateComplaintWorkflow: async (
        complaintId: string,
        data: { status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED'; assignedTo?: string; resolutionNotes?: string }
    ): Promise<Complaint> => {
        const res = await api.patch(`/customer-care/complaints/${complaintId}/workflow`, data);
        return mapComplaint(res.data?.data);
    },
    getPendingFeedback: async (): Promise<PendingFeedbackItem[]> => {
        try {
            const res = await api.get('/customer-care/pending-feedback');
            return Array.isArray(res.data?.data) ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row)) : [];
        } catch (error) {
            console.warn('Failed to fetch pending feedback:', error);
            return [];
        }
    },
    getServiceHistory: async (): Promise<ServiceHistoryItem[]> => {
        try {
            const res = await api.get('/customer-care/service-history');
            return Array.isArray(res.data?.data) ? res.data.data.filter((row: any) => !isDemoOrSeedRecord(row)) : [];
        } catch (error) {
            console.warn('Failed to fetch service history:', error);
            return [];
        }
    },
    recordServiceFeedback: async (allocationId: string, data: { rating: number; comments?: string }): Promise<any> => {
        const res = await api.post(`/customer-care/service-history/${allocationId}/feedback`, data);
        return res.data?.data;
    },
    getWelcomeCalls: async (): Promise<WelcomeCall[]> => {
        try {
            const res = await api.get('/welcome-call');
            const data = res.data?.data || res.data;
            if (Array.isArray(data)) return data;
            const resBus = await api.get('/business');
            return Array.isArray(resBus.data?.data) ? resBus.data.data : [];
        } catch (error) {
            console.warn('Failed to fetch welcome calls via /welcome-call, trying /business:', error);
            try {
                const resBus = await api.get('/business');
                return Array.isArray(resBus.data?.data) ? resBus.data.data : [];
            } catch {
                return [];
            }
        }
    },
    updateWelcomeCall: async (id: string, data: { status?: string; notes?: string; callDate?: string }): Promise<any> => {
        try {
            const res = await api.patch(`/welcome-call/${id}`, data);
            return res.data?.data;
        } catch (error) {
            console.warn('Failed to update welcome call via /welcome-call, trying /business:', error);
            const resBus = await api.put(`/business/${id}`, data);
            return resBus.data?.data;
        }
    }
};
