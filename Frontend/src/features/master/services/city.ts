import type { City } from '../types'
import type { CityFormValues } from '../schema'
import { api } from '../../../lib/axios'

export const cityService = {
    getCities: async (): Promise<City[]> => {
        const res = await api.get('/master/city')
        return res.data.data.map((c: any) => ({
            ...c,
            status: c.status ? 'active' : 'inactive'
        }))
    },

    addCity: async (data: CityFormValues): Promise<City> => {
        const res = await api.post('/master/city', {
            ...data,
            status: data.status === 'active'
        })
        return {
            ...res.data.data,
            status: res.data.data.status ? 'active' : 'inactive'
        }
    },

    updateCity: async (id: string, data: CityFormValues): Promise<City> => {
        const res = await api.put(`/master/city/${id}`, {
            ...data,
            status: data.status === 'active'
        })
        return {
            ...res.data.data,
            status: res.data.data.status ? 'active' : 'inactive'
        }
    },

    deleteCity: async (id: string): Promise<void> => {
        await api.delete(`/master/city/${id}`)
    }
}
