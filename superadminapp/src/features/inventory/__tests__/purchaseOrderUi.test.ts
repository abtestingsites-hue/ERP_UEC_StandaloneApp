import {
    validatePurchaseOrderForm,
    buildCreatePOPayload,
    buildUpdatePOPayload,
    getAvailablePOActions,
    type PurchaseOrderFormState
} from '../purchaseOrderUtils';

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

console.log('\n--- Running Purchase Order UI & Form Validation Tests ---\n');

// 1. Form Validation Tests
runTest('1. validatePurchaseOrderForm: flags missing vendorId', () => {
    const form: PurchaseOrderFormState = {
        vendorId: '   ',
        items: [{ productId: 'prod-1', orderedQuantity: 5 }]
    };
    const res = validatePurchaseOrderForm(form);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.vendorId));
});

runTest('2. validatePurchaseOrderForm: flags empty line items array', () => {
    const form: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: []
    };
    const res = validatePurchaseOrderForm(form);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.items));
});

runTest('3. validatePurchaseOrderForm: flags missing productId on line item', () => {
    const form: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: [
            { productId: 'prod-1', orderedQuantity: 10 },
            { productId: '', orderedQuantity: 5 }
        ]
    };
    const res = validatePurchaseOrderForm(form);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_1_product));
});

runTest('4. validatePurchaseOrderForm: flags non-positive or non-integer quantities', () => {
    const formZero: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: [{ productId: 'prod-1', orderedQuantity: 0 }]
    };
    const resZero = validatePurchaseOrderForm(formZero);
    assertFalse(resZero.isValid);
    assertTrue(Boolean(resZero.errors.item_0_quantity));

    const formNegative: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: [{ productId: 'prod-1', orderedQuantity: -10 }]
    };
    const resNeg = validatePurchaseOrderForm(formNegative);
    assertFalse(resNeg.isValid);
    assertTrue(Boolean(resNeg.errors.item_0_quantity));

    const formDecimal: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: [{ productId: 'prod-1', orderedQuantity: 2.5 }]
    };
    const resDecimal = validatePurchaseOrderForm(formDecimal);
    assertFalse(resDecimal.isValid);
    assertTrue(Boolean(resDecimal.errors.item_0_quantity));
});

runTest('5. validatePurchaseOrderForm: detects duplicate products across line items', () => {
    const form: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        items: [
            { productId: 'prod-same', orderedQuantity: 10 },
            { productId: 'prod-different', orderedQuantity: 5 },
            { productId: 'prod-same', orderedQuantity: 20 }
        ]
    };
    const res = validatePurchaseOrderForm(form);
    assertFalse(res.isValid);
    assertTrue(Boolean(res.errors.item_2_duplicate));
});

runTest('6. validatePurchaseOrderForm: succeeds with valid multi-item entries', () => {
    const form: PurchaseOrderFormState = {
        vendorId: 'vendor-1',
        orderDate: '2026-10-15',
        expectedDeliveryDate: '2026-10-25',
        notes: 'Clinical priority',
        items: [
            { productId: 'prod-1', orderedQuantity: 100, notes: 'Boxes of 10' },
            { productId: 'prod-2', orderedQuantity: 50 }
        ]
    };
    const res = validatePurchaseOrderForm(form);
    assertTrue(res.isValid);
    assertEqual(Object.keys(res.errors).length, 0);
});

// 2. Payload Construction Tests
runTest('7. buildCreatePOPayload: correctly serializes and trims fields', () => {
    const form: PurchaseOrderFormState = {
        vendorId: '  vendor-abc  ',
        orderDate: '2026-10-15',
        expectedDeliveryDate: '2026-10-30',
        notes: '   Handle with care   ',
        items: [
            { productId: '  prod-1  ', orderedQuantity: 10, notes: '  Item note  ' }
        ]
    };
    const payload = buildCreatePOPayload(form);
    assertEqual(payload.vendorId, 'vendor-abc');
    assertEqual(payload.orderDate, '2026-10-15');
    assertEqual(payload.expectedDeliveryDate, '2026-10-30');
    assertEqual(payload.notes, 'Handle with care');
    assertEqual(payload.items.length, 1);
    assertEqual(payload.items[0].productId, 'prod-1');
    assertEqual(payload.items[0].orderedQuantity, 10);
    assertEqual(payload.items[0].notes, 'Item note');
});

runTest('8. buildUpdatePOPayload: handles partial dates and empty notes', () => {
    const form: PurchaseOrderFormState = {
        vendorId: 'vendor-xyz',
        notes: '',
        items: [{ productId: 'prod-1', orderedQuantity: 25 }]
    };
    const payload = buildUpdatePOPayload(form);
    assertEqual(payload.vendorId, 'vendor-xyz');
    assertEqual(payload.expectedDeliveryDate, null);
    assertEqual(payload.notes, null);
    assertEqual(payload.items?.length, 1);
});

// 3. Status Action Permissibility Tests
runTest('9. getAvailablePOActions: correctly enforces action boundaries per status', () => {
    // DRAFT
    const draft = getAvailablePOActions('DRAFT');
    assertTrue(draft.canEdit, 'Draft should be editable');
    assertTrue(draft.canOrder, 'Draft should be orderable');
    assertTrue(draft.canCancel, 'Draft should be cancellable');
    assertFalse(draft.canReceive, 'Draft cannot be received');

    // ORDERED
    const ordered = getAvailablePOActions('ORDERED');
    assertFalse(ordered.canEdit, 'Ordered order cannot be edited');
    assertFalse(ordered.canOrder, 'Already ordered');
    assertTrue(ordered.canCancel, 'Ordered order can still be cancelled if no receipt');
    assertTrue(ordered.canReceive, 'Ordered order is eligible for delivery intake');

    // PARTIALLY_RECEIVED
    const partial = getAvailablePOActions('PARTIALLY_RECEIVED');
    assertFalse(partial.canEdit, 'Partially received order cannot be edited');
    assertFalse(partial.canOrder, 'Partially received order cannot be re-ordered');
    assertFalse(partial.canCancel, 'Partially received order cannot be cancelled');
    assertTrue(partial.canReceive, 'Partially received order remains eligible for further intake');

    // COMPLETED
    const completed = getAvailablePOActions('COMPLETED');
    assertFalse(completed.canEdit);
    assertFalse(completed.canOrder);
    assertFalse(completed.canCancel);
    assertFalse(completed.canReceive);

    // CANCELLED
    const cancelled = getAvailablePOActions('CANCELLED');
    assertFalse(cancelled.canEdit);
    assertFalse(cancelled.canOrder);
    assertFalse(cancelled.canCancel);
    assertFalse(cancelled.canReceive);
});

console.log(`\n--- UI Logic Test Results: ${passedTests} Passed, ${failedTests} Failed ---\n`);

if (failedTests > 0) {
    throw new Error(`${failedTests} test(s) failed`);
}
