import { useEffect, useState, useCallback } from 'react';
import {
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Search,
    RefreshCw,
    Layers,
    ShieldAlert,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type { StockValuationResponse, ValuationItem } from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function StockValuationTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [valuationData, setValuationData] = useState<StockValuationResponse | null>(null);
    const [viewMode, setViewMode] = useState<'aggregate' | 'batch'>('aggregate');
    const [category, setCategory] = useState('ALL');
    const [search, setSearch] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

    // Adjust category filter when domain changes
    const [prevDomain, setPrevDomain] = useState(activeDomain);
    if (prevDomain !== activeDomain) {
        setPrevDomain(activeDomain);
        setCategory('ALL');
    }

    const fetchValuation = useCallback(async () => {
        try {
            const data = await inventoryService.getStockValuation({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain,
                view: viewMode,
                category: category !== 'ALL' ? category : undefined,
                search: search || undefined
            });
            setValuationData(data);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load stock valuation:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load valuation report.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain, viewMode, category, search]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchValuation();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchValuation]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchValuation();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        void fetchValuation();
    };

    const toggleExpand = (productId: string) => {
        setExpandedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    const summary = valuationData?.summary;
    const items = valuationData?.items || [];
    const excluded = valuationData?.excludedProducts || [];

    const formattedTotalValuation = summary?.totalValuation
        ? new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: summary.currency || 'INR',
              maximumFractionDigits: 2
          }).format(summary.totalValuation)
        : '₹0.00';

    const domainCategories = activeDomain === 'medical'
        ? ['ALL', 'Medicines', 'Medical Supplies', 'Clinical Consumables']
        : ['ALL', 'Ration', 'Fresh Food', 'Food & Ration', 'Kitchen Supplies'];

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Stock Valuation Report</h2>
                </div>
                <div className="toolbar-actions">
                    <div className="inv-pill-toggle">
                        <button
                            className={`inv-pill-toggle__btn ${viewMode === 'aggregate' ? 'active' : ''}`}
                            onClick={() => setViewMode('aggregate')}
                        >
                            Aggregate View
                        </button>
                        <button
                            className={`inv-pill-toggle__btn ${viewMode === 'batch' ? 'active' : ''}`}
                            onClick={() => setViewMode('batch')}
                        >
                            Batch Breakdown
                        </button>
                    </div>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Valuation Data"
                    >
                        <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="inv-alert inv-alert--danger" role="alert">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Valuation Metric Summary Cards */}
            <div className="summary-grid">
                <article className="stat-card stat-card--mint">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Total Inventory Valuation</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <DollarSign size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : formattedTotalValuation}
                    </strong>
                    <span className="stat-card__note">
                        Operational valuation across {summary?.totalUnitsInStock ?? 0} physical units
                    </span>
                </article>

                <article className="stat-card stat-card--blue">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Items Fully Valued</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <TrendingUp size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (summary?.totalItemsValued ?? 0)}
                    </strong>
                    <span className="stat-card__note">With recorded positive unit costs</span>
                </article>

                <article className="stat-card stat-card--gold">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Excluded (Missing Cost)</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <ShieldAlert size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (summary?.totalItemsExcluded ?? 0)}
                    </strong>
                    <span className="stat-card__note">Excluded to avoid distorting valuation</span>
                </article>

                <article className="stat-card stat-card--coral">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Scope Authorization</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <Layers size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value" style={{ fontSize: 18 }}>
                        {activeUnitId === null ? 'All Units' : 'Single Unit'}
                    </strong>
                    <span className="stat-card__note">
                        {activeUnitId === null ? 'Facility-wide aggregation' : `Strictly scoped to ${activeUnitName}`}
                    </span>
                </article>
            </div>

            {/* Safeguard Alert for Excluded Items */}
            {summary && summary.totalItemsExcluded > 0 && (
                <div className="inv-alert inv-alert--warning" role="alert">
                    <AlertTriangle size={16} />
                    <div>
                        <strong>Safeguard Active:</strong> {summary.totalItemsExcluded} product(s) have unrecorded or zero unit costs and have been safely omitted from the financial valuation total to maintain accounting integrity.
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="inv-filters-bar">
                <form className="inv-search-form" onSubmit={handleSearchSubmit}>
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Search product name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="inv-btn inv-btn--secondary inv-btn--sm">
                        Filter
                    </button>
                </form>

                <div className="inv-filter-group">
                    <Filter size={14} className="inv-filter-icon" />
                    <select
                        className="inv-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {domainCategories.map((c) => (
                            <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Valuation Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Computing live stock valuation...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="inv-empty-state">
                        <DollarSign size={32} />
                        <h4>No valuation records found</h4>
                        <p>No products with on-hand stock match the selected scope.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    {viewMode === 'batch' && <th style={{ width: 40 }}></th>}
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Total Quantity</th>
                                    <th>Unit Cost</th>
                                    <th className="text-right">Valuation Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: ValuationItem) => {
                                    const isExpanded = expandedProductIds.has(item.productId);
                                    const hasBatches = viewMode === 'batch' && item.batches && item.batches.length > 0;

                                    return (
                                        <>
                                            <tr key={item.productId} className={item.isCostMissing ? 'inv-tr-warning' : ''}>
                                                {viewMode === 'batch' && (
                                                    <td>
                                                        {hasBatches && (
                                                            <button
                                                                className="inv-icon-btn inv-icon-btn--sm"
                                                                onClick={() => toggleExpand(item.productId)}
                                                                title="Toggle Batch Details"
                                                            >
                                                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                                <td>
                                                    <strong>{item.productName}</strong>
                                                    {item.isCostMissing && (
                                                        <span className="inv-badge inv-badge--warning" style={{ marginLeft: 6 }}>
                                                            Excluded
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{item.sku || '—'}</td>
                                                <td>
                                                    <span className="inv-category-pill">{item.category || 'General'}</span>
                                                </td>
                                                <td>
                                                    {item.totalQuantity} {item.unitOfMeasure || 'units'}
                                                </td>
                                                <td>
                                                    {item.unitCost !== null && item.unitCost !== undefined && item.unitCost > 0 ? (
                                                        `₹${Number(item.unitCost).toFixed(2)}`
                                                    ) : (
                                                        <span className="inv-cost-missing">Missing Cost</span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    {item.totalValuation !== null && item.totalValuation !== undefined ? (
                                                        <strong>
                                                            {new Intl.NumberFormat('en-IN', {
                                                                style: 'currency',
                                                                currency: summary?.currency || 'INR'
                                                            }).format(item.totalValuation)}
                                                        </strong>
                                                    ) : (
                                                        <span className="inv-cost-missing">₹0.00</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Batch Breakdown Rows */}
                                            {isExpanded && hasBatches && item.batches!.map((b) => (
                                                <tr key={b.batchId} className="inv-tr-nested">
                                                    <td></td>
                                                    <td colSpan={2} style={{ paddingLeft: 30 }}>
                                                        <span className="inv-subtext">↳ Batch: <strong>{b.batchNumber}</strong> (Exp: {new Date(b.expiryDate).toLocaleDateString()})</span>
                                                    </td>
                                                    <td>
                                                        <span className="inv-subtext">{b.quantity} units</span>
                                                    </td>
                                                    <td>
                                                        <span className="inv-subtext">₹{Number(b.unitCost).toFixed(2)}</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="inv-subtext">
                                                            {new Intl.NumberFormat('en-IN', {
                                                                style: 'currency',
                                                                currency: summary?.currency || 'INR'
                                                            }).format(b.totalValue)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Excluded Products Details */}
            {excluded.length > 0 && (
                <div className="inv-card">
                    <div className="inv-card__header">
                        <div>
                            <h3>Excluded Products Audit Log</h3>
                            <p>Products with on-hand quantity omitted from financial valuation</p>
                        </div>
                    </div>
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Physical Quantity</th>
                                    <th>Exclusion Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {excluded.map((ep) => (
                                    <tr key={ep.productId}>
                                        <td><strong>{ep.productName}</strong></td>
                                        <td>{ep.sku || '—'}</td>
                                        <td>{ep.totalQuantity} units</td>
                                        <td>
                                            <span className="inv-cost-missing">{ep.reason}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
