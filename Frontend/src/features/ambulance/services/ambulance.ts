import { api } from '../../../lib/axios'
import type { 
    AmbulanceRecord, 
    AmbulanceRecordType, 
    CreateAmbulanceRecordPayload, 
    UpdateAmbulanceStatusPayload,
    AmbulanceVehicle,
    AmbulanceTrip,
    VehicleStatus,
    TripStatus
} from '../types'

export const ambulanceService = {
    // --- LEGACY RECORDS (DO NOT REMOVE) ---
    getRecords: async (type: AmbulanceRecordType): Promise<AmbulanceRecord[]> => {
        const response = await api.get('/ambulance/records', { params: { type } })
        return response.data?.data || []
    },

    createRecord: async (payload: CreateAmbulanceRecordPayload): Promise<AmbulanceRecord> => {
        const response = await api.post('/ambulance/records', payload)
        return response.data?.data
    },

    updateStatus: async ({ entityId, status }: UpdateAmbulanceStatusPayload): Promise<AmbulanceRecord> => {
        const response = await api.patch(`/ambulance/records/${entityId}/status`, { status })
        return response.data?.data
    },

    // --- NEW REAL APIs ---

    // Vehicles
    getVehicles: async (): Promise<AmbulanceVehicle[]> => {
        const response = await api.get('/ambulance/vehicles')
        return response.data?.data || []
    },

    getVehicle: async (id: string): Promise<AmbulanceVehicle> => {
        const response = await api.get(`/ambulance/vehicles/${id}`)
        return response.data?.data
    },

    createVehicle: async (payload: Partial<AmbulanceVehicle>): Promise<AmbulanceVehicle> => {
        const response = await api.post('/ambulance/vehicles', payload)
        return response.data?.data
    },

    updateVehicle: async (id: string, payload: Partial<AmbulanceVehicle>): Promise<AmbulanceVehicle> => {
        const response = await api.patch(`/ambulance/vehicles/${id}`, payload)
        return response.data?.data
    },

    updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<AmbulanceVehicle> => {
        const response = await api.patch(`/ambulance/vehicles/${id}/status`, { status })
        return response.data?.data
    },

    // Trips
    getTrips: async (): Promise<AmbulanceTrip[]> => {
        const response = await api.get('/ambulance/trips')
        return response.data?.data || []
    },

    getTrip: async (id: string): Promise<AmbulanceTrip> => {
        const response = await api.get(`/ambulance/trips/${id}`)
        return response.data?.data
    },

    createTrip: async (payload: Partial<AmbulanceTrip>): Promise<AmbulanceTrip> => {
        const response = await api.post('/ambulance/trips', payload)
        return response.data?.data
    },

    updateTrip: async (id: string, payload: Partial<AmbulanceTrip>): Promise<AmbulanceTrip> => {
        const response = await api.patch(`/ambulance/trips/${id}`, payload)
        return response.data?.data
    },

    updateTripStatus: async (id: string, payload: { status: TripStatus; [key: string]: any }): Promise<AmbulanceTrip> => {
        const response = await api.patch(`/ambulance/trips/${id}/status`, payload)
        return response.data?.data
    },

    generateInvoice: async (id: string): Promise<any> => {
        const response = await api.post(`/ambulance/trips/${id}/invoice`)
        return response.data?.data
    }
}

