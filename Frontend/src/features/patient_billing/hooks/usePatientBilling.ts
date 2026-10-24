import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'
import { patientBillingService } from '../services/patientBilling'

const errorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

const useActiveUnitQueryKey = () => useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')

export const usePatientBillingServices = () => {
    const activeUnitId = useActiveUnitQueryKey()

    return useQuery({
        queryKey: ['patient-billing-services', activeUnitId],
        queryFn: patientBillingService.getServices,
        staleTime: 120_000,
        retry: 1
    })
}

export const usePatientDailyCosts = () => {
    const activeUnitId = useActiveUnitQueryKey()

    return useQuery({
        queryKey: ['patient-daily-costs', activeUnitId],
        queryFn: patientBillingService.getEntries,
        staleTime: 30_000,
        retry: 1
    })
}

export const useCaregiverRevenueSheets = (month?: string) => {
    const activeUnitId = useActiveUnitQueryKey()

    return useQuery({
        queryKey: ['caregiver-revenue-sheets', activeUnitId, month || 'all'],
        queryFn: () => patientBillingService.getCaregiverRevenueSheets(month),
        staleTime: 30_000,
        retry: 1
    })
}

export const useMedicineCatalog = () => {
    const activeUnitId = useActiveUnitQueryKey()

    return useQuery({
        queryKey: ['patient-billing-medicine-catalog', activeUnitId],
        queryFn: patientBillingService.getMedicineCatalog,
        staleTime: 120_000,
        retry: 1
    })
}

export const useCreatePatientDailyCost = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: patientBillingService.createEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            toast({ type: 'success', title: 'Cost Added', message: 'Daily patient cost saved' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Cost Failed', message: errorMessage(error, 'Failed to save daily cost') })
        }
    })
}

export const useUploadPatientBillEntry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: patientBillingService.uploadBillEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            toast({ type: 'success', title: 'Bill Uploaded', message: 'Uploaded bill added to patient ledger' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Upload Failed', message: errorMessage(error, 'Failed to upload bill') })
        }
    })
}

export const useSaveCaregiverRevenueSheet = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: patientBillingService.saveCaregiverRevenueSheet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['caregiver-revenue-sheets'] })
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            queryClient.invalidateQueries({ queryKey: ['admin-file-register'] })
            toast({ type: 'success', title: 'Sheet Saved', message: 'Caregiver revenue sheet saved' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Sheet Failed', message: errorMessage(error, 'Failed to save caregiver revenue sheet') })
        }
    })
}

export const useGeneratePatientFamilyInvoice = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: patientBillingService.generateInvoice,
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            toast({ type: 'success', title: 'Invoice Generated', message: result?.invoice?.refNo ? `${result.invoice.refNo} created` : 'Family invoice created' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Invoice Failed', message: errorMessage(error, 'Failed to generate family invoice') })
        }
    })
}

export const useMarkPatientReceiptSent = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: patientBillingService.markSent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            toast({ type: 'success', title: 'Receipt Sent', message: 'Family payment reminder marked as sent' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Send Failed', message: errorMessage(error, 'Failed to mark receipt as sent') })
        }
    })
}
