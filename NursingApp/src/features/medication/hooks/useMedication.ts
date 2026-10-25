import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

const resolveErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

export const medicationService = {
    getMedicationSchedules: async (unitId?: string | null, patientId?: string | null) => {
        const config: any = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        if (patientId) config.params = { patientId };
        const res = await api.get('/nursing-care/medication-schedules', config);
        return res.data?.data || [];
    },
    administerMedicationDose: async ({ id, slot, remarks, assignmentId }: { id: string; slot: string; remarks?: string; assignmentId?: string }) => {
        const res = await api.patch(`/nursing-care/medication-schedules/${id}/administer`, { slot, remarks, assignmentId });
        return res.data?.data;
    },
    getMedicationLogs: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {};
        if (patientId) config.params = { patientId };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get('/nursing-care/medication-logs', config);
        return res.data?.data || [];
    }
};

export const useMedicationSchedules = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'medication-schedules', resolvedUnitId, patientId],
        queryFn: () => medicationService.getMedicationSchedules(resolvedUnitId, patientId),
        enabled: options?.enabled
    });
};

export const useAdministerMedicationDose = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: medicationService.administerMedicationDose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medication-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medication-logs'] });
            alert('Medication dose administered successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to administer medication dose'));
        }
    });
};

export const useMedicationLogs = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit');
    const resolvedUnitId = unitId || activeUnitId;
    return useQuery({
        queryKey: ['nursing-care', 'medication-logs', resolvedUnitId, patientId],
        queryFn: () => medicationService.getMedicationLogs(patientId, resolvedUnitId),
        enabled: options?.enabled
    });
};
