import { api } from '../../../lib/axios'
import type { CreateStaffEntryPayload, CreateVehicleEntryPayload, GateEntry, ResidentOuting } from '../types'

export const securityService = {

    getGateQueue: async (): Promise<GateEntry[]> => {
        const response = await api.get('/security/gate-queue')
        return response.data?.data || []
    },

    getDashboardActionQueue: async (): Promise<GateEntry[]> => {
        const response = await api.get('/security/dashboard/action-queue')
        return response.data?.data || []
    },

    getDailyMovementReport: async (date: string): Promise<GateEntry[]> => {
        const response = await api.get('/security/reports/daily-movement', { params: { date } })
        return response.data?.data || []
    },


    checkInExpectedVisitor: async ({ id, remarks }: { id: string; remarks?: string }): Promise<GateEntry> => {
        const response = await api.patch(`/security/expected-visitors/${id}/check-in`, { remarks })
        return response.data?.data
    },

    checkoutGateEntry: async ({ id, remarks }: { id: string; remarks?: string }): Promise<GateEntry> => {
        const response = await api.patch(`/security/gate-entries/${id}/checkout`, { remarks })
        return response.data?.data
    },



    getResidentOutings: async (): Promise<ResidentOuting[]> => {
        const response = await api.get('/security/resident-outings')
        return response.data?.data || []
    },

    recordResidentExit: async (id: string): Promise<any> => {
        const response = await api.post(`/security/resident-outings/${id}/exit`)
        return response.data?.data
    },

    recordResidentReturn: async (id: string): Promise<any> => {
        const response = await api.post(`/security/resident-outings/${id}/return`)
        return response.data?.data
    },

    createResidentOuting: async (payload: Partial<ResidentOuting>): Promise<ResidentOuting> => {
        const response = await api.post('/security/resident-outings', payload)
        return response.data?.data
    },

    getStaffMovements: async (params?: { status?: string; date?: string; staffId?: string }): Promise<import('../types').StaffDailyMovement[]> => {
        const response = await api.get('/security/staff-movements', { params })
        return response.data?.data || []
    },

    getStaffMovementById: async (id: string): Promise<import('../types').StaffDailyMovement> => {
        const response = await api.get(`/security/staff-movements/${id}`)
        return response.data?.data
    },

    recordStaffEntry: async (staffId: string): Promise<import('../types').StaffDailyMovement> => {
        const response = await api.post('/security/staff-movements/entry', { staffId })
        return response.data?.data
    },

    recordStaffTempExit: async ({ id, payload }: { id: string; payload: import('../types').StaffTempExitPayload }): Promise<import('../types').StaffGateTrip> => {
        const response = await api.post(`/security/staff-movements/${id}/temp-exit`, payload)
        return response.data?.data
    },

    recordStaffReturn: async ({ id, tripId }: { id: string; tripId: string }): Promise<import('../types').StaffGateTrip> => {
        const response = await api.post(`/security/staff-movements/${id}/return`, { tripId })
        return response.data?.data
    },

    recordStaffFinalExit: async (id: string): Promise<import('../types').StaffDailyMovement> => {
        const response = await api.post(`/security/staff-movements/${id}/final-exit`)
        return response.data?.data
    },

    getVehicleMovements: async (params?: { status?: string; date?: string; vehicleNo?: string }): Promise<import('../types').VehicleMovement[]> => {
        const response = await api.get('/security/vehicle-movements', { params })
        return response.data?.data || []
    },

    getVehicleMovementById: async (id: string): Promise<import('../types').VehicleMovement> => {
        const response = await api.get(`/security/vehicle-movements/${id}`)
        return response.data?.data
    },

    recordVehicleEntry: async (payload: import('../types').CreateVehicleEntryPayload): Promise<import('../types').VehicleMovement> => {
        const response = await api.post('/security/vehicle-movements/entry', payload)
        return response.data?.data
    },

    recordVehicleExit: async (id: string): Promise<import('../types').VehicleMovement> => {
        const response = await api.post(`/security/vehicle-movements/${id}/exit`)
        return response.data?.data
    },

    getMovementTimeline: async (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const response = await api.get('/security/movement-timeline', { params })
        return response.data?.data
    },

    getSecurityDashboardSummary: async (): Promise<{ activeVisitors: number; activeStaff: number; activeVehicles: number }> => {
        const response = await api.get('/security/dashboard-summary')
        return response.data?.data
    }
}
