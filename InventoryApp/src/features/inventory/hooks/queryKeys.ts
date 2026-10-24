import type { InventoryReadOptions } from '../services/inventory';
import { useInventoryDomainStore } from '../../../store/useInventoryDomainStore';

export const resolveEffectiveUnitId = (
    optionsUnitId?: string | null,
    activeUnitId?: string | null
): string => {
    if (optionsUnitId) return optionsUnitId;
    if (activeUnitId) return activeUnitId;
    return 'unassigned-unit';
};

export const resolveEffectiveScope = (options?: InventoryReadOptions): string => {
    if (options?.scope && options.scope !== 'all') return options.scope;
    const domain = useInventoryDomainStore.getState().activeDomain;
    return domain || 'all';
};

export const resolveEffectiveOptions = <T extends InventoryReadOptions>(
    options: T | undefined,
    effectiveUnitId: string
): T => {
    if (!options && effectiveUnitId === 'unassigned-unit') {
        return undefined as unknown as T;
    }
    return {
        ...(options || ({} as T)),
        unitId: effectiveUnitId !== 'unassigned-unit' ? effectiveUnitId : options?.unitId
    };
};

export const scopeKey = (options?: InventoryReadOptions, activeUnitId?: string | null): string => {
    const unitId = resolveEffectiveUnitId(options?.unitId, activeUnitId);
    const scope = resolveEffectiveScope(options);
    return `${unitId}:${scope}`;
};

export const inventoryProductsQueryKey = (effectiveUnitId: string, scope?: string) =>
    ['inventory-products', effectiveUnitId, scope || 'all'] as const;

export const inventoryBatchesQueryKey = (effectiveUnitId: string, scope?: string, productId?: string) =>
    ['inventory-batches', effectiveUnitId, scope || 'all', productId] as const;

export const inventoryStockQueryKey = (effectiveUnitId: string, scope?: string) =>
    ['inventory-stock', effectiveUnitId, scope || 'all'] as const;

export const inventoryStockMovementsQueryKey = (effectiveUnitId: string, scope?: string) =>
    ['inventory-stock-movements', effectiveUnitId, scope || 'all'] as const;

export const inventoryPurchasesQueryKey = (effectiveUnitId: string, scope?: string) =>
    ['inventory-purchases', effectiveUnitId, scope || 'all'] as const;

export const inventoryStockIssueRequestsQueryKey = (effectiveUnitId: string, scope?: string, patientId?: string | null) =>
    ['inventory-stock-issue-requests', effectiveUnitId, scope || 'all', patientId] as const;

export const inventoryVendorsQueryKey = (effectiveUnitId?: string) =>
    effectiveUnitId ? (['vendors', effectiveUnitId] as const) : (['vendors'] as const);

export const inventoryExpiryAlertsQueryKey = (effectiveUnitId: string, scope?: string, daysAhead?: number, status?: string, productId?: string) =>
    ['inventory-expiry-alerts', effectiveUnitId, scope || 'all', daysAhead ?? 30, status || 'ALL', productId] as const;

export const inventoryPurchaseOrdersQueryKey = (
    effectiveUnitId: string,
    scope?: string,
    status?: string,
    vendorId?: string,
    search?: string,
    page?: number,
    limit?: number
) =>
    ['inventory-purchase-orders', effectiveUnitId, scope || 'all', status || 'ALL', vendorId || 'ALL', search || '', page || 1, limit || 20] as const;

export const inventoryPurchaseOrderDetailsQueryKey = (effectiveUnitId: string, id: string | null) =>
    ['inventory-purchase-order-details', effectiveUnitId, id || 'none'] as const;

export const inventoryGoodsReceiptsQueryKey = (
    effectiveUnitId: string,
    scope?: string,
    purchaseOrderId?: string,
    vendorId?: string,
    search?: string,
    page?: number,
    limit?: number
) =>
    ['inventory-goods-receipts', effectiveUnitId, scope || 'all', purchaseOrderId || 'ALL', vendorId || 'ALL', search || '', page || 1, limit || 20] as const;

export const inventoryGoodsReceiptDetailsQueryKey = (effectiveUnitId: string, id: string | null) =>
    ['inventory-goods-receipt-details', effectiveUnitId, id || 'none'] as const;

export const inventorySupplierReturnsQueryKey = (
    effectiveUnitId: string,
    scope?: string,
    vendorId?: string,
    search?: string,
    page?: number,
    limit?: number
) =>
    ['inventory-supplier-returns', effectiveUnitId, scope || 'all', vendorId || 'ALL', search || '', page || 1, limit || 20] as const;

export const inventorySupplierReturnDetailsQueryKey = (effectiveUnitId: string, id: string | null) =>
    ['inventory-supplier-return-details', effectiveUnitId, id || 'none'] as const;

export const inventoryStockValuationQueryKey = (effectiveUnitId: string, view?: string, category?: string, search?: string) =>
    ['inventory-stock-valuation', effectiveUnitId, useInventoryDomainStore.getState().activeDomain || 'all', view || 'aggregate', category || 'ALL', search || ''] as const;

export const inventoryConsumptionAnalyticsQueryKey = (effectiveUnitId: string, startDate?: string, endDate?: string, category?: string, productId?: string) =>
    ['inventory-consumption-analytics', effectiveUnitId, useInventoryDomainStore.getState().activeDomain || 'all', startDate || '30d', endDate || 'now', category || 'ALL', productId || 'ALL'] as const;

export const inventoryPhysicalAuditsQueryKey = (effectiveUnitId: string, status?: string, productId?: string, page?: number, limit?: number) =>
    ['inventory-physical-audits', effectiveUnitId, useInventoryDomainStore.getState().activeDomain || 'all', status || 'ALL', productId || 'ALL', page || 1, limit || 20] as const;

export const inventoryPhysicalAuditDetailsQueryKey = (effectiveUnitId: string, id: string | null) =>
    ['inventory-physical-audit-details', effectiveUnitId, id || 'none'] as const;



