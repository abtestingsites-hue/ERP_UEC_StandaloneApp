import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface ConvertAdmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    enquiry: any;
    onSuccess: () => void;
}

export function ConvertAdmissionModal({ isOpen, onClose, enquiry, onSuccess }: ConvertAdmissionModalProps) {
    const { user, activeUnitId } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const rawMeta = enquiry?.rawMessage;
    let meta: any = {};
    if (typeof rawMeta === 'string') {
        try { meta = JSON.parse(rawMeta); } catch {}
    } else if (typeof rawMeta === 'object' && rawMeta !== null) {
        meta = rawMeta;
    }

    const [patientName, setPatientName] = useState(meta.patientName || enquiry?.client?.name || '');
    const [age, setAge] = useState<number | ''>(meta.patientAge ? Number(meta.patientAge) : '');
    const [gender, setGender] = useState(meta.patientGender || '');
    const [primaryContact, setPrimaryContact] = useState(enquiry?.client?.name || '');
    const [phone, setPhone] = useState(enquiry?.client?.mobile || '');
    const [email, setEmail] = useState(enquiry?.client?.email || '');
    const [address, setAddress] = useState(enquiry?.client?.address || meta.clientLocation || '');
    const [healthCondition, setHealthCondition] = useState(meta.patientHealthCondition || enquiry?.description || '');

    if (!isOpen || !enquiry) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const targetUnitId = enquiry.unitId || activeUnitId || user?.unitId;

        if (!targetUnitId) {
            setError('Destination Unit ID is required for admission handoff.');
            setIsSubmitting(false);
            return;
        }

        const hasServiceReqs = enquiry.serviceRequirements && typeof enquiry.serviceRequirements === 'object' && Object.keys(enquiry.serviceRequirements).length > 0;
        if (!hasServiceReqs) {
            setError('Complete Home Care Service Requirements before converting this enquiry to an admission.');
            setIsSubmitting(false);
            return;
        }

        const isReady = enquiry.followUps?.some(
            (f: any) => f.outcome === 'READY_TO_CONVERT' || f.outcome === 'ADMISSION_PLANNED'
        );

        if (!isReady) {
            try {
                await api.post(`/enquiry/${enquiry.id}/follow-up`, {
                    notes: 'Home Care admission conversion initiated after intake verification.',
                    nextDate: new Date().toISOString(),
                    outcome: 'READY_TO_CONVERT'
                });
                if (!enquiry.followUps) enquiry.followUps = [];
                enquiry.followUps.push({ outcome: 'READY_TO_CONVERT' });
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to create readiness follow-up.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            await api.post(`/enquiry/${enquiry.id}/convert-to-admission`, {
                patientName: patientName || enquiry.client?.name || 'Home Care Patient',
                age: age !== '' ? Number(age) : undefined,
                gender: gender || undefined,
                primaryContact: primaryContact || undefined,
                phone: phone || undefined,
                email: email || undefined,
                address: address || undefined,
                healthCondition: healthCondition || undefined,
                unitId: targetUnitId
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError('Admission conversion could not be completed. The enquiry is still ready for conversion. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white dark:bg-[#072E33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden my-8">
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[#0F969C]" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Convert to Home Care Admission</h3>
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

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                            Ref Number
                        </label>
                        <input
                            type="text"
                            disabled
                            value={enquiry.refNo || enquiry.id}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-gray-100 dark:bg-[#0B2A30] text-gray-500 dark:text-gray-400 p-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                            Patient Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                Patient Age
                            </label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                Gender
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                            Primary Contact Person
                        </label>
                        <input
                            type="text"
                            value={primaryContact}
                            onChange={(e) => setPrimaryContact(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
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
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                            Home Care Address
                        </label>
                        <textarea
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase tracking-wider mb-1">
                            Health Condition & Care Notes
                        </label>
                        <textarea
                            rows={2}
                            value={healthCondition}
                            onChange={(e) => setHealthCondition(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm focus:border-[#0F969C] focus:ring-[#0F969C]"
                        />
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
                            {isSubmitting ? 'Converting...' : 'Confirm Admission'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
