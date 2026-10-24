import { api } from '../lib/axios'

export interface OrganizationKPI {
    label: string
    value: number
    format?: 'currency'
    tone: string
}

export interface OrganizationActivity {
    id: string
    title: string
    description: string
    createdAt: string
}

export interface OrganizationDashboardData {
    code: string
    title: string
    subtitle: string
    accent: string
    kpis: OrganizationKPI[]
    trend: Array<Record<string, string | number>>
    taskStatus: Array<{ name: string; value: number }>
    activities: OrganizationActivity[]
}

export const organizationDashboardService = {
    getDashboard: async (orgCode: string): Promise<OrganizationDashboardData> => {
        const res = await api.get(`/analytics/organization/${orgCode}`)
        return res.data.data
    }
}
