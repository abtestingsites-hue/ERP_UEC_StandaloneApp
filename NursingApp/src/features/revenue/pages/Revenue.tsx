import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Receipt, Package, DollarSign, AlertCircle, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { useMyShift } from '../../my-shift/hooks/useMyShift';
import { useTodayRevenue, useCreateRevenueEntry } from '../hooks/useRevenue';

const REVENUE_CATEGORIES = [
  'Diaper',
  'Gloves',
  'Mask',
  'EC Bath',
  'Underpad / Rubber Sheet',
  'Catheter / Uro Bag',
  'Doctor Checkup',
  'Injection',
  'Dressing',
  'Hygiene / Personal Care',
  'Other Care Items'
];

const formatCurrency = (val: number) => `₹${Number(val || 0).toFixed(2)}`;

const getTodayDateString = () => {
  return Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
};

export default function Revenue() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const assignmentId = searchParams.get('assignmentId');

  const { data: shiftData } = useMyShift();
  const currentAssignment = useMemo(() => {
    if (!shiftData?.assignments || !assignmentId) return null;
    return shiftData.assignments.find((a: any) => a.id === assignmentId || a.patientId === patientId);
  }, [shiftData, assignmentId, patientId]);

  const patientName = currentAssignment?.patient?.name || 'Patient';

  const { data: revenueData, isLoading, isError, error, refetch } = useTodayRevenue(patientId, assignmentId);
  const createMutation = useCreateRevenueEntry(patientId, assignmentId);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState(REVENUE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [rate, setRate] = useState<number | ''>(0);
  const [formError, setFormError] = useState<string | null>(null);

  const calculatedAmount = useMemo(() => {
    const q = typeof quantity === 'number' ? quantity : 0;
    const r = typeof rate === 'number' ? rate : 0;
    return Number((q * r).toFixed(2));
  }, [quantity, rate]);

  const handleOpenModal = () => {
    setCategory(REVENUE_CATEGORIES[0]);
    setDescription('');
    setQuantity(1);
    setRate(0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!assignmentId) {
      setFormError('Missing shift assignment context');
      return;
    }

    if (!description.trim()) {
      setFormError('Description is required');
      return;
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate < 0) {
      setFormError('Rate cannot be negative');
      return;
    }

    const todayDate = getTodayDateString();

    try {
      await createMutation.mutateAsync({
        assignmentId,
        careDate: todayDate,
        category,
        description: description.trim(),
        quantity: numQty,
        rate: numRate
      });
      handleCloseModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record revenue entry';
      setFormError(msg);
    }
  };

  if (!patientId || !assignmentId) {
    return (
      <div className="flex h-full flex-col space-y-6">
        <PageHeader
          title="Revenue / Usage"
          subtitle="Invalid context"
          breadcrumbs={[{ label: 'Nursing Care' }, { label: 'My Shift' }, { label: 'Revenue' }]}
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400 mb-3" />
          <h3 className="text-lg font-extrabold text-amber-900 dark:text-amber-200 mb-1">Shift Assignment Context Required</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto mb-6">
            Revenue and usage must be accessed directly from an assigned patient within your active shift.
          </p>
          <Link
            to="/my-shift"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Go to My Shift
          </Link>
        </div>
      </div>
    );
  }

  const todayStr = getTodayDateString();

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="Revenue / Usage"
        subtitle={`${patientName} — Today (${todayStr})`}
        breadcrumbs={[{ label: 'Nursing Care' }, { label: 'My Shift' }, { label: 'Revenue / Usage' }]}
      />


      {/* Patient Header Card */}
      <div className="rounded-2xl border border-teal-100 dark:border-teal-900/50 bg-white dark:bg-[#0A262C] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{patientName}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Assigned Patient
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            PT-{patientId.substring(0, 4).toUpperCase()} &bull; Date: {todayStr}
          </p>
        </div>

        {currentAssignment && !['WAITING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED'].includes(currentAssignment.status) && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Usage
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <Receipt className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Manual Usage</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatCurrency(revenueData?.summary?.manualTotal || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-950/20 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inventory Issued</span>
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
            {formatCurrency(revenueData?.summary?.inventoryTotal || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-600 text-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <DollarSign className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Total Usage</span>
          </div>
          <p className="text-2xl font-black text-white">
            {formatCurrency(revenueData?.summary?.totalAmount || 0)}
          </p>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-600 dark:text-teal-400">
          <Loader2 className="h-10 w-10 animate-spin mb-3" />
          <p className="text-sm font-bold animate-pulse">Loading today's usage records...</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-600 dark:text-rose-400 mb-2" />
          <p className="text-rose-800 dark:text-rose-200 font-bold mb-3">
            {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load usage data'}
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Manual Nursing Usage */}
          <div className="rounded-2xl border border-slate-200 dark:border-teal-900/60 bg-white dark:bg-[#0A262C] shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 dark:border-teal-900/40 bg-slate-50/60 dark:bg-slate-900/30 p-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Manual Nursing Usage
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {revenueData?.manualEntries?.length || 0} items
              </span>
            </div>

            <div className="p-4">
              {!revenueData?.manualEntries?.length ? (
                <p className="py-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                  No manual nursing usage recorded today.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-teal-900/30 text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-3 text-right">Qty</th>
                        <th className="py-3 px-3 text-right">Rate</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-teal-900/20">
                      {revenueData.manualEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-teal-950/20 transition-colors">
                          <td className="py-3 px-3">
                            {entry.sourceType === 'NURSING_MANUAL_ENTRY' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                MANUAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                EXISTING
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{entry.category}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{entry.description}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-200">{entry.quantity}</td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(entry.rate)}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(entry.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Inventory Issued (Read-Only) */}
          <div className="rounded-2xl border border-slate-200 dark:border-teal-900/60 bg-white dark:bg-[#0A262C] shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 dark:border-teal-900/40 bg-slate-50/60 dark:bg-slate-900/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Inventory Issued
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  READ-ONLY
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {revenueData?.inventoryEntries?.length || 0} items
              </span>
            </div>

            <div className="p-4">
              {!revenueData?.inventoryEntries?.length ? (
                <p className="py-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                  No inventory-issued items today.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-teal-900/30 text-xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-3 text-right">Qty</th>
                        <th className="py-3 px-3 text-right">Rate</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-teal-900/20">
                      {revenueData.inventoryEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-teal-950/20 transition-colors">
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              INVENTORY
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{entry.category}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{entry.description}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-200">{entry.quantity}</td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(entry.rate)}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(entry.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD USAGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-teal-900 bg-white dark:bg-[#0A262C] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-900/50 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Add Patient Revenue / Usage</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  Recording for: <span className="text-teal-700 dark:text-teal-300 font-extrabold">{patientName}</span> ({todayStr})
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-teal-800 bg-white dark:bg-[#05161A] p-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                >
                  {REVENUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Diaper usage - 2 units"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-teal-800 bg-white dark:bg-[#05161A] p-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-teal-800 bg-white dark:bg-[#05161A] p-3 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-teal-800 bg-white dark:bg-[#05161A] p-3 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Amount Preview */}
              <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/30 p-3 flex items-center justify-between">
                <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300">Live Calculated Total:</span>
                <span className="text-base font-black text-teal-700 dark:text-teal-400">{formatCurrency(calculatedAmount)}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-300 dark:border-teal-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-5 py-2.5 text-sm font-extrabold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Save Usage
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
