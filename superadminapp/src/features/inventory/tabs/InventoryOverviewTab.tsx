import { useEffect, useState, useCallback } from 'react';
import {
    Boxes,
    Package,
    TrendingUp,
    AlertTriangle,
    ClipboardCheck,
    ArrowRight,
    RefreshCw,
    Clock,
    DollarSign
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    InventoryProduct,
    StockValuationResponse,
    PhysicalAudit,
    InventoryStockMovement,
    InventoryExpirySummary
} from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

interface OverviewTabProps {
    onSelectTab: (tabId: string) => void;
}

export function InventoryOverviewTab({ onSelectTab }: OverviewTabProps) {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [valuation, setValuation] = useState<StockValuationResponse | null>(null);
    const [audits, setAudits] = useState<PhysicalAudit[]>([]);
    const [movements, setMovements] = useState<InventoryStockMovement[]>([]);
    const [expirySummary, setExpirySummary] = useState<InventoryExpirySummary | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOverview = useCallback(async () => {
        try {
            setError(null);
            const [prods, val, auds, movs, exp] = await Promise.all([
                inventoryService.getProducts({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }),
                inventoryService.getStockValuation({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }).catch(() => null),
                inventoryService.getPhysicalAudits({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }).catch(() => []),
                inventoryService.getStockMovements({ unitId: activeUnitId, allUnits: activeUnitId === null, domain: activeDomain }).catch(() => []),
                inventoryService.getExpiryAlerts({ unitId: activeUnitId, allUnits: activeUnitId === null, daysAhead: 30, domain: activeDomain }).catch(() => null)
            ]);

            setProducts(prods);
            setValuation(val);
            setAudits(auds);
            setMovements(movs);
            if (exp?.summary) {
                setExpirySummary(exp.summary);
            }
        } catch (err: unknown) {
            console.error('Error loading inventory overview:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load inventory overview data.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchOverview();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchOverview]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchOverview();
    };

    const activeAuditsCount = audits.filter(a => a.status === 'DRAFT' || a.status === 'COUNTED').length;
    const formattedValuation = valuation?.summary?.totalValuation
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: valuation.summary.currency || 'INR', maximumFractionDigits: 0 }).format(valuation.summary.totalValuation)
        : '₹0';

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Operational Command Center</h2>
                </div>
                <button
                    className="inv-btn inv-btn--secondary"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    title="Refresh Live Metrics"
                >
                    <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="inv-alert inv-alert--danger" role="alert">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="summary-grid">
                <article className="stat-card stat-card--mint">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Product Catalog</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <Package size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : products.length}
                    </strong>
                    <span className="stat-card__note">Active items in catalog</span>
                </article>

                <article className="stat-card stat-card--blue">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Stock Valuation</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <DollarSign size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : formattedValuation}
                    </strong>
                    <span className="stat-card__note">
                        {valuation?.summary?.totalItemsValued ?? 0} valued · {valuation?.summary?.totalItemsExcluded ?? 0} excluded
                    </span>
                </article>

                <article className="stat-card stat-card--gold">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Expiry Risk (30d)</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <Clock size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (expirySummary?.totalAlerts ?? 0)}
                    </strong>
                    <span className="stat-card__note">
                        {expirySummary?.expiredCount ?? 0} expired · {expirySummary?.expiringSoonCount ?? 0} expiring soon
                    </span>
                </article>

                <article className="stat-card stat-card--coral">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Pending Audits</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <ClipboardCheck size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : activeAuditsCount}
                    </strong>
                    <span className="stat-card__note">Awaiting physical count reconciliation</span>
                </article>
            </div>

            {/* Quick Actions & Navigation Bar */}
            <div className="inv-card inv-card--pills">
                <div className="inv-card__header">
                    <h3>Quick Workflow Navigation</h3>
                    <p>Direct access to integrated core inventory tools and registers</p>
                </div>
                <div className="inv-quick-actions">
                    <button className="inv-action-pill" onClick={() => onSelectTab('products')}>
                        <Package size={16} />
                        <span>Product Master</span>
                        <ArrowRight size={13} />
                    </button>
                    <button className="inv-action-pill" onClick={() => onSelectTab('stock')}>
                        <Boxes size={16} />
                        <span>Stock & Batches</span>
                        <ArrowRight size={13} />
                    </button>
                    <button className="inv-action-pill" onClick={() => onSelectTab('valuation')}>
                        <TrendingUp size={16} />
                        <span>Stock Valuation</span>
                        <ArrowRight size={13} />
                    </button>
                    <button className="inv-action-pill" onClick={() => onSelectTab('consumption')}>
                        <Clock size={16} />
                        <span>Consumption Analytics</span>
                        <ArrowRight size={13} />
                    </button>
                    <button className="inv-action-pill" onClick={() => onSelectTab('audits')}>
                        <ClipboardCheck size={16} />
                        <span>Physical Audits</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>

            {/* Recent Stock Movements Feed */}
            <div className="inv-card">
                <div className="inv-card__header">
                    <div>
                        <h3>Recent Ledger Movements</h3>
                        <p>Real-time audit log of receipts, consumption, and adjustments</p>
                    </div>
                    <button className="text-link" onClick={() => onSelectTab('movements')}>
                        View all ledger <ArrowRight size={14} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading recent stock movements...</p>
                    </div>
                ) : movements.length === 0 ? (
                    <div className="inv-empty-state">
                        <Boxes size={32} />
                        <h4>No recent movements recorded</h4>
                        <p>Inflows, requisitions, and audit reconciliations will appear here.</p>
                    </div>
                ) : (
                    <div className="inv-table-responsive">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Type</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Balance After</th>
                                    <th>Reference</th>
                                    <th>Performed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.slice(0, 8).map((m) => {
                                    const isPositive = m.quantity > 0;
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <time dateTime={m.createdAt}>
                                                    {new Date(m.createdAt).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </time>
                                            </td>
                                            <td>
                                                <span className={`inv-badge inv-badge--${
                                                    m.movementType === 'RECEIPT' ? 'success' :
                                                    m.movementType === 'CONSUMPTION' || m.movementType === 'ISSUE' ? 'info' :
                                                    m.movementType === 'ADJUSTMENT' ? 'warning' : 'neutral'
                                                }`}>
                                                    {m.movementType}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{m.product?.name || m.productId}</strong>
                                                {m.batch?.batchNumber && (
                                                    <span className="inv-subtext">Batch: {m.batch.batchNumber}</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={isPositive ? 'inv-qty-plus' : 'inv-qty-minus'}>
                                                    {isPositive ? `+${m.quantity}` : m.quantity}
                                                </span>
                                            </td>
                                            <td>{m.balanceAfter}</td>
                                            <td>
                                                <span className="inv-ref-type">{m.referenceType || 'DIRECT'}</span>
                                            </td>
                                            <td>{m.performedBy || 'System'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
