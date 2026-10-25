import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

export const useAssignments = (params?: { status?: string, search?: string, staffId?: string }) => {
    const { token, activeUnitId } = useAuthStore();
    return useQuery({
        queryKey: ['medical-assignments', activeUnitId, params],
        queryFn: async () => {
            if (!token) return [];
            const res = await api.get('/medical/assignments', { params });
            return res.data.data || [];
        },
        enabled: !!token,
        retry: false
    });
};

const compactPayload = (payload: any) => {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
};

const resolveErrorMessage = (error: any, fallback: string) => {
    const validationErrors = error?.response?.data?.errors;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0]?.message || fallback;
    }
    return error?.response?.data?.message || fallback;
};

export const useCreateAssignment = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();
    
    return useMutation({
        mutationFn: async (data: any) => {
            if (!token) throw new Error("No auth token");
            const res = await api.post('/medical/assignments', compactPayload(data));
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
            queryClient.invalidateQueries({ queryKey: ['medical-patients'] });
            queryClient.invalidateQueries({ queryKey: ['medical-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['my-shift'] });
            alert('Medical duty assigned successfully');
        },
        onError: (error: any) => {
            alert(resolveErrorMessage(error, 'Failed to assign medical duty'));
        }
    });
};

export const useUpdateAssignmentStatus = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();

    return useMutation({
        mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
            if (!token) throw new Error("No auth token");
            const res = await api.patch(`/medical/assignments/${id}/status`, { status, notes });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
            queryClient.invalidateQueries({ queryKey: ['my-shift'] });
        }
    });
};

export const useDeleteAssignment = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!token) throw new Error("No auth token");
            const res = await api.delete(`/medical/assignments/${id}`);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
        }
    });
};
