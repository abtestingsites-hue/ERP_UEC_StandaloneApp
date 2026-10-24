// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/axios'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

const resolveErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback

// --- Services ---

export const nursingCareService = {
    getCaregiverVitalCharts: async (month?: string, patientId?: string, unitId?: string | null) => {
        const res = await api.get('/nursing-care/caregiver-vital-charts', {
            params: { month, patientId },
            ...(unitId ? { headers: { 'x-unit-id': unitId } } : {})
        })
        return res.data?.data || []
    },
    saveCaregiverVitalChart: async (payload: any) => {
        const { unitId, ...requestBody } = payload
        const res = await api.post('/nursing-care/caregiver-vital-charts', requestBody, unitId ? { headers: { 'x-unit-id': unitId } } : undefined)
        return res.data?.data
    },
    getVitals: async (patientId: string, unitId?: string | null) => {
        const config: any = { params: { patientId } }
        if (unitId) config.headers = { 'x-unit-id': unitId }
        const res = await api.get('/nursing-care/vitals', config)
        return res.data?.data || []
    },
    saveVital: async (payload: any) => {
        const { unitId, ...requestBody } = payload
        const res = await api.post('/nursing-care/vitals', requestBody, unitId ? { headers: { 'x-unit-id': unitId } } : undefined)
        return res.data?.data
    },
    verifyVital: async ({ id, notes, unitId }: { id: string, notes?: string, unitId?: string | null }) => {
        const config: any = unitId ? { headers: { 'x-unit-id': unitId } } : undefined
        const res = await api.patch(`/nursing-care/vitals/${id}/verify`, { notes }, config)
        return res.data?.data
    },
    getPrescriptions: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {}
        if (patientId) config.params = { patientId }
        if (unitId) config.headers = { 'x-unit-id': unitId }
        const res = await api.get('/nursing-care/prescriptions', config)
        return res.data?.data || []
    },
    createPrescription: async (payload: any) => {
        const res = await api.post('/nursing-care/prescriptions', payload)
        return res.data?.data
    },
    getMedicationLogs: async (patientId?: string | null, unitId?: string | null) => {
        const config: any = {}
        if (patientId) config.params = { patientId }
        if (unitId) config.headers = { 'x-unit-id': unitId }
        const res = await api.get('/nursing-care/medication-logs', config)
        return res.data?.data || []
    },
    administerMedicationLog: async (payload: any) => {
        const res = await api.post('/nursing-care/medication-logs', payload)
        return res.data?.data
    },
    verifyMedicationLog: async ({ id, notes }: { id: string, notes?: string }) => {
        const res = await api.patch(`/nursing-care/medication-logs/${id}/verify`, { notes })
        return res.data?.data
    },
    getMedicationSchedules: async (unitId?: string | null, patientId?: string | null) => {
        const config: any = {}
        if (unitId) config.headers = { 'x-unit-id': unitId }
        if (patientId) config.params = { patientId }
        const res = await api.get('/nursing-care/medication-schedules', config)
        return res.data?.data || []
    },
    createMedicationSchedule: async (payload: any) => {
        const res = await api.post('/nursing-care/medication-schedules', payload)
        return res.data?.data
    },
    administerMedicationDose: async ({ id, slot, remarks }: any) => {
        const res = await api.patch(`/nursing-care/medication-schedules/${id}/administer`, { slot, remarks })
        return res.data?.data
    }
}

// --- Hooks ---

export const useNursingCaregiverVitalCharts = (month?: string, patientId?: string, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['nursing-care', 'caregiver-vital-charts', resolvedUnitId, month, patientId],
        queryFn: () => nursingCareService.getCaregiverVitalCharts(month, patientId, unitId),
        enabled: options?.enabled
    })
}

export const useNursingCareVitals = (patientId?: string, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['nursing-care', 'vitals', resolvedUnitId, patientId],
        queryFn: () => patientId ? nursingCareService.getVitals(patientId, unitId) : Promise.resolve([]),
        enabled: Boolean(patientId) && options?.enabled !== false
    })
}

export const useSaveNursingCareVital = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: nursingCareService.saveVital,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] })
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'caregiver-vital-charts'] })
            toast('success', 'Vital sign saved successfully')
        },
        onError: (error: any) => {
            toast('error', resolveErrorMessage(error, 'Failed to save vital sign'))
        }
    })
}

export const useVerifyNursingCareVital = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: nursingCareService.verifyVital,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] })
            toast('success', 'Vital sign verified successfully')
        },
        onError: (error: any) => {
            toast('error', resolveErrorMessage(error, 'Failed to verify vital sign'))
        }
    })
}

export const usePrescriptions = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['nursing-care', 'prescriptions', resolvedUnitId, patientId],
        queryFn: () => nursingCareService.getPrescriptions(patientId, unitId),
        enabled: options?.enabled
    })
}

export const useCreatePrescription = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.createPrescription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'prescriptions'] })
            toast('success', 'Prescription created successfully')
        },
        onError: (error: any) => toast('error', resolveErrorMessage(error, 'Failed to create prescription'))
    })
}

export const useMedicationLogs = (patientId?: string | null, unitId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['nursing-care', 'medication-logs', resolvedUnitId, patientId],
        queryFn: () => nursingCareService.getMedicationLogs(patientId, unitId),
        enabled: options?.enabled
    })
}

export const useAdministerMedicationLog = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.administerMedicationLog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medication-logs'] })
            toast('success', 'Medication log administered')
        },
        onError: (error: any) => toast('error', resolveErrorMessage(error, 'Failed to administer medication'))
    })
}

export const useVerifyMedicationLog = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.verifyMedicationLog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medication-logs'] })
            toast('success', 'Medication log verified')
        },
        onError: (error: any) => toast('error', resolveErrorMessage(error, 'Failed to verify medication log'))
    })
}

export const useSaveNursingCaregiverVitalChart = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.saveCaregiverVitalChart,
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] })
            // Re-fetch shared clinical summaries if applicable
            queryClient.invalidateQueries({ queryKey: ['clinical-summary'] })
            toast({ title: 'Success', message: 'Caregiver vital chart saved', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to save vital chart'), type: 'error' })
    })
}

export const useNursingMedicationSchedules = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['nursing-care', 'medications', resolvedUnitId, patientId],
        queryFn: () => nursingCareService.getMedicationSchedules(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreateNursingMedicationSchedule = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.createMedicationSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medications'] })
            toast({ title: 'Success', message: 'Medication schedule created', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to create medication schedule'), type: 'error' })
    })
}

export const useAdministerNursingMedicationDose = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: nursingCareService.administerMedicationDose,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'medications'] })
            queryClient.invalidateQueries({ queryKey: ['clinical-summary'] })
            toast({ title: 'Success', message: 'Medication dose administered', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to administer dose'), type: 'error' })
    })
}


