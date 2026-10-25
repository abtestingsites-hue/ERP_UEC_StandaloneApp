import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

const resolveErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

export const adlService = {
    getAdlRecords: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get('/patient-care/adl-records', config);
        return res.data?.data || [];
    },
    createAdlRecord: async (payload: any) => {
        const { unitId, assignmentId, ...requestBody } = payload;
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : {};
        if (assignmentId) requestBody.assignmentId = assignmentId;
        const res = await api.post('/patient-care/adl-records', requestBody, config);
        return res.data?.data;
    },
    updateAdlStatus: async ({ id, status, verificationNotes, unitId, assignmentId }: { id: string; status: string; verificationNotes?: string; unitId?: string | null; assignmentId?: string }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined;
        const res = await api.patch(`/patient-care/adl-records/${id}/status`, { status, verificationNotes, assignmentId }, config);
        return res.data?.data;
    }
};

export const useAdlRecords = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['patient-care', 'adl-records', resolvedUnitId, patientId],
        queryFn: () => adlService.getAdlRecords(patientId, resolvedUnitId),
        enabled: options?.enabled !== false
    });
};

export const useCreateAdlRecord = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adlService.createAdlRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'adl-records'] });
            alert('ADL record assigned successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to assign ADL record'));
        }
    });
};

export const useUpdateAdlStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adlService.updateAdlStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'adl-records'] });
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to update ADL status'));
        }
    });
};
