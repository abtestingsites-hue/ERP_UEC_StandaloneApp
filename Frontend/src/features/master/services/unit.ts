import type { Unit } from '../types'
import type { UnitFormValues } from '../schema'
import { api } from '../../../lib/axios'

export const unitService = {
    getUnits: async (): Promise<Unit[]> => {
        const res = await api.get('/master/unit')
        return res.data.data.map((u: any) => ({
            id: u.id,
            unitId: u.code,
            name: u.name,
            shortName: u.shortName || '',
            type: u.unitType || '',
            locationId: u.locationId,
            location: {
                id: u.location?.id || u.locationId,
                name: u.location?.name || '',
                state: u.location?.state || '',
                country: u.location?.country || '',
                pincode: u.location?.pincode ?? null,
                label: u.location ? `${u.location.name}, ${u.location.state}, ${u.location.country}` : ''
            },
            address: u.address || '',
            pincode: u.pincode || '',
            email: u.email || '',
            phone: u.phone || '',
            status: u.status ? 'active' : 'inactive',
            logo: u.logoUrl || undefined
        }))
    },

    getAuthorizedUnits: async (): Promise<Unit[]> => {
        const res = await api.get('/master/unit/authorized')
        return res.data.data.map((u: any) => ({
            id: u.id,
            unitId: u.code,
            name: u.name,
            shortName: u.shortName || '',
            type: u.unitType || '',
            locationId: u.locationId,
            location: {
                id: u.location?.id || u.locationId,
                name: u.location?.name || '',
                state: u.location?.state || '',
                country: u.location?.country || '',
                pincode: u.location?.pincode ?? null,
                label: u.location ? `${u.location.name}, ${u.location.state}, ${u.location.country}` : ''
            },
            address: u.address || '',
            pincode: u.pincode || '',
            email: u.email || '',
            phone: u.phone || '',
            status: u.status ? 'active' : 'inactive',
            logo: u.logoUrl || undefined
        }))
    },

    addUnit: async (data: UnitFormValues): Promise<Unit> => {
        const payload = {
            name: data.name,
            code: `U-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            shortName: data.shortName,
            unitType: data.type,
            locationId: data.locationId,
            address: data.address,
            pincode: data.pincode,
            email: data.email,
            phone: data.phone,
            status: data.status === 'active'
            // logo Url upload handling goes here (Multer) eventually
        }
        const res = await api.post('/master/unit', payload)

        return {
            ...res.data.data,
            unitId: res.data.data.code,
            type: res.data.data.unitType,
            locationId: res.data.data.locationId,
            location: {
                id: res.data.data.location?.id || res.data.data.locationId,
                name: res.data.data.location?.name || '',
                state: res.data.data.location?.state || '',
                country: res.data.data.location?.country || '',
                pincode: res.data.data.location?.pincode ?? null,
                label: res.data.data.location ? `${res.data.data.location.name}, ${res.data.data.location.state}, ${res.data.data.location.country}` : ''
            },
            status: res.data.data.status ? 'active' : 'inactive'
        }
    },

    updateUnit: async (id: string, data: UnitFormValues): Promise<Unit> => {
        const payload = {
            name: data.name,
            shortName: data.shortName,
            unitType: data.type,
            locationId: data.locationId,
            address: data.address,
            pincode: data.pincode,
            email: data.email,
            phone: data.phone,
            status: data.status === 'active'
        }
        const res = await api.put(`/master/unit/${id}`, payload)

        return {
            ...res.data.data,
            unitId: res.data.data.code,
            type: res.data.data.unitType,
            locationId: res.data.data.locationId,
            location: {
                id: res.data.data.location?.id || res.data.data.locationId,
                name: res.data.data.location?.name || '',
                state: res.data.data.location?.state || '',
                country: res.data.data.location?.country || '',
                pincode: res.data.data.location?.pincode ?? null,
                label: res.data.data.location ? `${res.data.data.location.name}, ${res.data.data.location.state}, ${res.data.data.location.country}` : ''
            },
            status: res.data.data.status ? 'active' : 'inactive'
        }
    },

    deleteUnit: async (id: string): Promise<void> => {
        await api.delete(`/master/unit/${id}`)
    }
}
