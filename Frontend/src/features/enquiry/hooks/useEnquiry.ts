import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enquiryService } from '../services/enquiry'
import type { ClientPortalAccessPayload } from '../services/enquiry'
import type { EnquiryFormValues } from '../schema'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

export const useEnquiries = () => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['enquiries', canReadAllUnits ? 'all' : 'unit'],
        queryFn: () => enquiryService.getEnquiries(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    })
}

export const useEnquiry = (id: string) => {
    return useQuery({
        queryKey: ['enquiries', id],
        queryFn: () => enquiryService.getEnquiryDetail(id),
        enabled: !!id,
        retry: false
    })
}

export const useAddEnquiry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: enquiryService.addEnquiry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast({ type: 'success', title: 'Success', message: 'Enquiry created successfully' })
        },
        onError: (error: any) => {
            const code = error?.response?.data?.code
            const details = error?.response?.data?.details
            const target =
                details?.field_name ||
                details?.target ||
                details?.constraint ||
                details?.column
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create enquiry'
            const diagnostic = [message, code, target ? `target: ${Array.isArray(target) ? target.join(', ') : target}` : '']
                .filter(Boolean)
                .join(' - ')
            console.error('Create enquiry failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Error', message: diagnostic })
        }
    })
}

export const useUpdateEnquiry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: EnquiryFormValues }) => enquiryService.updateEnquiry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            toast({ type: 'success', title: 'Success', message: 'Enquiry updated' })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update enquiry'
            console.error('Update enquiry failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Error', message })
        }
    })
}

export const useDeleteEnquiry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: enquiryService.deleteEnquiry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            toast({ type: 'success', title: 'Success', message: 'Enquiry deleted' })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to delete';
            toast({ type: 'error', title: 'Error', message });
        }
    })
}

export const useAddFollowUp = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string
            data: {
                notes: string
                nextDate: string
                staffId?: string
                channel?: string
                outcome?: string
                attachmentName?: string
                clientInterest?: string
                readyToPayAmount?: number
                paymentMode?: string
                nextFollowupStatus?: string
            }
        }) => enquiryService.addFollowUp(id, data),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['allocations'] })
            toast({
                type: 'success',
                title: 'Success',
                message: result?.assignedStaffId
                    ? 'Follow-up assigned to selected staff and notification sent'
                    : 'Follow-up recorded'
            })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to record follow-up'
            console.error('Follow-up failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Error', message })
        }
    })
}

export const useRenewalFollowUpOutcome = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string
            data: {
                followUpId?: string
                outcome: 'INTERESTED' | 'NOT_INTERESTED' | 'CALL_LATER' | 'CONVERTED_TO_NEW_SERVICE' | 'CLOSED'
                notes?: string
                nextDate?: string
                service?: string
            }
        }) => enquiryService.recordRenewalOutcome(id, data),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['workflow-timeline'] })
            toast({
                type: 'success',
                title: result?.newEnquiry ? 'New Enquiry Created' : 'Outcome Saved',
                message: result?.newEnquiry
                    ? 'Renewal follow-up converted into a fresh enquiry'
                    : 'Renewal follow-up outcome was updated'
            })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update renewal outcome'
            toast({ type: 'error', title: 'Outcome Failed', message })
        }
    })
}

export const useClients = () => {
    return useQuery({
        queryKey: ['clients'],
        queryFn: enquiryService.getClients,
        retry: false
    })
}

export const useAdmissions = () => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['admissions', canReadAllUnits ? 'all' : 'unit'],
        queryFn: () => enquiryService.getAdmissions(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    })
}

export const useConvertToAdmission = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string
            data: { patientName?: string, status?: string }
        }) => enquiryService.convertToAdmission(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            toast({ type: 'success', title: 'Admission Created', message: 'Enquiry moved into admission tracking' })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to convert enquiry'
            console.error('Admission conversion failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Conversion Failed', message })
        }
    })
}

export const useCreateExistingPatient = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: enquiryService.createExistingPatient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            queryClient.invalidateQueries({ queryKey: ['allocations'] })
            queryClient.invalidateQueries({ queryKey: ['patient-billing-services'] })
            queryClient.invalidateQueries({ queryKey: ['daily-operations'] })
            queryClient.invalidateQueries({ queryKey: ['workflow-timeline'] })
            toast({
                type: 'success',
                title: 'Existing Patient Added',
                message: 'Admission and allocation records are now available for operations and billing'
            })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add existing patient'
            console.error('Existing patient creation failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Existing Patient Failed', message })
        }
    })
}

export const useCreateAdmissionClientPortalAccess = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            admissionId,
            data
        }: {
            admissionId: string
            data: { email: string; mobile?: string; password: string; roleName: 'Family Member' | 'Client Family Member' }
        }) => enquiryService.createAdmissionClientPortalAccess(admissionId, data),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            toast({
                type: result?.alreadyExists ? 'info' : 'success',
                title: result?.alreadyExists ? 'Already Exists' : 'Access Created',
                message: result?.alreadyExists
                    ? 'A login already exists for this email'
                    : 'Client portal login was created'
            })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create client portal access'
            toast({ type: 'error', title: 'Access Failed', message })
        }
    })
}

export const useUpsertClientPortalAccess = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({
            enquiryId,
            data
        }: {
            enquiryId: string
            data: ClientPortalAccessPayload
        }) => enquiryService.upsertClientPortalAccess(enquiryId, data),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ['enquiries'] })
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast({
                type: result?.created ? 'success' : 'info',
                title: result?.created ? 'Access Created' : 'Access Updated',
                message: result?.created
                    ? 'Client portal login was created'
                    : 'Client portal login was updated'
            })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to save client portal access'
            toast({ type: 'error', title: 'Access Failed', message })
        }
    })
}
