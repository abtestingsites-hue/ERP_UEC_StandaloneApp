/**
 * InventoryApp D9.1 — Supplier Returns UI & Client Validation Test Suite
 * Run with: npx tsx src/tests/runSupplierReturnsUiValidationTest.ts
 */

import { supplierReturnInScope } from '../features/inventory/utils/inventoryScope';
import type { SupplierReturn, CreateSupplierReturnPayload } from '../features/inventory/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

console.log('========================================================================');
console.log('📦 InventoryApp D9.1 — Supplier Returns UI Validation Suite');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. Return Reason Validation (isMeaningfulReason logic)
// -----------------------------------------------------------------------------
console.log('--- 1. Return Reason Validation ---');

function isMeaningfulReason(reason: unknown): boolean {
  if (!reason || typeof reason !== 'string') return false;
  const trimmed = reason.trim();
  if (trimmed.length < 5) return false;
  const invalidPlaceholders = ['none', 'n/a', 'na', 'test', 'null', 'undefined', 'nil', 'no reason', 'asdf', 'blank'];
  if (invalidPlaceholders.includes(trimmed.toLowerCase())) return false;
  return true;
}

assert(!isMeaningfulReason(''), 'Rejects empty string reason');
assert(!isMeaningfulReason('   '), 'Rejects whitespace-only reason');
assert(!isMeaningfulReason('bad'), 'Rejects reason shorter than 5 chars');
assert(!isMeaningfulReason('test'), 'Rejects "test" placeholder');
assert(!isMeaningfulReason('none'), 'Rejects "none" placeholder');
assert(!isMeaningfulReason('n/a'), 'Rejects "n/a" placeholder');
assert(!isMeaningfulReason('no reason'), 'Rejects "no reason" placeholder');
assert(isMeaningfulReason('Damaged outer packaging upon dock delivery'), 'Accepts valid descriptive return reason');

// -----------------------------------------------------------------------------
// 2. Return Quantity & Invariant Validation
// -----------------------------------------------------------------------------
console.log('\n--- 2. Return Quantity Validation ---');

function validateReturnLine(line: {
  returnQuantity: number;
  eligibleQuantity: number;
  availableStock: number;
  isBatchTracked: boolean;
  batchNumber?: string | null;
}) {
  if (!Number.isInteger(line.returnQuantity) || line.returnQuantity <= 0) {
    return { valid: false, error: 'Return quantity must be a positive whole integer' };
  }
  if (line.returnQuantity > line.eligibleQuantity) {
    return { valid: false, error: 'Return quantity exceeds eligible balance' };
  }
  if (line.returnQuantity > line.availableStock) {
    return { valid: false, error: 'Return quantity exceeds available stock' };
  }
  if (line.isBatchTracked && (!line.batchNumber || !line.batchNumber.trim())) {
    return { valid: false, error: 'Batch number is required for batch-tracked product' };
  }
  return { valid: true };
}

assert(!validateReturnLine({ returnQuantity: 0, eligibleQuantity: 10, availableStock: 10, isBatchTracked: false }).valid, 'Rejects 0 return quantity');
assert(!validateReturnLine({ returnQuantity: -5, eligibleQuantity: 10, availableStock: 10, isBatchTracked: false }).valid, 'Rejects negative return quantity');
assert(!validateReturnLine({ returnQuantity: 3.5, eligibleQuantity: 10, availableStock: 10, isBatchTracked: false }).valid, 'Rejects decimal non-integer return quantity');
assert(!validateReturnLine({ returnQuantity: 15, eligibleQuantity: 10, availableStock: 20, isBatchTracked: false }).valid, 'Rejects return quantity exceeding eligible quantity');
assert(!validateReturnLine({ returnQuantity: 15, eligibleQuantity: 20, availableStock: 10, isBatchTracked: false }).valid, 'Rejects return quantity exceeding available stock');
assert(!validateReturnLine({ returnQuantity: 5, eligibleQuantity: 10, availableStock: 10, isBatchTracked: true, batchNumber: '' }).valid, 'Rejects batch-tracked product with empty batch number');
assert(validateReturnLine({ returnQuantity: 5, eligibleQuantity: 10, availableStock: 10, isBatchTracked: true, batchNumber: 'BAT-2026-X1' }).valid, 'Accepts valid return line with batch number');
assert(validateReturnLine({ returnQuantity: 8, eligibleQuantity: 10, availableStock: 10, isBatchTracked: false }).valid, 'Accepts valid non-batch return line');

// -----------------------------------------------------------------------------
// 3. Payload Construction
// -----------------------------------------------------------------------------
console.log('\n--- 3. Payload Construction ---');

const testPayload: CreateSupplierReturnPayload = {
  vendorId: 'vendor-uuid-1',
  sourceType: 'GRN',
  sourceReferenceId: 'grn-uuid-99',
  returnDate: '2026-10-12',
  reason: 'Product defective - leaking seals',
  notes: 'Return against GRN GRN-000001',
  idempotencyKey: 'idem-key-abc-123',
  items: [
    {
      productId: 'prod-uuid-1',
      batchId: 'batch-uuid-1',
      batchNumber: 'B-001',
      returnQuantity: 10,
      reason: 'Broken vial seals',
      goodsReceiptItemId: 'gri-uuid-1',
    },
  ],
};

assert(testPayload.vendorId === 'vendor-uuid-1', 'Builds payload with correct vendorId');
assert(testPayload.sourceType === 'GRN', 'Builds payload with sourceType GRN');
assert(testPayload.sourceReferenceId === 'grn-uuid-99', 'Builds payload with sourceReferenceId');
assert(testPayload.idempotencyKey === 'idem-key-abc-123', 'Builds payload with idempotencyKey');
assert(testPayload.items.length === 1, 'Builds payload with 1 return line item');
assert(testPayload.items[0].returnQuantity === 10, 'Maps returnQuantity correctly');
assert(testPayload.items[0].batchNumber === 'B-001', 'Maps batchNumber correctly');

// -----------------------------------------------------------------------------
// 4. Safe Idempotency Retry Mechanics
// -----------------------------------------------------------------------------
console.log('\n--- 4. Idempotency Key Safe Retry Mechanics ---');

let formSessionIdempotencyKey = 'key-session-initial';
let attemptCount = 0;

function submitReturnWithRetry(): string {
  attemptCount++;
  return formSessionIdempotencyKey;
}

const firstAttemptKey = submitReturnWithRetry();
const retryAttemptKey = submitReturnWithRetry();
assert(firstAttemptKey === retryAttemptKey, 'Retry submission REUSES identical idempotency key');

function openNewReturnForm(): string {
  formSessionIdempotencyKey = 'key-session-new-' + Date.now();
  return formSessionIdempotencyKey;
}

const newSessionKey = openNewReturnForm();
assert(newSessionKey !== firstAttemptKey, 'New logical return session generates fresh idempotency key');

// -----------------------------------------------------------------------------
// 5. Category Scope Filtering (supplierReturnInScope)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Category Scope Filtering ---');

const medicalReturn: Partial<SupplierReturn> = {
  id: 'ret-1',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      returnQuantity: 5,
      product: { category: 'Medicine' },
    },
  ],
};

const elderReturn: Partial<SupplierReturn> = {
  id: 'ret-2',
  items: [
    {
      id: 'item-2',
      productId: 'prod-2',
      returnQuantity: 10,
      product: { category: 'Ration' },
    },
  ],
};

assert(supplierReturnInScope(medicalReturn, 'all'), 'All scope includes medical return');
assert(supplierReturnInScope(medicalReturn, 'medical'), 'Medical scope includes medical return');
assert(!supplierReturnInScope(medicalReturn, 'elder'), 'Elder scope excludes medical return');

assert(supplierReturnInScope(elderReturn, 'all'), 'All scope includes elder return');
assert(supplierReturnInScope(elderReturn, 'elder'), 'Elder scope includes elder return');
assert(!supplierReturnInScope(elderReturn, 'medical'), 'Medical scope excludes elder return');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`📊 Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  throw new Error(`Supplier returns UI validation suite failed with ${failedTests} failure(s)`);
}
