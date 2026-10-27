import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    AlertCircle,
    Plus,
    Eye,
    Edit,
    Send,
    Ban,
    CheckCircle2,
    XCircle,
    Clock,
    Boxes,
    Truck,
    Trash2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    Info,
    History,
    FileCheck2,
    RotateCcw
} from 'lucide-react';
import { inventoryService } from '../inventory.service';
import type {
    InventoryPurchase,
    PurchaseOrder,
    PurchaseOrderStatus,
    Vendor,
    InventoryProduct,
    GoodsReceiptNote,
    SupplierReturn
} from '../inventory.types';
import {
    validatePurchaseOrderForm,
    buildCreatePOPayload,
    buildUpdatePOPayload,
    getAvailablePOActions,
    type FormLineItem,
    type PurchaseOrderFormState
} from '../purchaseOrderUtils';
import {
    validateReceiveGoodsForm,
    buildCreateGRNPayload,
    generateIdempotencyKey,
    type GRNLineItemFormState,
    type ReceiveGoodsFormState
} from '../grnUtils';
import {
    validateSupplierReturnForm,
    buildCreateSupplierReturnPayload,
    generateReturnIdempotencyKey,
    type CreateSupplierReturnFormState,
    type ReturnLineItemFormState
} from '../supplierReturnUtils';
import { useActiveUnit } from '../../../context/useActiveUnit';
import { useInventoryDomain } from '../../../context/useInventoryDomain';

export function PurchasesProcurementTab() {
    const { activeUnitId, activeUnitName } = useActiveUnit();
    const { activeDomain, domainConfig } = useInventoryDomain();

    // View mode: Modern Purchase Orders, Goods Receipt Notes (GRN), Supplier Returns, or Legacy Receipts
    const [viewMode, setViewMode] = useState<'orders' | 'grn' | 'returns' | 'legacy'>('orders');

    // Purchase Orders State
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [vendorFilter, setVendorFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    // Master options
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<InventoryProduct[]>([]);

    // Notifications & Errors
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
    const [orderingPO, setOrderingPO] = useState<PurchaseOrder | null>(null);
    const [cancellingPO, setCancellingPO] = useState<PurchaseOrder | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);

    // GRN Receiving State & Modal
    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
    const [grnFormData, setGrnFormData] = useState<ReceiveGoodsFormState | null>(null);
    const [grnErrors, setGrnErrors] = useState<Record<string, string>>({});
    const [grnSubmitting, setGrnSubmitting] = useState(false);

    // GRN List Tab State
    const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>([]);
    const [grnPagination, setGrnPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [grnPage, setGrnPage] = useState(1);
    const [grnSearch, setGrnSearch] = useState('');
    const [isLoadingGrns, setIsLoadingGrns] = useState(false);
    const [viewingGRN, setViewingGRN] = useState<GoodsReceiptNote | null>(null);

    // Supplier Returns Tab State
    const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
    const [returnsPagination, setReturnsPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [returnsPage, setReturnsPage] = useState(1);
    const [returnsSearch, setReturnsSearch] = useState('');
    const [returnsVendorFilter, setReturnsVendorFilter] = useState('ALL');
    const [isLoadingReturns, setIsLoadingReturns] = useState(false);
    const [viewingReturn, setViewingReturn] = useState<SupplierReturn | null>(null);

    // Supplier Return Creation Modal State
    const [isCreateReturnModalOpen, setIsCreateReturnModalOpen] = useState(false);
    const [returnForm, setReturnForm] = useState<CreateSupplierReturnFormState | null>(null);
    const [returnFormErrors, setReturnFormErrors] = useState<Record<string, string>>({});
    const [returnSubmitting, setReturnSubmitting] = useState(false);
    const [vendorEligibleGrns, setVendorEligibleGrns] = useState<GoodsReceiptNote[]>([]);
    const [isLoadingVendorGrns, setIsLoadingVendorGrns] = useState(false);

    // PO Form State (shared for Create and Edit)
    const [formData, setFormData] = useState<PurchaseOrderFormState>({
        vendorId: '',
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: '',
        notes: '',
        items: [{ productId: '', orderedQuantity: 1, notes: '' }]
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Legacy Purchases State
    const [legacyPurchases, setLegacyPurchases] = useState<InventoryPurchase[]>([]);
    const [legacySearch, setLegacySearch] = useState('');
    const [isLoadingLegacy, setIsLoadingLegacy] = useState(false);

    // Load Master Vendors and Products
    const loadMasters = useCallback(async () => {
        try {
            const [vendorData, productData] = await Promise.all([
                inventoryService.getVendors(activeUnitId).catch(() => []),
                inventoryService.getProducts({
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain
                }).catch(() => [])
            ]);
            setVendors(vendorData.filter(v => v.status !== false));
            setProducts(productData.filter(p => p.status !== false));
        } catch (err: unknown) {
            console.error('Failed to load procurement master data:', err);
        }
    }, [activeUnitId, activeDomain]);

    // Load Purchase Orders
    const fetchPurchaseOrders = useCallback(async () => {
        try {
            const res = await inventoryService.getPurchaseOrders({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain,
                status: statusFilter !== 'ALL' ? (statusFilter as PurchaseOrderStatus) : undefined,
                vendorId: vendorFilter !== 'ALL' ? vendorFilter : undefined,
                search: search.trim() || undefined,
                page,
                limit
            });
            setPurchaseOrders(res.data);
            setPagination(res.pagination);
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load purchase orders:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load purchase orders';
            setError(msg);
        } finally {
            setIsLoadingOrders(false);
        }
    }, [activeUnitId, activeDomain, statusFilter, vendorFilter, search, page, limit]);

    // Load Goods Receipt Notes
    const fetchGoodsReceipts = useCallback(async () => {
        setIsLoadingGrns(true);
        try {
            const res = await inventoryService.getGoodsReceipts({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain,
                search: grnSearch.trim() || undefined,
                page: grnPage,
                limit: 10
            });
            setGoodsReceipts(res.goodsReceipts);
            setGrnPagination({
                total: res.total,
                page: res.page,
                limit: res.limit,
                totalPages: res.totalPages
            });
            setError(null);
        } catch (err: unknown) {
            console.error('Failed to load goods receipts:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load goods receipts';
            setError(msg);
        } finally {
            setIsLoadingGrns(false);
        }
    }, [activeUnitId, activeDomain, grnSearch, grnPage]);

    // Load Supplier Returns
    const fetchSupplierReturns = useCallback(async () => {
        setIsLoadingReturns(true);
        try {
            const res = await inventoryService.getSupplierReturns({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                vendorId: returnsVendorFilter !== 'ALL' ? returnsVendorFilter : undefined,
                query: returnsSearch.trim() || undefined,
                page: returnsPage,
                limit: 10,
                domain: activeDomain
            });
            setSupplierReturns(res.data);
            setReturnsPagination(res.pagination);
        } catch (err: unknown) {
            console.error('Failed to load supplier returns:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to load supplier returns';
            setError(msg);
        } finally {
            setIsLoadingReturns(false);
        }
    }, [activeUnitId, activeDomain, returnsVendorFilter, returnsSearch, returnsPage]);

    // Load Legacy Purchases
    const fetchLegacyPurchases = useCallback(async () => {
        setIsLoadingLegacy(true);
        try {
            const data = await inventoryService.getPurchases({
                unitId: activeUnitId,
                allUnits: activeUnitId === null,
                domain: activeDomain
            });
            setLegacyPurchases(data);
        } catch (err: unknown) {
            console.error('Failed to load legacy purchases:', err);
        } finally {
            setIsLoadingLegacy(false);
        }
    }, [activeUnitId, activeDomain]);

    // Lifecycle
    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            await loadMasters();
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [loadMasters]);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!isMounted) return;
            if (viewMode === 'orders') {
                await fetchPurchaseOrders();
            } else if (viewMode === 'grn') {
                await fetchGoodsReceipts();
            } else if (viewMode === 'returns') {
                await fetchSupplierReturns();
            } else {
                await fetchLegacyPurchases();
            }
        };
        void run();
        return () => {
            isMounted = false;
        };
    }, [viewMode, fetchPurchaseOrders, fetchGoodsReceipts, fetchSupplierReturns, fetchLegacyPurchases]);

    // Status Badge Component
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <span className="inv-badge inv-badge--warning"><Clock size={12} /> Draft</span>;
            case 'ORDERED':
                return <span className="inv-badge inv-badge--info"><Send size={12} /> Ordered</span>;
            case 'PARTIALLY_RECEIVED':
                return <span className="inv-badge inv-badge--warning"><Boxes size={12} /> Partially Received</span>;
            case 'COMPLETED':
                return <span className="inv-badge inv-badge--success"><CheckCircle2 size={12} /> Completed</span>;
            case 'CANCELLED':
                return <span className="inv-badge inv-badge--danger"><XCircle size={12} /> Cancelled</span>;
            default:
                return <span className="inv-badge">{status}</span>;
        }
    };

    // Metrics for POs
    const metrics = useMemo(() => {
        const total = pagination.total || purchaseOrders.length;
        const drafts = purchaseOrders.filter(p => p.status === 'DRAFT').length;
        const inTransit = purchaseOrders.filter(p => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED').length;
        const completed = purchaseOrders.filter(p => p.status === 'COMPLETED').length;
        return { total, drafts, inTransit, completed };
    }, [purchaseOrders, pagination.total]);

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setFormData({
            vendorId: vendors[0]?.id || '',
            orderDate: new Date().toISOString().slice(0, 10),
            expectedDeliveryDate: '',
            notes: '',
            items: [{ productId: products[0]?.id || '', orderedQuantity: 1, notes: '' }]
        });
        setFormErrors({});
        setIsCreateModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (po: PurchaseOrder) => {
        setEditingPO(po);
        setFormData({
            vendorId: po.vendorId,
            orderDate: po.orderDate ? new Date(po.orderDate).toISOString().slice(0, 10) : '',
            expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().slice(0, 10) : '',
            notes: po.notes || '',
            items: (po.items && po.items.length > 0)
                ? po.items.map(it => ({
                    productId: it.productId,
                    orderedQuantity: it.orderedQuantity,
                    notes: it.notes || ''
                }))
                : [{ productId: products[0]?.id || '', orderedQuantity: 1, notes: '' }]
        });
        setFormErrors({});
    };

    // Open Receive Modal (GRN Intake)
    const handleOpenReceiveModal = (po: PurchaseOrder) => {
        // Map line items and calculate remaining quantities
        const grnItems: GRNLineItemFormState[] = (po.items || []).map(it => {
            const prod = products.find(p => p.id === it.productId) || (it.product as InventoryProduct);
            const ordered = Number(it.orderedQuantity || 0);
            const prev = Number(it.receivedQuantity || 0);
            const remaining = Math.max(0, ordered - prev);

            return {
                purchaseOrderItemId: it.id,
                productId: it.productId,
                productName: prod?.name || it.product?.name || 'Product',
                productCode: prod?.code || prod?.sku || it.product?.code || null,
                category: prod?.category || it.product?.category || null,
                unitOfMeasure: prod?.unit || prod?.unitOfMeasure || it.product?.unit || 'units',
                isBatchTracked: Boolean(prod?.isBatchTracked),
                orderedQuantity: ordered,
                previouslyReceivedQuantity: prev,
                remainingQuantity: remaining,
                receivedQuantity: remaining,
                acceptedQuantity: remaining,
                rejectedQuantity: 0,
                batchNumber: '',
                expiryDate: '',
                notes: '',
                selected: remaining > 0
            };
        });

        const newIdempotencyKey = generateIdempotencyKey();

        setGrnFormData({
            purchaseOrderId: po.id,
            orderNumber: po.orderNumber,
            vendorId: po.vendorId,
            receivedDate: new Date().toISOString().slice(0, 10),
            deliveryChallanNo: '',
            supplierInvoiceNo: '',
            notes: '',
            idempotencyKey: newIdempotencyKey,
            items: grnItems
        });

        setGrnErrors({});
        setReceivingPO(po);
    };

    // GRN Line Item Change Handlers
    const handleGRNLineItemToggle = (index: number) => {
        if (!grnFormData) return;
        setGrnFormData(prev => {
            if (!prev) return null;
            const updated = [...prev.items];
            updated[index] = { ...updated[index], selected: !updated[index].selected };
            return { ...prev, items: updated };
        });
    };

    const handleGRNLineItemChange = (index: number, field: keyof GRNLineItemFormState, value: string | number | boolean) => {
        if (!grnFormData) return;
        setGrnFormData(prev => {
            if (!prev) return null;
            const updated = [...prev.items];
            const currentItem = { ...updated[index], [field]: value };

            // Auto-balance accepted vs rejected when received changes
            if (field === 'receivedQuantity') {
                const recv = Math.max(0, Number(value));
                currentItem.acceptedQuantity = recv;
                currentItem.rejectedQuantity = 0;
            } else if (field === 'acceptedQuantity') {
                const acc = Math.max(0, Number(value));
                currentItem.rejectedQuantity = Math.max(0, currentItem.receivedQuantity - acc);
            }

            updated[index] = currentItem;
            return { ...prev, items: updated };
        });
    };

    // Line Item Actions for PO Create/Edit
    const handleAddLineItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', orderedQuantity: 1, notes: '' }]
        }));
    };

    const handleRemoveLineItem = (index: number) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleLineItemChange = (index: number, field: keyof FormLineItem, value: string | number) => {
        setFormData(prev => {
            const updated = [...prev.items];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, items: updated };
        });
    };

    // Submit Create PO
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validatePurchaseOrderForm(formData);
        if (!validation.isValid) {
            setFormErrors(validation.errors);
            return;
        }

        setFormSubmitting(true);
        setFormErrors({});
        try {
            const payload = buildCreatePOPayload(formData);
            const created = await inventoryService.createPurchaseOrder(payload, activeUnitId, activeDomain);
            setIsCreateModalOpen(false);
            setSuccessMessage(`Purchase Order ${created.orderNumber || ''} created successfully in DRAFT status.`);
            setTimeout(() => setSuccessMessage(null), 5000);
            void fetchPurchaseOrders();
        } catch (err: unknown) {
            console.error('Failed to create purchase order:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to create purchase order.';
            setFormErrors({ submit: msg });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Submit Edit PO
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPO) return;
        const validation = validatePurchaseOrderForm(formData);
        if (!validation.isValid) {
            setFormErrors(validation.errors);
            return;
        }

        setFormSubmitting(true);
        setFormErrors({});
        try {
            const payload = buildUpdatePOPayload(formData);
            const updated = await inventoryService.updatePurchaseOrder(editingPO.id, payload, activeUnitId);
            setEditingPO(null);
            setSuccessMessage(`Purchase Order ${updated.orderNumber || editingPO.orderNumber} updated successfully.`);
            setTimeout(() => setSuccessMessage(null), 5000);
            void fetchPurchaseOrders();
        } catch (err: unknown) {
            console.error('Failed to update purchase order:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to update purchase order.';
            setFormErrors({ submit: msg });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Submit Order (Transition DRAFT -> ORDERED)
    const handleConfirmOrder = async () => {
        if (!orderingPO) return;
        setActionSubmitting(true);
        try {
            const result = await inventoryService.orderPurchaseOrder(orderingPO.id, activeUnitId);
            setOrderingPO(null);
            setSuccessMessage(`Purchase Order ${result.orderNumber || orderingPO.orderNumber} successfully marked as ORDERED.`);
            setTimeout(() => setSuccessMessage(null), 5000);
            void fetchPurchaseOrders();
        } catch (err: unknown) {
            console.error('Failed to order purchase order:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to submit purchase order.';
            setError(msg);
            setOrderingPO(null);
        } finally {
            setActionSubmitting(false);
        }
    };

    // Submit Cancel
    const handleConfirmCancel = async () => {
        if (!cancellingPO) return;
        if (!cancelReason.trim()) {
            setError('A valid cancellation reason is required.');
            return;
        }

        setActionSubmitting(true);
        try {
            const result = await inventoryService.cancelPurchaseOrder(cancellingPO.id, { reason: cancelReason.trim() }, activeUnitId);
            setCancellingPO(null);
            setCancelReason('');
            setSuccessMessage(`Purchase Order ${result.orderNumber || cancellingPO.orderNumber} has been CANCELLED.`);
            setTimeout(() => setSuccessMessage(null), 5000);
            void fetchPurchaseOrders();
        } catch (err: unknown) {
            console.error('Failed to cancel purchase order:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to cancel purchase order.';
            setError(msg);
            setCancellingPO(null);
        } finally {
            setActionSubmitting(false);
        }
    };

    // Submit GRN Receiving Intake
    const handleReceiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grnFormData || !receivingPO) return;

        const validation = validateReceiveGoodsForm(grnFormData);
        if (!validation.isValid) {
            setGrnErrors(validation.errors);
            return;
        }

        setGrnSubmitting(true);
        setGrnErrors({});
        try {
            const payload = buildCreateGRNPayload(grnFormData);
            const createdGRN = await inventoryService.createGoodsReceipt(
                receivingPO.id,
                payload,
                activeUnitId,
                activeDomain
            );

            setReceivingPO(null);
            setGrnFormData(null);
            setSuccessMessage(`Goods Receipt Note ${createdGRN.grnNumber} created successfully. Stock balances and ledger updated.`);
            setTimeout(() => setSuccessMessage(null), 6000);

            // Refresh PO list to reflect new PO status (PARTIALLY_RECEIVED or COMPLETED) and updated quantities
            void fetchPurchaseOrders();
            if (viewMode === 'grn') {
                void fetchGoodsReceipts();
            }
        } catch (err: unknown) {
            console.error('Failed to create goods receipt:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to post Goods Receipt Note.';
            setGrnErrors({ submit: msg });
        } finally {
            setGrnSubmitting(false);
        }
    };

    // Supplier Return Metric Calculations
    const returnMetrics = useMemo(() => {
        const total = returnsPagination.total || supplierReturns.length;
        const totalUnits = supplierReturns.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
        const uniqueVendors = new Set(supplierReturns.map(r => r.vendorId)).size;
        return { total, totalUnits, uniqueVendors };
    }, [supplierReturns, returnsPagination.total]);

    // Supplier Return Modal & Form Handlers
    const handleOpenCreateReturnModal = () => {
        const newKey = generateReturnIdempotencyKey();
        setReturnForm({
            vendorId: '',
            sourceType: 'GRN',
            sourceReferenceId: '',
            sourceReferenceNumber: '',
            returnDate: new Date().toISOString().slice(0, 10),
            reason: '',
            notes: '',
            idempotencyKey: newKey,
            items: []
        });
        setVendorEligibleGrns([]);
        setReturnFormErrors({});
        setIsCreateReturnModalOpen(true);
    };

    const handleReturnVendorChange = async (newVendorId: string) => {
        if (!returnForm) return;
        setReturnForm(prev => prev ? {
            ...prev,
            vendorId: newVendorId,
            sourceReferenceId: '',
            sourceReferenceNumber: '',
            items: []
        } : null);

        if (!newVendorId) {
            setVendorEligibleGrns([]);
            return;
        }

        if (returnForm.sourceType === 'GRN') {
            setIsLoadingVendorGrns(true);
            try {
                const res = await inventoryService.getGoodsReceipts({
                    vendorId: newVendorId,
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain,
                    limit: 50
                });
                setVendorEligibleGrns(res.goodsReceipts || []);
            } catch (err: unknown) {
                console.error('Failed to load vendor GRNs:', err);
            } finally {
                setIsLoadingVendorGrns(false);
            }
        }
    };

    const handleReturnSourceTypeChange = async (newSourceType: 'GRN' | 'PURCHASE' | 'DIRECT') => {
        if (!returnForm) return;
        setReturnForm(prev => prev ? {
            ...prev,
            sourceType: newSourceType,
            sourceReferenceId: '',
            sourceReferenceNumber: '',
            items: []
        } : null);

        if (newSourceType === 'GRN' && returnForm.vendorId) {
            setIsLoadingVendorGrns(true);
            try {
                const res = await inventoryService.getGoodsReceipts({
                    vendorId: returnForm.vendorId,
                    unitId: activeUnitId,
                    allUnits: activeUnitId === null,
                    domain: activeDomain,
                    limit: 50
                });
                setVendorEligibleGrns(res.goodsReceipts || []);
            } catch (err: unknown) {
                console.error('Failed to load vendor GRNs:', err);
            } finally {
                setIsLoadingVendorGrns(false);
            }
        }
    };

    const handleSelectGRNForReturn = async (grnId: string) => {
        if (!returnForm) return;
        const grn = vendorEligibleGrns.find(g => g.id === grnId);
        if (!grn) {
            setReturnForm(prev => prev ? { ...prev, sourceReferenceId: '', sourceReferenceNumber: '', items: [] } : null);
            return;
        }

        let stockList: { productId: string; quantity: number }[] = [];
        try {
            stockList = await inventoryService.getStock({
                unitId: activeUnitId,
                domain: activeDomain
            });
        } catch (err: unknown) {
            console.error('Failed to load live stock balances:', err);
        }
        const stockMap = new Map<string, number>();
        for (const s of stockList) {
            stockMap.set(s.productId, Number(s.quantity || 0));
        }

        const returnItems: ReturnLineItemFormState[] = (grn.items || []).map(it => {
            const prodMaster = products.find(p => p.id === it.productId);
            const accepted = Math.max(0, Number(it.receivedQuantity || 0) - Number(it.rejectedQuantity || 0));
            const available = stockMap.get(it.productId) ?? 0;
            const returnable = accepted;

            return {
                productId: it.productId,
                productName: it.product?.name || prodMaster?.name || it.productId,
                productCode: it.product?.code || prodMaster?.code || null,
                category: it.product?.category || prodMaster?.category || null,
                unitOfMeasure: it.product?.unit || prodMaster?.unit || 'Nos',
                isBatchTracked: Boolean(prodMaster?.isBatchTracked ?? (it.batchId || it.batchNumber)),
                batchId: it.batchId || null,
                batchNumber: it.batchNumber || it.batch?.batchNumber || null,
                expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString().slice(0, 10) : (it.batch?.expiryDate ? new Date(it.batch.expiryDate).toISOString().slice(0, 10) : null),
                availableStock: available,
                returnableBalance: returnable,
                returnQuantity: Math.min(available, returnable > 0 ? 1 : 0),
                reason: '',
                goodsReceiptItemId: it.id,
                selected: returnable > 0 && available > 0
            };
        });

        setReturnForm(prev => prev ? {
            ...prev,
            sourceReferenceId: grn.id,
            sourceReferenceNumber: grn.grnNumber,
            items: returnItems
        } : null);
    };

    const handleReturnLineItemToggle = (index: number) => {
        if (!returnForm) return;
        setReturnForm(prev => {
            if (!prev) return null;
            const updated = [...prev.items];
            updated[index] = { ...updated[index], selected: !updated[index].selected };
            return { ...prev, items: updated };
        });
    };

    const handleReturnItemChange = (index: number, field: keyof ReturnLineItemFormState, value: string | number | boolean | null) => {
        if (!returnForm) return;
        setReturnForm(prev => {
            if (!prev) return null;
            const updated = [...prev.items];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, items: updated };
        });
    };

    const handleAddDirectReturnItem = () => {
        if (!returnForm) return;
        const defaultProd = products[0];
        if (!defaultProd) return;
        const newItem: ReturnLineItemFormState = {
            productId: defaultProd.id,
            productName: defaultProd.name,
            productCode: defaultProd.code || null,
            category: defaultProd.category || null,
            unitOfMeasure: defaultProd.unit || 'Nos',
            isBatchTracked: Boolean(defaultProd.isBatchTracked),
            batchId: null,
            batchNumber: '',
            expiryDate: '',
            availableStock: 9999,
            returnableBalance: null,
            returnQuantity: 1,
            reason: '',
            goodsReceiptItemId: null,
            selected: true
        };
        setReturnForm(prev => prev ? { ...prev, items: [...prev.items, newItem] } : null);
    };

    const handleRemoveDirectReturnItem = (index: number) => {
        if (!returnForm) return;
        setReturnForm(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : null);
    };

    const handleSubmitSupplierReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnForm) return;

        const valResult = validateSupplierReturnForm(returnForm);
        if (!valResult.isValid) {
            setReturnFormErrors(valResult.errors);
            return;
        }

        setReturnSubmitting(true);
        setReturnFormErrors({});

        try {
            const payload = buildCreateSupplierReturnPayload(returnForm);
            const created = await inventoryService.createSupplierReturn(
                payload,
                activeUnitId,
                activeDomain
            );

            setIsCreateReturnModalOpen(false);
            setReturnForm(null);
            setSuccessMessage(`Supplier Return ${created.returnNumber} processed successfully. Stock deducted and movement ledger recorded.`);
            setTimeout(() => setSuccessMessage(null), 6000);

            void fetchSupplierReturns();
            if (viewMode === 'orders') void fetchPurchaseOrders();
            if (viewMode === 'grn') void fetchGoodsReceipts();
        } catch (err: unknown) {
            console.error('Failed to submit supplier return:', err);
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to process supplier return.';
            setReturnFormErrors({ submit: msg });
        } finally {
            setReturnSubmitting(false);
        }
    };

    // Filtered legacy records
    const filteredLegacy = useMemo(() => {
        const q = legacySearch.trim().toLowerCase();
        if (!q) return legacyPurchases;
        return legacyPurchases.filter(p => {
            const prod = p.product?.name || '';
            const ven = p.vendorName || p.vendor || '';
            const bat = p.batchNumber || '';
            return prod.toLowerCase().includes(q) || ven.toLowerCase().includes(q) || bat.toLowerCase().includes(q);
        });
    }, [legacyPurchases, legacySearch]);

    return (
        <div className="inventory-tab-content">
            {/* View Mode Pill Switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                    type="button"
                    className={`inv-btn ${viewMode === 'orders' ? 'inv-btn--primary' : 'inv-btn--secondary'}`}
                    onClick={() => setViewMode('orders')}
                >
                    <ShoppingCart size={15} />
                    <span>Purchase Orders (Multi-Item)</span>
                </button>
                <button
                    type="button"
                    className={`inv-btn ${viewMode === 'grn' ? 'inv-btn--primary' : 'inv-btn--secondary'}`}
                    onClick={() => setViewMode('grn')}
                >
                    <Truck size={15} />
                    <span>Goods Receipts (GRN)</span>
                </button>
                <button
                    type="button"
                    className={`inv-btn ${viewMode === 'returns' ? 'inv-btn--primary' : 'inv-btn--secondary'}`}
                    onClick={() => setViewMode('returns')}
                >
                    <RotateCcw size={15} />
                    <span>Supplier Returns</span>
                </button>
                <button
                    type="button"
                    className={`inv-btn ${viewMode === 'legacy' ? 'inv-btn--primary' : 'inv-btn--secondary'}`}
                    onClick={() => setViewMode('legacy')}
                >
                    <History size={15} />
                    <span>Legacy Telemetry</span>
                </button>
            </div>

            {/* Notification Banners */}
            {successMessage && (
                <div className="inv-alert inv-alert--success" style={{ marginBottom: 16 }}>
                    <CheckCircle2 size={16} />
                    <span style={{ flex: 1 }}>{successMessage}</span>
                    <button type="button" onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {error && (
                <div className="inv-alert inv-alert--danger" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ========================================================
                VIEW MODE 1: MODERN MULTI-ITEM PURCHASE ORDERS
               ======================================================== */}
            {viewMode === 'orders' && (
                <>
                    {/* Toolbar */}
                    <div className="overview-toolbar">
                        <div>
                            <span className="section-kicker">{domainConfig.label.toUpperCase()} · PROCUREMENT & REPLENISHMENT</span>
                            <h2>Purchase Orders Workspace</h2>
                        </div>
                        <div className="toolbar-actions">
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={handleOpenCreateModal}
                            >
                                <Plus size={15} />
                                <span>New Purchase Order</span>
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => void fetchPurchaseOrders()}
                                disabled={isLoadingOrders}
                                title="Reload Purchase Orders"
                            >
                                <RefreshCw size={14} className={isLoadingOrders ? 'spin-animation' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* KPI Stat Cards */}
                    <div className="stat-cards-grid" style={{ marginBottom: 16 }}>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--primary">
                                <ShoppingCart size={20} />
                            </div>
                            <span className="stat-card__label">Total Orders</span>
                            <strong className="stat-card__value">{metrics.total}</strong>
                            <span className="stat-card__note">Recorded in {activeUnitName}</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--warning">
                                <Clock size={20} />
                            </div>
                            <span className="stat-card__label">Drafts Pending Order</span>
                            <strong className="stat-card__value">{metrics.drafts}</strong>
                            <span className="stat-card__note">Eligible for edit or order</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--info">
                                <Truck size={20} />
                            </div>
                            <span className="stat-card__label">In-Transit / Awaiting Delivery</span>
                            <strong className="stat-card__value">{metrics.inTransit}</strong>
                            <span className="stat-card__note">Ready for GRN delivery intake</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--success">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="stat-card__label">Completed Orders</span>
                            <strong className="stat-card__value">{metrics.completed}</strong>
                            <span className="stat-card__note">Fully received goods</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="inv-filters-bar" style={{ marginBottom: 16 }}>
                        <div className="inv-search-form" style={{ flex: '1 1 280px' }}>
                            <Search size={15} className="inv-search-icon" />
                            <input
                                type="search"
                                className="inv-search-input"
                                placeholder="Search PO #, vendor, or notes..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="inv-form-field" style={{ minWidth: 170 }}>
                            <select
                                className="inv-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="DRAFT">Draft</option>
                                <option value="ORDERED">Ordered</option>
                                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="inv-form-field" style={{ minWidth: 200 }}>
                            <select
                                className="inv-select"
                                value={vendorFilter}
                                onChange={(e) => {
                                    setVendorFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="ALL">All Suppliers / Vendors</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Purchase Orders Table */}
                    <div className="inv-card">
                        {isLoadingOrders ? (
                            <div className="inv-loading-state">
                                <RefreshCw size={24} className="spin-animation" />
                                <p>Loading purchase orders...</p>
                            </div>
                        ) : purchaseOrders.length === 0 ? (
                            <div className="inv-empty-state">
                                <ShoppingCart size={36} />
                                <h4>No Purchase Orders Found</h4>
                                <p>Create your first multi-item purchase order to replenish inventory.</p>
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--primary"
                                    onClick={handleOpenCreateModal}
                                    style={{ marginTop: 12 }}
                                >
                                    <Plus size={14} />
                                    <span>Create Purchase Order</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="inv-table-responsive">
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '16%' }}>PO Number</th>
                                                <th style={{ width: '22%' }}>Supplier / Vendor</th>
                                                <th style={{ width: '12%', textAlign: 'center' }}>Order Date</th>
                                                <th style={{ width: '14%', textAlign: 'center' }}>Expected Delivery</th>
                                                <th style={{ width: '16%' }}>Line Items</th>
                                                <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                                                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseOrders.map((po) => {
                                                const actions = getAvailablePOActions(po.status);
                                                const totalOrderedUnits = (po.items || []).reduce((acc, it) => acc + (it.orderedQuantity || 0), 0);
                                                const totalReceivedUnits = (po.items || []).reduce((acc, it) => acc + (it.receivedQuantity || 0), 0);
                                                return (
                                                    <tr key={po.id}>
                                                        <td>
                                                            <strong>{po.orderNumber}</strong>
                                                            {po.notes && (
                                                                <span className="inv-subtext" title={po.notes} style={{ display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {po.notes}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <strong>{po.vendor?.name || 'Unknown Supplier'}</strong>
                                                            {po.vendor?.code && (
                                                                <span className="inv-subtext" style={{ display: 'block' }}>Code: {po.vendor.code}</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {new Date(po.orderDate).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {po.expectedDeliveryDate ? (
                                                                new Date(po.expectedDeliveryDate).toLocaleDateString()
                                                            ) : (
                                                                <span className="inv-subtext">—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <strong>{(po.items || []).length}</strong> product lines
                                                            </div>
                                                            <span className="inv-subtext" style={{ display: 'block' }}>
                                                                ({totalReceivedUnits} / {totalOrderedUnits} units received)
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {renderStatusBadge(po.status)}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', gap: 6 }}>
                                                                <button
                                                                    type="button"
                                                                    className="inv-btn inv-btn--secondary inv-btn--sm"
                                                                    onClick={() => setViewingPO(po)}
                                                                    title="View Order Details"
                                                                >
                                                                    <Eye size={13} />
                                                                </button>

                                                                {actions.canEdit && (
                                                                    <button
                                                                        type="button"
                                                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                                                        onClick={() => handleOpenEditModal(po)}
                                                                        title="Edit Draft Order"
                                                                    >
                                                                        <Edit size={13} />
                                                                    </button>
                                                                )}

                                                                {actions.canOrder && (
                                                                    <button
                                                                        type="button"
                                                                        className="inv-btn inv-btn--primary inv-btn--sm"
                                                                        onClick={() => setOrderingPO(po)}
                                                                        title="Approve & Send Order to Supplier"
                                                                    >
                                                                        <Send size={13} />
                                                                        <span>Order</span>
                                                                    </button>
                                                                )}

                                                                {actions.canReceive && (
                                                                    <button
                                                                        type="button"
                                                                        className="inv-btn inv-btn--success inv-btn--sm"
                                                                        onClick={() => handleOpenReceiveModal(po)}
                                                                        title="Receive Delivery & Post Goods Receipt Note (GRN)"
                                                                    >
                                                                        <Truck size={13} />
                                                                        <span>Receive</span>
                                                                    </button>
                                                                )}

                                                                {actions.canCancel && (
                                                                    <button
                                                                        type="button"
                                                                        className="inv-btn inv-btn--danger inv-btn--sm"
                                                                        onClick={() => {
                                                                            setCancellingPO(po);
                                                                            setCancelReason('');
                                                                        }}
                                                                        title="Cancel Purchase Order"
                                                                    >
                                                                        <Ban size={13} />
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

                                {/* Pagination Controls */}
                                {pagination.totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                                        <span className="inv-subtext">
                                            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page <= 1 || isLoadingOrders}
                                            >
                                                <ChevronLeft size={14} />
                                                <span>Previous</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                disabled={page >= pagination.totalPages || isLoadingOrders}
                                            >
                                                <span>Next</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ========================================================
                VIEW MODE 2: GOODS RECEIPT NOTES (GRN) LIST
               ======================================================== */}
            {viewMode === 'grn' && (
                <>
                    <div className="overview-toolbar">
                        <div>
                            <span className="section-kicker">{domainConfig.label.toUpperCase()} · INBOUND GOODS RECEIPT NOTES</span>
                            <h2>Goods Receipts (GRN)</h2>
                        </div>
                        <div className="toolbar-actions">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => void fetchGoodsReceipts()}
                                disabled={isLoadingGrns}
                                title="Reload Goods Receipts"
                            >
                                <RefreshCw size={14} className={isLoadingGrns ? 'spin-animation' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="inv-filters-bar" style={{ marginBottom: 16 }}>
                        <div className="inv-search-form" style={{ flex: '1 1 320px' }}>
                            <Search size={15} className="inv-search-icon" />
                            <input
                                type="search"
                                className="inv-search-input"
                                placeholder="Search GRN #, challan, PO #, or notes..."
                                value={grnSearch}
                                onChange={(e) => {
                                    setGrnSearch(e.target.value);
                                    setGrnPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="inv-card">
                        {isLoadingGrns ? (
                            <div className="inv-loading-state">
                                <RefreshCw size={24} className="spin-animation" />
                                <p>Loading goods receipt notes...</p>
                            </div>
                        ) : goodsReceipts.length === 0 ? (
                            <div className="inv-empty-state">
                                <Truck size={36} />
                                <h4>No Goods Receipt Notes Recorded</h4>
                                <p>When shipments arrive for ordered POs, click "Receive" on the PO to create a verified GRN.</p>
                            </div>
                        ) : (
                            <>
                                <div className="inv-table-responsive">
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>GRN Number</th>
                                                <th>PO Reference</th>
                                                <th>Supplier / Vendor</th>
                                                <th>Received Date</th>
                                                <th>Challan / Invoice</th>
                                                <th>Accepted Units</th>
                                                <th>Received By</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {goodsReceipts.map((grn) => (
                                                <tr key={grn.id}>
                                                    <td>
                                                        <strong>{grn.grnNumber}</strong>
                                                        {grn.idempotencyKey && (
                                                            <span className="inv-subtext">Idemp: {grn.idempotencyKey.slice(0, 8)}...</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <strong>{grn.purchaseOrder?.orderNumber || '—'}</strong>
                                                    </td>
                                                    <td>
                                                        <strong>{grn.vendor?.name || 'Supplier'}</strong>
                                                    </td>
                                                    <td>
                                                        {new Date(grn.receivedDate).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div>{grn.deliveryChallanNo || '—'}</div>
                                                        {grn.supplierInvoiceNo && (
                                                            <span className="inv-subtext">Inv: {grn.supplierInvoiceNo}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: 'var(--success-color, #10b981)' }}>
                                                            +{grn.totalAcceptedQuantity ?? (grn.items || []).reduce((s, it) => s + (it.receivedQuantity - it.rejectedQuantity), 0)}
                                                        </strong> units
                                                        {Number(grn.totalRejectedQuantity || 0) > 0 && (
                                                            <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)', display: 'block' }}>
                                                                ({grn.totalRejectedQuantity} rejected)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span>{grn.receivedByName || 'Authorized Receiver'}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            className="inv-btn inv-btn--secondary inv-btn--sm"
                                                            onClick={() => setViewingGRN(grn)}
                                                            title="View GRN Details"
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {grnPagination.totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                                        <span className="inv-subtext">
                                            Showing page {grnPagination.page} of {grnPagination.totalPages} ({grnPagination.total} GRNs)
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                onClick={() => setGrnPage(p => Math.max(1, p - 1))}
                                                disabled={grnPage <= 1 || isLoadingGrns}
                                            >
                                                <ChevronLeft size={14} />
                                                <span>Previous</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                onClick={() => setGrnPage(p => Math.min(grnPagination.totalPages, p + 1))}
                                                disabled={grnPage >= grnPagination.totalPages || isLoadingGrns}
                                            >
                                                <span>Next</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ========================================================
                VIEW MODE 3: SUPPLIER RETURNS WORKSPACE
               ======================================================== */}
            {viewMode === 'returns' && (
                <>
                    <div className="overview-toolbar">
                        <div>
                            <span className="section-kicker">{domainConfig.label.toUpperCase()} · OUTBOUND INVENTORY REVERSALS</span>
                            <h2>Supplier Returns Workspace</h2>
                        </div>
                        <div className="toolbar-actions">
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={handleOpenCreateReturnModal}
                            >
                                <Plus size={15} />
                                <span>New Supplier Return</span>
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => void fetchSupplierReturns()}
                                disabled={isLoadingReturns}
                                title="Reload Supplier Returns"
                            >
                                <RefreshCw size={14} className={isLoadingReturns ? 'spin-animation' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* KPI Stat Cards */}
                    <div className="stat-cards-grid" style={{ marginBottom: 16 }}>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--primary">
                                <RotateCcw size={20} />
                            </div>
                            <span className="stat-card__label">Total Returns</span>
                            <strong className="stat-card__value">{returnMetrics.total}</strong>
                            <span className="stat-card__note">Processed in {activeUnitName}</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--warning">
                                <Boxes size={20} />
                            </div>
                            <span className="stat-card__label">Returned Units</span>
                            <strong className="stat-card__value" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                -{returnMetrics.totalUnits}
                            </strong>
                            <span className="stat-card__note">Deducted from stock ledger</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--info">
                                <Truck size={20} />
                            </div>
                            <span className="stat-card__label">Vendors Returned To</span>
                            <strong className="stat-card__value">{returnMetrics.uniqueVendors}</strong>
                            <span className="stat-card__note">Unique supplier partners</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="inv-filters-bar" style={{ marginBottom: 16 }}>
                        <div className="inv-search-form" style={{ flex: '1 1 320px' }}>
                            <Search size={15} className="inv-search-icon" />
                            <input
                                type="search"
                                className="inv-search-input"
                                placeholder="Search return #, reason, reference, or notes..."
                                value={returnsSearch}
                                onChange={(e) => {
                                    setReturnsSearch(e.target.value);
                                    setReturnsPage(1);
                                }}
                            />
                        </div>
                        <div className="inv-select-wrapper" style={{ minWidth: 200 }}>
                            <select
                                className="inv-select"
                                value={returnsVendorFilter}
                                onChange={(e) => {
                                    setReturnsVendorFilter(e.target.value);
                                    setReturnsPage(1);
                                }}
                            >
                                <option value="ALL">All Vendors</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="inv-card">
                        {isLoadingReturns ? (
                            <div className="inv-loading-state">
                                <RefreshCw size={24} className="spin-animation" />
                                <p>Loading supplier returns...</p>
                            </div>
                        ) : supplierReturns.length === 0 ? (
                            <div className="inv-empty-state">
                                <RotateCcw size={36} />
                                <h4>No Supplier Returns Found</h4>
                                <p>When goods are reversed back to a vendor due to defects, recall, or damage, create a verified Supplier Return.</p>
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--primary"
                                    style={{ marginTop: 12 }}
                                    onClick={handleOpenCreateReturnModal}
                                >
                                    <Plus size={14} />
                                    <span>Create First Supplier Return</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="inv-table-responsive">
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Return #</th>
                                                <th>Date</th>
                                                <th>Supplier / Vendor</th>
                                                <th>Source</th>
                                                <th>Source Reference</th>
                                                <th>Units Returned</th>
                                                <th>Return Reason</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supplierReturns.map((ret) => (
                                                <tr key={ret.id}>
                                                    <td>
                                                        <strong>{ret.returnNumber}</strong>
                                                        {ret.idempotencyKey && (
                                                            <span className="inv-subtext">Idemp: {ret.idempotencyKey.slice(0, 8)}...</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {new Date(ret.returnDate).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <strong>{ret.vendor?.name || 'Supplier'}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="inv-badge inv-badge--neutral">
                                                            {ret.sourceType || 'GRN'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <code>{ret.sourceReference || '—'}</code>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                            -{ret.totalQuantity} units
                                                        </strong>
                                                        <span className="inv-subtext">{(ret.items || []).length} line items</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ret.reason}>
                                                            {ret.reason}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="inv-badge inv-badge--success">
                                                            <CheckCircle2 size={12} /> {ret.status || 'COMPLETED'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            className="inv-btn inv-btn--secondary inv-btn--sm"
                                                            onClick={() => setViewingReturn(ret)}
                                                            title="View Return Dossier"
                                                        >
                                                            <Eye size={13} />
                                                            <span>View Dossier</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {returnsPagination.totalPages > 1 && (
                                    <div className="inv-pagination" style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="inv-subtext">
                                            Showing page {returnsPagination.page} of {returnsPagination.totalPages} ({returnsPagination.total} total returns)
                                        </span>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                disabled={returnsPage <= 1}
                                                onClick={() => setReturnsPage(p => Math.max(1, p - 1))}
                                            >
                                                <ChevronLeft size={14} />
                                                <span>Previous</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                disabled={returnsPage >= returnsPagination.totalPages}
                                                onClick={() => setReturnsPage(p => p + 1)}
                                            >
                                                <span>Next</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ========================================================
                VIEW MODE 4: LEGACY INBOUND TELEMETRY (PRESERVED)
               ======================================================== */}
            {viewMode === 'legacy' && (
                <>
                    <div className="overview-toolbar">
                        <div>
                            <span className="section-kicker">{domainConfig.label.toUpperCase()} · HISTORICAL TELEMETRY</span>
                            <h2>Legacy Inbound Receipts</h2>
                        </div>
                        <div className="toolbar-actions">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => void fetchLegacyPurchases()}
                                disabled={isLoadingLegacy}
                                title="Reload Legacy Purchases"
                            >
                                <RefreshCw size={14} className={isLoadingLegacy ? 'spin-animation' : ''} />
                            </button>
                        </div>
                    </div>

                    <div className="inv-alert inv-alert--info" style={{ marginBottom: 16 }}>
                        <Info size={16} />
                        <div style={{ flex: 1 }}>
                            <strong>Historical Telemetry Archive:</strong> Below is the historical read-only ledger of legacy single-item purchase receipts from <code>/api/v1/purchase</code>. For modern procurement with multi-item authoring, use the <strong>Purchase Orders</strong> view.
                        </div>
                    </div>

                    <div className="inv-filters-bar" style={{ marginBottom: 16 }}>
                        <div className="inv-search-form" style={{ flex: '1 1 320px' }}>
                            <Search size={15} className="inv-search-icon" />
                            <input
                                type="search"
                                className="inv-search-input"
                                placeholder="Search product, vendor, or batch number..."
                                value={legacySearch}
                                onChange={(e) => setLegacySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="inv-card">
                        {isLoadingLegacy ? (
                            <div className="inv-loading-state">
                                <RefreshCw size={24} className="spin-animation" />
                                <p>Loading historical records...</p>
                            </div>
                        ) : filteredLegacy.length === 0 ? (
                            <div className="inv-empty-state">
                                <ShoppingCart size={32} />
                                <h4>No historical purchase records found</h4>
                            </div>
                        ) : (
                            <div className="inv-table-responsive">
                                <table className="inv-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Supplier / Vendor</th>
                                            <th>Quantity Received</th>
                                            <th>Batch Number</th>
                                            <th>Expiry Date</th>
                                            <th>Receipt Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLegacy.map((p) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <strong>{p.product?.name || p.productId}</strong>
                                                    <span className="inv-subtext">ID: {p.id.slice(0, 8)}...</span>
                                                </td>
                                                <td>
                                                    <strong>{p.vendorName || p.vendor || 'Supplier'}</strong>
                                                </td>
                                                <td>
                                                    <strong>+{p.quantity}</strong> units
                                                </td>
                                                <td>
                                                    <code>{p.batchNumber || '—'}</code>
                                                </td>
                                                <td>
                                                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td>
                                                    <span className="inv-subtext">
                                                        {new Date(p.receivedDate || p.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========================================================
                MODAL 1: CREATE PURCHASE ORDER
               ======================================================== */}
            {isCreateModalOpen && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 720 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">NEW PURCHASE ORDER</span>
                                <h3>Draft Purchase Order</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={formSubmitting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="inv-modal-body">
                            {formErrors.submit && (
                                <div className="inv-alert inv-alert--danger" style={{ marginBottom: 14 }}>
                                    <AlertCircle size={15} />
                                    <span>{formErrors.submit}</span>
                                </div>
                            )}

                            <div className="inv-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                <div className="inv-form-field">
                                    <label htmlFor="po-vendor">Supplier / Vendor *</label>
                                    <select
                                        id="po-vendor"
                                        className="inv-select"
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a Supplier</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                                        ))}
                                    </select>
                                    {formErrors.vendorId && (
                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                            {formErrors.vendorId}
                                        </span>
                                    )}
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="po-expected-date">Expected Delivery Date</label>
                                    <input
                                        id="po-expected-date"
                                        type="date"
                                        className="inv-input"
                                        min={new Date().toISOString().slice(0, 10)}
                                        value={formData.expectedDeliveryDate || ''}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-field" style={{ marginTop: 12 }}>
                                <label htmlFor="po-notes">Order Notes / Instructions</label>
                                <textarea
                                    id="po-notes"
                                    className="inv-textarea"
                                    rows={2}
                                    placeholder="Delivery specifications, quotation reference, or priority instructions..."
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {/* Multi-Item Line Editor */}
                            <div style={{ marginTop: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Order Line Items ({formData.items.length}) *
                                    </label>
                                    <button
                                        type="button"
                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                        onClick={handleAddLineItem}
                                    >
                                        <Plus size={13} />
                                        <span>Add Product Line</span>
                                    </button>
                                </div>

                                {formErrors.items && (
                                    <p className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)', marginBottom: 8 }}>
                                        {formErrors.items}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {formData.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: 'var(--card-bg, #f9fafb)',
                                                border: '1px solid var(--border-color, #e5e7eb)',
                                                borderRadius: 8,
                                                padding: '10px 14px'
                                            }}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr 36px', gap: 10, alignItems: 'center' }}>
                                                <div>
                                                    <select
                                                        className="inv-select"
                                                        value={item.productId}
                                                        onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Product...</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} {p.code ? `(${p.code})` : ''} — {p.category || 'General'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formErrors[`item_${idx}_product`] && (
                                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                            {formErrors[`item_${idx}_product`]}
                                                        </span>
                                                    )}
                                                    {formErrors[`item_${idx}_duplicate`] && (
                                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                            {formErrors[`item_${idx}_duplicate`]}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="inv-input"
                                                        placeholder="Qty"
                                                        value={item.orderedQuantity}
                                                        onChange={(e) => handleLineItemChange(idx, 'orderedQuantity', parseInt(e.target.value) || 1)}
                                                        required
                                                    />
                                                    {formErrors[`item_${idx}_quantity`] && (
                                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                            {formErrors[`item_${idx}_quantity`]}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        type="text"
                                                        className="inv-input"
                                                        placeholder="Line note / package size..."
                                                        value={item.notes || ''}
                                                        onChange={(e) => handleLineItemChange(idx, 'notes', e.target.value)}
                                                    />
                                                </div>

                                                <div style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                                        onClick={() => handleRemoveLineItem(idx)}
                                                        disabled={formData.items.length <= 1}
                                                        title="Remove this line item"
                                                    >
                                                        <Trash2 size={13} style={{ color: formData.items.length > 1 ? 'var(--danger-color, #ef4444)' : '#9ca3af' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="inv-modal-footer" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Creating...' : 'Create Purchase Order (Draft)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: EDIT DRAFT PURCHASE ORDER
               ======================================================== */}
            {editingPO && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 720 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">EDIT PURCHASE ORDER</span>
                                <h3>Edit PO #{editingPO.orderNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingPO(null)}
                                disabled={formSubmitting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="inv-modal-body">
                            {formErrors.submit && (
                                <div className="inv-alert inv-alert--danger" style={{ marginBottom: 14 }}>
                                    <AlertCircle size={15} />
                                    <span>{formErrors.submit}</span>
                                </div>
                            )}

                            <div className="inv-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                <div className="inv-form-field">
                                    <label htmlFor="po-edit-vendor">Supplier / Vendor *</label>
                                    <select
                                        id="po-edit-vendor"
                                        className="inv-select"
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                        required
                                    >
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="po-edit-expected-date">Expected Delivery Date</label>
                                    <input
                                        id="po-edit-expected-date"
                                        type="date"
                                        className="inv-input"
                                        value={formData.expectedDeliveryDate || ''}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-field" style={{ marginTop: 12 }}>
                                <label htmlFor="po-edit-notes">Order Notes / Instructions</label>
                                <textarea
                                    id="po-edit-notes"
                                    className="inv-textarea"
                                    rows={2}
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {/* Line Items */}
                            <div style={{ marginTop: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        Order Line Items ({formData.items.length}) *
                                    </label>
                                    <button
                                        type="button"
                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                        onClick={handleAddLineItem}
                                    >
                                        <Plus size={13} />
                                        <span>Add Product Line</span>
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {formData.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: 'var(--card-bg, #f9fafb)',
                                                border: '1px solid var(--border-color, #e5e7eb)',
                                                borderRadius: 8,
                                                padding: '10px 14px'
                                            }}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr 36px', gap: 10, alignItems: 'center' }}>
                                                <div>
                                                    <select
                                                        className="inv-select"
                                                        value={item.productId}
                                                        onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Product...</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} {p.code ? `(${p.code})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="inv-input"
                                                        value={item.orderedQuantity}
                                                        onChange={(e) => handleLineItemChange(idx, 'orderedQuantity', parseInt(e.target.value) || 1)}
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <input
                                                        type="text"
                                                        className="inv-input"
                                                        placeholder="Line note..."
                                                        value={item.notes || ''}
                                                        onChange={(e) => handleLineItemChange(idx, 'notes', e.target.value)}
                                                    />
                                                </div>

                                                <div style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="inv-btn inv-btn--secondary inv-btn--sm"
                                                        onClick={() => handleRemoveLineItem(idx)}
                                                        disabled={formData.items.length <= 1}
                                                    >
                                                        <Trash2 size={13} style={{ color: formData.items.length > 1 ? 'var(--danger-color, #ef4444)' : '#9ca3af' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="inv-modal-footer" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setEditingPO(null)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--primary"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 3: ORDER CONFIRMATION
               ======================================================== */}
            {orderingPO && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 460 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--primary-color, #2563eb)' }}>SUBMIT ORDER</span>
                                <h3>Order Purchase Order?</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOrderingPO(null)}
                                disabled={actionSubmitting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <p style={{ lineHeight: 1.5, marginBottom: 14 }}>
                                You are about to transition <strong>{orderingPO.orderNumber}</strong> to <strong>ORDERED</strong> status for supplier <strong>{orderingPO.vendor?.name}</strong>.
                            </p>
                            <div style={{ background: 'var(--card-bg, #f3f4f6)', padding: '10px 14px', borderRadius: 6, marginBottom: 14 }}>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                    Line items: <strong>{(orderingPO.items || []).length} products</strong> ({(orderingPO.items || []).reduce((s, i) => s + i.orderedQuantity, 0)} total units)
                                </p>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)' }}>
                                ⚠️ Once ordered, product quantities and suppliers cannot be modified. Goods receipt intake will become eligible upon delivery arrival.
                            </p>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setOrderingPO(null)}
                                disabled={actionSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--primary"
                                onClick={handleConfirmOrder}
                                disabled={actionSubmitting}
                            >
                                {actionSubmitting ? 'Submitting...' : 'Approve & Mark as Ordered'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 4: CANCEL ORDER CONFIRMATION
               ======================================================== */}
            {cancellingPO && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 460 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--danger-color, #ef4444)' }}>ORDER CANCELLATION</span>
                                <h3>Cancel {cancellingPO.orderNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancellingPO(null)}
                                disabled={actionSubmitting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <p style={{ lineHeight: 1.5, marginBottom: 12 }}>
                                Are you sure you want to cancel this purchase order? This action cannot be reversed.
                            </p>
                            <div className="inv-form-field">
                                <label htmlFor="cancel-reason">Cancellation Reason *</label>
                                <textarea
                                    id="cancel-reason"
                                    className="inv-textarea"
                                    rows={3}
                                    placeholder="Explain why this order is being cancelled (e.g., supplier out of stock, budget hold, duplicate order)..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setCancellingPO(null)}
                                disabled={actionSubmitting}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className="inv-btn inv-btn--danger"
                                onClick={handleConfirmCancel}
                                disabled={actionSubmitting || cancelReason.trim().length < 3}
                            >
                                {actionSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 5: RECEIVE GOODS DELIVERY (GRN INTAKE)
               ======================================================== */}
            {receivingPO && grnFormData && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 840 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--success-color, #10b981)' }}>GOODS RECEIPT NOTE (GRN) INTAKE</span>
                                <h3>Receive Delivery for PO #{receivingPO.orderNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setReceivingPO(null);
                                    setGrnFormData(null);
                                }}
                                disabled={grnSubmitting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleReceiveSubmit} className="inv-modal-body">
                            {grnErrors.submit && (
                                <div className="inv-alert inv-alert--danger" style={{ marginBottom: 14 }}>
                                    <AlertCircle size={15} />
                                    <span>{grnErrors.submit}</span>
                                </div>
                            )}

                            {/* Delivery Challan & Receipt Info */}
                            <div className="inv-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                                <div className="inv-form-field">
                                    <label htmlFor="grn-received-date">Receipt Date *</label>
                                    <input
                                        id="grn-received-date"
                                        type="date"
                                        className="inv-input"
                                        value={grnFormData.receivedDate}
                                        onChange={(e) => setGrnFormData({ ...grnFormData, receivedDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="grn-challan-no">Delivery Challan #</label>
                                    <input
                                        id="grn-challan-no"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. DC-9984"
                                        value={grnFormData.deliveryChallanNo || ''}
                                        onChange={(e) => setGrnFormData({ ...grnFormData, deliveryChallanNo: e.target.value })}
                                    />
                                </div>

                                <div className="inv-form-field">
                                    <label htmlFor="grn-invoice-no">Supplier Invoice #</label>
                                    <input
                                        id="grn-invoice-no"
                                        type="text"
                                        className="inv-input"
                                        placeholder="e.g. INV-2026-88"
                                        value={grnFormData.supplierInvoiceNo || ''}
                                        onChange={(e) => setGrnFormData({ ...grnFormData, supplierInvoiceNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="inv-form-field" style={{ marginBottom: 16 }}>
                                <label htmlFor="grn-notes">Receipt Notes / Packaging Inspection</label>
                                <input
                                    id="grn-notes"
                                    type="text"
                                    className="inv-input"
                                    placeholder="Condition of boxes, temperature log, driver name..."
                                    value={grnFormData.notes || ''}
                                    onChange={(e) => setGrnFormData({ ...grnFormData, notes: e.target.value })}
                                />
                            </div>

                            {/* Idempotency Token Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--card-bg, #f3f4f6)', borderRadius: 6, marginBottom: 16 }}>
                                <FileCheck2 size={15} style={{ color: 'var(--primary-color, #2563eb)' }} />
                                <span className="inv-subtext">
                                    Idempotency Token: <code>{grnFormData.idempotencyKey}</code> (Prevents duplicate receipt on network retry)
                                </span>
                            </div>

                            {/* Line Items Intake Grid */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Product Line Intake (Select items to receive in this delivery)</h4>
                                </div>

                                {grnErrors.items && (
                                    <p className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)', marginBottom: 8 }}>
                                        {grnErrors.items}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {grnFormData.items.map((it, idx) => {
                                        const idKey = `item_${idx}`;
                                        return (
                                            <div
                                                key={it.purchaseOrderItemId}
                                                style={{
                                                    background: it.selected ? '#fff' : 'var(--card-bg, #f9fafb)',
                                                    border: it.selected ? '1px solid var(--primary-color, #2563eb)' : '1px solid var(--border-color, #e5e7eb)',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    opacity: it.selected ? 1 : 0.65
                                                }}
                                            >
                                                {/* Header row: Checkbox, Product name, Ordered vs Remaining */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={it.selected}
                                                            onChange={() => handleGRNLineItemToggle(idx)}
                                                            disabled={it.remainingQuantity <= 0}
                                                        />
                                                        <span>{it.productName}</span>
                                                        {it.productCode && <span className="inv-subtext">({it.productCode})</span>}
                                                        {it.isBatchTracked && (
                                                            <span className="inv-badge inv-badge--info" style={{ marginLeft: 6 }}>
                                                                Batch Tracked
                                                            </span>
                                                        )}
                                                    </label>
                                                    <span className="inv-subtext">
                                                        Ordered: <strong>{it.orderedQuantity}</strong> | Prev: <strong>{it.previouslyReceivedQuantity}</strong> | Remaining: <strong style={{ color: it.remainingQuantity > 0 ? 'var(--primary-color, #2563eb)' : '#9ca3af' }}>{it.remainingQuantity}</strong>
                                                    </span>
                                                </div>

                                                {it.selected && (
                                                    <>
                                                        {/* Quantities Row */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: it.isBatchTracked ? 10 : 0 }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                                                    Received Qty *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="inv-input"
                                                                    value={it.receivedQuantity}
                                                                    onChange={(e) => handleGRNLineItemChange(idx, 'receivedQuantity', parseInt(e.target.value) || 0)}
                                                                    required
                                                                />
                                                                {grnErrors[`${idKey}_received`] && (
                                                                    <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                        {grnErrors[`${idKey}_received`]}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--success-color, #10b981)' }}>
                                                                    Accepted Qty *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="inv-input"
                                                                    value={it.acceptedQuantity}
                                                                    onChange={(e) => handleGRNLineItemChange(idx, 'acceptedQuantity', parseInt(e.target.value) || 0)}
                                                                    required
                                                                />
                                                                {grnErrors[`${idKey}_accepted`] && (
                                                                    <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                        {grnErrors[`${idKey}_accepted`]}
                                                                    </span>
                                                                )}
                                                                {grnErrors[`${idKey}_overReceipt`] && (
                                                                    <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                        {grnErrors[`${idKey}_overReceipt`]}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--danger-color, #ef4444)' }}>
                                                                    Rejected Qty
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="inv-input"
                                                                    value={it.rejectedQuantity}
                                                                    onChange={(e) => handleGRNLineItemChange(idx, 'rejectedQuantity', parseInt(e.target.value) || 0)}
                                                                />
                                                                {grnErrors[`${idKey}_rejected`] && (
                                                                    <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                        {grnErrors[`${idKey}_rejected`]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {grnErrors[`${idKey}_balance`] && (
                                                            <div className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)', marginTop: 4 }}>
                                                                {grnErrors[`${idKey}_balance`]}
                                                            </div>
                                                        )}

                                                        {/* Batch Tracking Fields */}
                                                        {it.isBatchTracked && (
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10, background: 'var(--card-bg, #f3f4f6)', padding: 10, borderRadius: 6 }}>
                                                                <div>
                                                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                                                        Batch Number *
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        className="inv-input"
                                                                        placeholder="e.g. BATCH-2026-X"
                                                                        value={it.batchNumber}
                                                                        onChange={(e) => handleGRNLineItemChange(idx, 'batchNumber', e.target.value)}
                                                                        required={it.isBatchTracked}
                                                                    />
                                                                    {grnErrors[`${idKey}_batchNumber`] && (
                                                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                            {grnErrors[`${idKey}_batchNumber`]}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                                                        Expiry Date *
                                                                    </label>
                                                                    <input
                                                                        type="date"
                                                                        className="inv-input"
                                                                        value={it.expiryDate}
                                                                        onChange={(e) => handleGRNLineItemChange(idx, 'expiryDate', e.target.value)}
                                                                        required={it.isBatchTracked}
                                                                    />
                                                                    {grnErrors[`${idKey}_expiryDate`] && (
                                                                        <span className="inv-subtext" style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                                            {grnErrors[`${idKey}_expiryDate`]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="inv-modal-footer" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => {
                                        setReceivingPO(null);
                                        setGrnFormData(null);
                                    }}
                                    disabled={grnSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--success"
                                    disabled={grnSubmitting}
                                >
                                    {grnSubmitting ? 'Posting Receipt...' : 'Post Goods Receipt Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 6: PURCHASE ORDER DETAILS
               ======================================================== */}
            {viewingPO && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 780 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker">PURCHASE ORDER DOSSIER</span>
                                <h3>{viewingPO.orderNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingPO(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            {/* Metadata Summary Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: 'var(--card-bg, #f9fafb)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                                <div>
                                    <span className="inv-subtext">Status</span>
                                    <div style={{ marginTop: 4 }}>{renderStatusBadge(viewingPO.status)}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Supplier / Vendor</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingPO.vendor?.name || 'N/A'}</div>
                                    <span className="inv-subtext">{viewingPO.vendor?.contact || ''}</span>
                                </div>
                                <div>
                                    <span className="inv-subtext">Order Date</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                                        <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                                        {new Date(viewingPO.orderDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Expected Delivery</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                                        {viewingPO.expectedDeliveryDate ? new Date(viewingPO.expectedDeliveryDate).toLocaleDateString() : 'Unspecified'}
                                    </div>
                                </div>
                            </div>

                            {viewingPO.notes && (
                                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 6 }}>
                                    <span className="inv-subtext" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Order Instructions:</span>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{viewingPO.notes}</p>
                                </div>
                            )}

                            {/* Line Items Table */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Line Items ({(viewingPO.items || []).length})</h4>
                                    <span className="inv-subtext">
                                        Total Units: <strong>{(viewingPO.items || []).reduce((s, it) => s + it.orderedQuantity, 0)}</strong>
                                    </span>
                                </div>

                                <div className="inv-table-responsive" style={{ maxHeight: 280 }}>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th>Ordered Qty</th>
                                                <th>Received Qty</th>
                                                <th>Item Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(viewingPO.items || []).map((it, idx) => (
                                                <tr key={it.id || idx}>
                                                    <td>
                                                        <strong>{it.product?.name || it.productId}</strong>
                                                        {it.product?.code && (
                                                            <span className="inv-subtext">Code: {it.product.code}</span>
                                                        )}
                                                        {it.notes && (
                                                            <span className="inv-subtext" style={{ fontStyle: 'italic' }}>Note: {it.notes}</span>
                                                        )}
                                                    </td>
                                                    <td>{it.product?.category || 'General'}</td>
                                                    <td>{it.product?.unit || 'Nos'}</td>
                                                    <td>
                                                        <strong>{it.orderedQuantity}</strong>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: it.receivedQuantity > 0 ? 'var(--success-color, #10b981)' : 'inherit' }}>
                                                            {it.receivedQuantity || 0}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <span className="inv-badge inv-badge--neutral">
                                                            {it.status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Linked Goods Receipts Information */}
                            <div style={{ padding: 12, border: '1px dashed var(--border-color, #e5e7eb)', borderRadius: 6, background: 'var(--card-bg, #f9fafb)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Truck size={16} />
                                        <div>
                                            <strong style={{ fontSize: '0.85rem' }}>Goods Receipt Notes (GRN) Inbound Intake</strong>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)' }}>
                                                {(viewingPO.goodsReceipts && viewingPO.goodsReceipts.length > 0)
                                                    ? `${viewingPO.goodsReceipts.length} Goods Receipt Notes recorded for this order.`
                                                    : 'No deliveries received against this order yet.'}
                                            </p>
                                        </div>
                                    </div>

                                    {(viewingPO.status === 'ORDERED' || viewingPO.status === 'PARTIALLY_RECEIVED') && (
                                        <button
                                            type="button"
                                            className="inv-btn inv-btn--success inv-btn--sm"
                                            onClick={() => {
                                                const target = viewingPO;
                                                setViewingPO(null);
                                                handleOpenReceiveModal(target);
                                            }}
                                        >
                                            <Truck size={13} />
                                            <span>Receive Delivery</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingPO(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 7: VIEW GOODS RECEIPT NOTE (GRN) DETAILS
               ======================================================== */}
            {viewingGRN && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 780 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--success-color, #10b981)' }}>GOODS RECEIPT NOTE</span>
                                <h3>{viewingGRN.grnNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingGRN(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: 'var(--card-bg, #f9fafb)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                                <div>
                                    <span className="inv-subtext">Purchase Order #</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingGRN.purchaseOrder?.orderNumber || '—'}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Supplier / Vendor</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingGRN.vendor?.name || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Receipt Date</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{new Date(viewingGRN.receivedDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Receiver</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingGRN.receivedByName || 'Authorized Receiver'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', padding: 10, borderRadius: 6 }}>
                                    <span className="inv-subtext">Challan / Invoice:</span>
                                    <div style={{ fontWeight: 600, marginTop: 2 }}>{viewingGRN.deliveryChallanNo || 'No Challan #'} {viewingGRN.supplierInvoiceNo ? `· Inv: ${viewingGRN.supplierInvoiceNo}` : ''}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', padding: 10, borderRadius: 6 }}>
                                    <span className="inv-subtext">Idempotency Token:</span>
                                    <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginTop: 2 }}>{viewingGRN.idempotencyKey || 'Standard Submission'}</div>
                                </div>
                            </div>

                            {/* GRN Items Table */}
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Received Items ({(viewingGRN.items || []).length})</h4>
                            <div className="inv-table-responsive" style={{ maxHeight: 280 }}>
                                <table className="inv-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Received Qty</th>
                                            <th>Accepted Qty</th>
                                            <th>Rejected Qty</th>
                                            <th>Batch Number</th>
                                            <th>Expiry Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewingGRN.items || []).map((it, idx) => (
                                            <tr key={it.id || idx}>
                                                <td>
                                                    <strong>{it.product?.name || it.productId}</strong>
                                                    {it.product?.code && (
                                                        <span className="inv-subtext">Code: {it.product.code}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>{it.receivedQuantity}</strong>
                                                </td>
                                                <td>
                                                    <strong style={{ color: 'var(--success-color, #10b981)' }}>
                                                        {it.receivedQuantity - it.rejectedQuantity}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span style={{ color: it.rejectedQuantity > 0 ? 'var(--danger-color, #ef4444)' : 'inherit' }}>
                                                        {it.rejectedQuantity || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <code>{it.batchNumber || it.batch?.batchNumber || '—'}</code>
                                                </td>
                                                <td>
                                                    {it.expiryDate || it.batch?.expiryDate ? (
                                                        new Date(it.expiryDate || it.batch?.expiryDate || '').toLocaleDateString()
                                                    ) : (
                                                        <span className="inv-subtext">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingGRN(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 8: CREATE SUPPLIER RETURN (OUTBOUND REVERSAL)
               ======================================================== */}
            {isCreateReturnModalOpen && returnForm && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 880 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--danger-color, #ef4444)' }}>OUTBOUND INVENTORY REVERSAL</span>
                                <h3>New Supplier Return</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateReturnModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitSupplierReturn}>
                            <div className="inv-modal-body">
                                {returnFormErrors.submit && (
                                    <div className="inv-alert inv-alert--danger" style={{ marginBottom: 16 }}>
                                        <AlertCircle size={16} />
                                        <span style={{ flex: 1 }}>{returnFormErrors.submit}</span>
                                    </div>
                                )}

                                {/* Top Grid: Vendor, Source Type, Return Date */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                                    <div>
                                        <label className="inv-label">Supplier / Vendor *</label>
                                        <select
                                            className="inv-select"
                                            value={returnForm.vendorId}
                                            onChange={(e) => void handleReturnVendorChange(e.target.value)}
                                            disabled={returnSubmitting}
                                        >
                                            <option value="">-- Select Active Vendor --</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                        {returnFormErrors.vendorId && (
                                            <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem' }}>{returnFormErrors.vendorId}</span>
                                        )}
                                    </div>

                                    <div>
                                        <label className="inv-label">Source Inbound Record *</label>
                                        <select
                                            className="inv-select"
                                            value={returnForm.sourceType}
                                            onChange={(e) => void handleReturnSourceTypeChange(e.target.value as 'GRN' | 'PURCHASE' | 'DIRECT')}
                                            disabled={returnSubmitting}
                                        >
                                            <option value="GRN">Goods Receipt Note (GRN)</option>
                                            <option value="PURCHASE">Direct Purchase Record</option>
                                            <option value="DIRECT">Direct Stock Reversal (No Prior Ref)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="inv-label">Return Date *</label>
                                        <input
                                            type="date"
                                            className="inv-input"
                                            value={returnForm.returnDate}
                                            onChange={(e) => setReturnForm(prev => prev ? { ...prev, returnDate: e.target.value } : null)}
                                            disabled={returnSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Source Selector */}
                                {returnForm.sourceType === 'GRN' && (
                                    <div style={{ marginBottom: 16, background: 'var(--card-bg, #f9fafb)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color, #e5e7eb)' }}>
                                        <label className="inv-label">Select Source Goods Receipt Note (GRN) *</label>
                                        {isLoadingVendorGrns ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
                                                <RefreshCw size={14} className="spin-animation" />
                                                <span className="inv-subtext">Loading eligible GRNs for vendor...</span>
                                            </div>
                                        ) : vendorEligibleGrns.length === 0 ? (
                                            <div className="inv-subtext" style={{ padding: 6 }}>
                                                {returnForm.vendorId ? 'No Goods Receipt Notes found for this vendor in the active unit/domain.' : 'Please select a vendor above first to load GRNs.'}
                                            </div>
                                        ) : (
                                            <select
                                                className="inv-select"
                                                value={returnForm.sourceReferenceId || ''}
                                                onChange={(e) => void handleSelectGRNForReturn(e.target.value)}
                                                disabled={returnSubmitting}
                                            >
                                                <option value="">-- Choose Goods Receipt Note to Reverse --</option>
                                                {vendorEligibleGrns.map(g => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.grnNumber} (PO: {g.purchaseOrder?.orderNumber || '—'}) — {new Date(g.receivedDate).toLocaleDateString()}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {returnFormErrors.sourceReferenceId && (
                                            <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', display: 'block', marginTop: 4 }}>
                                                {returnFormErrors.sourceReferenceId}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {returnForm.sourceType === 'PURCHASE' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="inv-label">Purchase Reference ID / Order # *</label>
                                        <input
                                            type="text"
                                            className="inv-input"
                                            placeholder="Enter purchase ID or voucher reference..."
                                            value={returnForm.sourceReferenceId || ''}
                                            onChange={(e) => setReturnForm(prev => prev ? { ...prev, sourceReferenceId: e.target.value, sourceReferenceNumber: e.target.value } : null)}
                                            disabled={returnSubmitting}
                                        />
                                        {returnFormErrors.sourceReferenceId && (
                                            <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem' }}>{returnFormErrors.sourceReferenceId}</span>
                                        )}
                                    </div>
                                )}

                                {/* Return Items List */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Items to Return ({returnForm.items.filter(it => it.selected).length} selected)</h4>
                                        {returnForm.sourceType === 'DIRECT' && (
                                            <button
                                                type="button"
                                                className="inv-btn inv-btn--secondary inv-btn--sm"
                                                onClick={handleAddDirectReturnItem}
                                                disabled={returnSubmitting}
                                            >
                                                <Plus size={13} />
                                                <span>Add Return Item</span>
                                            </button>
                                        )}
                                    </div>

                                    {returnFormErrors.items && (
                                        <div className="inv-alert inv-alert--warning" style={{ marginBottom: 10, padding: '8px 12px' }}>
                                            <AlertCircle size={14} />
                                            <span style={{ fontSize: '0.85rem' }}>{returnFormErrors.items}</span>
                                        </div>
                                    )}

                                    {returnForm.items.length === 0 ? (
                                        <div className="inv-empty-state" style={{ padding: 20 }}>
                                            <Boxes size={24} />
                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>
                                                {returnForm.sourceType === 'GRN'
                                                    ? 'Select a Goods Receipt Note above to populate eligible line items.'
                                                    : 'Click "Add Return Item" above to add products to return.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="inv-table-responsive" style={{ maxHeight: 300 }}>
                                            <table className="inv-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 36 }}>Select</th>
                                                        <th>Product</th>
                                                        <th>Batch # / Expiry</th>
                                                        <th>On Hand</th>
                                                        {returnForm.sourceType === 'GRN' && <th>Max Returnable</th>}
                                                        <th style={{ width: 110 }}>Return Qty</th>
                                                        <th>Item Defect Reason</th>
                                                        {returnForm.sourceType === 'DIRECT' && <th>Action</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {returnForm.items.map((it, idx) => (
                                                        <tr key={idx} style={{ opacity: it.selected ? 1 : 0.6 }}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={it.selected}
                                                                    onChange={() => handleReturnLineItemToggle(idx)}
                                                                    disabled={returnSubmitting}
                                                                />
                                                            </td>
                                                            <td>
                                                                {returnForm.sourceType === 'DIRECT' ? (
                                                                    <select
                                                                        className="inv-select inv-select--sm"
                                                                        value={it.productId}
                                                                        onChange={(e) => {
                                                                            const prod = products.find(p => p.id === e.target.value);
                                                                            if (prod) {
                                                                                handleReturnItemChange(idx, 'productId', prod.id);
                                                                                handleReturnItemChange(idx, 'productName', prod.name);
                                                                                handleReturnItemChange(idx, 'productCode', prod.code || null);
                                                                                handleReturnItemChange(idx, 'isBatchTracked', Boolean(prod.isBatchTracked));
                                                                            }
                                                                        }}
                                                                        disabled={returnSubmitting}
                                                                    >
                                                                        {products.map(p => (
                                                                            <option key={p.id} value={p.id}>{p.name} ({p.code || 'SKU'})</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <div>
                                                                        <strong>{it.productName}</strong>
                                                                        {it.productCode && (
                                                                            <span className="inv-subtext">Code: {it.productCode}</span>
                                                                        )}
                                                                        {it.isBatchTracked && (
                                                                            <span className="inv-badge inv-badge--warning" style={{ fontSize: '0.7rem', padding: '1px 5px', marginTop: 2 }}>
                                                                                Batch-Tracked
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {returnFormErrors[`item_${idx}_product`] && (
                                                                    <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.75rem' }}>{returnFormErrors[`item_${idx}_product`]}</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {returnForm.sourceType === 'DIRECT' && it.isBatchTracked ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                        <input
                                                                            type="text"
                                                                            className="inv-input inv-input--sm"
                                                                            placeholder="Batch #"
                                                                            value={it.batchNumber || ''}
                                                                            onChange={(e) => handleReturnItemChange(idx, 'batchNumber', e.target.value)}
                                                                            disabled={returnSubmitting}
                                                                        />
                                                                        <input
                                                                            type="date"
                                                                            className="inv-input inv-input--sm"
                                                                            value={it.expiryDate || ''}
                                                                            onChange={(e) => handleReturnItemChange(idx, 'expiryDate', e.target.value)}
                                                                            disabled={returnSubmitting}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <code>{it.batchNumber || '—'}</code>
                                                                        {it.expiryDate && (
                                                                            <span className="inv-subtext">Exp: {new Date(it.expiryDate).toLocaleDateString()}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {returnFormErrors[`item_${idx}_batch`] && (
                                                                    <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.75rem' }}>{returnFormErrors[`item_${idx}_batch`]}</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <strong>{it.availableStock}</strong>
                                                            </td>
                                                            {returnForm.sourceType === 'GRN' && (
                                                                <td>
                                                                    <span>{it.returnableBalance ?? '—'}</span>
                                                                </td>
                                                            )}
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    className="inv-input inv-input--sm"
                                                                    value={it.returnQuantity}
                                                                    onChange={(e) => handleReturnItemChange(idx, 'returnQuantity', parseInt(e.target.value, 10) || 0)}
                                                                    disabled={returnSubmitting || !it.selected}
                                                                />
                                                                {returnFormErrors[`item_${idx}_quantity`] && (
                                                                    <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.75rem' }}>{returnFormErrors[`item_${idx}_quantity`]}</span>
                                                                )}
                                                                {returnFormErrors[`item_${idx}_stock`] && (
                                                                    <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.75rem' }}>{returnFormErrors[`item_${idx}_stock`]}</span>
                                                                )}
                                                                {returnFormErrors[`item_${idx}_returnable`] && (
                                                                    <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.75rem' }}>{returnFormErrors[`item_${idx}_returnable`]}</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="inv-input inv-input--sm"
                                                                    placeholder="e.g. Expired, packaging broken"
                                                                    value={it.reason || ''}
                                                                    onChange={(e) => handleReturnItemChange(idx, 'reason', e.target.value)}
                                                                    disabled={returnSubmitting || !it.selected}
                                                                />
                                                            </td>
                                                            {returnForm.sourceType === 'DIRECT' && (
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="inv-btn inv-btn--danger inv-btn--sm"
                                                                        onClick={() => handleRemoveDirectReturnItem(idx)}
                                                                        disabled={returnSubmitting}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Return Reason (Mandatory, >= 5 chars, meaningful) */}
                                <div style={{ marginBottom: 14 }}>
                                    <label className="inv-label">
                                        Return Reason (Required, min 5 chars) *
                                    </label>
                                    <textarea
                                        className="inv-textarea"
                                        rows={2}
                                        placeholder="Specific reason for returning stock to vendor (e.g. Batch recall due to packaging breach, damaged during transit)..."
                                        value={returnForm.reason}
                                        onChange={(e) => setReturnForm(prev => prev ? { ...prev, reason: e.target.value } : null)}
                                        disabled={returnSubmitting}
                                    />
                                    {returnFormErrors.reason && (
                                        <span className="inv-field-error" style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem' }}>{returnFormErrors.reason}</span>
                                    )}
                                </div>

                                {/* Additional Notes */}
                                <div style={{ marginBottom: 14 }}>
                                    <label className="inv-label">Internal Intake / Logistics Notes (Optional)</label>
                                    <input
                                        type="text"
                                        className="inv-input"
                                        placeholder="Courier tracking reference, vendor RMA authorization number..."
                                        value={returnForm.notes || ''}
                                        onChange={(e) => setReturnForm(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                        disabled={returnSubmitting}
                                    />
                                </div>

                                {/* Idempotency Token Banner */}
                                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Info size={15} style={{ color: '#64748b' }} />
                                    <div style={{ flex: 1, color: '#475569' }}>
                                        <strong>Idempotency Key:</strong> <code>{returnForm.idempotencyKey}</code> — Backend prevents duplicate returns and re-executing transactions.
                                    </div>
                                </div>
                            </div>

                            <div className="inv-modal-footer">
                                <button
                                    type="button"
                                    className="inv-btn inv-btn--secondary"
                                    onClick={() => setIsCreateReturnModalOpen(false)}
                                    disabled={returnSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inv-btn inv-btn--danger"
                                    disabled={returnSubmitting}
                                >
                                    {returnSubmitting ? (
                                        <>
                                            <RefreshCw size={14} className="spin-animation" />
                                            <span>Processing Return...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw size={14} />
                                            <span>Post Supplier Return</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 9: VIEW SUPPLIER RETURN DETAILS DOSSIER
               ======================================================== */}
            {viewingReturn && (
                <div className="inv-modal-backdrop">
                    <div className="inv-modal-panel" style={{ maxWidth: 780 }}>
                        <div className="inv-modal-header">
                            <div>
                                <span className="section-kicker" style={{ color: 'var(--danger-color, #ef4444)' }}>SUPPLIER RETURN DOSSIER</span>
                                <h3>{viewingReturn.returnNumber}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingReturn(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="inv-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: 'var(--card-bg, #f9fafb)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                                <div>
                                    <span className="inv-subtext">Supplier / Vendor</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingReturn.vendor?.name || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Return Date</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{new Date(viewingReturn.returnDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Source Type & Reference</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingReturn.sourceType} · {viewingReturn.sourceReference || 'Direct Reversal'}</div>
                                </div>
                                <div>
                                    <span className="inv-subtext">Processed By</span>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{viewingReturn.returnedByName || 'Authorized Staff'}</div>
                                </div>
                            </div>

                            <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                                <span className="inv-subtext">Return Reason:</span>
                                <div style={{ fontWeight: 600, marginTop: 4, color: 'var(--text-color, #111827)' }}>{viewingReturn.reason}</div>
                                {viewingReturn.notes && (
                                    <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)' }}>
                                        Notes: {viewingReturn.notes}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', padding: 10, borderRadius: 6 }}>
                                    <span className="inv-subtext">Status:</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className="inv-badge inv-badge--success">
                                            <CheckCircle2 size={12} /> {viewingReturn.status || 'COMPLETED'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid var(--border-color, #e5e7eb)', padding: 10, borderRadius: 6 }}>
                                    <span className="inv-subtext">Idempotency Token:</span>
                                    <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginTop: 4 }}>{viewingReturn.idempotencyKey || 'Standard Submission'}</div>
                                </div>
                            </div>

                            {/* Return Items Table */}
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Returned Items ({(viewingReturn.items || []).length})</h4>
                            <div className="inv-table-responsive" style={{ maxHeight: 280 }}>
                                <table className="inv-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Returned Qty</th>
                                            <th>Batch Number</th>
                                            <th>Expiry Date</th>
                                            <th>Item Reason</th>
                                            <th>Movement Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewingReturn.items || []).map((it, idx) => (
                                            <tr key={it.id || idx}>
                                                <td>
                                                    <strong>{it.product?.name || it.productId}</strong>
                                                    {it.product?.code && (
                                                        <span className="inv-subtext">Code: {it.product.code}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong style={{ color: 'var(--danger-color, #ef4444)' }}>
                                                        -{it.returnQuantity} units
                                                    </strong>
                                                </td>
                                                <td>
                                                    <code>{it.batchNumber || it.batch?.batchNumber || '—'}</code>
                                                </td>
                                                <td>
                                                    {it.expiryDate || it.batch?.expiryDate ? (
                                                        new Date(it.expiryDate || it.batch?.expiryDate || '').toLocaleDateString()
                                                    ) : (
                                                        <span className="inv-subtext">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span>{it.reason || '—'}</span>
                                                </td>
                                                <td>
                                                    <span className="inv-subtext" style={{ fontFamily: 'monospace' }}>
                                                        {it.stockMovementId ? `${it.stockMovementId.slice(0, 8)}...` : 'Linked'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="inv-modal-footer">
                            <button
                                type="button"
                                className="inv-btn inv-btn--secondary"
                                onClick={() => setViewingReturn(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
