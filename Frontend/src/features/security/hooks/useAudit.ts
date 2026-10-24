import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

interface AuditFilter {
    module?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}

export const auditService = {
    getAuditLogs: async (filters: AuditFilter = {}) => {
        const res = await api.get('/audit/logs', { params: filters })
        return res.data
    }
}

export const useAuditLogs = (filters: AuditFilter = {}) => {
    return useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => auditService.getAuditLogs(filters),
        placeholderData: (prev: any) => prev
    })
}

