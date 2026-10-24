import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export const useUecFinanceDashboard = () => {
    return useQuery({
        queryKey: ['uec-finance-dashboard'],
        queryFn: dashboardService.getUecFinanceDashboard
    })
}
