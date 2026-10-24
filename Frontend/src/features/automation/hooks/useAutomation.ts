import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { automationService } from '../services/automation'
import { useAuthStore } from '../../../store/authStore'

export const useAutomationTasks = () => {
    const unitId = useAuthStore(state => state.user?.unitId);

    return useQuery({
        queryKey: ['automationTasks', unitId],
        queryFn: () => automationService.getTasks(unitId!),
        enabled: !!unitId,
        refetchInterval: 30000 // Refetch every 30 seconds for real-time feel
    })
}

export const useUpdateAutomationTaskStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            automationService.updateTaskStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automationTasks'] })
        }
    })
}

export const useAutomationStats = () => {
    const unitId = useAuthStore(state => state.user?.unitId);

    return useQuery({
        queryKey: ['automationStats', unitId],
        queryFn: () => automationService.getStats(unitId!),
        enabled: !!unitId,
        refetchInterval: 30000
    })
}
