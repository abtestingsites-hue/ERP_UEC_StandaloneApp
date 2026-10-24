import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'
import type { Staff, LeaveRequest } from '../types/staff'

export const useStaff = (department?: string) => {
    return useQuery<Staff[]>({
        queryKey: ['staff', department],
        queryFn: async () => {
            const params = department ? { department } : {}
            const res = await api.get('/hr/staff', { params })
            const data = res.data?.data || []
            return data.map((s: any) => ({
                id: s.id,
                empId: s.empId || s.code || '',
                name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Staff',
                photoUrl: s.photoUrl || '',
                role: s.role || s.designation || '',
                department: s.department || '',
                unitId: s.unitId || '',
                phone: s.phone || s.mobile || '',
                email: s.email || '',
                joiningDate: s.joiningDate || s.doj || '',
                status: s.status || 'Active',
                metadata: s.metadata || {},
                user: s.user
            }))
        }
    })
}

export const useLinkableUsers = () => {
    return useQuery({
        queryKey: ['linkable-users'],
        queryFn: async () => {
            const res = await api.get('/hr/linkable-users')
            return res.data?.data || []
        }
    })
}

export const useRoles = () => {
    return useQuery({
        queryKey: ['hr-roles'],
        queryFn: async () => {
            const res = await api.get('/hr/roles')
            return res.data?.data || []
        }
    })
}

export const useAttendanceLogs = (date?: string) => {
    return useQuery({
        queryKey: ['attendanceLogs', date],
        queryFn: async () => {
            const params = date ? { date } : {}
            const res = await api.get('/hr/attendance', { params })
            return res.data?.data || []
        }
    })
}

export const useLeaveRequests = () => {
    return useQuery<LeaveRequest[]>({
        queryKey: ['leaveRequests'],
        queryFn: async () => {
            const res = await api.get('/hr/leave-requests')
            return res.data?.data || []
        }
    })
}

export const usePayrollPreview = (month?: string) => {
    return useQuery({
        queryKey: ['payrollPreview', month],
        queryFn: async () => {
            const params = month ? { month } : {}
            const res = await api.get('/hr/payroll', { params })
            return res.data?.data || []
        }
    })
}

export const useMyLeaveRequests = () => {
    return useQuery<LeaveRequest[]>({
        queryKey: ['myLeaveRequests'],
        queryFn: async () => {
            const res = await api.get('/hr/my-leave-requests')
            return res.data?.data || []
        }
    })
}

export const useCreateMyLeaveRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/hr/my-leave-requests', data)
            return res.data?.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] })
        }
    })
}

export const useMyAttendanceLogs = (month?: string) => {
    return useQuery({
        queryKey: ['myAttendanceLogs', month],
        queryFn: async () => {
            const params = month ? { month } : {}
            const res = await api.get('/hr/my-attendance', { params })
            return res.data?.data || []
        }
    })
}

export const useMarkMyAttendance = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/hr/my-attendance', data)
            return res.data?.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myAttendanceLogs'] })
        }
    })
}
