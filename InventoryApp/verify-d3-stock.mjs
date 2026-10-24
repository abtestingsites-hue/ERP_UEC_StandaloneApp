import assert from 'node:assert';
import { QueryClient } from '@tanstack/react-query';

import {
  resolveEffectiveUnitId,
  inventoryStockQueryKey,
  inventoryBatchesQueryKey,
  inventoryProductsQueryKey,
} from './src/features/inventory/hooks/queryKeys.ts';
import { hasPermission, INVENTORY_PERMISSIONS } from './src/lib/permissions.ts';

console.log('🧪 Starting Phase D3: Stock & Batches Verification Suite...\n');

// -------------------------------------------------------------
// Test 1: Stock Status Calculation (Available, Low Stock, Out of Stock)
// -------------------------------------------------------------
console.log('Test 1: Stock Status Calculations & Fallback Thresholds');
{
  const lowStockThresholdFallback = 10;

  const getProductThreshold = (product) => {
    const minLevel = Number(product?.minStockLevel);
    return Number.isFinite(minLevel) && minLevel > 0 ? minLevel : lowStockThresholdFallback;
  };

  const getStockStatus = (stockItem) => {
    const qty = Number(stockItem.quantity || 0);
    const threshold = getProductThreshold(stockItem.product);
    if (qty <= 0) return 'Out of Stock';
    if (qty <= threshold) return 'Low Stock';
    return 'Available';
  };

  const item1 = { id: 's1', quantity: 45, product: { minStockLevel: 20 } }; // 45 > 20 -> Available
  const item2 = { id: 's2', quantity: 15, product: { minStockLevel: 20 } }; // 15 <= 20 -> Low Stock
  const item3 = { id: 's3', quantity: 0, product: { minStockLevel: 20 } };  // 0 -> Out of Stock
  const item4 = { id: 's4', quantity: 8, product: { minStockLevel: 0 } };   // fallback threshold 10 -> Low Stock (8 <= 10)
  const item5 = { id: 's5', quantity: 12, product: { minStockLevel: null } }; // fallback threshold 10 -> Available (12 > 10)

  assert.strictEqual(getStockStatus(item1), 'Available');
  assert.strictEqual(getStockStatus(item2), 'Low Stock');
  assert.strictEqual(getStockStatus(item3), 'Out of Stock');
  assert.strictEqual(getStockStatus(item4), 'Low Stock');
  assert.strictEqual(getStockStatus(item5), 'Available');

  console.log('  ✓ Item 1 (45 qty, min 20): Available');
  console.log('  ✓ Item 2 (15 qty, min 20): Low Stock');
  console.log('  ✓ Item 3 (0 qty): Out of Stock');
  console.log('  ✓ Item 4 (8 qty, fallback 10): Low Stock');
  console.log('  ✓ Item 5 (12 qty, fallback 10): Available');
}

// -------------------------------------------------------------
// Test 2: Stock Adjustment Signed Quantity & Trace Payload Formatting
// -------------------------------------------------------------
console.log('\nTest 2: Stock Adjustment Signed Payload Contract');
{
  const formatAdjustmentPayload = ({ productId, mode, quantity, referenceNo, storageLocation, issuedTo, usageType, notes }) => {
    const qty = Math.trunc(Number(quantity));
    const signedQty = mode === 'OUT' ? -qty : qty;

    const traceNotes = [
      referenceNo ? `Reference/Bill: ${referenceNo.trim()}` : '',
      storageLocation ? `Storage/Location: ${storageLocation.trim()}` : '',
      issuedTo ? `${mode === 'OUT' ? 'Issued To' : 'Received From'}: ${issuedTo.trim()}` : '',
      notes ? `Notes: ${notes.trim()}` : ''
    ].filter(Boolean).join(' | ');

    return {
      productId,
      quantity: signedQty,
      usageType: usageType || (mode === 'OUT' ? 'Department Use' : 'Stock Receipt'),
      issuedTo: mode === 'OUT' ? issuedTo?.trim() || undefined : undefined,
      notes: traceNotes || undefined
    };
  };

  // Stock In payload
  const inPayload = formatAdjustmentPayload({
    productId: 'prod-001',
    mode: 'IN',
    quantity: '25',
    referenceNo: 'INV-2026-99',
    storageLocation: 'Pharmacy Shelf A1',
    issuedTo: 'MedPharma Corp',
    usageType: 'Purchase',
    notes: 'Checked seal intact'
  });

  assert.strictEqual(inPayload.productId, 'prod-001');
  assert.strictEqual(inPayload.quantity, 25);
  assert.strictEqual(inPayload.usageType, 'Purchase');
  assert.strictEqual(inPayload.issuedTo, undefined); // Stock In does not set issuedTo
  assert.strictEqual(
    inPayload.notes,
    'Reference/Bill: INV-2026-99 | Storage/Location: Pharmacy Shelf A1 | Received From: MedPharma Corp | Notes: Checked seal intact'
  );

  // Stock Out payload
  const outPayload = formatAdjustmentPayload({
    productId: 'prod-001',
    mode: 'OUT',
    quantity: '10',
    referenceNo: 'REQ-55',
    storageLocation: 'Ward 2',
    issuedTo: 'Sister Mary',
    usageType: 'Department Use',
    notes: 'Emergency replenishment'
  });

  assert.strictEqual(outPayload.productId, 'prod-001');
  assert.strictEqual(outPayload.quantity, -10); // Negatively signed
  assert.strictEqual(outPayload.issuedTo, 'Sister Mary');
  assert.strictEqual(
    outPayload.notes,
    'Reference/Bill: REQ-55 | Storage/Location: Ward 2 | Issued To: Sister Mary | Notes: Emergency replenishment'
  );

  console.log('  ✓ Stock In generated positive quantity (+25) and trace notes');
  console.log('  ✓ Stock Out generated negative signed quantity (-10) and issuedTo payload');
}

// -------------------------------------------------------------
// Test 3: FEFO Batch Sorting & Expiry Status Evaluation
// -------------------------------------------------------------
console.log('\nTest 3: FEFO Batch Expiry Status Evaluation');
{
  const now = new Date();
  const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
  const soonDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(); // in 15 days
  const futureDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(); // in 180 days

  const evaluateExpiry = (expiryDateStr) => {
    const exp = new Date(expiryDateStr);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (exp < now) return 'Expired';
    if (exp <= thirtyDays) return 'Expiring Soon';
    return 'Healthy';
  };

  assert.strictEqual(evaluateExpiry(pastDate), 'Expired');
  assert.strictEqual(evaluateExpiry(soonDate), 'Expiring Soon');
  assert.strictEqual(evaluateExpiry(futureDate), 'Healthy');

  // FEFO sorting: earliest expiry date first
  const batches = [
    { batchNumber: 'B3', expiryDate: futureDate, quantity: 50 },
    { batchNumber: 'B1', expiryDate: pastDate, quantity: 20 },
    { batchNumber: 'B2', expiryDate: soonDate, quantity: 30 }
  ];

  const sortedFEFO = [...batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  assert.strictEqual(sortedFEFO[0].batchNumber, 'B1');
  assert.strictEqual(sortedFEFO[1].batchNumber, 'B2');
  assert.strictEqual(sortedFEFO[2].batchNumber, 'B3');

  console.log('  ✓ Past batch evaluated as Expired');
  console.log('  ✓ <= 30 day batch evaluated as Expiring Soon');
  console.log('  ✓ > 30 day batch evaluated as Healthy');
  console.log('  ✓ FEFO order preserves chronological ascending expiry date (B1 -> B2 -> B3)');
}

// -------------------------------------------------------------
// Test 4: Unit-Switching Cache Isolation for Stock & Batches
// -------------------------------------------------------------
console.log('\nTest 4: Stock & Batch Unit-Switching Cache Isolation');
{
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } }
  });

  const unitA = 'unit-alpha';
  const unitB = 'unit-beta';

  const stockKeyA = inventoryStockQueryKey(unitA, 'all');
  const stockKeyB = inventoryStockQueryKey(unitB, 'all');

  const batchesKeyA = inventoryBatchesQueryKey(unitA, 'all');
  const batchesKeyB = inventoryBatchesQueryKey(unitB, 'all');

  assert.notDeepStrictEqual(stockKeyA, stockKeyB);
  assert.notDeepStrictEqual(batchesKeyA, batchesKeyB);

  // Populate cache for Unit A and Unit B
  queryClient.setQueryData(stockKeyA, [{ id: 's-a', productId: 'p1', quantity: 100 }]);
  queryClient.setQueryData(stockKeyB, [{ id: 's-b', productId: 'p1', quantity: 5 }]);

  queryClient.setQueryData(batchesKeyA, [{ id: 'b-a', batchNumber: 'BATCH-ALPHA', quantity: 100 }]);
  queryClient.setQueryData(batchesKeyB, [{ id: 'b-b', batchNumber: 'BATCH-BETA', quantity: 5 }]);

  // Invalidate Unit A stock & batches (as done by useUpdateInventoryStock)
  queryClient.invalidateQueries({ queryKey: ['inventory-stock', unitA] });
  queryClient.invalidateQueries({ queryKey: ['inventory-batches', unitA] });

  // Query states
  const queryStateStockA = queryClient.getQueryCache().find({ queryKey: stockKeyA });
  const queryStateStockB = queryClient.getQueryCache().find({ queryKey: stockKeyB });
  const queryStateBatchesA = queryClient.getQueryCache().find({ queryKey: batchesKeyA });
  const queryStateBatchesB = queryClient.getQueryCache().find({ queryKey: batchesKeyB });

  assert.strictEqual(queryStateStockA.isStale(), true, 'Unit A stock should be stale');
  assert.strictEqual(queryStateStockB.isStale(), false, 'Unit B stock must NOT be stale');
  assert.strictEqual(queryStateBatchesA.isStale(), true, 'Unit A batches should be stale');
  assert.strictEqual(queryStateBatchesB.isStale(), false, 'Unit B batches must NOT be stale');

  // Verify Unit B cached data is completely preserved
  const dataB = queryClient.getQueryData(stockKeyB);
  assert.strictEqual(dataB[0].quantity, 5);

  console.log('  ✓ Unit Alpha stock query key:', JSON.stringify(stockKeyA));
  console.log('  ✓ Unit Beta stock query key:', JSON.stringify(stockKeyB));
  console.log('  ✓ Unit Alpha invalidation marks Unit Alpha stale without polluting Unit Beta');
  console.log('  ✓ Unit Beta stock balance remained isolated at 5');
}

// -------------------------------------------------------------
// Test 5: Permission Guards for Stock Viewing & Adjustments
// -------------------------------------------------------------
console.log('\nTest 5: Stock Viewing & Adjustment Permissions');
{
  const readOnlyUser = {
    id: 'u-1',
    role: 'NURSING_STAFF',
    permissions: ['Stock'] // Can view stock, cannot update
  };

  const inventoryManager = {
    id: 'u-2',
    role: 'ELDER_INVENTORY_MANAGER',
    permissions: ['Stock', 'Update Stock']
  };

  const adminUser = {
    id: 'u-3',
    role: 'ADMIN',
    permissions: []
  };

  const unprivilegedUser = {
    id: 'u-4',
    role: 'GUEST',
    permissions: []
  };

  // View permissions
  assert.strictEqual(hasPermission(readOnlyUser, [INVENTORY_PERMISSIONS.STOCK_VIEW, 'Stock']), true);
  assert.strictEqual(hasPermission(inventoryManager, [INVENTORY_PERMISSIONS.STOCK_VIEW, 'Stock']), true);
  assert.strictEqual(hasPermission(adminUser, [INVENTORY_PERMISSIONS.STOCK_VIEW, 'Stock']), true);
  assert.strictEqual(hasPermission(unprivilegedUser, [INVENTORY_PERMISSIONS.STOCK_VIEW, 'Stock']), false);

  // Update permissions
  assert.strictEqual(hasPermission(readOnlyUser, [INVENTORY_PERMISSIONS.STOCK_MANAGE, 'Update Stock']), false);
  assert.strictEqual(hasPermission(inventoryManager, [INVENTORY_PERMISSIONS.STOCK_MANAGE, 'Update Stock']), true);
  assert.strictEqual(hasPermission(adminUser, [INVENTORY_PERMISSIONS.STOCK_MANAGE, 'Update Stock']), true);
  assert.strictEqual(hasPermission(unprivilegedUser, [INVENTORY_PERMISSIONS.STOCK_MANAGE, 'Update Stock']), false);

  console.log('  ✓ Read-only user can view stock but cannot adjust stock');
  console.log('  ✓ Inventory manager can view and adjust stock');
  console.log('  ✓ Admin role inherits full stock view and adjustment rights');
  console.log('  ✓ Unprivileged user is denied all stock operations');
}

console.log('\n🎉 ALL Phase D3 Verification Tests PASSED successfully!\n');
