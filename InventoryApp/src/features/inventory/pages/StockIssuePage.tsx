import React, { useMemo, useState } from 'react';
import {
  Send,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Package,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Ban,
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
  useApproveInventoryStockIssueRequest,
  useCancelInventoryStockIssueRequest,
  useCreateInventoryStockIssueRequest,
  useInventoryStock,
  useInventoryStockIssueRequests,
  usePatientServices,
  useRejectInventoryStockIssueRequest,
} from '../hooks/useInventory';
import type { InventoryStock, InventoryStockIssueRequest } from '../types';
import {
  getDefaultInventoryScope,
  getInventoryScopeLabel,
  inventoryScopeOptions,
  issueInScope,
  stockInScope,
  type InventoryScope,
} from '../utils/inventoryScope';
import { useInventoryDomainStore } from '../../../store/useInventoryDomainStore';

export const medicalUsageTypeOptions = [
  { value: 'PATIENT_CARE', label: 'Patient Care / Clinical' },
  { value: 'WARD_USE', label: 'Ward / Unit Use' },
  { value: 'MAINTENANCE', label: 'Clinic Maintenance' },
  { value: 'EMERGENCY', label: 'Emergency Stock' },
  { value: 'OTHER', label: 'Other Medical' },
];

export const foodUsageTypeOptions = [
  { value: 'KITCHEN_RATION', label: 'Kitchen / Meal Prep' },
  { value: 'STAFF_USE', label: 'Staff Dining' },
  { value: 'ROOM_USE', label: 'Resident Food' },
  { value: 'OTHER', label: 'Other Food / Ration' },
];

const formatUsageType = (value: string) => {
  const all = [...medicalUsageTypeOptions, ...foodUsageTypeOptions];
  return all.find((opt) => opt.value === value)?.label || value;
};

export default function StockIssuePage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  // Authoritative permissions
  const canViewIssues = hasPermission(user, [
    INVENTORY_PERMISSIONS.ISSUES_VIEW,
    'Stock Issue',
    'Stock Issue Request',
    'Stock Issue Approval',
    'Medicine Requests',
    'Medicine Issue Log',
    'Stock',
  ]);

  const canRequestIssue = hasPermission(user, [
    INVENTORY_PERMISSIONS.ISSUES_MANAGE,
    'Stock Issue Request',
    'Stock Issue',
    'Medicine Requests',
  ]);

  const canApproveIssue = hasPermission(user, [
    'Stock Issue Approval',
    'Stock Issue Manage',
    INVENTORY_PERMISSIONS.ISSUES_MANAGE,
  ]);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'requests' | 'stock'>('requests');

  // Domain Scope filter from global store
  const { activeDomain, setActiveDomain } = useInventoryDomainStore();
  const inventoryScope = activeDomain;
  const usageTypeOptions = activeDomain === 'medical' ? medicalUsageTypeOptions : foodUsageTypeOptions;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [usageFilter, setUsageFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'product' | 'quantity' | 'status'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Request creation drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    usageType: activeDomain === 'medical' ? 'PATIENT_CARE' : 'KITCHEN_RATION',
    quantity: '',
    allocationId: '',
    rate: '',
    issuedTo: '',
    notes: '',
  });

  // Review & Approval modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryStockIssueRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<InventoryStockIssueRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const {
    data: stock = [],
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
    refetch: refetchStock,
  } = useInventoryStock();

  const {
    data: issueRequests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useInventoryStockIssueRequests();

  const {
    data: patientServices = [],
    isLoading: isPatientServicesLoading,
  } = usePatientServices();

  // Mutations
  const createIssueMutation = useCreateInventoryStockIssueRequest();
  const approveIssueMutation = useApproveInventoryStockIssueRequest();
  const rejectIssueMutation = useRejectInventoryStockIssueRequest();
  const cancelIssueMutation = useCancelInventoryStockIssueRequest();

  // Scoped datasets
  const scopedStock = useMemo(
    () => stock.filter((item) => stockInScope(item, inventoryScope)),
    [stock, inventoryScope]
  );

  const scopedRequests = useMemo(
    () => issueRequests.filter((item) => issueInScope(item, inventoryScope)),
    [issueRequests, inventoryScope]
  );

  const availableStock = useMemo(
    () => scopedStock.filter((item) => Number(item.quantity || 0) > 0),
    [scopedStock]
  );

  // Selected product from drawer form
  const selectedStockItem = useMemo(
    () => scopedStock.find((item) => item.productId === formData.productId),
    [scopedStock, formData.productId]
  );

  // Selected patient service
  const selectedPatientService = useMemo(
    () => patientServices.find((s) => s.allocationId === formData.allocationId),
    [patientServices, formData.allocationId]
  );

  const isPatientCare = formData.usageType === 'PATIENT_CARE';
  const issueRate = Number(formData.rate || selectedStockItem?.product?.defaultRevenuePrice || 0);
  const calculatedBillAmount = Number((Number(formData.quantity || 0) * issueRate).toFixed(2));

  // Product options for drawer
  const productOptions = useMemo(
    () =>
      availableStock.map((item) => ({
        value: item.productId,
        label: `${item.product?.code ? `[${item.product.code}] ` : ''}${item.product?.name || 'Unknown Product'} (${item.product?.category || '-'}) — Avail: ${item.quantity} ${item.product?.unit || 'Nos'}`,
      })),
    [availableStock]
  );

  // Open drawer helper
  const handleOpenDrawer = (preselectedProductId = '') => {
    if (!canRequestIssue) return;
    setFormError(null);
    const stockItem = scopedStock.find((s) => s.productId === preselectedProductId);
    setFormData({
      productId: preselectedProductId,
      usageType: activeDomain === 'medical' ? 'PATIENT_CARE' : 'KITCHEN_RATION',
      quantity: '',
      allocationId: '',
      rate: stockItem?.product?.defaultRevenuePrice ? String(stockItem.product.defaultRevenuePrice) : '',
      issuedTo: '',
      notes: '',
    });
    setIsDrawerOpen(true);
  };

  // Submit new request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = Math.trunc(Number(formData.quantity || 0));
    const currentAvailable = Number(selectedStockItem?.quantity || 0);

    if (!formData.productId) {
      setFormError('Please select a product with available stock.');
      return;
    }

    if (qty <= 0) {
      setFormError('Quantity must be at least 1.');
      return;
    }

    if (qty > currentAvailable) {
      setFormError(`Requested quantity (${qty}) exceeds currently available stock balance (${currentAvailable}).`);
      return;
    }

    if (isPatientCare && !formData.allocationId) {
      setFormError('Please select a patient / admission service for patient care usage.');
      return;
    }

    if (isPatientCare && issueRate <= 0) {
      setFormError('Patient care medicines require a billing rate. Please specify unit rate or set product revenue price.');
      return;
    }

    try {
      await createIssueMutation.mutateAsync({
        productId: formData.productId,
        quantity: qty,
        usageType: formData.usageType,
        allocationId: isPatientCare ? formData.allocationId : null,
        patientId: isPatientCare ? selectedPatientService?.patientId || null : null,
        rate: isPatientCare ? issueRate : null,
        issuedTo: formData.issuedTo.trim() || (isPatientCare ? selectedPatientService?.patientName || '' : ''),
        notes: formData.notes.trim() || undefined,
      });

      setIsDrawerOpen(false);
      setFormData({
        productId: '',
        usageType: 'PATIENT_CARE',
        quantity: '',
        allocationId: '',
        rate: '',
        issuedTo: '',
        notes: '',
      });
      setActiveTab('requests');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to submit stock issue request.');
    }
  };

  // Open review modal
  const handleOpenReview = (request: InventoryStockIssueRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setReviewModalOpen(true);
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedRequest || !canApproveIssue) return;
    try {
      await approveIssueMutation.mutateAsync(selectedRequest.id);
      setReviewModalOpen(false);
      setSelectedRequest(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedRequest || !canApproveIssue) return;
    try {
      await rejectIssueMutation.mutateAsync(selectedRequest.id);
      setReviewModalOpen(false);
      setSelectedRequest(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  // Cancellation handlers & ownership check
  const canCancelRequest = (request: InventoryStockIssueRequest) => {
    if (request.status !== 'PENDING') return false;
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
    const role = roleName.toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    const currentUserId = user?.id?.toLowerCase();
    const currentUserEmail = user?.email?.toLowerCase();
    const currentUserName = user?.name?.toLowerCase();

    const reqBy = (request.requestedBy || '').trim().toLowerCase();
    if (!reqBy) return false;

    return Boolean(
      (currentUserId && reqBy === currentUserId) ||
      (currentUserEmail && reqBy === currentUserEmail) ||
      (currentUserName && reqBy === currentUserName)
    );
  };

  const handleOpenCancel = (request: InventoryStockIssueRequest) => {
    setRequestToCancel(request);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;
    try {
      await cancelIssueMutation.mutateAsync({
        id: requestToCancel.id,
        reason: cancelReason.trim() || undefined,
      });
      setCancelModalOpen(false);
      setRequestToCancel(null);
      setCancelReason('');
    } catch {
      // Handled by toast in mutation hook
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return scopedRequests.filter((req) => {
      // Status filter
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }

      // Usage type filter
      if (usageFilter !== 'ALL' && req.usageType !== usageFilter) {
        return false;
      }

      // Text search
      if (query) {
        const matchesProduct = req.productName?.toLowerCase().includes(query);
        const matchesCategory = req.category?.toLowerCase().includes(query);
        const matchesRequester = req.requestedBy?.toLowerCase().includes(query);
        const matchesRecipient = req.issuedTo?.toLowerCase().includes(query);
        const matchesNotes = req.notes?.toLowerCase().includes(query);
        const matchesUsage = req.usageType?.toLowerCase().includes(query);

        if (!matchesProduct && !matchesCategory && !matchesRequester && !matchesRecipient && !matchesNotes && !matchesUsage) {
          return false;
        }
      }

      return true;
    });
  }, [scopedRequests, searchQuery, statusFilter, usageFilter]);

  // Sorted requests
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const dateA = new Date(a.requestedAt || a.createdAt).getTime();
        const dateB = new Date(b.requestedAt || b.createdAt).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'product') {
        comparison = (a.productName || '').localeCompare(b.productName || '');
      } else if (sortField === 'quantity') {
        comparison = (a.quantity || 0) - (b.quantity || 0);
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredRequests, sortField, sortAsc]);

  // Paginated requests
  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRequests.slice(startIndex, startIndex + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  // Filtered available stock
  const filteredStock = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableStock;

    return availableStock.filter((item) => {
      const code = item.product?.code?.toLowerCase() || '';
      const name = item.product?.name?.toLowerCase() || '';
      const cat = item.product?.category?.toLowerCase() || '';
      return code.includes(query) || name.includes(query) || cat.includes(query);
    });
  }, [availableStock, searchQuery]);

  // Metric stats
  const stats = useMemo(() => {
    const total = scopedRequests.length;
    const pending = scopedRequests.filter((r) => r.status === 'PENDING').length;
    const approved = scopedRequests.filter((r) => r.status === 'APPROVED').length;
    const rejected = scopedRequests.filter((r) => r.status === 'REJECTED').length;
    const cancelled = scopedRequests.filter((r) => r.status === 'CANCELLED').length;
    const availableItems = availableStock.length;
    return { total, pending, approved, rejected, cancelled, availableItems };
  }, [scopedRequests, availableStock]);

  // Selected request live balance during review
  const reviewLiveStock = useMemo(() => {
    if (!selectedRequest) return null;
    return scopedStock.find((s) => s.productId === selectedRequest.productId);
  }, [selectedRequest, scopedStock]);

  const reviewStockAvailable = Number(reviewLiveStock?.quantity || 0);
  const canApproveSelected =
    selectedRequest?.status === 'PENDING' &&
    selectedRequest.quantity <= reviewStockAvailable &&
    canApproveIssue;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stock Issue Requests"
        description="Process departmental consumption and clinical medicine requisitions with two-stage approval and automated Patient Daily Cost ledger posting."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchRequests();
                refetchStock();
              }}
              className="border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {canRequestIssue && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenDrawer()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Issue
              </Button>
            )}
          </div>
        }
      />

      {/* Access Permission Warning Banner */}
      {!canRequestIssue && !canApproveIssue && (
        <Card className="border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center gap-3 text-amber-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Read-only mode. Your current role does not grant stock requisition or approval privileges.
            </p>
          </div>
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900/70 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Requests</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-500">Across {getInventoryScopeLabel(inventoryScope)}</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2">{stats.pending}</p>
          <span className="text-xs text-amber-400/70">Awaiting Manager Approval</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Approved & Issued</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300 mt-2">{stats.approved}</p>
          <span className="text-xs text-emerald-400/70">Stock Decremented</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Rejected / Closed</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">{stats.rejected}</p>
          <span className="text-xs text-rose-400/70">Stock Preserved</span>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800/80 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Available Items</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300 mt-2">{stats.availableItems}</p>
          <span className="text-xs text-cyan-400/70">With Stock Balance &gt; 0</span>
        </Card>
      </div>

      {/* Tabs & Controls */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'requests'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Requisition Ledger ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'stock'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Available Stock ({stats.availableItems})
            </button>
          </div>

          {/* Domain Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain:</span>
            <div className="w-52">
              <Select
                value={activeDomain}
                onChange={(e) => setActiveDomain(e.target.value as any)}
                options={inventoryScopeOptions.filter((o) => o.value !== 'all')}
              />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            placeholder={activeTab === 'requests' ? 'Search product, recipient, notes...' : 'Search available stock...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-500" />}
          />

          {activeTab === 'requests' && (
            <>
              <Select
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending Approval' },
                  { value: 'APPROVED', label: 'Approved & Issued' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />

              <Select
                label="Usage Type"
                value={usageFilter}
                onChange={(e) => {
                  setUsageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[{ value: 'ALL', label: 'All Usage Types' }, ...usageTypeOptions]}
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
                  { value: 'date-desc', label: 'Requested Date (Newest)' },
                  { value: 'date-asc', label: 'Requested Date (Oldest)' },
                  { value: 'product-asc', label: 'Product Name (A-Z)' },
                  { value: 'quantity-desc', label: 'Quantity (High to Low)' },
                  { value: 'status-asc', label: 'Approval Status' },
                ]}
              />
            </>
          )}
        </div>
      </Card>

      {/* TAB 1: ISSUE REQUESTS LEDGER */}
      {activeTab === 'requests' && (
        <Card className="overflow-hidden bg-slate-900 border-slate-800">
          {isRequestsLoading ? (
            <div className="p-12">
              <LoadingState message="Loading stock issue requests..." />
            </div>
          ) : isRequestsError ? (
            <div className="p-8">
              <ErrorState
                title="Failed to Load Issue Requests"
                message={requestsError instanceof Error ? requestsError.message : 'Backend error'}
                onRetry={() => refetchRequests()}
              />
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Send className="w-8 h-8 text-slate-500" />}
                title="No Issue Requests Found"
                description={
                  searchQuery || statusFilter !== 'ALL' || usageFilter !== 'ALL'
                    ? 'No stock issue requests match the current filters.'
                    : 'No stock issue requests recorded for this unit yet.'
                }
                action={
                  canRequestIssue ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenDrawer()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Request
                    </Button>
                  ) : undefined
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
                      <th className="py-3 px-4 font-semibold">Requested Product</th>
                      <th className="py-3 px-4 font-semibold text-center">Qty</th>
                      <th className="py-3 px-4 font-semibold">Purpose & Recipient</th>
                      <th className="py-3 px-4 font-semibold">Financial Impact</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold">Requested At</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedRequests.map((request, idx) => {
                      const liveStock = scopedStock.find((s) => s.productId === request.productId);
                      const currentAvailable = Number(liveStock?.quantity || 0);
                      const hasSufficientStock = request.quantity <= currentAvailable;

                      return (
                        <tr key={request.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-100">{request.productName}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                                {request.category || 'General'}
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">Avail Stock: {currentAvailable}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 font-mono font-bold text-slate-100 text-xs">
                              {request.quantity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-slate-200">
                              {formatUsageType(request.usageType)}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              To: <span className="text-slate-300 font-medium">{request.issuedTo || 'Unspecified'}</span>
                            </div>
                            {request.notes && (
                              <div className="text-[11px] text-slate-500 italic truncate max-w-xs mt-0.5">
                                Note: {request.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {request.amount ? (
                              <div>
                                <span className="text-xs font-semibold text-emerald-400 font-mono">
                                  ₹{Number(request.amount || 0).toFixed(2)}
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  (@ ₹{Number(request.rate || 0).toFixed(2)}/unit)
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Internal Cost</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {request.status === 'PENDING' ? (
                              <Badge variant="warning">
                                <Clock className="w-3 h-3" />
                                PENDING
                              </Badge>
                            ) : request.status === 'APPROVED' ? (
                              <Badge variant="success">
                                <CheckCircle2 className="w-3 h-3" />
                                APPROVED
                              </Badge>
                            ) : request.status === 'CANCELLED' ? (
                              <Badge variant="default">
                                <Ban className="w-3 h-3 text-slate-400" />
                                CANCELLED
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <XCircle className="w-3 h-3" />
                                REJECTED
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            <div>{new Date(request.requestedAt || request.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-500">
                              By {request.requestedBy || 'Requester'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {request.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                {canApproveIssue && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenReview(request)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1"
                                  >
                                    Review & Process
                                  </Button>
                                )}
                                {canCancelRequest(request) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenCancel(request)}
                                    className="border-slate-700 bg-slate-800/80 text-rose-300 hover:bg-rose-950/40 hover:border-rose-800 text-xs px-2.5 py-1"
                                    title="Cancel this pending request"
                                  >
                                    <Ban className="w-3 h-3 mr-1 text-rose-400" />
                                    Cancel
                                  </Button>
                                )}
                                {!canApproveIssue && !canCancelRequest(request) && (
                                  <span className="text-xs font-medium text-amber-400/80">
                                    Awaiting Approval
                                  </span>
                                )}
                              </div>
                            ) : request.status === 'CANCELLED' ? (
                              <div className="text-xs text-slate-500">
                                <span className="font-semibold text-slate-400">Cancelled</span>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">
                                <span className="font-semibold text-slate-400">Closed</span>
                                {request.approvedBy && (
                                  <div className="text-[10px] text-slate-500">by {request.approvedBy}</div>
                                )}
                                {request.rejectedBy && (
                                  <div className="text-[10px] text-slate-500">by {request.rejectedBy}</div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, sortedRequests.length)} of {sortedRequests.length} requests
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
      )}

      {/* TAB 2: AVAILABLE STOCK QUICK ISSUE */}
      {activeTab === 'stock' && (
        <Card className="overflow-hidden bg-slate-900 border-slate-800">
          {isStockLoading ? (
            <div className="p-12">
              <LoadingState message="Loading available stock items..." />
            </div>
          ) : isStockError ? (
            <div className="p-8">
              <ErrorState
                title="Failed to Load Stock"
                message={stockError instanceof Error ? stockError.message : 'Backend error'}
                onRetry={() => refetchStock()}
              />
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Layers className="w-8 h-8 text-slate-500" />}
                title="No Available Stock for Issue"
                description="There are currently no products with physical inventory balance greater than zero in this unit."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">S.No</th>
                    <th className="py-3 px-4 font-semibold">Product Name</th>
                    <th className="py-3 px-4 font-semibold">Code / Category</th>
                    <th className="py-3 px-4 font-semibold text-center">Available Balance</th>
                    <th className="py-3 px-4 font-semibold">Default Revenue Rate</th>
                    <th className="py-3 px-4 font-semibold">Last Updated</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStock.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{item.product?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">Unit: {item.product?.unit || 'Nos'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-slate-400">{item.product?.code || '-'}</span>
                        <div className="text-xs text-slate-500">{item.product?.category || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 font-mono font-bold text-emerald-400 text-xs">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                        {item.product?.defaultRevenuePrice ? (
                          `₹${Number(item.product.defaultRevenuePrice).toFixed(2)}`
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canRequestIssue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDrawer(item.productId)}
                            className="border-emerald-700/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 text-xs px-3 py-1"
                          >
                            <Send className="w-3 h-3 mr-1.5" />
                            Request Issue
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* REQUEST CREATION DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create Stock Issue Request"
        description="Draft a requisition for clinical medication, care items or facility consumption. Live stock will be deducted only upon approval."
        size="lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product Select */}
          <Select
            label="Product to Issue"
            required
            value={formData.productId}
            onChange={(e) => {
              const pid = e.target.value;
              const stockItem = scopedStock.find((s) => s.productId === pid);
              setFormData((prev) => ({
                ...prev,
                productId: pid,
                rate: stockItem?.product?.defaultRevenuePrice ? String(stockItem.product.defaultRevenuePrice) : prev.rate,
              }));
            }}
            options={productOptions}
            helperText={
              selectedStockItem
                ? `Available in stock: ${selectedStockItem.quantity} ${selectedStockItem.product?.unit || 'Nos'}`
                : undefined
            }
          />

          {/* Usage Type */}
          <Select
            label="Usage Type"
            required
            value={formData.usageType}
            onChange={(e) => {
              const uType = e.target.value;
              setFormData((prev) => ({
                ...prev,
                usageType: uType,
                allocationId: uType === 'PATIENT_CARE' ? prev.allocationId : '',
                rate: uType === 'PATIENT_CARE' ? prev.rate : '',
              }));
            }}
            options={usageTypeOptions}
          />

          {/* Patient Care Specific Fields */}
          {isPatientCare && (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <User className="w-3.5 h-3.5" />
                <span>Patient Care Financial Integration</span>
              </div>

              <Select
                label="Patient / Admission Service"
                required
                value={formData.allocationId}
                onChange={(e) => {
                  const allocId = e.target.value;
                  const service = patientServices.find((s) => s.allocationId === allocId);
                  setFormData((prev) => ({
                    ...prev,
                    allocationId: allocId,
                    issuedTo: service?.patientName || prev.issuedTo,
                  }));
                }}
                options={patientServices.map((service) => ({
                  value: service.allocationId,
                  label: `${service.patientName} — ${service.serviceLabel || service.serviceType} (${service.allocationRef || 'Active'})`,
                }))}
                helperText={isPatientServicesLoading ? 'Loading patient services...' : undefined}
              />

              <Input
                label="Patient Billing Rate Per Unit (₹)"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData((prev) => ({ ...prev, rate: e.target.value }))}
                placeholder="Rate to bill patient"
                helperText={
                  selectedStockItem?.product?.defaultRevenuePrice
                    ? `Default product revenue price: ₹${Number(selectedStockItem.product.defaultRevenuePrice).toFixed(2)}`
                    : 'Enter rate charged to patient'
                }
              />

              {issueRate > 0 && Number(formData.quantity || 0) > 0 && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
                  <span>Projected Patient Daily Cost Entry:</span>
                  <span className="font-mono font-bold text-emerald-200">
                    ₹{calculatedBillAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Issued To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              step="1"
              min="1"
              max={selectedStockItem ? selectedStockItem.quantity : undefined}
              required
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              placeholder="e.g. 5"
              helperText={
                selectedStockItem
                  ? `Max allowable: ${selectedStockItem.quantity}`
                  : undefined
              }
            />

            <Input
              label="Issued To / Recipient"
              value={formData.issuedTo}
              onChange={(e) => setFormData((prev) => ({ ...prev, issuedTo: e.target.value }))}
              placeholder="Patient, Staff, Ward or Department"
            />
          </div>

          {/* Notes / Purpose */}
          <Input
            label="Notes / Clinical Purpose"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={`Specify purpose for ${formatUsageType(formData.usageType)}`}
          />

          {/* Audit Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-xs text-amber-300/90 flex items-start gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Two-Stage Stock Depletion Policy</p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Submitting this form creates a pending requisition. Stock balances remain unchanged until authorized by an inventory manager.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDrawerOpen(false)}
              className="border-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                createIssueMutation.isPending ||
                !formData.productId ||
                Number(formData.quantity || 0) <= 0 ||
                (isPatientCare && (!formData.allocationId || issueRate <= 0))
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]"
            >
              {createIssueMutation.isPending ? 'Saving...' : 'Submit Requisition'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* REVIEW & APPROVAL MODAL */}
      <Drawer
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Review Stock Issue Requisition"
        description="Verify physical stock availability and approve or reject this requisition."
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Request Summary Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-base">{selectedRequest.productName}</h4>
                  <p className="text-xs text-slate-400">{selectedRequest.category || 'General'}</p>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-2.5">
                <div>
                  <span className="text-slate-500">Requested Quantity:</span>
                  <p className="font-bold font-mono text-slate-200 text-sm mt-0.5">
                    {selectedRequest.quantity}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Live Stock Available:</span>
                  <p
                    className={`font-bold font-mono text-sm mt-0.5 ${
                      reviewStockAvailable >= selectedRequest.quantity
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {reviewStockAvailable}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Usage Type:</span>
                  <p className="font-medium text-slate-300 mt-0.5">
                    {formatUsageType(selectedRequest.usageType)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Recipient:</span>
                  <p className="font-medium text-slate-300 mt-0.5">
                    {selectedRequest.issuedTo || 'Unspecified'}
                  </p>
                </div>
              </div>

              {selectedRequest.amount ? (
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Patient Daily Cost Posting:</span>
                    <span className="font-bold font-mono text-emerald-300">
                      ₹{Number(selectedRequest.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Unit rate: ₹{Number(selectedRequest.rate || 0).toFixed(2)} • Posted to ledger automatically upon approval.
                  </div>
                </div>
              ) : null}

              {selectedRequest.notes && (
                <div className="text-xs text-slate-400 border-t border-slate-850 pt-2">
                  <span className="text-slate-500">Requester Notes:</span> {selectedRequest.notes}
                </div>
              )}
            </div>

            {/* Live Stock Sufficiency Check Warning */}
            {reviewStockAvailable < selectedRequest.quantity && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  Insufficient stock. Live balance ({reviewStockAvailable}) is less than requested quantity ({selectedRequest.quantity}). Requisition cannot be approved until stock is replenished.
                </span>
              </div>
            )}

            {/* Approver Guidance Note */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Accounting Side Effects:</span> Approving will atomically decrement live stock, create an ISSUE stock movement record, and post patient charges if applicable.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={rejectIssueMutation.isPending || approveIssueMutation.isPending}
                className="border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50"
              >
                {rejectIssueMutation.isPending ? 'Rejecting...' : 'Reject Requisition'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReviewModalOpen(false);
                    setSelectedRequest(null);
                  }}
                  className="border-slate-800 text-slate-300"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApprove}
                  disabled={!canApproveSelected || approveIssueMutation.isPending || rejectIssueMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[130px] disabled:opacity-50"
                >
                  {approveIssueMutation.isPending ? 'Processing...' : 'Approve & Issue'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* CANCELLATION MODAL */}
      <Drawer
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setRequestToCancel(null);
          setCancelReason('');
        }}
        title="Cancel Stock Issue Request"
        description="Cancel this pending requisition. Live stock will remain untouched as pending requests do not deduct or reserve inventory."
        size="md"
      >
        {requestToCancel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-base">{requestToCancel.productName}</h4>
                  <p className="text-xs text-slate-400">{requestToCancel.category || 'General'}</p>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-2.5">
                <div>
                  <span className="text-slate-500">Requested Quantity:</span>
                  <p className="font-bold font-mono text-slate-200 text-sm mt-0.5">
                    {requestToCancel.quantity}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Usage Type:</span>
                  <p className="font-medium text-slate-300 mt-0.5">
                    {formatUsageType(requestToCancel.usageType)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Recipient:</span>
                  <p className="font-medium text-slate-300 mt-0.5">
                    {requestToCancel.issuedTo || 'Unspecified'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Requested By:</span>
                  <p className="font-medium text-slate-300 mt-0.5">
                    {requestToCancel.requestedBy || 'Requester'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Once cancelled, this request cannot be approved or reinstated. If items are still required, a new requisition will need to be submitted.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cancellation Reason <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain why this requisition is being cancelled (e.g., patient discharged, order duplicated)..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelModalOpen(false);
                  setRequestToCancel(null);
                  setCancelReason('');
                }}
                className="border-slate-800 text-slate-300"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmCancel}
                disabled={cancelIssueMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white min-w-[120px]"
              >
                {cancelIssueMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
