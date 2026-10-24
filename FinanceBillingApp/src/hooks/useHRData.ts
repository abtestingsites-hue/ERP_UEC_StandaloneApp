import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'

export interface Staff {
    id: string
    empId?: string
    name: string
    photoUrl?: string
    role?: string
    department?: string
    unitId?: string
    phone?: string
    email?: string
    joiningDate?: string
    status?: string
    isDeleted?: boolean
    metadata?: any
    user?: any
}

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
