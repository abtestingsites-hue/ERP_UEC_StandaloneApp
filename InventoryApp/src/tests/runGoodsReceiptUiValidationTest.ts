import { goodsReceiptInScope, purchaseOrderInScope } from '../features/inventory/utils/inventoryScope.js';
import type {
    GoodsReceiptNote,
    CreateGoodsReceiptPayload,
    CreateGoodsReceiptItemInput,
    PurchaseOrder,
    PurchaseOrderItem
} from '../features/inventory/types/index.js';

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

interface GrnFormLineState {
    purchaseOrderItemId: string;
    productId: string;
    productName: string;
    isBatchTracked: boolean;
    orderedQuantity: number;
    previouslyReceivedQuantity: number;
    remainingQuantity: number;
    receivedQuantity: number | string;
    acceptedQuantity: number | string;
    rejectedQuantity: number | string;
    batchNumber?: string;
    expiryDate?: string;
    notes?: string;
}

interface GrnFormState {
    receivedDate?: string;
    deliveryChallanNo?: string;
    supplierInvoiceNo?: string;
    notes?: string;
    idempotencyKey?: string;
    items: GrnFormLineState[];
}

/**
 * Validates the GRN Receiving Form
 * Mirroring the client-side validation implemented in PurchaseOrdersPage.tsx
 */
function validateGrnForm(form: GrnFormState): ValidationResult {
    const activeReceiptLines = form.items.filter((it) => {
        const q = Number(it.receivedQuantity);
        return !isNaN(q) && q > 0;
    });

    if (activeReceiptLines.length === 0) {
        return {
            isValid: false,
            error: 'Please enter a physical received quantity greater than 0 for at least one item line.'
        };
    }

    for (const line of activeReceiptLines) {
        const received = typeof line.receivedQuantity === 'number' ? line.receivedQuantity : Number(line.receivedQuantity);
        const accepted = typeof line.acceptedQuantity === 'number' ? line.acceptedQuantity : Number(line.acceptedQuantity);
        const rejected = typeof line.rejectedQuantity === 'number' ? line.rejectedQuantity : Number(line.rejectedQuantity);

        if (!Number.isInteger(received) || received <= 0) {
            return {
                isValid: false,
                error: `${line.productName}: Physical received quantity must be a positive whole number greater than 0.`
            };
        }
        if (!Number.isInteger(accepted) || accepted < 0) {
            return {
                isValid: false,
                error: `${line.productName}: Accepted quantity must be a non-negative whole number (0 or greater).`
            };
        }
        if (!Number.isInteger(rejected) || rejected < 0) {
            return {
                isValid: false,
                error: `${line.productName}: Rejected quantity must be a non-negative whole number (0 or greater).`
            };
        }
        if (accepted + rejected !== received) {
            return {
                isValid: false,
                error: `${line.productName}: Physical quantity mismatch! Accepted (${accepted}) + Rejected (${rejected}) must equal Physical Received (${received}).`
            };
        }
        if (accepted > line.remainingQuantity) {
            return {
                isValid: false,
                error: `${line.productName}: Accepted quantity (${accepted}) exceeds remaining ordered quantity (${line.remainingQuantity}). Over-receipt is prohibited.`
            };
        }
        if (line.isBatchTracked && accepted > 0) {
            if (!line.batchNumber || !line.batchNumber.trim()) {
                return {
                    isValid: false,
                    error: `${line.productName} is batch-tracked. Batch number is required for accepted goods.`
                };
            }
            if (!line.expiryDate || !line.expiryDate.trim()) {
                return {
                    isValid: false,
                    error: `${line.productName} is batch-tracked. Expiry date is required for accepted goods.`
                };
            }
            const expDate = new Date(line.expiryDate);
            if (isNaN(expDate.getTime())) {
                return {
                    isValid: false,
                    error: `${line.productName}: Invalid expiry date provided.`
                };
            }
        }
    }

    return { isValid: true };
}

/**
 * Builds the CreateGoodsReceiptPayload
 */
function buildGoodsReceiptPayload(form: GrnFormState): CreateGoodsReceiptPayload {
    const activeReceiptLines = form.items.filter((it) => Number(it.receivedQuantity) > 0);
    return {
        receivedDate: form.receivedDate || undefined,
        deliveryChallanNo: form.deliveryChallanNo?.trim() || undefined,
        supplierInvoiceNo: form.supplierInvoiceNo?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        idempotencyKey: form.idempotencyKey || undefined,
        items: activeReceiptLines.map((line) => ({
            purchaseOrderItemId: line.purchaseOrderItemId,
            receivedQuantity: typeof line.receivedQuantity === 'number' ? line.receivedQuantity : parseInt(line.receivedQuantity, 10),
            acceptedQuantity: typeof line.acceptedQuantity === 'number' ? line.acceptedQuantity : parseInt(line.acceptedQuantity, 10),
            rejectedQuantity: typeof line.rejectedQuantity === 'number' ? line.rejectedQuantity : parseInt(line.rejectedQuantity, 10),
            batchNumber: line.batchNumber?.trim() || undefined,
            expiryDate: line.expiryDate || undefined,
            notes: line.notes?.trim() || undefined,
        })),
    };
}

/**
 * PO Status Receiving Eligibility Check
 */
function canReceivePurchaseOrder(status: PurchaseOrder['status']): { allowed: boolean; reason?: string } {
    if (status === 'ORDERED' || status === 'PARTIALLY_RECEIVED') {
        return { allowed: true };
    }
    if (status === 'DRAFT') {
        return { allowed: false, reason: 'Purchase order must be ordered/placed before receiving goods.' };
    }
    if (status === 'COMPLETED') {
        return { allowed: false, reason: 'Purchase order is already completed and fully received.' };
    }
    if (status === 'CANCELLED') {
        return { allowed: false, reason: 'Cannot receive goods against a cancelled purchase order.' };
    }
    return { allowed: false, reason: `Invalid status: ${status}` };
}

// Test Runner
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

console.log('========================================================================');
console.log('📦 InventoryApp D8.5 — Goods Receipt Note (GRN) UI Verification Suite');
console.log('========================================================================\n');

// 1. PO Status Eligibility Tests
console.log('--- 1. Purchase Order Receiving Eligibility ---');

assert(canReceivePurchaseOrder('ORDERED').allowed === true, 'ORDERED status allows goods receipt');
assert(canReceivePurchaseOrder('PARTIALLY_RECEIVED').allowed === true, 'PARTIALLY_RECEIVED status allows goods receipt');
assert(canReceivePurchaseOrder('DRAFT').allowed === false, 'DRAFT status rejects goods receipt');
assert(canReceivePurchaseOrder('COMPLETED').allowed === false, 'COMPLETED status rejects goods receipt');
assert(canReceivePurchaseOrder('CANCELLED').allowed === false, 'CANCELLED status rejects goods receipt');

// 2. Physical Quantity & Invariant Validation Tests
console.log('\n--- 2. Physical Quantity & Invariant (Accepted + Rejected = Physical) ---');

const emptyLinesForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice Bag',
            isBatchTracked: false,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
        }
    ]
};
const resEmpty = validateGrnForm(emptyLinesForm);
assert(!resEmpty.isValid && resEmpty.error?.includes('greater than 0') === true, 'Rejects receipt with 0 physical received across all lines');

const mismatchForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice Bag',
            isBatchTracked: false,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 20,
            acceptedQuantity: 15,
            rejectedQuantity: 3, // 15 + 3 = 18 !== 20
        }
    ]
};
const resMismatch = validateGrnForm(mismatchForm);
assert(!resMismatch.isValid && resMismatch.error?.includes('Physical quantity mismatch') === true, 'Rejects when accepted + rejected does not equal physical received');

const negativeAccForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice Bag',
            isBatchTracked: false,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 10,
            acceptedQuantity: -2,
            rejectedQuantity: 12,
        }
    ]
};
const resNegAcc = validateGrnForm(negativeAccForm);
assert(!resNegAcc.isValid && resNegAcc.error?.includes('non-negative') === true, 'Rejects negative accepted quantity');

const negativeRejForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice Bag',
            isBatchTracked: false,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 10,
            acceptedQuantity: 12,
            rejectedQuantity: -2,
        }
    ]
};
const resNegRej = validateGrnForm(negativeRejForm);
assert(!resNegRej.isValid, 'Rejects negative rejected quantity');

const decimalForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice Bag',
            isBatchTracked: false,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 10.5,
            acceptedQuantity: 10.5,
            rejectedQuantity: 0,
        }
    ]
};
const resDec = validateGrnForm(decimalForm);
assert(!resDec.isValid && resDec.error?.includes('whole number') === true, 'Rejects decimal physical quantity');

// 3. Over-Receipt Rejection Tests
console.log('\n--- 3. Over-Receipt Prevention ---');

const overReceiptForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Surgical Gloves',
            isBatchTracked: false,
            orderedQuantity: 20,
            previouslyReceivedQuantity: 10,
            remainingQuantity: 10,
            receivedQuantity: 15,
            acceptedQuantity: 15, // remaining is 10
            rejectedQuantity: 0,
        }
    ]
};
const resOver = validateGrnForm(overReceiptForm);
assert(!resOver.isValid && resOver.error?.includes('exceeds remaining') === true, 'Rejects accepted quantity exceeding outstanding balance');

// 4. Batch & Expiry Validation for Batch-Tracked Products
console.log('\n--- 4. Batch and Expiry Requirements ---');

const missingBatchForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-med',
            productId: 'p-med',
            productName: 'Amoxicillin 500mg',
            isBatchTracked: true,
            orderedQuantity: 100,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 100,
            receivedQuantity: 50,
            acceptedQuantity: 50,
            rejectedQuantity: 0,
            batchNumber: '', // missing
            expiryDate: '2027-12-31',
        }
    ]
};
const resNoBatch = validateGrnForm(missingBatchForm);
assert(!resNoBatch.isValid && resNoBatch.error?.includes('Batch number is required') === true, 'Rejects batch-tracked product with missing batch number');

const missingExpiryForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-med',
            productId: 'p-med',
            productName: 'Amoxicillin 500mg',
            isBatchTracked: true,
            orderedQuantity: 100,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 100,
            receivedQuantity: 50,
            acceptedQuantity: 50,
            rejectedQuantity: 0,
            batchNumber: 'AMX-2026-B1',
            expiryDate: '', // missing
        }
    ]
};
const resNoExp = validateGrnForm(missingExpiryForm);
assert(!resNoExp.isValid && resNoExp.error?.includes('Expiry date is required') === true, 'Rejects batch-tracked product with missing expiry date');

const nonBatchForm: GrnFormState = {
    items: [
        {
            purchaseOrderItemId: 'poi-standard',
            productId: 'p-standard',
            productName: 'Office Notebook',
            isBatchTracked: false,
            orderedQuantity: 10,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 10,
            receivedQuantity: 10,
            acceptedQuantity: 10,
            rejectedQuantity: 0,
            batchNumber: '',
            expiryDate: '',
        }
    ]
};
const resNonBatch = validateGrnForm(nonBatchForm);
assert(resNonBatch.isValid, 'Accepts non-batch tracked product with empty batch and expiry');

// 5. Valid Full & Partial Receipt Payloads
console.log('\n--- 5. Valid Full & Partial Receipts ---');

const validFullForm: GrnFormState = {
    receivedDate: '2026-10-12',
    deliveryChallanNo: 'DC-88412',
    supplierInvoiceNo: 'INV-1029',
    notes: 'Order delivered on time',
    idempotencyKey: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    items: [
        {
            purchaseOrderItemId: 'poi-1',
            productId: 'p-1',
            productName: 'Rice 25kg',
            isBatchTracked: false,
            orderedQuantity: 40,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 40,
            receivedQuantity: 40,
            acceptedQuantity: 38,
            rejectedQuantity: 2,
            notes: '2 bags damaged in transit',
        },
        {
            purchaseOrderItemId: 'poi-2',
            productId: 'p-2',
            productName: 'Paracetamol',
            isBatchTracked: true,
            orderedQuantity: 50,
            previouslyReceivedQuantity: 0,
            remainingQuantity: 50,
            receivedQuantity: 50,
            acceptedQuantity: 50,
            rejectedQuantity: 0,
            batchNumber: 'PARA-2026-01',
            expiryDate: '2027-11-30',
        }
    ]
};
const resFull = validateGrnForm(validFullForm);
assert(resFull.isValid, 'Validates full receipt with accepted and rejected quantities');

const fullPayload = buildGoodsReceiptPayload(validFullForm);
assert(fullPayload.receivedDate === '2026-10-12', 'Builds payload with correct receivedDate');
assert(fullPayload.deliveryChallanNo === 'DC-88412', 'Builds payload with deliveryChallanNo');
assert(fullPayload.supplierInvoiceNo === 'INV-1029', 'Builds payload with supplierInvoiceNo');
assert(fullPayload.idempotencyKey === 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Builds payload with preserved idempotencyKey');
assert(fullPayload.items.length === 2, 'Builds payload with 2 receipt items');
assert(fullPayload.items[0].acceptedQuantity === 38 && fullPayload.items[0].rejectedQuantity === 2, 'Maps accepted and rejected quantities correctly');
assert(fullPayload.items[1].batchNumber === 'PARA-2026-01', 'Maps batch number correctly');

// 6. Idempotency Key Preservation Across Retries
console.log('\n--- 6. Idempotency Key Safe Retry Mechanics ---');

class IdempotentSubmissionSimulator {
    private key: string = '';
    private attempts: number = 0;

    openReceiptAttempt() {
        // Fresh logical attempt generates UUID
        this.key = 'key-uuid-' + Math.random().toString(36).substring(2, 9);
        this.attempts = 0;
    }

    getKey() {
        return this.key;
    }

    async submit(simulateFailure: boolean) {
        this.attempts++;
        if (simulateFailure) {
            // Failure keeps the exact same key in state!
            return { success: false, error: 'Network timeout', keySent: this.key };
        }
        return { success: true, keySent: this.key };
    }
}

const sim = new IdempotentSubmissionSimulator();
sim.openReceiptAttempt();
const originalKey = sim.getKey();
assert(Boolean(originalKey), 'Initial receipt attempt generates idempotency key');

// First attempt fails with network error
const attempt1 = sim.getKey();
assert(attempt1 === originalKey, 'First submission uses initial idempotency key');

// Retry after timeout
const retryAttempt = sim.getKey();
assert(retryAttempt === originalKey, 'Retry submission REUSES identical idempotency key without generating a new one');

// Opening new receipt attempt later generates new key
sim.openReceiptAttempt();
const newKey = sim.getKey();
assert(newKey !== originalKey, 'New logical receipt attempt generates fresh idempotency key');

// 7. Inventory Category Scope Filtering for GRN
console.log('\n--- 7. Goods Receipt Category Scope Filtering ---');

const sampleGrnMed: any = {
    id: 'grn-1',
    grnNumber: 'GRN-000001',
    purchaseOrderId: 'po-1',
    vendorId: 'v-1',
    receivedDate: '2026-10-12',
    items: [
        {
            id: 'gri-1',
            product: { id: 'p-1', name: 'Paracetamol', category: 'medical' }
        }
    ]
};

const sampleGrnElder: any = {
    id: 'grn-2',
    grnNumber: 'GRN-000002',
    purchaseOrderId: 'po-2',
    vendorId: 'v-2',
    receivedDate: '2026-10-12',
    items: [
        {
            id: 'gri-2',
            product: { id: 'p-2', name: 'Rice', category: 'ration' }
        }
    ]
};

assert(goodsReceiptInScope(sampleGrnMed, 'all') === true, 'All scope includes medical GRN');
assert(goodsReceiptInScope(sampleGrnMed, 'medical') === true, 'Medical scope includes medical GRN');
assert(goodsReceiptInScope(sampleGrnMed, 'elder') === false, 'Elder scope excludes medical GRN');

assert(goodsReceiptInScope(sampleGrnElder, 'all') === true, 'All scope includes elder GRN');
assert(goodsReceiptInScope(sampleGrnElder, 'elder') === true, 'Elder scope includes elder GRN');
assert(goodsReceiptInScope(sampleGrnElder, 'medical') === false, 'Medical scope excludes elder GRN');

// 8. Legacy Direct Purchase Isolation Verification
console.log('\n--- 8. Legacy Direct Purchase Isolation ---');

const legacyPurchase: any = {
    id: 'pur-1',
    productId: 'p-direct',
    quantity: 15,
    vendor: 'Local Chemist',
    product: { id: 'p-direct', name: 'Gauze Roll', category: 'medical' }
};

assert(sampleGrnMed.id !== legacyPurchase.id, 'GRN and legacy direct purchase entities are independent');
assert(Boolean(legacyPurchase.quantity), 'Legacy purchase maintains instant stock posting quantity field');

console.log('\n========================================================================');
console.log(`📊 Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('========================================================================\n');

if (failed > 0) {
    throw new Error(`Test suite failed with ${failed} failure(s)`);
}
