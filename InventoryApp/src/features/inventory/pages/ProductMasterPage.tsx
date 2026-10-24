import React, { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  RotateCcw,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Power,
  PowerOff,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
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
  useCreateInventoryProduct,
  useUpdateInventoryProduct,
  useUpdateInventoryProductStatus,
  useUpdateInventoryStock,
} from '../hooks/useInventory';
import type { InventoryProduct } from '../types';
import { useInventoryDomainStore, DOMAIN_CONFIG } from '../../../store/useInventoryDomainStore';

const VERIFIED_MEDICAL_CATEGORIES = [
  { value: 'medical', label: 'Medical & Clinical' },
  { value: 'medicine', label: 'Medicines' },
  { value: 'clinical-consumables', label: 'Clinical Consumables' },
];

const VERIFIED_FOOD_CATEGORIES = [
  { value: 'ration', label: 'Ration' },
  { value: 'fresh food', label: 'Fresh Food' },
  { value: 'food', label: 'Food & Groceries' },
  { value: 'food & ration', label: 'Food & Ration' },
  { value: 'ration & kitchen', label: 'Ration & Kitchen' },
];

const STANDARD_UNITS = ['Nos', 'Kg', 'Litre', 'Box', 'Strip', 'Tablet', 'Bottle', 'Pack', 'Roll', 'Set'];

const DEFAULT_MIN_STOCK_FALLBACK = 10;

export default function ProductMasterPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);
  const { activeDomain } = useInventoryDomainStore();
  const domainConfig = DOMAIN_CONFIG[activeDomain];
  const activeDomainCategories = activeDomain === 'medical' ? VERIFIED_MEDICAL_CATEGORIES : VERIFIED_FOOD_CATEGORIES;

  // Permission checks
  const canView = hasPermission(user, [
    INVENTORY_PERMISSIONS.PRODUCTS_VIEW,
    'Products',
    'Inventory Products',
  ]);
  const canCreate = hasPermission(user, [
    INVENTORY_PERMISSIONS.PRODUCTS_MANAGE,
    'Create Products',
    'Products',
    'Inventory Products',
  ]);

  // Query hooks
  const {
    data: products = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useInventoryProducts();

  const {
    data: stock = [],
    isLoading: isStockLoading,
    refetch: refetchStock,
  } = useInventoryStock();

  const createProduct = useCreateInventoryProduct();
  const updateProduct = useUpdateInventoryProduct();
  const updateProductStatus = useUpdateInventoryProductStatus();
  const updateStock = useUpdateInventoryStock();

  // Stock lookup map
  const stockByProductId = useMemo(
    () => new Map(stock.map((item) => [item.productId, item])),
    [stock]
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'code' | 'category' | 'stock' | 'price'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<InventoryProduct | null>(null);

  // Edit Drawer state
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('medical');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editUnit, setEditUnit] = useState('Nos');
  const [editMinStock, setEditMinStock] = useState('10');
  const [editRevenuePrice, setEditRevenuePrice] = useState('0');
  const [editChargeable, setEditChargeable] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Status confirmation modal state
  const [statusConfirmProduct, setStatusConfirmProduct] = useState<InventoryProduct | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  // Create Product Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState(activeDomain === 'medical' ? 'medical' : 'ration');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formUnit, setFormUnit] = useState('Nos');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formRevenuePrice, setFormRevenuePrice] = useState('0');
  const [formChargeable, setFormChargeable] = useState(false);
  const [formStatus, setFormStatus] = useState(true);
  const [formOpeningStock, setFormOpeningStock] = useState('');
  const [formOpeningBatchNumber, setFormOpeningBatchNumber] = useState('');
  const [formOpeningExpiryDate, setFormOpeningExpiryDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Helper functions
  const getProductStockQuantity = (productId: string) =>
    Number(stockByProductId.get(productId)?.quantity ?? 0);

  const getStockStatus = (product: InventoryProduct) => {
    const qty = getProductStockQuantity(product.id);
    const minThreshold = Number(product.minStockLevel || 0) > 0 ? Number(product.minStockLevel) : DEFAULT_MIN_STOCK_FALLBACK;
    if (qty <= 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (qty <= minThreshold) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'Available', variant: 'success' as const };
  };

  const formatCategoryLabel = (category?: string) => {
    if (!category) return '-';
    const allKnown = [...VERIFIED_MEDICAL_CATEGORIES, ...VERIFIED_FOOD_CATEGORIES];
    const found = allKnown.find((c) => c.value === category.toLowerCase());
    if (found) return found.label;
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  };

  // Dynamic available categories for the active domain
  const categoryOptions = useMemo(() => {
    const categoriesFromProducts = Array.from(
      new Set(products.map((p) => p.category.toLowerCase()).filter(Boolean))
    );
    const domainVals = activeDomainCategories.map((c) => c.value);
    const combined = Array.from(new Set([...domainVals, ...categoriesFromProducts]));

    return [
      { value: 'all', label: `All ${domainConfig.shortLabel} Categories` },
      ...combined.map((cat) => ({
        value: cat,
        label: formatCategoryLabel(cat),
      })),
    ];
  }, [products, activeDomainCategories, domainConfig]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category.toLowerCase() !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'active' && product.status === false) return false;
      if (selectedStatus === 'inactive' && product.status !== false) return false;

      // Text search (name, code, category)
      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCode = Boolean(product.code && product.code.toLowerCase().includes(query));
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesCategory) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'code':
          valA = (a.code || '').toLowerCase();
          valB = (b.code || '').toLowerCase();
          break;
        case 'category':
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
          break;
        case 'stock':
          valA = getProductStockQuantity(a.id);
          valB = getProductStockQuantity(b.id);
          break;
        case 'price':
          valA = Number(a.defaultRevenuePrice || 0);
          valB = Number(b.defaultRevenuePrice || 0);
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortField, sortAsc, stockByProductId]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleRefresh = () => {
    refetchProducts();
    refetchStock();
  };

  const resetCreateForm = () => {
    setFormName('');
    setFormCode('');
    setFormCategory(activeDomain === 'medical' ? 'medical' : 'ration');
    setFormCustomCategory('');
    setFormUnit('Nos');
    setFormMinStock('10');
    setFormRevenuePrice('0');
    setFormChargeable(false);
    setFormStatus(true);
    setFormOpeningStock('');
    setFormOpeningBatchNumber('');
    setFormOpeningExpiryDate('');
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Product name is required.');
      return;
    }

    const resolvedCategory =
      formCategory === '__custom__' ? formCustomCategory.trim() : formCategory;
    if (!resolvedCategory) {
      setFormError('Please select or specify a valid category.');
      return;
    }

    const trimmedCode = formCode.trim() ? formCode.trim().toUpperCase() : undefined;
    const minLevel = formMinStock ? Math.max(0, Math.trunc(Number(formMinStock))) : 0;
    const revPrice = formRevenuePrice ? Math.max(0, Number(formRevenuePrice)) : 0;

    try {
      const created = await createProduct.mutateAsync({
        name: trimmedName,
        code: trimmedCode,
        category: resolvedCategory,
        unit: formUnit.trim() || 'Nos',
        minStockLevel: minLevel,
        defaultRevenuePrice: revPrice,
        chargeableInCareRevenue: formChargeable,
        status: formStatus,
      });

      // Optional opening stock update
      const openingStockQty = Number(formOpeningStock || 0);
      if (openingStockQty > 0 && created?.id) {
        await updateStock.mutateAsync({
          productId: created.id,
          quantity: Math.trunc(openingStockQty),
          batchNumber: formOpeningBatchNumber.trim() || undefined,
          expiryDate: formOpeningExpiryDate || undefined,
          usageType: 'Initial Opening Stock',
          notes: 'Opening balance created during product registration',
        });
      }

      resetCreateForm();
      setIsCreateOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save product.';
      setFormError(msg);
    }
  };

  const openEditDrawer = (product: InventoryProduct) => {
    setEditingProduct(product);
    setEditName(product.name || '');
    setEditCode(product.code || '');
    const isStandard = activeDomainCategories.some((c) => c.value === (product.category || '').toLowerCase());
    if (isStandard) {
      setEditCategory((product.category || '').toLowerCase());
      setEditCustomCategory('');
    } else {
      setEditCategory(activeDomain === 'medical' ? 'medical' : 'ration');
      setEditCustomCategory('');
    }
    setEditSubCategory((product as any).subCategory || '');
    setEditUnit(product.unit || 'Nos');
    setEditMinStock(String(product.minStockLevel ?? 0));
    setEditRevenuePrice(String(product.defaultRevenuePrice ?? 0));
    setEditChargeable(Boolean(product.chargeableInCareRevenue));
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Product name is required.');
      return;
    }

    const resolvedCategory =
      editCategory === '__custom__' ? editCustomCategory.trim() : editCategory;
    if (!resolvedCategory) {
      setEditError('Please select or specify a valid category.');
      return;
    }

    const trimmedCode = editCode.trim() ? editCode.trim().toUpperCase() : null;
    const minLevel = editMinStock ? Math.max(0, Math.trunc(Number(editMinStock))) : 0;
    const revPrice = editRevenuePrice ? Math.max(0, Number(editRevenuePrice)) : 0;

    try {
      const updated = await updateProduct.mutateAsync({
        id: editingProduct.id,
        payload: {
          name: trimmedName,
          code: trimmedCode,
          category: resolvedCategory,
          subCategory: editSubCategory.trim() || null,
          unit: editUnit.trim() || 'Nos',
          minStockLevel: minLevel,
          defaultRevenuePrice: revPrice,
          chargeableInCareRevenue: editChargeable,
        },
      });

      if (selectedProductDetails?.id === editingProduct.id) {
        setSelectedProductDetails(updated);
      }
      setEditingProduct(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update product.';
      setEditError(msg);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmProduct) return;
    setStatusActionError(null);
    const targetStatus = statusConfirmProduct.status === false ? true : false;
    try {
      const updated = await updateProductStatus.mutateAsync({
        id: statusConfirmProduct.id,
        status: targetStatus,
      });

      if (selectedProductDetails?.id === statusConfirmProduct.id) {
        setSelectedProductDetails(updated);
      }
      setStatusConfirmProduct(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update status.';
      setStatusActionError(msg);
    }
  };

  // Summary counts
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status !== false).length;
  const inStockCount = products.filter((p) => getProductStockQuantity(p.id) > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title={`${domainConfig.label}`}
        description={
          activeDomain === 'medical'
            ? 'Verified clinical consumables, pharmaceuticals, and medical supplies master catalog.'
            : 'Verified food provisions, rations, and dietary supplies master catalog.'
        }
        badge={
          <Badge variant="success">
            {activeUnit ? `${activeUnit.name} Catalog` : 'Facility-Wide Master'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleRefresh}
              disabled={isProductsLoading}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetCreateForm();
                  setIsCreateOpen(true);
                }}
              >
                Add Product
              </Button>
            )}
          </div>
        }
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 flex items-center justify-between border-slate-800/80 bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center justify-between border-slate-800/80 bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Catalog</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center justify-between border-slate-800/80 bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Tracked</p>
            <p className="text-2xl font-black text-teal-300 mt-1">{inStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Package className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filters and Search Toolbar */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Input
              placeholder="Search product name, code/SKU, category..."
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
            <div className="w-44">
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
              />
            </div>

            <div className="w-36">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>

            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Product Catalog Data Table */}
      <Card className="border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        {isProductsLoading ? (
          <div className="py-20">
            <LoadingState message="Fetching unit product master..." />
          </div>
        ) : isProductsError ? (
          <div className="py-12 px-6">
            <ErrorState
              title="Unable to load Product Master"
              message={
                (productsError as any)?.response?.data?.message ||
                (productsError as any)?.message ||
                'An error occurred while connecting to the Inventory service.'
              }
              onRetry={handleRefresh}
            />
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-16 px-6">
            <EmptyState
              title="No products found"
              description={
                searchQuery || selectedCategory !== 'all'
                  ? 'No products matched your active filters. Try adjusting your search query or category filter.'
                  : 'No inventory products registered for this operating unit.'
              }
              action={
                canCreate ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      resetCreateForm();
                      setIsCreateOpen(true);
                    }}
                  >
                    Add First Product
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">S.No</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product / SKU</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">UoM</th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Current Stock</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 select-none transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Revenue Price</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Care Revenue</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedProducts.map((product, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const qty = getProductStockQuantity(product.id);
                  const statusInfo = getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
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
                                {product.name}
                              </span>
                              {product.code ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold tracking-tight">
                                  {product.code}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono italic">
                                  No SKU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Min Alert: {product.minStockLevel ?? 0} {product.unit || 'Nos'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
                          {formatCategoryLabel(product.category)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                        {product.unit || 'Nos'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {qty}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        ₹{Number(product.defaultRevenuePrice || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            product.chargeableInCareRevenue
                              ? 'text-cyan-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {product.chargeableInCareRevenue ? 'Chargeable' : 'Internal'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={product.status !== false ? 'success' : 'default'}>
                          {product.status !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-300 hover:text-emerald-400"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedProductDetails(product)}
                            title="View product details"
                          >
                            Details
                          </Button>
                          {canCreate && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-slate-300 hover:text-sky-400"
                                leftIcon={<Edit className="w-3.5 h-3.5" />}
                                onClick={() => openEditDrawer(product)}
                                title="Edit product"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 text-xs ${
                                  product.status !== false
                                    ? 'text-slate-400 hover:text-rose-400'
                                    : 'text-emerald-400 hover:text-emerald-300'
                                }`}
                                leftIcon={
                                  product.status !== false ? (
                                    <PowerOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Power className="w-3.5 h-3.5" />
                                  )
                                }
                                onClick={() => {
                                  setStatusActionError(null);
                                  setStatusConfirmProduct(product);
                                }}
                                title={product.status !== false ? 'Deactivate product' : 'Reactivate product'}
                              >
                                {product.status !== false ? 'Deactivate' : 'Activate'}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {sortedProducts.length > 0 && !isProductsLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
              <span className="text-slate-500 ml-2">
                (Showing {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length}{' '}
                products)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 font-semibold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Product Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        title="Add New Inventory Product"
        description="Register an authorized item into the unit catalog and setup dynamic thresholds."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="e.g. Paracetamol 500mg, Basmati Rice, Cat-6 Cable"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Product Code / SKU (Optional)
              </label>
              <Input
                placeholder="e.g. MED-001, ELEC-101"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                helperText="Tenant-unique SKU. Uppercase automatically applied."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Category <span className="text-rose-400">*</span>
              </label>
              <Select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                options={activeDomainCategories}
              />
            </div>

            {formCategory === '__custom__' ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Custom Category Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="Enter category name"
                  value={formCustomCategory}
                  onChange={(e) => setFormCustomCategory(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Unit of Measure (UoM)
                </label>
                <Select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  options={STANDARD_UNITS.map((u) => ({ value: u, label: u }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Min Stock Level
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="10"
                value={formMinStock}
                onChange={(e) => setFormMinStock(e.target.value)}
                helperText="Low stock alert trigger."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Revenue Price (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formRevenuePrice}
                onChange={(e) => setFormRevenuePrice(e.target.value)}
                helperText="Patient billing default."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Initial Opening Stock (Qty)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formOpeningStock}
                onChange={(e) => setFormOpeningStock(e.target.value)}
                helperText="Optional initial balance."
              />
            </div>
          </div>

          {/* Optional batch details for medical / batch-tracked initial opening stock */}
          {Number(formOpeningStock || 0) > 0 &&
            (formCategory === 'medical' || formCustomCategory.toLowerCase() === 'medical') && (
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  Initial Batch Details (Optional — auto-assigned if omitted)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Batch Number
                    </label>
                    <Input
                      placeholder="e.g. BATCH-INIT-01"
                      value={formOpeningBatchNumber}
                      onChange={(e) => setFormOpeningBatchNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Expiry Date
                    </label>
                    <Input
                      type="date"
                      value={formOpeningExpiryDate}
                      onChange={(e) => setFormOpeningExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formChargeable}
                onChange={(e) => setFormChargeable(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-200">
                Chargeable in Care Revenue Sheet
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Catalog Status:</span>
              <button
                type="button"
                onClick={() => setFormStatus(!formStatus)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                  formStatus
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {formStatus ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
              disabled={createProduct.isPending || updateStock.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createProduct.isPending || updateStock.isPending}
            >
              Save Product
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Product Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedProductDetails)}
        onClose={() => setSelectedProductDetails(null)}
        title="Product Master Record"
        description="Detailed inventory configuration, unit tracking, and pricing parameters."
        size="md"
      >
        {selectedProductDetails && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-slate-100 truncate">
                  {selectedProductDetails.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedProductDetails.code ? (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
                      {selectedProductDetails.code}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No SKU Assigned</span>
                  )}
                  <Badge variant={selectedProductDetails.status !== false ? 'success' : 'default'}>
                    {selectedProductDetails.status !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </p>
                <p className="font-bold text-slate-200 mt-1">
                  {formatCategoryLabel(selectedProductDetails.category)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Unit of Measure
                </p>
                <p className="font-bold text-slate-200 mt-1">
                  {selectedProductDetails.unit || 'Nos'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Current Stock
                </p>
                <p className="font-bold text-emerald-400 text-lg mt-0.5 font-mono">
                  {getProductStockQuantity(selectedProductDetails.id)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Min Stock Threshold
                </p>
                <p className="font-bold text-slate-200 mt-1">
                  {selectedProductDetails.minStockLevel ?? 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Revenue Price
                </p>
                <p className="font-bold text-slate-200 mt-1 font-mono">
                  ₹{Number(selectedProductDetails.defaultRevenuePrice || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Care Revenue
                </p>
                <p className="font-bold text-slate-200 mt-1">
                  {selectedProductDetails.chargeableInCareRevenue ? 'Chargeable' : 'Internal'}
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/30 border border-slate-800/60 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="font-mono text-slate-300">
                  {selectedProductDetails.createdAt
                    ? new Date(selectedProductDetails.createdAt).toLocaleString('en-GB')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-slate-300">
                  {selectedProductDetails.updatedAt
                    ? new Date(selectedProductDetails.updatedAt).toLocaleString('en-GB')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unit ID Scope:</span>
                <span className="font-mono text-slate-400 truncate max-w-[200px]">
                  {selectedProductDetails.unitId || activeUnitId || 'Facility-wide'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              {canCreate && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const p = selectedProductDetails;
                      setSelectedProductDetails(null);
                      openEditDrawer(p);
                    }}
                  >
                    Edit Product
                  </Button>
                  <Button
                    variant={selectedProductDetails.status !== false ? 'danger' : 'outline'}
                    size="sm"
                    className="text-xs"
                    leftIcon={
                      selectedProductDetails.status !== false ? (
                        <PowerOff className="w-3.5 h-3.5" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => {
                      setStatusActionError(null);
                      setStatusConfirmProduct(selectedProductDetails);
                    }}
                  >
                    {selectedProductDetails.status !== false ? 'Deactivate' : 'Reactivate'}
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedProductDetails(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Product Drawer */}
      <Drawer
        isOpen={Boolean(editingProduct)}
        onClose={() => {
          setEditingProduct(null);
          setEditError(null);
        }}
        title="Edit Inventory Product"
        description="Update catalog specifications, category, thresholds, or default pricing."
        size="lg"
      >
        {editingProduct && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Immutable Attributes Notice */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Immutable System Invariants
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500">Operating Unit: </span>
                  <span className="font-mono font-medium">{editingProduct.unitId || activeUnitId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tracking Strategy: </span>
                  <span className="font-semibold text-emerald-400">
                    {editingProduct.isBatchTracked ? 'Batch-Tracked (FEFO)' : 'Standard (Non-Batch)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Paracetamol 500mg, Basmati Rice"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Product Code / SKU
                </label>
                <Input
                  placeholder="e.g. MED-001, ELEC-101"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  helperText="Tenant-unique SKU. Uppercase automatically applied."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Category <span className="text-rose-400">*</span>
                </label>
                <Select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  options={activeDomainCategories}
                />
              </div>

              {editCategory === '__custom__' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Custom Category Name <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    placeholder="Enter category name"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Unit of Measure (UoM)
                  </label>
                  <Select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    options={STANDARD_UNITS.map((u) => ({ value: u, label: u }))}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Sub-Category (Optional)
                </label>
                <Input
                  placeholder="e.g. Antibiotics, Consumables"
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                />
              </div>

              {editCategory === '__custom__' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Unit of Measure (UoM)
                  </label>
                  <Select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    options={STANDARD_UNITS.map((u) => ({ value: u, label: u }))}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Min Stock Level
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value)}
                  helperText="Threshold for low-stock warnings."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Default Revenue Price (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editRevenuePrice}
                  onChange={(e) => setEditRevenuePrice(e.target.value)}
                  helperText="Default price in care revenue sheet."
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editChargeable}
                  onChange={(e) => setEditChargeable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  Chargeable in Care Revenue Sheet
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Current Status:</span>
                <Badge variant={editingProduct.status !== false ? 'success' : 'default'}>
                  {editingProduct.status !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProduct(null);
                  setEditError(null);
                }}
                disabled={updateProduct.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateProduct.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Product Status Confirmation Modal */}
      {statusConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusConfirmProduct.status !== false
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {statusConfirmProduct.status !== false ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {statusConfirmProduct.status !== false
                    ? 'Deactivate Product?'
                    : 'Reactivate Product?'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {statusConfirmProduct.name} ({statusConfirmProduct.code || 'No SKU'})
                </p>
              </div>
            </div>

            {statusActionError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{statusActionError}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              {statusConfirmProduct.status !== false ? (
                <>
                  Deactivating this product will remove it from new purchase receipts, medicine
                  prescriptions, and stock issue requisitions. Existing stock balances and historical
                  audit records will remain fully preserved.
                </>
              ) : (
                <>
                  Reactivating this product will immediately restore it for new purchase
                  receipts and stock issue requests across the operating unit.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusConfirmProduct(null);
                  setStatusActionError(null);
                }}
                disabled={updateProductStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={statusConfirmProduct.status !== false ? 'danger' : 'primary'}
                size="sm"
                onClick={handleConfirmStatusToggle}
                isLoading={updateProductStatus.isPending}
              >
                {statusConfirmProduct.status !== false ? 'Confirm Deactivation' : 'Confirm Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
