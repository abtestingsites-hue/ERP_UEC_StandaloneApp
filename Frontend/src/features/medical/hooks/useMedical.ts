import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { medicalService } from '../services/medical'
import type { MedicalAssignmentFormValues, MedicalAssignmentStatus } from '../types'

const resolveApiErrorMessage = (error: any, fallback: string) => {
    const validationErrors = error?.response?.data?.errors
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0]?.message || fallback
    }

    return error?.response?.data?.message || fallback
}

export const useMedicalAssignments = (params?: {
    search?: string
    status?: string
    staffId?: string
    patientId?: string
    allocationId?: string
    from?: string
    to?: string
    activeOnly?: boolean
}) => {
    return useQuery({
        queryKey: ['medical-assignments', params],
        queryFn: () => medicalService.getAssignments(params),
        retry: false
    })
}

export const useMedicalDashboard = () => {
    return useQuery({
        queryKey: ['medical-dashboard'],
        queryFn: medicalService.getDashboard,
        retry: false
    })
}

export const useMedicalPatients = () => {
    return useQuery({
        queryKey: ['medical-patients'],
        queryFn: medicalService.getPatients,
        retry: false
    })
}

export const useMedicalStaff = () => {
    return useQuery({
        queryKey: ['medical-staff'],
        queryFn: medicalService.getStaff,
        retry: false
    })
}

export const useCreateMedicalAssignment = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: MedicalAssignmentFormValues) => medicalService.createAssignment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] })
            queryClient.invalidateQueries({ queryKey: ['medical-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] })
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast({ type: 'success', title: 'Assigned', message: 'Medical duty assigned successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to assign medical duty') })
        }
    })
}

export const useUpdateMedicalAssignment = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MedicalAssignmentFormValues> }) =>
            medicalService.updateAssignment({ id, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] })
            queryClient.invalidateQueries({ queryKey: ['medical-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] })
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast({ type: 'success', title: 'Updated', message: 'Medical assignment updated' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to update assignment') })
        }
    })
}

export const useUpdateMedicalAssignmentStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, status, notes }: { id: string; status: MedicalAssignmentStatus; notes?: string }) =>
            medicalService.updateStatus({ id, status, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] })
            queryClient.invalidateQueries({ queryKey: ['medical-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['medical-staff'] })
            queryClient.invalidateQueries({ queryKey: ['staff'] })
            toast({ type: 'success', title: 'Status updated', message: 'Medical duty status changed' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to update duty status') })
        }
    })
}

export const useDeleteMedicalAssignment = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => medicalService.deleteAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-assignments'] })
            queryClient.invalidateQueries({ queryKey: ['medical-dashboard'] })
            toast({ type: 'success', title: 'Deleted', message: 'Medical assignment removed' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to delete assignment') })
        }
    })
}

export const useDoctorVisits = (params?: { patientId?: string; doctorId?: string }) => {
    return useQuery({
        queryKey: ['doctor-visits', params],
        queryFn: () => medicalService.getDoctorVisits(params)
    })
}

export const useCreateDoctorVisit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: any) => medicalService.createDoctorVisit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-visits'] })
            toast({ type: 'success', title: 'Saved', message: 'Doctor visit saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to save visit') })
        }
    })
}

export const useUpdateDoctorVisit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => medicalService.updateDoctorVisit({ id, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-visits'] })
            toast({ type: 'success', title: 'Updated', message: 'Doctor visit updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to update visit') })
        }
    })
}
