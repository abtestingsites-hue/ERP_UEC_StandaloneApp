import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/axios'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

const resolveErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback

// --- Services ---

export const patientCareService = {
    getAdlRecords: async (unitId?: string | null, patientId?: string | null) => {
        const config: any = {}
        if (unitId) config.headers = { 'x-unit-id': unitId }
        if (patientId) config.params = { patientId }
        const res = await api.get('/patient-care/adl-records', config)
        return res.data?.data || []
    },
    createAdlRecord: async (payload: any) => {
        const res = await api.post('/patient-care/adl-records', payload)
        return res.data?.data
    },
    updateAdlStatus: async ({ id, status }: any) => {
        const res = await api.patch(`/patient-care/adl-records/${id}/status`, { status })
        return res.data?.data
    },
    getNutritionPlans: async (unitId?: string | null, patientId?: string | null) => {
        const config: any = {}
        if (unitId) config.headers = { 'x-unit-id': unitId }
        if (patientId) config.params = { patientId }
        const res = await api.get('/patient-care/nutrition', config)
        return res.data?.data || []
    },
    createNutritionPlan: async (payload: any) => {
        const res = await api.post('/patient-care/nutrition', payload)
        return res.data?.data
    },
    getClinicalSummary: async (patientId: string, unitId?: string | null) => {
        const config: any = {}
        if (unitId) config.headers = { 'x-unit-id': unitId }
        const res = await api.get(`/patient-care/residents/${patientId}/clinical-summary`, config)
        return res.data?.data
    }
}

// --- Hooks ---

export const usePatientCareAdlRecords = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['patient-care', 'adl', resolvedUnitId, patientId],
        queryFn: () => patientCareService.getAdlRecords(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreatePatientCareAdlRecord = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: patientCareService.createAdlRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'adl'] })
            queryClient.invalidateQueries({ queryKey: ['clinical-summary'] })
            toast({ title: 'Success', message: 'ADL record saved', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to save ADL record'), type: 'error' })
    })
}

export const useUpdatePatientCareAdlStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: patientCareService.updateAdlStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'adl'] })
            queryClient.invalidateQueries({ queryKey: ['clinical-summary'] })
            toast({ title: 'Success', message: 'ADL status updated', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to update ADL status'), type: 'error' })
    })
}

export const usePatientCareNutritionPlans = (unitId?: string | null, patientId?: string | null, options?: { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')
    const resolvedUnitId = unitId || activeUnitId
    return useQuery({
        queryKey: ['patient-care', 'nutrition', resolvedUnitId, patientId],
        queryFn: () => patientCareService.getNutritionPlans(unitId, patientId),
        enabled: options?.enabled
    })
}

export const useCreatePatientCareNutritionPlan = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: patientCareService.createNutritionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'nutrition'] })
            queryClient.invalidateQueries({ queryKey: ['clinical-summary'] })
            toast({ title: 'Success', message: 'Nutrition plan saved', type: 'success' })
        },
        onError: (error) => toast({ title: 'Error', message: resolveErrorMessage(error, 'Failed to save nutrition plan'), type: 'error' })
    })
}

export const useClinicalSummary = (patientId: string, unitId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['clinical-summary', patientId],
        queryFn: () => patientCareService.getClinicalSummary(patientId, unitId),
        enabled: options?.enabled && !!patientId
    })
}


