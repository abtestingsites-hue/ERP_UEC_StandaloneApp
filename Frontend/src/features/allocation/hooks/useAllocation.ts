import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { allocationService } from '../services/allocation'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/authStore'

export const useHomeCareAllocations = (unitId?: string | null) => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['allocations', 'home-care', unitId || (canReadAllUnits ? 'all' : 'active-unit')],
        queryFn: () => allocationService.getHomeCareAllocations(unitId, !unitId && canReadAllUnits ? { scope: 'all' } : undefined)
    })
}

export const useOthersAllocations = (unitId?: string | null) => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['allocations', 'others', unitId || (canReadAllUnits ? 'all' : 'active-unit')],
        queryFn: () => allocationService.getOthersAllocations(unitId, !unitId && canReadAllUnits ? { scope: 'all' } : undefined)
    })
}

export const useClinicalAllocations = (unitId?: string | null) => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['allocations', 'clinical', unitId || (canReadAllUnits ? 'all' : 'active-unit')],
        queryFn: () => allocationService.getClinicalAllocations(unitId, !unitId && canReadAllUnits ? { scope: 'all' } : undefined)
    })
}

export const useInHouseAllocations = (unitId?: string | null) => {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)

    return useQuery({
        queryKey: ['allocations', 'in-house', unitId || (canReadAllUnits ? 'all' : 'active-unit')],
        queryFn: () => allocationService.getInHouseAllocations(unitId, !unitId && canReadAllUnits ? { scope: 'all' } : undefined)
    })
}

export const useCreateAllocation = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: allocationService.createAllocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocations'] })
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            toast({ type: 'success', title: 'Care Assigned', message: 'Admission handoff moved into allocation workflow' })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to assign care'
            console.error('Create allocation failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Handoff Failed', message })
        }
    })
}

export const useUpdateAllocation = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: allocationService.updateAllocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocations'] })
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            toast({ type: 'success', title: 'Staff Assigned', message: 'Allocation updated successfully' })
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update allocation'
            console.error('Update allocation failed:', error?.response?.data || error)
            toast({ type: 'error', title: 'Assignment Failed', message })
        }
    })
}
