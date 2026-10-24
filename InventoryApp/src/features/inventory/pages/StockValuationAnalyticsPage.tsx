import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Package,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  PieChart
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  LoadingState,
  EmptyState,
  ErrorState,
  Drawer
} from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { hasPermission, INVENTORY_PERMISSIONS } from '../../../lib/permissions';
import {
  useStockValuation,
  useConsumptionAnalytics,
  useInventoryProducts
} from '../hooks/useInventory';
import type { ValuationItem, TopConsumedProduct } from '../types';

export default function StockValuationAnalyticsPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  const canViewReports = hasPermission(user, [
    INVENTORY_PERMISSIONS.VIEW_ALL,
    INVENTORY_PERMISSIONS.STOCK_VIEW,
    INVENTORY_PERMISSIONS.MOVEMENTS_VIEW
  ]);

  const [activeTab, setActiveTab] = useState<'valuation' | 'consumption'>('valuation');

  // Valuation filters
  const [valViewMode, setValViewMode] = useState<'aggregate' | 'batch'>('aggregate');
  const [valCategory, setValCategory] = useState<string>('ALL');
  const [valSearch, setValSearch] = useState<string>('');
  const [showExcludedDrawer, setShowExcludedDrawer] = useState(false);

  // Consumption filters
  const [consDateRange, setConsDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [consCategory, setConsCategory] = useState<string>('ALL');
  const [consProductId, setConsProductId] = useState<string>('ALL');

  // Compute dates for consumption
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const days = consDateRange === '7d' ? 7 : consDateRange === '90d' ? 90 : 30;
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [consDateRange]);

  // Queries
  const {
    data: valuationData,
    isLoading: valLoading,
    isError: valError,
    refetch: refetchValuation
  } = useStockValuation(
    {
      view: valViewMode,
      category: valCategory !== 'ALL' ? valCategory : undefined,
      search: valSearch || undefined
    },
    { unitId: activeUnitId, enabled: canViewReports && activeTab === 'valuation' }
  );

  const {
    data: consumptionData,
    isLoading: consLoading,
    isError: consError,
    refetch: refetchConsumption
  } = useConsumptionAnalytics(
    {
      startDate,
      endDate,
      category: consCategory !== 'ALL' ? consCategory : undefined,
      productId: consProductId !== 'ALL' ? consProductId : undefined
    },
    { unitId: activeUnitId, enabled: canViewReports && activeTab === 'consumption' }
  );

  const { data: allProducts = [] } = useInventoryProducts({ unitId: activeUnitId });

  // Categories list
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [allProducts]);

  // Currency Formatter
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  if (!canViewReports) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Access Restricted"
          message="You do not have permission to view inventory valuation and consumption analytics. Please contact your system administrator."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Inventory Valuation & Consumption Analytics"
        description="Comprehensive stock valuation and verified operational consumption reporting."
        badge={
          <Badge variant="default" className="bg-slate-800 text-slate-300 border-slate-700">
            {activeUnit ? `Unit: ${activeUnit.name}` : 'Facility-wide'}
          </Badge>
        }
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'valuation'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Stock Valuation Report</span>
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'consumption'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Consumption Analytics</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: STOCK VALUATION REPORT
          ========================================================================= */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {/* Operational Valuation Disclaimer Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-100">Operational Inventory Valuation Basis: </span>
                <span>
                  Valuation is calculated using verified acquisition costs from supplier purchase records. Products lacking verified costs are excluded from definitive valuation sums to maintain data integrity.
                </span>
              </div>
            </div>
            <Badge variant="warning" className="shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
              Operational Estimate (Non-Audited Statement)
            </Badge>
          </div>

          {/* Valuation KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Operational Valuation
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {formatCurrency(valuationData?.summary.totalValuationAmount)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Based on {valuationData?.summary.totalItemsValued ?? 0} valued products/batches
              </p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Stock In Facility
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {valuationData?.summary.totalUnitsInStock?.toLocaleString() ?? '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Across {valuationData?.summary.totalProductsCount ?? 0} active catalog items
              </p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cost Coverage Rate
              </div>
              <div className="text-2xl font-bold text-blue-400 font-mono">
                {valuationData?.summary
                  ? `${Math.round(
                      (valuationData.summary.totalItemsValued /
                        Math.max(1, valuationData.summary.totalItemsValued + valuationData.summary.totalItemsExcluded)) *
                        100
                    )}%`
                  : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {valuationData?.summary.totalItemsValued ?? 0} verified /{' '}
                {valuationData?.summary.totalItemsExcluded ?? 0} missing cost
              </p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Missing Cost Safeguard
                </div>
                <div className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{valuationData?.excludedProducts.length ?? 0} Excluded</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExcludedDrawer(true)}
                className="mt-3 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Inspect Excluded Items
              </Button>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="bg-slate-900/60 border-slate-800 p-4 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <Input
                  placeholder="Search product or SKU..."
                  value={valSearch}
                  onChange={(e) => setValSearch(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl text-xs"
                />
              </div>

              <div>
                <Select
                  value={valCategory}
                  onChange={(e) => setValCategory(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl text-xs"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  value={valViewMode}
                  onChange={(e) => setValViewMode(e.target.value as any)}
                  className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl text-xs"
                >
                  <option value="aggregate">Aggregate Product View</option>
                  <option value="batch">Batch Breakdown View</option>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetchValuation()}
                  className="w-full text-xs border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Valuation Items Table */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {valLoading ? (
              <div className="p-12">
                <LoadingState message="Computing verified inventory valuation..." />
              </div>
            ) : valError ? (
              <div className="p-12">
                <ErrorState message="Failed to load valuation data. Please try again." onRetry={refetchValuation} />
              </div>
            ) : !valuationData || valuationData.items.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No valuation items found"
                  description="No stock items matched the current filter criteria."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Category</th>
                      {valViewMode === 'batch' && <th className="py-3 px-4">Batch / Expiry</th>}
                      <th className="py-3 px-4 text-right">Stock Quantity</th>
                      <th className="py-3 px-4 text-right">Applicable Unit Cost</th>
                      <th className="py-3 px-4 text-right">Valuation Amount</th>
                      <th className="py-3 px-4 text-center">Cost Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {valuationData.items.map((item: ValuationItem, idx: number) => {
                      const hasCost = item.applicableUnitCost !== null;
                      return (
                        <tr key={`${item.productId}-${item.batchId || idx}`} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-200">
                            <div>{item.productName}</div>
                            {item.productCode && (
                              <span className="font-mono text-[10px] text-slate-500">{item.productCode}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                          {valViewMode === 'batch' && (
                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              {item.batchNumber ? (
                                <div>
                                  <div>{item.batchNumber}</div>
                                  {item.expiryDate && (
                                    <span className="text-[10px] text-slate-500">
                                      Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600">Non-batch</span>
                              )}
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            {hasCost ? (
                              <span className="text-slate-200">{formatCurrency(item.applicableUnitCost)}</span>
                            ) : (
                              <span className="text-slate-500 italic">Unverified</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            {hasCost ? (
                              <span className="text-emerald-400">{formatCurrency(item.valuationAmount)}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {hasCost ? (
                              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                                Missing Cost
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONSUMPTION ANALYTICS
          ========================================================================= */}
      {activeTab === 'consumption' && (
        <div className="space-y-6">
          {/* Coverage Notice Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-100">Operational Movement Scope: </span>
                <span>
                  Consumption measures true patient dispensing, clinical issues, and kitchen requisitions. Outbound supplier returns, audit adjustments, and discarded waste are cleanly segregated.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsDateRange('7d')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  consDateRange === '7d' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setConsDateRange('30d')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  consDateRange === '30d' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setConsDateRange('90d')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  consDateRange === '90d' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {/* Consumption Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Units Consumed
              </div>
              <div className="text-2xl font-bold text-blue-400 font-mono">
                {consumptionData?.summary.totalConsumedQuantity?.toLocaleString() ?? '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Across {consumptionData?.summary.totalIssueMovements ?? 0} issue movements
              </p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Distinct Products Issued
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {consumptionData?.summary.distinctProductsConsumed?.toLocaleString() ?? '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Active consumption footprint</p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Segregated Vendor Returns
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {consumptionData?.excludedBreakdown.supplierReturnsQty?.toLocaleString() ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Excluded from operational consumption</p>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Inflow Receipts Added
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {consumptionData?.excludedBreakdown.receiptInflowQty?.toLocaleString() ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">GRNs and direct purchases received</p>
            </Card>
          </div>

          {/* Top Consumed Products & Category Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products Table (2 columns wide) */}
            <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>Top Consumed Products</span>
              </h3>
              {consLoading ? (
                <div className="py-8">
                  <LoadingState message="Calculating consumption analytics..." />
                </div>
              ) : !consumptionData || consumptionData.topConsumedProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No consumption recorded for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Units Issued</th>
                        <th className="py-2.5 px-3 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {consumptionData.topConsumedProducts.map((p: TopConsumedProduct) => (
                        <tr key={p.productId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-200">
                            <div>{p.productName}</div>
                            {p.productCode && (
                              <span className="font-mono text-[10px] text-slate-500">{p.productCode}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{p.category}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-blue-400">
                            {p.consumedQuantity.toLocaleString()} {p.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {p.movementCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Category Breakdown (1 column wide) */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Consumption by Category</span>
              </h3>
              {consLoading ? (
                <div className="py-8">
                  <LoadingState message="Aggregating category metrics..." />
                </div>
              ) : !consumptionData || consumptionData.consumptionByCategory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No category consumption data.
                </div>
              ) : (
                <div className="space-y-4">
                  {consumptionData.consumptionByCategory.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300">{cat.category}</span>
                        <span className="font-mono text-slate-400">
                          {cat.quantity.toLocaleString()} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: EXCLUDED PRODUCTS INSPECTION
          ========================================================================= */}
      <Drawer
        isOpen={showExcludedDrawer}
        onClose={() => setShowExcludedDrawer(false)}
        title="Products Excluded from Valuation"
        description="These items are excluded from total valuation sums because verified acquisition cost records do not exist."
      >
        <div className="space-y-4 text-xs">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300">
            To prevent speculative accounting totals, Elder Care ERP mandates that only products with verified supplier acquisition costs are added to valuation sums.
          </div>

          {!valuationData?.excludedProducts || valuationData.excludedProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              Zero products excluded! All in-stock items have verified unit acquisition costs.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {valuationData.excludedProducts.map((p) => (
                <div key={p.productId} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-200">{p.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.productCode || 'No SKU'} • Category: {p.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-slate-300">{p.quantity} Units</div>
                    <Badge variant="warning" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                      Missing Cost
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
