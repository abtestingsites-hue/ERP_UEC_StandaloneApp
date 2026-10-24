import { api } from '../../../lib/axios'

export interface VitalSign {
    id: string
    patientId: string
    bp?: string
    pulse?: number
    temp?: number
    spO2?: number
    notes?: string
    createdAt: string
}

export const vitalsService = {
    getVitals: async (patientId: string): Promise<VitalSign[]> => {
        const res = await api.get(`/inhouse-care/${patientId}`)
        return res.data.data
    },
    recordVitals: async (data: any) => {
        const res = await api.post('/inhouse-care', data)
        return res.data.data
    }
}
