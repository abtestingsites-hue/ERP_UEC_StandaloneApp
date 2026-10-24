import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export const useLabourServices = () => {
    return useQuery({
        queryKey: ['labour-services'],
        queryFn: async () => {
            const res = await api.get('/master/labour-services')
            return res.data.data || []
        },
        retry: false
    })
}

export const useCreateLabourService = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/master/labour-services', data)
            return res.data.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] })
        }
    })
}

export const useUpdateLabourService = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/master/labour-services/${id}`, data)
            return res.data.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] })
        }
    })
}

export const useDeleteLabourService = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/master/labour-services/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labour-services'] })
        }
    })
}
