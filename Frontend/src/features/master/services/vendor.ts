import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '../../../components/Toast';
import { api } from '../../../lib/axios';

export interface Vendor {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const vendorService = {
    getAll: async (): Promise<Vendor[]> => {
        const res = await api.get('/master/vendor');
        return res.data.data;
    },
    create: async (data: any): Promise<Vendor> => {
        const res = await api.post('/master/vendor', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<Vendor> => {
        const res = await api.put(`/master/vendor/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/vendor/${id}`);
    }
};

export function useVendors() {
    return useQuery({
        queryKey: ['vendors'],
        queryFn: vendorService.getAll
    });
}

export function useCreateVendor() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: vendorService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast({ type: 'success', title: 'Success', message: 'Vendor enrolled successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to enroll vendor'
                : 'Failed to enroll vendor';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}

export function useUpdateVendor() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => vendorService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast({ type: 'success', title: 'Success', message: 'Vendor updated successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to update vendor'
                : 'Failed to update vendor';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}

export function useDeleteVendor() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: vendorService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast({ type: 'success', title: 'Success', message: 'Vendor revoked successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to revoke vendor'
                : 'Failed to revoke vendor';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}
