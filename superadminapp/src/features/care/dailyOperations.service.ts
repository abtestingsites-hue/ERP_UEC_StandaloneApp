import { api } from '../../services/api';

export type DailyOperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';

export interface DailyOperationTask {
    id: string;
    taskNo: string;
    taskDate: string;
    phase: string;
    department: string;
    title: string;
    assignedStaffId?: string | null;
    assignedTo?: string | null;
    status: DailyOperationStatus;
    completedAt?: string | null;
    remarks?: string | null;
    source: 'DEFAULT' | 'MANUAL' | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDailyOperationTaskPayload {
    taskDate: string;
    department: string;
    title: string;
    assignedStaffId?: string | null;
    assignedTo?: string | null;
    remarks?: string | null;
}

export interface UpdateDailyOperationTaskPayload {
    assignedStaffId?: string | null;
    assignedTo?: string | null;
    status?: DailyOperationStatus;
    remarks?: string | null;
}

export interface ChargeableExpensePayload {
    allocationId: string;
    taskDate?: string | null;
    department?: 'Patient Care' | 'Nursing';
    category: string;
    description: string;
    quantity: number;
    rate: number;
    notes?: string | null;
}

export interface DailyOperationsReport {
    taskDate: string;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    missed: number;
    byDepartment: Array<{
        department: string;
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
        missed: number;
    }>;
    issues: DailyOperationTask[];
}

export const dailyOperationsService = {
    getTasks: async (date: string, unitId?: string | null): Promise<DailyOperationTask[]> => {
        const config: { params: { date: string }; headers?: Record<string, string> } = {
            params: { date }
        };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get<{ success: boolean; data: DailyOperationTask[] }>('/daily-operations/tasks', config);
        return Array.isArray(res.data?.data) ? res.data.data : [];
    },

    createTask: async (payload: CreateDailyOperationTaskPayload, unitId?: string | null): Promise<DailyOperationTask> => {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.post<{ success: boolean; data: DailyOperationTask }>('/daily-operations/tasks', payload, config);
        return res.data?.data;
    },

    updateTask: async (taskId: string, payload: UpdateDailyOperationTaskPayload, unitId?: string | null): Promise<DailyOperationTask> => {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.patch<{ success: boolean; data: DailyOperationTask }>(`/daily-operations/tasks/${taskId}`, payload, config);
        return res.data?.data;
    },

    postChargeableExpense: async (payload: ChargeableExpensePayload, unitId?: string | null): Promise<{ ledgerEntry: any }> => {
        const config: { headers?: Record<string, string> } = {};
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.post<{ success: boolean; data: { ledgerEntry: any } }>('/daily-operations/chargeable-expense', payload, config);
        return res.data?.data;
    },

    getReport: async (date: string, unitId?: string | null): Promise<DailyOperationsReport> => {
        const config: { params: { date: string }; headers?: Record<string, string> } = {
            params: { date }
        };
        if (unitId) config.headers = { 'x-unit-id': unitId };
        const res = await api.get<{ success: boolean; data: DailyOperationsReport }>('/daily-operations/report', config);
        return res.data?.data;
    }
};
