import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export const useFundingCategories = () => {
    return useQuery({
        queryKey: ['funding-categories'],
        queryFn: async () => {
            const { data } = await api.get('/funding-projects/funding-categories');
            return data.data;
        }
    });
};

export const useCreateFundingCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryData: any) => {
            const { data } = await api.post('/funding-projects/funding-categories', categoryData);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funding-categories'] })
    });
};

export const useProjectClassifications = () => {
    return useQuery({
        queryKey: ['project-classifications'],
        queryFn: async () => {
            const { data } = await api.get('/funding-projects/project-classifications');
            return data.data;
        }
    });
};

export const useCreateProjectClassification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (classData: any) => {
            const { data } = await api.post('/funding-projects/project-classifications', classData);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-classifications'] })
    });
};

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data } = await api.get('/funding-projects/projects');
            return data.data;
        }
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectData: any) => {
            const { data } = await api.post('/funding-projects/projects', projectData);
            return data.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
    });
};

export const useFundingAllocations = (projectId?: string) => {
    return useQuery({
        queryKey: ['funding-allocations', projectId],
        queryFn: async () => {
            const url = projectId ? `/funding-projects/funding-allocations?projectId=${projectId}` : '/funding-projects/funding-allocations';
            const { data } = await api.get(url);
            return data.data;
        }
    });
};

export const useCreateFundingAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (allocationData: any) => {
            const { data } = await api.post('/funding-projects/funding-allocations', allocationData);
            return data.data;
        },
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['funding-allocations'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};

export const useProjectExpenditures = (projectId?: string) => {
    return useQuery({
        queryKey: ['project-expenditures', projectId],
        queryFn: async () => {
            const url = projectId ? `/funding-projects/project-expenditures?projectId=${projectId}` : '/funding-projects/project-expenditures';
            const { data } = await api.get(url);
            return data.data;
        }
    });
};

export const useCreateProjectExpenditure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenditureData: any) => {
            const { data } = await api.post('/funding-projects/project-expenditures', expenditureData);
            return data.data;
        },
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['project-expenditures'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};

export const useApproveProjectExpenditure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { data } = await api.patch(`/funding-projects/project-expenditures/${id}/approve`, { status });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-expenditures'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};

