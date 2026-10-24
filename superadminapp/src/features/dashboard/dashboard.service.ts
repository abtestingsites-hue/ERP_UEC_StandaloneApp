import { api } from '../../services/api'

export interface LiveDashboardKPIs {
	totalEnquiries: number
	activeEnquiries: number
	revenue: number
	lowStockAlerts: number
	pendingPayments: number
	criticalPatients: number
	pendingApprovals: number
	pendingFollowups: number
}

export interface LiveActivityItem {
	id: string
	type: string
	title: string
	description?: string
	status?: string
	timestamp: string
	source?: string
}

export const dashboardService = {
	async getKPIs(): Promise<LiveDashboardKPIs> {
		try {
			const res = await api.get<{ success: boolean; data: Record<string, unknown> }>('/analytics/kpis')
			const data = res.data?.data || {}
			return {
				totalEnquiries: Number(data.totalEnquiries ?? 0),
				activeEnquiries: Number(data.activeEnquiries ?? 0),
				revenue: Number(data.revenue ?? 0),
				lowStockAlerts: Number(data.lowStockAlerts ?? 0),
				pendingPayments: Number(data.pendingPayments ?? 0),
				criticalPatients: Number(data.criticalPatients ?? 0),
				pendingApprovals: Number(data.pendingApprovals ?? 0),
				pendingFollowups: Number(data.pendingFollowups ?? 0),
			}
		} catch {
			return {
				totalEnquiries: 0,
				activeEnquiries: 0,
				revenue: 0,
				lowStockAlerts: 0,
				pendingPayments: 0,
				criticalPatients: 0,
				pendingApprovals: 0,
				pendingFollowups: 0,
			}
		}
	},

	async getActivities(): Promise<LiveActivityItem[]> {
		try {
			const res = await api.get<{ success: boolean; data: LiveActivityItem[] }>('/analytics/activities')
			return Array.isArray(res.data?.data) ? res.data.data : []
		} catch {
			return []
		}
	}
}
