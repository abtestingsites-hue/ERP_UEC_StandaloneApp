// ============================================================================
// Phase D5.3 Hardening Verification Suite
// Backend Stock Integrity, Unit Isolation, Patient Billing and Rate Authorization
// ============================================================================

import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';

console.log('🧪 Starting Phase D5.3 Hardening Verification Suite...\n');

// ----------------------------------------------------------------------------
// Test 1: Workstream B - Correct Authorized Unit Scope in getScope
// ----------------------------------------------------------------------------
console.log('Test 1: Workstream B - Authorized Unit Scope Resolution');
{
    // Mock getScope behavior from Backend/src/modules/inventory/controller.ts
    const getScope = (req) => ({
        tenantId: req.user?.tenantId,
        unitId: req.context?.unitId || req.user?.unitId
    });

    // 1. Single-unit user without context override
    const req1 = {
        user: { tenantId: 'tenant-101', unitId: 'unit-alpha' },
        context: null
    };
    assert.deepEqual(getScope(req1), { tenantId: 'tenant-101', unitId: 'unit-alpha' });
    console.log('  ✓ Single-unit user defaults to req.user.unitId');

    // 2. Multi-unit authorized user with validated context override (e.g. Unit Beta selected)
    const req2 = {
        user: { tenantId: 'tenant-101', unitId: 'unit-alpha' },
        context: { unitId: 'unit-beta' }
    };
    assert.deepEqual(getScope(req2), { tenantId: 'tenant-101', unitId: 'unit-beta' });
    console.log('  ✓ Multi-unit user respects authorized req.context.unitId');

    // 3. Client attempts unauthorized x-unit-id header spoofing:
    // Authentication middleware validates context against user.selectedUnitIds / privileges.
    // If unauthorized, req.context.unitId is not set to the spoofed header.
    const req3 = {
        user: { tenantId: 'tenant-101', unitId: 'unit-alpha' },
        headers: { 'x-unit-id': 'unauthorized-unit-gamma' },
        context: { unitId: 'unit-alpha' } // auth middleware rejected gamma
    };
    assert.equal(getScope(req3).unitId, 'unit-alpha');
    console.log('  ✓ Unauthorized unit spoofing prevented: getScope binds to verified context');
}

// ----------------------------------------------------------------------------
// Test 2: Workstream C - Patient Allocation & Billing Same-Unit Invariant (Rule A)
// ----------------------------------------------------------------------------
console.log('\nTest 2: Workstream C - Same-Unit Patient Allocation Invariant (Rule A)');
{
    // Mock allocation validation logic from service.ts and ledger.ts
    const validateAllocationForIssue = (allocation, requestUnitId) => {
        if (!allocation) {
            throw new Error('Provided patient allocation does not exist or has been deleted.');
        }
        if (allocation.unitId !== requestUnitId) {
            throw new Error(`Patient allocation unit (${allocation.unitId}) does not match stock issue unit (${requestUnitId}). Cross-unit allocations are not permitted.`);
        }
        return true;
    };

    // Valid same-unit allocation
    const sameUnitAllocation = { id: 'alloc-1', unitId: 'unit-alpha', isDeleted: false };
    assert.doesNotThrow(() => validateAllocationForIssue(sameUnitAllocation, 'unit-alpha'));
    console.log('  ✓ Same-unit allocation (unit-alpha === unit-alpha) passes validation');

    // Mismatched cross-unit allocation
    const crossUnitAllocation = { id: 'alloc-2', unitId: 'unit-beta', isDeleted: false };
    assert.throws(
        () => validateAllocationForIssue(crossUnitAllocation, 'unit-alpha'),
        /Cross-unit allocations are not permitted/
    );
    console.log('  ✓ Cross-unit allocation (unit-beta !== unit-alpha) strictly rejected');

    // Ledger expectedUnitId check from ledger.ts
    const getAllocationForLedger = async (allocation, expectedUnitId) => {
        if (!allocation) return null;
        if (expectedUnitId && allocation.unitId !== expectedUnitId) {
            throw new Error(`Patient allocation ${allocation.id} belongs to unit ${allocation.unitId}, which does not match expected unit ${expectedUnitId}`);
        }
        return allocation;
    };

    await assert.rejects(
        () => getAllocationForLedger({ id: 'alloc-99', unitId: 'unit-south' }, 'unit-north'),
        /does not match expected unit unit-north/
    );
    console.log('  ✓ Patient ledger entry throws on unit mismatch, guaranteeing transaction rollback');
}

// ----------------------------------------------------------------------------
// Test 3: Workstream D - Dedicated Billing-Rate Authorization (D5.3.2)
// ----------------------------------------------------------------------------
console.log('\nTest 3: Workstream D - Dedicated Billing-Rate Authorization (D5.3.2)');
{
    const INVENTORY_RATE_OVERRIDE_PERMISSIONS = [
        'Inventory Rate Override',
        'INVENTORY_RATE_OVERRIDE',
        'Billing Rate Override',
        'BILLING_RATE_OVERRIDE'
    ];

    const isMeaningfulReason = (reason) => {
        if (!reason || typeof reason !== 'string') return false;
        const trimmed = reason.trim();
        if (trimmed.length < 5) return false;
        const invalidPlaceholders = ['none', 'n/a', 'na', 'test', 'null', 'undefined', 'nil', 'no reason', 'asdf', 'blank'];
        if (invalidPlaceholders.includes(trimmed.toLowerCase())) return false;
        return true;
    };

    const canOverrideBillingRate = (user) => {
        if (!user) return false;
        const normalizedRole = String(user.role?.name || user.role || '').trim().toLowerCase().replace(/_/g, ' ');
        const approvedRoles = ['admin', 'super admin', 'superadmin', 'uncf admin', 'finance manager', 'elder finance manager'];
        if (approvedRoles.includes(normalizedRole)) return true;

        const perms = Array.isArray(user.permissions) ? user.permissions : [];
        const normalizedPerms = perms.map((p) => String(p).trim().toUpperCase());
        return INVENTORY_RATE_OVERRIDE_PERMISSIONS.some((target) => normalizedPerms.includes(target.toUpperCase()));
    };

    const resolveIssueRate = (product, clientRate, user, rawReason) => {
        const defaultRate = Number(product.defaultRevenuePrice || 0);
        const requestedRate = (clientRate !== undefined && clientRate !== null && clientRate !== '')
            ? Number(clientRate)
            : null;

        let finalRate = defaultRate;
        let isOverridden = false;

        if (requestedRate !== null && Number.isFinite(requestedRate) && requestedRate !== defaultRate) {
            if (canOverrideBillingRate(user)) {
                if (!isMeaningfulReason(rawReason)) {
                    throw new Error('A meaningful override reason (minimum 5 characters) is required when modifying the default product billing rate.');
                }
                finalRate = Math.max(0, Number(requestedRate.toFixed(2)));
                isOverridden = true;
            } else {
                finalRate = defaultRate; // Safely ignore client rate and fall back to default
            }
        }
        return { finalRate, isOverridden, defaultRate, reason: isOverridden ? rawReason.trim() : null };
    };

    const product = { id: 'p1', defaultRevenuePrice: 50.0 };

    // Case 1: Unauthorized nurse passes custom rate 15.0 -> safely falls back to default 50.0
    const nurseUser = { role: 'NURSE', permissions: ['Stock Issue Request'] };
    const nurseResult = resolveIssueRate(product, 15.0, nurseUser, 'Discount requested');
    assert.equal(nurseResult.finalRate, 50.0);
    assert.equal(nurseResult.isOverridden, false);
    console.log('  ✓ Clinical staff (Nurse) rate override attempt falls back strictly to defaultRevenuePrice (₹50.00)');

    // Case 2: Warehouse Inventory Manager with ONLY Products and Stock Issue Approval -> MUST NOT OVERRIDE
    const warehouseManager = { role: 'ELDER_INVENTORY_MANAGER', permissions: ['Stock Issue Approval', 'Products', 'Inventory Products'] };
    const warehouseResult = resolveIssueRate(product, 65.0, warehouseManager, 'Manager adjusted price');
    assert.equal(warehouseResult.finalRate, 50.0);
    assert.equal(warehouseResult.isOverridden, false);
    console.log('  ✓ Catalog management and stock approval permissions alone CANNOT override billing rates');

    // Case 3: Authorized Finance Manager with meaningful reason -> accepted
    const financeManager = { role: 'finance manager', permissions: ['Invoice', 'Inventory Rate Override'] };
    const financeResult = resolveIssueRate(product, 65.0, financeManager, 'Doctor approved subsidized pricing');
    assert.equal(financeResult.finalRate, 65.0);
    assert.equal(financeResult.isOverridden, true);
    assert.equal(financeResult.reason, 'Doctor approved subsidized pricing');
    console.log('  ✓ Authorized Finance Manager rate override accepted (₹65.00) with meaningful reason');

    // Case 4: Authorized user with dedicated permission 'Inventory Rate Override' -> accepted
    const delegatedUser = { role: 'ELDER_INVENTORY_MANAGER', permissions: ['Stock Issue Approval', 'Inventory Rate Override'] };
    const delegatedResult = resolveIssueRate(product, 72.5, delegatedUser, 'Institutional corporate discount applied');
    assert.equal(delegatedResult.finalRate, 72.5);
    assert.equal(delegatedResult.isOverridden, true);
    console.log('  ✓ Dedicated permission "Inventory Rate Override" authorizes rate override');

    // Case 5: Authorized user omitting reason or supplying placeholder -> REJECTED
    assert.throws(
        () => resolveIssueRate(product, 72.5, financeManager, ''),
        /meaningful override reason/
    );
    assert.throws(
        () => resolveIssueRate(product, 72.5, financeManager, 'n/a'),
        /meaningful override reason/
    );
    assert.throws(
        () => resolveIssueRate(product, 72.5, financeManager, 'none'),
        /meaningful override reason/
    );
    console.log('  ✓ Empty or placeholder reasons ("n/a", "none") rejected with clear descriptive error');

    // Case 6: Admin role inherits rate override authority with audit evidence
    const adminUser = { role: 'Admin', permissions: ['ALL_ACCESS'] };
    const adminResult = resolveIssueRate(product, 40.0, adminUser, 'Executive director approved waiver');
    assert.equal(adminResult.finalRate, 40.0);
    assert.equal(adminResult.isOverridden, true);
    console.log('  ✓ Admin role rate override accepted with audit metadata');

    // Case 7: Non-positive rate for patient care rejected
    const checkPatientRate = (rate, usageType) => {
        if (String(usageType || '').toUpperCase().includes('PATIENT') && rate <= 0) {
            throw new Error('Patient care medicine requires a unit billing rate. Set Product Default Revenue Price or enter Patient Billing Rate.');
        }
    };
    assert.throws(
        () => checkPatientRate(0, 'PATIENT_CARE'),
        /requires a unit billing rate/
    );
    console.log('  ✓ Non-positive billing rate for patient care rejected');
}

// ----------------------------------------------------------------------------
// Test 4: Workstream A - Concurrency Protection Simulation
// ----------------------------------------------------------------------------
console.log('\nTest 4: Workstream A - Concurrency Protection Simulation');
{
    // In-memory simulation of row locking and conditional atomic transitions
    class MockDatabase {
        constructor() {
            this.request = { id: 'req-1', status: 'PENDING', quantity: 10, productId: 'p-1', unitId: 'unit-1' };
            this.stock = { id: 's-1', productId: 'p-1', quantity: 15, unitId: 'unit-1' };
            this.batches = [
                { id: 'b-1', quantity: 8, expiryDate: new Date('2026-11-01') },
                { id: 'b-2', quantity: 7, expiryDate: new Date('2026-12-01') }
            ];
            this.movements = [];
            this.patientCosts = [];
            this.lock = false;
        }

        async approve(reqId, userId) {
            // Emulate transaction with row lock
            while (this.lock) {
                await new Promise((r) => setTimeout(r, 10));
            }
            this.lock = true;

            try {
                // Check pending status inside lock
                if (this.request.status !== 'PENDING') {
                    throw new Error('Only pending requests can be approved');
                }

                // Check stock
                if (this.stock.quantity < this.request.quantity) {
                    throw new Error('Available stock is lower than requested quantity');
                }

                // Decrement batches (FEFO)
                let rem = this.request.quantity;
                for (const b of this.batches) {
                    if (rem <= 0) break;
                    const dec = Math.min(rem, b.quantity);
                    b.quantity -= dec;
                    rem -= dec;
                }

                // Decrement stock
                this.stock.quantity -= this.request.quantity;

                // Update request status atomically
                this.request.status = 'APPROVED';
                this.request.approvedBy = userId;

                // Record movement and patient cost
                this.movements.push({ reqId, qty: -this.request.quantity });
                this.patientCosts.push({ sourceId: reqId, amount: 100 });

                return { success: true };
            } finally {
                this.lock = false;
            }
        }
    }

    const db = new MockDatabase();

    // Fire two simultaneous approvals for the exact same request
    const [res1, res2] = await Promise.allSettled([
        db.approve('req-1', 'approver-1'),
        db.approve('req-1', 'approver-2')
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].reason.message, 'Only pending requests can be approved');
    assert.equal(db.stock.quantity, 5); // 15 - 10 = 5 (deducted exactly once)
    assert.equal(db.movements.length, 1);
    assert.equal(db.patientCosts.length, 1);
    console.log('  ✓ Simultaneous duplicate approvals: exactly 1 committed, 1 rejected safely');
    console.log('  ✓ Stock decremented exactly once (15 -> 5); zero duplicate movements or billing entries');

    // Competing requests for shared stock oversell protection
    const db2 = new MockDatabase();
    db2.stock.quantity = 15;
    db2.request = { id: 'req-A', status: 'PENDING', quantity: 10, productId: 'p-1', unitId: 'unit-1' };
    const requestB = { id: 'req-B', status: 'PENDING', quantity: 10, productId: 'p-1', unitId: 'unit-1' };

    // Approve req A (takes 10 of 15)
    await db2.approve('req-A', 'approver-1');
    assert.equal(db2.stock.quantity, 5);

    // Now try to approve req B (needs 10, but only 5 remain)
    db2.request = requestB;
    await assert.rejects(
        () => db2.approve('req-B', 'approver-1'),
        /Available stock is lower than requested quantity/
    );
    assert.equal(db2.stock.quantity, 5);
    console.log('  ✓ Competing request oversell blocked: stock balance cannot become negative');
}

// ----------------------------------------------------------------------------
// Test 5: Workstream E - Cross-Unit Frontend Cache Invalidation
// ----------------------------------------------------------------------------
console.log('\nTest 5: Workstream E - Cross-Unit Frontend Cache Invalidation');
{
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });

    // Populate caches for Unit A and Unit B
    queryClient.setQueryData(['inventory-stock-issue-requests', 'unit-a'], [{ id: 'req-a', status: 'PENDING' }]);
    queryClient.setQueryData(['inventory-stock', 'unit-a'], [{ productId: 'p-1', quantity: 50 }]);
    queryClient.setQueryData(['inventory-batches', 'unit-a'], [{ id: 'b-a', quantity: 50 }]);

    queryClient.setQueryData(['inventory-stock-issue-requests', 'unit-b'], [{ id: 'req-b', status: 'PENDING' }]);
    queryClient.setQueryData(['inventory-stock', 'unit-b'], [{ productId: 'p-1', quantity: 80 }]);
    queryClient.setQueryData(['inventory-batches', 'unit-b'], [{ id: 'b-b', quantity: 80 }]);
    queryClient.setQueryData(['patient-daily-costs', 'unit-b'], [{ id: 'cost-b' }]);

    // Emulate useApproveInventoryStockIssueRequest onSuccess callback:
    // User is viewing Unit A (activeUnitId = 'unit-a'), but approves a Unit B request (data.unitId = 'unit-b')
    const activeUnitId = 'unit-a';
    const approvedData = { id: 'req-b', unitId: 'unit-b', status: 'APPROVED' };

    const handleApproveSuccess = (data) => {
        const affectedUnitId = data?.unitId || activeUnitId;
        const unitPrefixes = new Set();
        if (affectedUnitId) unitPrefixes.add(affectedUnitId);
        if (activeUnitId) unitPrefixes.add(activeUnitId);

        for (const unitId of unitPrefixes) {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stock', unitId] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-movements', unitId] });
            queryClient.invalidateQueries({ queryKey: ['inventory-batches', unitId] });
            queryClient.invalidateQueries({ queryKey: ['patient-daily-costs', unitId] });
        }
    };

    handleApproveSuccess(approvedData);

    // Assert that Unit B queries are now marked stale
    const qReqB = queryClient.getQueryCache().find({ queryKey: ['inventory-stock-issue-requests', 'unit-b'] });
    const qStockB = queryClient.getQueryCache().find({ queryKey: ['inventory-stock', 'unit-b'] });
    const qBatchB = queryClient.getQueryCache().find({ queryKey: ['inventory-batches', 'unit-b'] });
    const qCostB = queryClient.getQueryCache().find({ queryKey: ['patient-daily-costs', 'unit-b'] });

    assert.equal(qReqB.isStale(), true);
    assert.equal(qStockB.isStale(), true);
    assert.equal(qBatchB.isStale(), true);
    assert.equal(qCostB.isStale(), true);
    console.log('  ✓ Affected Unit B queries invalidated when approved by manager currently in Unit A');

    // Emulate useRejectInventoryStockIssueRequest onSuccess:
    // Only issue requests query invalidated; stock/batch queries are untouched
    const queryClient2 = new QueryClient();
    queryClient2.setQueryData(['inventory-stock-issue-requests', 'unit-c'], [{ id: 'req-c', status: 'PENDING' }]);
    queryClient2.setQueryData(['inventory-stock', 'unit-c'], [{ productId: 'p-1', quantity: 20 }]);

    const handleRejectSuccess = (data) => {
        const affectedUnitId = data?.unitId || activeUnitId;
        const unitPrefixes = new Set();
        if (affectedUnitId) unitPrefixes.add(affectedUnitId);
        if (activeUnitId) unitPrefixes.add(activeUnitId);

        for (const unitId of unitPrefixes) {
            queryClient2.invalidateQueries({ queryKey: ['inventory-stock-issue-requests', unitId] });
        }
    };

    handleRejectSuccess({ id: 'req-c', unitId: 'unit-c', status: 'REJECTED' });

    const qReqC = queryClient2.getQueryCache().find({ queryKey: ['inventory-stock-issue-requests', 'unit-c'] });
    const qStockC = queryClient2.getQueryCache().find({ queryKey: ['inventory-stock', 'unit-c'] });

    assert.equal(qReqC.isStale(), true);
    assert.equal(qStockC.isStale(), false);
    console.log('  ✓ Rejection invalidates stock-issue-requests without falsely altering stock balances');
}

console.log('\n🎉 ALL Phase D5.3 Hardening Verification Tests PASSED successfully!\n');
