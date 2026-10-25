import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

export interface ManagerRevenueQuery {
    month: string;
    patientId?: string;
    source?: 'ALL' | 'MANUAL' | 'INVENTORY';
}

export interface ManagerRevenueEntry {
    date: string;
    category: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    sourceType: string;
    sourceGroup: 'MANUAL' | 'INVENTORY';
    createdAt: string | null;
    createdByName: string | null;
}

export interface CaregiverSheetItem {
    key: string;
    label: string;
    category?: string | null;
    unit?: string;
    rate?: number;
    days?: Record<string, number>;
}

export interface CaregiverSheetContext {
    title: string;
    status: string;
    totalAmount: number;
    signatures: {
        caregiverDay?: string;
        caregiverNight?: string;
        nurse?: string;
        manager?: string;
    };
    items: CaregiverSheetItem[];
    createdAt: string | null;
    updatedAt: string | null;
    createdByName: string | null;
}

export interface DailyTotal {
    date: string;
    manual: number;
    inventory: number;
    total: number;
}

export interface PatientRevenueData {
    patientId: string;
    patientName: string;
    elderId: string | null;
    entries: ManagerRevenueEntry[];
    caregiverSheet: CaregiverSheetContext | null;
    dailyTotals: DailyTotal[];
    totals: {
        manual: number;
        inventory: number;
        total: number;
    };
}

export interface ManagerRevenueResponse {
    month: string;
    source: string;
    patients: PatientRevenueData[];
    summary: {
        patientCount: number;
        manualTotal: number;
        inventoryTotal: number;
        totalAmount: number;
    };
}

export const useManagerRevenue = ({ month, patientId, source = 'ALL' }: ManagerRevenueQuery) => {
    const { token, activeUnitId } = useAuthStore();

    return useQuery<ManagerRevenueResponse>({
        queryKey: ['manager-revenue', month, patientId || 'all', source, activeUnitId],
        queryFn: async () => {
            if (!token) {
                throw new Error('Not authenticated');
            }

            const params: Record<string, string> = { month, source };
            if (patientId) {
                params.patientId = patientId;
            }

            const res = await api.get('/patient-care/manager/revenue', { params });
            return res.data?.data as ManagerRevenueResponse;
        },
        enabled: Boolean(token && month),
        retry: 1,
        refetchOnWindowFocus: false,
    });
};
