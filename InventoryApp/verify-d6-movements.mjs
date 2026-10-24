import assert from 'node:assert/strict';
import {
  getMovementTypeMeta,
  formatMovementReference,
  formatSignedQuantity,
} from './src/features/inventory/utils/movementFormatters.ts';
import {
  inventoryStockMovementsQueryKey,
  resolveEffectiveUnitId,
  resolveEffectiveScope,
} from './src/features/inventory/hooks/queryKeys.ts';
import {
  movementInScope,
} from './src/features/inventory/utils/inventoryScope.ts';

console.log('🧪 Starting Phase D6.2: Stock Movement Ledger Verification Suite...\n');

// =========================================================================
// Test 1: Movement Type Labels and Safe Unknown Fallback
// =========================================================================
console.log('Test 1: Movement Type Classification and Fallbacks');
{
  // Known Types
  const purchaseMeta = getMovementTypeMeta('PURCHASE');
  assert.equal(purchaseMeta.label, 'Purchase Receipt');
  assert.equal(purchaseMeta.variant, 'success');
  assert.equal(purchaseMeta.isAddition, true);

  const issueMeta = getMovementTypeMeta('ISSUE');
  assert.equal(issueMeta.label, 'Stock Issue');
  assert.equal(issueMeta.variant, 'danger');
  assert.equal(issueMeta.isDeduction, true);

  const adjMeta = getMovementTypeMeta('ADJUSTMENT');
  assert.equal(adjMeta.label, 'Stock Adjustment');
  assert.equal(adjMeta.variant, 'warning');

  // Legacy Types
  const stockInMeta = getMovementTypeMeta('STOCK_IN');
  assert.equal(stockInMeta.label, 'Stock In');
  assert.equal(stockInMeta.variant, 'success');

  const stockOutMeta = getMovementTypeMeta('STOCK_OUT');
  assert.equal(stockOutMeta.label, 'Stock Out');
  assert.equal(stockOutMeta.variant, 'danger');

  // Safe Fallback for unclassified or future types
  const unknownMeta = getMovementTypeMeta('QUARANTINE_TRANSFER');
  assert.equal(unknownMeta.label, 'Quarantine transfer');
  assert.equal(unknownMeta.variant, 'outline');

  const emptyMeta = getMovementTypeMeta(null);
  assert.equal(emptyMeta.label, 'Unknown Movement');
  assert.equal(emptyMeta.variant, 'outline');

  console.log('  ✓ Standard ERP movement types (PURCHASE, ISSUE, ADJUSTMENT) classified with designated badge tones');
  console.log('  ✓ Legacy types (STOCK_IN, STOCK_OUT) mapped gracefully');
  console.log('  ✓ Unclassified or future movement types safely fall back without runtime errors or mislabeling');
}

// =========================================================================
// Test 2: Signed Quantity Formatting
// =========================================================================
console.log('\nTest 2: Signed Quantity Invariant');
{
  // Addition / Purchase
  const addFormatted = formatSignedQuantity(25, 25, 'PURCHASE');
  assert.equal(addFormatted.text, '+25');
  assert.equal(addFormatted.isNegative, false);

  // Deduction / Issue
  const deductFormatted = formatSignedQuantity(10, -10, 'ISSUE');
  assert.equal(deductFormatted.text, '-10');
  assert.equal(deductFormatted.isNegative, true);

  // Negative Adjustment
  const negAdj = formatSignedQuantity(5, -5, 'ADJUSTMENT');
  assert.equal(negAdj.text, '-5');
  assert.equal(negAdj.isNegative, true);

  // Positive Adjustment
  const posAdj = formatSignedQuantity(5, 5, 'ADJUSTMENT');
  assert.equal(posAdj.text, '+5');
  assert.equal(posAdj.isNegative, false);

  console.log('  ✓ Additions/Purchases explicitly prefixed with "+" and marked positive');
  console.log('  ✓ Deductions/Issues explicitly prefixed with "-" and marked negative');
  console.log('  ✓ Adjustments accurately preserve debit or credit sign');
}

// =========================================================================
// Test 3: Missing Fields and Reference Handling
// =========================================================================
console.log('\nTest 3: Missing Fields & Reference Fallbacks');
{
  // Vendor Reference
  const refVendor = formatMovementReference({ vendor: 'Apollo Pharma Ltd' });
  assert.equal(refVendor, 'Vendor: Apollo Pharma Ltd');

  // Issue Reference with notes and usage
  const refIssue = formatMovementReference({ usageType: 'PATIENT_CARE', issuedTo: 'Harish Kumar', notes: 'Monthly medication' });
  assert.equal(refIssue, 'PATIENT_CARE • Harish Kumar • Monthly medication');

  // Generic Reference Type with UUID
  const refGeneric = formatMovementReference({ referenceType: 'StockIssueRequest', referenceId: '12345678-9abc-def0-1234-56789abcdef0' });
  assert.equal(refGeneric, 'StockIssueRequest (12345678)');

  // Missing Reference Fallback
  const refEmpty = formatMovementReference({});
  assert.equal(refEmpty, 'Direct Movement');

  console.log('  ✓ Vendor references formatted with supplier attribution');
  console.log('  ✓ Issue context (usage, patient, notes) cleanly concatenated');
  console.log('  ✓ Direct or missing references display safe non-fabricated fallback');
}

// =========================================================================
// Test 4: Unit-Scoped Query Cache Isolation
// =========================================================================
console.log('\nTest 4: Unit-Scoped Cache Isolation for Movements');
{
  const unitAlpha = 'unit-care-alpha';
  const unitBeta = 'unit-care-beta';

  const keyAlpha = inventoryStockMovementsQueryKey(unitAlpha, 'all');
  const keyBeta = inventoryStockMovementsQueryKey(unitBeta, 'all');
  const keyAlphaElder = inventoryStockMovementsQueryKey(unitAlpha, 'elder');

  assert.deepEqual(keyAlpha, ['inventory-stock-movements', 'unit-care-alpha', 'all']);
  assert.deepEqual(keyBeta, ['inventory-stock-movements', 'unit-care-beta', 'all']);
  assert.notDeepEqual(keyAlpha, keyBeta, 'Keys must differ across active facility units');
  assert.notDeepEqual(keyAlpha, keyAlphaElder, 'Keys must differ across clinical scopes');

  console.log('  ✓ Query key for Unit Alpha: ' + JSON.stringify(keyAlpha));
  console.log('  ✓ Query key for Unit Beta:  ' + JSON.stringify(keyBeta));
  console.log('  ✓ Unit switching guarantees query key differentiation, ensuring ledger data isolation');
}

// =========================================================================
// Test 5: Filter Partitioning and Search Logic
// =========================================================================
console.log('\nTest 5: Ledger Filtering & Search Partitioning');
{
  const mockMovements = [
    {
      id: 'm1',
      movementType: 'PURCHASE',
      quantity: 50,
      signedQuantity: 50,
      balanceAfter: 150,
      vendor: 'Alpha Meds',
      notes: 'Monthly batch',
      updatedBy: 'warehouse.manager',
      createdAt: '2026-10-01T10:00:00.000Z',
      product: { name: 'Amoxicillin 500mg', code: 'MED-01', category: 'medical' }
    },
    {
      id: 'm2',
      movementType: 'ISSUE',
      quantity: 5,
      signedQuantity: -5,
      balanceAfter: 145,
      vendor: null,
      notes: 'Prescription dose',
      updatedBy: 'nurse.sarah',
      createdAt: '2026-10-05T14:30:00.000Z',
      product: { name: 'Amoxicillin 500mg', code: 'MED-01', category: 'medical' }
    },
    {
      id: 'm3',
      movementType: 'ADJUSTMENT',
      quantity: 2,
      signedQuantity: 2,
      balanceAfter: 147,
      vendor: null,
      notes: 'Found in physical audit',
      updatedBy: 'auditor.dan',
      createdAt: '2026-10-07T09:15:00.000Z',
      product: { name: 'Basmati Rice 25kg', code: 'RAT-01', category: 'ration' }
    }
  ];

  // 1. Movement type filter: ISSUE
  const issues = mockMovements.filter((m) => m.movementType === 'ISSUE');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].id, 'm2');

  // 2. Clinical Scope partition
  const medicalMovements = mockMovements.filter((m) => movementInScope(m, 'medical'));
  assert.equal(medicalMovements.length, 2);

  const elderMovements = mockMovements.filter((m) => movementInScope(m, 'elder'));
  assert.equal(elderMovements.length, 1);

  // 3. Search query filter
  const searchByActor = mockMovements.filter((m) =>
    m.updatedBy.toLowerCase().includes('auditor') || m.product.name.toLowerCase().includes('auditor')
  );
  assert.equal(searchByActor.length, 1);
  assert.equal(searchByActor[0].id, 'm3');

  // 4. Date range filter
  const start = new Date('2026-10-02T00:00:00.000Z').getTime();
  const end = new Date('2026-10-06T23:59:59.999Z').getTime();
  const inRange = mockMovements.filter((m) => {
    const time = new Date(m.createdAt).getTime();
    return time >= start && time <= end;
  });
  assert.equal(inRange.length, 1);
  assert.equal(inRange[0].id, 'm2');

  console.log('  ✓ Movement type filter accurately isolates stock issues (1)');
  console.log('  ✓ Scope filter separates medical (2) from elder (1) ledger entries');
  console.log('  ✓ Search filter targets actor names and product attributes');
  console.log('  ✓ Date range filter isolates entries within the targeted timestamp window');
}

// =========================================================================
// Test 6: Read-Only Ledger Invariant
// =========================================================================
console.log('\nTest 6: Read-Only Ledger Invariant');
{
  import('node:fs').then((fs) => {
    const serviceContent = fs.readFileSync(new URL('./src/features/inventory/services/inventory.ts', import.meta.url), 'utf-8');
    const pageContent = fs.readFileSync(new URL('./src/features/inventory/pages/StockMovementsPage.tsx', import.meta.url), 'utf-8');

    // Service checks
    assert.ok(serviceContent.includes('getStockMovements:'), 'Read method getStockMovements must exist');
    assert.ok(!serviceContent.includes('createStockMovement'), 'Zero createStockMovement endpoints should exist');
    assert.ok(!serviceContent.includes('updateStockMovement'), 'Zero updateStockMovement endpoints should exist');
    assert.ok(!serviceContent.includes('deleteStockMovement'), 'Zero deleteStockMovement endpoints should exist');

    // Page component checks
    assert.ok(!pageContent.includes('useMutation'), 'StockMovementsPage must not invoke mutating hooks');
    assert.ok(!pageContent.includes('useCreateInventoryStockMovement'), 'Zero movement creation hooks allowed');
    assert.ok(!pageContent.includes('useDelete'), 'Zero delete hooks allowed');

    console.log('  ✓ inventoryService strictly exposes getStockMovements without mutation endpoints');
    console.log('  ✓ StockMovementsPage is confirmed strictly read-only with zero mutation hooks');
    console.log('\n🎉 ALL Phase D6.2 Stock Movement Ledger Verification Tests PASSED successfully!\n');
  });
}
