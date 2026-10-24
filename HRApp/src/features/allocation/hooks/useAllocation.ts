import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export const useHomeCareAllocations = (unitId?: string | null) => {
    return useQuery({
        queryKey: ['allocations', 'home-care', unitId],
        queryFn: async () => {
            const res = await api.get('/allocation/home-care', {
                headers: unitId ? { 'x-unit-id': unitId } : undefined
            })
            return res.data.data || []
        },
        retry: false
    })
}

export const useOthersAllocations = (unitId?: string | null) => {
    return useQuery({
        queryKey: ['allocations', 'others', unitId],
        queryFn: async () => {
            const res = await api.get('/allocation/others', {
                headers: unitId ? { 'x-unit-id': unitId } : undefined
            })
            return res.data.data || []
        },
        retry: false
    })
}
