import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { useAuthStore } from '../store/authStore'

export const useDashboardKPIs = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)

    return useQuery({
        queryKey: ['dashboard-kpis', activeUnitId],
        queryFn: dashboardService.getKPIs,
        enabled: Boolean(activeUnitId),
        refetchInterval: 60000 // Refresh every minute
    })
}

export const useRecentActivities = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)

    return useQuery({
        queryKey: ['recent-activities', activeUnitId],
        queryFn: dashboardService.getRecentActivities,
        enabled: Boolean(activeUnitId)
    })
}

export const useGlobalActivities = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)

    return useQuery({
        queryKey: ['global-activities', activeUnitId],
        queryFn: dashboardService.getGlobalActivities,
        enabled: Boolean(activeUnitId),
        refetchInterval: 30000 // Realtime-ish updates
    })
}

export const useUecAdminDashboard = () => {
    return useQuery({
        queryKey: ['uec-admin-dashboard'],
        queryFn: dashboardService.getUecAdminDashboard
    })
}

export const useUecFinanceDashboard = () => {
    return useQuery({
        queryKey: ['uec-finance-dashboard'],
        queryFn: dashboardService.getUecFinanceDashboard
    })
}
