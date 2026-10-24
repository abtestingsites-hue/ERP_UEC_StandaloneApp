import { api } from '../../../lib/axios'
import type { CreateKitchenRequisitionPayload, CreateProductPayload, CreatePurchasePayload, CreateStockIssueRequestPayload, InventoryExpiryAlertBatch, InventoryExpirySummary, InventoryProduct, InventoryProductBatch, InventoryPurchase, InventoryStock, InventoryStockIssueRequest, InventoryStockMovement, UpdateStockPayload } from '../types'

export type InventoryReadOptions = {
    scope?: 'all' | 'elder' | 'medical' | string
    unitId?: string | null
    patientId?: string | null
}

const readConfig = (options?: InventoryReadOptions) => {
    const params: any = {}
    if (options?.scope) params.scope = options.scope
    if (options?.unitId) params.unitId = options.unitId
    if (options?.patientId) params.patientId = options.patientId
    
    return {
        params: Object.keys(params).length > 0 ? params : undefined,
        headers: options?.unitId ? { 'x-unit-id': options.unitId } : undefined
    }
}

export const inventoryService = {
    getProducts: async (options?: InventoryReadOptions): Promise<InventoryProduct[]> => {
        const response = await api.get('/product', readConfig(options))
        return response.data?.data || []
    },

    getBatches: async (options?: InventoryReadOptions & { productId?: string }): Promise<InventoryProductBatch[]> => {
        const config = readConfig(options)
        if (options?.productId) {
            config.params = { ...config.params, productId: options.productId }
        }
        const response = await api.get('/stock/batches', config)
        return response.data?.data || []
    },

    getExpiryAlerts: async (options?: InventoryReadOptions & { daysAhead?: number; status?: string; productId?: string }): Promise<{ alerts: InventoryExpiryAlertBatch[]; summary: InventoryExpirySummary }> => {
        const config = readConfig(options)
        const params: any = { ...config.params }
        if (options?.daysAhead !== undefined) params.daysAhead = options.daysAhead
        if (options?.status) params.status = options.status
        if (options?.productId) params.productId = options.productId
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/stock/expiry-alerts', config)
        return {
            alerts: response.data?.data || [],
            summary: response.data?.summary || {
                totalAlerts: 0,
                expiredCount: 0,
                expiringSoonCount: 0,
                expiringTodayCount: 0,
                totalQuantityAtRisk: 0,
                windowDays: options?.daysAhead || 30,
                evaluatedAt: new Date().toISOString()
            }
        }
    },

    createProduct: async (payload: CreateProductPayload): Promise<InventoryProduct> => {
        const response = await api.post('/product', payload)
        return response.data?.data
    },

    updateProduct: async (id: string, payload: UpdateProductPayload): Promise<InventoryProduct> => {
        const response = await api.put(`/product/${id}`, payload)
        return response.data?.data
    },

    updateProductStatus: async (id: string, status: boolean): Promise<InventoryProduct> => {
        const response = await api.patch(`/product/${id}/status`, { status })
        return response.data?.data
    },

    getStock: async (options?: InventoryReadOptions): Promise<InventoryStock[]> => {
        const response = await api.get('/stock', readConfig(options))
        return response.data?.data || []
    },

    getStockMovements: async (options?: InventoryReadOptions): Promise<InventoryStockMovement[]> => {
        const response = await api.get('/stock/movements', readConfig(options))
        return response.data?.data || []
    },

    updateStock: async (payload: UpdateStockPayload): Promise<InventoryStock> => {
        const response = await api.post('/stock/update', payload)
        return response.data?.data
    },

    getPurchases: async (options?: InventoryReadOptions): Promise<InventoryPurchase[]> => {
        const response = await api.get('/purchase', readConfig(options))
        return response.data?.data || []
    },

    createPurchase: async (payload: CreatePurchasePayload): Promise<InventoryPurchase> => {
        const response = await api.post('/purchase', payload)
        return response.data?.data
    },

    getStockIssueRequests: async (options?: InventoryReadOptions): Promise<InventoryStockIssueRequest[]> => {
        const response = await api.get('/stock/issue-requests', readConfig(options))
        return response.data?.data || []
    },

    createStockIssueRequest: async (payload: CreateStockIssueRequestPayload): Promise<InventoryStockIssueRequest> => {
        const response = await api.post('/stock/issue-requests', payload)
        return response.data?.data
    },

    approveStockIssueRequest: async (id: string): Promise<InventoryStockIssueRequest> => {
        const response = await api.post(`/stock/issue-requests/${id}/approve`)
        return response.data?.data
    },

    rejectStockIssueRequest: async (id: string): Promise<InventoryStockIssueRequest> => {
        const response = await api.post(`/stock/issue-requests/${id}/reject`)
        return response.data?.data
    },

    cancelStockIssueRequest: async (id: string, reason?: string): Promise<InventoryStockIssueRequest> => {
        const response = await api.post(`/stock/issue-requests/${id}/cancel`, { reason })
        return response.data?.data
    },

    createKitchenRequisition: async (payload: CreateKitchenRequisitionPayload): Promise<InventoryStockIssueRequest[]> => {
        const response = await api.post('/stock/kitchen-requisition', payload)
        return response.data?.data
    }
}
