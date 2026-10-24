import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface EnquiryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: any) => Promise<void>;
    initialData?: any;
}

export function EnquiryFormModal({ isOpen, onClose, onSubmit, initialData }: EnquiryFormModalProps) {
    const { activeUnitId, user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [clientName, setClientName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [mode, setMode] = useState<'Call' | 'Walk-in' | 'Website' | 'Reference'>('Call');
    const [status, setStatus] = useState<'Open' | 'In Progress' | 'Converted' | 'Lost' | 'Emergency' | 'Important' | 'Just Enquiry'>('Open');
    const [comments, setComments] = useState('');

    // Patient & Location Meta
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientGender, setPatientGender] = useState('');
    const [patientHealthCondition, setPatientHealthCondition] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientLocation, setClientLocation] = useState('');
    const [remarks, setRemarks] = useState('');

    // Service Requirements
    const [staffRequired, setStaffRequired] = useState<number>(1);
    const [shift, setShift] = useState('12 Hours Day');
    const [frequency, setFrequency] = useState('Daily');
    const [specialInstructions, setSpecialInstructions] = useState('');

    useEffect(() => {
        if (initialData) {
            setClientName(initialData.client?.name || initialData.clientName || '');
            setMobile(initialData.client?.mobile || initialData.mobile || '');
            setEmail(initialData.client?.email || initialData.email || '');
            setMode(initialData.mode || 'Call');
            setStatus(initialData.status || 'Open');
            setComments(initialData.description || initialData.comments || '');

            let meta: any = {};
            if (typeof initialData.rawMessage === 'string') {
                try { meta = JSON.parse(initialData.rawMessage); } catch {}
            } else if (typeof initialData.rawMessage === 'object' && initialData.rawMessage !== null) {
                meta = initialData.rawMessage;
            }

            setPatientName(meta.patientName || '');
            setPatientAge(meta.patientAge || '');
            setPatientGender(meta.patientGender || '');
            setPatientHealthCondition(meta.patientHealthCondition || '');
            setClientAddress(initialData.client?.address || meta.clientAddress || '');
            setClientLocation(meta.clientLocation || '');
            setRemarks(meta.remarks || '');

            const reqs = initialData.serviceRequirements || {};
            setStaffRequired(reqs.staffRequired || 1);
            setShift(reqs.shift || '12 Hours Day');
            setFrequency(reqs.frequency || 'Daily');
            setSpecialInstructions(reqs.specialInstructions || '');
        } else {
            setClientName('');
            setMobile('');
            setEmail('');
            setMode('Call');
            setStatus('Open');
            setComments('');
            setPatientName('');
            setPatientAge('');
            setPatientGender('');
            setPatientHealthCondition('');
            setClientAddress('');
            setClientLocation('');
            setRemarks('');
            setStaffRequired(1);
            setShift('12 Hours Day');
            setFrequency('Daily');
            setSpecialInstructions('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const targetUnitId = activeUnitId || user?.unitId || '';

        const payload = {
            clientName,
            mobile,
            email: email || undefined,
            unitId: targetUnitId || undefined,
            mode,
            status,
            comments: comments || `Home Care Enquiry for ${patientName || clientName}`,
            patientName: patientName || clientName,
            patientAge,
            patientGender,
            patientHealthCondition,
            clientAddress,
            clientLocation,
            remarks,
            serviceRequirements: {
                staffRequired: Number(staffRequired),
                shift,
                frequency,
                specialInstructions
            }
        };

        try {
            await onSubmit(payload);
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to save Home Care enquiry.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white dark:bg-[#072E33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden my-8">
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Edit Home Care Enquiry' : 'New Home Care Enquiry'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 text-sm rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Client/Prospect Info */}
                    <div>
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider mb-3">1. Client & Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Client / Family Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="e.g. Rajesh Kumar"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Mobile Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. client@example.com"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Enquiry Mode
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as any)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                >
                                    <option value="Call">Phone Call</option>
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Website">Website</option>
                                    <option value="Reference">Reference</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Patient Info */}
                    <div>
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider mb-3">2. Patient & Care Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Patient Name
                                </label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder="e.g. Senthil Nathan"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Age
                                </label>
                                <input
                                    type="text"
                                    value={patientAge}
                                    onChange={(e) => setPatientAge(e.target.value)}
                                    placeholder="e.g. 72"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Gender
                                </label>
                                <select
                                    value={patientGender}
                                    onChange={(e) => setPatientGender(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Health Condition
                                </label>
                                <input
                                    type="text"
                                    value={patientHealthCondition}
                                    onChange={(e) => setPatientHealthCondition(e.target.value)}
                                    placeholder="e.g. Post-stroke rehabilitation"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Location / Landmark
                                </label>
                                <input
                                    type="text"
                                    value={clientLocation}
                                    onChange={(e) => setClientLocation(e.target.value)}
                                    placeholder="e.g. Annanagar East"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                Home Address
                            </label>
                            <textarea
                                rows={2}
                                value={clientAddress}
                                onChange={(e) => setClientAddress(e.target.value)}
                                placeholder="Full home care delivery address"
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                            />
                        </div>
                    </div>

                    {/* Section 3: Service Requirements */}
                    <div>
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider mb-3">3. Service Requirements</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Caregivers Required
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={staffRequired}
                                    onChange={(e) => setStaffRequired(Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Shift / Hours
                                </label>
                                <select
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                >
                                    <option value="12 Hours Day">12 Hours Day</option>
                                    <option value="12 Hours Night">12 Hours Night</option>
                                    <option value="24 Hours Resident">24 Hours Resident</option>
                                    <option value="Visit Based">Visit Based</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Alternate Days">Alternate Days</option>
                                    <option value="Monthly Contract">Monthly Contract</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                Special Care Instructions
                            </label>
                            <textarea
                                rows={2}
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="Specific care needs, medications, mobility support..."
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C]"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-[#6DA5C0]/15">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-[#B8D9E8] hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-bold text-white bg-[#0F969C] hover:bg-[#0C7075] rounded-xl shadow-md transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : initialData ? 'Update Enquiry' : 'Create Home Care Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
