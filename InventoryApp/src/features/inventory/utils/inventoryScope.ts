import type { InventoryProduct, InventoryPurchase, InventoryStock, InventoryStockIssueRequest, InventoryStockMovement, PurchaseOrder } from '../types'

export type InventoryScope = 'all' | 'elder' | 'medical' | 'food'

export const inventoryScopeOptions = [
    { value: 'medical', label: 'Medical Inventory' },
    { value: 'food', label: 'Food & Ration Inventory' },
    { value: 'all', label: 'All Inventory' }
]

export const medicalCategories = new Set([
    'medical',
    'medicine',
    'medicines',
    'clinical',
    'clinical-consumables'
])

export const foodRationCategories = new Set([
    'ration',
    'fresh food',
    'food',
    'food & ration',
    'ration & kitchen'
])

// Backward-compatibility alias
export const elderCategories = foodRationCategories

export const normalizeInventoryCategory = (category?: string | null) =>
    String(category || '').trim().toLowerCase()

export const normalizeInventoryScope = (scope?: string | null): InventoryScope => {
    const raw = String(scope || '').trim().toLowerCase()
    if (raw === 'medical') return 'medical'
    if (raw === 'elder' || raw === 'food' || raw === 'ration' || raw === 'food_ration') return 'food'
    return 'all'
}

export const getInventoryScopeLabel = (scope: InventoryScope | string) => {
    const norm = normalizeInventoryScope(scope)
    if (norm === 'medical') return 'Medical Inventory'
    if (norm === 'food') return 'Food & Ration Inventory'
    return 'All Inventory'
}

export const getDefaultInventoryScope = (user?: any): InventoryScope => {
    const role = String(user?.role || user?.roleName || '').toLowerCase()
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission: any) => String(permission).toLowerCase()).join(' ')
        : ''
    const context = `${role} ${permissions}`

    if (context.includes('medical inventory') || context.includes('uhc')) return 'medical'
    if (context.includes('elder inventory') || context.includes('uec') || context.includes('ration') || context.includes('food')) return 'food'
    return 'medical'
}

export const isCategoryInScope = (category: string | null | undefined, scope: InventoryScope | string) => {
    const normScope = normalizeInventoryScope(scope)
    if (normScope === 'all') return true
    const normalized = normalizeInventoryCategory(category)
    if (normScope === 'medical') return medicalCategories.has(normalized)
    if (normScope === 'food') return foodRationCategories.has(normalized)
    return true
}

export const isAmbiguousCategory = (category: string | null | undefined) => {
    const normalized = normalizeInventoryCategory(category)
    return !medicalCategories.has(normalized) && !foodRationCategories.has(normalized)
}

export const productInScope = (product: InventoryProduct | undefined | null, scope: InventoryScope | string) =>
    isCategoryInScope(product?.category, scope)

export const stockInScope = (item: InventoryStock, scope: InventoryScope | string) =>
    productInScope(item.product, scope)

export const purchaseInScope = (item: InventoryPurchase, scope: InventoryScope | string) =>
    productInScope(item.product, scope)

export const movementInScope = (item: InventoryStockMovement, scope: InventoryScope | string) =>
    productInScope(item.product, scope)

export const issueInScope = (item: InventoryStockIssueRequest, scope: InventoryScope | string) =>
    isCategoryInScope(item.category, scope)

export const purchaseOrderInScope = (item: PurchaseOrder, scope: InventoryScope | string) => {
    const normScope = normalizeInventoryScope(scope)
    if (normScope === 'all') return true
    if (!item.items || item.items.length === 0) return true
    return item.items.some((it) => isCategoryInScope(it.product?.category, normScope))
}

export const goodsReceiptInScope = (item: any, scope: InventoryScope | string) => {
    const normScope = normalizeInventoryScope(scope)
    if (normScope === 'all') return true
    if (!item.items || item.items.length === 0) return true
    return item.items.some((it: any) => isCategoryInScope(it.product?.category, normScope))
}

export const supplierReturnInScope = (item: any, scope: InventoryScope | string) => {
    const normScope = normalizeInventoryScope(scope)
    if (normScope === 'all') return true
    if (!item.items || item.items.length === 0) return true
    return item.items.some((it: any) => isCategoryInScope(it.product?.category, normScope))
}
