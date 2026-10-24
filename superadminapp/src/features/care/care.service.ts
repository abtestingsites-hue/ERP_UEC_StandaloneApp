import { api } from '../../services/api';
import type {
    MedicalAssignment,
    CreateAssignmentPayload,
    MedicalStaff,
    CarePatient,
    VitalRecord,
    CreateVitalPayload,
    CaregiverVitalChart,
    MonitoringStatusItem,
    AttentionLog,
    MedicationSchedule,
    MedicationLog,
    ADLRecord,
    NutritionPlan,
    NutritionRecord,
    IncidentReport,
    StockIssueRequest,
    MedicalDashboardSummary,
    CaregiverRevenueSheet
} from './care.types';

export const careService = {
    // Medical Dashboard
    async getMedicalDashboard(unitId?: string | null): Promise<MedicalDashboardSummary> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: Record<string, unknown> }>('/medical/dashboard', config);
            const data = res.data?.data || {};
            return {
                activeStaffCount: Number(data.activeStaffCount ?? data.activeStaff ?? 0),
                totalAssignments: Number(data.totalAssignments ?? data.assignmentsCount ?? 0),
                inProgressCount: Number(data.inProgressCount ?? 0),
                waitingApprovalCount: Number(data.waitingApprovalCount ?? data.pendingApprovalCount ?? 0),
                approvedCount: Number(data.approvedCount ?? 0),
                criticalAlertsCount: Number(data.criticalAlertsCount ?? data.alertsCount ?? 0),
            };
        } catch {
            return {
                activeStaffCount: 0,
                totalAssignments: 0,
                inProgressCount: 0,
                waitingApprovalCount: 0,
                approvedCount: 0,
                criticalAlertsCount: 0,
            };
        }
    },

    // My Shift
    async getMyShift(unitId?: string | null): Promise<{ assignments: MedicalAssignment[]; tasks: unknown[] }> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: { assignments?: MedicalAssignment[]; tasks?: unknown[] } }>('/medical/my-shift', config);
            return {
                assignments: res.data?.data?.assignments || [],
                tasks: res.data?.data?.tasks || []
            };
        } catch {
            return { assignments: [], tasks: [] };
        }
    },

    // Medical Staff
    async getMedicalStaff(unitId?: string | null): Promise<MedicalStaff[]> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: MedicalStaff[] }>('/medical/staff', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    // Active Patients for Medical / Care
    async getActivePatients(unitId?: string | null): Promise<CarePatient[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {
            params: { status: 'ACTIVE' }
        };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{
                success: boolean;
                data: Array<{
                    id?: string;
                    status?: string;
                    unitId?: string;
                    room?: string | { roomNumber?: string };
                    bed?: string | { bedNumber?: string };
                    admittedAt?: string;
                    createdAt?: string;
                    patient?: {
                        id?: string;
                        name?: string;
                        elderId?: string;
                        unitId?: string;
                        age?: number;
                        gender?: string;
                        bloodGroup?: string;
                        phone?: string;
                        emergencyContact?: string;
                    };
                }>;
            }>('/operations/admissions', config);
            const records = Array.isArray(res.data?.data) ? res.data.data : [];
            const patientMap = new Map<string, CarePatient>();

            for (const r of records) {
                if (r.status !== 'ACTIVE') continue;
                const p = r.patient;
                if (!p?.id) continue;
                if (!patientMap.has(p.id)) {
                    const roomVal = typeof r.room === 'string' ? r.room : r.room?.roomNumber;
                    const bedVal = typeof r.bed === 'string' ? r.bed : r.bed?.bedNumber;
                    patientMap.set(p.id, {
                        id: p.id,
                        name: p.name || 'Unnamed Resident',
                        elderId: p.elderId || '',
                        unitId: r.unitId || p.unitId,
                        room: roomVal,
                        bed: bedVal,
                        age: p.age,
                        gender: p.gender,
                        bloodGroup: p.bloodGroup,
                        phone: p.phone,
                        emergencyContact: p.emergencyContact,
                        admittedAt: r.admittedAt || r.createdAt,
                        admissionId: r.id
                    });
                }
            }
            return Array.from(patientMap.values());
        } catch {
            return [];
        }
    },

    async getStaffAssignedPatients(unitId?: string | null): Promise<CarePatient[]> {
        try {
            const shiftData = await this.getMyShift(unitId);
            const map = new Map<string, CarePatient>();
            for (const a of shiftData.assignments) {
                const pId = a.patientId || a.patient?.id;
                if (!pId) continue;
                if (!map.has(pId)) {
                    map.set(pId, {
                        id: pId,
                        name: a.patient?.name || 'Assigned Resident',
                        elderId: a.patient?.elderId || '',
                        room: a.location || undefined,
                        bed: undefined,
                        unitId: a.unitId
                    });
                }
            }
            return Array.from(map.values());
        } catch {
            return [];
        }
    },

    // Assignments
    async getAssignments(params?: {
        status?: string;
        staffId?: string;
        search?: string;
        unitId?: string | null;
    }): Promise<MedicalAssignment[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {
            params: {}
        };
        if (params?.status && params.status !== 'ALL') config.params!.status = params.status;
        if (params?.staffId && params.staffId !== 'ALL') config.params!.staffId = params.staffId;
        if (params?.search) config.params!.search = params.search;
        if (params?.unitId) config.headers = { 'x-unit-id': params.unitId };

        const res = await api.get<{ success: boolean; data: MedicalAssignment[] }>('/medical/assignments', config);
        return res.data?.data || [];
    },

    async getAssignmentById(id: string, unitId?: string | null): Promise<MedicalAssignment> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get<{ success: boolean; data: MedicalAssignment }>(`/medical/assignments/${id}`, config);
        return res.data?.data;
    },

    async createAssignment(payload: CreateAssignmentPayload): Promise<MedicalAssignment> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) config.headers = { 'x-unit-id': payload.unitId };
        const res = await api.post<{ success: boolean; data: MedicalAssignment }>('/medical/assignments', payload, config);
        return res.data?.data;
    },

    async updateAssignmentStatus(
        id: string,
        status: string,
        notes?: string,
        unitId?: string | null
    ): Promise<MedicalAssignment> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: MedicalAssignment }>(
            `/medical/assignments/${id}/status`,
            { status, notes },
            config
        );
        return res.data?.data;
    },

    async updateAssignmentMetadata(
        id: string,
        metadata: Record<string, unknown>,
        unitId?: string | null
    ): Promise<MedicalAssignment> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: MedicalAssignment }>(
            `/medical/assignments/${id}`,
            { metadata },
            config
        );
        return res.data?.data;
    },

    async deleteAssignment(id: string, unitId?: string | null): Promise<void> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        await api.delete(`/medical/assignments/${id}`, config);
    },

    // Vitals
    async getVitals(patientId?: string | null, unitId?: string | null): Promise<VitalRecord[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get<{ success: boolean; data: VitalRecord[] }>('/nursing-care/vitals', config);
        return res.data?.data || [];
    },

    async saveVital(payload: CreateVitalPayload): Promise<VitalRecord> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) config.headers = { 'x-unit-id': payload.unitId };
        const bp = (payload.systolic && payload.diastolic) ? `${payload.systolic}/${payload.diastolic}` : undefined;
        const body = {
            ...payload,
            bp,
            temp: payload.temperature,
            spO2: payload.spo2,
            bloodSugar: payload.bloodSugar !== undefined && payload.bloodSugar !== null ? String(payload.bloodSugar) : ''
        };
        const res = await api.post<{ success: boolean; data: VitalRecord }>('/nursing-care/vitals', body, config);
        return res.data?.data;
    },

    async verifyVital(id: string, notes?: string, unitId?: string | null): Promise<VitalRecord> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: VitalRecord }>(`/nursing-care/vitals/${id}/verify`, { notes }, config);
        return res.data?.data;
    },

    async getCaregiverVitalCharts(month?: string, patientId?: string, unitId?: string | null): Promise<CaregiverVitalChart[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (month || patientId) config.params = { ...(month ? { month } : {}), ...(patientId ? { patientId } : {}) };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get<{ success: boolean; data: CaregiverVitalChart[] }>('/nursing-care/caregiver-vital-charts', config);
        return res.data?.data || [];
    },

    // Patient Monitoring & Attention Alerts
    async getAllMonitoringStatus(unitId?: string | null): Promise<MonitoringStatusItem[]> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: any }>('/nursing-care/manager/monitoring', config);
            const data = res.data?.data;
            const list: any[] = Array.isArray(data) ? data : (data?.patients && Array.isArray(data.patients) ? data.patients : []);
            return list.map((item: any) => {
                let statusBadge: 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'STABLE';
                const ms = item.monitoringStatus;
                if (typeof ms === 'string' && ['STABLE', 'NEEDS_ATTENTION', 'CRITICAL'].includes(ms)) {
                    statusBadge = ms as any;
                } else if (ms && typeof ms === 'object') {
                    if (Number(ms.overdueCount || 0) > 0) {
                        statusBadge = 'CRITICAL';
                    } else if (Number(ms.dueCount || 0) > 0) {
                        statusBadge = 'NEEDS_ATTENTION';
                    } else {
                        statusBadge = 'STABLE';
                    }
                }
                return {
                    patientId: item.patientId || item.id,
                    patientName: item.patientName || item.name || 'Unknown Resident',
                    elderId: item.elderId,
                    monitoringStatus: statusBadge,
                    lastRecordedAt: item.lastVital?.recordedAt || item.lastRecordedAt,
                    vitalsSummary: item.lastVital ? `BP: ${item.lastVital.bp || '-'}, SpO2: ${item.lastVital.spO2 || '-'}%` : undefined,
                    openAttentionCount: Number(item.openAttentionCount ?? item.attentions?.length ?? 0)
                };
            });
        } catch {
            return [];
        }
    },

    async getAttentionLogs(unitId?: string | null): Promise<AttentionLog[]> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: AttentionLog[] }>('/nursing-care/attention-logs', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async resolveAttention(id: string, resolutionNotes?: string, unitId?: string | null): Promise<void> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        await api.patch(`/nursing-care/attention/${id}/resolve`, { resolutionNotes }, config);
    },

    // Caregiver Patient Item Revenue Sheets
    async getCaregiverRevenueSheets(month?: string, unitId?: string | null): Promise<CaregiverRevenueSheet[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (month) config.params = { month };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: CaregiverRevenueSheet[] }>('/patient-billing/caregiver-revenue-sheets', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async saveCaregiverRevenueSheet(payload: Partial<CaregiverRevenueSheet>, unitId?: string | null): Promise<CaregiverRevenueSheet> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.post<{ success: boolean; data: CaregiverRevenueSheet }>('/patient-billing/caregiver-revenue-sheets', payload, config);
        return res.data?.data;
    },

    async getPatientBillingServices(unitId?: string | null): Promise<Array<{ allocationId: string; patientId: string; patientName: string; clientName?: string; serviceLabel: string }>> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: any[] }>('/patient-billing/services', config);
            return (res.data?.data || []).map((s: any) => ({
                allocationId: s.allocationId || s.id,
                patientId: s.patientId || s.patient?.id,
                patientName: s.patientName || s.patient?.name || 'Inpatient',
                clientName: s.clientName || s.client?.name,
                serviceLabel: s.serviceLabel || s.service || 'In-House Care'
            }));
        } catch {
            return [];
        }
    },

    // Medication Schedules & Logs
    async getMedicationSchedules(patientId?: string | null, unitId?: string | null): Promise<MedicationSchedule[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: MedicationSchedule[] }>('/nursing-care/medication-schedules', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async createMedicationSchedule(payload: {
        patientId?: string;
        patientName?: string;
        medicineName: string;
        dose: string;
        frequency: string;
        times: string[];
        morning?: boolean;
        afternoon?: boolean;
        evening?: boolean;
        night?: boolean;
        startDate?: string;
        notes?: string;
        unitId?: string | null;
    }): Promise<MedicationSchedule> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) config.headers = { 'x-unit-id': payload.unitId };
        const body = {
            medicineIssueId: payload.patientId || `MED-${Date.now()}`,
            medicineName: payload.medicineName,
            patientName: payload.patientName || 'Assigned Resident',
            dose: payload.dose,
            frequency: payload.frequency,
            times: payload.times && payload.times.length > 0 ? payload.times : ['MORNING'],
            startDate: payload.startDate || new Date().toISOString().split('T')[0],
            notes: payload.notes || '',
            morning: payload.morning,
            afternoon: payload.afternoon,
            evening: payload.evening,
            night: payload.night
        };
        const res = await api.post<{ success: boolean; data: MedicationSchedule }>('/nursing-care/medication-schedules', body, config);
        return res.data?.data;
    },

    async administerMedicationDose(payload: {
        id: string;
        slot: string;
        remarks?: string;
        assignmentId?: string;
        unitId?: string | null;
    }): Promise<unknown> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) config.headers = { 'x-unit-id': payload.unitId };
        const res = await api.patch(
            `/nursing-care/medication-schedules/${payload.id}/administer`,
            { slot: payload.slot, remarks: payload.remarks, assignmentId: payload.assignmentId },
            config
        );
        return res.data?.data;
    },

    async getMedicationLogs(patientId?: string | null, unitId?: string | null): Promise<MedicationLog[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: MedicationLog[] }>('/nursing-care/medication-logs', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async verifyMedicationLog(id: string, notes?: string, unitId?: string | null): Promise<MedicationLog> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: MedicationLog }>(
            `/nursing-care/medication-logs/${id}/verify`,
            { notes },
            config
        );
        return res.data?.data;
    },

    // ADL Records
    async getAdlRecords(patientId?: string | null, unitId?: string | null): Promise<ADLRecord[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: ADLRecord[] }>('/patient-care/adl-records', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async createAdlRecord(payload: {
        patientId: string;
        activityType?: string;
        activityCategory?: string;
        status?: string;
        mobility?: string;
        hygiene?: string;
        feeding?: string;
        notes?: string;
        careDate?: string;
        assignmentId?: string;
        unitId?: string | null;
    }): Promise<ADLRecord> {
        const { unitId, ...body } = payload;
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };

        const category = body.activityCategory || body.activityType || 'DAILY_CARE';
        const st = body.status || 'COMPLETED';

        const reqPayload: Record<string, unknown> = {
            patientId: body.patientId,
            activityCategory: category,
            isMandatory: false,
            scheduledDate: body.careDate ? new Date(body.careDate).toISOString() : new Date().toISOString(),
            notes: body.notes || `${category}: ${st}`,
            mobility: body.mobility || (category === 'MOBILITY' ? st : 'INDEPENDENT'),
            hygiene: body.hygiene || (['BATHING', 'ORAL_CARE', 'DRESSING', 'TOILETING'].includes(category) ? st : 'INDEPENDENT'),
            feeding: body.feeding || (category === 'FEEDING' ? st : 'INDEPENDENT')
        };
        if (body.assignmentId) reqPayload.assignmentId = body.assignmentId;

        const res = await api.post<{ success: boolean; data: ADLRecord }>('/patient-care/adl-records', reqPayload, config);
        return res.data?.data;
    },

    async updateAdlStatus(
        id: string,
        status: string,
        verificationNotes?: string,
        assignmentId?: string,
        unitId?: string | null
    ): Promise<ADLRecord> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: ADLRecord }>(
            `/patient-care/adl-records/${id}/status`,
            { status, verificationNotes, assignmentId },
            config
        );
        return res.data?.data;
    },

    // Nutrition
    async getNutritionPlans(patientId?: string | null, unitId?: string | null): Promise<NutritionPlan[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: NutritionPlan[] }>('/patient-care/nutrition', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async getNutritionRecords(patientId?: string | null, careDate?: string | null, unitId?: string | null): Promise<NutritionRecord[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { ...(config.params || {}), patientId };
        if (careDate) config.params = { ...(config.params || {}), careDate };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: NutritionRecord[] }>('/patient-care/nutrition-records', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async createNutritionRecord(payload: {
        patientId: string;
        careDate?: string;
        meal?: string;
        mealType?: string;
        status?: string;
        consumedPercentage?: number;
        fluidsMl?: number;
        notes?: string;
        assignmentId?: string;
        unitId?: string | null;
    }): Promise<NutritionRecord> {
        const { unitId, ...body } = payload;
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };

        const mealName = body.meal || body.mealType || 'LUNCH';
        const careDateIso = body.careDate ? new Date(body.careDate).toISOString() : new Date().toISOString();
        const statusText = body.status || `${body.consumedPercentage ?? 100}% Consumed`;
        const remarksList: string[] = [];
        if (body.fluidsMl !== undefined && body.fluidsMl !== null) remarksList.push(`Fluids: ${body.fluidsMl} mL`);
        if (body.notes) remarksList.push(body.notes);

        const reqPayload: Record<string, unknown> = {
            patientId: body.patientId,
            meal: mealName,
            careDate: careDateIso,
            status: statusText,
            remarks: remarksList.join(' · ') || 'Meal intake recorded'
        };
        if (body.assignmentId) reqPayload.assignmentId = body.assignmentId;

        const res = await api.post<{ success: boolean; data: NutritionRecord }>('/patient-care/nutrition-records', reqPayload, config);
        return res.data?.data;
    },

    // Incident Reports (UEC)
    async getIncidents(patientId?: string | null, unitId?: string | null): Promise<IncidentReport[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: IncidentReport[] }>('/uec/incidents', config);
            return res.data?.data || [];
        } catch {
            return [];
        }
    },

    async createIncident(payload: {
        patientId: string;
        incidentType?: string;
        title?: string;
        severity: string;
        description: string;
        actionTaken?: string;
        date?: string;
        witnesses?: string;
        unitId?: string | null;
    }): Promise<IncidentReport> {
        const { unitId, ...body } = payload;
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };

        const title = body.title || (body.incidentType ? body.incidentType.replace(/_/g, ' ') : 'Clinical Incident');
        const dateIso = body.date ? new Date(body.date).toISOString() : new Date().toISOString();

        const reqPayload = {
            patientId: body.patientId,
            title,
            description: body.description,
            severity: body.severity,
            date: dateIso,
            witnesses: body.witnesses || undefined,
            actionTaken: body.actionTaken || undefined
        };

        const res = await api.post<{ success: boolean; data: IncidentReport }>('/uec/incidents', reqPayload, config);
        return res.data?.data;
    },

    // Medicine Stock Issue Requests (Inventory cross-domain)
    async getMedicineRequests(patientId?: string | null, unitId?: string | null): Promise<StockIssueRequest[]> {
        const config: { params?: Record<string, string>; headers?: Record<string, string> } = {
            params: { category: 'medical' }
        };
        if (patientId) config.params!.patientId = patientId;
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{
                success: boolean;
                data: Array<{
                    id: string;
                    requestNumber?: string;
                    refNo?: string;
                    patientId?: string;
                    patientName?: string;
                    patient?: { name?: string };
                    productName?: string;
                    product?: { name?: string };
                    quantity?: number;
                    status?: 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED';
                    notes?: string;
                    createdAt?: string;
                }>;
            }>('/stock/issue-requests', config);
            const items = Array.isArray(res.data?.data) ? res.data.data : [];
            return items.map((item) => ({
                id: item.id,
                requestNumber: item.requestNumber || item.refNo,
                patientId: item.patientId,
                patientName: item.patient?.name || item.patientName,
                productName: item.product?.name || item.productName || 'Medication',
                quantity: item.quantity || 1,
                status: item.status || 'PENDING',
                notes: item.notes,
                requestedAt: item.createdAt
            }));
        } catch {
            return [];
        }
    },

    async createMedicineRequest(payload: {
        productId?: string;
        productName?: string;
        quantity: number;
        patientId?: string;
        notes?: string;
        unitId?: string | null;
    }): Promise<StockIssueRequest> {
        const config: { headers?: Record<string, string> } = {};
        if (payload.unitId) config.headers = { 'x-unit-id': payload.unitId };
        const body = {
            productId: payload.productId || payload.productName || 'GENERAL_MED',
            quantity: Number(payload.quantity) || 1,
            usageType: 'PATIENT',
            patientId: payload.patientId || null,
            notes: payload.notes || ''
        };
        const res = await api.post<{ success: boolean; data: StockIssueRequest }>('/stock/issue-requests', body, config);
        return res.data?.data;
    },

    async getProducts(unitId?: string | null): Promise<Array<{ id: string; name: string; category?: string }>> {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        try {
            const res = await api.get<{ success: boolean; data: Array<{ id: string; name: string; category?: string }> }>('/product', config);
            return Array.isArray(res.data?.data) ? res.data.data : [];
        } catch {
            return [];
        }
    },

    async getPatients(unitId?: string | null): Promise<CarePatient[]> {
        return this.getActivePatients(unitId);
    }
};
