import { api } from '../../../lib/axios'

export type DailyOperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED'

export type DailyOperationTask = {
    id: string
    taskNo: string
    taskDate: string
    phase: string
    department: string
    title: string
    assignedStaffId?: string | null
    assignedTo?: string | null
    status: DailyOperationStatus
    completedAt?: string | null
    remarks?: string | null
    source: 'DEFAULT' | 'MANUAL' | string
    createdAt?: string
    updatedAt?: string
}

export type CreateDailyOperationTaskPayload = {
    taskDate: string
    department: string
    title: string
    assignedStaffId?: string | null
    assignedTo?: string | null
    remarks?: string | null
}

export type UpdateDailyOperationTaskPayload = {
    assignedStaffId?: string | null
    assignedTo?: string | null
    status?: DailyOperationStatus
    remarks?: string | null
}

export type PatientExpensePayload = {
    allocationId: string
    taskDate?: string | null
    department?: 'Patient Care' | 'Nursing'
    category: string
    description: string
    quantity: number
    rate: number
    notes?: string | null
}

export type DailyOperationsReport = {
    taskDate: string
    total: number
    completed: number
    pending: number
    inProgress: number
    missed: number
    byDepartment: Array<{
        department: string
        total: number
        completed: number
        pending: number
        inProgress: number
        missed: number
    }>
    issues: DailyOperationTask[]
}

export const dailyOperationsService = {
    getTasks: async (date: string): Promise<DailyOperationTask[]> => {
        const res = await api.get('/daily-operations/tasks', { params: { date } })
        return Array.isArray(res.data?.data) ? res.data.data : []
    },

    createTask: async (payload: CreateDailyOperationTaskPayload): Promise<DailyOperationTask> => {
        const res = await api.post('/daily-operations/tasks', payload)
        return res.data?.data
    },

    updateTask: async (taskId: string, payload: UpdateDailyOperationTaskPayload): Promise<DailyOperationTask> => {
        const res = await api.patch(`/daily-operations/tasks/${taskId}`, payload)
        return res.data?.data
    },

    postChargeableExpense: async (payload: PatientExpensePayload): Promise<{ ledgerEntry: any }> => {
        const res = await api.post('/daily-operations/chargeable-expense', payload)
        return res.data?.data
    },

    getReport: async (date: string): Promise<DailyOperationsReport> => {
        const res = await api.get('/daily-operations/report', { params: { date } })
        return res.data?.data
    }
}
