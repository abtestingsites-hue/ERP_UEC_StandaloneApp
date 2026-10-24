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

export interface UpdateStockPayload {
    productId: string
    quantity: number
    usageType?: string
    notes?: string
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
    movementType: 'STOCK_IN' | 'STOCK_OUT' | 'PURCHASE' | 'CURRENT_STOCK'
    quantity: number
    signedQuantity: number
    vendor?: string | null
    usageType?: string | null
    notes?: string | null
    issuedTo?: string | null
    updatedBy: string
    balanceAfter?: number | null
    createdAt: string
}
