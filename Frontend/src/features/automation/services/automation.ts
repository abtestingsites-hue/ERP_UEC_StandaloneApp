import { api } from '../../../lib/axios'

export interface AutomationTask {
    id: string
    entityId: string
    module: string
    taskType: string
    description: string
    status: string
    priority: number
    createdAt: string
    metadata?: any
}

export const automationService = {
    getTasks: async (unitId: string): Promise<AutomationTask[]> => {
        const response = await api.get('/automation/tasks', { params: { unitId } })
        return response.data.data
    },

    updateTaskStatus: async (id: string, status: string): Promise<AutomationTask> => {
        const response = await api.patch(`/automation/tasks/${id}/status`, { status })
        return response.data.data
    },

    getStats: async (unitId: string): Promise<any> => {
        const response = await api.get('/automation/stats', { params: { unitId } })
        return response.data.data
    }
}
