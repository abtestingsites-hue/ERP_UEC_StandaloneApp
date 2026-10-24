import { api } from '../../../lib/axios'
import type { ConsumptionAnalyticsResponse, CreateGoodsReceiptPayload, CreateKitchenRequisitionPayload, CreatePhysicalAuditPayload, CreateProductPayload, CreatePurchaseOrderPayload, CreatePurchasePayload, CreateStockIssueRequestPayload, CreateSupplierReturnPayload, CreateVendorPayload, GoodsReceiptListResponse, GoodsReceiptNote, GoodsReceiptQueryParams, InventoryExpiryAlertBatch, InventoryExpirySummary, InventoryProduct, InventoryProductBatch, InventoryPurchase, InventoryStock, InventoryStockIssueRequest, InventoryStockMovement, PatientBillingService, PhysicalAudit, PhysicalAuditListResponse, PurchaseOrder, PurchaseOrdersListResponse, ReconcilePhysicalAuditPayload, StockValuationResponse, SubmitPhysicalAuditCountPayload, SupplierReturn, SupplierReturnListResponse, SupplierReturnQueryParams, UpdateProductPayload, UpdatePurchaseOrderPayload, UpdateStockPayload, UpdateVendorPayload, Vendor } from '../types'

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
    },

    getVendors: async (options?: { unitId?: string | null }): Promise<Vendor[]> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get('/master/vendor', config)
        return response.data?.data || []
    },

    createVendor: async (payload: CreateVendorPayload): Promise<Vendor> => {
        const response = await api.post('/master/vendor', payload)
        return response.data?.data
    },

    updateVendor: async (id: string, payload: UpdateVendorPayload): Promise<Vendor> => {
        const response = await api.put(`/master/vendor/${id}`, payload)
        return response.data?.data
    },

    deleteVendor: async (id: string): Promise<void> => {
        await api.delete(`/master/vendor/${id}`)
    },

    getPatientServices: async (options?: { unitId?: string | null }): Promise<PatientBillingService[]> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get('/patient-billing/services', { ...config, params: { scope: 'all' } })
        return response.data?.data || []
    },

    getPurchaseOrders: async (options?: InventoryReadOptions & {
        status?: string;
        vendorId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PurchaseOrdersListResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.status) params.status = options.status
        if (options?.vendorId) params.vendorId = options.vendorId
        if (options?.search) params.search = options.search
        if (options?.page) params.page = options.page
        if (options?.limit) params.limit = options.limit
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/purchase-orders', config)
        return response.data?.data || { purchaseOrders: [], total: 0, page: 1, limit: 20, totalPages: 1 }
    },

    getPurchaseOrderById: async (id: string, options?: { unitId?: string | null }): Promise<PurchaseOrder> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get(`/purchase-orders/${id}`, config)
        return response.data?.data
    },

    createPurchaseOrder: async (payload: CreatePurchaseOrderPayload, options?: { unitId?: string | null }): Promise<PurchaseOrder> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post('/purchase-orders', payload, config)
        return response.data?.data
    },

    updatePurchaseOrder: async (id: string, payload: UpdatePurchaseOrderPayload, options?: { unitId?: string | null }): Promise<PurchaseOrder> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.patch(`/purchase-orders/${id}`, payload, config)
        return response.data?.data
    },

    orderPurchaseOrder: async (id: string, options?: { unitId?: string | null }): Promise<PurchaseOrder> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post(`/purchase-orders/${id}/order`, {}, config)
        return response.data?.data
    },

    cancelPurchaseOrder: async (id: string, reason?: string, options?: { unitId?: string | null }): Promise<PurchaseOrder> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post(`/purchase-orders/${id}/cancel`, { reason }, config)
        return response.data?.data
    },

    getGoodsReceipts: async (options?: InventoryReadOptions & GoodsReceiptQueryParams): Promise<GoodsReceiptListResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.purchaseOrderId) params.purchaseOrderId = options.purchaseOrderId
        if (options?.vendorId) params.vendorId = options.vendorId
        if (options?.search) params.search = options.search
        if (options?.startDate) params.startDate = options.startDate
        if (options?.endDate) params.endDate = options.endDate
        if (options?.idempotencyKey) params.idempotencyKey = options.idempotencyKey
        if (options?.page) params.page = options.page
        if (options?.limit) params.limit = options.limit
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/goods-receipts', config)
        return response.data?.data || { goodsReceipts: [], total: 0, page: 1, limit: 20, totalPages: 1 }
    },

    getGoodsReceiptById: async (id: string, options?: { unitId?: string | null }): Promise<GoodsReceiptNote> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get(`/goods-receipts/${id}`, config)
        return response.data?.data
    },

    createGoodsReceipt: async (purchaseOrderId: string, payload: CreateGoodsReceiptPayload, options?: { unitId?: string | null }): Promise<GoodsReceiptNote> => {
        const headers: Record<string, string> = {}
        if (options?.unitId) {
            headers['x-unit-id'] = options.unitId
        }
        if (payload.idempotencyKey) {
            headers['x-idempotency-key'] = payload.idempotencyKey
        }
        const config = Object.keys(headers).length > 0 ? { headers } : undefined
        const response = await api.post(`/purchase-orders/${purchaseOrderId}/grn`, payload, config)
        return response.data?.data
    },

    getSupplierReturns: async (options?: InventoryReadOptions & SupplierReturnQueryParams): Promise<SupplierReturnListResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.vendorId) params.vendorId = options.vendorId
        if (options?.search) params.query = options.search
        if (options?.query) params.query = options.query
        if (options?.startDate) params.startDate = options.startDate
        if (options?.endDate) params.endDate = options.endDate
        if (options?.page) params.page = options.page
        if (options?.limit) params.limit = options.limit
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/stock/supplier-returns', config)
        return response.data?.data || { supplierReturns: [], total: 0, page: 1, limit: 20, totalPages: 1 }
    },

    getSupplierReturnById: async (id: string, options?: { unitId?: string | null }): Promise<SupplierReturn> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get(`/stock/supplier-returns/${id}`, config)
        return response.data?.data
    },

    createSupplierReturn: async (payload: CreateSupplierReturnPayload, options?: { unitId?: string | null }): Promise<SupplierReturn> => {
        const headers: Record<string, string> = {}
        if (options?.unitId) {
            headers['x-unit-id'] = options.unitId
        }
        if (payload.idempotencyKey) {
            headers['x-idempotency-key'] = payload.idempotencyKey
        }
        const config = Object.keys(headers).length > 0 ? { headers } : undefined
        const response = await api.post('/stock/supplier-returns', payload, config)
        return response.data?.data
    },

    // D10 — Valuation & Consumption Analytics
    getStockValuation: async (options?: InventoryReadOptions & { view?: 'aggregate' | 'batch'; category?: string; search?: string }): Promise<StockValuationResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.view) params.view = options.view
        if (options?.category) params.category = options.category
        if (options?.search) params.search = options.search
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/stock/valuation', config)
        return response.data?.data
    },

    getConsumptionAnalytics: async (options?: InventoryReadOptions & { startDate?: string; endDate?: string; category?: string; productId?: string }): Promise<ConsumptionAnalyticsResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.startDate) params.startDate = options.startDate
        if (options?.endDate) params.endDate = options.endDate
        if (options?.category) params.category = options.category
        if (options?.productId) params.productId = options.productId
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/stock/consumption-analytics', config)
        return response.data?.data
    },

    // D10 — Physical Stock Audit
    getPhysicalAudits: async (options?: InventoryReadOptions & { status?: string; productId?: string; page?: number; limit?: number }): Promise<PhysicalAuditListResponse> => {
        const config = readConfig(options)
        const params: any = { ...(config?.params || {}) }
        if (options?.status) params.status = options.status
        if (options?.productId) params.productId = options.productId
        if (options?.page) params.page = options.page
        if (options?.limit) params.limit = options.limit
        config.params = Object.keys(params).length > 0 ? params : undefined

        const response = await api.get('/stock/physical-audits', config)
        return response.data
    },

    getPhysicalAuditById: async (id: string, options?: { unitId?: string | null }): Promise<PhysicalAudit> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.get(`/stock/physical-audits/${id}`, config)
        return response.data?.data
    },

    createPhysicalAudit: async (payload: CreatePhysicalAuditPayload, options?: { unitId?: string | null }): Promise<PhysicalAudit> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post('/stock/physical-audits', payload, config)
        return response.data?.data
    },

    submitPhysicalAuditCount: async (id: string, payload: SubmitPhysicalAuditCountPayload, options?: { unitId?: string | null }): Promise<PhysicalAudit> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post(`/stock/physical-audits/${id}/submit-count`, payload, config)
        return response.data?.data
    },

    reconcilePhysicalAudit: async (id: string, payload?: ReconcilePhysicalAuditPayload, options?: { unitId?: string | null }): Promise<any> => {
        const config = options?.unitId ? { headers: { 'x-unit-id': options.unitId } } : undefined
        const response = await api.post(`/stock/physical-audits/${id}/reconcile`, payload || {}, config)
        return response.data?.data
    }
}



