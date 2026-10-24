import { useEffect, useState, useCallback } from 'react';
import {
    ClipboardCheck,
    Plus,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    X
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    PhysicalAudit,
    CreatePhysicalAuditPayload,
    SubmitPhysicalAuditCountPayload,
    InventoryProduct,
    InventoryProductBatch
} from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function PhysicalAuditsTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [audits, setAudits] = useState<PhysicalAudit[]>([]);
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [batches, setBatches] = useState<InventoryProductBatch[]>([]);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal: Initiate Audit
    const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
    const [initiateData, setInitiateData] = useState<CreatePhysicalAuditPayload>({
        productId: '',
        batchId: '',
        notes: ''
    });
    const [initiateSubmitting, setInitiateSubmitting] = useState(false);
    const [initiateError, setInitiateError] = useState<string | null>(null);

    // Modal: Record Physical Count
    const [countTargetAudit, setCountTargetAudit] = useState<PhysicalAudit | null>(null);
    const [physicalQtyInput, setPhysicalQtyInput] = useState<number>(0);
    const [countReasonInput, setCountReasonInput] = useState<string>('');
    const [countNotesInput, setCountNotesInput] = useState<string>('');
    const [countSubmitting, setCountSubmitting] = useState(false);
    const [countError, setCountError] = useState<string | null>(null);

    // Modal: Reconcile confirmation
    const [reconcileTargetAudit, setReconcileTargetAudit] = useState<PhysicalAudit | null>(null);
    const [reconcileNotes, setReconcileNotes] = useState<string>('');
    const [reconcileSubmitting, setReconcileSubmitting] = useState(false);
    const [reconcileError, setReconcileError] = useState<string | null>(null);

    const fetchAudits = useCallback(async () => {
        try {
            const [auditList, prodList, batchList] = await Promise.all([
                inventoryService.getPhysicalAudits({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined
                }),
                inventoryService.getProducts({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }),
                inventoryService.getBatches({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain })
            ]);
            setAudits(auditList);
            setProducts(prodList);
            setBatches(batchList);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load physical audits:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load physical audits.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain, statusFilter]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchAudits();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchAudits]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchAudits();
    };

    const handleProductChange = (productId: string) => {
        const prodBatches = batches.filter(b => b.productId === productId);
        const autoBatchId = prodBatches.length === 1 ? prodBatches[0].id : '';
        setInitiateData({
            ...initiateData,
            productId,
            batchId: autoBatchId
        });
    };

    // Handle Initiate
    const handleInitiateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initiateData.productId) {
            setInitiateError('Product selection is required.');
            return;
        }

        const selectedProd = products.find(p => p.id === initiateData.productId);
        if (selectedProd?.isBatchTracked && !initiateData.batchId) {
            setInitiateError('Batch selection is required for batch-tracked product physical count.');
            return;
        }

        setInitiateSubmitting(true);
        setInitiateError(null);
        try {
            await inventoryService.createPhysicalAudit(initiateData, activeUnitId, activeDomain);
            setIsInitiateModalOpen(false);
            setSuccessMessage('Physical stock audit initiated successfully.');
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchAudits();
        } catch (err: unknown) {
            console.error('Failed to initiate physical audit:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to initiate audit.';
            setInitiateError(message);
        } finally {
            setInitiateSubmitting(false);
        }
    };

    // Open Record Count
    const openCountModal = (audit: PhysicalAudit) => {
        setCountTargetAudit(audit);
        setPhysicalQtyInput(audit.physicalQuantity ?? audit.systemQuantityAtCount);
        setCountReasonInput(audit.reason || '');
        setCountNotesInput(audit.notes || '');
        setCountError(null);
    };

    // Handle Submit Count
    const handleSubmitCount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!countTargetAudit) return;

        if (physicalQtyInput < 0) {
            setCountError('Physical count cannot be negative.');
            return;
        }

        const calculatedVariance = physicalQtyInput - countTargetAudit.systemQuantityAtCount;
        if (calculatedVariance !== 0 && (!countReasonInput || countReasonInput.trim().length < 3)) {
            setCountError('A variance explanation reason (minimum 3 characters) is strictly required when physical count differs from system count.');
            return;
        }

        setCountSubmitting(true);
        setCountError(null);
        try {
            const payload: SubmitPhysicalAuditCountPayload = {
                physicalQuantity: Number(physicalQtyInput),
                reason: countReasonInput.trim() || undefined,
                notes: countNotesInput.trim() || undefined
            };

            await inventoryService.submitPhysicalAuditCount(countTargetAudit.id, payload, activeUnitId);
            setCountTargetAudit(null);
            setSuccessMessage(`Physical count recorded for audit ${countTargetAudit.auditNumber}.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchAudits();
        } catch (err: unknown) {
            console.error('Failed to record count:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to record count.';
            setCountError(message);
        } finally {
            setCountSubmitting(false);
        }
    };

    // Open Reconcile
    const openReconcileModal = (audit: PhysicalAudit) => {
        setReconcileTargetAudit(audit);
        setReconcileNotes('');
        setReconcileError(null);
    };

    // Handle Reconcile
    const handleReconcileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reconcileTargetAudit) return;

        setReconcileSubmitting(true);
        setReconcileError(null);
        try {
            await inventoryService.reconcilePhysicalAudit(
                reconcileTargetAudit.id,
                { notes: reconcileNotes.trim() || undefined },
                activeUnitId
            );
            setReconcileTargetAudit(null);
            setSuccessMessage(`Physical audit ${reconcileTargetAudit.auditNumber} successfully reconciled with live ledger balances.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchAudits();
        } catch (err: unknown) {
            console.error('Failed to reconcile physical audit:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to reconcile audit.';
            setReconcileError(message);
        } finally {
            setReconcileSubmitting(false);
        }
    };

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Physical Stock Audits</h2>
                </div>
                <div className="toolbar-actions">
                    <button
                        className="inv-btn inv-btn--primary"
                        onClick={() => {
                            setInitiateData({ productId: '', notes: '' });
                            setInitiateError(null);
                            setIsInitiateModalOpen(true);
                        }}
                    >
                        <Plus size={15} />
                        <span>Initiate Audit</span>
                    </button>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Audits"
                    >
                        <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="inv-alert inv-alert--success" role="alert">
                    <CheckCircle2 size={16} />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="inv-alert inv-alert--danger" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter by Status */}
            <div className="inv-filters-bar">
                <div className="inv-filter-group">
                    <label htmlFor="audit-filter-select" className="sr-only">Filter Status</label>
                    <select
                        id="audit-filter-select"
                        className="inv-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Audit Statuses</option>
                        <option value="DRAFT">DRAFT (Awaiting Count)</option>
                        <option value="COUNTED">COUNTED (Ready for Reconciliation)</option>
                        <option value="RECONCILED">RECONCILED (Stock Adjusted)</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>
            </div>

            {/* Audits Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading physical stock audits...</p>
                    </div>
                ) : audits.length === 0 ? (
                    <div className="inv-empty-state">
                        <ClipboardCheck size={32} />
                        <h4>No physical audits found</h4>
                        <p>Initiate a new physical audit to verify warehouse counts against system balances.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Audit #</th>
                                    <th>Product</th>
                                    <th>Snapshot Qty</th>
                                    <th>Physical Count</th>
                                    <th>Variance</th>
                                    <th>Status</th>
                                    <th>Initiated Date</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audits.map((a) => {
                                    const variance = a.varianceQuantity !== null && a.varianceQuantity !== undefined
                                        ? a.varianceQuantity
                                        : a.physicalQuantity !== null && a.physicalQuantity !== undefined
                                        ? a.physicalQuantity - a.systemQuantityAtCount
                                        : null;

                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <strong>{a.auditNumber}</strong>
                                            </td>
                                            <td>
                                                <strong>{a.product?.name || a.productId}</strong>
                                                {a.batch?.batchNumber && (
                                                    <span className="inv-subtext">Batch: {a.batch.batchNumber}</span>
                                                )}
                                            </td>
                                            <td>{a.systemQuantityAtCount} units</td>
                                            <td>
                                                {a.physicalQuantity !== null && a.physicalQuantity !== undefined ? (
                                                    <strong>{a.physicalQuantity} units</strong>
                                                ) : (
                                                    <span className="inv-cost-missing">Pending Count</span>
                                                )}
                                            </td>
                                            <td>
                                                {variance === null ? (
                                                    '—'
                                                ) : variance === 0 ? (
                                                    <span className="inv-badge inv-badge--success">0 (Exact)</span>
                                                ) : variance < 0 ? (
                                                    <span className="inv-qty-minus">{variance} (Shortage)</span>
                                                ) : (
                                                    <span className="inv-qty-plus">+{variance} (Surplus)</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`inv-badge inv-badge--${
                                                    a.status === 'RECONCILED' ? 'success' :
                                                    a.status === 'COUNTED' ? 'info' :
                                                    a.status === 'DRAFT' ? 'warning' : 'neutral'
                                                }`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td>
                                                <time dateTime={a.createdAt}>
                                                    {new Date(a.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </time>
                                            </td>
                                            <td className="text-right">
                                                <div className="inv-table-actions">
                                                    {a.status === 'DRAFT' && (
                                                        <button
                                                            className="inv-btn inv-btn--primary inv-btn--sm"
                                                            onClick={() => openCountModal(a)}
                                                        >
                                                            Record Count
                                                        </button>
                                                    )}
                                                    {a.status === 'COUNTED' && (
                                                        <>
                                                            <button
                                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                                onClick={() => openCountModal(a)}
                                                            >
                                                                Update Count
                                                            </button>
                                                            <button
                                                                className="inv-btn inv-btn--primary inv-btn--sm"
                                                                onClick={() => openReconcileModal(a)}
                                                            >
                                                                Reconcile
                                                            </button>
                                                        </>
                                                    )}
                                                    {a.status === 'RECONCILED' && (
                                                        <span className="inv-badge inv-badge--success">Reconciled</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Initiate Audit Modal */}
            {isInitiateModalOpen && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">PHYSICAL VERIFICATION</span>
                                <h3>Initiate Stock Count</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setIsInitiateModalOpen(false)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {initiateError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertCircle size={15} />
                                <span>{initiateError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleInitiateSubmit}>
                            <div className="inv-form-group">
                                <label>Target Product *</label>
                                <select
                                    required
                                    value={initiateData.productId}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                >
                                    <option value="">Select product to audit...</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.sku ? `(${p.sku})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(() => {
                                const prod = products.find(p => p.id === initiateData.productId);
                                if (!prod?.isBatchTracked) return null;
                                const prodBatches = batches.filter(b => b.productId === initiateData.productId);
                                return (
                                    <div className="inv-form-group">
                                        <label>Target Batch *</label>
                                        <select
                                            required
                                            value={initiateData.batchId || ''}
                                            onChange={(e) => setInitiateData({ ...initiateData, batchId: e.target.value })}
                                        >
                                            <option value="">Select batch to audit...</option>
                                            {prodBatches.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.batchNumber} (Current: {b.quantity} units, Exp: {new Date(b.expiryDate).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })()}

                            <div className="inv-form-group">
                                <label>Audit Notes</label>
                                <textarea
                                    rows={2}
                                    value={initiateData.notes || ''}
                                    onChange={(e) => setInitiateData({ ...initiateData, notes: e.target.value })}
                                    placeholder="e.g. Q4 Scheduled Shelf Audit"
                                />
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsInitiateModalOpen(false)}
                                    disabled={initiateSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={initiateSubmitting}
                                >
                                    {initiateSubmitting ? 'Initiating...' : 'Initiate Audit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Count Modal */}
            {countTargetAudit && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">RECORD PHYSICAL COUNT · {countTargetAudit.auditNumber}</span>
                                <h3>{countTargetAudit.product?.name}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setCountTargetAudit(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {countError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertCircle size={15} />
                                <span>{countError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleSubmitCount}>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Snapshot System Quantity</label>
                                    <input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={`${countTargetAudit.systemQuantityAtCount} units`}
                                    />
                                </div>
                                <div className="inv-form-group">
                                    <label>Verified Physical Count *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={physicalQtyInput}
                                        onChange={(e) => setPhysicalQtyInput(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {/* Live Variance Calculation Display */}
                            {(() => {
                                const diff = physicalQtyInput - countTargetAudit.systemQuantityAtCount;
                                return (
                                    <div className="inv-variance-callout">
                                        <span>Calculated Variance:</span>
                                        <strong>
                                            {diff === 0 ? '0 (Exact Match)' : diff > 0 ? `+${diff} (Surplus)` : `${diff} (Shortage)`}
                                        </strong>
                                    </div>
                                );
                            })()}

                            {physicalQtyInput !== countTargetAudit.systemQuantityAtCount && (
                                <div className="inv-form-group">
                                    <label>Reason for Variance * (Min 3 characters)</label>
                                    <input
                                        type="text"
                                        required
                                        value={countReasonInput}
                                        onChange={(e) => setCountReasonInput(e.target.value)}
                                        placeholder="e.g. Expired batch discarded without prior entry"
                                    />
                                </div>
                            )}

                            <div className="inv-form-group">
                                <label>Auditor Notes</label>
                                <textarea
                                    rows={2}
                                    value={countNotesInput}
                                    onChange={(e) => setCountNotesInput(e.target.value)}
                                    placeholder="Optional additional notes"
                                />
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setCountTargetAudit(null)}
                                    disabled={countSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={countSubmitting}
                                >
                                    {countSubmitting ? 'Saving Count...' : 'Save Physical Count'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reconcile Modal */}
            {reconcileTargetAudit && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">RECONCILE LEDGER BALANCE</span>
                                <h3>Reconcile Audit {reconcileTargetAudit.auditNumber}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setReconcileTargetAudit(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {reconcileError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertCircle size={15} />
                                <span>{reconcileError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleReconcileSubmit}>
                            <p className="inv-modal-description">
                                Reconciling will permanently adjust the operational stock level to match the verified physical count of{' '}
                                <strong>{reconcileTargetAudit.physicalQuantity} units</strong>, and generate an audited{' '}
                                <code>StockMovement (ADJUSTMENT)</code> entry in the permanent ledger.
                            </p>

                            <div className="inv-form-group">
                                <label>Reconciliation Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={reconcileNotes}
                                    onChange={(e) => setReconcileNotes(e.target.value)}
                                    placeholder="Confirmed by supervisor"
                                />
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setReconcileTargetAudit(null)}
                                    disabled={reconcileSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={reconcileSubmitting}
                                >
                                    {reconcileSubmitting ? 'Reconciling...' : 'Confirm Reconciliation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
