import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface LabourService {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const labourServiceService = {
    getAll: async (): Promise<LabourService[]> => {
        const res = await api.get('/master/labour-service');
        return res.data.data;
    },
    create: async (data: any): Promise<LabourService> => {
        const res = await api.post('/master/labour-service', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<LabourService> => {
        const res = await api.put(`/master/labour-service/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/labour-service/${id}`);
    }
};

export function useLabourServices() {
    return useQuery({
        queryKey: ['labour-services'],
        queryFn: labourServiceService.getAll
    });
}

export function useCreateLabourService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: labourServiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] });
        }
    });
}

export function useUpdateLabourService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => labourServiceService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] });
        }
    });
}

export function useDeleteLabourService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: labourServiceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] });
        }
    });
}
