import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { dailyOperationsService, type CreateDailyOperationTaskPayload, type PatientExpensePayload, type UpdateDailyOperationTaskPayload } from '../services/dailyOperations'

const message = (error: any, fallback: string) => error?.response?.data?.message || fallback

export const useDailyOperationTasks = (date: string) => useQuery({
    queryKey: ['daily-operations', 'tasks', date],
    queryFn: () => dailyOperationsService.getTasks(date),
    staleTime: 30_000,
    retry: 1
})

export const useDailyOperationsReport = (date: string) => useQuery({
    queryKey: ['daily-operations', 'report', date],
    queryFn: () => dailyOperationsService.getReport(date),
    staleTime: 30_000,
    retry: 1
})

export const useCreateDailyOperationTask = (date: string) => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: CreateDailyOperationTaskPayload) => dailyOperationsService.createTask(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-operations', 'tasks', date] })
            toast({ type: 'success', title: 'Task Added', message: 'Daily operation task created' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Task Failed', message: message(error, 'Failed to add daily operation task') })
        }
    })
}

export const useUpdateDailyOperationTask = (date: string) => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateDailyOperationTaskPayload }) =>
            dailyOperationsService.updateTask(taskId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-operations', 'tasks', date] })
            toast({ type: 'success', title: 'Task Updated', message: 'Daily operation task updated' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: message(error, 'Failed to update daily operation task') })
        }
    })
}

export const usePostChargeableExpense = (date: string) => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    void date

    return useMutation({
        mutationFn: (payload: PatientExpensePayload) => dailyOperationsService.postChargeableExpense(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            toast({ type: 'success', title: 'Charge Posted', message: 'Chargeable patient expense added to ledger' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Charge Failed', message: message(error, 'Failed to post chargeable patient expense') })
        }
    })
}
