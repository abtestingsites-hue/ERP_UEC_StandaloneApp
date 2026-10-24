export interface InventoryProduct {
    id: string
    code?: string | null
    name: string
    category: string
    unit?: string
    minStockLevel?: number
    defaultRevenuePrice?: number
    chargeableInCareRevenue?: boolean
    status?: boolean
    isBatchTracked?: boolean
    unitId: string
    tenantId: string
    createdAt: string
    updatedAt: string
}

export interface InventoryProductBatch {
    id: string
    productId: string
    product?: InventoryProduct
    batchNumber: string
    expiryDate: string
    quantity: number
    status?: string
    unitId: string
    tenantId: string
    createdAt: string
    updatedAt: string
}

export interface InventoryExpiryAlertBatch {
    id: string
    productId: string
    batchNumber: string
    expiryDate: string
    quantity: number
    tenantId: string
    unitId: string
    status: 'EXPIRED' | 'EXPIRING_SOON' | 'UNKNOWN'
    daysRemaining: number
    isExpiringToday: boolean
    product?: InventoryProduct | null
    createdAt: string
    updatedAt: string
}

export interface InventoryExpirySummary {
    totalAlerts: number
    expiredCount: number
    expiringSoonCount: number
    expiringTodayCount: number
    totalQuantityAtRisk: number
    windowDays: number
    evaluatedAt: string
}

export interface InventoryExpiryAlertsResponse {
    alerts: InventoryExpiryAlertBatch[]
    summary: InventoryExpirySummary
}

export interface InventoryStock {
    id: string
    productId: string
    product?: InventoryProduct
    quantity: number
    unitId: string
    tenantId: string
    createdAt: string
    updatedAt: string
}

export interface CreateProductPayload {
    name: string
    code?: string | null
    category: string
    unit?: string
    minStockLevel?: number
    defaultRevenuePrice?: number
    chargeableInCareRevenue?: boolean
    status?: boolean
    isBatchTracked?: boolean
}

export interface UpdateProductPayload {
    name?: string
    code?: string | null
    category?: string
    subCategory?: string | null
    unit?: string
    minStockLevel?: number
    defaultRevenuePrice?: number
    chargeableInCareRevenue?: boolean
    status?: boolean
}

export interface UpdateProductStatusPayload {
    status: boolean
}

export interface UpdateStockPayload {
    productId: string
    quantity: number
    batchId?: string | null
    batchNumber?: string | null
    expiryDate?: string | null
    usageType?: string
    notes?: string
    referenceNo?: string
    storageLocation?: string
    issuedTo?: string
}

export interface InventoryPurchase {
    id: string
    productId: string
    product?: InventoryProduct
    quantity: number
    vendor: string
    vendorId?: string | null
    Vendor?: {
        id: string
        name: string
        code?: string
        category?: string
        contact?: string
    } | null
    batchId?: string | null
    unitId: string
    tenantId: string
    createdAt: string
    updatedAt: string
}

export interface CreatePurchasePayload {
    productId: string
    quantity: number
    vendor?: string
    vendorId?: string | null
    batchNumber?: string | null
    expiryDate?: string | null
}

export interface InventoryStockIssueRequest {
    id: string
    productId: string
    productName: string
    category: string
    quantity: number
    usageType: string
    allocationId?: string | null
    patientId?: string | null
    rate?: number | null
    amount?: number | null
    issuedTo?: string | null
    notes?: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    requestedBy?: string | null
    requestedAt: string
    approvedBy?: string | null
    approvedAt?: string | null
    rejectedBy?: string | null
    rejectedAt?: string | null
    tenantId: string
    unitId: string
    createdAt: string
    updatedAt: string
}

export interface CreateKitchenRequisitionPayload {
    mealPrepId: string
    items: {
        productId: string
        quantity: number
    }[]
}

export interface CreateStockIssueRequestPayload {
    productId: string
    quantity: number
    usageType: string
    allocationId?: string | null
    patientId?: string | null
    rate?: number | null
    issuedTo?: string
    notes?: string
}

export interface InventoryStockMovement {
    id: string
    productId: string
    product?: InventoryProduct
    movementType: 'PURCHASE' | 'ISSUE' | 'ADJUSTMENT' | 'STOCK_IN' | 'STOCK_OUT' | 'CURRENT_STOCK' | string
    quantity: number
    signedQuantity: number
    vendor?: string | null
    usageType?: string | null
    notes?: string | null
    issuedTo?: string | null
    updatedBy: string
    balanceAfter?: number | null
    referenceType?: string | null
    referenceId?: string | null
    createdAt: string
}

export interface Vendor {
    id: string
    code: string
    name: string
    category: string
    contact?: string | null
    status: boolean
    unitId?: string
    tenantId?: string
    isDeleted?: boolean
    createdAt?: string
    updatedAt?: string
}

export interface CreateVendorPayload {
    code: string
    name: string
    category: string
    contact?: string | null
    status?: boolean
}

export interface UpdateVendorPayload {
    code?: string
    name?: string
    category?: string
    contact?: string | null
    status?: boolean
}

export interface PatientBillingService {
    allocationId: string
    allocationRef: string
    admissionId?: string | null
    patientId?: string | null
    patientName: string
    clientName?: string | null
    serviceType: string
    serviceLabel?: string
    serviceName?: string
    status: string
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
export type PurchaseOrderItemStatus = 'PENDING' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    status: PurchaseOrderItemStatus;
    notes?: string | null;
    product?: InventoryProduct;
    receiptItems?: any[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    vendorId: string;
    status: PurchaseOrderStatus;
    orderDate: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
    createdById?: string | null;
    createdByName?: string | null;
    approvedById?: string | null;
    approvedByName?: string | null;
    approvedAt?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
    vendor: Vendor;
    items: PurchaseOrderItem[];
    goodsReceipts?: any[];
    itemCount?: number;
    totalOrderedQuantity?: number;
    totalReceivedQuantity?: number;
    remainingQuantity?: number;
    isFullyReceived?: boolean;
}

export interface PurchaseOrdersListResponse {
    purchaseOrders: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreatePurchaseOrderItemInput {
    productId: string;
    orderedQuantity: number;
    notes?: string | null;
}

export interface CreatePurchaseOrderPayload {
    vendorId: string;
    items: CreatePurchaseOrderItemInput[];
    orderDate?: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}

export interface UpdatePurchaseOrderPayload {
    vendorId?: string;
    items?: CreatePurchaseOrderItemInput[];
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}

export interface GoodsReceiptItem {
    id: string;
    goodsReceiptId: string;
    purchaseOrderItemId: string;
    productId: string;
    product?: InventoryProduct;
    purchaseOrderItem?: PurchaseOrderItem;
    batchId?: string | null;
    batch?: {
        id: string;
        batchNumber: string;
        expiryDate?: string | null;
    } | null;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    notes?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
}

export interface GoodsReceiptNote {
    id: string;
    grnNumber: string;
    purchaseOrderId: string;
    vendorId: string;
    tenantId: string;
    unitId: string;
    receivedDate: string;
    deliveryChallanNo?: string | null;
    supplierInvoiceNo?: string | null;
    receivedBy?: string | null;
    receivedByName?: string | null;
    notes?: string | null;
    idempotencyKey?: string | null;
    createdAt: string;
    updatedAt: string;
    vendor?: Vendor;
    purchaseOrder?: Partial<PurchaseOrder>;
    items: GoodsReceiptItem[];
    itemCount?: number;
    totalReceivedQuantity?: number;
    totalAcceptedQuantity?: number;
    totalRejectedQuantity?: number;
}

export interface GoodsReceiptListResponse {
    goodsReceipts: GoodsReceiptNote[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateGoodsReceiptItemInput {
    purchaseOrderItemId: string;
    receivedQuantity: number;
    acceptedQuantity?: number;
    rejectedQuantity?: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    notes?: string | null;
}

export interface CreateGoodsReceiptPayload {
    vendorId?: string;
    receivedDate?: string;
    deliveryChallanNo?: string | null;
    supplierInvoiceNo?: string | null;
    notes?: string | null;
    idempotencyKey?: string | null;
    items: CreateGoodsReceiptItemInput[];
}

export interface GoodsReceiptQueryParams {
    page?: number;
    limit?: number;
    purchaseOrderId?: string;
    vendorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    idempotencyKey?: string;
}

// ==========================================
// D9.1 SUPPLIER RETURNS TYPES
// ==========================================

export interface SupplierReturnItem {
    id: string;
    supplierReturnId?: string;
    productId: string;
    product?: Partial<InventoryProduct>;
    batchId?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    returnQuantity: number;
    reason?: string | null;
    stockMovementId?: string | null;
    createdAt?: string;
}

export interface SupplierReturn {
    id: string;
    returnNumber: string;
    vendorId: string;
    vendor?: Partial<Vendor>;
    sourceType: 'GRN' | 'PURCHASE' | 'DIRECT';
    sourceReference?: string | null;
    grnId?: string | null;
    purchaseId?: string | null;
    idempotencyKey?: string | null;
    returnDate: string;
    reason: string;
    status: string;
    totalQuantity: number;
    notes?: string | null;
    returnedById?: string | null;
    returnedByName?: string | null;
    createdAt: string;
    updatedAt: string;
    items: SupplierReturnItem[];
}

export interface SupplierReturnListResponse {
    supplierReturns: SupplierReturn[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateSupplierReturnItemInput {
    productId: string;
    batchId?: string | null;
    batchNumber?: string | null;
    returnQuantity: number;
    reason?: string | null;
    goodsReceiptItemId?: string | null;
}

export interface CreateSupplierReturnPayload {
    vendorId: string;
    sourceType?: 'GRN' | 'PURCHASE' | 'DIRECT';
    sourceReferenceId?: string | null;
    returnDate?: string;
    reason: string;
    notes?: string | null;
    idempotencyKey?: string | null;
    items: CreateSupplierReturnItemInput[];
}

export interface SupplierReturnQueryParams {
    page?: number;
    limit?: number;
    vendorId?: string;
    search?: string;
    query?: string;
    startDate?: string;
    endDate?: string;
}

// =========================================================================
// D10 — VALUATION, CONSUMPTION & PHYSICAL AUDIT TYPES
// =========================================================================

export interface ValuationItem {
    productId: string;
    productCode?: string | null;
    productName: string;
    category: string;
    unit: string;
    isBatchTracked: boolean;
    batchId?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    quantity: number;
    applicableUnitCost: number | null;
    valuationAmount: number | null;
    costSource: string;
    costStatus: 'VERIFIED' | 'MISSING_COST';
}

export interface ValuationSummary {
    totalValuationAmount: number;
    totalUnitsInStock: number;
    totalProductsCount: number;
    totalItemsValued: number;
    totalItemsExcluded: number;
    viewMode: string;
    unitId: string | null;
    tenantId: string;
    valuationMethod: string;
    isFinancialStatement: boolean;
    disclaimer: string;
}

export interface StockValuationResponse {
    summary: ValuationSummary;
    items: ValuationItem[];
    excludedProducts: Array<{
        productId: string;
        productCode?: string | null;
        productName: string;
        category: string;
        quantity: number;
        reason: string;
    }>;
}

export interface TopConsumedProduct {
    productId: string;
    productCode: string | null;
    productName: string;
    category: string;
    unit: string;
    consumedQuantity: number;
    movementCount: number;
}

export interface DailyTrend {
    date: string;
    consumedQuantity: number;
    movementCount: number;
}

export interface CategoryConsumption {
    category: string;
    quantity: number;
    percentage: number;
}

export interface ConsumptionAnalyticsResponse {
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalConsumedQuantity: number;
        totalIssueMovements: number;
        distinctProductsConsumed: number;
        unitId: string | null;
        tenantId: string;
    };
    topConsumedProducts: TopConsumedProduct[];
    consumptionByCategory: CategoryConsumption[];
    dailyTrends: DailyTrend[];
    excludedBreakdown: {
        supplierReturnsQty: number;
        adjustmentNetQty: number;
        wasteDiscardQty: number;
        receiptInflowQty: number;
    };
    coverageNotice: string;
}

export type PhysicalAuditStatus = 'DRAFT' | 'COUNTED' | 'RECONCILED' | 'CANCELLED';

export interface PhysicalAudit {
    id: string;
    auditNumber: string;
    productId: string;
    product?: Partial<InventoryProduct>;
    batchId?: string | null;
    batch?: Partial<InventoryProductBatch>;
    batchNumber?: string | null;
    systemQuantityAtCount: number;
    physicalQuantity?: number | null;
    variance?: number | null;
    status: PhysicalAuditStatus;
    reason?: string | null;
    notes?: string | null;
    countedById?: string | null;
    countedByName?: string | null;
    countedAt?: string | null;
    reconciledById?: string | null;
    reconciledByName?: string | null;
    reconciledAt?: string | null;
    reconciliationMovementId?: string | null;
    tenantId: string;
    unitId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PhysicalAuditListResponse {
    data: PhysicalAudit[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreatePhysicalAuditPayload {
    productId: string;
    batchId?: string | null;
    batchNumber?: string | null;
    physicalQuantity?: number | null;
    reason?: string | null;
    notes?: string | null;
}

export interface SubmitPhysicalAuditCountPayload {
    physicalQuantity: number;
    reason?: string | null;
    notes?: string | null;
}

export interface ReconcilePhysicalAuditPayload {
    notes?: string | null;
}



