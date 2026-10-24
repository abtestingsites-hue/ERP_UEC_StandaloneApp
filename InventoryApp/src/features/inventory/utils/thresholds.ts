import type { InventoryProduct, InventoryStock } from '../types';

export const DEFAULT_MIN_STOCK_FALLBACK = 10;

export type StockStatusType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'AVAILABLE';

export interface StockStatusResult {
    status: StockStatusType;
    label: string;
    variant: 'danger' | 'warning' | 'success';
    threshold: number;
    hasCustomThreshold: boolean;
}

/**
 * Resolves the effective minimum stock threshold for a product.
 * Returns the configured product minStockLevel if it is a positive finite number,
 * otherwise falls back to the ERP standard threshold of 10.
 */
export const getEffectiveStockThreshold = (
    product?: Partial<InventoryProduct> | null
): { threshold: number; hasCustomThreshold: boolean } => {
    const minLevel = Number(product?.minStockLevel);
    const hasCustomThreshold = Number.isFinite(minLevel) && minLevel > 0;
    return {
        threshold: hasCustomThreshold ? minLevel : DEFAULT_MIN_STOCK_FALLBACK,
        hasCustomThreshold
    };
};

/**
 * Evaluates stock status based on live quantity and product threshold.
 * - quantity <= 0: Out of Stock (danger)
 * - quantity > 0 && quantity <= threshold: Low Stock (warning)
 * - quantity > threshold: Available (success)
 */
export const evaluateStockStatus = (
    quantity: number,
    product?: Partial<InventoryProduct> | null
): StockStatusResult => {
    const { threshold, hasCustomThreshold } = getEffectiveStockThreshold(product);
    const qty = Number(quantity || 0);

    if (qty <= 0) {
        return {
            status: 'OUT_OF_STOCK',
            label: 'Out of Stock',
            variant: 'danger',
            threshold,
            hasCustomThreshold
        };
    }

    if (qty <= threshold) {
        return {
            status: 'LOW_STOCK',
            label: 'Low Stock',
            variant: 'warning',
            threshold,
            hasCustomThreshold
        };
    }

    return {
        status: 'AVAILABLE',
        label: 'Available',
        variant: 'success',
        threshold,
        hasCustomThreshold
    };
};

/**
 * Convenience helper to evaluate status directly from an InventoryStock item.
 */
export const evaluateStockItemStatus = (item: InventoryStock): StockStatusResult => {
    return evaluateStockStatus(item.quantity, item.product);
};
