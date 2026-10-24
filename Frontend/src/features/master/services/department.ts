import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface Department {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const departmentService = {
    getAll: async (): Promise<Department[]> => {
        const res = await api.get('/master/department');
        return res.data.data;
    },
    create: async (data: any): Promise<Department> => {
        const res = await api.post('/master/department', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<Department> => {
        const res = await api.put(`/master/department/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/department/${id}`);
    }
};

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: departmentService.getAll
    });
}

export function useCreateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: departmentService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        }
    });
}

export function useUpdateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => departmentService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        }
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: departmentService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        }
    });
}
