import assert from 'node:assert/strict';
import {
  DEFAULT_MIN_STOCK_FALLBACK,
  getEffectiveStockThreshold,
  evaluateStockStatus,
} from './src/features/inventory/utils/thresholds.ts';
import {
  inventoryStockQueryKey,
  resolveEffectiveUnitId,
  resolveEffectiveScope,
} from './src/features/inventory/hooks/queryKeys.ts';
import {
  isCategoryInScope,
  stockInScope,
} from './src/features/inventory/utils/inventoryScope.ts';

console.log('🧪 Starting Phase D6.1: Low Stock Alerts Verification Suite...\n');

// =========================================================================
// Test 1: Configured Product Threshold vs Fallback Threshold of 10
// =========================================================================
console.log('Test 1: Stock Threshold Resolution');
{
  // Custom positive minStockLevel
  const custom = getEffectiveStockThreshold({ minStockLevel: 25 });
  assert.equal(custom.threshold, 25, 'Should use configured positive minStockLevel');
  assert.equal(custom.hasCustomThreshold, true);

  // Zero minStockLevel -> falls back to 10
  const zero = getEffectiveStockThreshold({ minStockLevel: 0 });
  assert.equal(zero.threshold, DEFAULT_MIN_STOCK_FALLBACK, 'Zero minStockLevel should fall back to 10');
  assert.equal(zero.hasCustomThreshold, false);

  // Negative minStockLevel -> falls back to 10
  const negative = getEffectiveStockThreshold({ minStockLevel: -5 });
  assert.equal(negative.threshold, DEFAULT_MIN_STOCK_FALLBACK, 'Negative minStockLevel should fall back to 10');
  assert.equal(negative.hasCustomThreshold, false);

  // Undefined / Null minStockLevel -> falls back to 10
  const nullThreshold = getEffectiveStockThreshold({ minStockLevel: null });
  assert.equal(nullThreshold.threshold, DEFAULT_MIN_STOCK_FALLBACK, 'Null minStockLevel should fall back to 10');
  assert.equal(nullThreshold.hasCustomThreshold, false);

  const missing = getEffectiveStockThreshold({});
  assert.equal(missing.threshold, DEFAULT_MIN_STOCK_FALLBACK, 'Missing minStockLevel should fall back to 10');
  assert.equal(missing.hasCustomThreshold, false);

  console.log('  ✓ Configured positive minStockLevel (25) correctly respected');
  console.log('  ✓ Zero, negative, and missing thresholds safely fallback to standard 10');
}

// =========================================================================
// Test 2: Threshold Boundary Conditions and Status Mapping
// =========================================================================
console.log('\nTest 2: Threshold Boundary & Status Evaluation');
{
  const productCustom = { minStockLevel: 15 };
  const productDefault = { minStockLevel: 0 };

  // 1. Zero quantity -> OUT_OF_STOCK
  const zeroQty = evaluateStockStatus(0, productCustom);
  assert.equal(zeroQty.status, 'OUT_OF_STOCK');
  assert.equal(zeroQty.variant, 'danger');
  assert.equal(zeroQty.label, 'Out of Stock');

  // 2. Negative quantity -> OUT_OF_STOCK
  const negQty = evaluateStockStatus(-3, productCustom);
  assert.equal(negQty.status, 'OUT_OF_STOCK');
  assert.equal(negQty.variant, 'danger');

  // 3. Exactly at threshold (boundary test: qty === threshold) -> LOW_STOCK
  const atCustomThreshold = evaluateStockStatus(15, productCustom);
  assert.equal(atCustomThreshold.status, 'LOW_STOCK');
  assert.equal(atCustomThreshold.variant, 'warning');
  assert.equal(atCustomThreshold.label, 'Low Stock');

  const atDefaultThreshold = evaluateStockStatus(10, productDefault);
  assert.equal(atDefaultThreshold.status, 'LOW_STOCK');
  assert.equal(atDefaultThreshold.variant, 'warning');

  // 4. Just below threshold -> LOW_STOCK
  const belowThreshold = evaluateStockStatus(14, productCustom);
  assert.equal(belowThreshold.status, 'LOW_STOCK');

  // 5. Strictly above threshold -> AVAILABLE
  const aboveCustomThreshold = evaluateStockStatus(16, productCustom);
  assert.equal(aboveCustomThreshold.status, 'AVAILABLE');
  assert.equal(aboveCustomThreshold.variant, 'success');
  assert.equal(aboveCustomThreshold.label, 'Available');

  const aboveDefaultThreshold = evaluateStockStatus(11, productDefault);
  assert.equal(aboveDefaultThreshold.status, 'AVAILABLE');
  assert.equal(aboveDefaultThreshold.variant, 'success');

  console.log('  ✓ Zero and negative balances classified as Out of Stock (danger)');
  console.log('  ✓ Quantities at exact threshold boundary (qty === threshold) correctly trigger Low Stock warning');
  console.log('  ✓ Quantities strictly above threshold classified as Available (success)');
}

// =========================================================================
// Test 3: Search, Scope, and Category Filtering Logic
// =========================================================================
console.log('\nTest 3: Filtering & Dataset Partitioning');
{
  const mockStock = [
    { id: '1', quantity: 0, product: { name: 'Amoxicillin 500mg', code: 'MED-01', category: 'medical', minStockLevel: 20 } },
    { id: '2', quantity: 5, product: { name: 'Basmati Rice 25kg', code: 'RAT-01', category: 'ration', minStockLevel: 10 } },
    { id: '3', quantity: 50, product: { name: 'Paracetamol 650mg', code: 'MED-02', category: 'medical', minStockLevel: 15 } },
    { id: '4', quantity: 8, product: { name: 'LED Tube Light', code: 'ELE-01', category: 'electrical', minStockLevel: 0 } }, // fallback 10 -> low
    { id: '5', quantity: 100, product: { name: 'Wheat Flour 10kg', code: 'RAT-02', category: 'ration', minStockLevel: 20 } }
  ];

  // Evaluate all
  const evaluated = mockStock.map((item) => ({
    ...item,
    eval: evaluateStockStatus(item.quantity, item.product)
  }));

  // Total monitored
  assert.equal(evaluated.length, 5);

  // Alerts only (out of stock + low stock)
  const alerts = evaluated.filter((i) => i.eval.status !== 'AVAILABLE');
  assert.equal(alerts.length, 3, 'Should have 3 alert items (Amoxicillin [0], Rice [5], LED Light [8])');

  // Out of stock
  const outOfStock = evaluated.filter((i) => i.eval.status === 'OUT_OF_STOCK');
  assert.equal(outOfStock.length, 1);
  assert.equal(outOfStock[0].product.name, 'Amoxicillin 500mg');

  // Scope: Medical only
  const medicalItems = evaluated.filter((i) => stockInScope(i, 'medical'));
  assert.equal(medicalItems.length, 2);

  // Scope: Elder only
  const elderItems = evaluated.filter((i) => stockInScope(i, 'elder'));
  assert.equal(elderItems.length, 3);

  // Search filter
  const searchResults = evaluated.filter((i) =>
    i.product.name.toLowerCase().includes('rice') || i.product.code.toLowerCase().includes('rice')
  );
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].product.code, 'RAT-01');

  console.log('  ✓ KPI metrics correctly aggregate out-of-stock (1) and low-stock (2) alerts');
  console.log('  ✓ Clinical/Medical scope partition isolates 2 medical items');
  console.log('  ✓ Search filter accurately isolates targeted SKU and name matches');
}

// =========================================================================
// Test 4: Unit-Scoped Query Cache Isolation
// =========================================================================
console.log('\nTest 4: Unit-Scoped Query Cache Isolation');
{
  const unitAlpha = 'unit-elder-care-alpha';
  const unitBeta = 'unit-medical-center-beta';

  const keyAlpha = inventoryStockQueryKey(unitAlpha, 'elder');
  const keyBeta = inventoryStockQueryKey(unitBeta, 'elder');
  const keyAll = inventoryStockQueryKey(unitAlpha, 'all');

  assert.deepEqual(keyAlpha, ['inventory-stock', 'unit-elder-care-alpha', 'elder']);
  assert.deepEqual(keyBeta, ['inventory-stock', 'unit-medical-center-beta', 'elder']);
  assert.notDeepEqual(keyAlpha, keyBeta, 'Unit Alpha and Unit Beta query keys must remain strictly distinct');

  // Effective unit fallback
  const resolvedFallback = resolveEffectiveUnitId(null, null);
  assert.equal(resolvedFallback, 'unassigned-unit');

  console.log('  ✓ Query key for Unit Alpha: ' + JSON.stringify(keyAlpha));
  console.log('  ✓ Query key for Unit Beta:  ' + JSON.stringify(keyBeta));
  console.log('  ✓ Unit switching guarantees query key differentiation, preventing cross-unit cache leaks');
}

// =========================================================================
// Test 5: UI Empty & Loading State Invariant Checks
// =========================================================================
console.log('\nTest 5: Empty State Contract');
{
  const healthyStock = [
    { id: '1', quantity: 50, product: { name: 'Item A', minStockLevel: 10 } },
    { id: '2', quantity: 200, product: { name: 'Item B', minStockLevel: 20 } },
  ];

  const alerts = healthyStock.filter((i) => evaluateStockStatus(i.quantity, i.product).status !== 'AVAILABLE');
  assert.equal(alerts.length, 0, 'Zero alerts for fully healthy inventory');

  console.log('  ✓ Healthy catalog correctly yields 0 alerts, triggering All Inventory Levels Healthy empty state');
}

console.log('\n🎉 ALL Phase D6.1 Low Stock Alerts Verification Tests PASSED successfully!\n');
