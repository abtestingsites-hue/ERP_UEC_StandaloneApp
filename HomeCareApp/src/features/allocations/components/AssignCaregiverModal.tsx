import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';

interface AssignCaregiverModalProps {
    isOpen: boolean;
    onClose: () => void;
    allocation: any;
    unallocatedList?: any[];
    staffList: any[];
    onAssign: (payload: any) => Promise<void>;
}

export function AssignCaregiverModal({
    isOpen,
    onClose,
    allocation,
    unallocatedList = [],
    staffList,
    onAssign
}: AssignCaregiverModalProps) {
    const [currentTarget, setCurrentTarget] = useState<any>(null);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const target = allocation || (unallocatedList.length > 0 ? unallocatedList[0] : null);
            setCurrentTarget(target);

            if (target) {
                setSelectedStaffId(target.staffId || target.staff?.id || '');
                const now = new Date();
                const defaultStart = target.serviceContract?.startDate || target.startDate || now.toISOString();
                setStartDate(defaultStart ? new Date(defaultStart).toISOString() : now.toISOString());

                const defaultEnd = target.serviceContract?.endDate || target.endDate || '';
                setEndDate(defaultEnd ? new Date(defaultEnd).toISOString() : '');

                setNotes(target.metadata?.notes || target.serviceContract?.specialInstructions || '');
            } else {
                setSelectedStaffId('');
                setStartDate(new Date().toISOString());
                setEndDate('');
                setNotes('');
            }
            setError('');
        }
    }, [allocation, unallocatedList, isOpen]);

    if (!isOpen) return null;

    const handleTargetChange = (targetId: string) => {
        const found = unallocatedList.find((item: any) => item.id === targetId || item.enquiryId === targetId);
        if (found) {
            setCurrentTarget(found);
            const now = new Date();
            const defaultStart = found.serviceContract?.startDate || found.startDate || now.toISOString();
            setStartDate(defaultStart ? new Date(defaultStart).toISOString() : now.toISOString());
            const defaultEnd = found.serviceContract?.endDate || found.endDate || '';
            setEndDate(defaultEnd ? new Date(defaultEnd).toISOString() : '');
            setNotes(found.serviceContract?.specialInstructions || '');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentTarget) {
            setError('Please select an active admission target.');
            return;
        }

        if (!selectedStaffId) {
            setError('Please select a caregiver to assign.');
            return;
        }

        const enqId = currentTarget.enquiryId || currentTarget.enquiry?.id;
        if (!enqId) {
            setError('Selected admission does not have a valid enquiry reference.');
            return;
        }

        const selectedStaff = staffList.find((s: any) => s.id === selectedStaffId);

        setIsSubmitting(true);
        try {
            await onAssign({
                enquiryId: enqId,
                staffId: selectedStaffId,
                targetUnitId: selectedStaff?.unitId || currentTarget?.unitId,
                startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                metadata: {
                    ...(currentTarget.metadata || {}),
                    notes,
                    patientName: currentTarget.patient?.name || currentTarget.resolvedPatient?.name || currentTarget.enquiry?.client?.name,
                    contractNumber: currentTarget.serviceContract?.contractNumber
                }
            });
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to assign caregiver.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isReassign = Boolean(currentTarget?.staffId || currentTarget?.staff?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white dark:bg-[#072E33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#6DA5C0]/15 overflow-hidden my-8">
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center space-x-2">
                        <UserCheck className="w-5 h-5 text-[#0F969C]" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isReassign ? 'Reassign Home Care Caregiver' : 'Assign Home Care Caregiver'}
                        </h3>
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

                    {/* Target Selector if opened without specific allocation and multiple unallocated admissions exist */}
                    {!allocation && unallocatedList.length > 1 ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Select Active Admission / Contract *
                            </label>
                            <select
                                value={currentTarget?.id || ''}
                                onChange={(e) => handleTargetChange(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm font-semibold"
                            >
                                {unallocatedList.map((item: any) => {
                                    const pName = item.patient?.name || item.enquiry?.client?.name || 'Patient';
                                    const cNo = item.serviceContract?.contractNumber || 'Contract';
                                    return (
                                        <option key={item.id} value={item.id}>
                                            {pName} ({cNo}) - {item.serviceContract?.shift || '12 Hours Day'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    ) : currentTarget ? (
                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-[#6DA5C0]/15 space-y-1">
                            <p className="text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase">Client / Contract Target</p>
                            <div className="flex items-center justify-between">
                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                    {currentTarget?.patient?.name || currentTarget?.enquiry?.client?.name || 'Home Care Patient'}
                                </p>
                                <span className="text-xs font-mono font-bold bg-[#0F969C]/10 text-[#0F969C] px-2 py-0.5 rounded">
                                    {currentTarget?.serviceContract?.contractNumber || 'Contract Not Generated'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-[#B8D9E8]">
                                Service: {currentTarget?.serviceContract?.serviceName || currentTarget?.enquiry?.service?.name || 'Home Care Service'} • Shift: {currentTarget?.serviceContract?.shift || '12 Hours Day'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">No active unallocated contracts found.</p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Please ensure a Service Contract is ACTIVE before assigning a caregiver.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                            Select Caregiver / Staff *
                        </label>
                        <select
                            required
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                        >
                            <option value="">
                                {staffList.length > 0 ? 'Select Caregiver' : 'No eligible Home Care caregivers available'}
                            </option>
                            {staffList.map((st: any) => {
                                const name = st.firstName ? `${st.firstName} ${st.lastName || ''}`.trim() : (st.name || 'Staff Member');
                                return (
                                    <option key={st.id} value={st.id}>
                                        {name} {st.empId ? `(${st.empId})` : ''} - {st.designation || 'Caregiver'}
                                    </option>
                                );
                            })}
                        </select>
                        {staffList.length === 0 && (
                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                No eligible Home Care caregivers available.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                                Duty Start Date *
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
                                Duty End Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={endDate ? endDate.slice(0, 16) : ''}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white p-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-[#D8EEF5] uppercase mb-1">
                            Caregiver Duty Notes / Instructions
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Special caregiver instructions, patient care needs, timing preference..."
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
                            {isSubmitting ? 'Assigning...' : isReassign ? 'Confirm Reassignment' : 'Assign Caregiver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

