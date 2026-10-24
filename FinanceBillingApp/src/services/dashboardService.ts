import { api } from '../lib/axios'

export const dashboardService = {
    getUecFinanceDashboard: async (): Promise<any> => {
        const res = await api.get('/uec/dashboard/finance')
        return res.data.data
    }
}
