import type { CreateGoodsReceiptPayload, CreateGoodsReceiptItemPayload } from './inventory.types';

export interface GRNLineItemFormState {
    purchaseOrderItemId: string;
    productId: string;
    productName: string;
    productCode?: string | null;
    category?: string | null;
    unitOfMeasure?: string | null;
    isBatchTracked: boolean;
    orderedQuantity: number;
    previouslyReceivedQuantity: number;
    remainingQuantity: number;
    // Editable inputs
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    batchNumber: string;
    expiryDate: string;
    notes?: string;
    selected: boolean;
}

export interface ReceiveGoodsFormState {
    purchaseOrderId: string;
    orderNumber?: string;
    vendorId: string;
    receivedDate: string;
    deliveryChallanNo?: string;
    supplierInvoiceNo?: string;
    notes?: string;
    idempotencyKey: string;
    items: GRNLineItemFormState[];
}

export interface GRNValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validates Goods Receipt Note intake form before submission.
 */
export function validateReceiveGoodsForm(form: ReceiveGoodsFormState): GRNValidationResult {
    const errors: Record<string, string> = {};

    if (!form.purchaseOrderId || !form.purchaseOrderId.trim()) {
        errors.purchaseOrderId = 'Purchase order ID is required.';
    }

    if (!form.idempotencyKey || !form.idempotencyKey.trim()) {
        errors.idempotencyKey = 'A unique idempotency key is required.';
    }

    const selectedItems = (form.items || []).filter(it => it.selected);
    if (selectedItems.length === 0) {
        errors.items = 'Please select at least one product line item to receive.';
        return { isValid: false, errors };
    }

    const seenPoItemIds = new Set<string>();

    selectedItems.forEach((item, index) => {
        const idKey = `item_${index}`;

        if (!item.purchaseOrderItemId || !item.purchaseOrderItemId.trim()) {
            errors[`${idKey}_id`] = `Line ${index + 1}: Purchase order item ID is missing.`;
        } else if (seenPoItemIds.has(item.purchaseOrderItemId)) {
            errors[`${idKey}_duplicate`] = `Line ${index + 1}: Duplicate line item in receipt.`;
        } else {
            seenPoItemIds.add(item.purchaseOrderItemId);
        }

        const recv = Number(item.receivedQuantity);
        const acc = Number(item.acceptedQuantity);
        const rej = Number(item.rejectedQuantity);

        if (!Number.isInteger(recv) || recv <= 0) {
            errors[`${idKey}_received`] = `Line ${index + 1} (${item.productName}): Received quantity must be a positive integer greater than zero.`;
        }

        if (!Number.isInteger(acc) || acc < 0) {
            errors[`${idKey}_accepted`] = `Line ${index + 1} (${item.productName}): Accepted quantity must be a non-negative integer.`;
        }

        if (!Number.isInteger(rej) || rej < 0) {
            errors[`${idKey}_rejected`] = `Line ${index + 1} (${item.productName}): Rejected quantity must be a non-negative integer.`;
        }

        // Physical invariant: accepted + rejected === received
        if (Number.isInteger(recv) && Number.isInteger(acc) && Number.isInteger(rej)) {
            if (acc + rej !== recv) {
                errors[`${idKey}_balance`] = `Line ${index + 1} (${item.productName}): Accepted (${acc}) + Rejected (${rej}) must equal Received (${recv}).`;
            }
        }

        // Over-receipt check against remaining ordered quantity
        if (acc > item.remainingQuantity) {
            errors[`${idKey}_overReceipt`] = `Line ${index + 1} (${item.productName}): Accepted quantity (${acc}) exceeds remaining ordered quantity (${item.remainingQuantity}).`;
        }

        // Batch tracking rules
        if (item.isBatchTracked) {
            if (!item.batchNumber || !item.batchNumber.trim()) {
                errors[`${idKey}_batchNumber`] = `Line ${index + 1} (${item.productName}): Batch number is required for batch-tracked products.`;
            }

            if (!item.expiryDate || !item.expiryDate.trim()) {
                errors[`${idKey}_expiryDate`] = `Line ${index + 1} (${item.productName}): Expiry date is required for batch-tracked products.`;
            } else {
                const exp = new Date(item.expiryDate);
                if (isNaN(exp.getTime())) {
                    errors[`${idKey}_expiryDateInvalid`] = `Line ${index + 1} (${item.productName}): Invalid expiry date format.`;
                }
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Transforms validated form state into backend CreateGoodsReceiptPayload.
 */
export function buildCreateGRNPayload(form: ReceiveGoodsFormState): CreateGoodsReceiptPayload {
    const selectedItems = form.items.filter(it => it.selected);

    return {
        vendorId: form.vendorId ? form.vendorId.trim() : undefined,
        receivedDate: form.receivedDate ? form.receivedDate : undefined,
        deliveryChallanNo: form.deliveryChallanNo?.trim() || null,
        supplierInvoiceNo: form.supplierInvoiceNo?.trim() || null,
        notes: form.notes?.trim() || null,
        idempotencyKey: form.idempotencyKey.trim(),
        items: selectedItems.map(it => {
            const itemPayload: CreateGoodsReceiptItemPayload = {
                purchaseOrderItemId: it.purchaseOrderItemId.trim(),
                receivedQuantity: Math.trunc(Number(it.receivedQuantity)),
                acceptedQuantity: Math.trunc(Number(it.acceptedQuantity)),
                rejectedQuantity: Math.trunc(Number(it.rejectedQuantity)),
                notes: it.notes?.trim() || null
            };

            if (it.batchNumber && it.batchNumber.trim()) {
                itemPayload.batchNumber = it.batchNumber.trim();
            }

            if (it.expiryDate && it.expiryDate.trim()) {
                itemPayload.expiryDate = it.expiryDate.trim();
            }

            return itemPayload;
        })
    };
}

/**
 * Generates a unique UUID v4 string for receipt idempotency.
 */
export function generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'idemp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
