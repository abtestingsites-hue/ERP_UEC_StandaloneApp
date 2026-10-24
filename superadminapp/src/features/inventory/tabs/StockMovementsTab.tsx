import { useEffect, useState, useCallback } from 'react';
import {
    History,
    Search,
    Filter,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type { InventoryStockMovement } from '../inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function StockMovementsTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    const [movements, setMovements] = useState<InventoryStockMovement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const fetchMovements = useCallback(async () => {
        try {
            const data = await inventoryService.getStockMovements({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain
            });
            setMovements(data);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load stock movements:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load movements ledger.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [activeUnitId, activeDomain]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await fetchMovements();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [fetchMovements]);

    const handleRefresh = () => {
        setIsLoading(true);
        void fetchMovements();
    };

    const filteredMovements = movements.filter((m) => {
        const matchesType = typeFilter === 'ALL' || m.movementType === typeFilter;
        const q = search.toLowerCase();
        const pName = m.product?.name?.toLowerCase() || '';
        const pSku = m.product?.sku?.toLowerCase() || '';
        const ref = m.referenceId?.toLowerCase() || '';
        const matchesSearch = !q || pName.includes(q) || pSku.includes(q) || ref.includes(q);
        return matchesType && matchesSearch;
    });

    const movementTypes = ['ALL', 'RECEIPT', 'PURCHASE', 'ISSUE', 'CONSUMPTION', 'ADJUSTMENT', 'SUPPLIER_RETURN', 'WASTE'];

    return (
        <div className="inventory-tab-content">
            <div className="overview-toolbar">
                <div>
                    <span className="section-kicker">{domainConfig.label.toUpperCase()} · {activeUnitName.toUpperCase()}</span>
                    <h2>Stock Movements Ledger</h2>
                </div>
                <button
                    className="inv-btn inv-btn--secondary"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    title="Reload Ledger"
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

            {/* Filter Bar */}
            <div className="inv-filters-bar">
                <div className="inv-search-form">
                    <Search size={15} className="inv-search-icon" />
                    <input
                        type="search"
                        className="inv-search-input"
                        placeholder="Filter by product name, SKU, or reference..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="inv-filter-group">
                    <Filter size={14} className="inv-filter-icon" />
                    <select
                        className="inv-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        {movementTypes.map((t) => (
                            <option key={t} value={t}>
                                {t === 'ALL' ? 'All Movement Types' : t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="inv-card">
                {isLoading ? (
                    <div className="inv-loading-state">
                        <RefreshCw size={24} className="spin-animation" />
                        <p>Loading movements audit trail...</p>
                    </div>
                ) : filteredMovements.length === 0 ? (
                    <div className="inv-empty-state">
                        <History size={32} />
                        <h4>No stock movements recorded</h4>
                        <p>Transactions will appear here as stock is received, issued, or reconciled.</p>
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
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.map((m) => {
                                    const isPositive = m.quantity > 0;
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <time dateTime={m.createdAt}>
                                                    {new Date(m.createdAt).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </time>
                                            </td>
                                            <td>
                                                <span className={`inv-badge inv-badge--${
                                                    m.movementType === 'RECEIPT' || m.movementType === 'PURCHASE' ? 'success' :
                                                    m.movementType === 'CONSUMPTION' || m.movementType === 'ISSUE' ? 'info' :
                                                    m.movementType === 'ADJUSTMENT' ? 'warning' :
                                                    m.movementType === 'SUPPLIER_RETURN' ? 'danger' : 'neutral'
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
                                            <td>
                                                <strong>{m.balanceAfter}</strong>
                                            </td>
                                            <td>
                                                <span className="inv-ref-type">
                                                    {m.referenceType || 'DIRECT'}
                                                </span>
                                                {m.referenceId && (
                                                    <span className="inv-subtext" title={m.referenceId}>
                                                        {m.referenceId.slice(0, 8)}...
                                                    </span>
                                                )}
                                            </td>
                                            <td>{m.performedBy || 'System'}</td>
                                            <td>
                                                <span className="inv-subtext">{m.notes || '—'}</span>
                                            </td>
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
