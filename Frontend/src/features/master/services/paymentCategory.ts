import type { PaymentCategory } from '../types'
import type { PaymentCategoryFormValues } from '../schema'

let categories: PaymentCategory[] = [
    { id: '1', accountType: 'Patient', gateway: 'Razorpay', subCategory: 'Admission Fee', trust: 'Apollo Trust', status: 'active' },
]

export const paymentCategoryService = {
    getCategories: async (): Promise<PaymentCategory[]> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return [...categories]
    },

    addCategory: async (data: PaymentCategoryFormValues): Promise<PaymentCategory> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        const newCategory: PaymentCategory = {
            id: Math.random().toString(36).substr(2, 9),
            ...data
        }
        categories.push(newCategory)
        return newCategory
    },

    updateCategory: async (id: string, data: PaymentCategoryFormValues): Promise<PaymentCategory> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        const index = categories.findIndex(c => c.id === id)
        if (index === -1) throw new Error('Category not found')
        categories[index] = { ...categories[index], ...data }
        return categories[index]
    },

    deleteCategory: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        categories = categories.filter(c => c.id !== id)
    }
}
