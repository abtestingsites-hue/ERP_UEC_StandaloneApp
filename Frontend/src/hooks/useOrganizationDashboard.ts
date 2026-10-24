import { useQuery } from '@tanstack/react-query'
import { organizationDashboardService } from '../services/organizationDashboardService'
import { useAuthStore } from '../store/authStore'

export const useOrganizationDashboard = (orgCode: string) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)

    return useQuery({
        queryKey: ['organization-dashboard', orgCode, activeUnitId],
        queryFn: () => organizationDashboardService.getDashboard(orgCode),
        enabled: Boolean(orgCode && activeUnitId),
        refetchInterval: 60000
    })
}
