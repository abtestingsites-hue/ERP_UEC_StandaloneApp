import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerCareService } from '../services/customer_care'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

export const useComplaints = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || null)
    const canReadAllUnits = useAuthStore((state) => {
        const roleName = typeof state.user?.role === 'string'
            ? state.user.role
            : state.user?.role?.name || ''
        const normalizedRole = roleName.trim().toLowerCase()
        return state.user?.unitAccess?.includes('*') || normalizedRole === 'customer relations manager'
    })

    return useQuery({
        queryKey: ['complaints', canReadAllUnits ? 'all' : activeUnitId],
        queryFn: () => customerCareService.getComplaints(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    })
}

export const useCreateComplaint = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: customerCareService.createComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            toast({ type: 'success', title: 'Ticket Created', message: 'Complaint successfully logged' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Error', message: 'Failed to log complaint' })
        }
    })
}

export const useUpdateComplaintWorkflow = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            complaintId,
            data,
            options
        }: {
            complaintId: string
            data: { status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED'; assignedTo?: string; resolutionNotes?: string }
            options?: { scope?: 'all' }
        }) => customerCareService.updateComplaintWorkflow(complaintId, data, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            queryClient.invalidateQueries({ queryKey: ['workflow-timeline'] })
            toast({ type: 'success', title: 'Complaint Updated', message: 'Complaint workflow has been saved' })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Update Failed', message: err.response?.data?.message || 'Failed to update complaint workflow' })
        }
    })
}

export const useRecordServiceFeedback = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            allocationId,
            data,
            options
        }: {
            allocationId: string
            data: { rating: number; comments?: string }
            options?: { scope?: 'all' }
        }) => customerCareService.recordServiceFeedback(allocationId, data, options),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['customer-care', 'service-history'] })
            queryClient.invalidateQueries({ queryKey: ['customer-care', 'pending-feedback'] })
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            toast({
                type: result?.complaint ? 'warning' : 'success',
                title: result?.complaint ? 'Feedback Logged with Complaint' : 'Service Closed',
                message: result?.complaint
                    ? `Low feedback captured and complaint ${result.complaint.refNo} created`
                    : 'Customer feedback recorded successfully'
            })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Feedback Failed', message: err.response?.data?.message || 'Failed to record service feedback' })
        }
    })
}

export const useCreateRenewalFollowUp = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            allocationId,
            data,
            options
        }: {
            allocationId: string
            data: { nextDate?: string | null; notes?: string; channel?: string }
            options?: { scope?: 'all' }
        }) => customerCareService.createRenewalFollowUp(allocationId, data, options),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'renewal-candidates'] })
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['workflow-timeline'] })
            toast({
                type: result?.alreadyExists ? 'warning' : 'success',
                title: result?.alreadyExists ? 'Follow-up Exists' : 'Follow-up Created',
                message: result?.alreadyExists
                    ? 'This renewal already has a follow-up'
                    : 'Renewal follow-up was added to enquiry follow-up'
            })
        },
        onError: (err: any) => {
            toast({ type: 'error', title: 'Follow-up Failed', message: err.response?.data?.message || 'Failed to create renewal follow-up' })
        }
    })
}
