import React, { useMemo, useState } from 'react';
import {
  Layers,
  Search,
  RotateCcw,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
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
  useInventoryProducts,
  useInventoryStock,
  useInventoryBatches,
  useUpdateInventoryStock,
} from '../hooks/useInventory';
import type { InventoryStock, InventoryProductBatch, InventoryProduct } from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  productInScope,
  stockInScope,
  type InventoryScope,
} from '../utils/inventoryScope';

const DEFAULT_MIN_STOCK_FALLBACK = 10;

const STOCK_MODE_OPTIONS = [
  { value: 'IN', label: 'Stock In (Receipt / Restock)' },
  { value: 'OUT', label: 'Stock Out (Issue / Consumption)' },
];

const PURPOSE_OPTIONS_IN = [
  { value: 'Stock Receipt', label: 'Stock Receipt' },
  { value: 'Purchase', label: 'Purchase Receipt' },
  { value: 'Family Supplied', label: 'Family Supplied' },
  { value: 'Vendor Supplied', label: 'Vendor Supplied' },
  { value: 'Opening Adjustment', label: 'Opening Adjustment' },
];

const PURPOSE_OPTIONS_OUT = [
  { value: 'Department Use', label: 'Department Use' },
  { value: 'Patient Use', label: 'Patient Use' },
  { value: 'Damage / Breakage', label: 'Damage / Breakage' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Maintenance', label: 'Maintenance' },
];

export default function StockBatchesPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Permission checks (authoritative backend roles & permissions)
  const canViewStock = hasPermission(user, [
    INVENTORY_PERMISSIONS.STOCK_VIEW,
    'Stock',
    'Inventory Stock',
    'Inventory Products',
  ]);
  const canUpdateStock = hasPermission(user, [
    INVENTORY_PERMISSIONS.STOCK_MANAGE,
    'Update Stock',
    'Stock',
    'Inventory Stock',
  ]);

  // Tab State: 'stock' (Stock Ledger) vs 'batches' (FEFO Batch Tracker)
  const [activeTab, setActiveTab] = useState<'stock' | 'batches'>('stock');

  // Scope filter (elder, medical, all)
  const [inventoryScope, setInventoryScope] = useState<InventoryScope>(() =>
    getDefaultInventoryScope(user)
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [batchStatusFilter, setBatchStatusFilter] = useState<'all' | 'healthy' | 'expiring' | 'expired'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<'product' | 'code' | 'category' | 'quantity' | 'updatedAt'>('product');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Batch inspector drawer state (per product)
  const [inspectedProduct, setInspectedProduct] = useState<InventoryProduct | null>(null);

  // Stock Adjustment Drawer state
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState(false);
  const [adjustFormData, setAdjustFormData] = useState({
    productId: '',
    mode: 'IN' as 'IN' | 'OUT',
    quantity: '',
    batchId: '',
    batchNumber: '',
    expiryDate: '',
    referenceNo: '',
    storageLocation: '',
    issuedTo: '',
    usageType: '',
    notes: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Query Hooks (properly unit-isolated)
  const {
    data: products = [],
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useInventoryProducts();

  const {
    data: stock = [],
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
    refetch: refetchStock,
  } = useInventoryStock();

  const {
    data: allBatches = [],
    isLoading: isBatchesLoading,
    refetch: refetchBatches,
  } = useInventoryBatches();

  const updateStockMutation = useUpdateInventoryStock();

  // Scoped datasets
  const scopedProducts = useMemo(
    () => products.filter((p) => productInScope(p, inventoryScope)),
    [products, inventoryScope]
  );

  const scopedStock = useMemo(
    () => stock.filter((item) => stockInScope(item, inventoryScope)),
    [stock, inventoryScope]
  );

  const scopedBatches = useMemo(
    () => allBatches.filter((b) => productInScope(b.product, inventoryScope)),
    [allBatches, inventoryScope]
  );

  // Active batches mapped by productId
  const batchesByProductId = useMemo(() => {
    const map = new Map<string, InventoryProductBatch[]>();
    for (const b of scopedBatches) {
      if (!map.has(b.productId)) {
        map.set(b.productId, []);
      }
      map.get(b.productId)!.push(b);
    }
    return map;
  }, [scopedBatches]);

  // Product options for Stock In / Out drawer
  const productOptions = useMemo(
    () =>
      scopedProducts.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.category})${p.code ? ` - ${p.code}` : ''}`,
      })),
    [scopedProducts]
  );

  // Product & Batch Tracking derivation for Adjustment Form
  const selectedAdjustProduct = useMemo(() => {
    return products.find((p) => p.id === adjustFormData.productId) || null;
  }, [products, adjustFormData.productId]);

  const isAdjustProductBatchTracked = useMemo(() => {
    if (!selectedAdjustProduct) return false;
    return Boolean(
      selectedAdjustProduct.isBatchTracked ||
      (selectedAdjustProduct.category && String(selectedAdjustProduct.category).toLowerCase() === 'medical')
    );
  }, [selectedAdjustProduct]);

  const availableBatchesForDeduction = useMemo(() => {
    if (!adjustFormData.productId || !isAdjustProductBatchTracked) return [];
    return allBatches.filter(
      (b) => b.productId === adjustFormData.productId && Number(b.quantity || 0) > 0
    );
  }, [allBatches, adjustFormData.productId, isAdjustProductBatchTracked]);

  // Product threshold calculation
  const getProductThreshold = (item: InventoryStock) => {
    const minLevel = Number(item.product?.minStockLevel);
    return Number.isFinite(minLevel) && minLevel > 0 ? minLevel : DEFAULT_MIN_STOCK_FALLBACK;
  };

  // Stock status logic
  const getStockStatus = (item: InventoryStock): {
    label: string;
    variant: 'success' | 'warning' | 'danger';
    key: 'available' | 'low' | 'out';
  } => {
    const qty = Number(item.quantity || 0);
    const threshold = getProductThreshold(item);
    if (qty <= 0) {
      return { label: 'Out of Stock', variant: 'danger', key: 'out' };
    }
    if (qty <= threshold) {
      return { label: 'Low Stock', variant: 'warning', key: 'low' };
    }
    return { label: 'Available', variant: 'success', key: 'available' };
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let availableCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of scopedStock) {
      const status = getStockStatus(item);
      if (status.key === 'available') availableCount++;
      else if (status.key === 'low') lowStockCount++;
      else if (status.key === 'out') outOfStockCount++;
    }

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let expiredBatches = 0;
    let expiringSoonBatches = 0;

    for (const b of scopedBatches) {
      const exp = new Date(b.expiryDate);
      if (exp < now) expiredBatches++;
      else if (exp <= thirtyDays) expiringSoonBatches++;
    }

    return {
      totalRecords: scopedStock.length,
      availableCount,
      lowStockCount,
      outOfStockCount,
      totalBatches: scopedBatches.length,
      expiredBatches,
      expiringSoonBatches,
    };
  }, [scopedStock, scopedBatches]);

  // Filtered Stock list
  const filteredStock = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return scopedStock.filter((item) => {
      const product = item.product;
      const status = getStockStatus(item);

      // Status filter
      if (statusFilter !== 'all' && status.key !== statusFilter) {
        return false;
      }

      // Query filter
      if (!query) return true;
      const matchName = product?.name?.toLowerCase().includes(query);
      const matchCode = product?.code?.toLowerCase().includes(query);
      const matchCat = product?.category?.toLowerCase().includes(query);
      const matchQty = String(item.quantity).includes(query);

      return Boolean(matchName || matchCode || matchCat || matchQty);
    });
  }, [scopedStock, searchQuery, statusFilter]);

  // Sorted Stock list
  const sortedStock = useMemo(() => {
    return [...filteredStock].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'product':
          valA = (a.product?.name || '').toLowerCase();
          valB = (b.product?.name || '').toLowerCase();
          break;
        case 'code':
          valA = (a.product?.code || '').toLowerCase();
          valB = (b.product?.code || '').toLowerCase();
          break;
        case 'category':
          valA = (a.product?.category || '').toLowerCase();
          valB = (b.product?.category || '').toLowerCase();
          break;
        case 'quantity':
          valA = Number(a.quantity || 0);
          valB = Number(b.quantity || 0);
          break;
        case 'updatedAt':
          valA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          valB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredStock, sortField, sortAsc]);

  // Paginated Stock
  const totalStockPages = Math.ceil(sortedStock.length / pageSize) || 1;
  const paginatedStock = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStock.slice(start, start + pageSize);
  }, [sortedStock, currentPage, pageSize]);

  // Batch status helper
  const getBatchExpiryInfo = (expiryDateStr: string) => {
    const now = new Date();
    const exp = new Date(expiryDateStr);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const isExpired = exp < now;
    const isExpiringSoon = !isExpired && exp <= thirtyDays;

    if (isExpired) {
      return {
        label: 'Expired',
        variant: 'danger' as const,
        statusKey: 'expired',
        daysRemaining: Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    }
    if (isExpiringSoon) {
      return {
        label: 'Expiring Soon',
        variant: 'warning' as const,
        statusKey: 'expiring',
        daysRemaining: Math.max(0, Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
      };
    }
    return {
      label: 'Healthy (FEFO)',
      variant: 'success' as const,
      statusKey: 'healthy',
      daysRemaining: Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    };
  };

  // Filtered Batches list for Batches view
  const filteredBatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return scopedBatches.filter((b) => {
      const expiryInfo = getBatchExpiryInfo(b.expiryDate);

      if (batchStatusFilter !== 'all' && expiryInfo.statusKey !== batchStatusFilter) {
        return false;
      }

      if (!query) return true;
      const matchBatch = b.batchNumber.toLowerCase().includes(query);
      const matchProd = b.product?.name?.toLowerCase().includes(query);
      const matchCode = b.product?.code?.toLowerCase().includes(query);

      return Boolean(matchBatch || matchProd || matchCode);
    });
  }, [scopedBatches, searchQuery, batchStatusFilter]);

  // Refresh handler
  const handleRefresh = () => {
    refetchStock();
    refetchBatches();
    refetchProducts();
  };

  // Open Adjustment Drawer
  const openStockDrawer = (mode: 'IN' | 'OUT' = 'IN', productId = '', batchId = '') => {
    if (!canUpdateStock) return;
    setAdjustError(null);
    setAdjustFormData({
      productId,
      mode,
      quantity: '',
      batchId,
      batchNumber: '',
      expiryDate: '',
      referenceNo: '',
      storageLocation: '',
      issuedTo: '',
      usageType: mode === 'OUT' ? 'Department Use' : 'Stock Receipt',
      notes: '',
    });
    setIsAdjustDrawerOpen(true);
  };

  // Handle Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);

    const qty = Math.trunc(Number(adjustFormData.quantity || 0));
    if (!adjustFormData.productId) {
      setAdjustError('Please select a valid inventory product');
      return;
    }
    if (qty <= 0) {
      setAdjustError('Quantity must be a positive integer greater than zero');
      return;
    }

    // Check balance for OUT movements
    if (adjustFormData.mode === 'OUT') {
      const currentRecord = stock.find((s) => s.productId === adjustFormData.productId);
      const currentQty = Number(currentRecord?.quantity || 0);
      if (qty > currentQty) {
        setAdjustError(
          `Cannot issue ${qty} units. Current stock balance is only ${currentQty} units.`
        );
        return;
      }
    }

    // Batch validation for batch-tracked items
    if (isAdjustProductBatchTracked) {
      if (adjustFormData.mode === 'IN') {
        if (!adjustFormData.batchNumber.trim() || !adjustFormData.expiryDate) {
          setAdjustError('Batch number and expiry date are required for batch-tracked product restock.');
          return;
        }
      } else {
        if (!adjustFormData.batchId) {
          setAdjustError('Please select a specific batch to deduct from.');
          return;
        }
        const targetBatch = allBatches.find((b) => b.id === adjustFormData.batchId);
        const batchQty = Number(targetBatch?.quantity || 0);
        if (qty > batchQty) {
          setAdjustError(
            `Cannot deduct ${qty} units. Selected batch (${targetBatch?.batchNumber || 'N/A'}) only has ${batchQty} units available.`
          );
          return;
        }
      }
    }

    const traceNotes = [
      adjustFormData.referenceNo ? `Reference/Bill: ${adjustFormData.referenceNo.trim()}` : '',
      adjustFormData.storageLocation ? `Storage/Location: ${adjustFormData.storageLocation.trim()}` : '',
      adjustFormData.issuedTo
        ? `${adjustFormData.mode === 'OUT' ? 'Issued To' : 'Received From'}: ${adjustFormData.issuedTo.trim()}`
        : '',
      adjustFormData.notes ? `Notes: ${adjustFormData.notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      await updateStockMutation.mutateAsync({
        productId: adjustFormData.productId,
        quantity: adjustFormData.mode === 'OUT' ? -qty : qty,
        batchId: isAdjustProductBatchTracked && adjustFormData.mode === 'OUT' ? adjustFormData.batchId : undefined,
        batchNumber: isAdjustProductBatchTracked && adjustFormData.mode === 'IN' ? adjustFormData.batchNumber.trim() : undefined,
        expiryDate: isAdjustProductBatchTracked && adjustFormData.mode === 'IN' ? adjustFormData.expiryDate : undefined,
        usageType:
          adjustFormData.usageType ||
          (adjustFormData.mode === 'OUT' ? 'Department Use' : 'Stock Receipt'),
        referenceNo: adjustFormData.referenceNo.trim() || undefined,
        storageLocation: adjustFormData.storageLocation.trim() || undefined,
        issuedTo: adjustFormData.issuedTo.trim() || undefined,
        notes: traceNotes || undefined,
      });

      setIsAdjustDrawerOpen(false);
    } catch (err: any) {
      setAdjustError(
        err?.response?.data?.message || err?.message || 'Failed to update stock quantity'
      );
    }
  };

  // Format category badge
  const formatCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'medical':
        return 'Medical & Clinical';
      case 'ration':
        return 'Ration & Kitchen';
      case 'stationary':
        return 'Stationary';
      case 'electrical-plumbing':
        return 'Electrical & Plumbing';
      case 'assets':
        return 'Facility Assets';
      default:
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stock & Batches"
        description={`Real-time physical stock ledger, adjustments and FEFO batch tracking for ${
          activeUnit ? activeUnit.name : 'Active Operating Unit'
        }.`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isStockLoading || isBatchesLoading}
              title="Refresh ledger from server"
            >
              <RotateCcw
                className={`w-4 h-4 mr-2 ${
                  isStockLoading || isBatchesLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>

            {canUpdateStock && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => openStockDrawer('IN')}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Stock Adjustment
              </Button>
            )}
          </div>
        }
      />

      {/* Primary KPI Metrics Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tracked Items
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100 font-mono">
              {summaryMetrics.totalRecords}
            </span>
            <span className="text-xs text-slate-400 font-medium">SKUs</span>
          </div>
        </Card>

        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Available
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {summaryMetrics.availableCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Low Stock Alert
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {summaryMetrics.lowStockCount}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </Card>

        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            Out of Stock
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">
              {summaryMetrics.outOfStockCount}
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
        </Card>

        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Active Batches
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">
              {summaryMetrics.totalBatches}
            </span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
        </Card>

        <Card className="p-3.5 border-slate-800 bg-slate-900/60 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
            Expiring / Expired
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">
              {summaryMetrics.expiredBatches + summaryMetrics.expiringSoonBatches}
            </span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
        </Card>
      </section>

      {/* Tab Switcher & Scope Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('stock');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stock'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Stock Ledger
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {scopedStock.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('batches');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'batches'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            FEFO Batches
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {scopedBatches.length}
            </span>
          </button>
        </div>

        {/* Operating Scope Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 hidden md:inline">
            Scope:
          </span>
          <div className="w-48">
            <Select
              value={inventoryScope}
              onChange={(e) => {
                setInventoryScope(e.target.value as InventoryScope);
                setCurrentPage(1);
              }}
              options={inventoryScopeOptions}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Input
              placeholder={
                activeTab === 'stock'
                  ? 'Search stock by product name, SKU, category...'
                  : 'Search batches by batch number, product name, SKU...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'stock' ? (
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'available', label: 'Available' },
                    { value: 'low', label: 'Low Stock' },
                    { value: 'out', label: 'Out of Stock' },
                  ]}
                />
              </div>
            ) : (
              <div className="w-44">
                <Select
                  value={batchStatusFilter}
                  onChange={(e) => {
                    setBatchStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Batches' },
                    { value: 'healthy', label: 'Healthy Only' },
                    { value: 'expiring', label: 'Expiring Soon' },
                    { value: 'expired', label: 'Expired Only' },
                  ]}
                />
              </div>
            )}

            {(searchQuery || statusFilter !== 'all' || batchStatusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setBatchStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* VIEW A: STOCK LEDGER TABLE */}
      {activeTab === 'stock' && (
        <Card className="border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          {isStockLoading ? (
            <div className="py-20">
              <LoadingState message="Fetching live stock records..." />
            </div>
          ) : isStockError ? (
            <div className="py-12 px-6">
              <ErrorState
                title="Unable to load stock ledger"
                message={
                  (stockError as any)?.response?.data?.message ||
                  (stockError as any)?.message ||
                  'Failed to fetch unit stock balances.'
                }
                onRetry={handleRefresh}
              />
            </div>
          ) : sortedStock.length === 0 ? (
            <div className="py-16 px-6">
              <EmptyState
                icon={<Layers className="w-12 h-12 text-slate-600" />}
                title="No stock records found"
                description={
                  searchQuery || statusFilter !== 'all'
                    ? 'No stock items match your search or filter criteria.'
                    : `No physical stock records recorded for ${getInventoryScopeLabel(
                        inventoryScope
                      ).toLowerCase()} in this unit.`
                }
                action={
                  canUpdateStock ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openStockDrawer('IN')}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Initial Stock
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
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
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
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
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 select-none transition-colors"
                      onClick={() => {
                        if (sortField === 'quantity') setSortAsc(!sortAsc);
                        else {
                          setSortField('quantity');
                          setSortAsc(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Current Stock</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Stock Status</th>
                    <th className="py-3.5 px-4 text-center">Batches (FEFO)</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                      onClick={() => {
                        if (sortField === 'updatedAt') setSortAsc(!sortAsc);
                        else {
                          setSortField('updatedAt');
                          setSortAsc(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Last Updated</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {paginatedStock.map((item, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const statusInfo = getStockStatus(item);
                    const productBatches = batchesByProductId.get(item.productId) || [];

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors group text-slate-200"
                      >
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                          {globalIdx}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                                  {item.product?.name || 'Unknown Product'}
                                </span>
                                {item.product?.code && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold tracking-tight">
                                    {item.product.code}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Alert Threshold: {getProductThreshold(item)}{' '}
                                {item.product?.unit || 'Nos'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
                            {formatCategoryLabel(item.product?.category || '-')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-base text-slate-100">
                            {item.quantity}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {item.product?.unit || 'Nos'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {productBatches.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setInspectedProduct(item.product || null)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-200 transition text-xs font-semibold"
                            >
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{productBatches.length} Batches</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No batches</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                          {item.updatedAt
                            ? new Date(item.updatedAt).toLocaleString('en-GB', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {canUpdateStock ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStockDrawer('IN', item.productId)}
                                className="h-8 px-2.5 bg-emerald-950/30 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300"
                                title="Stock In / Add units"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                In
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStockDrawer('OUT', item.productId)}
                                className="h-8 px-2.5 bg-rose-950/30 border-rose-800/60 text-rose-400 hover:bg-rose-900/50 hover:text-rose-300"
                                title="Stock Out / Issue units"
                              >
                                <Minus className="w-3.5 h-3.5 mr-1" />
                                Out
                              </Button>
                            </div>
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
          )}

          {/* Pagination Controls */}
          {sortedStock.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-bold text-slate-200">
                  {Math.min((currentPage - 1) * pageSize + 1, sortedStock.length)}
                </span>
                <span>to</span>
                <span className="font-bold text-slate-200">
                  {Math.min(currentPage * pageSize, sortedStock.length)}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-200">{sortedStock.length}</span>
                <span>records</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="px-3 font-semibold text-slate-300">
                  Page {currentPage} of {totalStockPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalStockPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalStockPages, p + 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* VIEW B: FEFO BATCHES TRACKER */}
      {activeTab === 'batches' && (
        <Card className="border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          {isBatchesLoading ? (
            <div className="py-20">
              <LoadingState message="Fetching active inventory batches..." />
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="py-16 px-6">
              <EmptyState
                icon={<Clock className="w-12 h-12 text-slate-600" />}
                title="No active batches found"
                description={
                  searchQuery || batchStatusFilter !== 'all'
                    ? 'No product batches match your filter criteria.'
                    : `No active batches with quantity > 0 recorded for ${getInventoryScopeLabel(
                        inventoryScope
                      ).toLowerCase()} in this unit.`
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Batch Number</th>
                    <th className="py-3.5 px-4">Associated Product</th>
                    <th className="py-3.5 px-4 text-right">Remaining Qty</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4 text-center">FEFO Status</th>
                    <th className="py-3.5 px-4 text-right">Days Remaining</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredBatches.map((batch, idx) => {
                    const expiry = getBatchExpiryInfo(batch.expiryDate);

                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-800/40 transition-colors group text-slate-200"
                      >
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {batch.batchNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">
                              {batch.product?.name || 'Unknown Product'}
                            </span>
                            {batch.product?.code && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold">
                                {batch.product.code}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatCategoryLabel(batch.product?.category || '-')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-base text-slate-100">
                            {batch.quantity}
                          </span>{' '}
                          <span className="text-xs text-slate-400">
                            {batch.product?.unit || 'Nos'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                          {batch.expiryDate
                            ? new Date(batch.expiryDate).toLocaleDateString('en-GB')
                            : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={expiry.variant}>{expiry.label}</Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs">
                          {expiry.daysRemaining < 0 ? (
                            <span className="text-rose-400 font-bold">
                              {Math.abs(expiry.daysRemaining)} days ago
                            </span>
                          ) : (
                            <span
                              className={
                                expiry.daysRemaining <= 30
                                  ? 'text-amber-400 font-bold'
                                  : 'text-slate-300'
                              }
                            >
                              {expiry.daysRemaining} days left
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectedProduct(batch.product || null)}
                            className="h-8 px-2 text-cyan-400 hover:text-cyan-300"
                            title="Inspect product batches"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* DRAWER A: STOCK IN / STOCK OUT ADJUSTMENT FORM */}
      <Drawer
        isOpen={isAdjustDrawerOpen}
        onClose={() => setIsAdjustDrawerOpen(false)}
        title={adjustFormData.mode === 'IN' ? 'Stock In (Receive / Restock)' : 'Stock Out (Issue / Consumption)'}
        description={`Record direct stock movement under ${
          activeUnit ? activeUnit.name : 'active unit'
        }. An adjustment movement ledger entry will be logged.`}
        size="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {adjustError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{adjustError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Product <span className="text-rose-400">*</span>
            </label>
            <Select
              value={adjustFormData.productId}
              onChange={(e) =>
                setAdjustFormData((prev) => ({
                  ...prev,
                  productId: e.target.value,
                  batchId: '',
                  batchNumber: '',
                  expiryDate: '',
                }))
              }
              options={[
                { value: '', label: '-- Select Inventory Product --' },
                ...productOptions,
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Movement Mode <span className="text-rose-400">*</span>
              </label>
              <Select
                value={adjustFormData.mode}
                onChange={(e) => {
                  const newMode = e.target.value as 'IN' | 'OUT';
                  setAdjustFormData((prev) => ({
                    ...prev,
                    mode: newMode,
                    usageType: newMode === 'OUT' ? 'Department Use' : 'Stock Receipt',
                  }));
                }}
                options={STOCK_MODE_OPTIONS}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Quantity <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
                value={adjustFormData.quantity}
                onChange={(e) =>
                  setAdjustFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Batch Tracking Fields for Batch-Tracked Products */}
          {isAdjustProductBatchTracked && adjustFormData.productId && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Package className="w-4 h-4 shrink-0" />
                <span>
                  {adjustFormData.mode === 'IN'
                    ? 'Batch & Expiry Specifications (Required for Restock)'
                    : 'Source Batch Selection (Required for Stock Out)'}
                </span>
              </div>

              {adjustFormData.mode === 'IN' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Batch Number <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      placeholder="e.g. BATCH-2026-01"
                      value={adjustFormData.batchNumber}
                      onChange={(e) =>
                        setAdjustFormData((prev) => ({
                          ...prev,
                          batchNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Expiry Date <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      type="date"
                      value={adjustFormData.expiryDate}
                      onChange={(e) =>
                        setAdjustFormData((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Deduct From Batch <span className="text-rose-400">*</span>
                  </label>
                  {availableBatchesForDeduction.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-400 text-xs">
                      No active batches with available stock found for this product in the active unit.
                    </div>
                  ) : (
                    <Select
                      value={adjustFormData.batchId}
                      onChange={(e) =>
                        setAdjustFormData((prev) => ({ ...prev, batchId: e.target.value }))
                      }
                      options={[
                        { value: '', label: '-- Select Batch to Deduct --' },
                        ...availableBatchesForDeduction.map((b) => ({
                          value: b.id,
                          label: `${b.batchNumber} (Available: ${b.quantity} | Expires: ${
                            b.expiryDate
                              ? new Date(b.expiryDate).toLocaleDateString('en-GB')
                              : 'N/A'
                          })`,
                        })),
                      ]}
                      required
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Reference / Bill No.
              </label>
              <Input
                placeholder="Bill no, invoice, gate pass..."
                value={adjustFormData.referenceNo}
                onChange={(e) =>
                  setAdjustFormData((prev) => ({ ...prev, referenceNo: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Storage / Location
              </label>
              <Input
                placeholder="Shelf, room, nursing station..."
                value={adjustFormData.storageLocation}
                onChange={(e) =>
                  setAdjustFormData((prev) => ({
                    ...prev,
                    storageLocation: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {adjustFormData.mode === 'OUT' ? 'Issued To' : 'Received From'}
              </label>
              <Input
                placeholder={
                  adjustFormData.mode === 'OUT'
                    ? 'Kitchen, nursing, patient, staff...'
                    : 'Vendor, family, donor...'
                }
                value={adjustFormData.issuedTo}
                onChange={(e) =>
                  setAdjustFormData((prev) => ({ ...prev, issuedTo: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Purpose / Usage Type
              </label>
              <Select
                value={adjustFormData.usageType}
                onChange={(e) =>
                  setAdjustFormData((prev) => ({ ...prev, usageType: e.target.value }))
                }
                options={
                  adjustFormData.mode === 'OUT' ? PURPOSE_OPTIONS_OUT : PURPOSE_OPTIONS_IN
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Notes & Handover Remarks
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Verification notes, condition, handover, warranty or packaging details..."
              value={adjustFormData.notes}
              onChange={(e) =>
                setAdjustFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                updateStockMutation.isPending ||
                (isAdjustProductBatchTracked &&
                  adjustFormData.mode === 'OUT' &&
                  availableBatchesForDeduction.length === 0)
              }
              className={
                adjustFormData.mode === 'OUT'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }
            >
              {updateStockMutation.isPending
                ? 'Processing...'
                : adjustFormData.mode === 'OUT'
                ? 'Confirm Stock Out'
                : 'Confirm Stock In'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* DRAWER B: PRODUCT BATCHES INSPECTOR DRAWER */}
      <Drawer
        isOpen={Boolean(inspectedProduct)}
        onClose={() => setInspectedProduct(null)}
        title={inspectedProduct ? `FEFO Batches: ${inspectedProduct.name}` : 'Product Batches'}
        description="Inspect batch numbers, remaining quantities, and expiry status under authoritative FEFO ordering."
        size="lg"
      >
        {inspectedProduct && (
          <div className="space-y-5">
            {/* Header Product Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-100">{inspectedProduct.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>SKU: {inspectedProduct.code || 'None'}</span>
                  <span>•</span>
                  <span>Category: {formatCategoryLabel(inspectedProduct.category)}</span>
                  <span>•</span>
                  <span>UoM: {inspectedProduct.unit || 'Nos'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block uppercase">
                  Batch Count
                </span>
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {(batchesByProductId.get(inspectedProduct.id) || []).length}
                </span>
              </div>
            </div>

            {/* Batches Table */}
            {(() => {
              const productBatches = batchesByProductId.get(inspectedProduct.id) || [];
              if (productBatches.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold">No active batches with quantity &gt; 0</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Batches are created automatically upon receiving purchases with batch/expiry data.
                    </p>
                  </div>
                );
              }

              return (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3">Batch No</th>
                        <th className="py-3 px-3 text-right">Remaining</th>
                        <th className="py-3 px-3">Expiry Date</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {productBatches.map((b, idx) => {
                        const expiry = getBatchExpiryInfo(b.expiryDate);
                        return (
                          <tr key={b.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3 text-center text-xs font-mono text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                              {b.batchNumber}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                              {b.quantity} {inspectedProduct.unit || 'Nos'}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-300">
                              {b.expiryDate
                                ? new Date(b.expiryDate).toLocaleDateString('en-GB')
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge variant={expiry.variant}>{expiry.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectedProduct(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
