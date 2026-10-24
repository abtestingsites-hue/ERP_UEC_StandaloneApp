import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { inventoryService, type InventoryReadOptions } from '../services/inventory'

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

const scopeKey = (options?: InventoryReadOptions) => options?.scope ? options.scope : (options?.unitId || 'active-unit')

export const useInventoryProducts = (options?: InventoryReadOptions) => {
    return useQuery({
        queryKey: ['inventory-products', scopeKey(options)],
        queryFn: () => inventoryService.getProducts(options)
    })
}

export const useInventoryBatches = (options?: InventoryReadOptions & { productId?: string }) => {
    return useQuery({
        queryKey: ['inventory-batches', scopeKey(options), options?.productId],
        queryFn: () => inventoryService.getBatches(options)
    })
}

export const useInventoryStock = (options?: InventoryReadOptions) => {
    return useQuery({
        queryKey: ['inventory-stock', scopeKey(options)],
        queryFn: () => inventoryService.getStock(options)
    })
}

export const useInventoryStockMovements = (options?: InventoryReadOptions) => {
    return useQuery({
        queryKey: ['inventory-stock-movements', scopeKey(options)],
        queryFn: () => inventoryService.getStockMovements(options)
    })
}

export const useInventoryPurchases = (options?: InventoryReadOptions) => {
    return useQuery({
        queryKey: ['inventory-purchases', scopeKey(options)],
        queryFn: () => inventoryService.getPurchases(options)
    })
}

export const useInventoryStockIssueRequests = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['inventory-stock-issue-requests', scopeKey(options), options?.patientId],
        queryFn: () => inventoryService.getStockIssueRequests(options),
        enabled: options?.enabled
    })
}

export const useCreateInventoryProduct = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
            toast({ type: 'success', title: 'Product Added', message: 'Inventory product saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Product Failed', message: resolveErrorMessage(error, 'Failed to save product') })
        }
    })
}

export const useUpdateInventoryStock = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.updateStock,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
            toast({ type: 'success', title: 'Stock Updated', message: 'Inventory stock updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Stock Failed', message: resolveErrorMessage(error, 'Failed to update stock') })
        }
    })
}

export const useCreateInventoryPurchase = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.createPurchase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            toast({ type: 'success', title: 'Purchase Recorded', message: 'Purchase saved and stock increased successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Purchase Failed', message: resolveErrorMessage(error, 'Failed to record purchase') })
        }
    })
}

export const useCreateInventoryStockIssueRequest = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.createStockIssueRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            toast({ type: 'success', title: 'Issue Requested', message: 'Stock issue request saved for approval' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Request Failed', message: resolveErrorMessage(error, 'Failed to save stock issue request') })
        }
    })
}

export const useApproveInventoryStockIssueRequest = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.approveStockIssueRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            toast({ type: 'success', title: 'Issue Approved', message: 'Stock reduced and movement recorded' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Approval Failed', message: resolveErrorMessage(error, 'Failed to approve stock issue') })
        }
    })
}

export const useRejectInventoryStockIssueRequest = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.rejectStockIssueRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            toast({ type: 'success', title: 'Issue Rejected', message: 'Stock issue request closed' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Reject Failed', message: resolveErrorMessage(error, 'Failed to reject stock issue') })
        }
    })
}

export const useCancelInventoryStockIssueRequest = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            inventoryService.cancelStockIssueRequest(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            toast({ type: 'success', title: 'Issue Cancelled', message: 'Stock issue request cancelled successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Cancellation Failed', message: resolveErrorMessage(error, 'Failed to cancel stock issue request') })
        }
    })
}

export const useCreateKitchenRequisition = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: inventoryService.createKitchenRequisition,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            toast({ type: 'success', title: 'Ingredients Requested', message: 'Kitchen requisition processed and stock updated' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Requisition Failed', message: resolveErrorMessage(error, 'Failed to request ingredients') })
        }
    })
}
