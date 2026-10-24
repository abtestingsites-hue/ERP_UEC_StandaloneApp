import { api } from '../../services/api';
import type {
    AdmissionRecord,
    Patient,
    CreateAdmissionPayload,
    CreatePatientPayload,
    ExistingPatientPayload,
    ServiceClosure,
    MasterOption
} from './admissions.types';

export const admissionsService = {
    // Admissions
    async listAdmissions(params?: { unitId?: string | null; allUnits?: boolean; status?: string; search?: string }): Promise<AdmissionRecord[]> {
        const config: { params?: Record<string, string | boolean>; headers?: Record<string, string> } = {};
        const queryParams: Record<string, string | boolean> = {};

        if (params?.allUnits) {
            queryParams.allUnits = 'true';
        } else if (params?.unitId) {
            config.headers = { 'x-unit-id': params.unitId };
        }

        if (params?.status) {
            queryParams.status = params.status;
        }

        if (params?.search) {
            queryParams.search = params.search;
        }

        if (Object.keys(queryParams).length > 0) {
            config.params = queryParams;
        }

        const response = await api.get<{ success: boolean; data: AdmissionRecord[] }>('/operations/admissions', config);
        return response.data?.data || [];
    },

    async createAdmission(payload: CreateAdmissionPayload): Promise<AdmissionRecord> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) {
            config.headers = { 'x-unit-id': payload.unitId };
        }
        const response = await api.post<{ success: boolean; data: AdmissionRecord }>('/operations/admissions', payload, config);
        return response.data?.data;
    },

    // Patients
    async listPatients(params?: { unitId?: string | null; allUnits?: boolean }): Promise<Patient[]> {
        const config: { params?: Record<string, string | boolean>; headers?: Record<string, string> } = {};
        if (params?.allUnits) {
            config.params = { allUnits: 'true' };
        } else if (params?.unitId) {
            config.headers = { 'x-unit-id': params.unitId };
        }
        const response = await api.get<{ success: boolean; data: Patient[] }>('/operations/patients', config);
        return response.data?.data || [];
    },

    async getPatient(id: string): Promise<Patient> {
        const response = await api.get<{ success: boolean; data: Patient }>(`/operations/patients/${id}`);
        return response.data?.data;
    },

    async createPatient(payload: CreatePatientPayload): Promise<Patient> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) {
            config.headers = { 'x-unit-id': payload.unitId };
        }
        const response = await api.post<{ success: boolean; data: Patient }>('/operations/patients', payload, config);
        return response.data?.data;
    },

    // Fast-track Existing Resident Onboarding
    async createExistingPatient(payload: ExistingPatientPayload): Promise<Record<string, unknown>> {
        const response = await api.post<{ success: boolean; data: Record<string, unknown> }>('/enquiry/admissions/existing-patient', payload);
        return response.data?.data;
    },

    // Service Closing Agreements / Relieving & Discharge
    async listExecutedClosures(): Promise<ServiceClosure[]> {
        const response = await api.get<{ success: boolean; data: ServiceClosure[] }>('/closing-agreements?status=EXECUTED');
        return response.data?.data || [];
    },

    async startOrFetchClosure(admissionId: string): Promise<ServiceClosure> {
        const response = await api.post<{ success: boolean; data: ServiceClosure }>(`/closing-agreements/admission/${admissionId}`);
        return response.data?.data;
    },

    async updateClearance(closureId: string, type: 'MEDICAL' | 'FINANCE' | 'ASSET', notes?: string): Promise<ServiceClosure> {
        const response = await api.patch<{ success: boolean; data: ServiceClosure }>(`/closing-agreements/${closureId}/clearance`, {
            type,
            notes: notes || 'Cleared via SuperAdminApp console'
        });
        return response.data?.data;
    },

    async executeClosure(closureId: string, closingRemarks?: string): Promise<ServiceClosure> {
        const response = await api.post<{ success: boolean; data: ServiceClosure }>(`/closing-agreements/${closureId}/execute`, {
            closingRemarks: closingRemarks || 'Discharge and relieving executed via SuperAdminApp'
        });
        return response.data?.data;
    },

    // Facility Master Data
    async getMasterUnits(): Promise<MasterOption[]> {
        try {
            const response = await api.get<{ success: boolean; data: Array<{ id?: string; code?: string; name?: string; shortName?: string }> }>('/master/units');
            const list = response.data?.data || [];
            return list.map((item) => ({
                id: item.id || item.code || '',
                name: item.name || item.code || item.id || 'Unit',
                code: item.code,
                shortName: item.shortName || item.code
            }));
        } catch {
            return [];
        }
    },

    async getMasterFloors(unitId: string): Promise<MasterOption[]> {
        if (!unitId) return [];
        try {
            const response = await api.get<{ success: boolean; data: Array<{ id?: string; name?: string } | string> }>(`/master/floors?unitId=${encodeURIComponent(unitId)}`);
            const list = response.data?.data || [];
            return list.map((item) => ({
                id: typeof item === 'string' ? item : item.id || item.name || '',
                name: typeof item === 'string' ? item : item.name || item.id || 'Floor'
            }));
        } catch {
            return [];
        }
    },

    async getMasterRooms(unitId: string, floor?: string): Promise<MasterOption[]> {
        if (!unitId) return [];
        try {
            let url = `/master/rooms?unitId=${encodeURIComponent(unitId)}`;
            if (floor) {
                url += `&floor=${encodeURIComponent(floor)}`;
            }
            const response = await api.get<{ success: boolean; data: Array<{ id: string; roomNumber?: string; name?: string; capacity?: number; floor?: string }> }>(url);
            const list = response.data?.data || [];
            return list.map((item) => ({
                id: item.id,
                name: item.roomNumber || item.name || `Room ${item.id}`,
                capacity: item.capacity,
                floor: item.floor
            }));
        } catch {
            return [];
        }
    },

    async getMasterBeds(roomId: string): Promise<MasterOption[]> {
        if (!roomId) return [];
        try {
            const response = await api.get<{ success: boolean; data: Array<{ id?: string; name?: string } | string> }>(`/master/beds?roomId=${encodeURIComponent(roomId)}`);
            const list = response.data?.data || [];
            return list.map((item) => ({
                id: typeof item === 'string' ? item : item.id || item.name || '',
                name: typeof item === 'string' ? item : item.name || item.id || 'Bed'
            }));
        } catch {
            return [];
        }
    }
};
