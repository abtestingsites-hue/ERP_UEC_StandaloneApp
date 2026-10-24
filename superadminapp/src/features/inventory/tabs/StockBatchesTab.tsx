import { useEffect, useState, useCallback } from 'react';
import {
    Boxes,
    Search,
    SlidersHorizontal,
    AlertTriangle,
    RefreshCw,
    X,
    CheckCircle2,
    Eye
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    InventoryStock,
    InventoryProductBatch,
    StockAdjustmentPayload
} from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function StockBatchesTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [stocks, setStocks] = useState<InventoryStock[]>([]);
    const [batches, setBatches] = useState<InventoryProductBatch[]>([]);
    const [viewMode, setViewMode] = useState<'products' | 'batches'>('products');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filter
    const [search, setSearch] = useState('');

    // Batch details modal
    const [selectedBatch, setSelectedBatch] = useState<InventoryProductBatch | null>(null);

    // Stock adjustment modal
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<InventoryStock | null>(null);
    const [adjustPayload, setAdjustPayload] = useState<{
        quantity: number;
        reason: string;
        batchId?: string;
        batchNumber?: string;
        expiryDate?: string;
        notes?: string;
    }>({
        quantity: 0,
        reason: 'INVENTORY_RECOUNT',
        batchNumber: '',
        expiryDate: '',
        notes: ''
    });
    const [adjustSubmitting, setAdjustSubmitting] = useState(false);
    const [adjustError, setAdjustError] = useState<string | null>(null);

    const fetchStockData = useCallback(async () => {
        try {
            const [stockData, batchData, productData] = await Promise.all([
                inventoryService.getStock({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }),
                inventoryService.getBatches({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }),
                inventoryService.getProducts({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain })
            ]);

            // Index physical stock balances by productId
            const stockMap = new Map<string, InventoryStock>();
            for (const s of stockData) {
                if (s.productId) {
                    stockMap.set(s.productId, s);
                }
            }

            // Synthesize catalogue-to-stock view:
            // Ensure all active catalogue products belonging to the selected domain and authorized unit scope
            // are displayed in Products Balance even when their stock quantity is zero.
            const mergedStocks: InventoryStock[] = [];
            const seenProductIds = new Set<string>();

            for (const prod of productData) {
                if (prod.status === false) continue;
                seenProductIds.add(prod.id);
                const existing = stockMap.get(prod.id);

                if (existing) {
                    mergedStocks.push({
                        ...existing,
                        product: {
                            ...prod,
                            ...(existing.product || {})
                        }
                    });
                } else {
                    mergedStocks.push({
                        id: `stock-uninitialized-${prod.id}`,
                        productId: prod.id,
                        quantity: 0,
                        tenantId: prod.tenantId,
                        unitId: prod.unitId || activeUnitId || '',
                        product: prod
                    });
                }
            }

            // Also preserve any existing stock records whose product wasn't in productData
            for (const s of stockData) {
                if (s.productId && !seenProductIds.has(s.productId)) {
                    mergedStocks.push(s);
                }
            }

            setStocks(mergedStocks);
            setBatches(batchData);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load stock balances:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load stock data.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchStockData();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchStockData]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchStockData();
    };

    const openAdjustModal = (stock: InventoryStock) => {
        setSelectedStock(stock);
        const defaultExpiry = new Date();
        defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
        const expiryStr = defaultExpiry.toISOString().split('T')[0];

        setAdjustPayload({
            quantity: 0,
            reason: 'INVENTORY_RECOUNT',
            notes: '',
            batchId: undefined,
            batchNumber: stock.product?.isBatchTracked ? 'OPENING-STOCK' : '',
            expiryDate: stock.product?.isBatchTracked ? expiryStr : ''
        });
        setAdjustError(null);
        setIsAdjustModalOpen(true);
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStock) return;
        if (adjustPayload.quantity === 0) {
            setAdjustError('Adjustment delta cannot be 0.');
            return;
        }

        const delta = Number(adjustPayload.quantity);
        if (selectedStock.quantity + delta < 0) {
            setAdjustError(`Adjustment cannot result in negative stock balance. Current quantity: ${selectedStock.quantity}.`);
            return;
        }

        if (selectedStock.product?.isBatchTracked && delta > 0 && !adjustPayload.batchId) {
            if (!adjustPayload.batchNumber?.trim()) {
                setAdjustError('Batch number is required for batch-tracked product restock.');
                return;
            }
            if (!adjustPayload.expiryDate) {
                setAdjustError('Expiry date is required for batch-tracked product restock.');
                return;
            }
        }

        setAdjustSubmitting(true);
        setAdjustError(null);
        try {
            const isRecountOrOpening = adjustPayload.reason === 'INVENTORY_RECOUNT';
            const payload: StockAdjustmentPayload = {
                productId: selectedStock.productId,
                adjustmentQuantity: delta,
                reason: adjustPayload.reason,
                batchId: adjustPayload.batchId || undefined,
                batchNumber: adjustPayload.batchNumber?.trim() || undefined,
                expiryDate: adjustPayload.expiryDate || undefined,
                usageType: isRecountOrOpening && !adjustPayload.batchId ? 'Initial Opening Stock' : undefined,
                notes: adjustPayload.notes || undefined
            };

            await inventoryService.adjustStock(payload, activeUnitId, activeDomain);
            setIsAdjustModalOpen(false);
            setSuccessMessage(`Stock adjusted successfully for ${selectedStock.product?.name || 'product'}.`);
            setTimeout(() => setSuccessMessage(null), 4000);
            void fetchStockData();
        } catch (err: unknown) {
            console.error('Failed to adjust stock:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to submit stock adjustment.';
            setAdjustError(message);
        } finally {
            setAdjustSubmitting(false);
        }
    };

    const filteredStocks = stocks.filter(s => {
        const name = s.product?.name || '';
        const sku = s.product?.sku || s.product?.code || s.product?.productCode || '';
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
    });

    const filteredBatches = batches.filter(b => {
        const name = b.product?.name || '';
        const bnum = b.batchNumber || '';
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || bnum.toLowerCase().includes(q);
    });

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Stock & Batches</h2>
                </div>
                <div className="toolbar-actions">
                    <div className="inv-pill-toggle">
                        <button
                            className={`inv-pill-toggle__btn ${viewMode === 'products' ? 'active' : ''}`}
                            onClick={() => setViewMode('products')}
                        >
                            Products Balance
                        </button>
                        <button
                            className={`inv-pill-toggle__btn ${viewMode === 'batches' ? 'active' : ''}`}
                            onClick={() => setViewMode('batches')}
                        >
                            Batches & Expiry
                        </button>
                    </div>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Stock Balances"
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
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Search */}
            <div className="inv-filters-bar">
                <div className="inv-search-form">
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Search product name, SKU, or batch number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* View Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading live stock balances...</p>
                    </div>
                ) : viewMode === 'products' ? (
                    filteredStocks.length === 0 ? (
                        <div className="inv-empty-state">
                            <Boxes size={32} />
                            <h4>No stock records found</h4>
                            <p>Receive purchase orders or perform stock opening to initialize balances.</p>
                        </div>
                    ) : (
                        <div className="inv-table-responsive">
                            <table className="inv-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>SKU</th>
                                        <th>Category</th>
                                        <th>On-Hand Stock</th>
                                        <th>Unit Cost</th>
                                        <th>Tracking Mode</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStocks.map((s) => {
                                        const isZero = Number(s.quantity || 0) === 0;
                                        const isLow = !isZero && Boolean(s.product?.reorderLevel && s.quantity <= s.product.reorderLevel);
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <strong>{s.product?.name || s.productId}</strong>
                                                </td>
                                                <td>{s.product?.sku || s.product?.code || s.product?.productCode || '—'}</td>
                                                <td>
                                                    <span className="inv-category-pill">{s.product?.category || 'General'}</span>
                                                </td>
                                                <td>
                                                    <span className={`inv-stock-qty ${isZero ? 'inv-stock-qty--zero' : (isLow ? 'inv-stock-qty--low' : '')}`}>
                                                        {s.quantity} {s.product?.unitOfMeasure || s.product?.unit || 'Nos'}
                                                    </span>
                                                    {isZero ? (
                                                        <span className="inv-badge inv-badge--danger" style={{ marginLeft: 8 }}>
                                                            Out of Stock
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inv-badge inv-badge--warning" style={{ marginLeft: 8 }}>
                                                            Low Stock
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td>
                                                    {s.product?.unitCost ? `₹${Number(s.product.unitCost).toFixed(2)}` : (s.product?.defaultRevenuePrice ? `₹${Number(s.product.defaultRevenuePrice).toFixed(2)}` : '—')}
                                                </td>
                                                <td>
                                                    <span className={`inv-badge inv-badge--${s.product?.isBatchTracked ? 'info' : 'neutral'}`}>
                                                        {s.product?.isBatchTracked ? 'Batch Tracked' : 'Aggregate Only'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                                        onClick={() => openAdjustModal(s)}
                                                    >
                                                        <SlidersHorizontal size={13} />
                                                        <span>Adjust</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    filteredBatches.length === 0 ? (
                        <div className="inv-empty-state">
                            <Boxes size={32} />
                            <h4>No batch records found</h4>
                            <p>Products with batch tracking will show their active lots and expiry dates here.</p>
                        </div>
                    ) : (
                        <div className="inv-table-responsive">
                            <table className="inv-table">
                                <thead>
                                    <tr>
                                        <th>Batch Number</th>
                                        <th>Product Name</th>
                                        <th>Batch Quantity</th>
                                        <th>Expiry Date</th>
                                        <th>Unit Cost</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map((b) => {
                                        const expDate = new Date(b.expiryDate);
                                        const now = new Date();
                                        const isExpired = expDate < now;
                                        const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        const isExpiringSoon = daysRemaining <= 30 && !isExpired;

                                        return (
                                            <tr key={b.id}>
                                                <td>
                                                    <strong>{b.batchNumber}</strong>
                                                </td>
                                                <td>{b.product?.name || b.productId}</td>
                                                <td>{b.quantity} units</td>
                                                <td>
                                                    <time dateTime={b.expiryDate}>
                                                        {expDate.toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </time>
                                                    <span className="inv-subtext">
                                                        {isExpired ? 'Expired' : `${daysRemaining} days left`}
                                                    </span>
                                                </td>
                                                <td>{b.unitCost ? `₹${Number(b.unitCost).toFixed(2)}` : '—'}</td>
                                                <td>
                                                    <span className={`inv-badge inv-badge--${
                                                        isExpired ? 'danger' : isExpiringSoon ? 'warning' : 'success'
                                                    }`}>
                                                        {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                                        onClick={() => setSelectedBatch(b)}
                                                        title="View Batch Details"
                                                    >
                                                        <Eye size={13} />
                                                        <span>Details</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Adjust Stock Modal */}
            {isAdjustModalOpen && selectedStock && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">INVENTORY RECONCILIATION</span>
                                <h3>Adjust Stock · {selectedStock.product?.name}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setIsAdjustModalOpen(false)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {adjustError && (
                            <div className="inv-alert inv-alert--danger" role="alert">
                                <AlertTriangle size={15} />
                                <span>{adjustError}</span>
                            </div>
                        )}

                        <form className="inv-modal-form" onSubmit={handleAdjustSubmit}>
                            <div className="inv-form-group">
                                <label>Current Balance: <strong>{selectedStock.quantity} units</strong></label>
                            </div>

                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Adjustment Delta (+ or -) *</label>
                                    <input
                                        type="number"
                                        step="1"
                                        required
                                        value={adjustPayload.quantity}
                                        onChange={(e) => setAdjustPayload({ ...adjustPayload, quantity: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. +5 for surplus, -3 for damage"
                                    />
                                    <span className="inv-subtext">
                                        Resulting balance: {selectedStock.quantity + (Number(adjustPayload.quantity) || 0)} units
                                    </span>
                                </div>

                                <div className="inv-form-group">
                                    <label>Reason *</label>
                                    <select
                                        value={adjustPayload.reason}
                                        onChange={(e) => setAdjustPayload({ ...adjustPayload, reason: e.target.value })}
                                    >
                                        <option value="INVENTORY_RECOUNT">Inventory Recount / Audit</option>
                                        <option value="DAMAGE">Damaged in Storage</option>
                                        <option value="EXPIRED_DISPOSAL">Expired Item Disposal</option>
                                        <option value="SPOILAGE">Spoilage / Contamination</option>
                                        <option value="FOUND_STOCK">Surplus Discovered</option>
                                    </select>
                                </div>
                            </div>

                            {selectedStock.product?.isBatchTracked && (
                                <>
                                    {batches.filter(b => b.productId === selectedStock.productId).length > 0 && (
                                        <div className="inv-form-group">
                                            <label>Target Existing Batch</label>
                                            <select
                                                value={adjustPayload.batchId || ''}
                                                onChange={(e) => setAdjustPayload({ ...adjustPayload, batchId: e.target.value || undefined })}
                                            >
                                                <option value="">+ Create / Restock as New Batch</option>
                                                {batches.filter(b => b.productId === selectedStock.productId).map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.batchNumber} (Current: {b.quantity} units, Exp: {new Date(b.expiryDate).toLocaleDateString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {adjustPayload.quantity > 0 && !adjustPayload.batchId && (
                                        <div className="inv-form-grid">
                                            <div className="inv-form-group">
                                                <label>Batch / Lot Number *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={adjustPayload.batchNumber || ''}
                                                    onChange={(e) => setAdjustPayload({ ...adjustPayload, batchNumber: e.target.value })}
                                                    placeholder="e.g. LOT-2026-01 or OPENING-STOCK"
                                                />
                                            </div>
                                            <div className="inv-form-group">
                                                <label>Expiry Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={adjustPayload.expiryDate || ''}
                                                    onChange={(e) => setAdjustPayload({ ...adjustPayload, expiryDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="inv-form-group">
                                <label>Notes / Justification</label>
                                <textarea
                                    rows={2}
                                    value={adjustPayload.notes || ''}
                                    onChange={(e) => setAdjustPayload({ ...adjustPayload, notes: e.target.value })}
                                    placeholder="Provide operational justification for audit record"
                                />
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    disabled={adjustSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={adjustSubmitting}
                                >
                                    {adjustSubmitting ? 'Applying Adjustment...' : 'Apply Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Details Modal */}
            {selectedBatch && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel">
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">BATCH / LOT PROFILE</span>
                                <h3>Batch #{selectedBatch.batchNumber}</h3>
                            </div>
                            <button
                                className="icon-button"
                                onClick={() => setSelectedBatch(null)}
                                title="Close"
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div className="inv-modal-form">
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Product Name</label>
                                    <p className="inv-detail-val"><strong>{selectedBatch.product?.name || selectedBatch.productId}</strong></p>
                                </div>
                                <div className="inv-form-group">
                                    <label>SKU / Code</label>
                                    <p className="inv-detail-val">{selectedBatch.product?.sku || '—'}</p>
                                </div>
                            </div>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Current Lot Quantity</label>
                                    <p className="inv-detail-val"><strong>{selectedBatch.quantity}</strong> units</p>
                                </div>
                                <div className="inv-form-group">
                                    <label>Unit Cost</label>
                                    <p className="inv-detail-val">{selectedBatch.unitCost ? `₹${Number(selectedBatch.unitCost).toFixed(2)}` : '—'}</p>
                                </div>
                            </div>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Expiry Date</label>
                                    <p className="inv-detail-val">
                                        {new Date(selectedBatch.expiryDate).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="inv-form-group">
                                    <label>Lifecycle Status</label>
                                    <div>
                                        {(() => {
                                            const exp = new Date(selectedBatch.expiryDate);
                                            const now = new Date();
                                            const isExpired = exp < now;
                                            const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                            return (
                                                <span className={`inv-badge inv-badge--${isExpired ? 'danger' : days <= 30 ? 'warning' : 'success'}`}>
                                                    {isExpired ? `EXPIRED (${Math.abs(days)} days ago)` : `${days} days remaining`}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="inv-form-grid">
                                <div className="inv-form-group">
                                    <label>Batch Record ID</label>
                                    <p className="inv-detail-val" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{selectedBatch.id}</p>
                                </div>
                                <div className="inv-form-group">
                                    <label>Received / Created Date</label>
                                    <p className="inv-detail-val">
                                        {selectedBatch.createdAt ? new Date(selectedBatch.createdAt).toLocaleString() : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setSelectedBatch(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
