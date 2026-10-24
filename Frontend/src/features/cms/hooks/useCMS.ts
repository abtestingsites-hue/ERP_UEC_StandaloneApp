import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cmsService } from '../services/cms'
import { useToast } from '../../../components/Toast'

export const useBlogs = () => {
    return useQuery({
        queryKey: ['blogs'],
        queryFn: cmsService.getBlogs
    })
}

export const useCreateBlog = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: cmsService.createBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] })
            toast({ type: 'success', title: 'Published', message: 'Blog posted successfully' })
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || 'Could not post blog.'
            toast({ type: 'error', title: 'Failed', message: msg })
        }
    })
}

export const useUpdateBlog = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => cmsService.updateBlog(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] })
            toast({ type: 'success', title: 'Updated', message: 'Blog updated successfully' })
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || 'Could not update blog.'
            toast({ type: 'error', title: 'Failed', message: msg })
        }
    })
}

export const useDeleteBlog = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: cmsService.deleteBlog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] })
            toast({ type: 'success', title: 'Deleted', message: 'Blog removed successfully' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Failed', message: 'Could not delete blog.' })
        }
    })
}
