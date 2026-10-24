import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unitService } from '../services/unit'
import type { UnitFormValues } from '../schema'
import { useToast } from '../../../components/Toast'

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: unitService.getUnits
    })
}

export const useAuthorizedUnits = () => {
    return useQuery({
        queryKey: ['authorizedUnits'],
        queryFn: unitService.getAuthorizedUnits
    })
}

export const useAddUnit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: unitService.addUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            toast({ type: 'success', title: 'Success', message: 'Unit added successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveErrorMessage(error, 'Failed to add unit') })
        }
    })
}

export const useUpdateUnit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: UnitFormValues }) => unitService.updateUnit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            toast({ type: 'success', title: 'Success', message: 'Unit updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveErrorMessage(error, 'Failed to update unit') })
        }
    })
}

export const useDeleteUnit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: unitService.deleteUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] })
            toast({ type: 'success', title: 'Success', message: 'Unit deleted successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveErrorMessage(error, 'Failed to delete unit') })
        }
    })
}
