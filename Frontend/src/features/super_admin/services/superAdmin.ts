import { api } from '../../../lib/axios'

export interface AdminUser {
    id: string
    email: string
    firstName: string
    lastName?: string | null
    mobile?: string | null
    roleId: string
    unitId: string
    tenantId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    role?: { id: string; name: string } | null
    unit?: { id: string; name: string; code?: string | null } | null
    staff?: { id: string; empId: string; firstName: string; lastName?: string | null } | null
}

export interface AdminUserPayload {
    firstName: string
    lastName?: string
    email: string
    mobile?: string
    password?: string
    roleId: string
    unitId: string
    isActive: boolean
}

export const superAdminService = {
    getUsers: async (): Promise<AdminUser[]> => {
        const res = await api.get('/super-admin/users')
        return res.data.data || []
    },
    createUser: async (data: AdminUserPayload & { password: string }): Promise<AdminUser> => {
        const res = await api.post('/super-admin/users', data)
        return res.data.data
    },
    updateUser: async (id: string, data: AdminUserPayload): Promise<AdminUser> => {
        const res = await api.put(`/super-admin/users/${id}`, data)
        return res.data.data
    },
    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/super-admin/users/${id}`)
    }
}
