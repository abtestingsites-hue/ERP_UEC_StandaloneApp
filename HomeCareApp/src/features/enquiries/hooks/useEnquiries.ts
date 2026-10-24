import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useEnquiries(statusFilter?: string, searchQuery?: string) {
    const queryClient = useQueryClient();

    const enquiriesQuery = useQuery({
        queryKey: ['homecare-enquiries', statusFilter, searchQuery],
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (statusFilter && statusFilter !== 'ALL') {
                params.status = statusFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const res = await api.get('/enquiry', { params });
            const list = res.data?.data || res.data || [];
            
            // Safe filter for Home Care context if description/meta or mode indicates Home Care
            return Array.isArray(list) ? list : [];
        }
    });

    const createEnquiryMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/enquiry', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-enquiries'] });
        }
    });

    const updateEnquiryMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            const res = await api.put(`/enquiry/${id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-enquiries'] });
        }
    });

    return {
        enquiries: enquiriesQuery.data || [],
        isLoading: enquiriesQuery.isLoading,
        error: enquiriesQuery.error,
        refetch: enquiriesQuery.refetch,
        createEnquiry: createEnquiryMutation.mutateAsync,
        isCreating: createEnquiryMutation.isPending,
        updateEnquiry: updateEnquiryMutation.mutateAsync,
        isUpdating: updateEnquiryMutation.isPending,
    };
}
