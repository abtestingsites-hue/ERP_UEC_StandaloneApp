import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Package,
  Boxes,
  ShoppingCart,
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  ExternalLink,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Drawer,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { hasPermission, INVENTORY_PERMISSIONS } from '../../../lib/permissions';
import {
  useInventoryStock,
  useInventoryProducts,
  useVendors,
  useCreateInventoryPurchase,
} from '../hooks/useInventory';
import type { InventoryStock, InventoryProduct } from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  stockInScope,
  type InventoryScope,
} from '../utils/inventoryScope';
import {
  DEFAULT_MIN_STOCK_FALLBACK,
  evaluateStockStatus,
  getEffectiveStockThreshold,
  type StockStatusType,
} from '../utils/thresholds';

export default function LowStockAlertsPage() {
  const navigate = useNavigate();
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewStock = hasPermission(user, [
    INVENTORY_PERMISSIONS.STOCK_VIEW,
    'Stock',
    'Low Stock Alerts',
    'Products',
    'Inventory Products',
  ]);
  const canCreatePurchase = hasPermission(user, [
    INVENTORY_PERMISSIONS.PURCHASES_MANAGE,
    'Purchase Orders',
    'Purchases',
    'Create Purchases',
  ]);

  // Inventory Scope state
  const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() =>
    getDefaultInventoryScope(user)
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'alerts_only' | 'out_of_stock' | 'low_stock' | 'all'>('alerts_only');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'product' | 'quantity' | 'threshold' | 'category'>('quantity');
  const [sortAsc, setSortAsc] = useState(true); // default ascending quantity (lowest stock first)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Purchase Restock Drawer state
  const [isRestockDrawerOpen, setIsRestockDrawerOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryStock | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    vendorId: '',
    vendorName: '',
    isCustomVendor: false,
    quantity: '',
    batchNumber: '',
    expiryDate: '',
  });

  // Query Hooks (all bound to unit-aware active context)
  const {
    data: stock = [],
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
    refetch: refetchStock,
  } = useInventoryStock();

  const {
    data: products = [],
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useInventoryProducts();

  const {
    data: vendors = [],
    isLoading: isVendorsLoading,
    refetch: refetchVendors,
  } = useVendors();

  const createPurchaseMutation = useCreateInventoryPurchase();

  // Active registered vendors
  const activeVendors = useMemo(() => vendors.filter((v) => v.status !== false), [vendors]);
  const vendorOptions = useMemo(() => {
    const list = activeVendors.map((v) => ({
      value: v.id,
      label: `${v.name || 'Unnamed Vendor'} (${v.code || 'Vendor'}${v.category ? ` - ${v.category}` : ''})`,
    }));
    return [
      ...list,
      { value: '__custom__', label: '+ Other / Enter Vendor Name Manually' },
    ];
  }, [activeVendors]);

  // Scoped Stock dataset based on selected clinical/elder scope
  const scopedStock = useMemo(
    () => stock.filter((item) => stockInScope(item, inventoryScope)),
    [stock, inventoryScope]
  );

  // Derive unique categories from scoped stock for filter dropdown
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    for (const item of scopedStock) {
      if (item.product?.category) {
        cats.add(item.product.category.trim());
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
  }, [scopedStock]);

  // Evaluated stock items enriched with threshold computation
  const evaluatedStockItems = useMemo(() => {
    return scopedStock.map((item) => {
      const evaluation = evaluateStockStatus(item.quantity, item.product);
      return {
        ...item,
        evaluation,
      };
    });
  }, [scopedStock]);

  // KPI Metrics computed from scoped dataset
  const metrics = useMemo(() => {
    let totalMonitored = evaluatedStockItems.length;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;

    for (const item of evaluatedStockItems) {
      if (item.evaluation.status === 'OUT_OF_STOCK') {
        outOfStockCount++;
      } else if (item.evaluation.status === 'LOW_STOCK') {
        lowStockCount++;
      } else {
        healthyCount++;
      }
    }

    return {
      totalMonitored,
      totalAlerts: outOfStockCount + lowStockCount,
      outOfStockCount,
      lowStockCount,
      healthyCount,
    };
  }, [evaluatedStockItems]);

  // Filtered dataset according to UI search, status, and category
  const filteredStock = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return evaluatedStockItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'alerts_only') {
        if (item.evaluation.status === 'AVAILABLE') return false;
      } else if (statusFilter === 'out_of_stock') {
        if (item.evaluation.status !== 'OUT_OF_STOCK') return false;
      } else if (statusFilter === 'low_stock') {
        if (item.evaluation.status !== 'LOW_STOCK') return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        const itemCat = String(item.product?.category || '').trim().toLowerCase();
        if (itemCat !== categoryFilter.toLowerCase()) return false;
      }

      // 3. Search Query
      if (query) {
        const pName = String(item.product?.name || '').toLowerCase();
        const pCode = String(item.product?.code || '').toLowerCase();
        const pCat = String(item.product?.category || '').toLowerCase();
        const pUnit = String(item.product?.unit || '').toLowerCase();
        if (
          !pName.includes(query) &&
          !pCode.includes(query) &&
          !pCat.includes(query) &&
          !pUnit.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [evaluatedStockItems, statusFilter, categoryFilter, searchQuery]);

  // Sorted dataset
  const sortedStock = useMemo(() => {
    return [...filteredStock].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'product':
          valA = (a.product?.name || '').toLowerCase();
          valB = (b.product?.name || '').toLowerCase();
          break;
        case 'category':
          valA = (a.product?.category || '').toLowerCase();
          valB = (b.product?.category || '').toLowerCase();
          break;
        case 'threshold':
          valA = a.evaluation.threshold;
          valB = b.evaluation.threshold;
          break;
        case 'quantity':
        default:
          valA = Number(a.quantity || 0);
          valB = Number(b.quantity || 0);
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredStock, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedStock.length / pageSize) || 1;
  const paginatedStock = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStock.slice(start, start + pageSize);
  }, [sortedStock, currentPage, pageSize]);

  // Refresh
  const handleRefresh = () => {
    refetchStock();
    refetchProducts();
    refetchVendors();
  };

  // Restock Drawer Handlers
  const handleOpenRestock = (item: InventoryStock) => {
    if (!canCreatePurchase) {
      navigate('/app/purchases');
      return;
    }

    setSelectedStockItem(item);
    setFormError(null);
    setFormData({
      productId: item.productId,
      vendorId: activeVendors.length > 0 ? activeVendors[0].id : '',
      vendorName: activeVendors.length > 0 ? activeVendors[0].name : '',
      isCustomVendor: activeVendors.length === 0,
      quantity: '',
      batchNumber: '',
      expiryDate: '',
    });
    setIsRestockDrawerOpen(true);
  };

  const handleVendorSelect = (val: string) => {
    if (val === '__custom__') {
      setFormData((prev) => ({
        ...prev,
        vendorId: '',
        isCustomVendor: true,
        vendorName: '',
      }));
    } else {
      const v = vendors.find((vend) => vend.id === val);
      setFormData((prev) => ({
        ...prev,
        vendorId: val,
        isCustomVendor: false,
        vendorName: v?.name || '',
      }));
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = Math.trunc(Number(formData.quantity || 0));
    if (!formData.productId) {
      setFormError('Please select a valid inventory product');
      return;
    }
    if (qty <= 0) {
      setFormError('Restock quantity must be a positive integer greater than zero');
      return;
    }

    const resolvedVendor = formData.vendorName.trim();
    if (!formData.vendorId && !resolvedVendor) {
      setFormError('Please select a registered vendor or enter a vendor name');
      return;
    }

    const product = selectedStockItem?.product || products.find((p) => p.id === formData.productId);
    if (product?.isBatchTracked) {
      if (!formData.batchNumber.trim()) {
        setFormError('This product is batch-tracked. Batch number is required.');
        return;
      }
      if (!formData.expiryDate) {
        setFormError('This product is batch-tracked. Expiry date is required.');
        return;
      }
    }

    try {
      await createPurchaseMutation.mutateAsync({
        productId: formData.productId,
        quantity: qty,
        vendorId: formData.vendorId ? formData.vendorId : undefined,
        vendor: resolvedVendor || undefined,
        batchNumber: formData.batchNumber.trim() || undefined,
        expiryDate: formData.expiryDate || undefined,
      });

      setIsRestockDrawerOpen(false);
      setSelectedStockItem(null);
      refetchStock();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to record restock purchase');
    }
  };

  if (!canViewStock) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Low Stock Alerts"
          description="Proactive reorder monitoring and critical stock shortage tracking"
        />
        <Card className="p-8 text-center bg-slate-900 border-slate-800">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">Access Restricted</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Your role lacks permissions to view live stock alert thresholds. Contact your
            administrator to request inventory read privileges.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Low Stock Alerts"
        description={`Live shortage tracking and reorder threshold monitoring for ${activeUnit?.name || 'Active Unit'}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isStockLoading}
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isStockLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreatePurchase && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/purchases')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchase Orders
              </Button>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Products */}
        <Card className="p-5 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monitored Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-100">{metrics.totalMonitored}</div>
            <p className="text-xs text-slate-500 mt-1">Live stock items in {getInventoryScopeLabel(inventoryScope)}</p>
          </div>
        </Card>

        {/* Total Low Stock Warnings */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            statusFilter === 'low_stock' ? 'ring-2 ring-amber-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'alerts_only' : 'low_stock')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-400">{metrics.lowStockCount}</div>
            <p className="text-xs text-slate-500 mt-1">Qty at or below threshold</p>
          </div>
        </Card>

        {/* Critical Out of Stock */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            statusFilter === 'out_of_stock' ? 'ring-2 ring-rose-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'out_of_stock' ? 'alerts_only' : 'out_of_stock')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Critical Shortages
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-400">{metrics.outOfStockCount}</div>
            <p className="text-xs text-slate-500 mt-1">Depleted stock (0 balance)</p>
          </div>
        </Card>

        {/* Healthy Level Stock */}
        <Card
          className={`p-5 bg-slate-900 border-slate-800 flex flex-col justify-between cursor-pointer transition-colors ${
            statusFilter === 'all' ? 'ring-2 ring-emerald-500/50' : 'hover:border-slate-700'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'alerts_only' : 'all')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Healthy Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-400">{metrics.healthyCount}</div>
            <p className="text-xs text-slate-500 mt-1">Comfortably above reorder level</p>
          </div>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 bg-slate-900 border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by product name, SKU / code, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          {/* Scope, Category, and Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Inventory Scope */}
            <div className="w-44">
              <Select
                value={inventoryScope}
                onChange={(e) => {
                  setInventoryScope(e.target.value as InventoryScope);
                  setCurrentPage(1);
                }}
                options={inventoryScopeOptions}
              />
            </div>

            {/* Category Filter */}
            <div className="w-44">
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
              />
            </div>

            {/* Status Tabs */}
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('alerts_only');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'alerts_only'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Alerts ({metrics.totalAlerts})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('out_of_stock');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Out of Stock ({metrics.outOfStockCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('low_stock');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'low_stock'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Low ({metrics.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({metrics.totalMonitored})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Stock Alert Table */}
      {isStockLoading ? (
        <Card className="p-12 bg-slate-900 border-slate-800">
          <LoadingState message="Calculating real-time stock alert thresholds..." />
        </Card>
      ) : isStockError ? (
        <Card className="p-8 bg-slate-900 border-slate-800">
          <ErrorState
            title="Failed to Load Stock Balances"
            message={(stockError as any)?.message || 'An error occurred while loading inventory.'}
            onRetry={refetchStock}
          />
        </Card>
      ) : sortedStock.length === 0 ? (
        <Card className="p-12 bg-slate-900 border-slate-800">
          {statusFilter === 'alerts_only' || statusFilter === 'out_of_stock' || statusFilter === 'low_stock' ? (
            <EmptyState
              title="All Inventory Levels Healthy"
              description={`No products in ${getInventoryScopeLabel(inventoryScope)} currently require restocking.`}
              icon={<CheckCircle2 className="w-12 h-12 text-emerald-400" />}
              action={
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                  View All {metrics.totalMonitored} Products
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No Products Found"
              description="No inventory items matched your selected filters."
              icon={<Boxes className="w-12 h-12 text-slate-500" />}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('alerts_only');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
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
                      <span>Product</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200"
                    onClick={() => {
                      if (sortField === 'category') setSortAsc(!sortAsc);
                      else {
                        setSortField('category');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 text-right"
                    onClick={() => {
                      if (sortField === 'quantity') setSortAsc(!sortAsc);
                      else {
                        setSortField('quantity');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Current Qty</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 text-right"
                    onClick={() => {
                      if (sortField === 'threshold') setSortAsc(!sortAsc);
                      else {
                        setSortField('threshold');
                        setSortAsc(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Reorder Threshold</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedStock.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isOut = item.evaluation.status === 'OUT_OF_STOCK';
                  const isLow = item.evaluation.status === 'LOW_STOCK';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isOut ? 'bg-rose-950/15' : isLow ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100">
                              {item.product?.name || 'Unknown Product'}
                            </span>
                            {item.product?.code && (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-300 border border-slate-700">
                                {item.product.code}
                              </span>
                            )}
                            {item.product?.isBatchTracked && (
                              <span className="rounded bg-purple-900/30 text-purple-300 border border-purple-500/30 px-1 py-0.2 text-[9px] font-semibold">
                                FEFO
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5">
                            Unit: {item.product?.unit || 'Nos'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="capitalize">{item.product?.category || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOut
                              ? 'text-rose-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.quantity} {item.product?.unit || 'Nos'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-slate-200">
                            {item.evaluation.threshold}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              item.evaluation.hasCustomThreshold
                                ? 'text-blue-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.evaluation.hasCustomThreshold ? '(Product)' : `(Default ${DEFAULT_MIN_STOCK_FALLBACK})`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.evaluation.variant}>
                          {item.evaluation.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canCreatePurchase ? (
                          <Button
                            size="sm"
                            variant={isOut ? 'danger' : 'outline'}
                            onClick={() => handleOpenRestock(item)}
                            className="text-xs py-1 px-2.5 h-auto"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                            Restock
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-200">
                {Math.min((currentPage - 1) * pageSize + 1, sortedStock.length)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(currentPage * pageSize, sortedStock.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{sortedStock.length}</span> items
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

      {/* Restock Purchase Drawer */}
      <Drawer
        isOpen={isRestockDrawerOpen}
        onClose={() => {
          setIsRestockDrawerOpen(false);
          setSelectedStockItem(null);
        }}
        title="Restock Purchase Order"
        size="md"
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4 p-4 text-slate-100">
          <p className="text-xs text-slate-400">
            Record incoming stock procurement directly to replenish items at or below reorder levels.
          </p>

          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product (Preselected) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Product to Restock
            </label>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-100">
                  {selectedStockItem?.product?.name || 'Selected Product'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  SKU: {selectedStockItem?.product?.code || 'None'} • Category: {selectedStockItem?.product?.category || '-'}
                </div>
              </div>
              <Badge variant={selectedStockItem ? evaluateStockStatus(selectedStockItem.quantity, selectedStockItem.product).variant : 'outline'}>
                Current Qty: {selectedStockItem?.quantity ?? 0}
              </Badge>
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Procurement Vendor
            </label>
            <Select
              value={formData.isCustomVendor ? '__custom__' : formData.vendorId}
              onChange={(e) => handleVendorSelect(e.target.value)}
              options={vendorOptions}
            />
            {formData.isCustomVendor && (
              <Input
                type="text"
                placeholder="Enter custom vendor / supplier name"
                value={formData.vendorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorName: e.target.value }))}
                className="mt-2 bg-slate-950 border-slate-800"
              />
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Restock Quantity ({selectedStockItem?.product?.unit || 'Nos'})
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              required
              placeholder="Enter units received"
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          {/* FEFO Batch Details if product is batch-tracked */}
          {selectedStockItem?.product?.isBatchTracked && (
            <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Layers className="w-3.5 h-3.5" />
                <span>Batch Tracking Required (Medical / FEFO)</span>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Batch Number</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. BATCH-2026-X1"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRestockDrawerOpen(false);
                setSelectedStockItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createPurchaseMutation.isPending}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {createPurchaseMutation.isPending ? 'Recording Purchase...' : 'Confirm Restock'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
