import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiryService } from '../services/enquiry';
import type { EnquiryFormValues } from '../schema';
import { useToast } from '../../../components/Toast';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/axios';

export const useStaff = () => {
    return useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            try {
                const res = await api.get('/hr/staff');
                return res.data?.data || [];
            } catch {
                return [];
            }
        }
    });
};

export const useEnquiries = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);
    const canReadAllUnits = activeUnitId === 'ALL' || useAuthStore((state) => state.user?.unitAccess?.includes('*') || false);

    return useQuery({
        queryKey: ['enquiries', activeUnitId || 'unit', canReadAllUnits ? 'all' : 'unit'],
        queryFn: () => enquiryService.getEnquiries(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    });
};

export const useEnquiry = (id: string) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId);

    return useQuery({
        queryKey: ['enquiries', id, activeUnitId || 'unit'],
        queryFn: () => enquiryService.getEnquiryDetail(id),
        enabled: !!id,
        retry: false
    });
};

export const useAddEnquiry = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: enquiryService.addEnquiry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            toast({ type: 'success', title: 'Success', message: 'Enquiry created successfully' });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create enquiry';
            console.error('Create enquiry failed:', error?.response?.data || error);
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useUpdateEnquiry = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: EnquiryFormValues | any }) => enquiryService.updateEnquiry(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['enquiries', variables.id] });
            toast({ type: 'success', title: 'Success', message: 'Enquiry updated successfully' });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update enquiry';
            console.error('Update enquiry failed:', error?.response?.data || error);
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useDeleteEnquiry = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: enquiryService.deleteEnquiry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            toast({ type: 'success', title: 'Success', message: 'Enquiry deleted successfully' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to delete enquiry';
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useAddFollowUp = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string;
            data: {
                notes: string;
                nextDate: string;
                staffId?: string;
                channel?: string;
                outcome?: string;
                attachmentName?: string;
                clientInterest?: string;
                readyToPayAmount?: number;
                paymentMode?: string;
                nextFollowupStatus?: string;
            };
        }) => enquiryService.addFollowUp(id, data),
        onSuccess: (_result: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['enquiries', variables.id] });
            toast({
                type: 'success',
                title: 'Success',
                message: 'Follow-up call recorded successfully'
            });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to record follow-up';
            console.error('Follow-up failed:', error?.response?.data || error);
            toast({ type: 'error', title: 'Error', message });
        }
    });
};

export const useRenewalFollowUpOutcome = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string;
            data: {
                followUpId?: string;
                outcome: 'INTERESTED' | 'NOT_INTERESTED' | 'CALL_LATER' | 'CONVERTED_TO_NEW_SERVICE' | 'CLOSED';
                notes?: string;
                nextDate?: string;
                service?: string;
            };
        }) => enquiryService.recordRenewalOutcome(id, data),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            toast({
                type: 'success',
                title: result?.newEnquiry ? 'New Enquiry Created' : 'Outcome Saved',
                message: result?.newEnquiry
                    ? 'Renewal follow-up converted into a fresh enquiry'
                    : 'Renewal follow-up outcome was updated'
            });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update renewal outcome';
            toast({ type: 'error', title: 'Outcome Failed', message });
        }
    });
};

export const useConvertToAdmission = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => enquiryService.convertToAdmission(id, data),
        onSuccess: (_result: any, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
            queryClient.invalidateQueries({ queryKey: ['enquiries', variables.id] });
            toast({
                type: 'success',
                title: 'Success',
                message: 'Enquiry converted to admission successfully'
            });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to convert to admission';
            console.error('Conversion failed:', error?.response?.data || error);
            toast({ type: 'error', title: 'Conversion Failed', message });
        }
    });
};
