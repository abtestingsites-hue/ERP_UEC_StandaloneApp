import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

const resolveErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

export const vitalsService = {
    getCaregiverVitalCharts: async (month?: string, patientId?: string, unitId?: string | null) => {
        const config: any = { params: { month, patientId } };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get('/nursing-care/caregiver-vital-charts', config);
        return res.data?.data || [];
    },
    getVitals: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        if (patientId) config.params = { patientId };
        const res = await api.get('/nursing-care/vitals', config);
        return res.data?.data || [];
    },
    saveCaregiverVitalChart: async (payload: any) => {
        const { unitId, ...requestBody } = payload;
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.post('/nursing-care/caregiver-vital-charts', requestBody, config);
        return res.data?.data;
    },
    saveVital: async (payload: any) => {
        const { unitId, ...requestBody } = payload;
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.post('/nursing-care/vitals', requestBody, config);
        return res.data?.data;
    },
    verifyVital: async ({ id, notes, unitId }: { id: string, notes?: string, unitId?: string | null }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.patch(`/nursing-care/vitals/${id}/verify`, { notes }, config);
        return res.data?.data;
    },
    uploadPhoto: async (file: File, unitId?: string | null) => {
        const formData = new FormData();
        formData.append('photo', file);
        const config: any = {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(unitId ? { 'x-unit-id': unitId } : {})
            }
        };
        const res = await api.post('/nursing-care/vitals/upload-photo', formData, config);
        return res.data?.data?.photoUrl;
    },
    getMonitoringStatus: async (patientId: string, dateStr?: string, unitId?: string | null) => {
        const config: any = { params: { date: dateStr } };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get(`/nursing-care/patients/${patientId}/monitoring-status`, config);
        return res.data?.data;
    },
    getMonitoringRequirement: async (patientId: string, unitId?: string | null) => {
        const config: any = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get(`/nursing-care/patients/${patientId}/monitoring-requirements`, config);
        return res.data?.data;
    },
    upsertMonitoringRequirement: async ({ patientId, payload, unitId }: { patientId: string, payload: any, unitId?: string | null }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.post(`/nursing-care/patients/${patientId}/monitoring-requirements`, payload, config);
        return res.data?.data;
    },
    recordAttention: async ({ patientId, payload, unitId }: { patientId: string, payload: any, unitId?: string | null }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.post(`/nursing-care/patients/${patientId}/attention`, payload, config);
        return res.data?.data;
    },
    resolveAttention: async ({ id, resolutionNotes, unitId }: { id: string, resolutionNotes?: string, unitId?: string | null }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.patch(`/nursing-care/attention/${id}/resolve`, { resolutionNotes }, config);
        return res.data?.data;
    },
    getAttentionLogs: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        if (patientId) config.params = { patientId };
        const res = await api.get('/nursing-care/attention-logs', config);
        return res.data?.data || [];
    },
    getAllPatientsMonitoringStatus: async (unitId?: string | null) => {
        const config: any = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get('/nursing-care/manager/monitoring', config);
        return res.data?.data || [];
    }
};

export const useNursingCaregiverVitalCharts = (month?: string, patientId?: string, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'caregiver-vital-charts', resolvedUnitId, month, patientId],
        queryFn: () => vitalsService.getCaregiverVitalCharts(month, patientId, unitId),
        enabled: options?.enabled
    });
};

export const useNursingVitals = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'vitals', resolvedUnitId, patientId],
        queryFn: () => vitalsService.getVitals(patientId, unitId),
        enabled: options?.enabled
    });
};

export const useNursingVitalsForPatients = (patientIds: string[], unitId?: string | null) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    
    return useQueries({
        queries: patientIds.map(patientId => ({
            queryKey: ['nursing-care', 'vitals', resolvedUnitId, patientId],
            queryFn: () => vitalsService.getVitals(patientId, unitId),
            enabled: !!patientId
        }))
    });
};

export const usePatientMonitoringStatus = (patientId?: string | null, dateStr?: string, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'monitoring-status', resolvedUnitId, patientId, dateStr],
        queryFn: () => vitalsService.getMonitoringStatus(patientId!, dateStr, unitId),
        enabled: Boolean(patientId) && (options?.enabled !== false)
    });
};

export const useAllPatientsMonitoringStatus = (unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'manager-monitoring', resolvedUnitId],
        queryFn: () => vitalsService.getAllPatientsMonitoringStatus(unitId),
        enabled: options?.enabled !== false
    });
};

export const useAttentionLogs = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'attention-logs', resolvedUnitId, patientId],
        queryFn: () => vitalsService.getAttentionLogs(patientId, unitId),
        enabled: options?.enabled !== false
    });
};

export const useSaveNursingCareVital = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: vitalsService.saveVital,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'caregiver-vital-charts'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'monitoring-status'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'manager-monitoring'] });
            alert('Vital sign saved successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to save vital sign'));
        }
    });
};

export const useVerifyNursingCareVital = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: vitalsService.verifyVital,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] });
            alert('Vital sign verified successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to verify vital sign'));
        }
    });
};

export const useUploadVitalPhoto = () => {
    return useMutation({
        mutationFn: ({ file, unitId }: { file: File, unitId?: string | null }) => vitalsService.uploadPhoto(file, unitId),
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to upload photo'));
        }
    });
};

export const useRecordPatientAttention = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: vitalsService.recordAttention,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'attention-logs'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'manager-monitoring'] });
            alert('Patient attention note recorded successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to record attention note'));
        }
    });
};

export const useResolvePatientAttention = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: vitalsService.resolveAttention,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'attention-logs'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'manager-monitoring'] });
            alert('Patient attention resolved successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to resolve attention note'));
        }
    });
};

export const useUpsertMonitoringRequirement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: vitalsService.upsertMonitoringRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'monitoring-status'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'manager-monitoring'] });
            alert('Monitoring requirement configured successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to configure monitoring requirement'));
        }
    });
};
