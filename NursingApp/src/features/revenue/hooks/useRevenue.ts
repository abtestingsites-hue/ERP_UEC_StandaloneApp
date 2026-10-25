import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface RevenueEntry {
  id: string;
  category: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sourceType: string;
  createdAt: string;
}

export interface RevenueTodayData {
  patientId: string;
  careDate: string;
  manualEntries: RevenueEntry[];
  inventoryEntries: RevenueEntry[];
  summary: {
    manualTotal: number;
    inventoryTotal: number;
    totalAmount: number;
  };
}

export interface CreateRevenuePayload {
  assignmentId: string;
  careDate: string;
  category: string;
  description: string;
  quantity: number;
  rate: number;
}

export const revenueService = {

  getTodayRevenue: async (patientId: string, assignmentId: string): Promise<RevenueTodayData> => {
    const res = await api.get(`/patient-care/patients/${patientId}/revenue/today`, {
      params: { assignmentId }
    });
    return res.data?.data;
  },

  createRevenueEntry: async ({
    patientId,
    payload
  }: {
    patientId: string;
    payload: CreateRevenuePayload;
  }): Promise<RevenueEntry> => {
    const res = await api.post(`/patient-care/patients/${patientId}/revenue`, payload);
    return res.data?.data;
  }
};

export const useTodayRevenue = (patientId: string | null, assignmentId: string | null) => {
  return useQuery({
    queryKey: ['nursing-care', 'revenue', 'today', patientId, assignmentId],
    queryFn: () => revenueService.getTodayRevenue(patientId!, assignmentId!),
    enabled: Boolean(patientId && assignmentId)
  });
};

export const useCreateRevenueEntry = (patientId: string | null, assignmentId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRevenuePayload) =>
      revenueService.createRevenueEntry({ patientId: patientId!, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['nursing-care', 'revenue', 'today', patientId, assignmentId]
      });
    },
    onError: (error: any) => {
      console.error('Failed to save revenue entry:', error);
    }
  });
};
