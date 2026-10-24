import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsService } from '../services/accounts'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

export const useCashbox = (fromDate?: string, toDate?: string) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)

    return useQuery({
        queryKey: ['cashbox', activeUnitId, fromDate, toDate],
        queryFn: () => accountsService.getCashbox({ fromDate, toDate })
    })
}

export const useInvoices = (unitId?: string | null, search?: string) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)
    const resolvedUnitId = unitId || activeUnitId
    const canReadAllUnits = useAuthStore((state) => {
        const roleName = typeof state.user?.role === 'string'
            ? state.user.role
            : state.user?.role?.name || ''
        const normalizedRole = roleName.trim().toLowerCase().replace(/_/g, ' ')
        return state.user?.unitAccess?.includes('*')
            || ['admin', 'super admin', 'superadmin', 'finance manager'].includes(normalizedRole)
    })

    return useQuery({
        queryKey: ['invoices', unitId ? resolvedUnitId : canReadAllUnits ? 'all' : activeUnitId, search?.trim() || ''],
        queryFn: () => accountsService.getInvoices(unitId
            ? { unitId, search, limit: search?.trim() ? 100 : 200 }
            : { scope: 'all', search, limit: search?.trim() ? 100 : 200 }
        )
    })
}

export const useAddIncome = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: accountsService.addIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            toast({ type: 'success', title: 'Success', message: 'Income recorded efficiently' })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to record income' })
        }
    })
}

export const useAddExpense = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: accountsService.addExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            toast({ type: 'success', title: 'Success', message: 'Expense recorded efficiently' })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to record expense' })
        }
    })
}

export const useApproveTransaction = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, status, comments }: { id: string, status: 'APPROVED' | 'REJECTED', comments?: string }) =>
            accountsService.approveTransaction(id, status, comments),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            toast({ type: 'success', title: 'Workflow Updated', message: `Transaction set to ${variables.status}` })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to action workflow constraint' })
        }
    })
}

export const useRecordInvoicePayment = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => accountsService.recordInvoicePayment(id, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            toast({
                type: 'success',
                title: 'Receipt Generated',
                message: `Payment collected${result?.receipt?.refNo ? ` as ${result.receipt.refNo}` : ''}`
            })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Payment Failed', message: err.response?.data?.message || 'Failed to collect payment' })
        }
    })
}

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => accountsService.updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            toast({ type: 'success', title: 'Success', message: 'Transaction updated successfully' })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to update transaction' })
        }
    })
}

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => accountsService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashbox'] })
            toast({ type: 'success', title: 'Deleted', message: 'Transaction removed successfully' })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to delete transaction' })
        }
    })
}
