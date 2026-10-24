import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export function useMyShift() {
    return useQuery({
        queryKey: ['my-shift'],
        queryFn: async () => {
            const { data } = await api.get('/medical/my-shift')
            return data.data
        }
    })
}
