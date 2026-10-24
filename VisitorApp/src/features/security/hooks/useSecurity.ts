import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services/securityService';
import type { StaffTempExitPayload, CreateVehicleEntryPayload, ResidentOuting } from '../types';

const resolveErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || error?.response?.data?.error || (error?.message ? `${fallback}: ${error.message}` : fallback);
};

export const useGateQueue = () => {
    return useQuery({
        queryKey: ['security-gate-queue'],
        queryFn: securityService.getGateQueue,
        retry: false
    });
};

export const useDashboardActionQueue = () => {
    return useQuery({
        queryKey: ['security-dashboard-action-queue'],
        queryFn: securityService.getDashboardActionQueue,
        retry: false,
        refetchInterval: 15000
    });
};

export const useDailyMovementReport = (date: string) => {
    return useQuery({
        queryKey: ['security-daily-movement-report', date],
        queryFn: () => securityService.getDailyMovementReport(date),
        retry: false
    });
};

export const useSecurityDashboardSummary = () => {
    return useQuery({
        queryKey: ['security-dashboard-summary'],
        queryFn: securityService.getSecurityDashboardSummary,
        refetchInterval: 15000,
        retry: false
    });
};

export const useCheckInExpectedVisitor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.checkInExpectedVisitor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-gate-queue'] });
        },
    });
};

export const useCheckoutGateEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.checkoutGateEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-gate-queue'] });
            queryClient.invalidateQueries({ queryKey: ['security-dashboard-action-queue'] });
        },
    });
};

export const useResidentOutings = () => {
    return useQuery({
        queryKey: ['security-resident-outings'],
        queryFn: securityService.getResidentOutings,
        retry: false
    });
};

export const useRecordResidentExit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordResidentExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] });
        },
    });
};

export const useRecordResidentReturn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordResidentReturn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] });
        },
    });
};

export const useCreateResidentOuting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.createResidentOuting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] });
        },
    });
};

export const useStaffMovements = (params?: { status?: string; date?: string; staffId?: string }) => {
    return useQuery({
        queryKey: ['security-staff-movements', params],
        queryFn: () => securityService.getStaffMovements(params),
        retry: false
    });
};

export const useStaffMovement = (id: string) => {
    return useQuery({
        queryKey: ['security-staff-movements', id],
        queryFn: () => securityService.getStaffMovementById(id),
        enabled: !!id,
        retry: false
    });
};

export const useNewStaffEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordStaffEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] });
        },
    });
};

export const useStaffTempExit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordStaffTempExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] });
        },
    });
};

export const useStaffReturn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordStaffReturn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] });
        },
    });
};

export const useStaffFinalExit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordStaffFinalExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] });
        },
    });
};

export const useVehicleMovements = (params?: { status?: string; date?: string; vehicleNo?: string }) => {
    return useQuery({
        queryKey: ['security-vehicle-movements', params],
        queryFn: () => securityService.getVehicleMovements(params),
        retry: false
    });
};

export const useVehicleMovement = (id: string) => {
    return useQuery({
        queryKey: ['security-vehicle-movements', id],
        queryFn: () => securityService.getVehicleMovementById(id),
        enabled: !!id,
        retry: false
    });
};

export const useRecordVehicleEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordVehicleEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-vehicle-movements'] });
        },
    });
};

export const useRecordVehicleExit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: securityService.recordVehicleExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-vehicle-movements'] });
        },
    });
};

export const useMovementTimeline = (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
    return useQuery({
        queryKey: ['security-movement-timeline', params],
        queryFn: () => securityService.getMovementTimeline(params),
        retry: false
    });
};
