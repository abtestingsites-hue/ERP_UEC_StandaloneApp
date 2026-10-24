import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../services/crmService';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../components/Toast';

export const usePartners = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['b2p-partners', activeUnitId || 'unit'],
        queryFn: crmService.getPartners,
        retry: false
    });
};

export const useCreatePartner = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: crmService.createPartner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['b2p-partners'] });
            toast({ type: 'success', title: 'Success', message: 'Referral partner created successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to create partner';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useCampaigns = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['marketing-campaigns', activeUnitId || 'unit'],
        queryFn: crmService.getCampaigns,
        retry: false
    });
};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: crmService.createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            toast({ type: 'success', title: 'Success', message: 'Marketing campaign created successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to create campaign';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useWorkflowTimelines = (search: string = '') => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    return useQuery({
        queryKey: ['workflow-timeline', activeUnitId || 'unit', search],
        queryFn: () => crmService.getWorkflowTimelines(search),
        retry: false
    });
};
