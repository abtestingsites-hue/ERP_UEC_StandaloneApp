import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export const nutritionService = {
    getNutritionPlans: async (patientId?: string | null) => {
        const config: any = {};
        if (patientId) config.params = { patientId };
        const res = await api.get('/patient-care/nutrition', config);
        return res.data?.data || [];
    },
    createNutritionPlan: async (payload: any) => {
        const { assignmentId, ...requestBody } = payload;
        if (assignmentId) requestBody.assignmentId = assignmentId;
        const res = await api.post('/patient-care/nutrition', requestBody);
        return res.data?.data;
    },
    getNutritionRecords: async (patientId: string | null, careDate: string) => {
        const config: any = { params: {} };
        if (patientId) config.params.patientId = patientId;
        if (careDate) config.params.careDate = careDate;
        const res = await api.get('/patient-care/nutrition-records', config);
        return res.data?.data || [];
    },
    createNutritionRecord: async (payload: any) => {
        const res = await api.post('/patient-care/nutrition-records', payload);
        return res.data?.data;
    }
};

export const useNutritionPlans = (patientId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['patient-care', 'nutrition', patientId],
        queryFn: () => nutritionService.getNutritionPlans(patientId),
        enabled: options?.enabled !== false && !!patientId
    });
};

export const useCreateNutritionPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: nutritionService.createNutritionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'nutrition'] });
        }
    });
};

export const useNutritionRecords = (patientId: string | null, careDate: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['patient-care', 'nutrition-records', patientId, careDate],
        queryFn: () => nutritionService.getNutritionRecords(patientId, careDate),
        enabled: options?.enabled !== false && !!patientId && !!careDate
    });
};

export const useCreateNutritionRecord = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: nutritionService.createNutritionRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'nutrition-records'] });
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || 'Failed to save nutrition record');
        }
    });
};
