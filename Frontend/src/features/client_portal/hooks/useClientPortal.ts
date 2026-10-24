import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useToast } from '../../../components/Toast'
import { clientPortalService } from '../services/clientPortal'

export const useClientPortalSummary = () => useQuery({
    queryKey: ['client-portal', 'summary'],
    queryFn: clientPortalService.getSummary
})

export const useClientPortalServices = () => useQuery({
    queryKey: ['client-portal', 'services'],
    queryFn: clientPortalService.getServices
})

export const useClientPortalComplaints = () => useQuery({
    queryKey: ['client-portal', 'complaints'],
    queryFn: clientPortalService.getComplaints
})

export const useClientPortalNotifications = () => useQuery({
    queryKey: ['client-portal', 'notifications'],
    queryFn: clientPortalService.getNotifications
})

export const useClientPortalMedicines = () => useQuery({
    queryKey: ['client-portal', 'medicines'],
    queryFn: clientPortalService.getMedicines
})

export const useClientPortalVitals = (month?: string) => useQuery({
    queryKey: ['client-portal', 'vitals', month],
    queryFn: () => clientPortalService.getVitals(month)
})

export const useClientPortalADL = () => useQuery({
    queryKey: ['client-portal', 'adl'],
    queryFn: clientPortalService.getADL
})

export const useClientPortalNutrition = () => useQuery({
    queryKey: ['client-portal', 'nutrition'],
    queryFn: clientPortalService.getNutrition
})

const getErrorMessage = (error: unknown, fallback: string) => error instanceof AxiosError
    ? error.response?.data?.message || fallback
    : fallback

export const useClientPortalFeedback = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ allocationId, rating, comments }: { allocationId: string; rating: number; comments?: string }) =>
            clientPortalService.recordFeedback(allocationId, { rating, comments }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-portal'] })
            toast({ type: 'success', title: 'Saved', message: 'Feedback recorded' })
        },
        onError: (error) => {
            toast({ type: 'error', title: 'Unable to save', message: getErrorMessage(error, 'Feedback could not be recorded') })
        }
    })
}

export const useClientPortalComplaintCreate = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: clientPortalService.createComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-portal'] })
            toast({ type: 'success', title: 'Raised', message: 'Complaint raised successfully' })
        },
        onError: (error) => {
            toast({ type: 'error', title: 'Unable to raise', message: getErrorMessage(error, 'Complaint could not be raised') })
        }
    })
}
