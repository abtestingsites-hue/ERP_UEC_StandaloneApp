import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { securityService } from '../services/security'

const resolveErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || error?.response?.data?.error || (error?.message ? `${fallback}: ${error.message}` : fallback)
}

export const useGateQueue = () => {
    return useQuery({
        queryKey: ['security-gate-queue'],
        queryFn: securityService.getGateQueue,
        retry: false
    })
}

export const useDashboardActionQueue = () => {
    return useQuery({
        queryKey: ['security-dashboard-action-queue'],
        queryFn: securityService.getDashboardActionQueue,
        retry: false,
        refetchInterval: 15000 // Poll every 15s to keep dashboard live
    })
}

export const useDailyMovementReport = (date: string) => {
    return useQuery({
        queryKey: ['security-daily-movement-report', date],
        queryFn: () => securityService.getDailyMovementReport(date),
        retry: false
    })
}

export const useSecurityDashboardSummary = () => {
    return useQuery({
        queryKey: ['security-dashboard-summary'],
        queryFn: securityService.getSecurityDashboardSummary,
        refetchInterval: 15000,
        retry: false
    })
}


export const useCheckInExpectedVisitor = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.checkInExpectedVisitor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-gate-queue'] })
            toast({ type: 'success', title: 'Checked In', message: 'Expected visitor moved to active gate register' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Check-in Failed', message: resolveErrorMessage(error, 'Failed to check in expected visitor') })
        }
    })
}

export const useCheckoutGateEntry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.checkoutGateEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-gate-queue'] })
            toast({ type: 'success', title: 'Checked Out', message: 'Visitor checkout saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Checkout Failed', message: resolveErrorMessage(error, 'Failed to checkout visitor') })
        }
    })
}




export const useResidentOutings = () => {
    return useQuery({
        queryKey: ['security-resident-outings'],
        queryFn: securityService.getResidentOutings,
        retry: false
    })
}

export const useRecordResidentExit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordResidentExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] })
            toast({ type: 'success', title: 'Resident Exit', message: 'Physical exit recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Exit Failed', message: resolveErrorMessage(error, 'Failed to record resident exit') })
        }
    })
}

export const useRecordResidentReturn = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordResidentReturn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] })
            toast({ type: 'success', title: 'Resident Return', message: 'Physical return recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Return Failed', message: resolveErrorMessage(error, 'Failed to record resident return') })
        }
    })
}

export const useCreateResidentOuting = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.createResidentOuting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] })
            toast({ type: 'success', title: 'Outing Created', message: 'Resident outing created successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Creation Failed', message: resolveErrorMessage(error, 'Failed to create resident outing') })
        }
    })
}

// ==========================================
// Phase 3: Staff Movement Hooks
// ==========================================

export const useStaffMovements = (params?: { status?: string; date?: string; staffId?: string }) => {
    return useQuery({
        queryKey: ['security-staff-movements', params],
        queryFn: () => securityService.getStaffMovements(params),
        retry: false
    })
}

export const useStaffMovement = (id: string) => {
    return useQuery({
        queryKey: ['security-staff-movements', id],
        queryFn: () => securityService.getStaffMovementById(id),
        enabled: !!id,
        retry: false
    })
}

export const useNewStaffEntry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordStaffEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] })
            toast({ type: 'success', title: 'Staff Checked In', message: 'Staff initial entry recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Entry Failed', message: resolveErrorMessage(error, 'Failed to check in staff') })
        }
    })
}

export const useStaffTempExit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordStaffTempExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] })
            toast({ type: 'success', title: 'Temporary Exit', message: 'Staff temporary exit recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Exit Failed', message: resolveErrorMessage(error, 'Failed to record temporary exit') })
        }
    })
}

export const useStaffReturn = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordStaffReturn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] })
            toast({ type: 'success', title: 'Return Recorded', message: 'Staff return recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Return Failed', message: resolveErrorMessage(error, 'Failed to record staff return') })
        }
    })
}

export const useStaffFinalExit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordStaffFinalExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] })
            toast({ type: 'success', title: 'Final Exit Recorded', message: 'Staff daily movement completed successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Final Exit Failed', message: resolveErrorMessage(error, 'Failed to record final exit') })
        }
    })
}

// ==========================================
// Phase 4: Vehicle Movement Hooks
// ==========================================

export const useVehicleMovements = (params?: { status?: string; date?: string; vehicleNo?: string }) => {
    return useQuery({
        queryKey: ['security-vehicle-movements', params],
        queryFn: () => securityService.getVehicleMovements(params),
        retry: false
    })
}

export const useVehicleMovement = (id: string) => {
    return useQuery({
        queryKey: ['security-vehicle-movements', id],
        queryFn: () => securityService.getVehicleMovementById(id),
        enabled: !!id,
        retry: false
    })
}

export const useRecordVehicleEntry = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordVehicleEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-vehicle-movements'] })
            toast({ type: 'success', title: 'Vehicle Checked In', message: 'Vehicle entry recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Entry Failed', message: resolveErrorMessage(error, 'Failed to check in vehicle') })
        }
    })
}

export const useRecordVehicleExit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: securityService.recordVehicleExit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-vehicle-movements'] })
            toast({ type: 'success', title: 'Vehicle Checked Out', message: 'Vehicle checkout recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Checkout Failed', message: resolveErrorMessage(error, 'Failed to check out vehicle') })
        }
    })
}

// ==========================================
// Phase 3: Movement Timeline Hook
// ==========================================

export const useMovementTimeline = (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
    return useQuery({
        queryKey: ['security-movement-timeline', params],
        queryFn: () => securityService.getMovementTimeline(params),
        retry: false
    })
}
