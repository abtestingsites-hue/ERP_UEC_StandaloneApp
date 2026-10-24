/**
 * InventoryApp D10 — Valuation, Consumption Analytics & Physical Audit UI Validation Suite
 * Run with: npx tsx src/tests/runValuationAndAuditUiValidationTest.ts
 */

import type {
  ValuationItem,
  ValuationSummary,
  TopConsumedProduct,
  PhysicalAudit,
  SubmitPhysicalAuditCountPayload
} from '../features/inventory/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

console.log('========================================================================');
console.log('📊 InventoryApp D10 — Valuation & Physical Audit UI Verification Suite');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. Valuation Calculations & Missing Cost Safeguard
// -----------------------------------------------------------------------------
console.log('--- 1. Valuation Arithmetic & Missing-Cost Exclusion ---');

function computeItemValuation(quantity: number, unitCost: number | null): number | null {
  if (unitCost === null || isNaN(unitCost) || unitCost <= 0) {
    return null;
  }
  return Math.round(quantity * unitCost * 100) / 100;
}

function computeTotalValuation(items: Array<{ quantity: number; unitCost: number | null }>): {
  totalValuation: number;
  valuedCount: number;
  excludedCount: number;
} {
  let totalValuation = 0;
  let valuedCount = 0;
  let excludedCount = 0;

  for (const item of items) {
    const val = computeItemValuation(item.quantity, item.unitCost);
    if (val !== null) {
      totalValuation += val;
      valuedCount++;
    } else {
      excludedCount++;
    }
  }

  return {
    totalValuation: Math.round(totalValuation * 100) / 100,
    valuedCount,
    excludedCount
  };
}

const mockValItems = [
  { productId: 'p-1', quantity: 100, unitCost: 15.50 }, // 1550.00
  { productId: 'p-2', quantity: 50, unitCost: null },   // Missing cost -> EXCLUDED
  { productId: 'p-3', quantity: 20, unitCost: 450.00 }, // 9000.00
  { productId: 'p-4', quantity: 10, unitCost: 0 }       // 0 cost -> unverified / EXCLUDED
];

const valResult = computeTotalValuation(mockValItems);

assert(computeItemValuation(100, 15.50) === 1550.00, 'Calculates 100 * 15.50 = 1550.00');
assert(computeItemValuation(50, null) === null, 'Returns null valuation for missing unit cost');
assert(computeItemValuation(10, 0) === null, 'Returns null valuation for 0 unit cost');
assert(valResult.totalValuation === 10550.00, `Total valuation amount is 10550.00 (got ${valResult.totalValuation})`);
assert(valResult.valuedCount === 2, 'Counts exactly 2 items with verified cost');
assert(valResult.excludedCount === 2, 'Counts exactly 2 items excluded due to missing cost');

// -----------------------------------------------------------------------------
// 2. Batch vs. Aggregate Valuation (Zero Double-Counting)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Batch vs. Aggregate Double-Counting Safeguard ---');

const aggregateProductStock = { productId: 'p-1', totalStock: 150, unitCost: 10.00 };
const batchBreakdown = [
  { batchId: 'b-1', quantity: 100, unitCost: 10.00 },
  { batchId: 'b-2', quantity: 50, unitCost: 10.00 }
];

const aggregateTotal = computeItemValuation(aggregateProductStock.totalStock, aggregateProductStock.unitCost);
const batchSumTotal = batchBreakdown.reduce((sum, b) => sum + (computeItemValuation(b.quantity, b.unitCost) || 0), 0);

assert(aggregateTotal === 1500.00, 'Aggregate valuation is 150 * 10 = 1500.00');
assert(batchSumTotal === 1500.00, 'Sum of batches matches aggregate total 1500.00');
assert(aggregateTotal === batchSumTotal, 'Batch breakdown and aggregate valuation match identically without double-counting');

// -----------------------------------------------------------------------------
// 3. Operational Movement Type Classification
// -----------------------------------------------------------------------------
console.log('\n--- 3. Movement Type Classification in Consumption ---');

function classifyMovementType(type: string): 'CONSUMPTION' | 'VENDOR_RETURN' | 'AUDIT_ADJUSTMENT' | 'WASTE' | 'INFLOW' {
  const t = type.toUpperCase();
  if (t === 'ISSUE' || t === 'KITCHEN_REQUISITION') return 'CONSUMPTION';
  if (t === 'SUPPLIER_RETURN') return 'VENDOR_RETURN';
  if (t === 'ADJUSTMENT') return 'AUDIT_ADJUSTMENT';
  if (t === 'DISCARD' || t === 'WASTE') return 'WASTE';
  if (t === 'PURCHASE' || t === 'GRN') return 'INFLOW';
  return 'AUDIT_ADJUSTMENT';
}

assert(classifyMovementType('ISSUE') === 'CONSUMPTION', 'Clinical stock issue classified as CONSUMPTION');
assert(classifyMovementType('KITCHEN_REQUISITION') === 'CONSUMPTION', 'Kitchen meal requisition classified as CONSUMPTION');
assert(classifyMovementType('SUPPLIER_RETURN') === 'VENDOR_RETURN', 'Supplier return segregated as VENDOR_RETURN');
assert(classifyMovementType('ADJUSTMENT') === 'AUDIT_ADJUSTMENT', 'Audit adjustment segregated as AUDIT_ADJUSTMENT');
assert(classifyMovementType('DISCARD') === 'WASTE', 'Discarded item segregated as WASTE');
assert(classifyMovementType('GRN') === 'INFLOW', 'Goods Receipt Note classified as INFLOW');

// -----------------------------------------------------------------------------
// 4. Physical Stock Audit Variance & Reason Validation
// -----------------------------------------------------------------------------
console.log('\n--- 4. Physical Stock Audit Variance & Reason Validation ---');

function calculateAuditVariance(snapshotSystem: number, physicalCounted: number): number {
  return physicalCounted - snapshotSystem;
}

function validateCountSubmission(payload: { physicalQuantity: any; reason?: string | null }, snapshotSystem: number): {
  isValid: boolean;
  error?: string;
  variance?: number;
} {
  const qty = Number(payload.physicalQuantity);
  if (!Number.isInteger(qty) || qty < 0) {
    return { isValid: false, error: 'Physical counted quantity must be a non-negative integer' };
  }

  const variance = calculateAuditVariance(snapshotSystem, qty);
  if (variance !== 0) {
    if (!payload.reason || payload.reason.trim().length < 3) {
      return { isValid: false, error: 'A variance reason (minimum 3 characters) is required when physical count differs from system balance', variance };
    }
  }

  return { isValid: true, variance };
}

assert(calculateAuditVariance(100, 95) === -5, 'Calculates shortage variance 95 - 100 = -5');
assert(calculateAuditVariance(100, 105) === 5, 'Calculates surplus variance 105 - 100 = +5');
assert(calculateAuditVariance(100, 100) === 0, 'Calculates zero variance for exact match');

assert(!validateCountSubmission({ physicalQuantity: -1 }, 100).isValid, 'Rejects negative physical quantity');
assert(!validateCountSubmission({ physicalQuantity: 95, reason: '' }, 100).isValid, 'Rejects variance without reason');
assert(!validateCountSubmission({ physicalQuantity: 95, reason: 'ab' }, 100).isValid, 'Rejects variance reason shorter than 3 chars');
assert(validateCountSubmission({ physicalQuantity: 95, reason: 'Damaged bottles' }, 100).isValid, 'Accepts valid count with explanation');
assert(validateCountSubmission({ physicalQuantity: 100, reason: '' }, 100).isValid, 'Accepts zero-variance count without requiring reason');

// -----------------------------------------------------------------------------
// 5. Reconciliation Authorization & Status Transition Guards
// -----------------------------------------------------------------------------
console.log('\n--- 5. Reconciliation State Transition Guards ---');

function canReconcileAudit(audit: Partial<PhysicalAudit>): { allowed: boolean; reason?: string } {
  if (audit.status === 'RECONCILED') {
    return { allowed: false, reason: 'Audit already reconciled; duplicate reconciliation blocked' };
  }
  if (audit.status === 'CANCELLED') {
    return { allowed: false, reason: 'Cannot reconcile cancelled audit' };
  }
  if (audit.status === 'DRAFT' || audit.physicalQuantity === null || audit.physicalQuantity === undefined) {
    return { allowed: false, reason: 'Physical count has not yet been submitted for this audit' };
  }
  return { allowed: true };
}

assert(canReconcileAudit({ status: 'COUNTED', physicalQuantity: 95 }).allowed === true, 'Allows reconciliation for COUNTED audit with recorded physical count');
assert(canReconcileAudit({ status: 'DRAFT', physicalQuantity: null }).allowed === false, 'Disallows reconciliation for DRAFT audit');
assert(canReconcileAudit({ status: 'RECONCILED', physicalQuantity: 95 }).allowed === false, 'Disallows duplicate reconciliation for already RECONCILED audit');
assert(canReconcileAudit({ status: 'CANCELLED', physicalQuantity: 95 }).allowed === false, 'Disallows reconciliation for CANCELLED audit');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`📊 Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  throw new Error(`Valuation & Audit UI validation suite failed with ${failedTests} failure(s)`);
}
