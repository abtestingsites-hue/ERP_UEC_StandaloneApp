import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Send,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Eye,
    RefreshCw,
    X,
    FileText,
    Boxes,
    Ban
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    StockIssueRequest,
    CreateIssueRequestPayload,
    InventoryProduct
} from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';
import { formatStockRequisitionNumber } from '../../../utils/idFormatters';

const USAGE_TYPES = [
    { value: 'PATIENT_CARE', label: 'Patient Care / Clinical' },
    { value: 'WARD_USE', label: 'Ward / Unit Use' },
    { value: 'KITCHEN_RATION', label: 'Kitchen / Meal Prep' },
    { value: 'STAFF_USE', label: 'Staff Facilities' },
    { value: 'MAINTENANCE', label: 'Facility Maintenance' },
    { value: 'EMERGENCY', label: 'Emergency Reserve' },
    { value: 'OTHER', label: 'General / Other' }
];

export function StockIssueRequestsTab() {
    const { activeUnitId } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [requests, setRequests] = useState<StockIssueRequest[]>([]);
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingRequest, setViewingRequest] = useState<StockIssueRequest | null>(null);
    const [approvingRequest, setApprovingRequest] = useState<StockIssueRequest | null>(null);
    const [rejectingRequest, setRejectingRequest] = useState<StockIssueRequest | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateIssueRequestPayload>({
        productId: '',
        quantity: 1,
        usageType: activeDomain === 'medical' ? 'PATIENT_CARE' : 'KITCHEN_RATION',
        issuedTo: '',
        notes: ''
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [stockBalances, setStockBalances] = useState<Record<string, number>>({});
    const [actionSubmitting, setActionSubmitting] = useState(false);

    const fetchIssueRequests = useCallback(async () => {
        try {
            const [reqData, prodData, stockData] = await Promise.all([
                inventoryService.getIssueRequests({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined
                }),
                inventoryService.getProducts({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain
                }),
                inventoryService.getStock({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain
                }).catch(() => [])
            ]);

            const balances: Record<string, number> = {};
            for (const s of stockData) {
                if (s.productId) {
                    balances[s.productId] = Number(s.quantity || 0);
                }
            }
            setStockBalances(balances);
            setRequests(reqData);
            setProducts(prodData.filter(p => p.status !== false));
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load issue requests:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load issue requests';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain, statusFilter]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchIssueRequests();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchIssueRequests]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchIssueRequests();
    };

    // Filtered requests
    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const q = search.trim().toLowerCase();
            const matchesSearch = !q ||
                (r.productName && r.productName.toLowerCase().includes(q)) ||
                (r.requestedBy && r.requestedBy.toLowerCase().includes(q)) ||
                (r.issuedTo && r.issuedTo.toLowerCase().includes(q)) ||
                (r.notes && r.notes.toLowerCase().includes(q));

            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [requests, search, statusFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter(r => r.status === 'PENDING').length;
        const approved = requests.filter(r => r.status === 'APPROVED').length;
        const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length;
        return { total, pending, approved, rejected };
    }, [requests]);

    // Create Modal Handlers
    const openCreateModal = () => {
        setFormData({
            productId: products[0]?.id || '',
            quantity: 1,
            usageType: activeDomain === 'medical' ? 'PATIENT_CARE' : 'KITCHEN_RATION',
            issuedTo: '',
            notes: ''
        });
        setFormError(null);
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productId) {
            setFormError('Please select a product.');
            return;
        }
        if (!formData.quantity || formData.quantity <= 0) {
            setFormError('Requested quantity must be at least 1.');
            return;
        }

        setFormSubmitting(true);
        setFormError(null);
        try {
            await inventoryService.createIssueRequest({
                ...formData,
                quantity: Number(formData.quantity)
            }, activeUnitId, activeDomain);

            setIsCreateModalOpen(false);
            setSuccessMessage('Stock issue requisition submitted successfully.');
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchIssueRequests();
        } catch (err: unknown) {
            console.error('Failed to create issue request:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to submit issue request.';
            setFormError(message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Approval Handlers
    const handleApprove = async () => {
        if (!approvingRequest) return;
        setActionSubmitting(true);
        try {
            await inventoryService.approveIssueRequest(approvingRequest.id, activeUnitId);
            setSuccessMessage(`Requisition for ${approvingRequest.quantity} units of "${approvingRequest.productName || 'product'}" approved. Stock balances updated.`);
            setTimeout(() => setSuccessMessage(null), 5000);
            setApprovingRequest(null);
            void fetchIssueRequests();
        } catch (err: unknown) {
            console.error('Failed to approve request:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to approve request.';
            setError(message);
            setApprovingRequest(null);
        } finally {
            setActionSubmitting(false);
        }
    };

    // Rejection Handlers
    const handleReject = async () => {
        if (!rejectingRequest) return;
        setActionSubmitting(true);
        try {
            await inventoryService.rejectIssueRequest(rejectingRequest.id, activeUnitId);
            setSuccessMessage(`Requisition ${formatStockRequisitionNumber(rejectingRequest.requestNumber, rejectingRequest.id)} rejected. Zero stock deduction occurred.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            setRejectingRequest(null);
            void fetchIssueRequests();
        } catch (err: unknown) {
            console.error('Failed to reject request:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to reject request.';
            setError(message);
            setRejectingRequest(null);
        } finally {
            setActionSubmitting(false);
        }
    };

    const formatUsageLabel = (val: string) => {
        return USAGE_TYPES.find(u => u.value === val)?.label || val;
    };

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · REQUISITIONS & DISPENSING</span>
                    <h2>Issue Requests</h2>
                </div>
                <div className="toolbar-actions">
                    <button
                        className="inv-btn inv-btn--primary"
                        onClick={openCreateModal}
                    >
                        <Plus size={15} />
                        <span>New Requisition</span>
                    </button>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Requests"
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

            {/* Metrics */}
            <div className="stat-cards-grid" style={{ marginBottom: 16 }}>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--primary">
                        <FileText size={20} />
                    </div>
                    <span className="stat-card__label">Total Requisitions</span>
                    <strong className="stat-card__value">{metrics.total}</strong>
                    <span className="stat-card__note">Historical & active requests</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--warning">
                        <Clock size={20} />
                    </div>
                    <span className="stat-card__label">Pending Approval</span>
                    <strong className="stat-card__value">{metrics.pending}</strong>
                    <span className="stat-card__note">Awaiting stock authorization</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--success">
                        <CheckCircle2 size={20} />
                    </div>
                    <span className="stat-card__label">Approved & Issued</span>
                    <strong className="stat-card__value">{metrics.approved}</strong>
                    <span className="stat-card__note">Stock successfully deducted</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--danger">
                        <Ban size={20} />
                    </div>
                    <span className="stat-card__label">Rejected / Cancelled</span>
                    <strong className="stat-card__value">{metrics.rejected}</strong>
                    <span className="stat-card__note">Zero stock impact</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="inv-filters-bar">
                <div className="inv-search-form" style={{ flex: '1 1 320px' }}>
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Search by product name, requester, or recipient..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="inv-filter-group">
                    <Filter size={14} className="inv-filter-icon" />
                    <label htmlFor="issue-status-select" className="sr-only">Status</label>
                    <select
                        id="issue-status-select"
                        className="inv-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="APPROVED">Approved Only</option>
                        <option value="REJECTED">Rejected Only</option>
                        <option value="CANCELLED">Cancelled Only</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading issue requisitions...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="inv-empty-state">
                        <Send size={32} />
                        <h4>No issue requests found</h4>
                        <p>Departments and care wards will submit consumable and medicine requisitions here.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Requisition No</th>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>Usage Type</th>
                                    <th>Requested By</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((r) => {
                                    const isPending = r.status === 'PENDING';
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f766e' }}>
                                                {formatStockRequisitionNumber(r.requestNumber, r.id)}
                                            </td>
                                            <td>
                                                <div className="inv-product-cell">
                                                    <strong>{r.productName || r.productId}</strong>
                                                    {r.issuedTo && <span className="inv-subtext">Issued To: {r.issuedTo}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{r.quantity}</strong> units
                                            </td>
                                            <td>
                                                <span className="inv-category-pill">{formatUsageLabel(r.usageType)}</span>
                                            </td>
                                            <td>
                                                <div>{r.requestedBy || 'Staff'}</div>
                                            </td>
                                            <td>
                                                <span className="inv-subtext">
                                                    {new Date(r.requestedAt || r.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`inv-badge inv-badge--${
                                                    r.status === 'APPROVED' ? 'success' :
                                                    r.status === 'PENDING' ? 'warning' : 'danger'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="inv-table-actions">
                                                    <button
                                                        className="inv-icon-btn"
                                                        onClick={() => setViewingRequest(r)}
                                                        title="View Request Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                className="inv-btn inv-btn--sm inv-btn--primary"
                                                                onClick={() => setApprovingRequest(r)}
                                                                title="Approve & Dispense Stock"
                                                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                                            >
                                                                <CheckCircle2 size={13} style={{ marginRight: 4 }} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="inv-btn inv-btn--sm inv-btn--secondary"
                                                                onClick={() => setRejectingRequest(r)}
                                                                title="Reject Requisition"
                                                                style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--danger-color, #ef4444)' }}
                                                            >
                                                                <XCircle size={13} style={{ marginRight: 4 }} />
                                                                Reject
                                                            </button>
                                                        </>
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

            {/* Create Requisition Modal */}
            {isCreateModalOpen && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">CONSUMABLES REQUISITION</span>
                                <h3>Create Issue Request</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setIsCreateModalOpen(false)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {formError && (
                            <div className="inv-alert inv-alert--danger" style={{ margin: '16px 20px 0' }}>
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="inv-modal-body">
                            <div className="inv-form-grid">
                                <div className="inv-form-field">
                                    <label htmlFor="issue-product">Select Product *</label>
                                    <select
                                        id="issue-product"
                                        className="inv-select"
                                        value={formData.productId}
                                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map(p => {
                                            const avail = stockBalances[p.id] || 0;
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.code ? `(${p.code})` : ''} - {p.category} [Available: {avail} {p.unitOfMeasure || p.unit || 'Nos'}]
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {formData.productId && (
                                        <div style={{ marginTop: 6, fontSize: '0.82rem' }}>
                                            {(() => {
                                                const selProd = products.find(p => p.id === formData.productId);
                                                const avail = stockBalances[formData.productId] || 0;
                                                const isZero = avail <= 0;
                                                return (
                                                    <div>
                                                        <span style={{ color: isZero ? 'var(--danger-color, #ef4444)' : 'var(--success-color, #10b981)', fontWeight: 600 }}>
                                                            On-Hand Available: {avail} {selProd?.unitOfMeasure || selProd?.unit || 'Nos'}
                                                        </span>
                                                        {isZero && (
                                                            <p style={{ color: 'var(--danger-color, #ef4444)', marginTop: 4, fontSize: '0.8rem', lineHeight: 1.3 }}>
                                                                ⚠️ Selected product has no available stock in this unit. Requisition cannot be approved or issued until stock is legitimately received or adjusted.
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="issue-quantity">Quantity Requested *</label>
                                    <input
                                        id="issue-quantity"
                                        type="number"
                                        min="1"
                                        className="inv-input"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="issue-usage-type">Usage Purpose *</label>
                                    <select
                                        id="issue-usage-type"
                                        className="inv-select"
                                        value={formData.usageType}
                                        onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                                        required
                                    >
                                        {USAGE_TYPES.map(u => (
                                            <option key={u.value} value={u.value}>{u.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="issue-recipient">Recipient / Ward / Patient</label>
                                    <input
                                        id="issue-recipient"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. Ward 2B, Nurse Sharmila, or Resident"
                                        value={formData.issuedTo || ''}
                                        onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-field" style={{ marginTop: 12 }}>
                                <label htmlFor="issue-notes">Requisition Notes</label>
                                <textarea
                                    id="issue-notes"
                                    className="inv-textarea"
                                    rows={2}
                                    placeholder="Clinical reason, meal planning detail, or doctor prescription note..."
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Submitting...' : 'Submit Requisition'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Dialog */}
            {approvingRequest && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 460 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--success-color, #10b981)' }}>STOCK DISPENSING</span>
                                <h3>Approve Requisition</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setApprovingRequest(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <p>Approve issuing <strong>{approvingRequest.quantity} units</strong> of <strong>{approvingRequest.productName || 'product'}</strong>?</p>
                            <div className="inv-alert inv-alert--info" style={{ marginTop: 12 }}>
                                <Boxes size={15} />
                                <span>Approving will deduct stock balances from warehouse inventory using FEFO (First-Expired, First-Out) lot ordering and generate a stock movement audit record.</span>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setApprovingRequest(null)}
                                disabled={actionSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={handleApprove}
                                disabled={actionSubmitting}
                            >
                                {actionSubmitting ? 'Processing...' : 'Confirm & Dispense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Dialog */}
            {rejectingRequest && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 440 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--danger-color, #ef4444)' }}>REQUISITION REVIEW</span>
                                <h3>Reject Request</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setRejectingRequest(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <p>Are you sure you want to reject requisition for <strong>{rejectingRequest.quantity} units</strong> of <strong>{rejectingRequest.productName || 'product'}</strong>?</p>
                            <div className="inv-alert inv-alert--warning" style={{ marginTop: 12 }}>
                                <AlertCircle size={15} />
                                <span>The request status will be updated to REJECTED. Zero inventory stock will be deducted.</span>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setRejectingRequest(null)}
                                disabled={actionSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--danger"
                                onClick={handleReject}
                                disabled={actionSubmitting}
                            >
                                {actionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingRequest && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">REQUISITION SPECIFICATION</span>
                                <h3>{viewingRequest.productName || 'Stock Issue Request'} · <span style={{ fontFamily: 'monospace', color: '#0f766e' }}>{formatStockRequisitionNumber(viewingRequest.requestNumber, viewingRequest.id)}</span></h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setViewingRequest(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <div className="inv-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Status</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`inv-badge inv-badge--${
                                            viewingRequest.status === 'APPROVED' ? 'success' :
                                            viewingRequest.status === 'PENDING' ? 'warning' : 'danger'
                                        }`}>
                                            {viewingRequest.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Requested Quantity</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingRequest.quantity} units</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Usage Purpose</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{formatUsageLabel(viewingRequest.usageType)}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Requested By</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingRequest.requestedBy || 'Staff'}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Issued To / Recipient</span>
                                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{viewingRequest.issuedTo || 'None specified'}</p>
                                </div>
                                <div className="inv-detail-card" style={{ background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Requisition Number</span>
                                    <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95em', color: '#0f766e' }}>
                                        {formatStockRequisitionNumber(viewingRequest.requestNumber, viewingRequest.id)}
                                    </p>
                                </div>
                            </div>

                            {viewingRequest.notes && (
                                <div style={{ marginTop: 16, background: 'var(--surface-color-subtle, rgba(255,255,255,0.03))', padding: 12, borderRadius: 8 }}>
                                    <span className="inv-subtext">Notes</span>
                                    <p style={{ margin: '4px 0 0' }}>{viewingRequest.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingRequest(null)}
                            >
                                Close
                            </button>
                            {viewingRequest.status === 'PENDING' && (
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--primary"
                                    onClick={() => {
                                        const req = viewingRequest;
                                        setViewingRequest(null);
                                        setApprovingRequest(req);
                                    }}
                                >
                                    Approve Request
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
