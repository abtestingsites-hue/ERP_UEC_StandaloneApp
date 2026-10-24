import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { useAuthStore } from '../../../store/useAuthStore'
import { inventoryService, type InventoryReadOptions } from '../services/inventory'
import type { CreateGoodsReceiptPayload, CreatePhysicalAuditPayload, CreatePurchaseOrderPayload, CreateSupplierReturnPayload, GoodsReceiptQueryParams, ReconcilePhysicalAuditPayload, SubmitPhysicalAuditCountPayload, SupplierReturnQueryParams, UpdateProductPayload, UpdatePurchaseOrderPayload } from '../types'
import {
    resolveEffectiveUnitId,
    resolveEffectiveScope,
    resolveEffectiveOptions,
    inventoryProductsQueryKey,
    inventoryBatchesQueryKey,
    inventoryStockQueryKey,
    inventoryStockMovementsQueryKey,
    inventoryPurchasesQueryKey,
    inventoryPurchaseOrdersQueryKey,
    inventoryPurchaseOrderDetailsQueryKey,
    inventoryGoodsReceiptsQueryKey,
    inventoryGoodsReceiptDetailsQueryKey,
    inventorySupplierReturnsQueryKey,
    inventorySupplierReturnDetailsQueryKey,
    inventoryStockValuationQueryKey,
    inventoryConsumptionAnalyticsQueryKey,
    inventoryPhysicalAuditsQueryKey,
    inventoryPhysicalAuditDetailsQueryKey,
    inventoryStockIssueRequestsQueryKey,
    inventoryVendorsQueryKey,
    inventoryExpiryAlertsQueryKey,
    scopeKey
} from './queryKeys'

export {
    resolveEffectiveUnitId,
    resolveEffectiveScope,
    resolveEffectiveOptions,
    inventoryProductsQueryKey,
    inventoryBatchesQueryKey,
    inventoryStockQueryKey,
    inventoryStockMovementsQueryKey,
    inventoryPurchasesQueryKey,
    inventoryPurchaseOrdersQueryKey,
    inventoryPurchaseOrderDetailsQueryKey,
    inventoryGoodsReceiptsQueryKey,
    inventoryGoodsReceiptDetailsQueryKey,
    inventorySupplierReturnsQueryKey,
    inventorySupplierReturnDetailsQueryKey,
    inventoryStockValuationQueryKey,
    inventoryConsumptionAnalyticsQueryKey,
    inventoryPhysicalAuditsQueryKey,
    inventoryPhysicalAuditDetailsQueryKey,
    inventoryStockIssueRequestsQueryKey,
    inventoryVendorsQueryKey,
    inventoryExpiryAlertsQueryKey,
    scopeKey
}

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

export const useInventoryProducts = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryProductsQueryKey(effectiveUnitId, scope),
        queryFn: () => inventoryService.getProducts(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryBatches = (options?: InventoryReadOptions & { productId?: string; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryBatchesQueryKey(effectiveUnitId, scope, options?.productId),
        queryFn: () => inventoryService.getBatches(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryExpiryAlerts = (options?: InventoryReadOptions & { daysAhead?: number; status?: string; productId?: string; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryExpiryAlertsQueryKey(effectiveUnitId, scope, options?.daysAhead, options?.status, options?.productId),
        queryFn: () => inventoryService.getExpiryAlerts(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryStock = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryStockQueryKey(effectiveUnitId, scope),
        queryFn: () => inventoryService.getStock(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryStockMovements = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryStockMovementsQueryKey(effectiveUnitId, scope),
        queryFn: () => inventoryService.getStockMovements(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryPurchases = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryPurchasesQueryKey(effectiveUnitId, scope),
        queryFn: () => inventoryService.getPurchases(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useInventoryStockIssueRequests = (options?: InventoryReadOptions & { enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryStockIssueRequestsQueryKey(effectiveUnitId, scope, options?.patientId),
        queryFn: () => inventoryService.getStockIssueRequests(effectiveOptions),
        enabled: options?.enabled
    })
}

export const useCreateInventoryProduct = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.createProduct,
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-products', ...unitPrefix] })
            toast({ type: 'success', title: 'Product Added', message: 'Inventory product saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Product Failed', message: resolveErrorMessage(error, 'Failed to save product') })
        }
    })
}

export const useUpdateInventoryProduct = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
            inventoryService.updateProduct(id, payload),
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-products', ...unitPrefix] })
            toast({ type: 'success', title: 'Product Updated', message: 'Product master record updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update product') })
        }
    })
}

export const useUpdateInventoryProductStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: boolean }) =>
            inventoryService.updateProductStatus(id, status),
        onSuccess: (_data, variables) => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-products', ...unitPrefix] })
            toast({
                type: 'success',
                title: variables.status ? 'Product Reactivated' : 'Product Deactivated',
                message: variables.status
                    ? 'Product has been reactivated and is available for transactions.'
                    : 'Product has been safely deactivated from active catalog.'
            })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Status Change Failed', message: resolveErrorMessage(error, 'Failed to update product status') })
        }
    })
}

export const useUpdateInventoryStock = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.updateStock,
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-stock', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-products', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches', ...unitPrefix] })
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.createPurchase,
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-purchases', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches', ...unitPrefix] })
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.createStockIssueRequest,
        onSuccess: (data) => {
            const affectedUnitId = data?.unitId || activeUnitId
            const unitPrefixes = new Set<string>()
            if (affectedUnitId) unitPrefixes.add(affectedUnitId)
            if (activeUnitId) unitPrefixes.add(activeUnitId)

            for (const unitId of unitPrefixes) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] })
            }
            if (unitPrefixes.size === 0) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            }
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.approveStockIssueRequest,
        onSuccess: (data) => {
            const affectedUnitId = data?.unitId || activeUnitId
            const unitPrefixes = new Set<string>()
            if (affectedUnitId) unitPrefixes.add(affectedUnitId)
            if (activeUnitId) unitPrefixes.add(activeUnitId)

            for (const unitId of unitPrefixes) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] })
                queryClient.invalidateQueries({ queryKey: ['inventory-stock', unitId] })
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements', unitId] })
                queryClient.invalidateQueries({ queryKey: ['inventory-batches', unitId] })
                queryClient.invalidateQueries({ queryKey: ['patient-daily-costs', unitId] })
            }
            if (unitPrefixes.size === 0) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
                queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
                queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
                queryClient.invalidateQueries({ queryKey: ['patient-daily-costs'] })
            }
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.rejectStockIssueRequest,
        onSuccess: (data) => {
            const affectedUnitId = data?.unitId || activeUnitId
            const unitPrefixes = new Set<string>()
            if (affectedUnitId) unitPrefixes.add(affectedUnitId)
            if (activeUnitId) unitPrefixes.add(activeUnitId)

            for (const unitId of unitPrefixes) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] })
            }
            if (unitPrefixes.size === 0) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            }
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            inventoryService.cancelStockIssueRequest(id, reason),
        onSuccess: (data) => {
            const affectedUnitId = data?.unitId || activeUnitId
            const unitPrefixes = new Set<string>()
            if (affectedUnitId) unitPrefixes.add(affectedUnitId)
            if (activeUnitId) unitPrefixes.add(activeUnitId)

            for (const unitId of unitPrefixes) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] })
            }
            if (unitPrefixes.size === 0) {
                queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests'] })
            }
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
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.createKitchenRequisition,
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches', ...unitPrefix] })
            toast({ type: 'success', title: 'Ingredients Requested', message: 'Kitchen requisition processed and stock updated' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Requisition Failed', message: resolveErrorMessage(error, 'Failed to request ingredients') })
        }
    })
}

export const useVendors = (options?: { unitId?: string | null; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryVendorsQueryKey(effectiveUnitId),
        queryFn: () => inventoryService.getVendors({ unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId }),
        enabled: options?.enabled
    })
}

export const useCreateVendor = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: inventoryService.createVendor,
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['vendors', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
            toast({ type: 'success', title: 'Vendor Enrolled', message: 'Vendor added to master directory' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Vendor Failed', message: resolveErrorMessage(error, 'Failed to enroll vendor') })
        }
    })
}

export const useUpdateVendor = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => inventoryService.updateVendor(id, data),
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['vendors', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
            toast({ type: 'success', title: 'Vendor Updated', message: 'Vendor details updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update vendor') })
        }
    })
}

export const useDeleteVendor = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: (id: string) => inventoryService.deleteVendor(id),
        onSuccess: () => {
            const unitPrefix = activeUnitId ? [activeUnitId] : []
            queryClient.invalidateQueries({ queryKey: ['vendors', ...unitPrefix] })
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
            toast({ type: 'success', title: 'Vendor Removed', message: 'Vendor removed from directory' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Delete Failed', message: resolveErrorMessage(error, 'Failed to remove vendor') })
        }
    })
}

export const usePatientServices = () => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const unitPrefix = activeUnitId ? [activeUnitId] : []

    return useQuery({
        queryKey: ['patient-billing-services', ...unitPrefix],
        queryFn: () => inventoryService.getPatientServices({ unitId: activeUnitId }),
        staleTime: 120_000,
        retry: 1
    })
}

export const usePurchaseOrders = (options?: InventoryReadOptions & {
    status?: string;
    vendorId?: string;
    search?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
}) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)
    const scope = resolveEffectiveScope(options)
    const effectiveOptions = resolveEffectiveOptions(options, effectiveUnitId)

    return useQuery({
        queryKey: inventoryPurchaseOrdersQueryKey(
            effectiveUnitId,
            scope,
            options?.status,
            options?.vendorId,
            options?.search,
            options?.page,
            options?.limit
        ),
        queryFn: () => inventoryService.getPurchaseOrders(effectiveOptions),
        enabled: options?.enabled
    })
}

export const usePurchaseOrderDetails = (id: string | null, options?: { unitId?: string | null; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryPurchaseOrderDetailsQueryKey(effectiveUnitId, id),
        queryFn: () => (id ? inventoryService.getPurchaseOrderById(id, { unitId: effectiveUnitId }) : null),
        enabled: Boolean(id) && options?.enabled !== false
    })
}

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: (payload: CreatePurchaseOrderPayload) =>
            inventoryService.createPurchaseOrder(payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            toast({
                type: 'success',
                title: 'Purchase Order Created',
                message: `Purchase order ${data.orderNumber} created successfully in draft status.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Creation Failed',
                message: resolveErrorMessage(error, 'Failed to create purchase order')
            })
        }
    })
}

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchaseOrderPayload }) =>
            inventoryService.updatePurchaseOrder(id, payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-order-details'] })
            toast({
                type: 'success',
                title: 'Purchase Order Updated',
                message: `Purchase order ${data.orderNumber} updated successfully.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Update Failed',
                message: resolveErrorMessage(error, 'Failed to update purchase order')
            })
        }
    })
}

export const useOrderPurchaseOrder = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: (id: string) =>
            inventoryService.orderPurchaseOrder(id, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-order-details'] })
            toast({
                type: 'success',
                title: 'Purchase Order Placed',
                message: `Purchase order ${data.orderNumber} submitted and marked as ORDERED.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Order Placement Failed',
                message: resolveErrorMessage(error, 'Failed to place purchase order')
            })
        }
    })
}

export const useCancelPurchaseOrder = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            inventoryService.cancelPurchaseOrder(id, reason, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-order-details'] })
            toast({
                type: 'success',
                title: 'Purchase Order Cancelled',
                message: `Purchase order ${data.orderNumber} has been cancelled.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Cancellation Failed',
                message: resolveErrorMessage(error, 'Failed to cancel purchase order')
            })
        }
    })
}

export const useGoodsReceipts = (options?: {
    unitId?: string | null;
    scope?: string;
    purchaseOrderId?: string;
    vendorId?: string;
    search?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
}) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryGoodsReceiptsQueryKey(
            effectiveUnitId,
            options?.scope,
            options?.purchaseOrderId,
            options?.vendorId,
            options?.search,
            options?.page,
            options?.limit
        ),
        queryFn: () =>
            inventoryService.getGoodsReceipts({
                unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId,
                scope: options?.scope as any,
                purchaseOrderId: options?.purchaseOrderId,
                vendorId: options?.vendorId,
                search: options?.search,
                page: options?.page,
                limit: options?.limit
            }),
        enabled: options?.enabled
    })
}

export const useGoodsReceiptDetails = (id: string | null, options?: { unitId?: string | null; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryGoodsReceiptDetailsQueryKey(effectiveUnitId, id),
        queryFn: () => (id ? inventoryService.getGoodsReceiptById(id, { unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId }) : null),
        enabled: Boolean(id) && (options?.enabled ?? true)
    })
}

export const useCreateGoodsReceipt = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ purchaseOrderId, payload }: { purchaseOrderId: string; payload: CreateGoodsReceiptPayload }) =>
            inventoryService.createGoodsReceipt(purchaseOrderId, payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-order-details'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-goods-receipts'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-goods-receipt-details'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
            toast({
                type: 'success',
                title: 'Goods Receipt Posted',
                message: `GRN ${data.grnNumber} posted successfully. Accepted quantities have been added to inventory stock.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Receipt Failed',
                message: resolveErrorMessage(error, 'Failed to post goods receipt note')
            })
        }
    })
}

export const useSupplierReturns = (options?: {
    unitId?: string | null;
    scope?: string;
    vendorId?: string;
    search?: string;
    query?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
}) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventorySupplierReturnsQueryKey(
            effectiveUnitId,
            options?.scope,
            options?.vendorId,
            options?.search || options?.query,
            options?.page,
            options?.limit
        ),
        queryFn: () =>
            inventoryService.getSupplierReturns({
                unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId,
                scope: options?.scope as any,
                vendorId: options?.vendorId,
                search: options?.search || options?.query,
                page: options?.page,
                limit: options?.limit
            }),
        enabled: options?.enabled
    })
}

export const useSupplierReturnDetails = (id: string | null, options?: { unitId?: string | null; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventorySupplierReturnDetailsQueryKey(effectiveUnitId, id),
        queryFn: () => (id ? inventoryService.getSupplierReturnById(id, { unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId }) : null),
        enabled: Boolean(id) && (options?.enabled ?? true)
    })
}

export const useCreateSupplierReturn = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: (payload: CreateSupplierReturnPayload) =>
            inventoryService.createSupplierReturn(payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-supplier-returns'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-supplier-return-details'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-goods-receipts'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-goods-receipt-details'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-purchase-orders'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
            toast({
                type: 'success',
                title: 'Supplier Return Processed',
                message: `Return ${data.returnNumber} processed successfully. Stock and batch quantities have been deducted.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Return Failed',
                message: resolveErrorMessage(error, 'Failed to process supplier return')
            })
        }
    })
}

// =========================================================================
// D10 — VALUATION, CONSUMPTION & PHYSICAL AUDIT HOOKS
// =========================================================================

export const useStockValuation = (
    params?: { view?: 'aggregate' | 'batch'; category?: string; search?: string },
    options?: InventoryReadOptions & { enabled?: boolean }
) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryStockValuationQueryKey(effectiveUnitId, params?.view, params?.category, params?.search),
        queryFn: () =>
            inventoryService.getStockValuation({
                ...resolveEffectiveOptions(options, effectiveUnitId),
                view: params?.view,
                category: params?.category,
                search: params?.search
            }),
        enabled: options?.enabled
    })
}

export const useConsumptionAnalytics = (
    params?: { startDate?: string; endDate?: string; category?: string; productId?: string },
    options?: InventoryReadOptions & { enabled?: boolean }
) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryConsumptionAnalyticsQueryKey(effectiveUnitId, params?.startDate, params?.endDate, params?.category, params?.productId),
        queryFn: () =>
            inventoryService.getConsumptionAnalytics({
                ...resolveEffectiveOptions(options, effectiveUnitId),
                startDate: params?.startDate,
                endDate: params?.endDate,
                category: params?.category,
                productId: params?.productId
            }),
        enabled: options?.enabled
    })
}

export const usePhysicalAudits = (
    params?: { status?: string; productId?: string; page?: number; limit?: number },
    options?: InventoryReadOptions & { enabled?: boolean }
) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryPhysicalAuditsQueryKey(effectiveUnitId, params?.status, params?.productId, params?.page, params?.limit),
        queryFn: () =>
            inventoryService.getPhysicalAudits({
                ...resolveEffectiveOptions(options, effectiveUnitId),
                status: params?.status,
                productId: params?.productId,
                page: params?.page,
                limit: params?.limit
            }),
        enabled: options?.enabled
    })
}

export const usePhysicalAuditDetails = (id: string | null, options?: { unitId?: string | null; enabled?: boolean }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const effectiveUnitId = resolveEffectiveUnitId(options?.unitId, activeUnitId)

    return useQuery({
        queryKey: inventoryPhysicalAuditDetailsQueryKey(effectiveUnitId, id),
        queryFn: () => (id ? inventoryService.getPhysicalAuditById(id, { unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId }) : null),
        enabled: Boolean(id) && (options?.enabled ?? true)
    })
}

export const useCreatePhysicalAudit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: (payload: CreatePhysicalAuditPayload) =>
            inventoryService.createPhysicalAudit(payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-physical-audits'] })
            toast({
                type: 'success',
                title: 'Audit Count Initiated',
                message: `Audit ${data.auditNumber} started with system snapshot balance of ${data.systemQuantityAtCount}.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Initiation Failed',
                message: resolveErrorMessage(error, 'Failed to start physical stock count')
            })
        }
    })
}

export const useSubmitPhysicalAuditCount = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: SubmitPhysicalAuditCountPayload }) =>
            inventoryService.submitPhysicalAuditCount(id, payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-physical-audits'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-physical-audit-details'] })
            toast({
                type: 'success',
                title: 'Physical Count Recorded',
                message: `Count for ${data.auditNumber} updated to ${data.physicalQuantity} (Variance: ${data.variance}).`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Count Submission Failed',
                message: resolveErrorMessage(error, 'Failed to record physical count')
            })
        }
    })
}

export const useReconcilePhysicalAudit = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const activeUnitId = useAuthStore((state) => state.activeUnitId)

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload?: ReconcilePhysicalAuditPayload }) =>
            inventoryService.reconcilePhysicalAudit(id, payload, { unitId: activeUnitId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-physical-audits'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-physical-audit-details'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-valuation'] })
            toast({
                type: 'success',
                title: 'Audit Reconciled & Stock Posted',
                message: `Physical audit reconciled. Live stock adjusted by ${data.liveAdjustment >= 0 ? '+' : ''}${data.liveAdjustment} to match verified physical count ${data.newBalance}.`
            })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Reconciliation Failed',
                message: resolveErrorMessage(error, 'Failed to reconcile physical audit')
            })
        }
    })
}





