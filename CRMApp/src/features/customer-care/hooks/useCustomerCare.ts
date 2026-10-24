import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerCareService } from '../services/customerCareService';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../components/Toast';

export const useComplaints = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['complaints', activeUnitId || 'unit'],
        queryFn: customerCareService.getComplaints,
        retry: false
    });
};

export const useCreateComplaint = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: customerCareService.createComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            toast({ type: 'success', title: 'Complaint Raised', message: 'Customer complaint was created successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to create complaint';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useUpdateComplaintWorkflow = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ complaintId, data }: { complaintId: string; data: any }) =>
            customerCareService.updateComplaintWorkflow(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            toast({ type: 'success', title: 'Workflow Updated', message: 'Complaint workflow status updated successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to update workflow';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const usePendingFeedback = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['pending-feedback', activeUnitId || 'unit'],
        queryFn: customerCareService.getPendingFeedback,
        retry: false
    });
};

export const useServiceHistory = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['service-history', activeUnitId || 'unit'],
        queryFn: customerCareService.getServiceHistory,
        retry: false
    });
};

export const useRecordServiceFeedback = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ allocationId, data }: { allocationId: string; data: { rating: number; comments?: string } }) =>
            customerCareService.recordServiceFeedback(allocationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-feedback'] });
            queryClient.invalidateQueries({ queryKey: ['service-history'] });
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            toast({ type: 'success', title: 'Feedback Recorded', message: 'Customer feedback saved successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to record feedback';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useWelcomeCalls = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['welcome-calls', activeUnitId || 'unit'],
        queryFn: customerCareService.getWelcomeCalls,
        retry: false
    });
};

export const useUpdateWelcomeCall = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => customerCareService.updateWelcomeCall(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['welcome-calls'] });
            toast({ type: 'success', title: 'Updated', message: 'Welcome call updated successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to update welcome call';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};
