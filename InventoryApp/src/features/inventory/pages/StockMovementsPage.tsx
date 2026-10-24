import React, { useMemo, useState } from 'react';
import {
  History,
  Search,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldAlert,
  Info,
  Clock,
  User,
  Boxes,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { hasPermission, INVENTORY_PERMISSIONS } from '../../../lib/permissions';
import { useInventoryStockMovements } from '../hooks/useInventory';
import type { InventoryStockMovement } from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  movementInScope,
  type InventoryScope,
} from '../utils/inventoryScope';
import {
  getMovementTypeMeta,
  formatMovementReference,
  formatSignedQuantity,
} from '../utils/movementFormatters';

const MOVEMENT_TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Movement Types' },
  { value: 'PURCHASE', label: 'Purchases (Inflow)' },
  { value: 'ISSUE', label: 'Stock Issues (Outflow)' },
  { value: 'ADJUSTMENT', label: 'Adjustments' },
];

export default function StockMovementsPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewMovements = hasPermission(user, [
    INVENTORY_PERMISSIONS.MOVEMENTS_VIEW,
    'Stock Movements',
    'Stock',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
  ]);

  // Inventory Scope
  const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() =>
    getDefaultInventoryScope(user)
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'product' | 'quantity' | 'balance'>('date');
  const [sortAsc, setSortAsc] = useState(false); // default newest first

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Query Hook (unit-scoped via TanStack Query)
  const {
    data: movements = [],
    isLoading: isMovementsLoading,
    isError: isMovementsError,
    error: movementsError,
    refetch: refetchMovements,
  } = useInventoryStockMovements();

  // Scope-filtered movements
  const scopedMovements = useMemo(
    () => movements.filter((m) => movementInScope(m, inventoryScope)),
    [movements, inventoryScope]
  );

  // Summary Metrics computed from scoped movements
  const metrics = useMemo(() => {
    let totalInflowQty = 0;
    let totalOutflowQty = 0;
    let purchaseCount = 0;
    let issueCount = 0;
    let adjustmentCount = 0;

    for (const m of scopedMovements) {
      const type = String(m.movementType || '').toUpperCase();
      const qty = Math.abs(Number(m.quantity || 0));

      if (type === 'PURCHASE' || type === 'STOCK_IN') {
        purchaseCount++;
        totalInflowQty += qty;
      } else if (type === 'ISSUE' || type === 'STOCK_OUT') {
        issueCount++;
        totalOutflowQty += qty;
      } else if (type === 'ADJUSTMENT') {
        adjustmentCount++;
      }
    }

    return {
      totalCount: scopedMovements.length,
      purchaseCount,
      issueCount,
      adjustmentCount,
      totalInflowQty,
      totalOutflowQty,
    };
  }, [scopedMovements]);

  // Filtered dataset
  const filteredMovements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
    const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

    return scopedMovements.filter((m) => {
      // 1. Movement Type Filter
      if (typeFilter !== 'ALL') {
        const mType = String(m.movementType || '').toUpperCase();
        if (mType !== typeFilter) {
          // Check aliases
          if (typeFilter === 'PURCHASE' && mType !== 'STOCK_IN') return false;
          if (typeFilter === 'ISSUE' && mType !== 'STOCK_OUT') return false;
          if (typeFilter !== 'PURCHASE' && typeFilter !== 'ISSUE') return false;
        }
      }

      // 2. Date Range Filter
      if (m.createdAt) {
        const itemTime = new Date(m.createdAt).getTime();
        if (startTimestamp !== null && itemTime < startTimestamp) return false;
        if (endTimestamp !== null && itemTime > endTimestamp) return false;
      }

      // 3. Search Query (product name, SKU, vendor, notes, actor)
      if (query) {
        const pName = String(m.product?.name || '').toLowerCase();
        const pCode = String(m.product?.code || '').toLowerCase();
        const pCat = String(m.product?.category || '').toLowerCase();
        const vendor = String(m.vendor || '').toLowerCase();
        const notes = String(m.notes || '').toLowerCase();
        const actor = String(m.updatedBy || '').toLowerCase();
        const mType = String(m.movementType || '').toLowerCase();

        if (
          !pName.includes(query) &&
          !pCode.includes(query) &&
          !pCat.includes(query) &&
          !vendor.includes(query) &&
          !notes.includes(query) &&
          !actor.includes(query) &&
          !mType.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [scopedMovements, typeFilter, startDate, endDate, searchQuery]);

  // Sorted dataset
  const sortedMovements = useMemo(() => {
    return [...filteredMovements].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'product':
          valA = (a.product?.name || '').toLowerCase();
          valB = (b.product?.name || '').toLowerCase();
          break;
        case 'quantity':
          valA = Number(a.signedQuantity || a.quantity || 0);
          valB = Number(b.signedQuantity || b.quantity || 0);
          break;
        case 'balance':
          valA = a.balanceAfter != null ? Number(a.balanceAfter) : -Infinity;
          valB = b.balanceAfter != null ? Number(b.balanceAfter) : -Infinity;
          break;
        case 'date':
        default:
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredMovements, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedMovements.length / pageSize) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMovements.slice(start, start + pageSize);
  }, [sortedMovements, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (!canViewMovements) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock Movement Ledger"
          description="Read-only audit trail tracking physical stock transactions and balance updates"
        />
        <Card className="p-8 text-center bg-slate-900 border-slate-800">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">Access Restricted</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Your role lacks permissions to view the stock movement audit ledger. Contact your
            administrator to request inventory audit privileges.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stock Movement Ledger"
        description={`Immutable audit trail logging every inventory debit, credit, and running balance for ${activeUnit?.name || 'Active Unit'}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMovements()}
            disabled={isMovementsLoading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isMovementsLoading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </Button>
        }
      />

      {/* Backend Pagination Notice */}
      <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-start gap-3 text-xs text-blue-300">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
        <div>
          <span className="font-semibold text-blue-200">Historical Record Scope:</span> Displaying the
          most recent returned audit records (up to 300 entries) for the active facility unit.
          All balances and timestamps represent verified immutable transactions.
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ledger Entries */}
        <Card className="p-5 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Logged Movements
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-100">{metrics.totalCount}</div>
            <p className="text-xs text-slate-500 mt-1">In {getInventoryScopeLabel(inventoryScope)}</p>
          </div>
        </Card>

        {/* Inflow Transactions */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            typeFilter === 'PURCHASE' ? 'ring-2 ring-emerald-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setTypeFilter(typeFilter === 'PURCHASE' ? 'ALL' : 'PURCHASE')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Procurement Receipts
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-400">
              +{metrics.totalInflowQty} units
            </div>
            <p className="text-xs text-slate-500 mt-1">{metrics.purchaseCount} purchase entries</p>
          </div>
        </Card>

        {/* Outflow Transactions */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            typeFilter === 'ISSUE' ? 'ring-2 ring-rose-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setTypeFilter(typeFilter === 'ISSUE' ? 'ALL' : 'ISSUE')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Stock Issues / Consumption
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-400">
              -{metrics.totalOutflowQty} units
            </div>
            <p className="text-xs text-slate-500 mt-1">{metrics.issueCount} issue requisitions</p>
          </div>
        </Card>

        {/* Adjustments */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            typeFilter === 'ADJUSTMENT' ? 'ring-2 ring-amber-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setTypeFilter(typeFilter === 'ADJUSTMENT' ? 'ALL' : 'ADJUSTMENT')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Manual Adjustments
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-400">{metrics.adjustmentCount}</div>
            <p className="text-xs text-slate-500 mt-1">Direct physical corrections</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900 border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by product, SKU, vendor, or actor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          {/* Scope Select */}
          <div className="lg:col-span-2">
            <Select
              value={inventoryScope}
              onChange={(e) => {
                setInventoryScope(e.target.value as InventoryScope);
                setCurrentPage(1);
              }}
              options={inventoryScopeOptions}
            />
          </div>

          {/* Movement Type Filter */}
          <div className="lg:col-span-2">
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={MOVEMENT_TYPE_FILTER_OPTIONS}
            />
          </div>

          {/* Date Range Start */}
          <div className="lg:col-span-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
            />
          </div>

          {/* Date Range End */}
          <div className="lg:col-span-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
            />
          </div>
        </div>

        {(searchQuery || typeFilter !== 'ALL' || startDate || endDate) && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Filtered to <strong className="text-slate-200">{filteredMovements.length}</strong> of{' '}
              {scopedMovements.length} movements
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Main Movement Ledger Table */}
      {isMovementsLoading ? (
        <Card className="p-12 bg-slate-900 border-slate-800">
          <LoadingState message="Loading immutable stock movement ledger..." />
        </Card>
      ) : isMovementsError ? (
        <Card className="p-8 bg-slate-900 border-slate-800">
          <ErrorState
            title="Failed to Load Movement Ledger"
            message={(movementsError as any)?.message || 'An error occurred while loading ledger.'}
            onRetry={refetchMovements}
          />
        </Card>
      ) : sortedMovements.length === 0 ? (
        <Card className="p-12 bg-slate-900 border-slate-800">
          <EmptyState
            title="No Movement Records Found"
            description="No inventory transactions matched the active unit and filter criteria."
            icon={<History className="w-12 h-12 text-slate-500" />}
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 w-44"
                    onClick={() => {
                      if (sortField === 'date') setSortAsc(!sortAsc);
                      else {
                        setSortField('date');
                        setSortAsc(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Date & Time</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200"
                    onClick={() => {
                      if (sortField === 'product') setSortAsc(!sortAsc);
                      else {
                        setSortField('product');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product Details</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center w-36">Movement Type</th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 text-right w-32"
                    onClick={() => {
                      if (sortField === 'quantity') setSortAsc(!sortAsc);
                      else {
                        setSortField('quantity');
                        setSortAsc(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Quantity</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 text-right w-36"
                    onClick={() => {
                      if (sortField === 'balance') setSortAsc(!sortAsc);
                      else {
                        setSortField('balance');
                        setSortAsc(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Balance After</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Source Reference</th>
                  <th className="py-3 px-4 w-36">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {paginatedMovements.map((movement) => {
                  const meta = getMovementTypeMeta(movement.movementType);
                  const signed = formatSignedQuantity(
                    movement.quantity,
                    movement.signedQuantity,
                    movement.movementType
                  );
                  const reference = formatMovementReference(movement);
                  const actor = movement.updatedBy || 'System';
                  const dateObj = movement.createdAt ? new Date(movement.createdAt) : null;

                  return (
                    <tr
                      key={movement.id}
                      className="transition-colors hover:bg-slate-800/40 text-slate-300"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {dateObj ? (
                          <div>
                            <span className="text-slate-200 font-semibold">
                              {dateObj.toLocaleDateString('en-GB')}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                              {dateObj.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Product Details */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm">
                              {movement.product?.name || 'Unknown Product'}
                            </span>
                            {movement.product?.code && (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                                {movement.product.code}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 capitalize">
                            Category: {movement.product?.category || '-'} • Unit:{' '}
                            {movement.product?.unit || 'Nos'}
                          </span>
                        </div>
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-3 px-4 text-center font-sans">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>

                      {/* Signed Quantity */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            signed.isNegative
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {signed.text} {movement.product?.unit || 'Nos'}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {movement.balanceAfter != null ? (
                          <span className="font-semibold text-slate-100">
                            {movement.balanceAfter} {movement.product?.unit || 'Nos'}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans text-xs italic">
                            Unavailable
                          </span>
                        )}
                      </td>

                      {/* Source Reference */}
                      <td className="py-3 px-4 font-sans text-xs text-slate-300 max-w-xs truncate" title={reference}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{reference}</span>
                        </div>
                      </td>

                      {/* Recorded By Actor */}
                      <td className="py-3 px-4 font-sans text-xs text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px]" title={actor}>
                            {actor}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-sans">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-200">
                {Math.min((currentPage - 1) * pageSize + 1, sortedMovements.length)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(currentPage * pageSize, sortedMovements.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{sortedMovements.length}</span> movements
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: '10', label: '10 per page' },
                  { value: '25', label: '25 per page' },
                  { value: '50', label: '50 per page' },
                ]}
              />

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-2 font-mono text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
