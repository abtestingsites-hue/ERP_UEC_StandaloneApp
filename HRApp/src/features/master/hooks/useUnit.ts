import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const res = await api.get('/master/unit')
            return (res.data.data || []).map((u: any) => ({
                id: u.id,
                unitId: u.code,
                name: u.name,
                shortName: u.shortName || '',
                type: u.unitType || '',
                status: u.status ? 'active' : 'inactive'
            }))
        },
        retry: false
    })
}

export const useAuthorizedUnits = () => {
    return useQuery({
        queryKey: ['authorizedUnits'],
        queryFn: async () => {
            const res = await api.get('/master/unit/authorized')
            return (res.data.data || []).map((u: any) => ({
                id: u.id,
                unitId: u.code,
                name: u.name,
                shortName: u.shortName || '',
                type: u.unitType || '',
                status: u.status ? 'active' : 'inactive'
            }))
        },
        retry: false
    })
}
