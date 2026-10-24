import { api } from '../../services/api';
import type {
    ServiceContract,
    HomeCareAdmission,
    HomeCareAllocation,
    HomeCareEnquiry,
    VisitTask,
    CaregiverStaff,
    CreateContractPayload,
    UpdateContractPayload,
    CreateAllocationPayload,
    SaveVitalsPayload,
    SaveCareNotesPayload,
    ServiceClosureRecord,
    FinanceInvoiceItem
} from './homeCare.types';

const buildHeaders = (unitId?: string | null) => {
    if (unitId) {
        return { 'x-unit-id': unitId };
    }
    return {};
};

export const homeCareService = {
    // ----------------------------------------------------
    // 1. ADMISSIONS & CONTRACTS
    // ----------------------------------------------------
    async getAdmissions(unitId?: string | null): Promise<HomeCareAdmission[]> {
        const headers = buildHeaders(unitId);
        const params: Record<string, string> = {};
        if (unitId) params.unitId = unitId;

        const res = await api.get('/enquiry/admissions', { headers, params }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    async getAdmissionContract(admissionId: string, unitId?: string | null): Promise<ServiceContract | null> {
        if (!admissionId) return null;
        const headers = buildHeaders(unitId);
        const res = await api.get(`/service-contracts/admission/${admissionId}`, { headers }).catch(() => null);
        if (!res || !res.data) return null;
        const payload = res.data;
        if (payload && typeof payload === 'object' && 'data' in payload) {
            const c = (payload as { data: ServiceContract }).data;
            return (c && typeof c === 'object' && c.id) ? c : null;
        }
        return (payload && typeof payload === 'object' && (payload as ServiceContract).id) ? payload as ServiceContract : null;
    },

    async createContract(payload: CreateContractPayload): Promise<ServiceContract> {
        const headers = buildHeaders(payload.unitId);
        const res = await api.post('/service-contracts', payload, { headers });
        return res.data?.data || res.data;
    },

    async updateContract(id: string, payload: UpdateContractPayload, unitId?: string | null): Promise<ServiceContract> {
        const headers = buildHeaders(unitId);
        const res = await api.patch(`/service-contracts/${id}`, payload, { headers });
        return res.data?.data || res.data;
    },

    async activateContract(id: string, unitId?: string | null): Promise<ServiceContract> {
        const headers = buildHeaders(unitId);
        const res = await api.post(`/service-contracts/${id}/activate`, {}, { headers });
        return res.data?.data || res.data;
    },

    // ----------------------------------------------------
    // 2. ALLOCATIONS
    // ----------------------------------------------------
    async getAllocations(unitId?: string | null): Promise<HomeCareAllocation[]> {
        const headers = buildHeaders(unitId);
        const params: Record<string, string> = {};
        if (unitId) params.unitId = unitId;

        const res = await api.get('/allocation/home-care', { headers, params }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    async createAllocation(payload: CreateAllocationPayload): Promise<HomeCareAllocation> {
        const headers = buildHeaders(payload.unitId);
        const res = await api.post('/allocation', {
            type: 'HOME_CARE',
            status: 'ALLOCATED',
            ...payload
        }, { headers });
        return res.data?.data || res.data;
    },

    async updateAllocation(id: string, payload: Record<string, unknown>, unitId?: string | null): Promise<HomeCareAllocation> {
        const headers = buildHeaders(unitId);
        const res = await api.patch(`/allocation/${id}`, payload, { headers });
        return res.data?.data || res.data;
    },

    // ----------------------------------------------------
    // 3. ENQUIRIES & SERVICE REQUIREMENTS
    // ----------------------------------------------------
    async getEnquiries(filters?: { status?: string; search?: string }, unitId?: string | null): Promise<HomeCareEnquiry[]> {
        const headers = buildHeaders(unitId);
        const params: Record<string, string> = {};
        if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
        if (filters?.search) params.search = filters.search;
        if (unitId) params.unitId = unitId;

        const res = await api.get('/enquiry', { headers, params }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    async createEnquiry(payload: Record<string, unknown>, unitId?: string | null): Promise<HomeCareEnquiry> {
        const headers = buildHeaders(unitId);
        const res = await api.post('/enquiry', payload, { headers });
        return res.data?.data || res.data;
    },

    async updateEnquiry(id: string, payload: Record<string, unknown>, unitId?: string | null): Promise<HomeCareEnquiry> {
        const headers = buildHeaders(unitId);
        const res = await api.put(`/enquiry/${id}`, payload, { headers });
        return res.data?.data || res.data;
    },

    // ----------------------------------------------------
    // 4. CAREGIVER STAFF
    // ----------------------------------------------------
    async getCaregiverStaff(unitId?: string | null): Promise<CaregiverStaff[]> {
        const headers = buildHeaders(unitId);
        const [hrRes, medRes] = await Promise.all([
            api.get('/hr/staff?scope=all', { headers }).catch(() => null),
            api.get('/medical/staff', { headers }).catch(() => null)
        ]);

        const hrList = Array.isArray(hrRes?.data?.data) ? hrRes.data.data : Array.isArray(hrRes?.data) ? hrRes.data : [];
        const medList = Array.isArray(medRes?.data?.data) ? medRes.data.data : Array.isArray(medRes?.data) ? medRes.data : [];

        const map = new Map<string, CaregiverStaff>();
        for (const s of [...hrList, ...medList]) {
            if (s && s.id && !map.has(s.id)) {
                map.set(s.id, {
                    id: s.id,
                    firstName: s.firstName || s.name || 'Staff',
                    lastName: s.lastName,
                    designation: s.designation || s.role?.name || s.role,
                    department: s.department,
                    status: s.status,
                    mobile: s.mobile,
                    unitId: s.unitId,
                    user: s.user
                });
            }
        }

        const merged = Array.from(map.values());
        // Return active caregivers (or all staff if designations vary)
        const caregivers = merged.filter((st) => {
            const status = String(st.status || '').toUpperCase();
            if (status === 'TERMINATED' || status === 'RESIGNED') return false;
            const desig = String(st.designation || '').trim().toLowerCase();
            return desig.includes('caregiver') || desig.includes('nurse') || desig.includes('attendant');
        });

        return caregivers.length > 0 ? caregivers : merged;
    },

    // ----------------------------------------------------
    // 5. ROSTER & VISITS (TASKS)
    // ----------------------------------------------------
    async getTasks(params?: { homeCare?: boolean; today?: boolean; scope?: string }, unitId?: string | null): Promise<VisitTask[]> {
        const headers = buildHeaders(unitId);
        const queryParams: Record<string, string> = { homeCare: 'true' };
        if (params?.today) queryParams.today = 'true';
        if (params?.scope) queryParams.scope = params.scope;
        if (unitId) queryParams.unitId = unitId;

        const res = await api.get('/tasks', { headers, params: queryParams }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    async getMyVisits(unitId?: string | null): Promise<VisitTask[]> {
        return this.getTasks({ scope: 'mine', homeCare: true }, unitId);
    },

    async getVisitById(id: string, unitId?: string | null): Promise<VisitTask | null> {
        const headers = buildHeaders(unitId);
        const res = await api.get(`/tasks/${id}`, { headers }).catch(() => null);
        if (res?.data?.data) return res.data.data;
        if (res?.data && !res.data.data && res.data.id) return res.data;
        return null;
    },

    async updateVisitStatus(id: string, payload: {
        status: string;
        completedAt?: string | null;
        remarks?: string | null;
    }, unitId?: string | null): Promise<VisitTask> {
        const headers = buildHeaders(unitId);
        const res = await api.patch(`/tasks/${id}/status`, payload, { headers });
        return res.data?.data || res.data;
    },

    // ----------------------------------------------------
    // 6. CARE DELIVERY (VITALS & CARE NOTES)
    // ----------------------------------------------------
    async recordVitals(payload: SaveVitalsPayload): Promise<unknown> {
        const headers = buildHeaders(payload.unitId);
        const res = await api.post('/nursing-care/vitals', {
            shift: payload.shift || 'MORNING',
            ...payload
        }, { headers });
        return res.data;
    },

    async getPatientVitals(patientId: string, unitId?: string | null): Promise<any[]> {
        if (!patientId) return [];
        const headers = buildHeaders(unitId);
        const res = await api.get('/nursing-care/vitals', { headers, params: { patientId } }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    async recordCareNotes(payload: SaveCareNotesPayload): Promise<unknown> {
        const headers = buildHeaders(payload.unitId);
        const res = await api.post('/patient-care/adl-records', {
            activityCategory: 'DAILY_CARE_NOTES',
            careDate: payload.careDate || new Date().toISOString().split('T')[0],
            ...payload
        }, { headers });
        return res.data;
    },

    async getPatientCareNotes(patientId: string, unitId?: string | null): Promise<any[]> {
        if (!patientId) return [];
        const headers = buildHeaders(unitId);
        const res = await api.get('/patient-care/adl-records', { headers, params: { patientId } }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    },

    // ----------------------------------------------------
    // 7. CONTRACT CLOSURE & CLEARANCE
    // ----------------------------------------------------
    async getClosure(admissionId: string, unitId?: string | null): Promise<ServiceClosureRecord | null> {
        if (!admissionId) return null;
        const headers = buildHeaders(unitId);
        const res = await api.get(`/closure/admission/${admissionId}`, { headers }).catch(() => null);
        return res?.data?.data || res?.data || null;
    },

    async clearClosureRequirement(
        closureId: string,
        type: 'MEDICAL' | 'FINANCE' | 'ASSET',
        notes?: string,
        unitId?: string | null
    ): Promise<ServiceClosureRecord> {
        const headers = buildHeaders(unitId);
        const res = await api.patch(`/closure/${closureId}/clearance`, { type, notes }, { headers });
        return res.data?.data || res.data;
    },

    async executeServiceClosure(
        closureId: string,
        closingRemarks: string,
        unitId?: string | null
    ): Promise<ServiceClosureRecord> {
        const headers = buildHeaders(unitId);
        const res = await api.post(`/closure/${closureId}/execute`, { closingRemarks }, { headers });
        return res.data?.data || res.data;
    },

    // ----------------------------------------------------
    // 8. BILLING & INVOICING HANDOFF
    // ----------------------------------------------------
    async createContractInvoice(payload: {
        amount: number;
        clientName: string;
        category?: string;
        allocationId?: string | null;
        mode?: string;
        remarks?: string;
        date?: string;
        unitId?: string | null;
    }): Promise<any> {
        const headers = buildHeaders(payload.unitId);
        const res = await api.post('/accounts/invoice', {
            amount: payload.amount,
            category: payload.category || 'Home Care Service',
            clientName: payload.clientName,
            allocationId: payload.allocationId || null,
            mode: payload.mode || 'Bank Transfer',
            remarks: payload.remarks || 'Contract billing',
            date: payload.date || new Date().toISOString()
        }, { headers });
        return res.data?.data || res.data;
    },

    async getInvoices(unitId?: string | null): Promise<FinanceInvoiceItem[]> {
        const headers = buildHeaders(unitId);
        const params: Record<string, string> = {};
        if (unitId) params.scope = unitId;
        const res = await api.get('/accounts/invoice', { headers, params }).catch(() => ({ data: [] }));
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
    }
};

