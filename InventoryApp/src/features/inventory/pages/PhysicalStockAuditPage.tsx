import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Boxes,
  ShieldCheck,
  Eye,
  Edit3,
  Check,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
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
  usePhysicalAudits,
  usePhysicalAuditDetails,
  useCreatePhysicalAudit,
  useSubmitPhysicalAuditCount,
  useReconcilePhysicalAudit,
  useInventoryProducts,
  useInventoryBatches
} from '../hooks/useInventory';
import type { PhysicalAudit } from '../types';

export default function PhysicalStockAuditPage() {
  const { user, activeUnitId, units } = useAuthStore();
  const activeUnit = units.find((u) => u.id === activeUnitId);

  const canViewAudits = hasPermission(user, [
    INVENTORY_PERMISSIONS.VIEW_ALL,
    INVENTORY_PERMISSIONS.STOCK_VIEW
  ]);

  const canManageAudits = hasPermission(user, [
    INVENTORY_PERMISSIONS.MANAGE_ALL,
    INVENTORY_PERMISSIONS.STOCK_MANAGE
  ]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Queries
  const {
    data: auditData,
    isLoading,
    isError,
    refetch
  } = usePhysicalAudits(
    {
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page,
      limit: 20
    },
    { unitId: activeUnitId, enabled: canViewAudits }
  );

  const { data: allProducts = [] } = useInventoryProducts({ unitId: activeUnitId });

  // Mutations
  const createAuditMutation = useCreatePhysicalAudit();
  const submitCountMutation = useSubmitPhysicalAuditCount();
  const reconcileMutation = useReconcilePhysicalAudit();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAuditForCount, setSelectedAuditForCount] = useState<PhysicalAudit | null>(null);
  const [selectedAuditForReconcile, setSelectedAuditForReconcile] = useState<PhysicalAudit | null>(null);
  const [selectedAuditForDetails, setSelectedAuditForDetails] = useState<PhysicalAudit | null>(null);

  // Form states for Create Audit
  const [createProductId, setCreateProductId] = useState('');
  const [createBatchId, setCreateBatchId] = useState('');
  const [createPhysicalQty, setCreatePhysicalQty] = useState('');
  const [createReason, setCreateReason] = useState('');
  const [createNotes, setCreateNotes] = useState('');

  // Form states for Submit Count
  const [countPhysicalQty, setCountPhysicalQty] = useState('');
  const [countReason, setCountReason] = useState('');
  const [countNotes, setCountNotes] = useState('');

  // Form states for Reconcile
  const [reconcileNotes, setReconcileNotes] = useState('');

  // Fetch batches for selected product in create modal
  const selectedProduct = useMemo(
    () => allProducts.find((p) => p.id === createProductId),
    [allProducts, createProductId]
  );

  const { data: productBatches = [] } = useInventoryBatches(
    { unitId: activeUnitId, productId: createProductId, enabled: Boolean(createProductId && selectedProduct?.isBatchTracked) }
  );

  // Handlers
  const handleOpenCreate = () => {
    setCreateProductId('');
    setCreateBatchId('');
    setCreatePhysicalQty('');
    setCreateReason('');
    setCreateNotes('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProductId) return;

    await createAuditMutation.mutateAsync({
      productId: createProductId,
      batchId: createBatchId || undefined,
      physicalQuantity: createPhysicalQty ? Number(createPhysicalQty) : undefined,
      reason: createReason || undefined,
      notes: createNotes || undefined
    });

    setIsCreateOpen(false);
  };

  const handleOpenCount = (audit: PhysicalAudit) => {
    setSelectedAuditForCount(audit);
    setCountPhysicalQty(audit.physicalQuantity !== null && audit.physicalQuantity !== undefined ? String(audit.physicalQuantity) : '');
    setCountReason(audit.reason || '');
    setCountNotes(audit.notes || '');
  };

  const handleSubmitCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditForCount || countPhysicalQty === '') return;

    await submitCountMutation.mutateAsync({
      id: selectedAuditForCount.id,
      payload: {
        physicalQuantity: Number(countPhysicalQty),
        reason: countReason || undefined,
        notes: countNotes || undefined
      }
    });

    setSelectedAuditForCount(null);
  };

  const handleOpenReconcile = (audit: PhysicalAudit) => {
    setSelectedAuditForReconcile(audit);
    setReconcileNotes('');
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditForReconcile) return;

    await reconcileMutation.mutateAsync({
      id: selectedAuditForReconcile.id,
      payload: {
        notes: reconcileNotes || undefined
      }
    });

    setSelectedAuditForReconcile(null);
  };

  // KPI Calculations
  const audits = auditData?.data || [];
  const totalCount = auditData?.pagination.total || 0;
  const draftCount = audits.filter((a) => a.status === 'DRAFT').length;
  const countedCount = audits.filter((a) => a.status === 'COUNTED').length;
  const reconciledCount = audits.filter((a) => a.status === 'RECONCILED').length;

  if (!canViewAudits) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Access Restricted"
          message="You do not have permission to view physical stock audits. Please contact your system administrator."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Physical Stock Audit & Reconciliation"
        description="Controlled physical count workflows, variance analysis, and authorized live ledger reconciliation."
        badge={
          <Badge variant="default" className="bg-slate-800 text-slate-300 border-slate-700">
            {activeUnit ? `Unit: ${activeUnit.name}` : 'Facility-wide'}
          </Badge>
        }
        actions={
          canManageAudits ? (
            <Button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Stock Count</span>
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Audits
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-2">Active facility audit records</p>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Pending Counting
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{draftCount}</div>
          <p className="text-[11px] text-slate-500 mt-2">DRAFT snapshot sessions</p>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Awaiting Reconciliation
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">{countedCount}</div>
          <p className="text-[11px] text-slate-500 mt-2">Counted with variance analysis</p>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Reconciled & Posted
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{reconciledCount}</div>
          <p className="text-[11px] text-slate-500 mt-2">Live ledger updated</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-slate-900/60 border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl text-xs w-48"
            >
              <option value="ALL">All Audit Statuses</option>
              <option value="DRAFT">Draft (Pending Count)</option>
              <option value="COUNTED">Counted (Awaiting Reconciliation)</option>
              <option value="RECONCILED">Reconciled</option>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            className="text-xs border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </Card>

      {/* Audits Table */}
      <Card className="bg-slate-900/80 border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12">
            <LoadingState message="Loading physical stock audits..." />
          </div>
        ) : isError ? (
          <div className="p-12">
            <ErrorState message="Failed to load physical audits. Please try again." onRetry={refetch} />
          </div>
        ) : audits.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No physical audits recorded"
              description="Start a new physical stock count session using the button above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Audit # / Date</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4 text-right">System Snapshot</th>
                  <th className="py-3 px-4 text-right">Physical Count</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {audits.map((audit) => {
                  const hasVariance = audit.variance !== null && audit.variance !== undefined;
                  const isZeroVariance = audit.variance === 0;
                  const isNegVariance = hasVariance && audit.variance! < 0;

                  return (
                    <tr key={audit.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                        <div>{audit.auditNumber}</div>
                        <span className="text-[10px] text-slate-500 font-sans">
                          {new Date(audit.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div>{audit.product?.name || 'Unknown Product'}</div>
                        {audit.product?.code && (
                          <span className="font-mono text-[10px] text-slate-500">{audit.product.code}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {audit.batchNumber ? (
                          <span>{audit.batchNumber}</span>
                        ) : (
                          <span className="text-slate-600">Standard</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {audit.systemQuantityAtCount} {audit.product?.unit || 'Nos'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {audit.physicalQuantity !== null && audit.physicalQuantity !== undefined ? (
                          <span className="text-slate-100">{audit.physicalQuantity}</span>
                        ) : (
                          <span className="text-amber-400 italic">Pending Count</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {hasVariance ? (
                          <span
                            className={
                              isZeroVariance
                                ? 'text-emerald-400'
                                : isNegVariance
                                ? 'text-rose-400'
                                : 'text-blue-400'
                            }
                          >
                            {audit.variance! > 0 ? `+${audit.variance}` : audit.variance}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {audit.status === 'RECONCILED' ? (
                          <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            Reconciled
                          </Badge>
                        ) : audit.status === 'COUNTED' ? (
                          <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                            Counted
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                            Draft
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {audit.status !== 'RECONCILED' && canManageAudits && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCount(audit)}
                              className="text-[11px] h-7 px-2.5 border-slate-700 hover:bg-slate-800 text-slate-200"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              <span>{audit.status === 'DRAFT' ? 'Enter Count' : 'Edit Count'}</span>
                            </Button>
                          )}

                          {audit.status === 'COUNTED' && canManageAudits && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReconcile(audit)}
                              className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950/40"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              <span>Reconcile</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAuditForDetails(audit)}
                            className="text-[11px] h-7 px-2 text-slate-400 hover:text-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* =========================================================================
          DRAWER 1: INITIATE PHYSICAL COUNT
          ========================================================================= */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Initiate Physical Stock Count"
        description="Captures live system snapshot balance for verified physical auditing."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Product *</label>
            <Select
              value={createProductId}
              onChange={(e) => {
                setCreateProductId(e.target.value);
                setCreateBatchId('');
              }}
              required
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs w-full"
            >
              <option value="">-- Choose inventory item --</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''} - {p.category}
                </option>
              ))}
            </Select>
          </div>

          {selectedProduct?.isBatchTracked && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Batch *</label>
              <Select
                value={createBatchId}
                onChange={(e) => setCreateBatchId(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs w-full"
              >
                <option value="">-- Choose batch --</option>
                {productBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} (Current Balance: {b.quantity})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Physical Counted Quantity (Optional)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="Leave blank to count later"
              value={createPhysicalQty}
              onChange={(e) => setCreatePhysicalQty(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
            />
          </div>

          {createPhysicalQty !== '' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Variance Reason</label>
              <Input
                placeholder="e.g. Broken packaging discovered during shelf check"
                value={createReason}
                onChange={(e) => setCreateReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Auditor Notes</label>
            <Input
              placeholder="e.g. Initiated by ward nursing supervisor"
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="text-xs border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAuditMutation.isPending || !createProductId}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {createAuditMutation.isPending ? 'Initiating...' : 'Initiate Count Session'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* =========================================================================
          DRAWER 2: SUBMIT PHYSICAL COUNT
          ========================================================================= */}
      <Drawer
        isOpen={Boolean(selectedAuditForCount)}
        onClose={() => setSelectedAuditForCount(null)}
        title={`Record Physical Count — ${selectedAuditForCount?.auditNumber}`}
        description="Enter the physical verified count. Variance against system snapshot is automatically calculated."
      >
        <form onSubmit={handleSubmitCount} className="space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="text-slate-400">Product: <span className="text-slate-200 font-medium">{selectedAuditForCount?.product?.name}</span></div>
            {selectedAuditForCount?.batchNumber && (
              <div className="text-slate-400 font-mono">Batch: <span className="text-slate-200">{selectedAuditForCount.batchNumber}</span></div>
            )}
            <div className="text-slate-400">
              System Snapshot Balance: <span className="text-emerald-400 font-mono font-bold">{selectedAuditForCount?.systemQuantityAtCount} {selectedAuditForCount?.product?.unit || 'Nos'}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Physical Verified Quantity *</label>
            <Input
              type="number"
              min="0"
              required
              value={countPhysicalQty}
              onChange={(e) => setCountPhysicalQty(e.target.value)}
              placeholder="Enter exact count"
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
            />
          </div>

          {countPhysicalQty !== '' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Calculated Variance:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  Number(countPhysicalQty) - (selectedAuditForCount?.systemQuantityAtCount || 0) === 0
                    ? 'text-emerald-400'
                    : Number(countPhysicalQty) - (selectedAuditForCount?.systemQuantityAtCount || 0) < 0
                    ? 'text-rose-400'
                    : 'text-blue-400'
                }`}
              >
                {Number(countPhysicalQty) - (selectedAuditForCount?.systemQuantityAtCount || 0) > 0 ? '+' : ''}
                {Number(countPhysicalQty) - (selectedAuditForCount?.systemQuantityAtCount || 0)}
              </span>
            </div>
          )}

          {countPhysicalQty !== '' && Number(countPhysicalQty) !== selectedAuditForCount?.systemQuantityAtCount && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Variance Explanation *</label>
              <Input
                required
                minLength={3}
                placeholder="Explain the discrepancy (min 3 chars)..."
                value={countReason}
                onChange={(e) => setCountReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Auditor Notes</label>
            <Input
              placeholder="Optional notes"
              value={countNotes}
              onChange={(e) => setCountNotes(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAuditForCount(null)}
              className="text-xs border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitCountMutation.isPending || countPhysicalQty === ''}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              {submitCountMutation.isPending ? 'Saving Count...' : 'Submit Physical Count'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* =========================================================================
          DRAWER 3: RECONCILE STOCK POSTING
          ========================================================================= */}
      <Drawer
        isOpen={Boolean(selectedAuditForReconcile)}
        onClose={() => setSelectedAuditForReconcile(null)}
        title={`Reconcile Stock Ledger — ${selectedAuditForReconcile?.auditNumber}`}
        description="Posting this audit will adjust the live stock ledger to match the physical verified count."
      >
        <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Product:</span>
              <span className="text-slate-200 font-medium">{selectedAuditForReconcile?.product?.name}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Snapshot System Balance:</span>
              <span className="text-slate-300">{selectedAuditForReconcile?.systemQuantityAtCount}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Physical Verified Count:</span>
              <span className="text-slate-100 font-bold">{selectedAuditForReconcile?.physicalQuantity}</span>
            </div>
            <div className="flex justify-between font-mono pt-2 border-t border-slate-800">
              <span className="text-slate-400">Net Ledger Adjustment:</span>
              <span className="text-emerald-400 font-bold">
                {selectedAuditForReconcile?.variance && selectedAuditForReconcile.variance > 0 ? '+' : ''}
                {selectedAuditForReconcile?.variance}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span className="font-semibold">Reconciliation Audit Safeguard: </span>
            A pessimistic row lock will be acquired during execution. Live delta is dynamically calculated against concurrent stock movements to prevent stale ledger overwrites. A traceable StockMovement of type ADJUSTMENT will be permanently recorded.
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Reconciliation Approval Notes</label>
            <Input
              placeholder="e.g. Approved by inventory manager after shelf audit review"
              value={reconcileNotes}
              onChange={(e) => setReconcileNotes(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAuditForReconcile(null)}
              className="text-xs border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={reconcileMutation.isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {reconcileMutation.isPending ? 'Posting Adjustment...' : 'Confirm & Post to Live Stock'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* =========================================================================
          DRAWER 4: AUDIT DETAILS
          ========================================================================= */}
      <Drawer
        isOpen={Boolean(selectedAuditForDetails)}
        onClose={() => setSelectedAuditForDetails(null)}
        title={`Audit Details — ${selectedAuditForDetails?.auditNumber}`}
        description="Comprehensive audit trail and variance history."
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <Badge variant={selectedAuditForDetails?.status === 'RECONCILED' ? 'success' : 'warning'}>
                {selectedAuditForDetails?.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Product:</span>
              <span className="text-slate-200 font-medium">{selectedAuditForDetails?.product?.name}</span>
            </div>
            {selectedAuditForDetails?.batchNumber && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Batch Number:</span>
                <span className="text-slate-200">{selectedAuditForDetails.batchNumber}</span>
              </div>
            )}
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">System Snapshot Quantity:</span>
              <span className="text-slate-300">{selectedAuditForDetails?.systemQuantityAtCount}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Physical Verified Quantity:</span>
              <span className="text-slate-100 font-bold">{selectedAuditForDetails?.physicalQuantity ?? 'Pending'}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Variance:</span>
              <span className="text-slate-100">{selectedAuditForDetails?.variance ?? '—'}</span>
            </div>
            {selectedAuditForDetails?.reason && (
              <div className="flex justify-between">
                <span className="text-slate-400">Variance Reason:</span>
                <span className="text-slate-300 text-right">{selectedAuditForDetails.reason}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Initiated By:</span>
              <span className="text-slate-300">{selectedAuditForDetails?.countedByName || 'Authorized Staff'}</span>
            </div>
            {selectedAuditForDetails?.reconciledByName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reconciled By:</span>
                <span className="text-emerald-400">{selectedAuditForDetails.reconciledByName}</span>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
