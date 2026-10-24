import type { CreateSupplierReturnPayload, CreateSupplierReturnItemPayload, SupplierReturnSourceType } from './inventory.types';

export interface ReturnLineItemFormState {
    productId: string;
    productName: string;
    productCode?: string | null;
    category?: string | null;
    unitOfMeasure?: string | null;
    isBatchTracked: boolean;
    batchId?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    availableStock: number;
    returnableBalance?: number | null;
    returnQuantity: number;
    reason?: string;
    goodsReceiptItemId?: string | null;
    selected: boolean;
}

export interface CreateSupplierReturnFormState {
    vendorId: string;
    sourceType: SupplierReturnSourceType;
    sourceReferenceId?: string | null;
    sourceReferenceNumber?: string | null;
    returnDate: string;
    reason: string;
    notes?: string;
    idempotencyKey: string;
    items: ReturnLineItemFormState[];
}

export interface SupplierReturnValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

const INVALID_REASON_PLACEHOLDERS = new Set([
    'none',
    'n/a',
    'na',
    'test',
    'null',
    'undefined',
    'nil',
    'no reason',
    'asdf',
    'blank'
]);

/**
 * Validates whether a return reason meets backend strictness requirements:
 * String type, at least 5 non-whitespace characters, and not in the list of disallowed placeholders.
 */
export function isMeaningfulReturnReason(reason: unknown): boolean {
    if (!reason || typeof reason !== 'string') return false;
    const trimmed = reason.trim();
    if (trimmed.length < 5) return false;
    if (INVALID_REASON_PLACEHOLDERS.has(trimmed.toLowerCase())) return false;
    return true;
}

/**
 * Validates Supplier Return intake form before submission against all backend invariants.
 */
export function validateSupplierReturnForm(form: CreateSupplierReturnFormState): SupplierReturnValidationResult {
    const errors: Record<string, string> = {};

    if (!form.vendorId || !form.vendorId.trim()) {
        errors.vendorId = 'A vendor must be selected for the return.';
    }

    if (!isMeaningfulReturnReason(form.reason)) {
        errors.reason = 'A meaningful return reason of at least 5 characters is required (placeholder values like "none", "n/a", or "test" are rejected).';
    }

    if (!form.idempotencyKey || !form.idempotencyKey.trim()) {
        errors.idempotencyKey = 'A unique idempotency key is required.';
    }

    if (form.sourceType === 'GRN' && (!form.sourceReferenceId || !form.sourceReferenceId.trim())) {
        errors.sourceReferenceId = 'A reference Goods Receipt Note (GRN) must be selected for GRN-sourced returns.';
    }

    if (form.sourceType === 'PURCHASE' && (!form.sourceReferenceId || !form.sourceReferenceId.trim())) {
        errors.sourceReferenceId = 'A reference purchase record must be selected for Purchase-sourced returns.';
    }

    const selectedItems = (form.items || []).filter(it => it.selected);
    if (selectedItems.length === 0) {
        errors.items = 'Please select at least one item to return to the supplier.';
        return { isValid: false, errors };
    }

    const seenProductBatchKeys = new Set<string>();

    selectedItems.forEach((item, index) => {
        const idKey = `item_${index}`;

        if (!item.productId || !item.productId.trim()) {
            errors[`${idKey}_product`] = `Line ${index + 1}: Product selection is required.`;
            return;
        }

        const dedupKey = `${item.productId}_${item.batchId || item.batchNumber || 'nobatch'}`;
        if (seenProductBatchKeys.has(dedupKey)) {
            errors[`${idKey}_duplicate`] = `Line ${index + 1} (${item.productName}): Duplicate product/batch line in return submission.`;
        } else {
            seenProductBatchKeys.add(dedupKey);
        }

        const qty = Number(item.returnQuantity);
        if (!Number.isInteger(qty) || qty <= 0) {
            errors[`${idKey}_quantity`] = `Line ${index + 1} (${item.productName}): Return quantity must be a positive integer greater than zero.`;
        } else {
            // Live stock availability check
            if (item.availableStock !== undefined && qty > item.availableStock) {
                errors[`${idKey}_stock`] = `Line ${index + 1} (${item.productName}): Return quantity (${qty}) exceeds available stock on hand (${item.availableStock}).`;
            }

            // Returnable balance check (for GRN or Purchase sources)
            if (item.returnableBalance !== undefined && item.returnableBalance !== null && qty > item.returnableBalance) {
                errors[`${idKey}_returnable`] = `Line ${index + 1} (${item.productName}): Return quantity (${qty}) exceeds remaining eligible returnable balance (${item.returnableBalance}).`;
            }
        }

        // Batch tracking rules
        if (item.isBatchTracked) {
            if ((!item.batchId || !item.batchId.trim()) && (!item.batchNumber || !item.batchNumber.trim())) {
                errors[`${idKey}_batch`] = `Line ${index + 1} (${item.productName}): Batch details are required for batch-tracked products.`;
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Transforms validated form state into backend CreateSupplierReturnPayload contract.
 */
export function buildCreateSupplierReturnPayload(form: CreateSupplierReturnFormState): CreateSupplierReturnPayload {
    const selectedItems = form.items.filter(it => it.selected);

    return {
        vendorId: form.vendorId.trim(),
        sourceType: form.sourceType,
        sourceReferenceId: form.sourceReferenceId?.trim() || null,
        returnDate: form.returnDate ? form.returnDate : undefined,
        reason: form.reason.trim(),
        notes: form.notes?.trim() || null,
        idempotencyKey: form.idempotencyKey.trim(),
        items: selectedItems.map(it => {
            const itemPayload: CreateSupplierReturnItemPayload = {
                productId: it.productId.trim(),
                returnQuantity: Math.trunc(Number(it.returnQuantity)),
                reason: it.reason?.trim() || null
            };

            if (it.batchId && it.batchId.trim()) {
                itemPayload.batchId = it.batchId.trim();
            }

            if (it.batchNumber && it.batchNumber.trim()) {
                itemPayload.batchNumber = it.batchNumber.trim();
            }

            if (it.goodsReceiptItemId && it.goodsReceiptItemId.trim()) {
                itemPayload.goodsReceiptItemId = it.goodsReceiptItemId.trim();
            }

            return itemPayload;
        })
    };
}

/**
 * Generates a unique UUID v4 string for supplier return idempotency.
 */
export function generateReturnIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'ret-idemp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
