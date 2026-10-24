import type { InventoryProduct, InventoryPurchase, InventoryStock, InventoryStockIssueRequest, InventoryStockMovement } from '../types'

export type InventoryScope = 'all' | 'elder' | 'medical'

export const inventoryScopeOptions = [
    { value: 'elder', label: 'Elder Inventory' },
    { value: 'medical', label: 'Medical Inventory' },
    { value: 'all', label: 'All Inventory' }
]

const elderCategories = new Set(['ration', 'fresh food', 'stationary', 'electrical', 'plumbing', 'electrical-plumbing', 'assets', 'asset'])
const medicalCategories = new Set(['medical', 'medicine', 'medicines', 'clinical', 'clinical-consumables'])

export const normalizeInventoryCategory = (category?: string | null) => String(category || '').trim().toLowerCase()

export const getInventoryScopeLabel = (scope: InventoryScope) =>
    inventoryScopeOptions.find((option) => option.value === scope)?.label || 'All Inventory'

export const getDefaultInventoryScope = (user?: any): InventoryScope => {
    const role = String(user?.role || user?.roleName || '').toLowerCase()
    const permissions = Array.isArray(user?.permissions)
        ? user.permissions.map((permission: any) => String(permission).toLowerCase()).join(' ')
        : ''
    const context = `${role} ${permissions}`

    if (context.includes('medical inventory') || context.includes('uhc') || context.includes('medical assets')) return 'medical'
    if (context.includes('elder inventory') || context.includes('uec') || context.includes('ration')) return 'elder'
    return 'all'
}

export const isCategoryInScope = (category: string | null | undefined, scope: InventoryScope) => {
    if (scope === 'all') return true
    const normalized = normalizeInventoryCategory(category)
    if (scope === 'medical') return medicalCategories.has(normalized)
    return elderCategories.has(normalized) || !medicalCategories.has(normalized)
}

export const productInScope = (product: InventoryProduct | undefined | null, scope: InventoryScope) =>
    isCategoryInScope(product?.category, scope)

export const stockInScope = (item: InventoryStock, scope: InventoryScope) =>
    productInScope(item.product, scope)

export const purchaseInScope = (item: InventoryPurchase, scope: InventoryScope) =>
    productInScope(item.product, scope)

export const movementInScope = (item: InventoryStockMovement, scope: InventoryScope) =>
    productInScope(item.product, scope)

export const issueInScope = (item: InventoryStockIssueRequest, scope: InventoryScope) =>
    isCategoryInScope(item.category, scope)
