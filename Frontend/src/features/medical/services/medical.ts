import { api } from '../../../lib/axios'
import type {
    MedicalAssignment,
    MedicalAssignmentFormValues,
    MedicalAssignmentStatus,
    MedicalDashboard,
    MedicalPatient,
    MedicalStaff
} from '../types'

const compactPayload = (payload: Record<string, unknown>) => {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
}

export const medicalService = {
    getAssignments: async (params?: {
        search?: string
        status?: string
        staffId?: string
        patientId?: string
        allocationId?: string
        from?: string
        to?: string
        activeOnly?: boolean
    }): Promise<MedicalAssignment[]> => {
        const res = await api.get('/medical/assignments', {
            params: compactPayload(params || {})
        })
        return res.data.data || []
    },

    getDashboard: async (): Promise<MedicalDashboard> => {
        const res = await api.get('/medical/dashboard')
        return res.data.data
    },

    getPatients: async (): Promise<MedicalPatient[]> => {
        const res = await api.get('/patient')
        return res.data.data || []
    },

    getStaff: async (): Promise<MedicalStaff[]> => {
        const res = await api.get('/medical/staff')
        return res.data.data || []
    },

    createAssignment: async (data: MedicalAssignmentFormValues): Promise<MedicalAssignment> => {
        const res = await api.post('/medical/assignments', compactPayload(data as unknown as Record<string, unknown>))
        return res.data.data
    },

    updateAssignment: async ({ id, data }: { id: string; data: Partial<MedicalAssignmentFormValues> }): Promise<MedicalAssignment> => {
        const res = await api.patch(`/medical/assignments/${id}`, compactPayload(data as Record<string, unknown>))
        return res.data.data
    },

    updateStatus: async ({ id, status, notes }: { id: string; status: MedicalAssignmentStatus; notes?: string }): Promise<MedicalAssignment> => {
        const res = await api.patch(`/medical/assignments/${id}/status`, compactPayload({ status, notes }))
        return res.data.data
    },

    deleteAssignment: async (id: string): Promise<MedicalAssignment> => {
        const res = await api.delete(`/medical/assignments/${id}`)
        return res.data.data
    },

    getDoctorVisits: async (params?: { patientId?: string; doctorId?: string }): Promise<any[]> => {
        const res = await api.get('/medical/visits', {
            params: compactPayload(params || {})
        })
        return res.data.data || []
    },

    createDoctorVisit: async (data: any): Promise<any> => {
        const res = await api.post('/medical/visits', compactPayload(data))
        return res.data.data
    },

    updateDoctorVisit: async ({ id, data }: { id: string; data: any }): Promise<any> => {
        const res = await api.patch(`/medical/visits/${id}`, compactPayload(data))
        return res.data.data
    }
}
