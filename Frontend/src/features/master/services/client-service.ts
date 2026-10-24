import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface ClientService {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const clientServiceService = {
    getAll: async (): Promise<ClientService[]> => {
        const res = await api.get('/master/client-service');
        return res.data.data;
    },
    create: async (data: any): Promise<ClientService> => {
        const res = await api.post('/master/client-service', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<ClientService> => {
        const res = await api.put(`/master/client-service/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/client-service/${id}`);
    }
};

export function useClientServices() {
    return useQuery({
        queryKey: ['client-services'],
        queryFn: clientServiceService.getAll
    });
}

export function useCreateClientService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: clientServiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-services'] });
        }
    });
}

export function useUpdateClientService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => clientServiceService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-services'] });
        }
    });
}

export function useDeleteClientService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: clientServiceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-services'] });
        }
    });
}
