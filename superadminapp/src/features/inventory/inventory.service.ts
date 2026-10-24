import { api } from '../../services/api';
import type {
    InventoryProduct,
    CreateProductPayload,
    UpdateProductPayload,
    InventoryStock,
    InventoryProductBatch,
    InventoryStockMovement,
    StockAdjustmentPayload,
    StockValuationResponse,
    ValuationItem,
    ConsumptionAnalyticsResponse,
    PhysicalAudit,
    CreatePhysicalAuditPayload,
    SubmitPhysicalAuditCountPayload,
    ReconcilePhysicalAuditPayload,
    InventoryExpiryAlertBatch,
    InventoryExpirySummary,
    UnitInfo,
    Vendor,
    CreateVendorPayload,
    UpdateVendorPayload,
    StockIssueRequest,
    CreateIssueRequestPayload,
    InventoryPurchase,
    PurchaseOrder,
    CreatePurchaseOrderPayload,
    UpdatePurchaseOrderPayload,
    CancelPurchaseOrderPayload,
    PurchaseOrderFilterOptions,
    GoodsReceiptNote,
    CreateGoodsReceiptPayload,
    GoodsReceiptFilterOptions,
    GoodsReceiptListResponse,
    SupplierReturn,
    CreateSupplierReturnPayload,
    SupplierReturnFilterOptions,
    PaginatedList,
    InventoryReadOptions
} from './inventory.types';

export type { InventoryReadOptions };

const buildConfig = (options?: InventoryReadOptions) => {
    const params: Record<string, string> = {};
    const headers: Record<string, string> = {};

    if (options?.allUnits) {
        params.allUnits = 'true';
    } else if (options?.unitId) {
        headers['x-unit-id'] = options.unitId;
    }

    if (options?.domain) {
        params.domain = options.domain;
    }

    if (options?.category && options.category !== 'ALL') {
        params.category = options.category;
    }

    if (options?.search) {
        params.search = options.search;
    }

    if (options?.scope) {
        params.scope = options.scope;
    }

    return {
        params: Object.keys(params).length > 0 ? params : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined
    };
};

export const inventoryService = {
    // 1. Authorized Units
    getAuthorizedUnits: async (): Promise<UnitInfo[]> => {
        const response = await api.get('/master/units/authorized');
        return response.data?.data || [];
    },

    // 2. Product Catalog
    getProducts: async (options?: InventoryReadOptions): Promise<InventoryProduct[]> => {
        const response = await api.get('/product', buildConfig(options));
        const rawList = response.data?.data || [];
        return rawList.map((p: Record<string, unknown>) => ({
            ...(p as unknown as InventoryProduct),
            code: (p.code as string) || (p.productCode as string) || (p.sku as string) || null,
            productCode: (p.code as string) || (p.productCode as string) || (p.sku as string) || null,
            sku: (p.sku as string) || (p.code as string) || null,
            unit: (p.unit as string) || (p.unitOfMeasure as string) || 'Nos',
            unitOfMeasure: (p.unit as string) || (p.unitOfMeasure as string) || 'Nos',
            minStockLevel: p.minStockLevel !== undefined ? (p.minStockLevel as number) : (p.reorderLevel as number),
            reorderLevel: p.minStockLevel !== undefined ? (p.minStockLevel as number) : (p.reorderLevel as number),
            unitCost: p.defaultRevenuePrice !== undefined ? (p.defaultRevenuePrice as number) : (p.unitCost as number),
            defaultRevenuePrice: p.defaultRevenuePrice !== undefined ? (p.defaultRevenuePrice as number) : (p.unitCost as number)
        }));
    },

    createProduct: async (payload: CreateProductPayload, domain?: 'medical' | 'food'): Promise<InventoryProduct> => {
        const params = domain ? { domain } : undefined;
        const body: Record<string, unknown> = {
            name: payload.name.trim(),
            category: payload.category || 'General',
            unit: payload.unit || payload.unitOfMeasure || 'Nos',
            minStockLevel: payload.minStockLevel !== undefined ? Number(payload.minStockLevel) : (payload.reorderLevel !== undefined ? Number(payload.reorderLevel) : 0),
            defaultRevenuePrice: payload.defaultRevenuePrice !== undefined ? Number(payload.defaultRevenuePrice) : (payload.unitCost !== undefined ? Number(payload.unitCost) : 0),
            chargeableInCareRevenue: Boolean(payload.chargeableInCareRevenue),
            isBatchTracked: Boolean(payload.isBatchTracked),
            status: payload.status !== false
        };
        const code = (payload.code || payload.productCode || payload.sku || '').trim();
        if (code) body.code = code;

        const response = await api.post('/product', body, { params });
        return response.data?.data;
    },

    updateProduct: async (id: string, payload: UpdateProductPayload, domain?: 'medical' | 'food'): Promise<InventoryProduct> => {
        const params = domain ? { domain } : undefined;
        const body: Record<string, unknown> = {};
        if (payload.name) body.name = payload.name.trim();
        if (payload.category) body.category = payload.category;
        if (payload.unit || payload.unitOfMeasure) body.unit = payload.unit || payload.unitOfMeasure;
        if (payload.minStockLevel !== undefined) body.minStockLevel = Number(payload.minStockLevel);
        else if (payload.reorderLevel !== undefined) body.minStockLevel = Number(payload.reorderLevel);
        if (payload.defaultRevenuePrice !== undefined) body.defaultRevenuePrice = Number(payload.defaultRevenuePrice);
        else if (payload.unitCost !== undefined) body.defaultRevenuePrice = Number(payload.unitCost);
        if (payload.chargeableInCareRevenue !== undefined) body.chargeableInCareRevenue = Boolean(payload.chargeableInCareRevenue);
        if (payload.isBatchTracked !== undefined) body.isBatchTracked = Boolean(payload.isBatchTracked);
        const code = (payload.code || payload.productCode || payload.sku || '').trim();
        if (code) body.code = code;

        const response = await api.put(`/product/${id}`, body, { params });
        return response.data?.data;
    },

    updateProductStatus: async (id: string, status: boolean, domain?: 'medical' | 'food'): Promise<InventoryProduct> => {
        const params = domain ? { domain } : undefined;
        const response = await api.patch(`/product/${id}/status`, { status }, { params });
        return response.data?.data;
    },

    // 2b. Vendor Directory
    getVendors: async (unitId?: string | null): Promise<Vendor[]> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.get('/master/vendor', Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data || [];
    },

    createVendor: async (payload: CreateVendorPayload, unitId?: string | null): Promise<Vendor> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post('/master/vendor', payload, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    updateVendor: async (id: string, payload: UpdateVendorPayload, unitId?: string | null): Promise<Vendor> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.put(`/master/vendor/${id}`, payload, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    deleteVendor: async (id: string, unitId?: string | null): Promise<void> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        await api.delete(`/master/vendor/${id}`, Object.keys(headers).length > 0 ? { headers } : undefined);
    },

    // 2c. Stock Issue Requests
    getIssueRequests: async (options?: InventoryReadOptions & { status?: string; patientId?: string }): Promise<StockIssueRequest[]> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.status && options.status !== 'ALL') params.status = options.status;
        if (options?.patientId) params.patientId = options.patientId;
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/stock/issue-requests', config);
        return response.data?.data || [];
    },

    createIssueRequest: async (payload: CreateIssueRequestPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<StockIssueRequest> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const response = await api.post('/stock/issue-requests', payload, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    },

    approveIssueRequest: async (id: string, unitId?: string | null): Promise<unknown> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post(`/stock/issue-requests/${id}/approve`, {}, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    rejectIssueRequest: async (id: string, unitId?: string | null): Promise<unknown> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post(`/stock/issue-requests/${id}/reject`, {}, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    cancelIssueRequest: async (id: string, reason?: string, unitId?: string | null): Promise<unknown> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post(`/stock/issue-requests/${id}/cancel`, { reason }, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    // 2d. Purchases Telemetry
    getPurchases: async (options?: InventoryReadOptions): Promise<InventoryPurchase[]> => {
        const response = await api.get('/purchase', buildConfig(options));
        return response.data?.data || [];
    },

    // 3. Stock & Batches
    getStock: async (options?: InventoryReadOptions): Promise<InventoryStock[]> => {
        const response = await api.get('/stock', buildConfig(options));
        return response.data?.data || [];
    },

    getBatches: async (options?: InventoryReadOptions & { productId?: string }): Promise<InventoryProductBatch[]> => {
        const config = buildConfig(options);
        if (options?.productId) {
            config.params = { ...(config.params || {}), productId: options.productId };
        }
        const response = await api.get('/stock/batches', config);
        return response.data?.data || [];
    },

    adjustStock: async (payload: StockAdjustmentPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<unknown> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const body: Record<string, unknown> = {
            productId: payload.productId,
            quantity: payload.adjustmentQuantity,
            notes: payload.notes ? `${payload.reason}: ${payload.notes}` : payload.reason
        };
        if (payload.batchId) body.batchId = payload.batchId;
        if (payload.batchNumber) body.batchNumber = payload.batchNumber;
        if (payload.expiryDate) body.expiryDate = payload.expiryDate;
        if (payload.usageType) body.usageType = payload.usageType;

        const response = await api.post('/stock/update', body, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    },

    // 4. Expiry Alerts
    getExpiryAlerts: async (options?: InventoryReadOptions & { daysAhead?: number; status?: string }): Promise<{
        alerts: InventoryExpiryAlertBatch[];
        summary: InventoryExpirySummary;
    }> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.daysAhead !== undefined) params.daysAhead = String(options.daysAhead);
        if (options?.status) params.status = options.status;
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/stock/expiry-alerts', config);
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
        };
    },

    // 5. Stock Movements
    getStockMovements: async (options?: InventoryReadOptions): Promise<InventoryStockMovement[]> => {
        const response = await api.get('/stock/movements', buildConfig(options));
        return response.data?.data || [];
    },

    // 6. Stock Valuation
    getStockValuation: async (options?: InventoryReadOptions & { view?: 'aggregate' | 'batch' }): Promise<StockValuationResponse> => {
        const config = buildConfig(options);
        if (options?.view) {
            config.params = { ...(config.params || {}), view: options.view };
        }

        // Concurrently fetch valuation telemetry and active products to guarantee catalogue unit cost fallback
        const [valuationRes, products] = await Promise.all([
            api.get('/stock/valuation', config),
            inventoryService.getProducts(options).catch(() => [])
        ]);

        const rawData = valuationRes.data?.data;
        if (!rawData) {
            return {
                summary: {
                    totalValuation: 0,
                    totalUnitsInStock: 0,
                    totalItemsValued: 0,
                    totalItemsExcluded: 0,
                    currency: 'INR',
                    natureOfValuation: 'Operational',
                    unitScope: options?.unitId ? 'single' : 'all',
                    unitId: options?.unitId || null,
                    evaluatedAt: new Date().toISOString()
                },
                items: [],
                excludedProducts: []
            };
        }

        const productCostMap = new Map<string, number>();
        for (const p of products) {
            const cost = Number(p.defaultRevenuePrice ?? p.unitCost ?? 0);
            if (cost > 0) {
                productCostMap.set(p.id, cost);
            }
        }

        const rawItems = rawData.items || [];
        let totalValuation = 0;
        let totalUnitsInStock = 0;
        let totalItemsValued = 0;
        let totalItemsExcluded = 0;
        const excludedProducts: Array<{
            productId: string;
            productName: string;
            sku?: string | null;
            totalQuantity: number;
            reason: string;
        }> = [];

        const mappedItems: ValuationItem[] = rawItems.map((raw: Record<string, unknown>) => {
            const productId = raw.productId as string;
            const quantity = Number(raw.quantity ?? raw.totalQuantity ?? 0);
            totalUnitsInStock += quantity;

            // Verified cost from backend or catalogue unit cost fallback
            let unitCost: number | null = raw.applicableUnitCost !== null && raw.applicableUnitCost !== undefined
                ? Number(raw.applicableUnitCost)
                : (raw.unitCost !== null && raw.unitCost !== undefined ? Number(raw.unitCost) : null);

            if ((unitCost === null || unitCost === 0) && productCostMap.has(productId)) {
                unitCost = productCostMap.get(productId)!;
            }

            let itemValuation: number | null = null;
            let isCostMissing = false;

            if (unitCost !== null && unitCost > 0) {
                itemValuation = Math.round(quantity * unitCost * 100) / 100;
                totalValuation += itemValuation;
                totalItemsValued++;
            } else {
                isCostMissing = true;
                totalItemsExcluded++;
                excludedProducts.push({
                    productId,
                    productName: (raw.productName as string) || 'Unknown Product',
                    sku: (raw.productCode as string) || (raw.sku as string) || null,
                    totalQuantity: quantity,
                    reason: 'No verified acquisition or catalogue cost available'
                });
            }

            const mappedBatches = Array.isArray(raw.batches)
                ? (raw.batches as Array<Record<string, unknown>>).map((b) => {
                    const bQty = Number(b.quantity || 0);
                    const bCost = (b.unitCost !== null && b.unitCost !== undefined && Number(b.unitCost) > 0)
                        ? Number(b.unitCost)
                        : (unitCost || 0);
                    const bVal = (b.totalValue !== null && b.totalValue !== undefined && Number(b.totalValue) > 0)
                        ? Number(b.totalValue)
                        : Math.round(bQty * bCost * 100) / 100;

                    return {
                        batchId: (b.batchId as string) || (b.id as string) || '',
                        batchNumber: (b.batchNumber as string) || '',
                        quantity: bQty,
                        unitCost: bCost,
                        totalValue: bVal,
                        expiryDate: (b.expiryDate as string) || ''
                    };
                })
                : undefined;

            return {
                productId,
                productName: (raw.productName as string) || '',
                sku: (raw.productCode as string) || (raw.sku as string) || null,
                productCode: (raw.productCode as string) || null,
                category: (raw.category as string) || null,
                unitOfMeasure: (raw.unit as string) || (raw.unitOfMeasure as string) || 'units',
                isBatchTracked: Boolean(raw.isBatchTracked),
                totalQuantity: quantity,
                unitCost,
                totalValuation: itemValuation,
                isCostMissing,
                batches: mappedBatches
            };
        });

        totalValuation = Math.round(totalValuation * 100) / 100;

        return {
            summary: {
                totalValuation,
                totalUnitsInStock,
                totalItemsValued,
                totalItemsExcluded,
                currency: (rawData.summary?.currency as string) || 'INR',
                natureOfValuation: 'Operational',
                unitScope: rawData.summary?.unitId ? 'single' : 'all',
                unitId: (rawData.summary?.unitId as string) || null,
                evaluatedAt: (rawData.summary?.evaluatedAt as string) || new Date().toISOString()
            },
            items: mappedItems,
            excludedProducts
        };
    },

    // 7. Consumption Analytics
    getConsumptionAnalytics: async (options?: InventoryReadOptions & { startDate?: string; endDate?: string }): Promise<ConsumptionAnalyticsResponse> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.startDate) params.startDate = options.startDate;
        if (options?.endDate) params.endDate = options.endDate;
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/stock/consumption-analytics', config);
        return response.data?.data;
    },

    // 8. Physical Audits
    getPhysicalAudits: async (options?: InventoryReadOptions & { status?: string }): Promise<PhysicalAudit[]> => {
        const config = buildConfig(options);
        if (options?.status) {
            config.params = { ...(config.params || {}), status: options.status };
        }
        const response = await api.get('/stock/physical-audits', config);
        return response.data?.data || [];
    },

    getPhysicalAuditById: async (id: string, unitId?: string | null): Promise<PhysicalAudit> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const response = await api.get(`/stock/physical-audits/${id}`, { headers });
        return response.data?.data;
    },

    createPhysicalAudit: async (payload: CreatePhysicalAuditPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<PhysicalAudit> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const response = await api.post('/stock/physical-audits', payload, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    },

    submitPhysicalAuditCount: async (id: string, payload: SubmitPhysicalAuditCountPayload, unitId?: string | null): Promise<PhysicalAudit> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const response = await api.post(`/stock/physical-audits/${id}/submit-count`, payload, { headers });
        return response.data?.data;
    },

    reconcilePhysicalAudit: async (id: string, payload?: ReconcilePhysicalAuditPayload, unitId?: string | null): Promise<unknown> => {
        const headers = unitId ? { 'x-unit-id': unitId } : undefined;
        const response = await api.post(`/stock/physical-audits/${id}/reconcile`, payload || {}, { headers });
        return response.data?.data;
    },

    // 9. Procurement: Purchase Orders
    getPurchaseOrders: async (options?: PurchaseOrderFilterOptions): Promise<PaginatedList<PurchaseOrder>> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.status && options.status !== 'ALL') params.status = options.status;
        if (options?.vendorId) params.vendorId = options.vendorId;
        if (options?.page) params.page = String(options.page);
        if (options?.limit) params.limit = String(options.limit);
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/purchase-orders', config);
        return {
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                total: 0,
                page: options?.page || 1,
                limit: options?.limit || 20,
                totalPages: 1
            }
        };
    },

    getPurchaseOrderById: async (id: string, unitId?: string | null): Promise<PurchaseOrder> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.get(`/purchase-orders/${id}`, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    createPurchaseOrder: async (payload: CreatePurchaseOrderPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<PurchaseOrder> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const response = await api.post('/purchase-orders', payload, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    },

    updatePurchaseOrder: async (id: string, payload: UpdatePurchaseOrderPayload, unitId?: string | null): Promise<PurchaseOrder> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.patch(`/purchase-orders/${id}`, payload, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    orderPurchaseOrder: async (id: string, unitId?: string | null): Promise<PurchaseOrder> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post(`/purchase-orders/${id}/order`, {}, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    cancelPurchaseOrder: async (id: string, payload?: CancelPurchaseOrderPayload, unitId?: string | null): Promise<PurchaseOrder> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.post(`/purchase-orders/${id}/cancel`, payload || {}, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    // 10. Procurement: Goods Receipt Notes (GRN)
    getGoodsReceipts: async (options?: GoodsReceiptFilterOptions): Promise<GoodsReceiptListResponse> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.purchaseOrderId) params.purchaseOrderId = options.purchaseOrderId;
        if (options?.vendorId) params.vendorId = options.vendorId;
        if (options?.startDate) params.startDate = options.startDate;
        if (options?.endDate) params.endDate = options.endDate;
        if (options?.idempotencyKey) params.idempotencyKey = options.idempotencyKey;
        if (options?.page) params.page = String(options.page);
        if (options?.limit) params.limit = String(options.limit);
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/goods-receipts', config);
        const raw = response.data?.data;
        return {
            goodsReceipts: raw?.goodsReceipts || [],
            total: raw?.total || 0,
            page: raw?.page || options?.page || 1,
            limit: raw?.limit || options?.limit || 20,
            totalPages: raw?.totalPages || 1
        };
    },

    getGoodsReceiptById: async (id: string, unitId?: string | null): Promise<GoodsReceiptNote> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.get(`/goods-receipts/${id}`, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    createGoodsReceipt: async (purchaseOrderId: string, payload: CreateGoodsReceiptPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<GoodsReceiptNote> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const response = await api.post(`/purchase-orders/${purchaseOrderId}/grn`, payload, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    },

    // 11. Procurement: Supplier Returns
    getSupplierReturns: async (options?: SupplierReturnFilterOptions): Promise<PaginatedList<SupplierReturn>> => {
        const config = buildConfig(options);
        const params: Record<string, string> = { ...(config.params || {}) };
        if (options?.vendorId) params.vendorId = options.vendorId;
        if (options?.query) params.query = options.query;
        if (options?.page) params.page = String(options.page);
        if (options?.limit) params.limit = String(options.limit);
        config.params = Object.keys(params).length > 0 ? params : undefined;

        const response = await api.get('/stock/supplier-returns', config);
        const raw = response.data?.data;
        return {
            data: raw?.data || [],
            pagination: raw?.pagination || {
                total: 0,
                page: options?.page || 1,
                limit: options?.limit || 20,
                totalPages: 1
            }
        };
    },

    getSupplierReturnById: async (id: string, unitId?: string | null): Promise<SupplierReturn> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const response = await api.get(`/stock/supplier-returns/${id}`, Object.keys(headers).length > 0 ? { headers } : undefined);
        return response.data?.data;
    },

    createSupplierReturn: async (payload: CreateSupplierReturnPayload, unitId?: string | null, domain?: 'medical' | 'food'): Promise<SupplierReturn> => {
        const headers: Record<string, string> = {};
        if (unitId) headers['x-unit-id'] = unitId;
        const params = domain ? { domain } : undefined;
        const response = await api.post('/stock/supplier-returns', payload, {
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            params
        });
        return response.data?.data;
    }
};
