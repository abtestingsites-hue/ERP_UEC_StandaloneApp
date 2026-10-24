import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentCategoryService } from '../services/paymentCategory'
import type { PaymentCategoryFormValues } from '../schema'
import { useToast } from '../../../components/Toast'

export const usePaymentCategories = () => {
    return useQuery({
        queryKey: ['paymentCategories'],
        queryFn: paymentCategoryService.getCategories
    })
}

export const useAddPaymentCategory = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: paymentCategoryService.addCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentCategories'] })
            toast({ type: 'success', title: 'Success', message: 'Category added successfully' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Error', message: 'Failed to add category' })
        }
    })
}

export const useUpdatePaymentCategory = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: PaymentCategoryFormValues }) => paymentCategoryService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentCategories'] })
            toast({ type: 'success', title: 'Success', message: 'Category updated successfully' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Error', message: 'Failed to update category' })
        }
    })
}

export const useDeletePaymentCategory = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: paymentCategoryService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentCategories'] })
            toast({ type: 'success', title: 'Success', message: 'Category deleted successfully' })
        },
        onError: () => {
            toast({ type: 'error', title: 'Error', message: 'Failed to delete category' })
        }
    })
}
