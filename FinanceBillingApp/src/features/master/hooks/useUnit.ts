import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const res = await api.get('/master/unit')
            return res.data.data.map((u: any) => ({
                id: u.id,
                unitId: u.code,
                name: u.name,
                shortName: u.shortName || '',
                type: u.unitType || '',
                locationId: u.locationId,
                address: u.address || '',
                pincode: u.pincode || '',
                email: u.email || '',
                phone: u.phone || '',
                status: u.status ? 'active' : 'inactive'
            }))
        }
    })
}
