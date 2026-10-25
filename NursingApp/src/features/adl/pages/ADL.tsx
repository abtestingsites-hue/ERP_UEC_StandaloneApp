import { useState, useMemo, useEffect } from 'react';
import { Plus, CheckCircle2, ChevronDown, Activity, XCircle, Clock, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Modal } from '../../../components/Modal';
import { usePatients } from '../../patients/hooks/usePatients';
import { useAdlRecords, useCreateAdlRecord, useUpdateAdlStatus } from '../hooks/useADL';
import { useAuthStore } from '../../../store/authStore';
import { useSearchParams } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';

export default function ADL() {
    const { data: patients = [], isLoading: loadingPatients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [verificationModal, setVerificationModal] = useState<{ isOpen: boolean; recordId: string | null }>({ isOpen: false, recordId: null });
    
    // Form States
    const [verificationNotes, setVerificationNotes] = useState('');
    const [formData, setFormData] = useState({
        activityCategory: '',
        isMandatory: false,
        scheduledDate: '',
        mobility: '',
        hygiene: '',
        feeding: '',
        notes: ''
    });

    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const user = useAuthStore((state: any) => state.user);
    const userRoleStr = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'NURSING_SUPER_HEAD', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER', 'NURSING_CARE_STAFF'].includes(String(userRoleStr || '').trim().toUpperCase().replace(/\s+/g, '_'));

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId);
        }
    }, [urlPatientId]);

    const { data: allAdlRecords = [], isLoading: loadingAdl } = useAdlRecords(selectedPatientId, null, { enabled: Boolean(selectedPatientId) });
    const createAdl = useCreateAdlRecord();
    const updateStatus = useUpdateAdlStatus();

    // Filter to today only for Nurses
    const adlRecords = useMemo(() => {
        if (!isRestrictedRole) return allAdlRecords;
        const today = new Date();
        return allAdlRecords.filter((record: any) => {
            const recordDate = record.scheduledDate ? new Date(record.scheduledDate) : new Date(record.createdAt || today);
            return isSameDay(recordDate, today);
        });
    }, [allAdlRecords, isRestrictedRole]);

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

    const patientOptions = useMemo(() => {
        const options = patients.map(p => ({ id: p.id, name: p.name }));
        if (urlPatientId && !options.some(option => option.id === urlPatientId)) {
            options.unshift({
                id: urlPatientId,
                name: selectedPatient?.name || 'Selected patient'
            });
        }
        return options;
    }, [patients, selectedPatient, urlPatientId]);

    const handleAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !formData.activityCategory.trim()) return;

        const assignmentId = searchParams.get('assignmentId');

        createAdl.mutate({
            ...formData,
            patientId: selectedPatientId,
            assignmentId: assignmentId || undefined,
            scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setFormData({
                    activityCategory: '',
                    isMandatory: false,
                    scheduledDate: '',
                    mobility: '',
                    hygiene: '',
                    feeding: '',
                    notes: ''
                });
            }
        });
    };

    const handleVerify = () => {
        if (!verificationModal.recordId) return;
        const assignmentId = searchParams.get('assignmentId');

        updateStatus.mutate({
            id: verificationModal.recordId,
            status: 'VERIFIED',
            verificationNotes,
            assignmentId: assignmentId || undefined
        }, {
            onSuccess: () => {
                setVerificationModal({ isOpen: false, recordId: null });
                setVerificationNotes('');
                alert('ADL verified successfully');
            }
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED':
            case 'VERIFIED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ASSIGNED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'REFUSED':
            case 'MISSED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'VERIFICATION_REQUIRED':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Activities of Daily Living"
                subtitle="Track and manage patient ADL records and workflows"
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'ADL' }]}
            />

            {/* PATIENT SELECTION / CONTEXT */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                {!isRestrictedRole ? (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
                        <div className="w-full max-w-md">
                            <label className="block text-sm font-bold text-gray-700">
                                Select Patient
                            </label>
                            <div className="relative mt-1">
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    disabled={loadingPatients}
                                    className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                                >
                                    <option value="">-- Search patient name / patient ID --</option>
                                    {patientOptions.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name} (PT-{patient.id.substring(0, 4).toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        {selectedPatientId && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Assign New ADL
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-end mb-5">
                        {selectedPatientId && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Schedule Care Task
                            </button>
                        )}
                    </div>
                )}

                {selectedPatientId && selectedPatient ? (
                    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Patient Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 mb-1">Patient Name</div>
                                <div className="font-bold text-gray-900">{selectedPatient.name}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Patient ID</div>
                                <div className="font-semibold text-gray-900">PT-{selectedPatientId.substring(0, 4).toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Status</div>
                                <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                                    ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 border-t border-gray-100 mt-5">
                        <Activity className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium">Select a patient to view and manage ADL records.</p>
                    </div>
                )}
            </div>

            {/* ADL RECORDS LIST */}
            {selectedPatientId && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4 items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-gray-500" />
                            Patient ADL Records
                        </h3>
                        {loadingAdl && <span className="text-xs font-bold text-blue-600 animate-pulse">Loading records...</span>}
                    </div>

                    <div className="p-0">
                        {!loadingAdl && adlRecords.length === 0 ? (
                            <div className="py-16 text-center text-gray-500">
                                <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <p className="text-base font-bold text-gray-700">No ADL records found.</p>
                                <p className="text-sm text-gray-500 mt-1">Assign a new ADL activity to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Activity / Type</th>
                                            <th className="px-6 py-4 font-bold">Scheduled For</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold">Details</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {adlRecords.map((record: any) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{record.activityCategory}</div>
                                                    <div className="mt-1">
                                                        {record.isMandatory ? (
                                                            <span className="inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-100">Mandatory</span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 border border-gray-200">Optional</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700">
                                                    {record.scheduledDate ? format(new Date(record.scheduledDate), 'dd MMM yyyy HH:mm') : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(record.status)}`}>
                                                        {record.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-xs text-gray-500 max-w-xs whitespace-normal break-words">
                                                        {record.mobility && <div><span className="font-semibold text-gray-700">Mobility:</span> {record.mobility}</div>}
                                                        {record.hygiene && <div><span className="font-semibold text-gray-700">Hygiene:</span> {record.hygiene}</div>}
                                                        {record.feeding && <div><span className="font-semibold text-gray-700">Feeding:</span> {record.feeding}</div>}
                                                        {record.notes && <div><span className="font-semibold text-gray-700">Notes:</span> {record.notes}</div>}
                                                        {(!record.mobility && !record.hygiene && !record.feeding && !record.notes) && '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {record.status === 'ASSIGNED' && (
                                                            <>
                                                                <button
                                                                    onClick={() => updateStatus.mutate({ id: record.id, status: 'COMPLETED' }, { onSuccess: () => alert('Marked as Completed') })}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                                                                    title="Mark Completed"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus.mutate({ id: record.id, status: 'REFUSED' }, { onSuccess: () => alert('Marked as Refused') })}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200"
                                                                    title="Mark Refused"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus.mutate({ id: record.id, status: 'MISSED' }, { onSuccess: () => alert('Marked as Missed') })}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors border border-yellow-200"
                                                                    title="Mark Missed"
                                                                >
                                                                    <Clock className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {(record.status === 'COMPLETED' || record.status === 'REFUSED' || record.status === 'MISSED') && record.requiresVerification && (
                                                            <button
                                                                onClick={() => updateStatus.mutate({ id: record.id, status: 'VERIFICATION_REQUIRED' })}
                                                                className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                                                            >
                                                                Request Verification
                                                            </button>
                                                        )}
                                                        {record.status === 'VERIFICATION_REQUIRED' && (
                                                            <button
                                                                onClick={() => setVerificationModal({ isOpen: true, recordId: record.id })}
                                                                className="rounded-lg bg-blue-600 border border-transparent px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                Verify
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ASSIGN ADL MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Assign New ADL"
                confirmLabel="Assign ADL"
                onConfirm={handleAssignSubmit as any}
                confirmDisabled={createAdl.isPending || !formData.activityCategory.trim()}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Activity Category <span className="text-red-500">*</span></label>
                        <input 
                            value={formData.activityCategory} 
                            onChange={(e) => setFormData(prev => ({ ...prev, activityCategory: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                            placeholder="e.g. Morning Routine, Evening Walk" 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isMandatory"
                            checked={formData.isMandatory}
                            onChange={(e) => setFormData(prev => ({ ...prev, isMandatory: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="isMandatory" className="text-sm font-bold text-gray-700">Mandatory Activity</label>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Scheduled Date/Time</label>
                        <input 
                            type="datetime-local"
                            value={formData.scheduledDate} 
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                        />
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Optional Specifics</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Mobility Instructions</label>
                                <input value={formData.mobility} onChange={(e) => setFormData(prev => ({ ...prev, mobility: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Walked with support / bed rest" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Hygiene Instructions</label>
                                <input value={formData.hygiene} onChange={(e) => setFormData(prev => ({ ...prev, hygiene: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Bathing, grooming" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Feeding Instructions</label>
                                <input value={formData.feeding} onChange={(e) => setFormData(prev => ({ ...prev, feeding: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Self-fed / assisted" />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <label className="block text-sm font-bold text-gray-700">General Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Observation, discomfort..."
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>

            {/* VERIFY MODAL */}
            <Modal
                isOpen={verificationModal.isOpen}
                onClose={() => setVerificationModal({ isOpen: false, recordId: null })}
                title="Verify ADL Record"
                confirmLabel="Confirm Verification"
                onConfirm={handleVerify}
                confirmDisabled={updateStatus.isPending}
            >
                <div className="mt-4">
                    <p className="mb-4 text-sm text-gray-600">Please provide verification notes to finalize this ADL.</p>
                    <label className="block text-sm font-bold text-gray-700">
                        Verification Notes (Optional)
                        <textarea
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            rows={4}
                            placeholder="Verified and checked..."
                        />
                    </label>
                </div>
            </Modal>
        </div>
    );
}
