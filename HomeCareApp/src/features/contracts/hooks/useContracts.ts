import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useContracts() {
    const queryClient = useQueryClient();

    // Fetch Home Care admissions first
    const admissionsQuery = useQuery({
        queryKey: ['homecare-contract-admissions'],
        queryFn: async () => {
            const res = await api.get('/enquiry/admissions').catch(() => ({ data: [] }));
            const admissions = res.data?.data || res.data || [];
            return Array.isArray(admissions) ? admissions : [];
        }
    });

    // Create Draft Contract Mutation
    const createContractMutation = useMutation({
        mutationFn: async (payload: {
            admissionId: string;
            startDate: string;
            endDate?: string | null;
            staffRequired?: number | null;
            shift?: string | null;
            frequency?: string | null;
            servicePrice?: number | null;
            billingCycle?: string | null;
            careRequirements?: any;
            specialInstructions?: string | null;
        }) => {
            const res = await api.post('/service-contracts', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-contract-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-[#admission-contract]'] });
        }
    });

    // Update Draft Contract Mutation
    const updateContractMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            const res = await api.patch(`/service-contracts/${id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-contract-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-[#admission-contract]'] });
        }
    });

    // Activate Contract Mutation
    const activateContractMutation = useMutation({
        mutationFn: async (contractId: string) => {
            const res = await api.post(`/service-contracts/${contractId}/activate`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['homecare-contract-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['homecare-[#admission-contract]'] });
        }
    });

    return {
        admissions: admissionsQuery.data || [],
        isLoading: admissionsQuery.isLoading,
        refetch: admissionsQuery.refetch,
        createContract: createContractMutation.mutateAsync,
        isCreating: createContractMutation.isPending,
        updateContract: updateContractMutation.mutateAsync,
        isUpdating: updateContractMutation.isPending,
        activateContract: activateContractMutation.mutateAsync,
        isActivating: activateContractMutation.isPending,
    };
}

// Hook to fetch contract for specific admission
export function useAdmissionContract(admissionId?: string) {
    return useQuery({
        queryKey: ['homecare-[#admission-contract]', admissionId],
        queryFn: async () => {
            if (!admissionId) return null;
            const res = await api.get(`/service-contracts/admission/${admissionId}`).catch(() => null);
            if (!res || !res.data) return null;
            const payload = res.data;
            if (payload && typeof payload === 'object' && 'data' in payload) {
                const c = payload.data;
                return (c && typeof c === 'object' && c.id) ? c : null;
            }
            return (payload && typeof payload === 'object' && payload.id) ? payload : null;
        },
        enabled: Boolean(admissionId)
    });
}
