export interface Staff {
    id: string
    empId: string
    name: string
    photoUrl?: string
    role: string
    department: string
    unitId: string
    phone: string
    email: string
    joiningDate: string
    status: 'Active' | 'On Leave' | 'Terminated' | string
    isDeleted?: boolean
    deletedAt?: string
    metadata?: Record<string, any>
    aadhaarDocument?: File | null
    resumeDocument?: File | null
    user?: {
        id: string
        email: string
        isActive: boolean
        role?: {
            id: string
            name: string
        }
    }
}

export interface RolePermission {
    role: string
    modules: {
        [moduleName: string]: {
            create: boolean
            read: boolean
            update: boolean
            delete: boolean
        }
    }
}

export interface LeaveRequest {
    id: string
    staffId: string
    unitId?: string | null
    unitName?: string | null
    empId: string
    name: string
    department: string
    role: string
    leaveType: string
    fromDate: string
    toDate: string
    reason?: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string
    requestedAt?: string
    decidedAt?: string
    remarks?: string
}
