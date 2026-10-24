import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useServiceRequirements() {
    const queryClient = useQueryClient();

    const requirementsQuery = useQuery({
        queryKey: ['homecare-service-requirements'],
        queryFn: async () => {
            const res = await api.get('/enquiry');
            const enquiries = res.data?.data || res.data || [];
            
            // Map enquiries with serviceRequirements
            return Array.isArray(enquiries)
                ? enquiries.filter((e: any) => e.serviceRequirements || e.rawMessage)
                : [];
        }
    });

    const updateRequirementMutation = useMutation({
        mutationFn: async ({ enquiryId, payload }: { enquiryId: string; payload: any }) => {
            const res = await api.put(`/enquiry/${enquiryId}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-service-requirements'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-enquiries'] });
        }
    });

    return {
        requirements: requirementsQuery.data || [],
        isLoading: requirementsQuery.isLoading,
        updateRequirement: updateRequirementMutation.mutateAsync,
        isUpdating: updateRequirementMutation.isPending,
    };
}
