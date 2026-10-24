import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  RotateCcw,
  Package,
  Boxes,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Send,
  Ban,
  AlertCircle,
  FileText,
  ClipboardList,
  Check,
  X,
  AlertTriangle,
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
  useCreateInventoryPurchase,
  useInventoryProducts,
  useInventoryPurchases,
  useVendors,
  usePurchaseOrders,
  usePurchaseOrderDetails,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useOrderPurchaseOrder,
  useCancelPurchaseOrder,
  useGoodsReceipts,
  useGoodsReceiptDetails,
  useCreateGoodsReceipt,
  useSupplierReturns,
  useSupplierReturnDetails,
  useCreateSupplierReturn,
} from '../hooks/useInventory';
import { inventoryService } from '../services/inventory';
import type {
  InventoryPurchase,
  InventoryProduct,
  PurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderItemInput,
  GoodsReceiptNote,
  GoodsReceiptItem,
  CreateGoodsReceiptPayload,
  CreateGoodsReceiptItemInput,
  SupplierReturn,
  SupplierReturnItem,
  CreateSupplierReturnPayload,
} from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  productInScope,
  purchaseInScope,
  purchaseOrderInScope,
  goodsReceiptInScope,
  supplierReturnInScope,
  type InventoryScope,
} from '../utils/inventoryScope';
import { useInventoryDomainStore } from '../../../store/useInventoryDomainStore';

export default function PurchaseOrdersPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewPurchases = hasPermission(user, [
    INVENTORY_PERMISSIONS.PURCHASES_VIEW,
    'Purchase Orders',
    'Purchases',
    'Stock',
  ]);
  const canManagePurchases = hasPermission(user, [
    INVENTORY_PERMISSIONS.PURCHASES_MANAGE,
    'Purchase Orders',
    'Create Purchases',
    'inventory.purchases.manage',
  ]);

  // Main active tab: 'orders' (Multi-item PO lifecycle) | 'receipts' (Goods receipts / GRN history) | 'returns' (Supplier returns) | 'direct' (Legacy direct purchase)
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts' | 'returns' | 'direct'>('orders');

  // Scope filter from domain store
  const { activeDomain, setActiveDomain } = useInventoryDomainStore();
  const inventoryScope = activeDomain;
  const setInventoryScope = (s: any) => setActiveDomain(s === 'all' ? 'medical' : s);

  // =========================================================================
  // SECTION A: MULTI-ITEM PURCHASE ORDERS STATE & HOOKS
  // =========================================================================
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');
  const [poVendorFilter, setPoVendorFilter] = useState<string>('ALL');
  const [poPage, setPoPage] = useState(1);
  const [poPageSize, setPoPageSize] = useState(10);

  // Modals / Drawers state
  const [isPoFormDrawerOpen, setIsPoFormDrawerOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [viewingPoId, setViewingPoId] = useState<string | null>(null);
  const [orderConfirmPo, setOrderConfirmPo] = useState<PurchaseOrder | null>(null);
  const [cancelConfirmPo, setCancelConfirmPo] = useState<PurchaseOrder | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  // PO Form state
  interface PoFormLine {
    tempId: string;
    productId: string;
    orderedQuantity: string;
    notes: string;
  }
  const [poFormData, setPoFormData] = useState<{
    vendorId: string;
    expectedDeliveryDate: string;
    notes: string;
    items: PoFormLine[];
  }>({
    vendorId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ tempId: 'line-1', productId: '', orderedQuantity: '1', notes: '' }],
  });
  const [poFormError, setPoFormError] = useState<string | null>(null);

  // Queries for PO Lifecycle
  const {
    data: poListData,
    isLoading: isPoListLoading,
    isError: isPoListError,
    error: poListError,
    refetch: refetchPoList,
  } = usePurchaseOrders({
    status: poStatusFilter !== 'ALL' ? poStatusFilter : undefined,
    vendorId: poVendorFilter !== 'ALL' ? poVendorFilter : undefined,
    search: poSearch.trim() || undefined,
    page: poPage,
    limit: poPageSize,
  });

  const {
    data: viewingPoDetails,
    isLoading: isViewingPoLoading,
    refetch: refetchViewingPo,
  } = usePurchaseOrderDetails(viewingPoId);

  // Mutations for PO Lifecycle
  const createPoMutation = useCreatePurchaseOrder();
  const updatePoMutation = useUpdatePurchaseOrder();
  const orderPoMutation = useOrderPurchaseOrder();
  const cancelPoMutation = useCancelPurchaseOrder();

  // =========================================================================
  // SECTION C: GOODS RECEIPT NOTES (GRN) STATE & HOOKS
  // =========================================================================
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [isReceivingDrawerOpen, setIsReceivingDrawerOpen] = useState(false);
  const [grnFormError, setGrnFormError] = useState<string | null>(null);

  interface GrnFormLine {
    purchaseOrderItemId: string;
    productId: string;
    productName: string;
    productCode?: string | null;
    productCategory?: string | null;
    productUnit?: string | null;
    isBatchTracked: boolean;
    orderedQuantity: number;
    previouslyReceivedQuantity: number;
    remainingQuantity: number;
    receivedQuantity: string;
    acceptedQuantity: string;
    rejectedQuantity: string;
    batchNumber: string;
    expiryDate: string;
    notes: string;
  }

  const [grnFormData, setGrnFormData] = useState<{
    receivedDate: string;
    deliveryChallanNo: string;
    supplierInvoiceNo: string;
    notes: string;
    idempotencyKey: string;
    items: GrnFormLine[];
  }>({
    receivedDate: new Date().toISOString().split('T')[0],
    deliveryChallanNo: '',
    supplierInvoiceNo: '',
    notes: '',
    idempotencyKey: '',
    items: [],
  });

  // GRN History List state
  const [grnSearch, setGrnSearch] = useState('');
  const [grnVendorFilter, setGrnVendorFilter] = useState<string>('ALL');
  const [grnPage, setGrnPage] = useState(1);
  const [grnPageSize, setGrnPageSize] = useState(10);
  const [viewingGrnId, setViewingGrnId] = useState<string | null>(null);

  // Queries & Mutation for GRN
  const {
    data: grnListData,
    isLoading: isGrnListLoading,
    isError: isGrnListError,
    error: grnListError,
    refetch: refetchGrnList,
  } = useGoodsReceipts({
    vendorId: grnVendorFilter !== 'ALL' ? grnVendorFilter : undefined,
    search: grnSearch.trim() || undefined,
    page: grnPage,
    limit: grnPageSize,
  });

  const {
    data: viewingGrnDetails,
    isLoading: isViewingGrnLoading,
    refetch: refetchViewingGrn,
  } = useGoodsReceiptDetails(viewingGrnId);

  const createGrnMutation = useCreateGoodsReceipt();

  // =========================================================================
  // SECTION C: SUPPLIER RETURNS STATE & HOOKS (D9.1)
  // =========================================================================
  const [returnSearch, setReturnSearch] = useState('');
  const [returnVendorFilter, setReturnVendorFilter] = useState<string>('ALL');
  const [returnPage, setReturnPage] = useState(1);
  const [returnPageSize, setReturnPageSize] = useState(10);
  const [viewingReturnId, setViewingReturnId] = useState<string | null>(null);

  // Form Drawer state
  const [isReturnDrawerOpen, setIsReturnDrawerOpen] = useState(false);
  const [returnFormError, setReturnFormError] = useState<string | null>(null);
  const [returnFormData, setReturnFormData] = useState<{
    vendorId: string;
    sourceType: 'GRN' | 'PURCHASE' | 'DIRECT';
    sourceReferenceId: string;
    returnDate: string;
    reason: string;
    notes: string;
    idempotencyKey: string;
    items: Array<{
      productId: string;
      productName: string;
      productCode?: string | null;
      productCategory?: string | null;
      productUnit: string;
      isBatchTracked: boolean;
      batchId?: string | null;
      batchNumber?: string | null;
      expiryDate?: string | null;
      availableStock: number;
      eligibleQuantity: number;
      returnQuantity: string;
      reason: string;
      goodsReceiptItemId?: string;
    }>;
  }>({
    vendorId: '',
    sourceType: 'GRN',
    sourceReferenceId: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    idempotencyKey: '',
    items: [],
  });

  const {
    data: returnListData,
    isLoading: isReturnListLoading,
    isError: isReturnListError,
    error: returnListError,
    refetch: refetchReturnList,
  } = useSupplierReturns({
    vendorId: returnVendorFilter !== 'ALL' ? returnVendorFilter : undefined,
    search: returnSearch.trim() || undefined,
    page: returnPage,
    limit: returnPageSize,
  });

  const {
    data: viewingReturnDetails,
    isLoading: isViewingReturnLoading,
    refetch: refetchViewingReturn,
  } = useSupplierReturnDetails(viewingReturnId);

  const createReturnMutation = useCreateSupplierReturn();

  // Master Data Queries
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

  // Active master data filters
  const scopedProducts = useMemo(
    () => products.filter((p) => productInScope(p, inventoryScope)),
    [products, inventoryScope]
  );
  const activeProducts = useMemo(
    () => scopedProducts.filter((p) => p.status !== false),
    [scopedProducts]
  );
  const activeVendors = useMemo(
    () => vendors.filter((v) => v.status !== false),
    [vendors]
  );

  // =========================================================================
  // SECTION B: LEGACY DIRECT PURCHASE STATE & HOOKS
  // =========================================================================
  const [directSearch, setDirectSearch] = useState('');
  const [directSortField, setDirectSortField] = useState<'product' | 'vendor' | 'quantity' | 'date'>('date');
  const [directSortAsc, setDirectSortAsc] = useState(false);
  const [directPage, setDirectPage] = useState(1);
  const [directPageSize, setDirectPageSize] = useState(10);

  const [isDirectDrawerOpen, setIsDirectDrawerOpen] = useState(false);
  const [directFormError, setDirectFormError] = useState<string | null>(null);
  const [directFormData, setDirectFormData] = useState({
    productId: '',
    vendorId: '',
    vendorName: '',
    isCustomVendor: false,
    quantity: '',
    batchNumber: '',
    expiryDate: '',
  });

  const {
    data: directPurchases = [],
    isLoading: isDirectLoading,
    isError: isDirectError,
    error: directError,
    refetch: refetchDirectPurchases,
  } = useInventoryPurchases();

  const createDirectPurchaseMutation = useCreateInventoryPurchase();

  const scopedDirectPurchases = useMemo(
    () => directPurchases.filter((p) => purchaseInScope(p, inventoryScope)),
    [directPurchases, inventoryScope]
  );

  // =========================================================================
  // PO METRICS
  // =========================================================================
  const poOrdersList = poListData?.purchaseOrders || [];
  const poTotalCount = poListData?.total || 0;

  const poMetrics = useMemo(() => {
    let drafts = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;

    for (const po of poOrdersList) {
      if (po.status === 'DRAFT') drafts++;
      else if (po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') active++;
      else if (po.status === 'COMPLETED') completed++;
      else if (po.status === 'CANCELLED') cancelled++;
    }

    return {
      total: poTotalCount,
      drafts,
      active,
      completed,
      cancelled,
    };
  }, [poOrdersList, poTotalCount]);

  // Direct Purchase Metrics
  const directMetrics = useMemo(() => {
    const totalTransactions = scopedDirectPurchases.length;
    let totalItemsPurchased = 0;
    const vendorSet = new Set<string>();

    for (const p of scopedDirectPurchases) {
      totalItemsPurchased += Number(p.quantity || 0);
      if (p.vendorId) vendorSet.add(p.vendorId);
      else if (p.vendor) vendorSet.add(p.vendor.toLowerCase());
    }

    return {
      totalTransactions,
      totalItemsPurchased,
      activeSuppliersCount: vendorSet.size,
    };
  }, [scopedDirectPurchases]);

  // GRN Metrics
  const grnReceiptsList = useMemo(() => {
    const list = grnListData?.goodsReceipts || [];
    return list.filter((g) => goodsReceiptInScope(g, inventoryScope));
  }, [grnListData, inventoryScope]);

  const grnMetrics = useMemo(() => {
    const list = grnListData?.goodsReceipts || [];
    let totalAccepted = 0;
    let totalRejected = 0;
    for (const g of list) {
      totalAccepted += Number(g.totalAcceptedQuantity || 0);
      totalRejected += Number(g.totalRejectedQuantity || 0);
    }
    return {
      totalReceipts: grnListData?.total || 0,
      totalAccepted,
      totalRejected,
    };
  }, [grnListData]);

  // Supplier Return Metrics
  const supplierReturnsList = useMemo(() => {
    const list = returnListData?.supplierReturns || [];
    return list.filter((r) => supplierReturnInScope(r, inventoryScope));
  }, [returnListData, inventoryScope]);

  const returnMetrics = useMemo(() => {
    const list = returnListData?.supplierReturns || [];
    let totalUnits = 0;
    const vendorSet = new Set<string>();
    for (const r of list) {
      totalUnits += Number(r.totalQuantity || 0);
      if (r.vendorId) vendorSet.add(r.vendorId);
    }
    return {
      totalReturns: returnListData?.total || 0,
      totalUnits,
      affectedVendors: vendorSet.size,
    };
  }, [returnListData]);


  // =========================================================================
  // PO FORM ACTIONS (Create / Edit Draft)
  // =========================================================================
  const openCreatePoDrawer = () => {
    setEditingPoId(null);
    setPoFormData({
      vendorId: activeVendors[0]?.id || '',
      expectedDeliveryDate: '',
      notes: '',
      items: [{ tempId: `line-${Date.now()}-1`, productId: activeProducts[0]?.id || '', orderedQuantity: '1', notes: '' }],
    });
    setPoFormError(null);
    setIsPoFormDrawerOpen(true);
  };

  const openEditDraftPoDrawer = (po: PurchaseOrder) => {
    if (po.status !== 'DRAFT') return;
    setEditingPoId(po.id);
    setPoFormData({
      vendorId: po.vendorId,
      expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split('T')[0] : '',
      notes: po.notes || '',
      items: (po.items || []).map((it, idx) => ({
        tempId: `line-${it.id || idx}`,
        productId: it.productId,
        orderedQuantity: String(it.orderedQuantity),
        notes: it.notes || '',
      })),
    });
    setPoFormError(null);
    setIsPoFormDrawerOpen(true);
  };

  const addPoLine = () => {
    // Pick the first active product not yet added, if available
    const existingProductIds = new Set(poFormData.items.map((it) => it.productId));
    const nextProduct = activeProducts.find((p) => !existingProductIds.has(p.id)) || activeProducts[0];

    setPoFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          tempId: `line-${Date.now()}-${prev.items.length + 1}`,
          productId: nextProduct?.id || '',
          orderedQuantity: '1',
          notes: '',
        },
      ],
    }));
  };

  const removePoLine = (tempId: string) => {
    if (poFormData.items.length <= 1) {
      setPoFormError('A purchase order must contain at least one line item.');
      return;
    }
    setPoFormData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.tempId !== tempId),
    }));
    setPoFormError(null);
  };

  const updatePoLine = (tempId: string, field: 'productId' | 'orderedQuantity' | 'notes', value: string) => {
    setPoFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.tempId === tempId ? { ...it, [field]: value } : it)),
    }));
    setPoFormError(null);
  };

  const handleSavePo = async (andOrder: boolean = false) => {
    setPoFormError(null);

    // 1. Validate vendor
    if (!poFormData.vendorId.trim()) {
      setPoFormError('Please select a valid supplier/vendor.');
      return;
    }

    // 2. Validate line items
    if (!poFormData.items || poFormData.items.length === 0) {
      setPoFormError('Purchase order must contain at least one line item.');
      return;
    }

    // 3. Check duplicate products
    const productIds = poFormData.items.map((it) => it.productId.trim());
    const seen = new Set<string>();
    for (const pid of productIds) {
      if (!pid) {
        setPoFormError('All line items must have a product selected.');
        return;
      }
      if (seen.has(pid)) {
        const dupProd = products.find((p) => p.id === pid);
        setPoFormError(`Product "${dupProd?.name || pid}" is added multiple times. Please consolidate quantities into a single line.`);
        return;
      }
      seen.add(pid);
    }

    // 4. Validate quantities
    const cleanedItems: CreatePurchaseOrderItemInput[] = [];
    for (const item of poFormData.items) {
      const qty = parseInt(item.orderedQuantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setPoFormError('All line item quantities must be positive whole numbers (> 0).');
        return;
      }
      cleanedItems.push({
        productId: item.productId,
        orderedQuantity: qty,
        notes: item.notes.trim() || undefined,
      });
    }

    try {
      if (editingPoId) {
        // Update existing draft
        const updated = await updatePoMutation.mutateAsync({
          id: editingPoId,
          payload: {
            vendorId: poFormData.vendorId,
            items: cleanedItems,
            expectedDeliveryDate: poFormData.expectedDeliveryDate || undefined,
            notes: poFormData.notes.trim() || undefined,
          },
        });

        if (andOrder) {
          await orderPoMutation.mutateAsync(updated.id);
        }
      } else {
        // Create new draft
        const created = await createPoMutation.mutateAsync({
          vendorId: poFormData.vendorId,
          items: cleanedItems,
          expectedDeliveryDate: poFormData.expectedDeliveryDate || undefined,
          notes: poFormData.notes.trim() || undefined,
        });

        if (andOrder) {
          await orderPoMutation.mutateAsync(created.id);
        }
      }

      setIsPoFormDrawerOpen(false);
      refetchPoList();
    } catch (err: any) {
      setPoFormError(err?.response?.data?.message || err?.message || 'Failed to save purchase order');
    }
  };

  // =========================================================================
  // PO LIFECYCLE CONFIRMATION HANDLERS
  // =========================================================================
  const handleConfirmOrder = async () => {
    if (!orderConfirmPo) return;
    try {
      await orderPoMutation.mutateAsync(orderConfirmPo.id);
      setOrderConfirmPo(null);
      refetchPoList();
      if (viewingPoId === orderConfirmPo.id) refetchViewingPo();
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelConfirmPo) return;
    try {
      await cancelPoMutation.mutateAsync({
        id: cancelConfirmPo.id,
        reason: cancelReasonText.trim() || undefined,
      });
      setCancelConfirmPo(null);
      setCancelReasonText('');
      refetchPoList();
      if (viewingPoId === cancelConfirmPo.id) refetchViewingPo();
    } catch (err) {
      // toast handled in hook
    }
  };

  // =========================================================================
  // GRN RECEIVING HANDLERS
  // =========================================================================
  const handleOpenReceiveDrawer = async (targetPo: PurchaseOrder) => {
    if (targetPo.status !== 'ORDERED' && targetPo.status !== 'PARTIALLY_RECEIVED') {
      alert(`Cannot receive goods against purchase order in '${targetPo.status}' status. Receipt requires ORDERED or PARTIALLY_RECEIVED status.`);
      return;
    }

    setReceivingPo(targetPo);
    setGrnFormError(null);

    // Generate and preserve idempotency key for this logical receipt attempt
    const initialIdempotencyKey = crypto.randomUUID();

    let fullPo = targetPo;
    if (!targetPo.items || targetPo.items.length === 0) {
      try {
        fullPo = await inventoryService.getPurchaseOrderById(targetPo.id, { unitId: activeUnitId });
        setReceivingPo(fullPo);
      } catch (err) {
        // fallback to targetPo
      }
    }

    const lines: GrnFormLine[] = (fullPo.items || [])
      .filter((it) => it.status !== 'CANCELLED')
      .map((it) => {
        const remaining = Math.max(0, it.orderedQuantity - (it.receivedQuantity || 0));
        return {
          purchaseOrderItemId: it.id,
          productId: it.productId,
          productName: it.product?.name || 'Product',
          productCode: it.product?.code,
          productCategory: it.product?.category,
          productUnit: it.product?.unit || 'Nos',
          isBatchTracked: Boolean(it.product?.isBatchTracked),
          orderedQuantity: it.orderedQuantity,
          previouslyReceivedQuantity: it.receivedQuantity || 0,
          remainingQuantity: remaining,
          receivedQuantity: remaining > 0 ? String(remaining) : '0',
          acceptedQuantity: remaining > 0 ? String(remaining) : '0',
          rejectedQuantity: '0',
          batchNumber: '',
          expiryDate: '',
          notes: '',
        };
      });

    setGrnFormData({
      receivedDate: new Date().toISOString().split('T')[0],
      deliveryChallanNo: '',
      supplierInvoiceNo: '',
      notes: '',
      idempotencyKey: initialIdempotencyKey,
      items: lines,
    });
    setIsReceivingDrawerOpen(true);
  };

  const updateGrnLine = (poItemId: string, field: keyof GrnFormLine, value: string) => {
    setGrnFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.purchaseOrderItemId !== poItemId) return it;
        const updated = { ...it, [field]: value };

        if (field === 'receivedQuantity') {
          const phys = parseInt(value, 10);
          if (!isNaN(phys) && phys >= 0) {
            updated.acceptedQuantity = String(phys);
            updated.rejectedQuantity = '0';
          }
        } else if (field === 'acceptedQuantity') {
          const phys = parseInt(it.receivedQuantity, 10);
          const acc = parseInt(value, 10);
          if (!isNaN(phys) && !isNaN(acc) && phys >= acc && acc >= 0) {
            updated.rejectedQuantity = String(phys - acc);
          }
        } else if (field === 'rejectedQuantity') {
          const phys = parseInt(it.receivedQuantity, 10);
          const rej = parseInt(value, 10);
          if (!isNaN(phys) && !isNaN(rej) && phys >= rej && rej >= 0) {
            updated.acceptedQuantity = String(phys - rej);
          }
        }

        return updated;
      }),
    }));
    setGrnFormError(null);
  };

  const handleSetLineAllRemaining = (poItemId: string) => {
    setGrnFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.purchaseOrderItemId !== poItemId) return it;
        return {
          ...it,
          receivedQuantity: String(it.remainingQuantity),
          acceptedQuantity: String(it.remainingQuantity),
          rejectedQuantity: '0',
        };
      }),
    }));
    setGrnFormError(null);
  };

  const handleSubmitGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPo) return;
    setGrnFormError(null);

    const activeReceiptLines = grnFormData.items.filter((it) => {
      const q = Number(it.receivedQuantity);
      return !isNaN(q) && q > 0;
    });

    if (activeReceiptLines.length === 0) {
      setGrnFormError('Please enter a physical received quantity greater than 0 for at least one item line.');
      return;
    }

    for (const line of activeReceiptLines) {
      const received = Number(line.receivedQuantity);
      const accepted = Number(line.acceptedQuantity);
      const rejected = Number(line.rejectedQuantity);

      if (!Number.isInteger(received) || received <= 0) {
        setGrnFormError(`${line.productName}: Physical received quantity must be a positive whole number greater than 0.`);
        return;
      }
      if (!Number.isInteger(accepted) || accepted < 0) {
        setGrnFormError(`${line.productName}: Accepted quantity must be a non-negative whole number (0 or greater).`);
        return;
      }
      if (!Number.isInteger(rejected) || rejected < 0) {
        setGrnFormError(`${line.productName}: Rejected quantity must be a non-negative whole number (0 or greater).`);
        return;
      }
      if (accepted + rejected !== received) {
        setGrnFormError(`${line.productName}: Physical quantity mismatch! Accepted (${accepted}) + Rejected (${rejected}) must equal Physical Received (${received}).`);
        return;
      }
      if (accepted > line.remainingQuantity) {
        setGrnFormError(`${line.productName}: Accepted quantity (${accepted}) exceeds remaining ordered quantity (${line.remainingQuantity}). Over-receipt is prohibited.`);
        return;
      }
      if (line.isBatchTracked && accepted > 0) {
        if (!line.batchNumber.trim()) {
          setGrnFormError(`${line.productName} is batch-tracked. Batch number is required for accepted goods.`);
          return;
        }
        if (!line.expiryDate.trim()) {
          setGrnFormError(`${line.productName} is batch-tracked. Expiry date is required for accepted goods.`);
          return;
        }
        const expDate = new Date(line.expiryDate);
        if (isNaN(expDate.getTime())) {
          setGrnFormError(`${line.productName}: Invalid expiry date provided.`);
          return;
        }
      }
    }

    const payload: CreateGoodsReceiptPayload = {
      receivedDate: grnFormData.receivedDate || undefined,
      deliveryChallanNo: grnFormData.deliveryChallanNo.trim() || undefined,
      supplierInvoiceNo: grnFormData.supplierInvoiceNo.trim() || undefined,
      notes: grnFormData.notes.trim() || undefined,
      idempotencyKey: grnFormData.idempotencyKey || undefined,
      items: activeReceiptLines.map((line) => ({
        purchaseOrderItemId: line.purchaseOrderItemId,
        receivedQuantity: parseInt(line.receivedQuantity, 10),
        acceptedQuantity: parseInt(line.acceptedQuantity, 10),
        rejectedQuantity: parseInt(line.rejectedQuantity, 10),
        batchNumber: line.batchNumber.trim() ? line.batchNumber.trim() : undefined,
        expiryDate: line.expiryDate ? line.expiryDate : undefined,
        notes: line.notes.trim() ? line.notes.trim() : undefined,
      })),
    };

    try {
      await createGrnMutation.mutateAsync({
        purchaseOrderId: receivingPo.id,
        payload,
      });
      setIsReceivingDrawerOpen(false);
      setReceivingPo(null);
      refetchPoList();
      refetchGrnList();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to post goods receipt note';
      setGrnFormError(msg);
      // NOTE: idempotencyKey remains preserved for retry attempt!
    }
  };

  // =========================================================================
  // SUPPLIER RETURN HANDLERS (D9.1)
  // =========================================================================
  const handleOpenCreateReturnDrawer = () => {
    setReturnFormData({
      vendorId: activeVendors[0]?.id || '',
      sourceType: 'GRN',
      sourceReferenceId: '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      idempotencyKey: crypto.randomUUID(),
      items: [
        {
          productId: activeProducts[0]?.id || '',
          productName: activeProducts[0]?.name || 'Product',
          productCode: activeProducts[0]?.code,
          productCategory: activeProducts[0]?.category,
          productUnit: activeProducts[0]?.unit || 'Nos',
          isBatchTracked: Boolean(activeProducts[0]?.isBatchTracked),
          batchId: '',
          batchNumber: '',
          expiryDate: '',
          availableStock: 999,
          eligibleQuantity: 999,
          returnQuantity: '1',
          reason: '',
        },
      ],
    });
    setReturnFormError(null);
    setIsReturnDrawerOpen(true);
  };

  const handleOpenReturnDrawerFromGrn = async (grn: GoodsReceiptNote) => {
    const initialKey = crypto.randomUUID();
    let fullGrn = grn;
    if (!grn.items || grn.items.length === 0) {
      try {
        fullGrn = await inventoryService.getGoodsReceiptById(grn.id, { unitId: activeUnitId });
      } catch (err) {
        // fallback
      }
    }

    const items = (fullGrn.items || [])
      .filter((it) => (it.acceptedQuantity || 0) > 0)
      .map((it) => ({
        productId: it.productId,
        productName: it.product?.name || 'Product',
        productCode: it.product?.code,
        productCategory: it.product?.category,
        productUnit: it.product?.unit || 'Nos',
        isBatchTracked: Boolean(it.product?.isBatchTracked),
        batchId: it.batchId,
        batchNumber: it.batchNumber || it.batch?.batchNumber || '',
        expiryDate: it.expiryDate ? String(it.expiryDate).split('T')[0] : '',
        availableStock: it.acceptedQuantity || 0,
        eligibleQuantity: it.acceptedQuantity || 0,
        returnQuantity: String(it.acceptedQuantity || 0),
        reason: '',
        goodsReceiptItemId: it.id,
      }));

    setReturnFormData({
      vendorId: fullGrn.vendorId,
      sourceType: 'GRN',
      sourceReferenceId: fullGrn.id,
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: `Return against GRN ${fullGrn.grnNumber}`,
      idempotencyKey: initialKey,
      items: items.length > 0 ? items : [
        {
          productId: activeProducts[0]?.id || '',
          productName: activeProducts[0]?.name || 'Product',
          productUnit: 'Nos',
          isBatchTracked: false,
          availableStock: 0,
          eligibleQuantity: 0,
          returnQuantity: '0',
          reason: '',
        }
      ],
    });
    setReturnFormError(null);
    setIsReturnDrawerOpen(true);
  };

  const handleUpdateReturnLine = (index: number, field: string, value: any) => {
    setReturnFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnFormError(null);

    const trimmedReason = returnFormData.reason.trim();
    if (trimmedReason.length < 5) {
      setReturnFormError('Please provide a meaningful return reason of at least 5 characters.');
      return;
    }

    const activeLines = returnFormData.items.filter((it) => Number(it.returnQuantity) > 0);
    if (activeLines.length === 0) {
      setReturnFormError('At least one item must have a return quantity greater than 0.');
      return;
    }

    for (const line of activeLines) {
      const qty = Number(line.returnQuantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        setReturnFormError(`Return quantity for ${line.productName} must be a positive integer.`);
        return;
      }
      if (line.eligibleQuantity > 0 && qty > line.eligibleQuantity) {
        setReturnFormError(`Return quantity for ${line.productName} cannot exceed eligible balance (${line.eligibleQuantity}).`);
        return;
      }
      if (line.isBatchTracked && !line.batchId && !line.batchNumber) {
        setReturnFormError(`Batch details are required for batch-tracked product ${line.productName}.`);
        return;
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        vendorId: returnFormData.vendorId,
        sourceType: returnFormData.sourceType,
        sourceReferenceId: returnFormData.sourceReferenceId || undefined,
        returnDate: returnFormData.returnDate,
        reason: trimmedReason,
        notes: returnFormData.notes.trim() || undefined,
        idempotencyKey: returnFormData.idempotencyKey,
        items: activeLines.map((it) => ({
          productId: it.productId,
          batchId: it.batchId || undefined,
          batchNumber: it.batchNumber || undefined,
          returnQuantity: Number(it.returnQuantity),
          reason: it.reason.trim() || undefined,
          goodsReceiptItemId: it.goodsReceiptItemId,
        })),
      });

      setIsReturnDrawerOpen(false);
      refetchReturnList();
      refetchGrnList();
      refetchPoList();
    } catch (err: any) {
      setReturnFormError(err?.response?.data?.message || err?.message || 'Failed to process supplier return');
    }
  };


  // =========================================================================
  // LEGACY DIRECT PURCHASE HANDLER
  // =========================================================================
  const handleSaveDirectPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectFormError(null);

    if (!directFormData.productId) {
      setDirectFormError('Please select a product.');
      return;
    }

    const qty = parseInt(directFormData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setDirectFormError('Quantity must be a positive integer greater than zero.');
      return;
    }

    const resolvedVendor = directFormData.isCustomVendor
      ? directFormData.vendorName.trim()
      : activeVendors.find((v) => v.id === directFormData.vendorId)?.name || '';

    if (!resolvedVendor && !directFormData.vendorId) {
      setDirectFormError('Please select or specify a supplier/vendor.');
      return;
    }

    const selProd = products.find((p) => p.id === directFormData.productId);
    if (selProd?.isBatchTracked) {
      if (!directFormData.batchNumber.trim()) {
        setDirectFormError('This product is batch-tracked. Batch number is required.');
        return;
      }
      if (!directFormData.expiryDate) {
        setDirectFormError('This product is batch-tracked. Expiry date is required.');
        return;
      }
    }

    try {
      await createDirectPurchaseMutation.mutateAsync({
        productId: directFormData.productId,
        quantity: qty,
        vendorId: directFormData.vendorId ? directFormData.vendorId : undefined,
        vendor: resolvedVendor || undefined,
        batchNumber: directFormData.batchNumber.trim() || undefined,
        expiryDate: directFormData.expiryDate || undefined,
      });

      setIsDirectDrawerOpen(false);
      refetchDirectPurchases();
    } catch (err: any) {
      setDirectFormError(err?.response?.data?.message || err?.message || 'Failed to record direct purchase entry');
    }
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: PurchaseOrderStatus | string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="warning">Draft Order</Badge>;
      case 'ORDERED':
        return <Badge variant="info">Ordered / Placed</Badge>;
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="default" className="bg-indigo-950/80 text-indigo-400 border-indigo-800/60">Partially Received</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Purchase Orders"
        description={`Manage multi-item purchase orders, vendor ordering lifecycle, and direct procurement records for ${
          activeUnit ? activeUnit.name : 'Active Operating Unit'
        }.`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchPoList();
                refetchGrnList();
                refetchReturnList();
                refetchDirectPurchases();
                refetchProducts();
                refetchVendors();
              }}
              disabled={isPoListLoading || isGrnListLoading || isReturnListLoading || isDirectLoading || isVendorsLoading}
              title="Refresh ledger from server"
            >
              <RotateCcw
                className={`w-4 h-4 mr-2 ${
                  isPoListLoading || isGrnListLoading || isReturnListLoading || isDirectLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>

            {canManagePurchases && activeTab === 'orders' && (
              <Button
                variant="primary"
                size="sm"
                onClick={openCreatePoDrawer}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Purchase Order
              </Button>
            )}

            {canManagePurchases && activeTab === 'returns' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateReturnDrawer}
                className="bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                New Supplier Return
              </Button>
            )}

            {canManagePurchases && activeTab === 'direct' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDirectFormData({
                    productId: scopedProducts[0]?.id || '',
                    vendorId: activeVendors[0]?.id || '',
                    vendorName: '',
                    isCustomVendor: false,
                    quantity: '1',
                    batchNumber: '',
                    expiryDate: '',
                  });
                  setDirectFormError(null);
                  setIsDirectDrawerOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 shadow-blue-950/40 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Record Direct Stock
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'orders'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Purchase Orders (Multi-Item)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
            {poTotalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'receipts'
              ? 'bg-slate-800 text-amber-400 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Goods Receipts (GRN History)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
            {grnListData?.total || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'returns'
              ? 'bg-slate-800 text-rose-400 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Supplier Returns</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
            {returnListData?.total || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'direct'
              ? 'bg-slate-800 text-blue-400 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Direct Purchase Stock Entry (Legacy)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
            {scopedDirectPurchases.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MULTI-ITEM PURCHASE ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Purchase Orders</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">{poMetrics.total}</span>
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">All lifecycle purchase orders in this unit</p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Draft Orders</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">{poMetrics.drafts}</span>
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Pending submission or approval</p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Active Procurement</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-blue-400 font-mono">{poMetrics.active}</span>
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ordered or partially fulfilled by vendor</p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Fully Received</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">{poMetrics.completed}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Fulfillment completed into physical stock</p>
            </Card>
          </section>

          {/* Filters & Controls */}
          <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by PO #, vendor, or notes..."
                  value={poSearch}
                  onChange={(e) => {
                    setPoSearch(e.target.value);
                    setPoPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={poStatusFilter}
                onChange={(e) => {
                  setPoStatusFilter(e.target.value);
                  setPoPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Lifecycle Statuses' },
                  { value: 'DRAFT', label: 'DRAFT (Pending Submit)' },
                  { value: 'ORDERED', label: 'ORDERED (Placed with Vendor)' },
                  { value: 'PARTIALLY_RECEIVED', label: 'PARTIALLY_RECEIVED' },
                  { value: 'COMPLETED', label: 'COMPLETED (Fulfilled)' },
                  { value: 'CANCELLED', label: 'CANCELLED' },
                ]}
              />

              {/* Vendor Filter */}
              <Select
                value={poVendorFilter}
                onChange={(e) => {
                  setPoVendorFilter(e.target.value);
                  setPoPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Vendors' },
                  ...activeVendors.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.code || 'Vendor'})`,
                  })),
                ]}
              />

              {/* Scope Selector */}
              <Select
                value={inventoryScope}
                onChange={(e) => setInventoryScope(e.target.value as InventoryScope)}
                options={inventoryScopeOptions}
              />
            </div>
          </Card>

          {/* PO Table */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
            {isPoListLoading ? (
              <div className="p-12">
                <LoadingState message="Loading purchase orders..." />
              </div>
            ) : isPoListError ? (
              <div className="p-8">
                <ErrorState
                  title="Failed to Load Purchase Orders"
                  message={poListError instanceof Error ? poListError.message : 'Server error'}
                  onRetry={() => refetchPoList()}
                />
              </div>
            ) : poOrdersList.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No Purchase Orders Found"
                  description={
                    poSearch || poStatusFilter !== 'ALL' || poVendorFilter !== 'ALL'
                      ? 'No purchase orders match your current search and filter criteria.'
                      : 'No purchase orders have been created in this operating unit yet.'
                  }
                  action={
                    canManagePurchases ? (
                      <Button variant="primary" size="sm" onClick={openCreatePoDrawer} className="bg-emerald-600 hover:bg-emerald-500">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create First Purchase Order
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
                      <th className="py-3.5 px-4">PO Number & Date</th>
                      <th className="py-3.5 px-4">Vendor / Supplier</th>
                      <th className="py-3.5 px-4">Expected Delivery</th>
                      <th className="py-3.5 px-4">Items & Fulfillment</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {poOrdersList.map((po, idx) => {
                      const globalIdx = (poPage - 1) * poPageSize + idx + 1;
                      const orderDateFormatted = po.orderDate
                        ? new Date(po.orderDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })
                        : '-';
                      const expDeliveryFormatted = po.expectedDeliveryDate
                        ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })
                        : 'Not specified';

                      const totalOrdered = po.totalOrderedQuantity || 0;
                      const totalReceived = po.totalReceivedQuantity || 0;
                      const pct = totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0;

                      return (
                        <tr key={po.id} className="hover:bg-slate-800/40 transition-colors group text-slate-200">
                          <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                            {globalIdx}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                                  {po.orderNumber}
                                </span>
                                <span className="text-xs text-slate-400 block mt-0.5">
                                  Ordered: {orderDateFormatted}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-100">{po.vendor?.name || 'Unknown Vendor'}</span>
                              {po.vendor?.code && (
                                <span className="text-[11px] font-mono text-cyan-400">
                                  {po.vendor.code} {po.vendor.category ? `• ${po.vendor.category}` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                            {expDeliveryFormatted}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  {po.itemCount || po.items?.length || 0} line items
                                </span>
                                <span className="font-mono font-bold text-slate-200">
                                  {totalReceived} / {totalOrdered}
                                </span>
                              </div>
                              <div className="w-32 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-500' : 'bg-slate-700'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(po.status)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingPoId(po.id)}
                                title="View Order Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Receive Goods (GRN) */}
                              {canManagePurchases && (po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveDrawer(po)}
                                  title="Receive Goods against this Purchase Order (Create GRN)"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60 hover:bg-amber-900/60 hover:text-amber-200 transition-colors shadow-sm"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Receive</span>
                                </button>
                              )}

                              {/* Edit Draft */}
                              {canManagePurchases && po.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => openEditDraftPoDrawer(po)}
                                  title="Edit Draft Order"
                                  className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {/* Place / Submit Order */}
                              {canManagePurchases && po.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => setOrderConfirmPo(po)}
                                  title="Place Order with Vendor"
                                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}

                              {/* Cancel Order */}
                              {canManagePurchases && po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelConfirmPo(po);
                                    setCancelReasonText('');
                                  }}
                                  title="Cancel Order"
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
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

            {/* Pagination Controls */}
            {poOrdersList.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
                <div>
                  Showing page <span className="font-bold text-slate-200">{poPage}</span> of{' '}
                  <span className="font-bold text-slate-200">{poListData?.totalPages || 1}</span> ({poTotalCount} total orders)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={poPage <= 1}
                    onClick={() => setPoPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={poPage >= (poListData?.totalPages || 1)}
                    onClick={() => setPoPage((prev) => prev + 1)}
                    className="h-8 px-2.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOODS RECEIPTS / GRN HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Goods Receipts (GRN)
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">
                  {grnMetrics.totalReceipts}
                </span>
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Physical deliveries verified and recorded with supplier reference
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Units Accepted (+Stock)
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {grnMetrics.totalAccepted.toLocaleString()}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Accepted physical goods credited directly to active inventory
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Units Rejected (Discrepancies)
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  {grnMetrics.totalRejected.toLocaleString()}
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Damaged/rejected deliveries excluded from physical stock
              </p>
            </Card>
          </section>

          {/* Search & Filters */}
          <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by GRN #, PO #, Challan #, or Supplier..."
                  value={grnSearch}
                  onChange={(e) => {
                    setGrnSearch(e.target.value);
                    setGrnPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={grnVendorFilter}
                onChange={(e) => {
                  setGrnVendorFilter(e.target.value);
                  setGrnPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Vendors / Suppliers</option>
                {activeVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <Select
                value={inventoryScope}
                onChange={(e) => setInventoryScope(e.target.value as InventoryScope)}
                options={inventoryScopeOptions}
              />
            </div>
          </Card>

          {/* Goods Receipts Table */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
            {isGrnListLoading ? (
              <div className="p-12">
                <LoadingState message="Loading goods receipts register..." />
              </div>
            ) : isGrnListError ? (
              <div className="p-8">
                <ErrorState
                  title="Failed to Load Goods Receipts"
                  message={grnListError instanceof Error ? grnListError.message : 'Server error'}
                  onRetry={() => refetchGrnList()}
                />
              </div>
            ) : grnReceiptsList.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No Goods Receipts Recorded"
                  description="When ordered purchase orders are delivered, click 'Receive' on the Purchase Orders tab to record a Goods Receipt Note."
                  action={
                    canManagePurchases ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveTab('orders')}
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1.5" />
                        Go to Purchase Orders
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
                      <th className="py-3.5 px-4">GRN #</th>
                      <th className="py-3.5 px-4">Linked PO</th>
                      <th className="py-3.5 px-4">Vendor</th>
                      <th className="py-3.5 px-4">Receipt Date</th>
                      <th className="py-3.5 px-4">Received By</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">Accepted (+Stock)</th>
                      <th className="py-3.5 px-4 text-right">Rejected</th>
                      <th className="py-3.5 px-4">Reference Docs</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {grnReceiptsList.map((grn) => {
                      const totalAcc = Number(grn.totalAcceptedQuantity || 0);
                      const totalRej = Number(grn.totalRejectedQuantity || 0);
                      return (
                        <tr key={grn.id} className="hover:bg-slate-800/40 transition-colors text-slate-200">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                              {grn.grnNumber}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {grn.purchaseOrder?.orderNumber ? (
                              <button
                                type="button"
                                onClick={() => setViewingPoId(grn.purchaseOrderId)}
                                className="font-mono text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                                title="Click to view linked Purchase Order"
                              >
                                {grn.purchaseOrder.orderNumber}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-500 font-mono text-xs">Direct / None</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-100">{grn.vendor?.name || 'Unknown'}</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                            {grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString('en-GB') : '-'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 text-xs">
                            {grn.receivedByName || grn.receivedBy || 'Staff'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {grn.itemCount || grn.items?.length || 0}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-bold text-emerald-400">
                              +{totalAcc.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {totalRej > 0 ? (
                              <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 text-xs">
                                {totalRej.toLocaleString()}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-500 text-xs">0</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {grn.deliveryChallanNo ? (
                              <div className="font-mono">DC: {grn.deliveryChallanNo}</div>
                            ) : null}
                            {grn.supplierInvoiceNo ? (
                              <div className="font-mono text-[11px] text-slate-500">Inv: {grn.supplierInvoiceNo}</div>
                            ) : null}
                            {!grn.deliveryChallanNo && !grn.supplierInvoiceNo ? '-' : null}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingGrnId(grn.id)}
                                title="View GRN Receipt Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canManagePurchases && totalAcc > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReturnDrawerFromGrn(grn)}
                                  title="Return goods from this receipt to supplier"
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
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

            {/* Pagination Controls */}
            {grnReceiptsList.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
                <div>
                  Showing page <span className="font-bold text-slate-200">{grnPage}</span> of{' '}
                  <span className="font-bold text-slate-200">{grnListData?.totalPages || 1}</span> ({grnListData?.total || 0} total receipts)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={grnPage <= 1}
                    onClick={() => setGrnPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={grnPage >= (grnListData?.totalPages || 1)}
                    onClick={() => setGrnPage((prev) => prev + 1)}
                    className="h-8 px-2.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUPPLIER RETURNS (D9.1) */}
      {/* ========================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Supplier Returns
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-rose-400">
                  {returnMetrics.totalReturns}
                </span>
                <span className="text-xs text-slate-500">Recorded Returns</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Units Returned (-Stock)
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-rose-400">
                  -{returnMetrics.totalUnits.toLocaleString()}
                </span>
                <span className="text-xs text-rose-500/80 font-medium">Stock Deducted</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Affected Vendors
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {returnMetrics.affectedVendors}
                </span>
                <span className="text-xs text-slate-500">Suppliers with Returns</span>
              </div>
            </Card>
          </section>

          {/* Search & Filter Toolbar */}
          <Card className="p-4 border-slate-800 bg-slate-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Return #, Reason, or Ref..."
                  value={returnSearch}
                  onChange={(e) => {
                    setReturnSearch(e.target.value);
                    setReturnPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={returnVendorFilter}
                onChange={(e) => {
                  setReturnVendorFilter(e.target.value);
                  setReturnPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">All Vendors / Suppliers</option>
                {activeVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <Select
                value={inventoryScope}
                onChange={(e) => setInventoryScope(e.target.value as InventoryScope)}
                options={inventoryScopeOptions}
              />
            </div>
          </Card>

          {/* Supplier Returns Table */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
            {isReturnListLoading ? (
              <div className="p-12">
                <LoadingState message="Loading supplier returns register..." />
              </div>
            ) : isReturnListError ? (
              <div className="p-8">
                <ErrorState
                  title="Failed to Load Returns"
                  message={returnListError instanceof Error ? returnListError.message : 'Server error'}
                  onRetry={() => refetchReturnList()}
                />
              </div>
            ) : supplierReturnsList.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No Supplier Returns Recorded"
                  description="When defective, damaged, or excess goods need to be returned to a supplier, record a Supplier Return here or from the Goods Receipts tab."
                  action={
                    canManagePurchases ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreateReturnDrawer}
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        New Supplier Return
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
                      <th className="py-3.5 px-4">Return #</th>
                      <th className="py-3.5 px-4">Vendor</th>
                      <th className="py-3.5 px-4">Return Date</th>
                      <th className="py-3.5 px-4">Source Type & Ref</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">Units Returned (-Stock)</th>
                      <th className="py-3.5 px-4">Processed By</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {supplierReturnsList.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors text-slate-200">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                            {ret.returnNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-100 font-semibold">
                          {ret.vendor?.name || 'Unknown Vendor'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                          {ret.returnDate ? ret.returnDate.split('T')[0] : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                          <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 mr-1.5">
                            {ret.sourceType || 'GRN'}
                          </span>
                          {ret.sourceReference || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate" title={ret.reason}>
                          {ret.reason}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {ret.items?.length || 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-rose-400">
                            -{Number(ret.totalQuantity || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {ret.returnedByName || 'Staff'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingReturnId(ret.id)}
                            title="View Return Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {supplierReturnsList.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
                <div>
                  Showing page <span className="font-bold text-slate-200">{returnPage}</span> of{' '}
                  <span className="font-bold text-slate-200">{returnListData?.totalPages || 1}</span> ({returnListData?.total || 0} total returns)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={returnPage <= 1}
                    onClick={() => setReturnPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={returnPage >= (returnListData?.totalPages || 1)}
                    onClick={() => setReturnPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIRECT PURCHASE STOCK ENTRY (LEGACY PRESERVED) */}
      {/* ========================================================================= */}
      {activeTab === 'direct' && (
        <div className="space-y-6">
          {/* Legacy KPI Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Direct Entries
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">
                  {directMetrics.totalTransactions}
                </span>
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Direct procurement entries recorded directly into live stock
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Units Directly Received
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {directMetrics.totalItemsPurchased.toLocaleString()}
                </span>
                <Boxes className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total quantity credited directly to active physical stock
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Direct Suppliers
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {directMetrics.activeSuppliersCount}
                </span>
                <Truck className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Distinct vendors utilized in direct physical receipts
              </p>
            </Card>
          </section>

          {/* Legacy Filters */}
          <Card className="p-4 border-slate-800 bg-slate-900/60 backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search direct purchases by product name, SKU, or vendor..."
                  value={directSearch}
                  onChange={(e) => {
                    setDirectSearch(e.target.value);
                    setDirectPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <Select
                value={inventoryScope}
                onChange={(e) => setInventoryScope(e.target.value as InventoryScope)}
                options={inventoryScopeOptions}
              />
            </div>
          </Card>

          {/* Legacy Direct Purchases Table */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
            {isDirectLoading ? (
              <div className="p-12">
                <LoadingState message="Loading direct purchases ledger..." />
              </div>
            ) : isDirectError ? (
              <div className="p-8">
                <ErrorState
                  title="Failed to Load Direct Purchases"
                  message={directError instanceof Error ? directError.message : 'Server error'}
                  onRetry={() => refetchDirectPurchases()}
                />
              </div>
            ) : scopedDirectPurchases.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No Direct Purchases Recorded"
                  description="Use direct purchase stock entry when physical inventory arrives without prior purchase orders."
                  action={
                    canManagePurchases ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDirectDrawerOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Record First Direct Purchase
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
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Vendor / Supplier</th>
                      <th className="py-3.5 px-4 text-right">Quantity Received</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                      <th className="py-3.5 px-4">Receipt Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {scopedDirectPurchases
                      .filter((p) => {
                        const q = directSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          p.product?.name?.toLowerCase().includes(q) ||
                          p.product?.code?.toLowerCase().includes(q) ||
                          p.vendor?.toLowerCase().includes(q)
                        );
                      })
                      .slice((directPage - 1) * directPageSize, directPage * directPageSize)
                      .map((p, idx) => {
                        const globalIdx = (directPage - 1) * directPageSize + idx + 1;
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors text-slate-200">
                            <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                              {globalIdx}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-100">{p.product?.name || 'Unknown Product'}</div>
                              <div className="text-xs text-slate-400 font-mono">{p.product?.code || '-'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-100">{p.Vendor?.name || p.vendor || 'Unknown Vendor'}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                              +{p.quantity} {p.product?.unit || 'Nos'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Badge variant="success">Stock Received</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '-'}
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

      {/* ========================================================================= */}
      {/* DRAWER 1: CREATE / EDIT MULTI-ITEM PURCHASE ORDER */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isPoFormDrawerOpen}
        onClose={() => setIsPoFormDrawerOpen(false)}
        title={editingPoId ? 'Edit Draft Purchase Order' : 'Create Multi-Item Purchase Order'}
        description="Select a registered supplier, add line items with quantities, and save as draft or place immediately."
        size="xl"
      >
        <div className="space-y-6">
          {poFormError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{poFormError}</span>
            </div>
          )}

          {/* Supplier & Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <Select
              label="Supplier / Vendor *"
              value={poFormData.vendorId}
              onChange={(e) => setPoFormData({ ...poFormData, vendorId: e.target.value })}
              options={[
                { value: '', label: '-- Select Supplier / Vendor --', disabled: true },
                ...activeVendors.map((v) => ({
                  value: v.id,
                  label: `${v.name} (${v.code || 'Vendor'})`,
                })),
              ]}
            />

            <Input
              label="Expected Delivery Date"
              type="date"
              value={poFormData.expectedDeliveryDate}
              onChange={(e) => setPoFormData({ ...poFormData, expectedDeliveryDate: e.target.value })}
            />

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Order Notes / Purchasing Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Optional delivery terms, payment conditions, or receiving notes..."
                value={poFormData.notes}
                onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Line Items ({poFormData.items.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPoLine}
                className="border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Product Line
              </Button>
            </div>

            <div className="space-y-2.5">
              {poFormData.items.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                return (
                  <div
                    key={line.tempId}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 group hover:border-slate-700 transition-colors"
                  >
                    <span className="w-6 text-center text-xs font-mono text-slate-500 font-bold shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Product Select */}
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={line.productId}
                        onChange={(e) => updatePoLine(line.tempId, 'productId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="" disabled>-- Select Product --</option>
                        {activeProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code ? `[${p.code}] ` : ''}{p.name} ({p.category}) - {p.unit || 'Nos'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-32 shrink-0">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Qty"
                        value={line.orderedQuantity}
                        onChange={(e) => updatePoLine(line.tempId, 'orderedQuantity', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-right focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Unit display */}
                    <span className="text-xs text-slate-400 w-12 text-left shrink-0">
                      {prod?.unit || 'Nos'}
                    </span>

                    {/* Line notes */}
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Line note (optional)"
                        value={line.notes}
                        onChange={(e) => updatePoLine(line.tempId, 'notes', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removePoLine(line.tempId)}
                      disabled={poFormData.items.length <= 1}
                      title="Remove Line Item"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPoFormDrawerOpen(false)}
              disabled={createPoMutation.isPending || updatePoMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSavePo(false)}
              disabled={createPoMutation.isPending || updatePoMutation.isPending}
              className="border-amber-700/60 text-amber-400 hover:bg-amber-950/30"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              {createPoMutation.isPending || updatePoMutation.isPending ? 'Saving...' : 'Save as Draft'}
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => handleSavePo(true)}
              disabled={createPoMutation.isPending || updatePoMutation.isPending || orderPoMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Save & Place Order
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER 2: PO DETAILS VIEW */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(viewingPoId)}
        onClose={() => setViewingPoId(null)}
        title={viewingPoDetails ? `Purchase Order ${viewingPoDetails.orderNumber}` : 'Purchase Order Details'}
        description="Fulfillment tracking, line items breakdown, and receiving history."
        size="lg"
      >
        {isViewingPoLoading ? (
          <div className="p-8">
            <LoadingState message="Loading order details..." />
          </div>
        ) : !viewingPoDetails ? (
          <div className="p-6">
            <ErrorState title="Not Found" message="Purchase order details could not be loaded." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status & Key Meta */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-slate-100">{viewingPoDetails.orderNumber}</span>
                  {renderStatusBadge(viewingPoDetails.status)}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {viewingPoDetails.orderDate ? new Date(viewingPoDetails.orderDate).toLocaleDateString('en-GB') : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Vendor:</span>
                  <span className="font-bold text-slate-200">{viewingPoDetails.vendor?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Delivery:</span>
                  <span className="font-bold text-slate-200">
                    {viewingPoDetails.expectedDeliveryDate
                      ? new Date(viewingPoDetails.expectedDeliveryDate).toLocaleDateString('en-GB')
                      : 'None specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Created By:</span>
                  <span className="font-bold text-slate-200">{viewingPoDetails.createdByName || 'Authorized User'}</span>
                </div>
              </div>

              {viewingPoDetails.notes && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold block mb-0.5">Order Notes:</span>
                  {viewingPoDetails.notes}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Line Items ({viewingPoDetails.items?.length || 0})
              </h4>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Ordered</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Remaining</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {(viewingPoDetails.items || []).map((it) => {
                      const remaining = Math.max(0, it.orderedQuantity - (it.receivedQuantity || 0));
                      return (
                        <tr key={it.id} className="hover:bg-slate-900/60">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-100 block">{it.product?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {it.product?.code ? `[${it.product.code}] ` : ''}{it.product?.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                            {it.orderedQuantity} {it.product?.unit || 'Nos'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {it.receivedQuantity || 0}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                            {remaining}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {it.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Goods Receipts Summary if any */}
            {viewingPoDetails.goodsReceipts && viewingPoDetails.goodsReceipts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" />
                  Receiving Receipts (GRN) ({viewingPoDetails.goodsReceipts.length})
                </h4>
                <div className="space-y-2">
                  {viewingPoDetails.goodsReceipts.map((grn: any) => (
                    <div
                      key={grn.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-cyan-400">{grn.grnNumber}</span>
                        {grn.deliveryChallanNo && (
                          <span className="text-slate-400">Challan: {grn.deliveryChallanNo}</span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono">
                        {grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString('en-GB') : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingPoId(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {canManagePurchases && viewingPoDetails.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingPoId(null);
                        openEditDraftPoDrawer(viewingPoDetails);
                      }}
                      className="border-amber-700/60 text-amber-400"
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit Draft
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setOrderConfirmPo(viewingPoDetails);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Place Order
                    </Button>
                  </>
                )}

                {canManagePurchases &&
                  (viewingPoDetails.status === 'ORDERED' || viewingPoDetails.status === 'PARTIALLY_RECEIVED') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const target = viewingPoDetails;
                        setViewingPoId(null);
                        handleOpenReceiveDrawer(target as PurchaseOrder);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40"
                    >
                      <Truck className="w-4 h-4 mr-1.5" />
                      Receive Goods (GRN)
                    </Button>
                  )}

                {canManagePurchases &&
                  viewingPoDetails.status !== 'COMPLETED' &&
                  viewingPoDetails.status !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancelConfirmPo(viewingPoDetails);
                        setCancelReasonText('');
                      }}
                      className="border-rose-800 text-rose-400 hover:bg-rose-950/30"
                    >
                      <Ban className="w-4 h-4 mr-1.5" />
                      Cancel Order
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM ORDER PLACEMENT */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(orderConfirmPo)}
        onClose={() => setOrderConfirmPo(null)}
        title="Place Purchase Order"
        description="Confirm sending purchase order to supplier."
        size="sm"
      >
        {orderConfirmPo && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-200 text-xs">
              <p className="font-bold mb-1">Confirm order submission for {orderConfirmPo.orderNumber}?</p>
              <p className="text-slate-400">
                This order will transition from DRAFT to ORDERED status. Line items will be locked and ready for receiving goods receipts.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setOrderConfirmPo(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmOrder}
                disabled={orderPoMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]"
              >
                {orderPoMutation.isPending ? 'Placing...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM ORDER CANCELLATION */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(cancelConfirmPo)}
        onClose={() => setCancelConfirmPo(null)}
        title="Cancel Purchase Order"
        description="Cancel pending order and close remaining unfulfilled balance."
        size="sm"
      >
        {cancelConfirmPo && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
              <p className="font-bold mb-1">Cancel {cancelConfirmPo.orderNumber}?</p>
              <p className="text-slate-400">
                {cancelConfirmPo.status === 'PARTIALLY_RECEIVED'
                  ? 'This order has already received physical inventory. Cancellation will close only the remaining unfulfilled balance; previously accepted stock remains strictly preserved.'
                  : 'This order will be permanently cancelled. No further items can be received against it.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Vendor out of stock, cancelled by requester, etc..."
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setCancelConfirmPo(null)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmCancel}
                disabled={cancelPoMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white min-w-[120px]"
              >
                {cancelPoMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER 3: LEGACY RECORD DIRECT PURCHASE (PRESERVED) */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isDirectDrawerOpen}
        onClose={() => setIsDirectDrawerOpen(false)}
        title="Record Direct Stock Purchase"
        description="Direct stock entry crediting inventory balances immediately."
        size="md"
      >
        <form onSubmit={handleSaveDirectPurchase} className="space-y-4">
          {directFormError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{directFormError}</span>
            </div>
          )}

          <Select
            label="Product *"
            value={directFormData.productId}
            onChange={(e) => setDirectFormData({ ...directFormData, productId: e.target.value })}
            options={scopedProducts.map((p) => ({
              value: p.id,
              label: `${p.code ? `[${p.code}] ` : ''}${p.name} (${p.category}) - ${p.unit || 'Nos'}`,
            }))}
          />

          <Input
            label="Quantity Received *"
            type="number"
            min="1"
            value={directFormData.quantity}
            onChange={(e) => setDirectFormData({ ...directFormData, quantity: e.target.value })}
          />

          <Select
            label="Supplier / Vendor"
            value={directFormData.isCustomVendor ? '__custom__' : directFormData.vendorId}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setDirectFormData({ ...directFormData, isCustomVendor: true, vendorId: '' });
              } else {
                setDirectFormData({ ...directFormData, isCustomVendor: false, vendorId: e.target.value });
              }
            }}
            options={[
              ...activeVendors.map((v) => ({ value: v.id, label: v.name })),
              { value: '__custom__', label: '+ Other / Enter Vendor Name Manually' },
            ]}
          />

          {directFormData.isCustomVendor && (
            <Input
              label="Custom Vendor Name *"
              placeholder="e.g. Apex Health Logistics"
              value={directFormData.vendorName}
              onChange={(e) => setDirectFormData({ ...directFormData, vendorName: e.target.value })}
            />
          )}

          <Input
            label="Batch Number"
            placeholder="e.g. BATCH-2026-001"
            value={directFormData.batchNumber}
            onChange={(e) => setDirectFormData({ ...directFormData, batchNumber: e.target.value })}
          />

          <Input
            label="Expiry Date"
            type="date"
            value={directFormData.expiryDate}
            onChange={(e) => setDirectFormData({ ...directFormData, expiryDate: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDirectDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createDirectPurchaseMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {createDirectPurchaseMutation.isPending ? 'Recording...' : 'Confirm & Save Purchase'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER: GRN RECEIVING FORM */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isReceivingDrawerOpen}
        onClose={() => {
          setIsReceivingDrawerOpen(false);
          setReceivingPo(null);
        }}
        title={receivingPo ? `Receive Goods — ${receivingPo.orderNumber}` : 'Create Goods Receipt Note'}
        description="Verify physical delivered goods against ordered lines. Only accepted quantities will be added to inventory stock."
        size="xl"
      >
        <form onSubmit={handleSubmitGrn} className="space-y-6">
          {/* Header Reference Card */}
          {receivingPo && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-bold font-mono text-amber-400">{receivingPo.orderNumber}</span>
                  {renderStatusBadge(receivingPo.status)}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Ordered: {receivingPo.orderDate ? new Date(receivingPo.orderDate).toLocaleDateString('en-GB') : '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Vendor:</span>
                  <span className="font-bold text-slate-200">{receivingPo.vendor?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Delivery:</span>
                  <span className="font-bold text-slate-200">
                    {receivingPo.expectedDeliveryDate ? new Date(receivingPo.expectedDeliveryDate).toLocaleDateString('en-GB') : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Idempotency Reference:</span>
                  <span className="font-mono text-slate-400 text-[11px] truncate block" title={grnFormData.idempotencyKey}>
                    {grnFormData.idempotencyKey ? `${grnFormData.idempotencyKey.slice(0, 8)}... (Safe Retry Active)` : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Receipt Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={grnFormData.receivedDate}
                onChange={(e) => setGrnFormData((prev) => ({ ...prev, receivedDate: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Delivery Challan No
              </label>
              <input
                type="text"
                placeholder="e.g. DC-98412"
                value={grnFormData.deliveryChallanNo}
                onChange={(e) => setGrnFormData((prev) => ({ ...prev, deliveryChallanNo: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Supplier Invoice No
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-081"
                value={grnFormData.supplierInvoiceNo}
                onChange={(e) => setGrnFormData((prev) => ({ ...prev, supplierInvoiceNo: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Receiving Notes / Delivery Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Received in good condition, delivered by courier..."
              value={grnFormData.notes}
              onChange={(e) => setGrnFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Line Items Receiving Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                Receipt Line Items ({grnFormData.items.length})
              </h4>
              <span className="text-xs text-slate-400">
                Invariant rule: <span className="font-mono text-amber-300">Accepted + Rejected = Physical Received</span>
              </span>
            </div>

            <div className="space-y-3">
              {grnFormData.items.map((line, idx) => {
                const isFulfilled = line.remainingQuantity <= 0;
                return (
                  <div
                    key={line.purchaseOrderItemId}
                    className={`p-4 rounded-xl border transition-all ${
                      isFulfilled
                        ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-mono text-slate-500 font-bold shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-100 text-sm">{line.productName}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            {line.productCode && <span className="font-mono">[{line.productCode}]</span>}
                            <span>{line.productCategory}</span>
                            <span>• {line.productUnit}</span>
                            {line.isBatchTracked && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                Batch-Tracked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block">Ordered:</span>
                          <span className="font-bold text-slate-300">{line.orderedQuantity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Received:</span>
                          <span className="font-bold text-emerald-400">{line.previouslyReceivedQuantity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Remaining:</span>
                          <span className="font-bold text-amber-400">{line.remainingQuantity}</span>
                        </div>
                        {!isFulfilled && (
                          <button
                            type="button"
                            onClick={() => handleSetLineAllRemaining(line.purchaseOrderItemId)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/50 transition-colors"
                          >
                            Accept Balance ({line.remainingQuantity})
                          </button>
                        )}
                      </div>
                    </div>

                    {!isFulfilled ? (
                      <div className="pt-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Physical Received Qty <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={line.receivedQuantity}
                              onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'receivedQuantity', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-100 font-mono text-right focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                              Accepted (+Stock) <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={line.remainingQuantity}
                              step="1"
                              value={line.acceptedQuantity}
                              onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'acceptedQuantity', e.target.value)}
                              className="w-full bg-slate-900 border border-emerald-700/60 rounded-xl px-3 py-1.5 text-sm text-emerald-300 font-mono text-right focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                              Rejected (Discrepancy)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={line.rejectedQuantity}
                              onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'rejectedQuantity', e.target.value)}
                              className="w-full bg-slate-900 border border-amber-700/60 rounded-xl px-3 py-1.5 text-sm text-amber-300 font-mono text-right focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Batch Details if product is batch tracked */}
                        {line.isBatchTracked && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                                Batch Number <span className="text-rose-400">* Required</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. BATCH-2026-X1"
                                value={line.batchNumber}
                                onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'batchNumber', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                                Expiry Date <span className="text-rose-400">* Required</span>
                              </label>
                              <input
                                type="date"
                                value={line.expiryDate}
                                onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'expiryDate', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <input
                            type="text"
                            placeholder="Line remarks (e.g. 2 boxes damaged by moisture)..."
                            value={line.notes}
                            onChange={(e) => updateGrnLine(line.purchaseOrderItemId, 'notes', e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-slate-500 italic">
                        This line item has already been fully received ({line.previouslyReceivedQuantity} of {line.orderedQuantity} {line.productUnit}).
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanatory Stock Impact Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Transactional Stock Safety Guarantee</p>
              <p className="mt-0.5">
                Only accepted goods will be added to active inventory stock and trigger stock movements. Rejected quantities are permanently recorded for supplier discrepancy reporting and will NOT enter inventory.
              </p>
            </div>
          </div>

          {/* Validation Error Banner */}
          {grnFormError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{grnFormError}</span>
            </div>
          )}

          {/* Drawer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReceivingDrawerOpen(false);
                setReceivingPo(null);
              }}
              disabled={createGrnMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={createGrnMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              {createGrnMutation.isPending ? 'Posting Goods Receipt...' : 'Post Goods Receipt (GRN)'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER: GRN DETAILS VIEW */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(viewingGrnId)}
        onClose={() => setViewingGrnId(null)}
        title={viewingGrnDetails ? `Goods Receipt Note ${viewingGrnDetails.grnNumber}` : 'Goods Receipt Details'}
        description="Physical receiving audit trail, accepted inventory stock increments, and rejected quantities."
        size="lg"
      >
        {isViewingGrnLoading ? (
          <div className="p-8">
            <LoadingState message="Loading goods receipt record..." />
          </div>
        ) : !viewingGrnDetails ? (
          <div className="p-6">
            <ErrorState title="Not Found" message="Goods receipt details could not be loaded." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* GRN Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-amber-400">{viewingGrnDetails.grnNumber}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {viewingGrnDetails.receivedDate ? new Date(viewingGrnDetails.receivedDate).toLocaleDateString('en-GB') : '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Linked Purchase Order:</span>
                  {viewingGrnDetails.purchaseOrder?.orderNumber ? (
                    <button
                      type="button"
                      onClick={() => {
                        const poId = viewingGrnDetails.purchaseOrderId;
                        setViewingGrnId(null);
                        setViewingPoId(poId);
                      }}
                      className="font-bold text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                    >
                      {viewingGrnDetails.purchaseOrder.orderNumber}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="font-mono text-slate-400">Direct Purchase</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block">Vendor / Supplier:</span>
                  <span className="font-bold text-slate-200">{viewingGrnDetails.vendor?.name || 'Unknown'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Received By:</span>
                  <span className="font-bold text-slate-200">{viewingGrnDetails.receivedByName || viewingGrnDetails.receivedBy || 'Staff'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Delivery Challan:</span>
                  <span className="font-mono text-slate-300">{viewingGrnDetails.deliveryChallanNo || 'None'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Supplier Invoice:</span>
                  <span className="font-mono text-slate-300">{viewingGrnDetails.supplierInvoiceNo || 'None'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Idempotency Key:</span>
                  <span className="font-mono text-slate-400 text-[10px] truncate block" title={viewingGrnDetails.idempotencyKey || ''}>
                    {viewingGrnDetails.idempotencyKey ? `${viewingGrnDetails.idempotencyKey.slice(0, 8)}...` : 'N/A'}
                  </span>
                </div>
              </div>

              {viewingGrnDetails.notes && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold block mb-0.5">Receipt Remarks:</span>
                  {viewingGrnDetails.notes}
                </div>
              )}
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Physical Received</span>
                <span className="text-xl font-mono font-bold text-slate-100">
                  {viewingGrnDetails.totalReceivedQuantity || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Accepted (+Stock)</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  +{viewingGrnDetails.totalAcceptedQuantity || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/40 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-400 block">Rejected (Discrepancy)</span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  {viewingGrnDetails.totalRejectedQuantity || 0}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                Receipt Line Items ({viewingGrnDetails.items?.length || 0})
              </h4>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Batch & Expiry</th>
                      <th className="py-2.5 px-3 text-right">Physical</th>
                      <th className="py-2.5 px-3 text-right">Accepted</th>
                      <th className="py-2.5 px-3 text-right">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {(viewingGrnDetails.items || []).map((it) => (
                      <tr key={it.id} className="hover:bg-slate-900/60">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-100 block">{it.product?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {it.product?.code ? `[${it.product.code}] ` : ''}{it.product?.category} • {it.product?.unit || 'Nos'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {it.batch?.batchNumber || it.batchNumber ? (
                            <div>
                              <span className="font-mono text-cyan-400 block font-bold">
                                {it.batch?.batchNumber || it.batchNumber}
                              </span>
                              {(it.batch?.expiryDate || it.expiryDate) && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Exp: {new Date(it.batch?.expiryDate || it.expiryDate!).toLocaleDateString('en-GB')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {it.receivedQuantity}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          +{it.acceptedQuantity}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          {it.rejectedQuantity || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                {canManagePurchases && (viewingGrnDetails.totalAcceptedQuantity || 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleOpenReturnDrawerFromGrn(viewingGrnDetails);
                      setViewingGrnId(null);
                    }}
                    className="border-rose-800 text-rose-400 hover:bg-rose-950/40"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Return Goods to Supplier
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewingGrnId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER: CREATE SUPPLIER RETURN (D9.1) */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isReturnDrawerOpen}
        onClose={() => {
          if (!createReturnMutation.isPending) {
            setIsReturnDrawerOpen(false);
          }
        }}
        title="Record Supplier Return"
        description="Return delivered stock to supplier, decrement inventory balances, and maintain traceable return movements."
        size="lg"
      >
        <form onSubmit={handleSubmitReturn} className="space-y-6">
          {/* Header Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Supplier / Vendor *
              </label>
              <select
                value={returnFormData.vendorId}
                onChange={(e) => setReturnFormData((prev) => ({ ...prev, vendorId: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                required
              >
                <option value="">Select Vendor</option>
                {activeVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Return Date *
              </label>
              <input
                type="date"
                value={returnFormData.returnDate}
                onChange={(e) => setReturnFormData((prev) => ({ ...prev, returnDate: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Source Document Reference
              </label>
              <input
                type="text"
                placeholder="e.g. GRN-000001 or PO-000001"
                value={returnFormData.notes.includes('GRN') ? returnFormData.notes : returnFormData.sourceReferenceId}
                disabled={Boolean(returnFormData.sourceReferenceId)}
                onChange={(e) => setReturnFormData((prev) => ({ ...prev, sourceReferenceId: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Idempotency Key
              </label>
              <input
                type="text"
                readOnly
                value={returnFormData.idempotencyKey}
                className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 select-all"
                title="Preserved unique key to prevent accidental duplicate returns"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Reason for Return * (minimum 5 characters)
            </label>
            <input
              type="text"
              placeholder="e.g. Received past expiry, damaged packaging, incorrect specification..."
              value={returnFormData.reason}
              onChange={(e) => setReturnFormData((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-400" />
                Return Line Items ({returnFormData.items.length})
              </h4>
            </div>

            <div className="space-y-3">
              {returnFormData.items.map((line, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 text-sm block">{line.productName}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {line.productCode ? `[${line.productCode}] ` : ''}{line.productCategory} • Unit: {line.productUnit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {line.isBatchTracked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                          Batch Tracked
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        Eligible: {line.eligibleQuantity} {line.productUnit}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Return Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={line.eligibleQuantity}
                        value={line.returnQuantity}
                        onChange={(e) => handleUpdateReturnLine(idx, 'returnQuantity', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    {line.isBatchTracked ? (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-cyan-400 mb-1">
                            Batch Number *
                          </label>
                          <input
                            type="text"
                            placeholder="Batch #"
                            value={line.batchNumber || ''}
                            onChange={(e) => handleUpdateReturnLine(idx, 'batchNumber', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-cyan-400 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={line.expiryDate || ''}
                            onChange={(e) => handleUpdateReturnLine(idx, 'expiryDate', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                          Item Remarks / Discrepancy Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Seal broken on 2 units..."
                          value={line.reason}
                          onChange={(e) => handleUpdateReturnLine(idx, 'reason', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Impact Alert */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Immediate Stock Deduction Warning</p>
              <p className="mt-0.5">
                Posting this return immediately decrements inventory stock and the selected batch. Returns cannot exceed the eligible accepted receipt balance.
              </p>
            </div>
          </div>

          {/* Validation Error Banner */}
          {returnFormError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{returnFormError}</span>
            </div>
          )}

          {/* Drawer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReturnDrawerOpen(false)}
              disabled={createReturnMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={createReturnMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {createReturnMutation.isPending ? 'Processing Return...' : 'Post Supplier Return'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ========================================================================= */}
      {/* DRAWER: SUPPLIER RETURN DETAILS VIEW (D9.1) */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(viewingReturnId)}
        onClose={() => setViewingReturnId(null)}
        title={viewingReturnDetails ? `Supplier Return ${viewingReturnDetails.returnNumber}` : 'Return Details'}
        description="Audit record of goods returned to supplier and ledger decrements."
        size="lg"
      >
        {isViewingReturnLoading ? (
          <div className="p-8">
            <LoadingState message="Loading supplier return record..." />
          </div>
        ) : !viewingReturnDetails ? (
          <div className="p-6">
            <ErrorState title="Not Found" message="Return details could not be loaded." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-rose-400">
                  {viewingReturnDetails.returnNumber}
                </span>
                <Badge variant="danger" className="text-xs">
                  {viewingReturnDetails.status || 'COMPLETED'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">Vendor / Supplier</span>
                  <span className="font-bold text-slate-200">
                    {viewingReturnDetails.vendor?.name || 'Vendor'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Return Date</span>
                  <span className="font-mono text-slate-200">
                    {viewingReturnDetails.returnDate ? viewingReturnDetails.returnDate.split('T')[0] : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Source Reference</span>
                  <span className="font-mono text-slate-200">
                    {viewingReturnDetails.sourceReference || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Returned By</span>
                  <span className="text-slate-200 font-medium">
                    {viewingReturnDetails.returnedByName || 'Staff'}
                  </span>
                </div>
              </div>

              {viewingReturnDetails.reason && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 block font-bold mb-0.5">Return Reason:</span>
                  <span className="text-slate-200">{viewingReturnDetails.reason}</span>
                </div>
              )}
            </div>

            {/* Total Quantity Metric */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 text-center">
              <span className="text-[10px] font-bold uppercase text-rose-400 block">Total Quantity Deducted</span>
              <span className="text-xl font-mono font-bold text-rose-400">
                -{viewingReturnDetails.totalQuantity || 0}
              </span>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-400" />
                Returned Line Items ({viewingReturnDetails.items?.length || 0})
              </h4>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Batch & Expiry</th>
                      <th className="py-2.5 px-3 text-right">Quantity Returned</th>
                      <th className="py-2.5 px-3">Item Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {(viewingReturnDetails.items || []).map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-900/60">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-100 block">{it.product?.name || 'Product'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {it.product?.code ? `[${it.product.code}] ` : ''}{it.product?.category}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {it.batchNumber ? (
                            <div>
                              <span className="font-mono text-cyan-400 font-bold block">{it.batchNumber}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Exp: {it.expiryDate ? it.expiryDate.split('T')[0] : 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Non-batched</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          -{it.returnQuantity}
                        </td>

                        <td className="py-2.5 px-3 text-slate-400 text-xs">
                          {it.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewingReturnId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
