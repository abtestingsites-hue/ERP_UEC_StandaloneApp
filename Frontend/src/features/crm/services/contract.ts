import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface ServiceContract {
    id: string;
    contractNumber: string;
    admissionId: string;
    startDate: string;
    endDate?: string | null;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    staffRequired?: number | null;
    shift?: string | null;
    frequency?: string | null;
    careRequirements?: any;
    specialInstructions?: string | null;
    servicePrice?: number | null;
    billingCycle?: string | null;
    termsSnapshot?: any;
    termsAcceptedAt?: string | null;
    termsAcceptedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
}

export function useContract(admissionId?: string | null) {
    return useQuery({
        queryKey: ['service-contract', admissionId],
        queryFn: async () => {
            if (!admissionId) return null;
            const { data } = await api.get(`/service-contracts/admission/${admissionId}`);
            return data.data as ServiceContract | null;
        },
        enabled: !!admissionId,
    });
}

export function useCreateContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<ServiceContract>) => {
            const { data } = await api.post('/service-contracts', payload);
            return data.data as ServiceContract;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['service-contract', data.admissionId] });
        },
    });
}

export function useUpdateContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string } & Partial<ServiceContract>) => {
            const { data } = await api.patch(`/service-contracts/${id}`, payload);
            return data.data as ServiceContract;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['service-contract', data.admissionId] });
        },
    });
}

export function useActivateContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post(`/service-contracts/${id}/activate`);
            return data.data as ServiceContract;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['service-contract', data.admissionId] });
        },
    });
}
