import { purchaseOrderInScope } from '../features/inventory/utils/inventoryScope.js';
import type { PurchaseOrder, CreatePurchaseOrderPayload, UpdatePurchaseOrderPayload } from '../features/inventory/types/index.js';

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

interface FormLineItem {
    id: string;
    productId: string;
    quantity: number | string;
    notes?: string;
}

interface FormState {
    vendorId: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: FormLineItem[];
}

/**
 * Validates the multi-item Purchase Order creation/editing form
 * mirroring the exact validation rules implemented in PurchaseOrdersPage.tsx
 */
function validatePurchaseOrderForm(form: FormState, productNamesById: Record<string, string> = {}): ValidationResult {
    if (!form.vendorId || !form.vendorId.trim()) {
        return { isValid: false, error: 'Vendor is required' };
    }

    if (!form.items || form.items.length === 0) {
        return { isValid: false, error: 'At least one product line is required' };
    }

    const seenProductIds = new Set<string>();

    for (let i = 0; i < form.items.length; i++) {
        const item = form.items[i];
        if (!item.productId || !item.productId.trim()) {
            return { isValid: false, error: `Please select a product for line ${i + 1}` };
        }

        if (seenProductIds.has(item.productId)) {
            const name = productNamesById[item.productId] || item.productId;
            return {
                isValid: false,
                error: `Duplicate product detected: "${name}". Each product can only be added once per purchase order.`
            };
        }
        seenProductIds.add(item.productId);

        const qtyNum = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
        if (isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
            return {
                isValid: false,
                error: `Line ${i + 1}: Quantity must be a positive whole number greater than 0`
            };
        }
    }

    return { isValid: true };
}

/**
 * Builds the API payload from the validated form state
 */
function buildCreatePayload(form: FormState): CreatePurchaseOrderPayload {
    return {
        vendorId: form.vendorId.trim(),
        expectedDeliveryDate: form.expectedDeliveryDate ? form.expectedDeliveryDate : undefined,
        notes: form.notes?.trim() ? form.notes.trim() : undefined,
        items: form.items.map(item => ({
            productId: item.productId,
            orderedQuantity: typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity), 10),
            notes: item.notes?.trim() ? item.notes.trim() : undefined,
        })),
    };
}

/**
 * Lifecycle action eligibility helpers
 */
function getActionPermissions(status: PurchaseOrder['status']) {
    return {
        canEdit: status === 'DRAFT',
        canOrder: status === 'DRAFT',
        canCancel: status !== 'CANCELLED' && status !== 'COMPLETED',
        canReceive: status === 'ORDERED' || status === 'PARTIALLY_RECEIVED',
    };
}

// Test Suite Runner
let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passedCount++;
    } else {
        console.error(`  ❌ [FAIL] ${testName}${failureDetails ? ` - ${failureDetails}` : ''}`);
        failedCount++;
    }
}

console.log('========================================================================');
console.log('🧪 InventoryApp D8.4 — Multi-Item PO UI & Lifecycle Validation Suite');
console.log('========================================================================\n');

// 1. Form Validation Tests
console.log('--- 1. Multi-Item PO Form Validation ---');

const emptyVendorForm: FormState = {
    vendorId: '',
    items: [{ id: '1', productId: 'p1', quantity: 10 }]
};
const res1 = validatePurchaseOrderForm(emptyVendorForm);
assert(!res1.isValid && res1.error === 'Vendor is required', 'Rejects empty vendor');

const whitespaceVendorForm: FormState = {
    vendorId: '   ',
    items: [{ id: '1', productId: 'p1', quantity: 10 }]
};
const res2 = validatePurchaseOrderForm(whitespaceVendorForm);
assert(!res2.isValid && res2.error === 'Vendor is required', 'Rejects whitespace vendor');

const emptyItemsForm: FormState = {
    vendorId: 'vendor-1',
    items: []
};
const res3 = validatePurchaseOrderForm(emptyItemsForm);
assert(!res3.isValid && res3.error === 'At least one product line is required', 'Rejects empty items array');

const unselectedProductForm: FormState = {
    vendorId: 'vendor-1',
    items: [{ id: '1', productId: '', quantity: 10 }]
};
const res4 = validatePurchaseOrderForm(unselectedProductForm);
assert(!res4.isValid && res4.error?.includes('select a product for line 1') === true, 'Rejects unselected product');

const zeroQtyForm: FormState = {
    vendorId: 'vendor-1',
    items: [{ id: '1', productId: 'p1', quantity: 0 }]
};
const res5 = validatePurchaseOrderForm(zeroQtyForm);
assert(!res5.isValid && res5.error?.includes('positive whole number') === true, 'Rejects zero quantity');

const negativeQtyForm: FormState = {
    vendorId: 'vendor-1',
    items: [{ id: '1', productId: 'p1', quantity: -5 }]
};
const res6 = validatePurchaseOrderForm(negativeQtyForm);
assert(!res6.isValid && res6.error?.includes('positive whole number') === true, 'Rejects negative quantity');

const decimalQtyForm: FormState = {
    vendorId: 'vendor-1',
    items: [{ id: '1', productId: 'p1', quantity: 12.5 }]
};
const res7 = validatePurchaseOrderForm(decimalQtyForm);
assert(!res7.isValid && res7.error?.includes('positive whole number') === true, 'Rejects decimal quantity');

const nonNumericQtyForm: FormState = {
    vendorId: 'vendor-1',
    items: [{ id: '1', productId: 'p1', quantity: 'abc' }]
};
const res8 = validatePurchaseOrderForm(nonNumericQtyForm);
assert(!res8.isValid && res8.error?.includes('positive whole number') === true, 'Rejects non-numeric string quantity');

const duplicateProductForm: FormState = {
    vendorId: 'vendor-1',
    items: [
        { id: '1', productId: 'p1', quantity: 10 },
        { id: '2', productId: 'p2', quantity: 20 },
        { id: '3', productId: 'p1', quantity: 5 },
    ]
};
const res9 = validatePurchaseOrderForm(duplicateProductForm, { p1: 'Paracetamol 500mg' });
assert(!res9.isValid && res9.error?.includes('Duplicate product detected: "Paracetamol 500mg"') === true, 'Detects and flags duplicate products in line items');

const validMultiItemForm: FormState = {
    vendorId: 'vendor-123',
    expectedDeliveryDate: '2026-11-01',
    notes: 'Urgent restocking',
    items: [
        { id: '1', productId: 'prod-A', quantity: 25 },
        { id: '2', productId: 'prod-B', quantity: 50, notes: 'Pack of 10' },
    ]
};
const res10 = validatePurchaseOrderForm(validMultiItemForm);
assert(res10.isValid, 'Accepts valid multi-item order with distinct products and integer quantities');

const payload = buildCreatePayload(validMultiItemForm);
assert(payload.vendorId === 'vendor-123', 'Builds payload with correct vendorId');
assert(payload.expectedDeliveryDate === '2026-11-01', 'Builds payload with expectedDeliveryDate');
assert(payload.notes === 'Urgent restocking', 'Builds payload with notes');
assert(payload.items.length === 2, 'Builds payload with 2 line items');
assert(payload.items[0].orderedQuantity === 25 && payload.items[1].orderedQuantity === 50, 'Builds payload with correct parsed quantities');

// 2. Lifecycle Permissions Tests
console.log('\n--- 2. Lifecycle Action Rules & Permissions ---');

const draftPerms = getActionPermissions('DRAFT');
assert(draftPerms.canEdit === true, 'DRAFT allows editing');
assert(draftPerms.canOrder === true, 'DRAFT allows ordering');
assert(draftPerms.canCancel === true, 'DRAFT allows cancellation');
assert(draftPerms.canReceive === false, 'DRAFT does not allow goods receipt');

const orderedPerms = getActionPermissions('ORDERED');
assert(orderedPerms.canEdit === false, 'ORDERED disallows editing');
assert(orderedPerms.canOrder === false, 'ORDERED disallows re-ordering');
assert(orderedPerms.canCancel === true, 'ORDERED allows cancellation');
assert(orderedPerms.canReceive === true, 'ORDERED allows goods receipt');

const partialPerms = getActionPermissions('PARTIALLY_RECEIVED');
assert(partialPerms.canEdit === false, 'PARTIALLY_RECEIVED disallows editing');
assert(partialPerms.canOrder === false, 'PARTIALLY_RECEIVED disallows ordering');
assert(partialPerms.canCancel === true, 'PARTIALLY_RECEIVED allows cancellation of remaining quantity');
assert(partialPerms.canReceive === true, 'PARTIALLY_RECEIVED allows receiving outstanding balance');

const completedPerms = getActionPermissions('COMPLETED');
assert(completedPerms.canEdit === false, 'COMPLETED disallows editing');
assert(completedPerms.canOrder === false, 'COMPLETED disallows ordering');
assert(completedPerms.canCancel === false, 'COMPLETED disallows cancellation');
assert(completedPerms.canReceive === false, 'COMPLETED disallows receiving');

const cancelledPerms = getActionPermissions('CANCELLED');
assert(cancelledPerms.canEdit === false, 'CANCELLED disallows editing');
assert(cancelledPerms.canOrder === false, 'CANCELLED disallows ordering');
assert(cancelledPerms.canCancel === false, 'CANCELLED disallows cancellation');
assert(cancelledPerms.canReceive === false, 'CANCELLED disallows receiving');

// 3. Category InventoryScope Filter Tests
console.log('\n--- 3. Inventory Category Scope Filtering ---');

const medicalPO: PurchaseOrder = {
    id: 'po-med',
    orderNumber: 'PO-000001',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    vendorId: 'vendor-1',
    status: 'DRAFT',
    orderDate: new Date().toISOString(),
    vendor: { id: 'vendor-1', name: 'Med Supplies', status: 'ACTIVE' } as any,
    itemCount: 1,
    totalOrderedQuantity: 50,
    totalReceivedQuantity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
        {
            id: 'poi-1',
            purchaseOrderId: 'po-med',
            productId: 'p-med',
            orderedQuantity: 50,
            receivedQuantity: 0,
            status: 'PENDING',
            product: {
                id: 'p-med',
                name: 'Paracetamol 500mg',
                category: 'medical',
            } as any
        }
    ]
};

const elderPO: PurchaseOrder = {
    id: 'po-elder',
    orderNumber: 'PO-000002',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    vendorId: 'vendor-1',
    status: 'DRAFT',
    orderDate: new Date().toISOString(),
    vendor: { id: 'vendor-1', name: 'Elder Mart', status: 'ACTIVE' } as any,
    itemCount: 1,
    totalOrderedQuantity: 20,
    totalReceivedQuantity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
        {
            id: 'poi-2',
            purchaseOrderId: 'po-elder',
            productId: 'p-elder',
            orderedQuantity: 20,
            receivedQuantity: 0,
            status: 'PENDING',
            product: {
                id: 'p-elder',
                name: 'Rice 25kg Bag',
                category: 'ration',
            } as any
        }
    ]
};

assert(purchaseOrderInScope(medicalPO, 'all') === true, 'All scope includes medical PO');
assert(purchaseOrderInScope(medicalPO, 'medical') === true, 'Medical scope includes medical PO');
assert(purchaseOrderInScope(medicalPO, 'elder') === false, 'Elder scope excludes medical PO');

assert(purchaseOrderInScope(elderPO, 'all') === true, 'All scope includes elder PO');
assert(purchaseOrderInScope(elderPO, 'elder') === true, 'Elder scope includes elder PO');
assert(purchaseOrderInScope(elderPO, 'medical') === false, 'Medical scope excludes elder PO');

const noItemsPO: PurchaseOrder = {
    ...medicalPO,
    items: []
};
assert(purchaseOrderInScope(noItemsPO, 'medical') === true, 'PO with empty/unloaded items defaults to visible in scope');

// 4. Cancellation Reason Requirement
console.log('\n--- 4. Cancellation Reason Enforcement ---');

function validateCancellationReason(reason: string): boolean {
    return Boolean(reason && reason.trim().length >= 3);
}

assert(validateCancellationReason('') === false, 'Rejects empty cancellation reason');
assert(validateCancellationReason('  ') === false, 'Rejects whitespace cancellation reason');
assert(validateCancellationReason('no') === false, 'Rejects cancellation reason shorter than 3 characters');
assert(validateCancellationReason('Vendor cannot fulfill order') === true, 'Accepts valid cancellation reason');

console.log('\n========================================================================');
console.log(`📊 Test Summary: Total: ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
console.log('========================================================================\n');

if (failedCount > 0) {
    throw new Error(`Test suite failed with ${failedCount} failures.`);
}
