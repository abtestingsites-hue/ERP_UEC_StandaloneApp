import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { superAdminService, type AdminUserPayload } from '../services/superAdmin'

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.errors?.[0]?.message || error?.response?.data?.message || fallback

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ['super-admin-users'],
        queryFn: superAdminService.getUsers
    })
}

export const useCreateAdminUser = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: AdminUserPayload & { password: string }) => superAdminService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-users'] })
            toast({ type: 'success', title: 'User Created', message: 'The user account is ready.' })
        },
        onError: (error) => {
            toast({ type: 'error', title: 'Create Failed', message: getErrorMessage(error, 'Failed to create user') })
        }
    })
}

export const useUpdateAdminUser = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: AdminUserPayload }) => superAdminService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-users'] })
            toast({ type: 'success', title: 'User Updated', message: 'The user account was updated.' })
        },
        onError: (error) => {
            toast({ type: 'error', title: 'Update Failed', message: getErrorMessage(error, 'Failed to update user') })
        }
    })
}

export const useDeleteAdminUser = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: superAdminService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-users'] })
            toast({ type: 'success', title: 'User Deleted', message: 'The user account was disabled and removed.' })
        },
        onError: (error) => {
            toast({ type: 'error', title: 'Delete Failed', message: getErrorMessage(error, 'Failed to delete user') })
        }
    })
}
