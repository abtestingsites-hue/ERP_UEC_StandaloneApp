import { useState, useEffect } from 'react';
import { X, CheckCircle2, FileSignature, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface ContractDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contract: any;
    admission: any;
    onCreateDraft: (admissionId: string) => Promise<void>;
    onActivate: (contractId: string) => Promise<void>;
    onUpdate: (id: string, payload: any) => Promise<void>;
}

export function ContractDetailsDrawer({
    isOpen,
    onClose,
    contract,
    admission,
    onCreateDraft,
    onActivate,
    onUpdate
}: ContractDetailsDrawerProps) {
    const [isActivating, setIsActivating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form state synced with contract
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [servicePrice, setServicePrice] = useState<number | ''>('');
    const [billingCycle, setBillingCycle] = useState('Monthly');
    const [staffRequired, setStaffRequired] = useState<number>(1);
    const [shift, setShift] = useState('12 Hours Day');
    const [frequency, setFrequency] = useState('Daily');
    const [specialInstructions, setSpecialInstructions] = useState('');

    useEffect(() => {
        if (contract) {
            setStartDate(contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
            setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : '');
            setServicePrice(contract.servicePrice ?? '');
            setBillingCycle(contract.billingCycle || 'Monthly');
            setStaffRequired(contract.staffRequired ?? 1);
            setShift(contract.shift || '12 Hours Day');
            setFrequency(contract.frequency || 'Daily');
            setSpecialInstructions(contract.specialInstructions || '');
        }
    }, [contract]);

    if (!isOpen) return null;

    const hasContract = Boolean(contract && contract.id);
    const isDraft = hasContract && contract.status === 'DRAFT';
    const isActive = hasContract && contract.status === 'ACTIVE';

    const handleGenerateContract = async () => {
        if (!admission?.id) return;
        setIsCreating(true);
        try {
            await onCreateDraft(admission.id);
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleActivate = async () => {
        if (!hasContract) return;
        if (!window.confirm('Are you sure you want to ACTIVATE this contract? Terms will be locked.')) return;
        setIsActivating(true);
        try {
            await onActivate(contract.id);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsActivating(false);
        }
    };

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasContract) return;
        setIsSaving(true);
        try {
            await onUpdate(contract.id, {
                startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                servicePrice: servicePrice !== '' ? Number(servicePrice) : null,
                billingCycle,
                staffRequired: Number(staffRequired),
                shift,
                frequency,
                specialInstructions
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-white dark:bg-[#072E33] h-full shadow-2xl flex flex-col border-l border-gray-100 dark:border-[#6DA5C0]/15">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0F969C]/10 text-[#0F969C] font-bold">
                            {hasContract ? contract.contractNumber : 'NO CONTRACT'}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {admission?.patient?.name || admission?.enquiry?.client?.name || 'Home Care Contract'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status Card */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15">
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase">Contract Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                                isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : isDraft
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                            }`}>
                                {hasContract ? contract.status : 'NO CONTRACT'}
                            </span>
                        </div>
                    </div>

                    {!hasContract ? (
                        /* NO CONTRACT State */
                        <div className="text-center py-12 space-y-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-[#6DA5C0]/20 p-6">
                            <FileSignature className="w-12 h-12 mx-auto text-[#0F969C]/40" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">No Contract Generated</h3>
                                <p className="text-xs text-gray-500 dark:text-[#B8D9E8] mt-1">
                                    A Service Contract has not been drafted for this admission yet.
                                </p>
                            </div>
                            <button
                                onClick={handleGenerateContract}
                                disabled={isCreating}
                                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0F969C] hover:bg-[#0C7075] text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{isCreating ? 'Generating...' : 'Generate Service Contract'}</span>
                            </button>
                        </div>
                    ) : (
                        /* DRAFT / ACTIVE State Form */
                        <form onSubmit={handleSaveDraft} className="space-y-6">
                            {isActive && (
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-start space-x-3 text-xs border border-emerald-200 dark:border-emerald-800/40">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Contract is Active and Locked</p>
                                        <p className="mt-0.5 opacity-90">
                                            Accepted by {contract.termsAcceptedBy?.firstName} {contract.termsAcceptedBy?.lastName || ''} {contract.termsAcceptedAt ? `on ${format(new Date(contract.termsAcceptedAt), 'PPP')}` : ''}. Billing and Caregiver Allocations are enabled.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Service & Schedule Terms */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Service & Schedule Terms</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            disabled={!isDraft}
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                            End Date (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            disabled={!isDraft}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">Staff Req.</label>
                                        <input
                                            type="number"
                                            min={1}
                                            disabled={!isDraft}
                                            value={staffRequired}
                                            onChange={(e) => setStaffRequired(Number(e.target.value))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">Shift</label>
                                        <select
                                            disabled={!isDraft}
                                            value={shift}
                                            onChange={(e) => setShift(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        >
                                            <option value="12 Hours Day">12 Hours Day</option>
                                            <option value="12 Hours Night">12 Hours Night</option>
                                            <option value="24 Hours Resident">24 Hours Resident</option>
                                            <option value="Visit Based">Visit Based</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">Frequency</label>
                                        <select
                                            disabled={!isDraft}
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        >
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Alternate Days">Alternate Days</option>
                                            <option value="Monthly Contract">Monthly Contract</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Terms */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Financial & Billing Terms</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">Service Price (₹)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            disabled={!isDraft}
                                            value={servicePrice}
                                            onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="e.g. 15000"
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">Billing Cycle</label>
                                        <select
                                            disabled={!isDraft}
                                            value={billingCycle}
                                            onChange={(e) => setBillingCycle(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Per Shift">Per Shift</option>
                                            <option value="One-time">One-time</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                    Special Instructions / Care Notes
                                </label>
                                <textarea
                                    rows={2}
                                    disabled={!isDraft}
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    placeholder="Care instructions..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-xs disabled:opacity-60"
                                />
                            </div>

                            {/* DRAFT Action Buttons (Sticky Footer) */}
                            {isDraft && (
                                <div className="sticky bottom-0 bg-white dark:bg-[#072E33] pt-4 pb-2 mt-6 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-[#6DA5C0]/15">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 text-[#0F969C]" />
                                        <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleActivate}
                                        disabled={isActivating}
                                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{isActivating ? 'Activating...' : 'Activate Contract'}</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
