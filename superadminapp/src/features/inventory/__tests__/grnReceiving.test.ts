import {
    validateReceiveGoodsForm,
    buildCreateGRNPayload,
    generateIdempotencyKey,
    type ReceiveGoodsFormState
} from '../grnUtils';
import { getAvailablePOActions } from '../purchaseOrderUtils';

function assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
        throw new Error(message || `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertTrue(actual: boolean, message?: string) {
    if (!actual) {
        throw new Error(message || 'Assertion failed: expected true, got false');
    }
}

function assertFalse(actual: boolean, message?: string) {
    if (actual) {
        throw new Error(message || 'Assertion failed: expected false, got true');
    }
}

let passedTests = 0;
let failedTests = 0;

const runTest = (name: string, fn: () => void) => {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passedTests++;
    } catch (err: unknown) {
        console.error(`❌ FAIL: ${name}`);
        console.error(err);
        failedTests++;
    }
};

console.log('\n--- Running Goods Receipt Note (GRN) Receiving Logic Tests ---\n');

// 1. Eligibility Check based on PO status
runTest('1. Status Eligibility: only ORDERED and PARTIALLY_RECEIVED allow receiving', () => {
    assertTrue(getAvailablePOActions('ORDERED').canReceive, 'ORDERED PO should allow receiving');
    assertTrue(getAvailablePOActions('PARTIALLY_RECEIVED').canReceive, 'PARTIALLY_RECEIVED PO should allow receiving');
    assertFalse(getAvailablePOActions('DRAFT').canReceive, 'DRAFT PO must not allow receiving');
    assertFalse(getAvailablePOActions('COMPLETED').canReceive, 'COMPLETED PO must not allow receiving');
    assertFalse(getAvailablePOActions('CANCELLED').canReceive, 'CANCELLED PO must not allow receiving');
});

// 2. Form Base Validation
runTest('2. validateReceiveGoodsForm: flags missing purchaseOrderId or idempotencyKey', () => {
    const baseForm: ReceiveGoodsFormState = {
        purchaseOrderId: '',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: '',
        items: []
    };
    const res = validateReceiveGoodsForm(baseForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.purchaseOrderId), 'Should error on empty PO ID');
    assertTrue(Boolean(res.errors.idempotencyKey), 'Should error on empty idempotency key');
    assertTrue(Boolean(res.errors.items), 'Should error when no items selected');
});

runTest('3. validateReceiveGoodsForm: flags if zero items are selected', () => {
    const form: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-1',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-1',
                productName: 'Amoxicillin',
                isBatchTracked: false,
                orderedQuantity: 100,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 100,
                receivedQuantity: 50,
                acceptedQuantity: 50,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: false // Not selected
            }
        ]
    };
    const res = validateReceiveGoodsForm(form);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.items));
});

// 3. Physical Invariant Validation: accepted + rejected === received
runTest('4. validateReceiveGoodsForm: enforces accepted + rejected === received invariant', () => {
    const invalidSumForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-2',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-1',
                productName: 'Surgical Gloves',
                isBatchTracked: false,
                orderedQuantity: 50,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 50,
                receivedQuantity: 30,
                acceptedQuantity: 20,
                rejectedQuantity: 5, // 20 + 5 = 25 !== 30
                batchNumber: '',
                expiryDate: '',
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(invalidSumForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_balance), 'Expected balance invariant failure');
});

// 4. Over-Receipt Validation: accepted <= remaining
runTest('5. validateReceiveGoodsForm: flags accepted quantity exceeding remaining quantity', () => {
    const overReceiptForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-3',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-1',
                productName: 'Bandages',
                isBatchTracked: false,
                orderedQuantity: 20,
                previouslyReceivedQuantity: 15,
                remainingQuantity: 5, // Only 5 remaining
                receivedQuantity: 10,
                acceptedQuantity: 10, // Trying to accept 10
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(overReceiptForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_overReceipt), 'Expected over-receipt failure');
});

// 5. Quantity Integers and Negatives
runTest('6. validateReceiveGoodsForm: flags negative, decimal, or zero received quantity', () => {
    const invalidQuantitiesForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-4',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-1',
                productName: 'Saline Solution',
                isBatchTracked: false,
                orderedQuantity: 10,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 10,
                receivedQuantity: 0, // Zero received
                acceptedQuantity: 0,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(invalidQuantitiesForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_received));
});

// 6. Batch Tracking Requirements
runTest('7. validateReceiveGoodsForm: requires batchNumber & expiryDate for batch-tracked items', () => {
    const batchTrackedForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-5',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-med-1',
                productName: 'Insulin Vial',
                isBatchTracked: true, // Batch tracked!
                orderedQuantity: 20,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 20,
                receivedQuantity: 20,
                acceptedQuantity: 20,
                rejectedQuantity: 0,
                batchNumber: '', // Missing
                expiryDate: '', // Missing
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(batchTrackedForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_batchNumber), 'Should require batchNumber');
    assertTrue(Boolean(res.errors.item_0_expiryDate), 'Should require expiryDate');
});

runTest('8. validateReceiveGoodsForm: passes when batch-tracked items have valid batch & expiry', () => {
    const validBatchForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-6',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                productId: 'prod-med-1',
                productName: 'Insulin Vial',
                isBatchTracked: true,
                orderedQuantity: 20,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 20,
                receivedQuantity: 20,
                acceptedQuantity: 18,
                rejectedQuantity: 2,
                batchNumber: 'BATCH-2026-A',
                expiryDate: '2027-12-31',
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(validBatchForm);
    assertTrue(res.isValid, 'Should be valid with complete batch info');
    assertEqual(Object.keys(res.errors).length, 0);
});

// 7. Duplicate Line Item in Receipt Prevention
runTest('9. validateReceiveGoodsForm: flags duplicate purchaseOrderItemId in submission', () => {
    const duplicateLineForm: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-123',
        vendorId: 'vendor-1',
        receivedDate: '2026-10-15',
        idempotencyKey: 'idemp-test-7',
        items: [
            {
                purchaseOrderItemId: 'poi-dup',
                productId: 'prod-1',
                productName: 'Gauze Pad',
                isBatchTracked: false,
                orderedQuantity: 10,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 10,
                receivedQuantity: 5,
                acceptedQuantity: 5,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: true
            },
            {
                purchaseOrderItemId: 'poi-dup', // Duplicate line reference
                productId: 'prod-1',
                productName: 'Gauze Pad',
                isBatchTracked: false,
                orderedQuantity: 10,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 10,
                receivedQuantity: 5,
                acceptedQuantity: 5,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: true
            }
        ]
    };
    const res = validateReceiveGoodsForm(duplicateLineForm);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_1_duplicate));
});

// 8. Payload Construction & Idempotency Key Serialization
runTest('10. buildCreateGRNPayload: correctly transforms form state into backend contract', () => {
    const key = generateIdempotencyKey();
    assertTrue(key.length > 10, 'Generated idempotency key should be non-trivial');

    const form: ReceiveGoodsFormState = {
        purchaseOrderId: 'po-789',
        vendorId: '  vendor-med-42  ',
        receivedDate: '2026-10-15',
        deliveryChallanNo: '  DC-9901  ',
        supplierInvoiceNo: '  INV-8822  ',
        notes: '  Fragile clinical delivery  ',
        idempotencyKey: key,
        items: [
            {
                purchaseOrderItemId: 'poi-101',
                productId: 'prod-paracetamol',
                productName: 'Paracetamol 500mg',
                isBatchTracked: true,
                orderedQuantity: 100,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 100,
                receivedQuantity: 50,
                acceptedQuantity: 48,
                rejectedQuantity: 2,
                batchNumber: '  PCM-445  ',
                expiryDate: '2028-06-30',
                notes: '  2 bottles cracked  ',
                selected: true
            },
            {
                purchaseOrderItemId: 'poi-102',
                productId: 'prod-unselected',
                productName: 'Unselected Item',
                isBatchTracked: false,
                orderedQuantity: 20,
                previouslyReceivedQuantity: 0,
                remainingQuantity: 20,
                receivedQuantity: 0,
                acceptedQuantity: 0,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                selected: false // Not selected, must not appear in payload
            }
        ]
    };

    const payload = buildCreateGRNPayload(form);
    assertEqual(payload.idempotencyKey, key);
    assertEqual(payload.vendorId, 'vendor-med-42');
    assertEqual(payload.deliveryChallanNo, 'DC-9901');
    assertEqual(payload.supplierInvoiceNo, 'INV-8822');
    assertEqual(payload.notes, 'Fragile clinical delivery');
    assertEqual(payload.items.length, 1, 'Only selected items should be in payload');

    const item0 = payload.items[0];
    assertEqual(item0.purchaseOrderItemId, 'poi-101');
    assertEqual(item0.receivedQuantity, 50);
    assertEqual(item0.acceptedQuantity, 48);
    assertEqual(item0.rejectedQuantity, 2);
    assertEqual(item0.batchNumber, 'PCM-445');
    assertEqual(item0.expiryDate, '2028-06-30');
    assertEqual(item0.notes, '2 bottles cracked');
});

console.log(`\n--- GRN Receiving Logic Test Results: ${passedTests} Passed, ${failedTests} Failed ---\n`);

if (failedTests > 0) {
    throw new Error(`${failedTests} test(s) failed`);
}
