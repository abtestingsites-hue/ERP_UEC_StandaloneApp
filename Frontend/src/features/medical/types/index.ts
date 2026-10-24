export type MedicalAssignmentStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'ON_HOLD'
    | 'COMPLETED'
    | 'CANCELLED'

export type MedicalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface MedicalStaffSnapshot {
    id: string
    empId: string
    firstName: string
    lastName?: string
    designation?: string
    department?: string
    status?: string
    isAvailable: boolean
    currentWorkload: number
    capacity: number
    shiftStart?: string
    shiftEnd?: string
    lastActiveAt?: string
}

export interface MedicalPatientSnapshot {
    id: string
    name: string
}

export interface MedicalAssignment {
    id: string
    refNo: string
    staffId: string
    patientId?: string | null
    admissionId?: string | null
    enquiryId?: string | null
    taskId?: string | null
    allocationId?: string | null
    dutyType: string
    role?: string | null
    location?: string | null
    startAt: string
    endAt?: string | null
    status: MedicalAssignmentStatus
    priority: MedicalPriority
    notes?: string | null
    metadata?: Record<string, unknown> | null
    staff?: MedicalStaffSnapshot
    patient?: MedicalPatientSnapshot | null
    createdAt?: string
    updatedAt?: string
}

export interface MedicalAssignmentFormValues {
    staffId: string
    patientId?: string
    allocationId?: string
    dutyType: string
    role?: string
    location?: string
    startAt?: string
    endAt?: string
    status: MedicalAssignmentStatus
    priority: MedicalPriority
    notes?: string
}

export interface MedicalPatient {
    id: string
    name: string
}

export type MedicalStaff = MedicalStaffSnapshot

export interface MedicalDashboard {
    activeCount: number
    statusCounts: Partial<Record<MedicalAssignmentStatus, number>>
    staffSummary: {
        total: number
        available: number
        busy: number
        offDuty: number
    }
    activeAssignments: MedicalAssignment[]
}
