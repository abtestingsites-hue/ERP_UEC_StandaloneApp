import { api } from '../../../lib/axios'
import type {
    CreateLaundryPayload,
    CreateMaintenancePayload,
    CreateMealPrepPayload,
    CreateWasteRecordPayload,
    LaundryRecord,
    MealPrepRecord,
    MaintenanceRecord,
    OperationsNutritionPlan,
    OperationsPatient,
    UpdateLaundryPayload,
    UpdateMaintenancePayload,
    UpdateMealPrepStatusPayload,
    UpdateWasteStatusPayload,
    WasteRecord
} from '../types'

export const operationsService = {
    getPatients: async (): Promise<OperationsPatient[]> => {
        const response = await api.get('/operations/patients')
        return response.data?.data || []
    },

    getNutritionPlans: async (): Promise<OperationsNutritionPlan[]> => {
        const response = await api.get('/operations/nutrition-plans')
        return response.data?.data || []
    },

    updateDietaryRestrictions: async (id: string, data: any): Promise<any> => {
        const response = await api.patch(`/operations/nutrition-plans/${id}/diet`, data)
        return response.data?.data
    },

    getMealPreps: async (): Promise<MealPrepRecord[]> => {
        const response = await api.get('/operations/meal-preps')
        return response.data?.data || []
    },

    createMealPrep: async (payload: CreateMealPrepPayload): Promise<MealPrepRecord> => {
        const response = await api.post('/operations/meal-preps', payload)
        return response.data?.data
    },

    updateMealPrepStatus: async ({ nutritionId, status }: UpdateMealPrepStatusPayload): Promise<MealPrepRecord> => {
        const response = await api.patch(`/operations/meal-preps/${nutritionId}/status`, { status })
        return response.data?.data
    },

    getWasteRecords: async (): Promise<WasteRecord[]> => {
        const response = await api.get('/operations/waste-records')
        return response.data?.data || []
    },

    createWasteRecord: async (payload: CreateWasteRecordPayload): Promise<WasteRecord> => {
        const response = await api.post('/operations/waste-records', payload)
        return response.data?.data
    },

    updateWasteStatus: async ({ entityId, status }: UpdateWasteStatusPayload): Promise<WasteRecord> => {
        const response = await api.patch(`/operations/waste-records/${entityId}/status`, { status })
        return response.data?.data
    },

    getLaundryRecords: async (): Promise<LaundryRecord[]> => {
        const response = await api.get('/operations/laundry')
        return response.data?.data || []
    },

    createLaundryRecord: async (payload: CreateLaundryPayload): Promise<LaundryRecord> => {
        const response = await api.post('/operations/laundry', payload)
        return response.data?.data
    },

    updateLaundryStatus: async ({ id, status }: UpdateLaundryPayload): Promise<LaundryRecord> => {
        const response = await api.patch(`/operations/laundry/${id}`, { status })
        return response.data?.data
    },

    getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
        const response = await api.get('/operations/maintenance')
        return response.data?.data || []
    },

    createMaintenanceRecord: async (payload: CreateMaintenancePayload): Promise<MaintenanceRecord> => {
        const response = await api.post('/operations/maintenance', payload)
        return response.data?.data
    },

    updateMaintenanceStatus: async ({ id, status }: UpdateMaintenancePayload): Promise<MaintenanceRecord> => {
        const response = await api.patch(`/operations/maintenance/${id}`, { status })
        return response.data?.data
    }
}
