import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'
import { healthcareService } from '../services/healthcare'

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

export const useMedicationSchedules = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['healthcare-medication-schedules', resolvedUnitId, patientId],
        queryFn: () => healthcareService.getMedicationSchedules(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useHealthcarePatients = (unitId?: string | null) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || state.user?.permissions?.includes('ALL_ACCESS') || false)
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['healthcare-patients', unitId ? resolvedUnitId : canReadAllUnits ? 'all' : resolvedUnitId],
        queryFn: () => healthcareService.getPatients(unitId, !unitId && canReadAllUnits ? { scope: 'all' } : undefined)
    })
}

export const useCreateHealthcarePatient = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.createPatient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthcare-patients'] })
            toast({ type: 'success', title: 'Patient Saved', message: 'Patient added to live healthcare dashboard' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Patient Failed', message: resolveErrorMessage(error, 'Failed to save patient') })
        }
    })
}

export const useVitalSigns = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['healthcare-vital-signs', resolvedUnitId, patientId],
        queryFn: () => healthcareService.getVitalSigns(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreateVitalSign = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.createVitalSign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthcare-vital-signs'] })
            toast({ type: 'success', title: 'Vitals Saved', message: 'Vital signs recorded successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Vitals Failed', message: resolveErrorMessage(error, 'Failed to save vital signs') })
        }
    })
}

export const useCaregiverVitalCharts = (month?: string, patientId?: string, unitId?: string | null) => {
    return useQuery({
        queryKey: ['caregiver-vital-charts', month || 'all', patientId || 'all', unitId || 'active-unit'],
        queryFn: () => healthcareService.getCaregiverVitalCharts(month, patientId, unitId),
        staleTime: 30_000
    })
}

export const useSaveCaregiverVitalChart = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.saveCaregiverVitalChart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['caregiver-vital-charts'] })
            queryClient.invalidateQueries({ queryKey: ['admin-file-register'] })
            queryClient.invalidateQueries({ queryKey: ['healthcare-vital-signs'] })
            queryClient.invalidateQueries({ queryKey: ['healthcare-patients'] })
            toast({ type: 'success', title: 'Chart Saved', message: 'Caregiver vital chart saved' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Chart Failed', message: resolveErrorMessage(error, 'Failed to save caregiver vital chart') })
        }
    })
}

export const useNutritionPlans = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['healthcare-nutrition-plans', resolvedUnitId, patientId],
        queryFn: () => healthcareService.getNutritionPlans(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreateNutritionPlan = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.createNutritionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthcare-nutrition-plans'] })
            queryClient.invalidateQueries({ queryKey: ['healthcare-patients'] })
            toast({ type: 'success', title: 'Diet Plan Saved', message: 'Nutrition plan added successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Diet Plan Failed', message: resolveErrorMessage(error, 'Failed to save nutrition plan') })
        }
    })
}

export const useAdlRecords = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['healthcare-adl-records', resolvedUnitId, patientId],
        queryFn: () => healthcareService.getAdlRecords(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreateAdlRecord = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.createAdlRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthcare-adl-records'] })
            toast({ type: 'success', title: 'ADL Saved', message: 'Daily living record saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'ADL Failed', message: resolveErrorMessage(error, 'Failed to save ADL record') })
        }
    })
}

export const useUpdateAdlStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.updateAdlStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['healthcare-adl-records'] })
            toast({ type: 'success', title: 'ADL Updated', message: 'Daily living status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'ADL Update Failed', message: resolveErrorMessage(error, 'Failed to update ADL status') })
        }
    })
}

export const useCreateMedicationSchedule = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.createMedicationSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medication-schedules'] })
            toast({ type: 'success', title: 'Schedule Saved', message: 'Medication schedule saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Schedule Failed', message: resolveErrorMessage(error, 'Failed to save medication schedule') })
        }
    })
}

export const useAdministerMedicationDose = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: healthcareService.administerMedicationDose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medication-schedules'] })
            toast({ type: 'success', title: 'Dose Updated', message: 'Medication dose marked as administered' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Dose Failed', message: resolveErrorMessage(error, 'Failed to update medication dose') })
        }
    })
}
