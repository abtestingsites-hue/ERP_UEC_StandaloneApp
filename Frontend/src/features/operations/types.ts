export interface OperationsPatient {
    id: string
    name: string
    unitId?: string
    createdAt?: string
}

export interface OperationsNutritionPlan {
    id: string
    patientId: string
    calories: number
    dietPlan: string
    patient?: OperationsPatient
    createdAt: string
    updatedAt: string
}

export interface MealPrepRecord {
    id: string
    nutritionId: string
    status: 'PENDING' | 'PREPARING' | 'PREPARED' | 'SERVED'
    actionBy?: string
    notes?: string
    tenantId: string
    unitId: string
    nutrition?: OperationsNutritionPlan
    createdAt: string
    updatedAt: string
}

export interface CreateMealPrepPayload {
    nutritionId: string
}

export interface UpdateMealPrepStatusPayload {
    nutritionId: string
    status: MealPrepRecord['status']
}

export interface WasteRecord {
    id: string
    entityId: string
    category: string
    source: string
    quantity: number
    disposalMethod: string
    remarks?: string
    status: 'COLLECTED' | 'SEGREGATED' | 'DISPOSED' | 'COMPLETED'
    actionBy?: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface CreateWasteRecordPayload {
    category: string
    source: string
    quantity?: number
    disposalMethod?: string
    remarks?: string
}

export interface UpdateWasteStatusPayload {
    entityId: string
    status: WasteRecord['status']
}

export interface LaundryRecord {
    id: string
    patientId: string
    patient?: OperationsPatient
    status: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface CreateLaundryPayload {
    patientId: string
    status?: string
}

export interface UpdateLaundryPayload {
    id: string
    status: string
}

export interface MaintenanceRecord {
    id: string
    type: string
    status: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface CreateMaintenancePayload {
    type: string
    status?: string
}

export interface UpdateMaintenancePayload {
    id: string
    status: string
}
