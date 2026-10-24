export type AmbulanceRecordType =
    | 'BOOKING'
    | 'DISPATCH'
    | 'FLEET'
    | 'STAFF_ASSIGNMENT'
    | 'TRIP_SHEET'
    | 'MAINTENANCE'
    | 'BILLING'
    | 'EMERGENCY_CALL'

export interface AmbulanceRecord {
    id: string
    entityId: string
    type: AmbulanceRecordType
    status: string
    actionBy?: string
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
    [key: string]: unknown
}

export interface AmbulanceField {
    key: string
    label: string
    placeholder?: string
    type?: 'text' | 'number' | 'datetime-local' | 'select'
    required?: boolean
    options?: { value: string; label: string }[]
}

export interface CreateAmbulanceRecordPayload {
    type: AmbulanceRecordType
    status?: string
    data: Record<string, unknown>
}

export interface UpdateAmbulanceStatusPayload {
    entityId: string
    status: string
    type: AmbulanceRecordType
}

// --- NEW TYPES FOR PHASE 3B-3 ---

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE'

export interface AmbulanceVehicle {
    id: string
    vehicleNo: string
    type: string
    status: VehicleStatus
    baseLocation: string | null
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export type TripStatus =
    | 'REQUESTED'
    | 'DISPATCH_READY'
    | 'DISPATCHED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'COMPLETED'
    | 'BILLED'
    | 'CANCELLED'

export interface AmbulanceTrip {
    id: string
    refNo: string
    clientName: string | null
    mobile: string | null
    pickupLocation: string | null
    destination: string | null
    priority: string | null
    status: TripStatus
    dispatchTime: string | null
    kmStart: number | null
    kmEnd: number | null
    tripNotes: string | null
    totalAmount: number | null
    vehicleId: string | null
    driverId: string | null
    supportStaffId: string | null
    patientId: string | null
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
    vehicle?: AmbulanceVehicle | null
    driver?: { id: string; name: string } | null
}
