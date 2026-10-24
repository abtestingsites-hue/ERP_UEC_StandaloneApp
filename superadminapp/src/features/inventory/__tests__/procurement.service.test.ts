/* eslint-disable @typescript-eslint/no-explicit-any */
import { inventoryService } from '../inventory.service';
import { api } from '../../../services/api';
import type {
    CreatePurchaseOrderPayload,
    CreateGoodsReceiptPayload,
    CreateSupplierReturnPayload,
    PurchaseOrder,
    GoodsReceiptNote,
    SupplierReturn
} from '../inventory.types';

// Clean browser/node agnostic assertions
function assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
        throw new Error(message || `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// Test runner tracking
let passedTests = 0;
let failedTests = 0;

const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passedTests++;
    } catch (err: unknown) {
        console.error(`❌ FAIL: ${name}`);
        console.error(err);
        failedTests++;
    }
};

// Store original api methods
const originalGet = api.get;
const originalPost = api.post;
const originalPatch = api.patch;

const restoreApi = () => {
    api.get = originalGet;
    api.post = originalPost;
    api.patch = originalPatch;
};

// ==========================================
// Test Suite: Procurement Types & API Client
// ==========================================
console.log('\n--- Running Procurement API Client & Serialization Tests ---\n');

await runTest('1. getPurchaseOrders: correctly serializes query params, headers, and unwraps pagination', async () => {
    let capturedUrl = '';
    let capturedConfig: any = null;

    api.get = (async (url: string, config?: any) => {
        capturedUrl = url;
        capturedConfig = config;
        return {
            data: {
                success: true,
                data: [
                    {
                        id: 'po-1',
                        orderNumber: 'PO-2026-0001',
                        vendorId: 'v-1',
                        status: 'DRAFT',
                        orderDate: '2026-10-15T00:00:00.000Z',
                        tenantId: 'tenant-1',
                        unitId: 'unit-1',
                        items: []
                    } as PurchaseOrder
                ],
                pagination: {
                    total: 1,
                    page: 2,
                    limit: 10,
                    totalPages: 1
                }
            }
        };
    }) as any;

    const result = await inventoryService.getPurchaseOrders({
        status: 'DRAFT',
        vendorId: 'v-1',
        page: 2,
        limit: 10,
        unitId: 'unit-xyz',
        domain: 'medical'
    });

    assertEqual(capturedUrl, '/purchase-orders');
    assertEqual(capturedConfig?.params?.status, 'DRAFT');
    assertEqual(capturedConfig?.params?.vendorId, 'v-1');
    assertEqual(capturedConfig?.params?.page, '2');
    assertEqual(capturedConfig?.params?.limit, '10');
    assertEqual(capturedConfig?.params?.domain, 'medical');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-xyz');
    assertEqual(result.data.length, 1);
    assertEqual(result.data[0].orderNumber, 'PO-2026-0001');
    assertEqual(result.pagination.total, 1);
    assertEqual(result.pagination.page, 2);
});

await runTest('2. getPurchaseOrders with allUnits: attaches allUnits=true parameter', async () => {
    let capturedConfig: any = null;

    api.get = (async (_url: string, config?: any) => {
        void _url;
        capturedConfig = config;
        return { data: { success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } } };
    }) as any;

    await inventoryService.getPurchaseOrders({ allUnits: true });
    assertEqual(capturedConfig?.params?.allUnits, 'true');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], undefined);
});

await runTest('3. createPurchaseOrder: serializes body and attaches unitId and domain', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;
    let capturedConfig: any = null;

    api.post = (async (url: string, body?: any, config?: any) => {
        capturedUrl = url;
        capturedBody = body;
        capturedConfig = config;
        return {
            data: {
                success: true,
                data: { id: 'po-new', orderNumber: 'PO-2026-0002', status: 'DRAFT' },
                message: 'Purchase order created successfully'
            }
        };
    }) as any;

    const payload: CreatePurchaseOrderPayload = {
        vendorId: 'vendor-123',
        orderDate: '2026-10-15',
        expectedDeliveryDate: '2026-10-25',
        notes: 'Priority delivery',
        items: [
            { productId: 'prod-1', orderedQuantity: 50, notes: 'Box of 10' },
            { productId: 'prod-2', orderedQuantity: 20 }
        ]
    };

    const created = await inventoryService.createPurchaseOrder(payload, 'unit-abc', 'medical');

    assertEqual(capturedUrl, '/purchase-orders');
    assertEqual(capturedBody.vendorId, 'vendor-123');
    assertEqual(capturedBody.items.length, 2);
    assertEqual(capturedBody.items[0].orderedQuantity, 50);
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-abc');
    assertEqual(capturedConfig?.params?.domain, 'medical');
    assertEqual(created.id, 'po-new');
});

await runTest('4. updatePurchaseOrder: sends PATCH to /purchase-orders/:id with unit header', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;
    let capturedConfig: any = null;

    api.patch = (async (url: string, body?: any, config?: any) => {
        capturedUrl = url;
        capturedBody = body;
        capturedConfig = config;
        return { data: { success: true, data: { id: 'po-edit', notes: 'Updated notes' } } };
    }) as any;

    const updated = await inventoryService.updatePurchaseOrder('po-edit', { notes: 'Updated notes' }, 'unit-1');

    assertEqual(capturedUrl, '/purchase-orders/po-edit');
    assertEqual(capturedBody.notes, 'Updated notes');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-1');
    assertEqual(updated.id, 'po-edit');
});

await runTest('5. orderPurchaseOrder: posts to /purchase-orders/:id/order', async () => {
    let capturedUrl = '';
    let capturedConfig: any = null;

    api.post = (async (url: string, _body?: any, config?: any) => {
        void _body;
        capturedUrl = url;
        capturedConfig = config;
        return { data: { success: true, data: { id: 'po-10', status: 'ORDERED' } } };
    }) as any;

    const ordered = await inventoryService.orderPurchaseOrder('po-10', 'unit-test');

    assertEqual(capturedUrl, '/purchase-orders/po-10/order');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-test');
    assertEqual(ordered.status, 'ORDERED');
});

await runTest('6. cancelPurchaseOrder: posts to /purchase-orders/:id/cancel with reason', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    api.post = (async (url: string, body?: any) => {
        capturedUrl = url;
        capturedBody = body;
        return { data: { success: true, data: { id: 'po-20', status: 'CANCELLED' } } };
    }) as any;

    const cancelled = await inventoryService.cancelPurchaseOrder('po-20', { reason: 'Supplier out of stock' }, 'unit-test');

    assertEqual(capturedUrl, '/purchase-orders/po-20/cancel');
    assertEqual(capturedBody.reason, 'Supplier out of stock');
    assertEqual(cancelled.status, 'CANCELLED');
});

await runTest('7. createGoodsReceipt: posts to /purchase-orders/:id/grn and attaches idempotency in body', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;
    let capturedConfig: any = null;

    api.post = (async (url: string, body?: any, config?: any) => {
        capturedUrl = url;
        capturedBody = body;
        capturedConfig = config;
        return {
            data: {
                success: true,
                data: {
                    id: 'grn-1',
                    grnNumber: 'GRN-2026-0001',
                    purchaseOrderId: 'po-30',
                    idempotencyKey: 'idemp-uuid-123'
                } as GoodsReceiptNote
            }
        };
    }) as any;

    const grnPayload: CreateGoodsReceiptPayload = {
        receivedDate: '2026-10-15',
        deliveryChallanNo: 'DC-8842',
        supplierInvoiceNo: 'INV-9921',
        idempotencyKey: 'idemp-uuid-123',
        items: [
            {
                purchaseOrderItemId: 'poi-1',
                receivedQuantity: 50,
                acceptedQuantity: 48,
                rejectedQuantity: 2,
                batchNumber: 'BATCH-2026-A',
                expiryDate: '2028-10-15'
            }
        ]
    };

    const grn = await inventoryService.createGoodsReceipt('po-30', grnPayload, 'unit-7', 'medical');

    assertEqual(capturedUrl, '/purchase-orders/po-30/grn');
    assertEqual(capturedBody.idempotencyKey, 'idemp-uuid-123');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-7');
    assertEqual(capturedConfig?.params?.domain, 'medical');
    assertEqual(grn.grnNumber, 'GRN-2026-0001');
});

await runTest('8. getGoodsReceipts: returns goodsReceipts list response envelope correctly', async () => {
    api.get = (async () => {
        return {
            data: {
                success: true,
                data: {
                    goodsReceipts: [
                        {
                            id: 'grn-55',
                            grnNumber: 'GRN-55',
                            purchaseOrderId: 'po-55',
                            totalReceivedQuantity: 100,
                            totalAcceptedQuantity: 95,
                            totalRejectedQuantity: 5
                        }
                    ],
                    total: 1,
                    page: 1,
                    limit: 20,
                    totalPages: 1
                }
            }
        };
    }) as any;

    const res = await inventoryService.getGoodsReceipts({ purchaseOrderId: 'po-55' });

    assertEqual(res.goodsReceipts.length, 1);
    assertEqual(res.goodsReceipts[0].totalReceivedQuantity, 100);
    assertEqual(res.total, 1);
});

await runTest('9. createSupplierReturn: posts to /stock/supplier-returns with idempotency key', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;
    let capturedConfig: any = null;

    api.post = (async (url: string, body?: any, config?: any) => {
        capturedUrl = url;
        capturedBody = body;
        capturedConfig = config;
        return {
            data: {
                success: true,
                data: {
                    id: 'ret-1',
                    returnNumber: 'RET-2026-0001',
                    totalQuantity: 10,
                    status: 'COMPLETED'
                } as SupplierReturn
            }
        };
    }) as any;

    const returnPayload: CreateSupplierReturnPayload = {
        vendorId: 'vendor-99',
        reason: 'Damaged during transit',
        idempotencyKey: 'ret-idemp-999',
        items: [
            {
                productId: 'prod-9',
                returnQuantity: 10,
                reason: 'Leakage'
            }
        ]
    };

    const result = await inventoryService.createSupplierReturn(returnPayload, 'unit-ret', 'medical');

    assertEqual(capturedUrl, '/stock/supplier-returns');
    assertEqual(capturedBody.vendorId, 'vendor-99');
    assertEqual(capturedBody.idempotencyKey, 'ret-idemp-999');
    assertEqual(capturedConfig?.headers?.['x-unit-id'], 'unit-ret');
    assertEqual(result.returnNumber, 'RET-2026-0001');
    assertEqual(result.status, 'COMPLETED');
});

await runTest('10. getPurchases: preserves legacy /purchase endpoint call without regressions', async () => {
    let capturedUrl = '';

    api.get = (async (url: string) => {
        capturedUrl = url;
        return {
            data: {
                data: [
                    { id: 'legacy-p1', productName: 'Legacy Bandage', quantity: 10, status: 'Received' }
                ]
            }
        };
    }) as any;

    const legacyPurchases = await inventoryService.getPurchases();

    assertEqual(capturedUrl, '/purchase');
    assertEqual(legacyPurchases.length, 1);
    assertEqual(legacyPurchases[0].id, 'legacy-p1');
});

// Restore original API methods
restoreApi();

console.log(`\n--- Test Results: ${passedTests} Passed, ${failedTests} Failed ---\n`);

if (failedTests > 0) {
    throw new Error(`${failedTests} test(s) failed`);
}
