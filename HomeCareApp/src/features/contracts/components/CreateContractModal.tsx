import { useState, useEffect } from 'react';
import { X, FileSignature } from 'lucide-react';

interface CreateContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    admission: any;
    onSubmit: (payload: any) => Promise<void>;
}

export function CreateContractModal({ isOpen, onClose, admission, onSubmit }: CreateContractModalProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [staffRequired, setStaffRequired] = useState<number>(1);
    const [shift, setShift] = useState('12 Hours Day');
    const [frequency, setFrequency] = useState('Daily');
    const [servicePrice, setServicePrice] = useState<number | ''>('');
    const [billingCycle, setBillingCycle] = useState('Monthly');
    const [specialInstructions, setSpecialInstructions] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (admission && isOpen) {
            const now = new Date();
            setStartDate(now.toISOString());

            const enquiryReqs = admission.enquiry?.serviceRequirements || {};
            setStaffRequired(enquiryReqs.staffRequired || 1);
            setShift(enquiryReqs.shift || '12 Hours Day');
            setFrequency(enquiryReqs.frequency || 'Daily');
            setSpecialInstructions(enquiryReqs.specialInstructions || '');
            setServicePrice(admission.enquiry?.service?.price || '');
            setBillingCycle('Monthly');
            setError('');
        }
    }, [admission, isOpen]);

    if (!isOpen || !admission) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!startDate) {
            setError('Please select a contract start date.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                admissionId: admission.id,
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                staffRequired: Number(staffRequired),
                shift,
                frequency,
                servicePrice: servicePrice !== '' ? Number(servicePrice) : null,
                billingCycle,
                specialInstructions
            });
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to create draft contract.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-white dark:bg-[#072E33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden my-8">
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center space-x-2">
                        <FileSignature className="w-5 h-5 text-[#0F969C]" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Draft Home Care Service Contract</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 text-sm rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-[#6DA5C0]/15">
                        <p className="text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase">Target Admission</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                            {admission.patient?.name || admission.enquiry?.client?.name || 'Home Care Patient'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                            Ref: {admission.enquiry?.refNo || admission.id} • Unit: {admission.unitId}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Start Date *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={startDate ? startDate.slice(0, 16) : ''}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                End Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={endDate ? endDate.slice(0, 16) : ''}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Staff Required
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={staffRequired}
                                onChange={(e) => setStaffRequired(Number(e.target.value))}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Shift / Hours
                            </label>
                            <select
                                value={shift}
                                onChange={(e) => setShift(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            >
                                <option value="12 Hours Day">12 Hours Day</option>
                                <option value="12 Hours Night">12 Hours Night</option>
                                <option value="24 Hours Resident">24 Hours Resident</option>
                                <option value="Visit Based">Visit Based</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Alternate Days">Alternate Days</option>
                                <option value="Monthly Contract">Monthly Contract</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Service Price (₹)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={servicePrice}
                                onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="e.g. 15000"
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Billing Cycle
                            </label>
                            <select
                                value={billingCycle}
                                onChange={(e) => setBillingCycle(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Per Shift">Per Shift</option>
                                <option value="One-time">One-time</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                            Special Instructions / Care Requirements
                        </label>
                        <textarea
                            rows={2}
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Special care notes, instructions..."
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-[#6DA5C0]/15">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-[#B8D9E8] hover:bg-gray-100 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-bold text-white bg-[#0F969C] hover:bg-[#0C7075] rounded-xl shadow-md disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating Draft...' : 'Create Draft Contract'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
