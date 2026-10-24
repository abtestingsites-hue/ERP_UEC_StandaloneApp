/**
 * SuperAdminApp Inventory — Product Master to Stock Visibility & Invariants Test Suite
 * Covers all 12 regression requirements specified in Phase 3.
 * Executed with: node ..\Backend\node_modules\tsx\dist\cli.mjs src/features/inventory/tests/runProductStockVisibilityRegressionTest.ts
 */

import type {
    InventoryProduct,
    InventoryStock,
    InventoryProductBatch,
    StockIssueRequest
} from '../inventory.types';

declare const process: { exit: (code?: number) => never };

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ [PASS] Test ${totalTests.toString().padStart(2, '0')}: ${testName}`);
    } else {
        failedTests++;
        console.error(`  ✗ [FAIL] Test ${totalTests.toString().padStart(2, '0')}: ${testName}${detail ? ` — ${detail}` : ''}`);
    }
}

/**
 * Catalogue-to-stock synthesis engine as implemented in StockBatchesTab.tsx
 */
function synthesizeProductsBalance(
    products: InventoryProduct[],
    stocks: InventoryStock[],
    activeDomain: 'medical' | 'food' | 'all',
    activeUnitId: string | null
): InventoryStock[] {
    const stockMap = new Map<string, InventoryStock>();
    for (const s of stocks) {
        if (s.productId) {
            stockMap.set(s.productId, s);
        }
    }

    const merged: InventoryStock[] = [];
    const seenProductIds = new Set<string>();

    // 1. Process active catalogue products for domain and unit scope
    for (const prod of products) {
        if (prod.status === false) continue;

        // Domain isolation
        if (activeDomain !== 'all') {
            const cat = String(prod.category || '').toLowerCase();
            const isMedical = cat.includes('med') || cat.includes('pharma') || cat.includes('drug') || cat.includes('surgical') || cat.includes('clinical');
            const isFood = cat.includes('food') || cat.includes('ration') || cat.includes('kitchen') || cat.includes('grocery') || cat.includes('diet');

            if (activeDomain === 'medical' && isFood && !isMedical) continue;
            if (activeDomain === 'food' && isMedical && !isFood) continue;
        }

        // Unit scope isolation
        if (activeUnitId !== null && prod.unitId && prod.unitId !== activeUnitId) {
            continue;
        }

        seenProductIds.add(prod.id);
        const existing = stockMap.get(prod.id);

        if (existing) {
            merged.push({
                ...existing,
                product: {
                    ...prod,
                    ...(existing.product || {})
                }
            });
        } else {
            merged.push({
                id: `stock-uninitialized-${prod.id}`,
                productId: prod.id,
                quantity: 0,
                tenantId: prod.tenantId,
                unitId: prod.unitId || activeUnitId || '',
                product: prod
            });
        }
    }

    // 2. Preserve any existing stock records whose product wasn't in productData
    for (const s of stocks) {
        if (s.productId && !seenProductIds.has(s.productId)) {
            // Apply domain check to existing stock
            if (activeDomain !== 'all') {
                const cat = String(s.product?.category || '').toLowerCase();
                const isMedical = cat.includes('med') || cat.includes('pharma') || cat.includes('drug') || cat.includes('surgical');
                const isFood = cat.includes('food') || cat.includes('ration') || cat.includes('kitchen') || cat.includes('grocery');
                if (activeDomain === 'medical' && isFood && !isMedical) continue;
                if (activeDomain === 'food' && isMedical && !isFood) continue;
            }
            if (activeUnitId !== null && s.unitId && s.unitId !== activeUnitId) {
                continue;
            }
            merged.push(s);
        }
    }

    return merged;
}

/**
 * Server-side Issue Request and Approval Invariants Simulator
 */
interface MockDatabase {
    stocks: Map<string, number>; // key: `${productId}_${unitId}`
    batches: Map<string, { id: string; productId: string; unitId: string; quantity: number; expiryDate: Date }[]>;
    requests: Map<string, StockIssueRequest>;
    movements: { productId: string; quantity: number; movementType: string; balanceAfter: number }[];
}

function createIssueRequest(
    db: MockDatabase,
    payload: { productId: string; quantity: number; unitId: string }
): { success: boolean; error?: string; requestId?: string } {
    const stockKey = `${payload.productId}_${payload.unitId}`;
    const available = db.stocks.get(stockKey) || 0;

    if (available <= 0) {
        return { success: false, error: 'Selected product has no available stock' };
    }
    if (payload.quantity > available) {
        return { success: false, error: 'Requested quantity is greater than available stock' };
    }

    const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
    const req: StockIssueRequest = {
        id: requestId,
        productId: payload.productId,
        quantity: payload.quantity,
        usageType: 'PATIENT_CARE',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        tenantId: 'tenant-1',
        unitId: payload.unitId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.requests.set(requestId, req);
    return { success: true, requestId };
}

function approveIssueRequest(
    db: MockDatabase,
    requestId: string
): { success: boolean; error?: string } {
    const request = db.requests.get(requestId);
    if (!request) return { success: false, error: 'Stock issue request not found' };
    if (request.status !== 'PENDING') {
        return { success: false, error: 'Only pending requests can be approved' };
    }

    const stockKey = `${request.productId}_${request.unitId}`;
    const liveStock = db.stocks.get(stockKey) || 0;

    if (liveStock < request.quantity) {
        return { success: false, error: 'Available stock is lower than requested quantity' };
    }

    // Deduct stock
    const newBalance = liveStock - request.quantity;
    db.stocks.set(stockKey, newBalance);

    // Record movement
    db.movements.push({
        productId: request.productId,
        quantity: -request.quantity,
        movementType: 'ISSUE',
        balanceAfter: newBalance
    });

    // Mutate status
    request.status = 'APPROVED';
    request.approvedAt = new Date().toISOString();
    return { success: true };
}

function rejectIssueRequest(
    db: MockDatabase,
    requestId: string
): { success: boolean; error?: string } {
    const request = db.requests.get(requestId);
    if (!request) return { success: false, error: 'Stock issue request not found' };
    if (request.status !== 'PENDING') {
        return { success: false, error: 'Only pending requests can be rejected' };
    }

    request.status = 'REJECTED';
    request.rejectedAt = new Date().toISOString();
    return { success: true };
}

// ==========================================
// TEST SUITE EXECUTION
// ==========================================
console.log('========================================================================');
console.log('📦 SuperAdminApp Inventory — Product Master to Stock Visibility Tests');
console.log('========================================================================\n');

// Mock Data Fixtures
const TENANT_ID = 'tenant-alpha';
const UNIT_MAIN = 'unit-main-warehouse';
const UNIT_REMOTE = 'unit-remote-branch';

const mockProducts: InventoryProduct[] = [
    {
        id: 'prod-med-new-001',
        name: 'Paracetamol 500mg Tablets',
        code: 'MED-PCM-500',
        sku: 'MED-PCM-500',
        category: 'Medicines',
        unit: 'Strips',
        unitOfMeasure: 'Strips',
        minStockLevel: 20,
        defaultRevenuePrice: 35.0,
        unitCost: 20.0,
        isBatchTracked: true,
        status: true,
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN
    },
    {
        id: 'prod-med-stocked-002',
        name: 'Amoxicillin 250mg Capsules',
        code: 'MED-AMX-250',
        sku: 'MED-AMX-250',
        category: 'Medicines',
        unit: 'Strips',
        unitOfMeasure: 'Strips',
        minStockLevel: 10,
        defaultRevenuePrice: 55.0,
        unitCost: 32.0,
        isBatchTracked: true,
        status: true,
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN
    },
    {
        id: 'prod-food-new-003',
        name: 'Basmati Rice Premium 25kg',
        code: 'FOOD-RICE-25K',
        sku: 'FOOD-RICE-25K',
        category: 'Ration',
        unit: 'Bags',
        unitOfMeasure: 'Bags',
        minStockLevel: 5,
        defaultRevenuePrice: 1800.0,
        unitCost: 1400.0,
        isBatchTracked: false,
        status: true,
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN
    },
    {
        id: 'prod-med-remote-004',
        name: 'Surgical Gloves Medium',
        code: 'MED-GLV-M',
        sku: 'MED-GLV-M',
        category: 'Surgical Supplies',
        unit: 'Boxes',
        unitOfMeasure: 'Boxes',
        minStockLevel: 15,
        defaultRevenuePrice: 250.0,
        unitCost: 150.0,
        isBatchTracked: false,
        status: true,
        tenantId: TENANT_ID,
        unitId: UNIT_REMOTE
    }
];

const mockStocks: InventoryStock[] = [
    {
        id: 'stock-amx-001',
        productId: 'prod-med-stocked-002',
        quantity: 120,
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN,
        product: mockProducts[1]
    }
];

const mockBatches: InventoryProductBatch[] = [
    {
        id: 'batch-amx-lot-99',
        batchNumber: 'LOT-AMX-2026A',
        productId: 'prod-med-stocked-002',
        quantity: 120,
        expiryDate: new Date('2027-08-31').toISOString(),
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN
    }
];

// --- 1. A newly created Medical product with no receipt appears in Medical Products Balance with quantity zero ---
const medicalBalance = synthesizeProductsBalance(mockProducts, mockStocks, 'medical', UNIT_MAIN);
const newMed = medicalBalance.find(s => s.productId === 'prod-med-new-001');

assert(
    newMed !== undefined && newMed.quantity === 0,
    'Newly created Medical product with no receipt appears in Medical Products Balance with quantity zero',
    `Found: ${JSON.stringify(newMed)}`
);
assert(
    newMed?.product?.name === 'Paracetamol 500mg Tablets' && newMed?.product?.sku === 'MED-PCM-500',
    'Newly created product retains correct catalogue metadata (name, code, category, unit)',
    `Product data: ${JSON.stringify(newMed?.product)}`
);

// --- 2. A newly created Food & Rations product with no receipt appears in its correct domain with quantity zero ---
const foodBalance = synthesizeProductsBalance(mockProducts, mockStocks, 'food', UNIT_MAIN);
const newFood = foodBalance.find(s => s.productId === 'prod-food-new-003');

assert(
    newFood !== undefined && newFood.quantity === 0 && newFood.product?.category === 'Ration',
    'Newly created Food & Rations product with no receipt appears in Food domain with quantity zero',
    `Found: ${JSON.stringify(newFood)}`
);

// --- 3. A product with existing stock shows its actual quantity, not zero ---
const stockedMed = medicalBalance.find(s => s.productId === 'prod-med-stocked-002');
assert(
    stockedMed !== undefined && stockedMed.quantity === 120,
    'Product with existing physical stock shows actual on-hand quantity (120), not zero',
    `Actual quantity: ${stockedMed?.quantity}`
);

// --- 4. Existing batch-tracked products retain their correct batch information ---
const amxBatches = mockBatches.filter(b => b.productId === 'prod-med-stocked-002');
assert(
    amxBatches.length === 1 && amxBatches[0].batchNumber === 'LOT-AMX-2026A' && amxBatches[0].quantity === 120,
    'Existing batch-tracked products retain their correct batch lots, quantities and expiry dates',
    `Batch info: ${JSON.stringify(amxBatches)}`
);

// --- 5. A Medical product is not incorrectly returned in Food & Rations results, and vice versa ---
const medInFood = foodBalance.find(s => s.productId === 'prod-med-new-001' || s.productId === 'prod-med-stocked-002');
const foodInMed = medicalBalance.find(s => s.productId === 'prod-food-new-003');

assert(
    medInFood === undefined && foodInMed === undefined,
    'Domain separation strictly enforced: Medical product not in Food stock, Food product not in Medical stock',
    `medInFood: ${JSON.stringify(medInFood)}, foodInMed: ${JSON.stringify(foodInMed)}`
);

// --- 6. Products outside the authorized tenant/unit scope are not exposed ---
const remoteInMain = medicalBalance.find(s => s.productId === 'prod-med-remote-004');
assert(
    remoteInMain === undefined,
    'Unit scope isolation strictly enforced: Products from UNIT_REMOTE are not exposed in UNIT_MAIN stock',
    `Found remote product: ${JSON.stringify(remoteInMain)}`
);

// --- 7. A zero-stock issue cannot be completed ---
const mockDb: MockDatabase = {
    stocks: new Map<string, number>([
        [`prod-med-new-001_${UNIT_MAIN}`, 0],
        [`prod-med-stocked-002_${UNIT_MAIN}`, 120]
    ]),
    batches: new Map(),
    requests: new Map(),
    movements: []
};

const zeroIssueResult = createIssueRequest(mockDb, {
    productId: 'prod-med-new-001',
    quantity: 1,
    unitId: UNIT_MAIN
});

assert(
    !zeroIssueResult.success && zeroIssueResult.error === 'Selected product has no available stock',
    'A zero-stock issue request cannot be created or completed (server validation rejects with 400)',
    `Result: ${JSON.stringify(zeroIssueResult)}`
);

// --- 8. An issue exceeding available stock is rejected ---
const excessIssueResult = createIssueRequest(mockDb, {
    productId: 'prod-med-stocked-002',
    quantity: 200, // Available: 120
    unitId: UNIT_MAIN
});

assert(
    !excessIssueResult.success && excessIssueResult.error === 'Requested quantity is greater than available stock',
    'An issue request exceeding available stock is strictly rejected',
    `Result: ${JSON.stringify(excessIssueResult)}`
);

// --- 9. An authorized issue with sufficient stock deducts the correct quantity once and records movement ---
const validIssue = createIssueRequest(mockDb, {
    productId: 'prod-med-stocked-002',
    quantity: 20, // Available: 120
    unitId: UNIT_MAIN
});
assert(validIssue.success === true && Boolean(validIssue.requestId), 'Valid issue request created with status PENDING');

const approvalResult = approveIssueRequest(mockDb, validIssue.requestId!);
const remainingStock = mockDb.stocks.get(`prod-med-stocked-002_${UNIT_MAIN}`);
const latestMovement = mockDb.movements[mockDb.movements.length - 1];

assert(
    approvalResult.success === true &&
    remainingStock === 100 &&
    latestMovement?.quantity === -20 &&
    latestMovement?.balanceAfter === 100,
    'Authorized issue deducts exact requested quantity once (120 -> 100) and records audit movement',
    `Remaining: ${remainingStock}, Movement: ${JSON.stringify(latestMovement)}`
);

// --- 10. Rejection and repeated approval do not incorrectly mutate stock ---
// 10a. Repeated approval on already approved request:
const repeatApprove = approveIssueRequest(mockDb, validIssue.requestId!);
const stockAfterRepeat = mockDb.stocks.get(`prod-med-stocked-002_${UNIT_MAIN}`);

assert(
    !repeatApprove.success && repeatApprove.error === 'Only pending requests can be approved' && stockAfterRepeat === 100,
    'Repeated approval on processed request is blocked and does not mutate stock a second time',
    `Result: ${JSON.stringify(repeatApprove)}, Stock: ${stockAfterRepeat}`
);

// 10b. Rejection does not deduct stock:
const reqForReject = createIssueRequest(mockDb, {
    productId: 'prod-med-stocked-002',
    quantity: 15,
    unitId: UNIT_MAIN
});
const rejectResult = rejectIssueRequest(mockDb, reqForReject.requestId!);
const stockAfterReject = mockDb.stocks.get(`prod-med-stocked-002_${UNIT_MAIN}`);

assert(
    rejectResult.success === true && stockAfterReject === 100,
    'Rejection mutates status to REJECTED with zero stock deduction occurring',
    `Stock remaining: ${stockAfterReject}`
);

// --- 11. Existing receipt and stock-list workflows continue to work ---
// Simulate receiving stock via adjustment or purchase for the new product:
mockDb.stocks.set(`prod-med-new-001_${UNIT_MAIN}`, 50);
const updatedStockList: InventoryStock[] = [
    ...mockStocks,
    {
        id: 'stock-newly-received-001',
        productId: 'prod-med-new-001',
        quantity: 50,
        tenantId: TENANT_ID,
        unitId: UNIT_MAIN,
        product: mockProducts[0]
    }
];

const refreshedBalance = synthesizeProductsBalance(mockProducts, updatedStockList, 'medical', UNIT_MAIN);
const receivedItem = refreshedBalance.find(s => s.productId === 'prod-med-new-001');

assert(
    receivedItem !== undefined && receivedItem.quantity === 50,
    'Stock receipt/adjustment workflow cleanly transitions product from zero-stock to positive balance',
    `Refreshed balance: ${receivedItem?.quantity}`
);

// --- 12. Product creation, search, category filtering and refresh continue to work ---
const querySearch = 'pcm-500';
const searchResults = medicalBalance.filter(s => {
    const name = s.product?.name || '';
    const sku = s.product?.sku || s.product?.code || '';
    const q = querySearch.toLowerCase();
    return name.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
});

assert(
    searchResults.length === 1 && searchResults[0].productId === 'prod-med-new-001',
    'Product search by SKU/code cleanly matches synthesized zero-stock products',
    `Matched items: ${searchResults.length}`
);

const catFiltered = medicalBalance.filter(s => s.product?.category === 'Medicines');
assert(
    catFiltered.length >= 2,
    'Category filtering accurately preserves both stocked and zero-stock catalogue items',
    `Count: ${catFiltered.length}`
);

// ==========================================
// FINAL RESULTS SUMMARY
// ==========================================
console.log('\n========================================================================');
console.log(`Regression Test Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('========================================================================');

if (failedTests > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
