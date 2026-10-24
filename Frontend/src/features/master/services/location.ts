import { api } from '../../../lib/axios'
import type { Location } from '../types'

export const locationService = {
    searchLocations: async (query: string): Promise<Location[]> => {
        const trimmedQuery = query.trim()
        if (!trimmedQuery) return []

        const res = await api.get('/location/search', {
            params: { q: trimmedQuery }
        })

        return (res.data.data || []).map((location: any) => ({
            id: location.id,
            name: location.name,
            state: location.state,
            country: location.country,
            pincode: location.pincode ?? null,
            label: location.label || `${location.name}, ${location.state}, ${location.country}`
        }))
    },

    createLocation: async (data: { name: string; state: string; country: string; pincode?: string }): Promise<Location> => {
        const res = await api.post('/location', data)
        const location = res.data.data

        return {
            id: location.id,
            name: location.name,
            state: location.state,
            country: location.country,
            pincode: location.pincode ?? null,
            label: location.label || `${location.name}, ${location.state}, ${location.country}`
        }
    }
}
