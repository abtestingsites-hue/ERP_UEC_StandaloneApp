import {
    validateSupplierReturnForm,
    buildCreateSupplierReturnPayload,
    isMeaningfulReturnReason,
    generateReturnIdempotencyKey,
    type CreateSupplierReturnFormState
} from '../supplierReturnUtils';

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

console.log('\n--- Running Supplier Returns Logic & Invariant Tests ---\n');

// 1. Meaningful Return Reason Tests
runTest('1. isMeaningfulReturnReason: enforces minimum 5 characters and rejects placeholder values', () => {
    assertFalse(isMeaningfulReturnReason(''));
    assertFalse(isMeaningfulReturnReason('bad'));
    assertFalse(isMeaningfulReturnReason('   '));
    // Disallowed placeholders
    assertFalse(isMeaningfulReturnReason('none'));
    assertFalse(isMeaningfulReturnReason('n/a'));
    assertFalse(isMeaningfulReturnReason('test'));
    assertFalse(isMeaningfulReturnReason('null'));
    assertFalse(isMeaningfulReturnReason('undefined'));
    assertFalse(isMeaningfulReturnReason('no reason'));
    assertFalse(isMeaningfulReturnReason('asdf'));
    assertFalse(isMeaningfulReturnReason('blank'));

    // Valid reasons
    assertTrue(isMeaningfulReturnReason('Damaged packaging during transit'));
    assertTrue(isMeaningfulReturnReason('Batch recalled by vendor due to quality failure'));
    assertTrue(isMeaningfulReturnReason('Expired medicine delivered'));
});

// 2. Base Form Validation: Vendor, Reason, Idempotency
runTest('2. validateSupplierReturnForm: flags missing vendor, reason, or idempotency key', () => {
    const invalidBase: CreateSupplierReturnFormState = {
        vendorId: '   ',
        sourceType: 'DIRECT',
        returnDate: '2026-10-15',
        reason: 'none',
        idempotencyKey: '',
        items: []
    };
    const res = validateSupplierReturnForm(invalidBase);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.vendorId), 'Should require vendorId');
    assertTrue(Boolean(res.errors.reason), 'Should flag non-meaningful reason');
    assertTrue(Boolean(res.errors.idempotencyKey), 'Should require idempotencyKey');
    assertTrue(Boolean(res.errors.items), 'Should error on zero items');
});

// 3. Source Reference Enforcement
runTest('3. validateSupplierReturnForm: requires sourceReferenceId for GRN and PURCHASE sources', () => {
    const grnMissingRef: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'GRN',
        sourceReferenceId: '',
        returnDate: '2026-10-15',
        reason: 'Goods arrived damaged in shipment',
        idempotencyKey: 'idemp-1',
        items: [
            {
                productId: 'prod-1',
                productName: 'Bandage',
                isBatchTracked: false,
                availableStock: 50,
                returnableBalance: 20,
                returnQuantity: 5,
                selected: true
            }
        ]
    };
    const resGRN = validateSupplierReturnForm(grnMissingRef);
    assertFalse(resGRN.isValid);
    assertTrue(Boolean(resGRN.errors.sourceReferenceId), 'GRN source must have sourceReferenceId');

    const purchaseMissingRef: CreateSupplierReturnFormState = {
        ...grnMissingRef,
        sourceType: 'PURCHASE',
        sourceReferenceId: '   '
    };
    const resPO = validateSupplierReturnForm(purchaseMissingRef);
    assertFalse(resPO.isValid);
    assertTrue(Boolean(resPO.errors.sourceReferenceId), 'Purchase source must have sourceReferenceId');
});

// 4. Return Quantity Validations: Positive Integer, Available Stock, Returnable Balance
runTest('4. validateSupplierReturnForm: flags non-positive or non-integer return quantities', () => {
    const nonPositive: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'DIRECT',
        returnDate: '2026-10-15',
        reason: 'Overstock reversal to supplier',
        idempotencyKey: 'idemp-qty-1',
        items: [
            {
                productId: 'prod-1',
                productName: 'Gauze Pad',
                isBatchTracked: false,
                availableStock: 100,
                returnQuantity: 0, // Invalid: zero
                selected: true
            }
        ]
    };
    const resZero = validateSupplierReturnForm(nonPositive);
    assertFalse(resZero.isValid);
    assertTrue(Boolean(resZero.errors.item_0_quantity));

    const decimalForm: CreateSupplierReturnFormState = {
        ...nonPositive,
        items: [{ ...nonPositive.items[0], returnQuantity: 2.5 }]
    };
    const resDecimal = validateSupplierReturnForm(decimalForm);
    assertFalse(resDecimal.isValid);
    assertTrue(Boolean(resDecimal.errors.item_0_quantity));
});

runTest('5. validateSupplierReturnForm: flags return quantity exceeding available on-hand stock', () => {
    const excessStock: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'DIRECT',
        returnDate: '2026-10-15',
        reason: 'Defective products returned',
        idempotencyKey: 'idemp-stock-1',
        items: [
            {
                productId: 'prod-1',
                productName: 'Syringe 5ml',
                isBatchTracked: false,
                availableStock: 10, // Only 10 available on hand
                returnQuantity: 25, // Trying to return 25
                selected: true
            }
        ]
    };
    const res = validateSupplierReturnForm(excessStock);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_stock), 'Must fail when returning more than stock on hand');
});

runTest('6. validateSupplierReturnForm: flags return quantity exceeding returnable balance', () => {
    const excessReturnable: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'GRN',
        sourceReferenceId: 'grn-101',
        returnDate: '2026-10-15',
        reason: 'Recalled lot from manufacturer',
        idempotencyKey: 'idemp-ret-1',
        items: [
            {
                productId: 'prod-1',
                productName: 'Surgical Mask',
                isBatchTracked: false,
                availableStock: 50,
                returnableBalance: 15, // Only 15 originally accepted on this GRN
                returnQuantity: 20, // Trying to return 20 against GRN
                selected: true
            }
        ]
    };
    const res = validateSupplierReturnForm(excessReturnable);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_returnable), 'Must fail when return quantity exceeds GRN returnable balance');
});

// 5. Batch Tracking Requirements
runTest('7. validateSupplierReturnForm: requires batch details for batch-tracked products', () => {
    const missingBatch: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'DIRECT',
        returnDate: '2026-10-15',
        reason: 'Quality control quarantine rejection',
        idempotencyKey: 'idemp-batch-1',
        items: [
            {
                productId: 'prod-pharma-1',
                productName: 'Amoxicillin 500mg',
                isBatchTracked: true, // Batch tracked!
                batchId: null,
                batchNumber: '', // Missing batch
                availableStock: 100,
                returnQuantity: 10,
                selected: true
            }
        ]
    };
    const res = validateSupplierReturnForm(missingBatch);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_0_batch), 'Must require batch details for batch-tracked items');
});

// 6. Duplicate Product/Batch Line Prevention
runTest('8. validateSupplierReturnForm: detects duplicate product and batch entries', () => {
    const duplicateLines: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'DIRECT',
        returnDate: '2026-10-15',
        reason: 'Consignment return to supplier',
        idempotencyKey: 'idemp-dup-1',
        items: [
            {
                productId: 'prod-1',
                productName: 'Cotton Roll',
                isBatchTracked: false,
                availableStock: 50,
                returnQuantity: 5,
                selected: true
            },
            {
                productId: 'prod-1', // Duplicate product without batch
                productName: 'Cotton Roll',
                isBatchTracked: false,
                availableStock: 50,
                returnQuantity: 10,
                selected: true
            }
        ]
    };
    const res = validateSupplierReturnForm(duplicateLines);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_1_duplicate));
});

// 7. Successful Validation on Valid State
runTest('9. validateSupplierReturnForm: passes on compliant multi-item return state', () => {
    const validForm: CreateSupplierReturnFormState = {
        vendorId: 'vendor-1',
        sourceType: 'GRN',
        sourceReferenceId: 'grn-500',
        returnDate: '2026-10-15',
        reason: 'Batch contaminated in transit prior to delivery',
        notes: 'Vendor RMA #8841-B',
        idempotencyKey: 'idemp-valid-1',
        items: [
            {
                productId: 'prod-med-1',
                productName: 'IV Saline 500ml',
                isBatchTracked: true,
                batchId: 'batch-99',
                batchNumber: 'LOT-9921',
                expiryDate: '2028-12-31',
                availableStock: 100,
                returnableBalance: 40,
                returnQuantity: 20,
                reason: 'Leakage in seal',
                goodsReceiptItemId: 'gri-1',
                selected: true
            },
            {
                productId: 'prod-med-2',
                productName: 'Latex Gloves',
                isBatchTracked: false,
                availableStock: 200,
                returnableBalance: 50,
                returnQuantity: 15,
                goodsReceiptItemId: 'gri-2',
                selected: true
            }
        ]
    };
    const res = validateSupplierReturnForm(validForm);
    assertTrue(res.isValid);
    assertEqual(Object.keys(res.errors).length, 0);
});

// 8. Payload Construction & Idempotency Key Serialization
runTest('10. buildCreateSupplierReturnPayload: formats payload strictly according to backend contract', () => {
    const key = generateReturnIdempotencyKey();
    assertTrue(key.startsWith('ret-idemp-') || key.length >= 10);

    const form: CreateSupplierReturnFormState = {
        vendorId: '  vendor-abc  ',
        sourceType: 'GRN',
        sourceReferenceId: '  grn-777  ',
        returnDate: '2026-10-15',
        reason: '  Defective vial seals confirmed by QC lab  ',
        notes: '  Forwarded to vendor logistics agent  ',
        idempotencyKey: key,
        items: [
            {
                productId: '  prod-10  ',
                productName: 'Product 10',
                isBatchTracked: true,
                batchId: '  batch-10-a  ',
                batchNumber: '  LOT-10  ',
                availableStock: 50,
                returnQuantity: 12,
                reason: '  Seal cracked  ',
                goodsReceiptItemId: '  gri-10  ',
                selected: true
            },
            {
                productId: 'prod-unselected',
                productName: 'Unselected',
                isBatchTracked: false,
                availableStock: 50,
                returnQuantity: 0,
                selected: false // Should be omitted from payload
            }
        ]
    };

    const payload = buildCreateSupplierReturnPayload(form);
    assertEqual(payload.vendorId, 'vendor-abc');
    assertEqual(payload.sourceType, 'GRN');
    assertEqual(payload.sourceReferenceId, 'grn-777');
    assertEqual(payload.returnDate, '2026-10-15');
    assertEqual(payload.reason, 'Defective vial seals confirmed by QC lab');
    assertEqual(payload.notes, 'Forwarded to vendor logistics agent');
    assertEqual(payload.idempotencyKey, key);
    assertEqual(payload.items.length, 1);

    const item0 = payload.items[0];
    assertEqual(item0.productId, 'prod-10');
    assertEqual(item0.batchId, 'batch-10-a');
    assertEqual(item0.batchNumber, 'LOT-10');
    assertEqual(item0.returnQuantity, 12);
    assertEqual(item0.reason, 'Seal cracked');
    assertEqual(item0.goodsReceiptItemId, 'gri-10');
});

console.log(`\n--- Supplier Returns Logic Test Results: ${passedTests} Passed, ${failedTests} Failed ---\n`);

if (failedTests > 0) {
    throw new Error(`${failedTests} test(s) failed`);
}
