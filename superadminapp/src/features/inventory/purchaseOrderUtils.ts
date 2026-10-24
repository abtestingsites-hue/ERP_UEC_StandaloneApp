import type {
    CreatePurchaseOrderPayload,
    UpdatePurchaseOrderPayload,
    PurchaseOrderStatus
} from './inventory.types';

export interface FormLineItem {
    productId: string;
    orderedQuantity: number;
    notes?: string;
}

export interface PurchaseOrderFormState {
    vendorId: string;
    orderDate?: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: FormLineItem[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validates Purchase Order form state before creation or update.
 */
export function validatePurchaseOrderForm(form: PurchaseOrderFormState): ValidationResult {
    const errors: Record<string, string> = {};

    if (!form.vendorId || !form.vendorId.trim()) {
        errors.vendorId = 'Please select a vendor / supplier.';
    }

    if (!form.items || form.items.length === 0) {
        errors.items = 'Purchase order must have at least one product line item.';
    } else {
        const productIds = new Set<string>();
        form.items.forEach((item, index) => {
            if (!item.productId || !item.productId.trim()) {
                errors[`item_${index}_product`] = `Line ${index + 1}: Please select a product.`;
            } else if (productIds.has(item.productId)) {
                errors[`item_${index}_duplicate`] = `Line ${index + 1}: Duplicate product selected. Combine quantities instead.`;
            } else {
                productIds.add(item.productId);
            }

            const qty = Number(item.orderedQuantity);
            if (!item.orderedQuantity || qty <= 0 || !Number.isInteger(qty)) {
                errors[`item_${index}_quantity`] = `Line ${index + 1}: Quantity must be a positive whole number.`;
            }
        });
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Transforms validated form state into backend CreatePurchaseOrderPayload.
 */
export function buildCreatePOPayload(form: PurchaseOrderFormState): CreatePurchaseOrderPayload {
    return {
        vendorId: form.vendorId.trim(),
        orderDate: form.orderDate ? form.orderDate : undefined,
        expectedDeliveryDate: form.expectedDeliveryDate ? form.expectedDeliveryDate : null,
        notes: form.notes?.trim() || null,
        items: form.items.map(item => ({
            productId: item.productId.trim(),
            orderedQuantity: Math.max(1, Math.floor(Number(item.orderedQuantity))),
            notes: item.notes?.trim() || null
        }))
    };
}

/**
 * Transforms validated form state into backend UpdatePurchaseOrderPayload.
 */
export function buildUpdatePOPayload(form: PurchaseOrderFormState): UpdatePurchaseOrderPayload {
    return {
        vendorId: form.vendorId ? form.vendorId.trim() : undefined,
        expectedDeliveryDate: form.expectedDeliveryDate ? form.expectedDeliveryDate : null,
        notes: form.notes?.trim() || null,
        items: form.items.map(item => ({
            productId: item.productId.trim(),
            orderedQuantity: Math.max(1, Math.floor(Number(item.orderedQuantity))),
            notes: item.notes?.trim() || null
        }))
    };
}

/**
 * Returns permissible workflow transitions based on current PO status.
 */
export function getAvailablePOActions(status: PurchaseOrderStatus | string): {
    canEdit: boolean;
    canOrder: boolean;
    canCancel: boolean;
    canReceive: boolean;
} {
    const s = String(status).toUpperCase();
    return {
        canEdit: s === 'DRAFT',
        canOrder: s === 'DRAFT',
        canCancel: s === 'DRAFT' || s === 'ORDERED',
        canReceive: s === 'ORDERED' || s === 'PARTIALLY_RECEIVED'
    };
}
