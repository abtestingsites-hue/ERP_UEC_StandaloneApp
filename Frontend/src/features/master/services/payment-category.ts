import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface PaymentCategory {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const paymentCategoryService = {
    getAll: async (): Promise<PaymentCategory[]> => {
        const res = await api.get('/master/payment-category');
        return res.data.data;
    },
    create: async (data: any): Promise<PaymentCategory> => {
        const res = await api.post('/master/payment-category', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<PaymentCategory> => {
        const res = await api.put(`/master/payment-category/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/payment-category/${id}`);
    }
};

export function usePaymentCategorys() {
    return useQuery({
        queryKey: ['payment-categorys'],
        queryFn: paymentCategoryService.getAll
    });
}

export function useCreatePaymentCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: paymentCategoryService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-categorys'] });
        }
    });
}

export function useUpdatePaymentCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => paymentCategoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-categorys'] });
        }
    });
}

export function useDeletePaymentCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: paymentCategoryService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-categorys'] });
        }
    });
}
