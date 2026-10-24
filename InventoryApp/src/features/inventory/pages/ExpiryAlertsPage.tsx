import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Package,
  Layers,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertCircle,
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
import { useInventoryExpiryAlerts } from '../hooks/useInventory';
import type { InventoryExpiryAlertBatch } from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  type InventoryScope,
} from '../utils/inventoryScope';

const WINDOW_OPTIONS = [
  { value: '7', label: 'Next 7 Days (Critical)' },
  { value: '15', label: 'Next 15 Days (Urgent)' },
  { value: '30', label: 'Next 30 Days (Standard)' },
  { value: '60', label: 'Next 60 Days (Extended)' },
  { value: '90', label: 'Next 90 Days (Quarterly)' },
];

export default function ExpiryAlertsPage() {
  const navigate = useNavigate();
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewStock = hasPermission(user, [
    INVENTORY_PERMISSIONS.STOCK_VIEW,
    'Stock',
    'Low Stock Alerts',
    'Inventory Products',
    'Medical Inventory Dashboard',
    'Medication Management',
  ]);

  // Scope filter
  const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() =>
    getDefaultInventoryScope(user)
  );

  // Alert configuration
  const [daysAhead, setDaysAhead] = useState<number>(30);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPIRED' | 'EXPIRING_SOON'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'days' | 'date' | 'product' | 'quantity'>('days');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Query Hook
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useInventoryExpiryAlerts({
    daysAhead,
    status: statusFilter,
    scope: inventoryScope,
  });

  const alerts: InventoryExpiryAlertBatch[] = data?.alerts || [];
  const summary = data?.summary || {
    totalAlerts: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    expiringTodayCount: 0,
    totalQuantityAtRisk: 0,
    windowDays: daysAhead,
    evaluatedAt: new Date().toISOString(),
  };

  // Derive unique categories from alerts
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    for (const alert of alerts) {
      if (alert.product?.category) {
        cats.add(alert.product.category.trim());
      }
    }
    const sorted = Array.from(cats).sort();
    return [
      { value: 'all', label: 'All Categories' },
      ...sorted.map((c) => ({
        value: c.toLowerCase(),
        label: c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' '),
      })),
    ];
  }, [alerts]);

  // Filtered dataset
  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return alerts.filter((alert) => {
      // Category filter
      if (
        categoryFilter !== 'all' &&
        alert.product?.category?.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Text search
      if (query) {
        const name = alert.product?.name?.toLowerCase() || '';
        const code = alert.product?.code?.toLowerCase() || '';
        const batchNo = alert.batchNumber?.toLowerCase() || '';
        const cat = alert.product?.category?.toLowerCase() || '';

        if (!name.includes(query) && !code.includes(query) && !batchNo.includes(query) && !cat.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, categoryFilter, searchQuery]);

  // Sorted dataset
  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'days':
          comparison = (a.daysRemaining || 0) - (b.daysRemaining || 0);
          break;
        case 'date':
          comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          break;
        case 'product':
          comparison = (a.product?.name || '').localeCompare(b.product?.name || '');
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredAlerts, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / pageSize));
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAlerts.slice(start, start + pageSize);
  }, [sortedAlerts, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Near-Expiry Batch Alerts"
        description="Monitor physical inventory at risk of expiration, enforce First-Expired First-Out (FEFO) dispensing, and prevent expired stock consumption."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/stock')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
            >
              <Layers className="w-4 h-4 mr-2" />
              Stock & Batches
            </Button>
          </div>
        }
      />

      {/* KPI Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900/70 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total at Risk</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{summary.totalQuantityAtRisk.toLocaleString()}</p>
          <span className="text-xs text-slate-500">Units in {summary.totalAlerts} batches</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-rose-900/40 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Expired</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">{summary.expiredCount}</p>
          <span className="text-xs text-rose-400/70">Past expiry date</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-amber-900/40 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2">{summary.expiringSoonCount}</p>
          <span className="text-xs text-amber-400/70">Within {daysAhead} days</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-orange-900/40 bg-orange-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Expires Today</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-300 mt-2">{summary.expiringTodayCount}</p>
          <span className="text-xs text-orange-400/70">Immediate action needed</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800/80 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Alert Window</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300 mt-2">{daysAhead} Days</p>
          <span className="text-xs text-cyan-400/70">Configured horizon</span>
        </Card>
      </div>

      {/* Control Bar: Scope, Window, Search, Filters */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts ({summary.totalAlerts})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('EXPIRED');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'EXPIRED'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Expired ({summary.expiredCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('EXPIRING_SOON');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'EXPIRING_SOON'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Expiring Soon ({summary.expiringSoonCount})
            </button>
          </div>

          {/* Window & Scope Selectors */}
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                value={String(daysAhead)}
                onChange={(e) => {
                  setDaysAhead(Number(e.target.value));
                  setCurrentPage(1);
                }}
                options={WINDOW_OPTIONS}
              />
            </div>
            <div className="w-44">
              <Select
                value={inventoryScope}
                onChange={(e) => setInventoryScope(e.target.value as InventoryScope)}
                options={inventoryScopeOptions}
              />
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search product name, code, batch number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-500" />}
          />

          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={categoryOptions}
          />

          <Select
            label="Sort By"
            value={`${sortField}-${sortAsc ? 'asc' : 'desc'}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-');
              setSortField(field as any);
              setSortAsc(dir === 'asc');
            }}
            options={[
              { value: 'days-asc', label: 'Days Remaining (Fewest First)' },
              { value: 'days-desc', label: 'Days Remaining (Most First)' },
              { value: 'date-asc', label: 'Expiry Date (Earliest First)' },
              { value: 'date-desc', label: 'Expiry Date (Latest First)' },
              { value: 'product-asc', label: 'Product Name (A-Z)' },
              { value: 'quantity-desc', label: 'Stock at Risk (High to Low)' },
            ]}
          />
        </div>
      </Card>

      {/* Main Alerts Table Card */}
      <Card className="overflow-hidden bg-slate-900 border-slate-800">
        {isLoading ? (
          <div className="p-12">
            <LoadingState message="Scanning batches for expiry alerts..." />
          </div>
        ) : isError ? (
          <div className="p-8">
            <ErrorState
              title="Failed to Load Expiry Alerts"
              message={error instanceof Error ? error.message : 'Backend error'}
              onRetry={() => refetch()}
            />
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
              title="No Expiry Alerts"
              description={
                searchQuery || categoryFilter !== 'all' || statusFilter !== 'ALL'
                  ? 'No batches match the selected criteria.'
                  : `All batches with positive stock in this unit are healthy and beyond the ${daysAhead}-day alert threshold.`
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('ALL');
                    setDaysAhead(60);
                  }}
                  className="border-slate-800 text-slate-300"
                >
                  Expand Alert Window to 60 Days
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">S.No</th>
                    <th className="py-3 px-4 font-semibold">Product Name</th>
                    <th className="py-3 px-4 font-semibold">Batch Number</th>
                    <th className="py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3 px-4 font-semibold text-center">Alert Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Stock at Risk</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedAlerts.map((batch, idx) => {
                    const isExpired = batch.status === 'EXPIRED';
                    const isToday = batch.isExpiringToday;
                    const daysRemaining = batch.daysRemaining;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-100">
                            {batch.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {batch.product?.code && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                                {batch.product.code}
                              </span>
                            )}
                            <span className="text-slate-500">•</span>
                            <span>{batch.product?.category || 'General'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded bg-slate-800/90 font-mono text-xs font-semibold text-slate-200 border border-slate-700">
                            {batch.batchNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-200">
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] mt-0.5">
                            {isToday ? (
                              <span className="text-orange-400 font-bold">Expires Today</span>
                            ) : isExpired ? (
                              <span className="text-rose-400 font-medium">
                                Expired {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 ? 's' : ''} ago
                              </span>
                            ) : (
                              <span className="text-amber-400 font-medium">
                                In {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isExpired ? (
                            <Badge variant="danger">
                              <XCircle className="w-3 h-3 mr-1" />
                              EXPIRED
                            </Badge>
                          ) : isToday ? (
                            <Badge variant="warning" className="bg-orange-950/80 text-orange-300 border-orange-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              EXPIRES TODAY
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock className="w-3 h-3 mr-1" />
                              EXPIRING SOON
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg font-mono font-bold text-xs ${
                            isExpired
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                          }`}>
                            {batch.quantity} {batch.product?.unit || 'Nos'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/stock?search=${encodeURIComponent(batch.batchNumber)}`)}
                            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs px-2.5 py-1"
                            title="Inspect in Stock & Batches ledger"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Inspect Batch
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, sortedAlerts.length)} of {sortedAlerts.length} batch alerts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-800 bg-slate-900 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  <span className="text-xs text-slate-400 px-2 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-slate-800 bg-slate-900 text-slate-300"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
