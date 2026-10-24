import assert from 'node:assert';
import { QueryClient } from '@tanstack/react-query';

// Import our pure functions directly from queryKeys.ts
import {
  resolveEffectiveUnitId,
  resolveEffectiveScope,
  resolveEffectiveOptions,
  inventoryProductsQueryKey,
  inventoryBatchesQueryKey,
  inventoryStockQueryKey,
  inventoryStockMovementsQueryKey,
  inventoryPurchasesQueryKey,
  inventoryStockIssueRequestsQueryKey,
  scopeKey,
} from './src/features/inventory/hooks/queryKeys.ts';

console.log('🧪 Starting Phase D1.2 Verification Tests...\n');

// -------------------------------------------------------------
// Test 1: Unit A vs Unit B query key differentiation
// -------------------------------------------------------------
console.log('Test 1: Unit A vs Unit B Query Key Differentiation');
{
  const unitA = 'unit-elder-care-1';
  const unitB = 'unit-medical-care-2';

  const keyA = inventoryProductsQueryKey(unitA, 'all');
  const keyB = inventoryProductsQueryKey(unitB, 'all');

  assert.deepStrictEqual(keyA, ['inventory-products', unitA, 'all']);
  assert.deepStrictEqual(keyB, ['inventory-products', unitB, 'all']);
  assert.notDeepStrictEqual(keyA, keyB, 'Keys for Unit A and Unit B must be distinct!');
  console.log('  ✓ Unit A key:', JSON.stringify(keyA));
  console.log('  ✓ Unit B key:', JSON.stringify(keyB));
}

// -------------------------------------------------------------
// Test 2: Explicit unit override vs active store unit
// -------------------------------------------------------------
console.log('\nTest 2: Explicit Unit Override vs Active Store Unit');
{
  const activeUnitId = 'active-unit-store-1';
  const explicitOverride = 'override-unit-2';

  // When explicit unitId is passed in options
  const resolvedWithOverride = resolveEffectiveUnitId(explicitOverride, activeUnitId);
  assert.strictEqual(resolvedWithOverride, explicitOverride, 'Explicit unitId must override activeUnitId');

  // When options does not have unitId
  const resolvedWithStore = resolveEffectiveUnitId(undefined, activeUnitId);
  assert.strictEqual(resolvedWithStore, activeUnitId, 'Must use activeUnitId when options.unitId is undefined');

  console.log('  ✓ Explicit override resolved:', resolvedWithOverride);
  console.log('  ✓ Store fallback resolved:', resolvedWithStore);
}

// -------------------------------------------------------------
// Test 3: Missing active-unit context (unassigned / facility-wide)
// -------------------------------------------------------------
console.log('\nTest 3: Missing Active-Unit Context');
{
  const resolvedNull = resolveEffectiveUnitId(null, null);
  const resolvedUndefined = resolveEffectiveUnitId(undefined, undefined);

  assert.strictEqual(resolvedNull, 'unassigned-unit');
  assert.strictEqual(resolvedUndefined, 'unassigned-unit');

  const keyUnassigned = inventoryProductsQueryKey(resolvedNull, 'all');
  assert.deepStrictEqual(keyUnassigned, ['inventory-products', 'unassigned-unit', 'all']);
  console.log('  ✓ Missing unit resolved safely to:', resolvedNull);
  console.log('  ✓ Query key for unassigned unit:', JSON.stringify(keyUnassigned));
}

// -------------------------------------------------------------
// Test 4: Existing filters, pagination & query parameters in keys
// -------------------------------------------------------------
console.log('\nTest 4: Filters, Pagination and Scope Parameters');
{
  const unitId = 'unit-101';

  // Scope filter
  const scopeKeyElder = inventoryProductsQueryKey(unitId, 'elder');
  const scopeKeyMedical = inventoryProductsQueryKey(unitId, 'medical');
  assert.deepStrictEqual(scopeKeyElder, ['inventory-products', unitId, 'elder']);
  assert.deepStrictEqual(scopeKeyMedical, ['inventory-products', unitId, 'medical']);
  assert.notDeepStrictEqual(scopeKeyElder, scopeKeyMedical);

  // Batches with productId filter
  const batchKey1 = inventoryBatchesQueryKey(unitId, 'all', 'prod-A');
  const batchKey2 = inventoryBatchesQueryKey(unitId, 'all', 'prod-B');
  const batchKeyAll = inventoryBatchesQueryKey(unitId, 'all', undefined);
  assert.deepStrictEqual(batchKey1, ['inventory-batches', unitId, 'all', 'prod-A']);
  assert.deepStrictEqual(batchKey2, ['inventory-batches', unitId, 'all', 'prod-B']);
  assert.notDeepStrictEqual(batchKey1, batchKey2);
  assert.notDeepStrictEqual(batchKey1, batchKeyAll);

  // Stock issue requests with patientId filter
  const issueKeyPatient = inventoryStockIssueRequestsQueryKey(unitId, 'all', 'patient-999');
  const issueKeyGeneral = inventoryStockIssueRequestsQueryKey(unitId, 'all', undefined);
  assert.deepStrictEqual(issueKeyPatient, ['inventory-stock-issue-requests', unitId, 'all', 'patient-999']);
  assert.notDeepStrictEqual(issueKeyPatient, issueKeyGeneral);

  // Effective options synchronization
  const options = { scope: 'medical', patientId: 'patient-999' };
  const effectiveOpts = resolveEffectiveOptions(options, unitId);
  assert.strictEqual(effectiveOpts.unitId, unitId);
  assert.strictEqual(effectiveOpts.scope, 'medical');
  assert.strictEqual(effectiveOpts.patientId, 'patient-999');

  console.log('  ✓ Scoped products key:', JSON.stringify(scopeKeyElder));
  console.log('  ✓ Product batch key with filter:', JSON.stringify(batchKey1));
  console.log('  ✓ Stock issue request key with patientId:', JSON.stringify(issueKeyPatient));
  console.log('  ✓ Effective options sync:', JSON.stringify(effectiveOpts));
}

// -------------------------------------------------------------
// Test 5: Cache Isolation & Unit-Sensitive Query Invalidation
// -------------------------------------------------------------
console.log('\nTest 5: TanStack Query Cache Isolation & Mutation Invalidation');
{
  const queryClient = new QueryClient();

  const unitA = 'unit-alpha';
  const unitB = 'unit-beta';

  const keyA = inventoryStockQueryKey(unitA, 'all');
  const keyB = inventoryStockQueryKey(unitB, 'all');

  // Seed cache for both units
  queryClient.setQueryData(keyA, [{ productId: 'item-1', quantity: 50 }]);
  queryClient.setQueryData(keyB, [{ productId: 'item-1', quantity: 150 }]);

  // Verify initial cached data is strictly isolated
  const cachedDataA = queryClient.getQueryData(keyA);
  const cachedDataB = queryClient.getQueryData(keyB);

  assert.strictEqual(cachedDataA[0].quantity, 50);
  assert.strictEqual(cachedDataB[0].quantity, 150);
  console.log('  ✓ Unit A initial cached stock:', cachedDataA[0].quantity);
  console.log('  ✓ Unit B initial cached stock:', cachedDataB[0].quantity);

  // Simulate mutation in Unit A: invalidate ['inventory-stock', unitA]
  queryClient.invalidateQueries({ queryKey: ['inventory-stock', unitA] });

  // Check query states
  const queryStateA = queryClient.getQueryCache().find({ queryKey: keyA });
  const queryStateB = queryClient.getQueryCache().find({ queryKey: keyB });

  assert.strictEqual(queryStateA.isStale(), true, 'Unit A query MUST be invalidated/stale');
  assert.strictEqual(queryStateB.isStale(), false, 'Unit B query MUST NOT be invalidated/stale!');
  console.log('  ✓ Unit A query isStale after mutation:', queryStateA.isStale());
  console.log('  ✓ Unit B query isStale after mutation:', queryStateB.isStale());

  // Confirm Unit B cached data is intact and preserved
  const postMutationDataB = queryClient.getQueryData(keyB);
  assert.strictEqual(postMutationDataB[0].quantity, 150);
  console.log('  ✓ Unit B cache data remained intact:', postMutationDataB[0].quantity);
}

console.log('\n🎉 ALL Phase D1.2 Verification Tests PASSED successfully!\n');
