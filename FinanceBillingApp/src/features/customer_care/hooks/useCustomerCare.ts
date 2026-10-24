import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerCareService } from '../services/customer_care'
import { useToast } from '../../../components/Toast'

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
