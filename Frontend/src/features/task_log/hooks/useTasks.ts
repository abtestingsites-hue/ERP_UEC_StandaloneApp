import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../services/tasks'
import { useToast } from '../../../components/Toast'
import { AxiosError } from 'axios'

export const useTasks = (
    params?: { scope?: 'approval' | 'mine'; assigneeId?: string; assignedStaffId?: string },
    unitId?: string | null
) => {
    return useQuery({
        queryKey: ['tasks', params || {}, unitId || 'active-unit'],
        queryFn: () => taskService.getTasks(params, unitId)
    })
}

export const useApprovalTasks = (unitId?: string | null) => {
    return useQuery({
        queryKey: ['tasks', 'approval', unitId || 'active-unit'],
        queryFn: () => taskService.getTasks({ scope: 'approval' }, unitId)
    })
}

export const useCreateTask = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: taskService.createTask,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['tasks', 'approval'] })
            toast({ type: 'success', title: 'Assigned', message: 'Task successfully created' })
        },
        onError: (error) => {
            const message = error instanceof AxiosError
                ? error.response?.data?.message || 'Failed to assign task'
                : 'Failed to assign task'
            toast({ type: 'error', title: 'Error', message })
        }
    })
}

export const useUpdateTaskStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, status, completedAt, remarks }: { id: string, status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED', completedAt?: string | null, remarks?: string | null }) =>
            taskService.updateTaskStatus(id, status, { completedAt, remarks }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['tasks', 'approval'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            queryClient.invalidateQueries({ queryKey: ['workflow-timeline'] })
            queryClient.invalidateQueries({ queryKey: ['customer-care', 'service-history'] })
            toast({ type: 'success', title: 'Updated', message: 'Task status updated' })
        },
        onError: (error) => {
            const message = error instanceof AxiosError
                ? error.response?.data?.message || 'Failed to update task status'
                : 'Failed to update task status'
            toast({ type: 'error', title: 'Error', message })
        }
    })
}
