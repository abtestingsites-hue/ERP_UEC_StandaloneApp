import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Clock,
    TrendingDown,
    ArrowUpRight,
    RefreshCw,
    AlertTriangle,
    Package,
    PieChart,
    Layers
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type { ConsumptionAnalyticsResponse } from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function ConsumptionAnalyticsTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [dateRangeOption, setDateRangeOption] = useState<'7d' | '30d' | '90d'>('30d');
    const [analyticsData, setAnalyticsData] = useState<ConsumptionAnalyticsResponse | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        const days = dateRangeOption === '7d' ? 7 : dateRangeOption === '90d' ? 90 : 30;
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    }, [dateRangeOption]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await inventoryService.getConsumptionAnalytics({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain,
                startDate,
                endDate
            });
            setAnalyticsData(data);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load consumption analytics:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load consumption analytics.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain, startDate, endDate]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchAnalytics();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchAnalytics]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchAnalytics();
    };

    const summary = analyticsData?.summary;
    const topProducts = analyticsData?.topConsumedProducts || [];
    const categoryBreakdown = analyticsData?.categoryBreakdown || [];

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Consumption Analytics</h2>
                </div>
                <div className="toolbar-actions">
                    <div className="inv-pill-toggle">
                        <button
                            className={`inv-pill-toggle__btn ${dateRangeOption === '7d' ? 'active' : ''}`}
                            onClick={() => setDateRangeOption('7d')}
                        >
                            Last 7 Days
                        </button>
                        <button
                            className={`inv-pill-toggle__btn ${dateRangeOption === '30d' ? 'active' : ''}`}
                            onClick={() => setDateRangeOption('30d')}
                        >
                            Last 30 Days
                        </button>
                        <button
                            className={`inv-pill-toggle__btn ${dateRangeOption === '90d' ? 'active' : ''}`}
                            onClick={() => setDateRangeOption('90d')}
                        >
                            Last 90 Days
                        </button>
                    </div>
                    <button
                        className="inv-btn inv-btn--secondary"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload Analytics"
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

            {/* Consumption Summary Metric Cards */}
            <div className="summary-grid">
                <article className="stat-card stat-card--coral">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Total Consumed Units</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <TrendingDown size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (summary?.totalConsumptionQuantity ?? 0)}
                    </strong>
                    <span className="stat-card__note">
                        Across {summary?.distinctProductsConsumed ?? 0} distinct product items
                    </span>
                </article>

                <article className="stat-card stat-card--blue">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Issue Transactions</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <Clock size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (summary?.totalIssueTransactions ?? 0)}
                    </strong>
                    <span className="stat-card__note">Requisitions fulfilled in window</span>
                </article>

                <article className="stat-card stat-card--mint">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Receipt Inflow</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <ArrowUpRight size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : `+${summary?.inflowVsOutflow?.receiptInflow ?? 0}`}
                    </strong>
                    <span className="stat-card__note">Units received via GRN / Purchases</span>
                </article>

                <article className="stat-card stat-card--gold">
                    <div className="stat-card__topline">
                        <span className="stat-card__label">Audits / Adjustments</span>
                        <span className="stat-card__icon" aria-hidden="true">
                            <Layers size={18} strokeWidth={1.8} />
                        </span>
                    </div>
                    <strong className="stat-card__value">
                        {isLoading ? '...' : (summary?.inflowVsOutflow?.auditAdjustmentsDelta ?? 0)}
                    </strong>
                    <span className="stat-card__note">
                        Supplier returns: {summary?.inflowVsOutflow?.supplierReturnsOutflow ?? 0}
                    </span>
                </article>
            </div>

            {/* Movement Type Classification Banner */}
            {summary?.inflowVsOutflow && (
                <div className="inv-card inv-card--summary-row">
                    <div className="inv-movement-stat">
                        <span className="inv-subtext">Receipt Inflows:</span>
                        <strong className="inv-qty-plus">+{summary.inflowVsOutflow.receiptInflow}</strong>
                    </div>
                    <div className="inv-movement-stat">
                        <span className="inv-subtext">Clinical Consumption:</span>
                        <strong className="inv-qty-minus">-{summary.inflowVsOutflow.consumptionOutflow}</strong>
                    </div>
                    <div className="inv-movement-stat">
                        <span className="inv-subtext">Supplier Returns:</span>
                        <strong className="inv-qty-minus">-{summary.inflowVsOutflow.supplierReturnsOutflow}</strong>
                    </div>
                    <div className="inv-movement-stat">
                        <span className="inv-subtext">Physical Audit Delta:</span>
                        <strong>{summary.inflowVsOutflow.auditAdjustmentsDelta >= 0 ? `+${summary.inflowVsOutflow.auditAdjustmentsDelta}` : summary.inflowVsOutflow.auditAdjustmentsDelta}</strong>
                    </div>
                    <div className="inv-movement-stat">
                        <span className="inv-subtext">Waste Discards:</span>
                        <strong className="inv-qty-minus">-{summary.inflowVsOutflow.wasteDiscardOutflow}</strong>
                    </div>
                </div>
            )}

            {/* Grid: Top Consumed Products & Category Breakdown */}
            <div className="dashboard-columns">
                {/* Top Consumed Products */}
                <div className="inv-card">
                    <div className="inv-card__header">
                        <div>
                            <h3>Top Consumed Products</h3>
                            <p>Ranked by volume issued to clinics and departments</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="inv-loading-state">
                            <RefreshCw size={24} className="spin-animation" />
                            <p>Loading consumption metrics...</p>
                        </div>
                    ) : topProducts.length === 0 ? (
                        <div className="inv-empty-state">
                            <Package size={32} />
                            <h4>No consumption in period</h4>
                            <p>Zero clinical requisitions or meal issues recorded in this window.</p>
                        </div>
                    ) : (
                        <div className="inv-table-responsive">
                            <table className="inv-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Quantity Consumed</th>
                                        <th className="text-right">Requisitions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((p) => (
                                        <tr key={p.productId}>
                                            <td>
                                                <strong>{p.productName}</strong>
                                                {p.sku && <span className="inv-subtext">SKU: {p.sku}</span>}
                                            </td>
                                            <td>
                                                <span className="inv-category-pill">{p.category || 'General'}</span>
                                            </td>
                                            <td>
                                                <strong className="inv-qty-minus">
                                                    {p.totalQuantityConsumed} units
                                                </strong>
                                            </td>
                                            <td className="text-right">
                                                {p.issueTransactionsCount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Category Breakdown */}
                <div className="inv-card">
                    <div className="inv-card__header">
                        <div>
                            <h3>Category Breakdown</h3>
                            <p>Consumption distribution</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="inv-loading-state">
                            <RefreshCw size={24} className="spin-animation" />
                        </div>
                    ) : categoryBreakdown.length === 0 ? (
                        <div className="inv-empty-state">
                            <PieChart size={32} />
                            <p>No category activity</p>
                        </div>
                    ) : (
                        <div className="inv-category-list">
                            {categoryBreakdown.map((cat) => (
                                <div key={cat.category} className="inv-category-item">
                                    <div className="inv-category-item__header">
                                        <span className="inv-category-item__title">{cat.category}</span>
                                        <span className="inv-category-item__value">
                                            {cat.quantityConsumed} units ({cat.percentage}%)
                                        </span>
                                    </div>
                                    <div className="inv-progress-bar">
                                        <div
                                            className="inv-progress-bar__fill"
                                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
