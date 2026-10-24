import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { operationsService } from '../services/operations'

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

export const useLaundryRecords = () => {
    return useQuery({
        queryKey: ['operations-laundry-records'],
        queryFn: operationsService.getLaundryRecords
    })
}

export const useOperationsPatients = () => {
    return useQuery({
        queryKey: ['operations-patients'],
        queryFn: operationsService.getPatients
    })
}

export const useOperationsNutritionPlans = () => {
    return useQuery({
        queryKey: ['operations-nutrition-plans'],
        queryFn: operationsService.getNutritionPlans
    })
}

export const useUpdateDietaryRestrictions = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => operationsService.updateDietaryRestrictions(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-nutrition-plans'] })
        }
    })
}

export const useMealPreps = () => {
    return useQuery({
        queryKey: ['operations-meal-preps'],
        queryFn: operationsService.getMealPreps
    })
}

export const useCreateMealPrep = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.createMealPrep,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-meal-preps'] })
            toast({ type: 'success', title: 'Meal Prep Created', message: 'Diet plan moved to food preparation' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Meal Prep Failed', message: resolveErrorMessage(error, 'Failed to create meal prep') })
        }
    })
}

export const useUpdateMealPrepStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.updateMealPrepStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-meal-preps'] })
            toast({ type: 'success', title: 'Meal Prep Updated', message: 'Food preparation status updated' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update meal prep') })
        }
    })
}

export const useWasteRecords = () => {
    return useQuery({
        queryKey: ['operations-waste-records'],
        queryFn: operationsService.getWasteRecords
    })
}

export const useCreateWasteRecord = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.createWasteRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-waste-records'] })
            toast({ type: 'success', title: 'Waste Added', message: 'Waste record saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Waste Failed', message: resolveErrorMessage(error, 'Failed to save waste record') })
        }
    })
}

export const useUpdateWasteStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.updateWasteStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-waste-records'] })
            toast({ type: 'success', title: 'Waste Updated', message: 'Waste status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update waste status') })
        }
    })
}

export const useCreateLaundryRecord = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.createLaundryRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-laundry-records'] })
            toast({ type: 'success', title: 'Laundry Added', message: 'Laundry record saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Laundry Failed', message: resolveErrorMessage(error, 'Failed to save laundry record') })
        }
    })
}

export const useUpdateLaundryStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.updateLaundryStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-laundry-records'] })
            toast({ type: 'success', title: 'Laundry Updated', message: 'Laundry status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update laundry status') })
        }
    })
}

export const useMaintenanceRecords = () => {
    return useQuery({
        queryKey: ['operations-maintenance-records'],
        queryFn: operationsService.getMaintenanceRecords
    })
}

export const useCreateMaintenanceRecord = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.createMaintenanceRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-maintenance-records'] })
            toast({ type: 'success', title: 'Ticket Added', message: 'Maintenance ticket saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Ticket Failed', message: resolveErrorMessage(error, 'Failed to save maintenance ticket') })
        }
    })
}

export const useUpdateMaintenanceStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: operationsService.updateMaintenanceStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-maintenance-records'] })
            toast({ type: 'success', title: 'Ticket Updated', message: 'Maintenance status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update maintenance status') })
        }
    })
}
