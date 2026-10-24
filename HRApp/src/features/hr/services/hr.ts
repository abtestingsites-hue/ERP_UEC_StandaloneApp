import { api } from '../../../lib/axios'
import type { LeaveRequest, Staff } from '../types'
import type { StaffFormValues } from '../schema'

const safeFormatDate = (val: any) => {
    if (!val) return ''
    try {
        const d = new Date(val)
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
    } catch {
        return ''
    }
}

const mapStaff = (s: any): Staff => ({
    id: s.id,
    empId: s.empId,
    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unassigned Staff',
    photoUrl: s.photoUrl || undefined,
    role: s.designation || 'Unassigned',
    department: s.department || 'General',
    unitId: s.unitId,
    phone: s.phone || '',
    email: s.email || '',
    joiningDate: safeFormatDate(s.joiningDate) || safeFormatDate(s.createdAt) || '',
    status: s.status,
    isDeleted: Boolean(s.isDeleted),
    deletedAt: s.deletedAt || undefined,
    metadata: s.metadata || undefined,
    user: s.user
})

const normalizeStaffKey = (value: unknown) => String(value || '').trim().toLowerCase()

const getStaffIdentityKey = (staff: Staff) => {
    const userId = normalizeStaffKey(staff.user?.id)
    if (userId) return `user:${userId}`

    const empId = normalizeStaffKey(staff.empId)
    if (empId) return `emp:${empId}`

    const email = normalizeStaffKey(staff.email)
    if (email) return `email:${email}`

    const phone = normalizeStaffKey(staff.phone)
    if (phone) return `phone:${phone}`

    const nameUnitRole = [staff.name, staff.unitId, staff.role]
        .map(normalizeStaffKey)
        .filter(Boolean)
        .join('|')

    return nameUnitRole ? `profile:${nameUnitRole}` : `id:${staff.id}`
}

const getStaffRank = (staff: Staff) => {
    const status = normalizeStaffKey(staff.status)
    let rank = 0

    if (!staff.isDeleted) rank += 10
    if (status !== 'terminated' && status !== 'resigned') rank += 10
    if (staff.user?.isActive) rank += 5
    if (staff.empId) rank += 3
    if (staff.phone) rank += 2
    if (staff.email) rank += 2

    return rank
}

const dedupeStaff = (staffList: Staff[]) => {
    const staffByKey = new Map<string, Staff>()

    staffList.forEach((staff) => {
        const key = getStaffIdentityKey(staff)
        const current = staffByKey.get(key)

        if (!current || getStaffRank(staff) > getStaffRank(current)) {
            staffByKey.set(key, staff)
        }
    })

    return Array.from(staffByKey.values())
}

const isSeedOrDemoStaff = (staff: Staff) => {
    const id = normalizeStaffKey(staff.id)
    const empId = normalizeStaffKey(staff.empId)
    const email = normalizeStaffKey(staff.email)
    const metadata = staff.metadata || {}

    return Boolean(
        id.startsWith('demo-') ||
        empId.startsWith('demo-') ||
        empId.startsWith('seed-') ||
        email.endsWith('.demo') ||
        email.endsWith('@demo.erp') ||
        metadata.demo === true ||
        metadata.seeded === true
    )
}

const cleanStaffList = (staffList: Staff[]) => dedupeStaff(staffList).filter((staff) => !isSeedOrDemoStaff(staff))

const prepareStaffPayload = (data: StaffFormValues) => {
    const [firstName, ...lastNames] = data.name.trim().split(' ')

    const payload: Record<string, any> = {
        empId: data.empId || undefined,
        photoUrl: data.photoUrl || undefined,
        firstName,
        lastName: lastNames.length > 0 ? lastNames.join(' ') : undefined,
        designation: data.role || undefined,
        department: data.department || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        unitId: data.unitId || undefined,
        status: data.status || undefined,
        joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
        userId: data.userId || undefined,
        metadata: data.metadata || {}
    }

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

    return payload
}

export const hrService = {
    getLinkableUsers: async () => {
        const res = await api.get('/hr/linkable-users')
        return res.data.data
    },

    getStaff: async (): Promise<Staff[]> => {
        const res = await api.get('/hr/staff')
        return cleanStaffList(res.data.data.map(mapStaff))
    },

    getStaffList: async (options?: { includeFormer?: boolean; scope?: 'all'; unitId?: string | null }): Promise<Staff[]> => {
        const res = await api.get('/hr/staff', {
            params: {
                ...(options?.includeFormer ? { includeFormer: true } : {}),
                ...(options?.scope === 'all' ? { scope: 'all' } : {})
            },
            headers: options?.unitId ? { 'x-unit-id': options.unitId } : undefined
        })
        return cleanStaffList(res.data.data.map(mapStaff))
    },

    getAttendanceLogs: async (options?: { date?: string; scope?: 'all' }): Promise<Array<{
        id: string
        staffId?: string
        date: string
        empId: string
        name: string
        checkIn: string
        checkOut: string
        status: string
    }>> => {
        const res = await api.get('/hr/attendance', {
            params: {
                ...(options?.date ? { date: options.date } : {}),
                ...(options?.scope === 'all' ? { scope: 'all' } : {})
            }
        })
        return res.data.data || []
    },

    getMyAttendanceLogs: async (options?: { date?: string }): Promise<Array<{
        id: string
        staffId?: string
        date: string
        empId: string
        name: string
        checkIn: string
        checkOut: string
        status: string
    }>> => {
        const res = await api.get('/hr/my-attendance', {
            params: options?.date ? { date: options.date } : undefined
        })
        return res.data.data || []
    },

    markMyAttendance: async (data: { action: 'CHECK_IN' | 'CHECK_OUT'; note?: string }): Promise<{
        id: string
        staffId?: string
        date: string
        empId: string
        name: string
        checkIn: string
        checkOut: string
        status: string
    }> => {
        const res = await api.post('/hr/my-attendance', data)
        return res.data.data
    },

    getPayrollPreview: async (options?: { month?: string; scope?: 'all' }): Promise<Array<{
        id: string
        staffId: string
        empId: string
        name: string
        role: string
        department: string
        month: string
        workingDays: number
        presentDays: number
        approvedLeaveDays: number
        absentDays: number
        baseSalary: number
        fixedAllowance: number
        fixedDeduction: number
        grossPay: number
        deductions: number
        netPay: number
        status: string
        processedAt?: string | null
        processedBy?: string | null
    }>> => {
        const res = await api.get('/hr/payroll', {
            params: {
                ...(options?.month ? { month: options.month } : {}),
                ...(options?.scope === 'all' ? { scope: 'all' } : {})
            }
        })
        return res.data.data || []
    },

    processPayroll: async (data: { staffId: string; month: string }) => {
        const res = await api.post('/hr/payroll/process', data)
        return res.data.data
    },

    getLeaveRequests: async (options?: { scope?: 'all' }): Promise<LeaveRequest[]> => {
        const res = await api.get('/hr/leave-requests', {
            params: options?.scope === 'all' ? { scope: 'all' } : undefined
        })
        return res.data.data || []
    },

    getMyLeaveRequests: async (): Promise<LeaveRequest[]> => {
        const res = await api.get('/hr/my-leave-requests')
        return res.data.data || []
    },

    createLeaveRequest: async (data: {
        staffId: string
        leaveType: string
        fromDate: string
        toDate: string
        reason?: string
    }): Promise<LeaveRequest> => {
        const res = await api.post('/hr/leave-requests', data)
        return res.data.data
    },

    createMyLeaveRequest: async (data: {
        leaveType: string
        fromDate: string
        toDate: string
        reason?: string
    }): Promise<LeaveRequest> => {
        const res = await api.post('/hr/my-leave-requests', data)
        return res.data.data
    },

    updateLeaveRequestStatus: async (id: string, data: {
        status: 'APPROVED' | 'REJECTED'
        remarks?: string
    }): Promise<LeaveRequest> => {
        const res = await api.patch(`/hr/leave-requests/${id}`, data)
        return res.data.data
    },

    addStaff: async (data: StaffFormValues): Promise<Staff> => {
        const res = await api.post('/hr/staff', prepareStaffPayload(data))
        return mapStaff(res.data.data)
    },

    getRoles: async (): Promise<Array<{ id: string; name: string }>> => {
        const res = await api.get('/hr/roles')
        return res.data.data || []
    },

    updateStaff: async (staffId: string, data: StaffFormValues): Promise<Staff> => {
        const res = await api.put(`/hr/staff/${staffId}`, prepareStaffPayload(data))
        return mapStaff(res.data.data)
    },

    getStaffSalary: async (staffId: string) => {
        const res = await api.get(`/hr/staff/${staffId}/salary`)
        return res.data.data
    },

    updateStaffSalary: async (staffId: string, data: { monthlySalary: number, fixedAllowance: number, fixedDeduction: number }) => {
        const res = await api.put(`/hr/staff/${staffId}/salary`, data)
        return res.data.data
    },

    provisionStaffAccount: async (staffId: string, data: { roleId: string; passwordMethod?: string }): Promise<any> => {
        const res = await api.post(`/hr/staff/${staffId}/provision-account`, data)
        return res.data.data
    },

    resetStaffPassword: async (staffId: string, data: { method: 'SEND_RESET_LINK' | 'HR_TEMPORARY' }): Promise<any> => {
        const res = await api.post(`/hr/staff/${staffId}/reset-password`, data)
        return res.data
    },

    updateStaffMenuPrivilege: async (staffId: string, data: {
        unitAccessMode: 'all' | 'individual'
        selectedUnitIds: string[]
        permissions: Record<string, { view: boolean; createUpdate: boolean }>
    }) => {
        const res = await api.patch(`/hr/staff/${staffId}/menu-privilege`, data)
        return res.data.data
    },

    deleteStaff: async (staffId: string): Promise<void> => {
        await api.delete(`/hr/staff/${staffId}`)
    },

    uploadStaffDocument: async (staffId: string, documentType: string, file: File) => {
        const formData = new FormData()
        formData.append(documentType, file)
        const res = await api.post(`/hr/staff/${staffId}/documents`, formData)
        return res.data.data
    },

    getStaffDocuments: async (staffId: string) => {
        const res = await api.get(`/hr/staff/${staffId}/documents`)
        return res.data.data
    },

    getAllDocuments: async () => {
        const res = await api.get('/hr/documents/tracker')
        return res.data.data
    },

    verifyStaffDocument: async (staffId: string, documentId: string, status: 'VERIFIED') => {
        const res = await api.patch(`/hr/staff/${staffId}/documents/${documentId}/verify`, { status })
        return res.data.data
    },

    getJobApplications: async (): Promise<any[]> => {
        const res = await api.get('/hr/job-applications')
        return res.data.data
    },
    createJobApplication: async (data: any): Promise<any> => {
        const res = await api.post('/hr/job-applications', data)
        return res.data.data
    },
    updateJobApplication: async (id: string, data: any): Promise<any> => {
        const res = await api.put(`/hr/job-applications/${id}`, data)
        return res.data.data
    },
    deleteJobApplication: async (id: string): Promise<void> => {
        await api.delete(`/hr/job-applications/${id}`)
    },
    convertJobApplication: async (id: string): Promise<any> => {
        const res = await api.post(`/hr/job-applications/${id}/convert`)
        return res.data.data
    },

    getCandidates: async (): Promise<any[]> => {
        const res = await api.get('/hr/candidates')
        return res.data.data
    },
    createCandidate: async (data: any): Promise<any> => {
        const res = await api.post('/hr/candidates', data)
        return res.data.data
    },
    updateCandidate: async (id: string, data: any): Promise<any> => {
        const res = await api.patch(`/hr/candidates/${id}`, data)
        return res.data.data
    },
    placeCandidate: async (id: string, data: any): Promise<any> => {
        const res = await api.post(`/hr/candidates/${id}/place`, data)
        return res.data.data
    },

    getCandidateInterviews: async (candidateId: string): Promise<any[]> => {
        const res = await api.get(`/hr/candidates/${candidateId}/interviews`)
        return res.data.data
    },
    createInterview: async (candidateId: string, data: any): Promise<any> => {
        const res = await api.post(`/hr/candidates/${candidateId}/interviews`, data)
        return res.data.data
    },
    updateInterview: async (id: string, data: any): Promise<any> => {
        const res = await api.patch(`/hr/interviews/${id}`, data)
        return res.data.data
    },
    deleteInterview: async (id: string): Promise<void> => {
        await api.delete(`/hr/interviews/${id}`)
    }
}
