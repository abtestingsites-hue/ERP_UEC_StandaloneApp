export interface UnitInfo {
    id: string;
    name: string;
    code?: string | null;
    unitType?: string | null;
}

export interface InventoryReadOptions {
    unitId?: string | null;
    allUnits?: boolean;
    category?: string;
    search?: string;
    scope?: string;
    domain?: 'medical' | 'food';
}


export interface InventoryProduct {
    id: string;
    name: string;
    code?: string | null;
    sku?: string | null;
    productCode?: string | null;
    category?: string | null;
    subCategory?: string | null;
    description?: string | null;
    unit?: string | null;
    unitOfMeasure?: string | null;
    unitCost?: number | null;
    defaultRevenuePrice?: number | null;
    minStockLevel?: number | null;
    reorderLevel?: number | null;
    chargeableInCareRevenue?: boolean;
    isBatchTracked?: boolean;
    status: boolean;
    tenantId: string;
    unitId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    stock?: InventoryStock[];
}

export interface InventoryStock {
    id: string;
    productId: string;
    quantity: number;
    tenantId: string;
    unitId: string;
    product?: InventoryProduct;
    unit?: UnitInfo;
}

export interface InventoryProductBatch {
    id: string;
    batchNumber: string;
    productId: string;
    quantity: number;
    expiryDate: string;
    receivedDate?: string;
    unitCost?: number | null;
    tenantId: string;
    unitId: string;
    createdAt?: string;
    updatedAt?: string;
    product?: InventoryProduct;
}

export interface InventoryStockMovement {
    id: string;
    productId: string;
    movementType: string;
    quantity: number;
    balanceAfter: number;
    batchId?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    notes?: string | null;
    performedBy?: string | null;
    tenantId: string;
    unitId?: string | null;
    createdAt: string;
    product?: InventoryProduct;
    batch?: InventoryProductBatch;
}

export interface CreateProductPayload {
    name: string;
    code?: string;
    category?: string;
    subCategory?: string;
    sku?: string;
    productCode?: string;
    description?: string;
    unit?: string;
    unitOfMeasure?: string;
    unitCost?: number;
    defaultRevenuePrice?: number;
    minStockLevel?: number;
    reorderLevel?: number;
    chargeableInCareRevenue?: boolean;
    isBatchTracked?: boolean;
    status?: boolean;
}

export interface UpdateProductPayload {
    name?: string;
    code?: string;
    category?: string;
    subCategory?: string;
    sku?: string;
    productCode?: string;
    description?: string;
    unit?: string;
    unitOfMeasure?: string;
    unitCost?: number;
    defaultRevenuePrice?: number;
    minStockLevel?: number;
    reorderLevel?: number;
    chargeableInCareRevenue?: boolean;
    isBatchTracked?: boolean;
}

// Vendor Directory Types
export interface Vendor {
    id: string;
    code: string;
    name: string;
    category: string;
    contact?: string | null;
    status: boolean;
    tenantId: string;
    unitId: string;
    isDeleted: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVendorPayload {
    code: string;
    name: string;
    category: string;
    contact?: string;
    status?: boolean;
}

export interface UpdateVendorPayload {
    code?: string;
    name?: string;
    category?: string;
    contact?: string;
    status?: boolean;
}

// Stock Issue Request Types
export type StockIssueRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface StockIssueRequest {
    id: string;
    requestNumber?: string | null;
    productId: string;
    productName?: string;
    category?: string | null;
    quantity: number;
    usageType: string;
    allocationId?: string | null;
    patientId?: string | null;
    prescriptionId?: string | null;
    rate?: number | null;
    amount?: number | null;
    status: StockIssueRequestStatus;
    requestedBy?: string | null;
    requestedAt: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    rejectedBy?: string | null;
    rejectedAt?: string | null;
    issuedTo?: string | null;
    notes?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
    product?: InventoryProduct;
}

export interface CreateIssueRequestPayload {
    productId: string;
    quantity: number;
    usageType: string;
    allocationId?: string;
    patientId?: string;
    prescriptionId?: string;
    rate?: number;
    overrideReason?: string;
    issuedTo?: string;
    notes?: string;
}

// Purchases Types
export interface InventoryPurchase {
    id: string;
    productId: string;
    quantity: number;
    vendor?: string | null;
    vendorId?: string | null;
    vendorName?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    unitCost?: number | null;
    totalAmount?: number | null;
    status?: string | null;
    receivedDate?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    product?: InventoryProduct;
}

export interface StockAdjustmentPayload {
    productId: string;
    adjustmentQuantity: number;
    batchId?: string;
    batchNumber?: string;
    expiryDate?: string;
    usageType?: string;
    reason: string;
    notes?: string;
}

// Valuation Types
export interface ValuationBatchBreakdown {
    batchId: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    expiryDate: string;
}

export interface ValuationItem {
    productId: string;
    productName: string;
    sku?: string | null;
    productCode?: string | null;
    category?: string | null;
    unitOfMeasure?: string | null;
    isBatchTracked: boolean;
    totalQuantity: number;
    unitCost: number | null;
    totalValuation: number | null;
    isCostMissing: boolean;
    batches?: ValuationBatchBreakdown[];
}

export interface ValuationSummary {
    totalValuation: number;
    totalUnitsInStock: number;
    totalItemsValued: number;
    totalItemsExcluded: number;
    currency: string;
    natureOfValuation: string;
    unitScope: 'all' | 'single';
    unitId: string | null;
    evaluatedAt: string;
}

export interface StockValuationResponse {
    summary: ValuationSummary;
    items: ValuationItem[];
    excludedProducts: Array<{
        productId: string;
        productName: string;
        sku?: string | null;
        totalQuantity: number;
        reason: string;
    }>;
}

// Consumption Analytics Types
export interface TopConsumedProduct {
    productId: string;
    productName: string;
    sku?: string | null;
    category?: string | null;
    totalQuantityConsumed: number;
    issueTransactionsCount: number;
}

export interface ConsumptionAnalyticsResponse {
    summary: {
        totalConsumptionQuantity: number;
        distinctProductsConsumed: number;
        totalIssueTransactions: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        unitScope: 'all' | 'single';
        unitId: string | null;
        inflowVsOutflow: {
            receiptInflow: number;
            consumptionOutflow: number;
            supplierReturnsOutflow: number;
            auditAdjustmentsDelta: number;
            wasteDiscardOutflow: number;
        };
    };
    topConsumedProducts: TopConsumedProduct[];
    categoryBreakdown: Array<{
        category: string;
        quantityConsumed: number;
        percentage: number;
    }>;
}

// Physical Audit Types
export type PhysicalAuditStatus = 'DRAFT' | 'COUNTED' | 'RECONCILED' | 'CANCELLED';

export interface PhysicalAudit {
    id: string;
    auditNumber: string;
    productId: string;
    batchId?: string | null;
    status: PhysicalAuditStatus;
    systemQuantityAtCount: number;
    physicalQuantity?: number | null;
    varianceQuantity?: number | null;
    reason?: string | null;
    notes?: string | null;
    countedAt?: string | null;
    countedById?: string | null;
    reconciledAt?: string | null;
    reconciledById?: string | null;
    tenantId: string;
    unitId: string;
    createdAt: string;
    product?: InventoryProduct;
    batch?: InventoryProductBatch;
}

export interface CreatePhysicalAuditPayload {
    productId: string;
    batchId?: string;
    notes?: string;
}

export interface SubmitPhysicalAuditCountPayload {
    physicalQuantity: number;
    reason?: string;
    notes?: string;
}

export interface ReconcilePhysicalAuditPayload {
    notes?: string;
}

// Expiry Alert Types
export interface InventoryExpiryAlertBatch {
    id: string;
    batchNumber: string;
    productId: string;
    productName: string;
    category?: string | null;
    quantity: number;
    expiryDate: string;
    daysRemaining: number;
    status: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE';
    isExpiringToday: boolean;
    unitCost?: number | null;
}

export interface InventoryExpirySummary {
    totalAlerts: number;
    expiredCount: number;
    expiringSoonCount: number;
    expiringTodayCount: number;
    totalQuantityAtRisk: number;
    windowDays: number;
    evaluatedAt: string;
}

// ==========================================
// Procurement: Purchase Order Types
// ==========================================

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
export type PurchaseOrderItemStatus = 'PENDING' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    status: PurchaseOrderItemStatus | string;
    notes?: string | null;
    tenantId: string;
    unitId: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    product?: {
        id: string;
        name: string;
        code?: string | null;
        category?: string | null;
        unit?: string | null;
        status?: boolean;
    } | InventoryProduct;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    vendorId: string;
    status: PurchaseOrderStatus;
    orderDate: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
    tenantId: string;
    unitId: string;
    createdById?: string | null;
    createdByName?: string | null;
    approvedById?: string | null;
    approvedByName?: string | null;
    approvedAt?: string | null;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    vendor?: {
        id: string;
        name: string;
        code?: string | null;
        category?: string | null;
        contact?: string | null;
    } | Vendor;
    items?: PurchaseOrderItem[];
    goodsReceipts?: GoodsReceiptNote[];
}

export interface CreatePurchaseOrderItemPayload {
    productId: string;
    orderedQuantity: number;
    notes?: string | null;
}

export interface CreatePurchaseOrderPayload {
    vendorId: string;
    items: CreatePurchaseOrderItemPayload[];
    orderDate?: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}

export interface UpdatePurchaseOrderPayload {
    vendorId?: string;
    items?: CreatePurchaseOrderItemPayload[];
    expectedDeliveryDate?: string | null;
    notes?: string | null;
}

export interface CancelPurchaseOrderPayload {
    reason?: string | null;
}

export interface PurchaseOrderFilterOptions extends InventoryReadOptions {
    status?: PurchaseOrderStatus | string;
    vendorId?: string;
    page?: number;
    limit?: number;
}

// ==========================================
// Procurement: Goods Receipt Note (GRN) Types
// ==========================================

export interface GoodsReceiptItem {
    id: string;
    goodsReceiptNoteId: string;
    purchaseOrderItemId: string;
    productId: string;
    receivedQuantity: number;
    rejectedQuantity: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    batchId?: string | null;
    stockMovementId?: string | null;
    notes?: string | null;
    tenantId: string;
    unitId: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    product?: {
        id: string;
        name: string;
        code?: string | null;
        category?: string | null;
        unit?: string | null;
    };
    batch?: {
        id: string;
        batchNumber: string;
        expiryDate: string;
    } | null;
    purchaseOrderItem?: PurchaseOrderItem;
}

export interface GoodsReceiptNote {
    id: string;
    grnNumber: string;
    purchaseOrderId: string;
    vendorId: string;
    idempotencyKey?: string | null;
    receivedDate: string;
    deliveryChallanNo?: string | null;
    supplierInvoiceNo?: string | null;
    notes?: string | null;
    receivedById?: string | null;
    receivedByName?: string | null;
    tenantId: string;
    unitId: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    vendor?: {
        id: string;
        name: string;
        code?: string | null;
        category?: string | null;
        contact?: string | null;
    };
    purchaseOrder?: {
        id: string;
        orderNumber: string;
        status: string;
        orderDate: string;
    };
    items?: GoodsReceiptItem[];
    // Computed summary fields from backend service
    itemCount?: number;
    totalReceivedQuantity?: number;
    totalAcceptedQuantity?: number;
    totalRejectedQuantity?: number;
}

export interface CreateGoodsReceiptItemPayload {
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
    items: CreateGoodsReceiptItemPayload[];
}

export interface GoodsReceiptFilterOptions extends InventoryReadOptions {
    purchaseOrderId?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
    idempotencyKey?: string;
    page?: number;
    limit?: number;
}

export interface GoodsReceiptListResponse {
    goodsReceipts: GoodsReceiptNote[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==========================================
// Procurement: Supplier Return Types
// ==========================================

export type SupplierReturnSourceType = 'GRN' | 'PURCHASE' | 'DIRECT';
export type SupplierReturnStatus = 'COMPLETED' | 'CANCELLED' | string;

export interface SupplierReturnItem {
    id: string;
    supplierReturnId: string;
    productId: string;
    batchId?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    returnQuantity: number;
    reason?: string | null;
    stockMovementId?: string | null;
    tenantId: string;
    unitId: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    product?: {
        id: string;
        name: string;
        code?: string | null;
        category?: string | null;
        unit?: string | null;
        isBatchTracked?: boolean;
    };
    batch?: InventoryProductBatch | null;
}

export interface SupplierReturn {
    id: string;
    returnNumber: string;
    vendorId: string;
    sourceType: SupplierReturnSourceType | string;
    sourceReference?: string | null;
    grnId?: string | null;
    purchaseId?: string | null;
    idempotencyKey?: string | null;
    returnDate: string;
    reason: string;
    status: SupplierReturnStatus;
    totalQuantity: number;
    notes?: string | null;
    returnedById?: string | null;
    returnedByName?: string | null;
    tenantId: string;
    unitId: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    vendor?: Vendor;
    items?: SupplierReturnItem[];
}

export interface CreateSupplierReturnItemPayload {
    productId: string;
    batchId?: string | null;
    batchNumber?: string | null;
    returnQuantity: number;
    reason?: string | null;
    goodsReceiptItemId?: string | null;
}

export interface CreateSupplierReturnPayload {
    vendorId: string;
    sourceType?: SupplierReturnSourceType;
    sourceReferenceId?: string | null;
    returnDate?: string | null;
    reason: string;
    notes?: string | null;
    idempotencyKey?: string | null;
    items: CreateSupplierReturnItemPayload[];
}

export interface SupplierReturnFilterOptions extends InventoryReadOptions {
    vendorId?: string;
    query?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedList<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

