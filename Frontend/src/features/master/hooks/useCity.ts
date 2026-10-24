import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { cityService } from '../services/city'
import type { CityFormValues } from '../schema'
import { useToast } from '../../../components/Toast'

export const useCities = () => {
    return useQuery({
        queryKey: ['cities'],
        queryFn: cityService.getCities
    })
}

export const useAddCity = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: cityService.addCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cities'] })
            toast({ type: 'success', title: 'Success', message: 'City added successfully' })
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to add city'
                : 'Failed to add city'
            toast({ type: 'error', title: 'Error', message })
        }
    })
}

export const useUpdateCity = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: CityFormValues }) => cityService.updateCity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cities'] })
            toast({ type: 'success', title: 'Success', message: 'City updated successfully' })
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to update city'
                : 'Failed to update city'
            toast({ type: 'error', title: 'Error', message })
        }
    })
}

export const useDeleteCity = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: cityService.deleteCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cities'] })
            toast({ type: 'success', title: 'Success', message: 'City deleted successfully' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Error', message: 'Failed to delete city' })
        }
    })
}
