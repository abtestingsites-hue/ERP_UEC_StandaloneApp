import { api } from '../lib/axios'

export interface DashboardKPIs {
    totalEnquiries: number
    pendingFollowups: number
    revenue: number
    pendingApprovals: number
    activeEnquiries?: number
    missedCalls?: number
    criticalPatients?: number
    lowStockAlerts?: number
    pendingPayments?: number
}

export const dashboardService = {
    getKPIs: async (): Promise<DashboardKPIs> => {
        const res = await api.get('/analytics/kpis')
        return res.data.data
    },
    getRecentActivities: async (): Promise<any[]> => {
        const res = await api.get('/enquiry?limit=6')
        return res.data.data
    },
    getGlobalActivities: async (): Promise<any[]> => {
        const res = await api.get('/analytics/activities')
        return res.data.data
    },
    getUecAdminDashboard: async (): Promise<any> => {
        const res = await api.get('/uec/dashboard/admin')
        return res.data.data
    },
    getUecFinanceDashboard: async (): Promise<any> => {
        const res = await api.get('/uec/dashboard/finance')
        return res.data.data
    }
}
