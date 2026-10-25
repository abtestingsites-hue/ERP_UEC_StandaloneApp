import { useState, useMemo, useEffect } from 'react';
import { Pill, CheckCircle2, ChevronDown, Activity, ClipboardList, Clock } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Modal } from '../../../components/Modal';
import { usePatients } from '../../patients/hooks/usePatients';
import { useMedicationSchedules, useAdministerMedicationDose, useMedicationLogs } from '../hooks/useMedication';
import { useAuthStore } from '../../../store/authStore';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function Medication() {
    const { data: patients = [], isLoading: loadingPatients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'schedules' | 'logs'>('schedules');

    // Modals
    const [administeringSlot, setAdministeringSlot] = useState<{ id: string; slot: string; medicineName: string; dose: string } | null>(null);
    const [remarks, setRemarks] = useState('');

    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const user = useAuthStore((state: any) => state.user);
    const userRoleStr = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    const isRestrictedRole = !['SUPER_ADMIN', 'NURSING_MANAGER', 'NURSING_SUPER_HEAD', 'MEDICAL_MANAGER', 'ELDER_OPERATIONS_MANAGER', 'CARE_ALLOCATION_MANAGER', 'NURSING_CARE_STAFF'].includes(String(userRoleStr || '').trim().toUpperCase().replace(/\s+/g, '_'));
    const canAdminister = !isRestrictedRole;

    useEffect(() => {
        if (urlPatientId) {
            setSelectedPatientId(urlPatientId);
        }
    }, [urlPatientId]);

    const { data: schedules = [], isLoading: loadingSchedules } = useMedicationSchedules(null, selectedPatientId, { enabled: Boolean(selectedPatientId) });
    const { data: logs = [], isLoading: loadingLogs } = useMedicationLogs(selectedPatientId, null, { enabled: Boolean(selectedPatientId) });

    const administerDose = useAdministerMedicationDose();

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

    const handleAdminister = () => {
        if (!administeringSlot) return;
        const assignmentId = searchParams.get('assignmentId');

        administerDose.mutate({
            id: administeringSlot.id,
            slot: administeringSlot.slot,
            remarks,
            assignmentId: assignmentId || undefined
        }, {
            onSuccess: () => {
                setAdministeringSlot(null);
                setRemarks('');
            }
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Medication Administration"
                subtitle="Track and administer patient medication schedules"
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'Medication' }]}
            />

            {/* PATIENT SELECTION */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                {!isRestrictedRole && (
                    <div className="max-w-md mb-5">
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
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                        <Activity className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium">Select a patient to view their medication schedule.</p>
                    </div>
                )}
            </div>

            {selectedPatientId && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('schedules')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'schedules' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Clock className="h-4 w-4" />
                            Today's Schedule
                        </button>
                        {!isRestrictedRole && (
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                                    activeTab === 'logs' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <ClipboardList className="h-4 w-4" />
                                Administration Logs
                            </button>
                        )}
                    </div>

                    <div className="p-5">
                        {activeTab === 'schedules' ? (
                            <div>
                                {loadingSchedules ? (
                                    <div className="py-12 text-center text-sm font-bold text-gray-500 animate-pulse">Loading schedules...</div>
                                ) : schedules.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500">
                                        <Pill className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                        <p className="font-semibold text-gray-600">No medications scheduled for today.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {schedules.map((schedule: any) => {
                                            const times = Array.isArray(schedule.times) ? schedule.times : [];
                                            const administeredSlots = Array.isArray(schedule.administeredSlots) ? schedule.administeredSlots : [];

                                            return (
                                                <div key={schedule.id} className="rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-100 transition-colors">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                        <div className="flex gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                                                <Pill className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-bold text-gray-900">{schedule.medicineName}</h4>
                                                                <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 font-medium">{schedule.dose}</span>
                                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 font-medium">{schedule.frequency}</span>
                                                                </div>
                                                                {schedule.notes && <p className="mt-2 text-sm text-gray-500 italic">"{schedule.notes}"</p>}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Scheduled Times</div>
                                                            {times.map((timeSlot: string) => {
                                                                const isAdministered = administeredSlots.includes(timeSlot);
                                                                return (
                                                                    <div key={timeSlot} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2">
                                                                        <span className="font-bold text-gray-700">{timeSlot}</span>
                                                                        {isAdministered ? (
                                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                                                                                <CheckCircle2 className="h-4 w-4" /> Administered
                                                                            </span>
                                                                        ) : (
                                                                            canAdminister && (
                                                                                <button
                                                                                    onClick={() => setAdministeringSlot({ id: schedule.id, slot: timeSlot, medicineName: schedule.medicineName, dose: schedule.dose })}
                                                                                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                                                >
                                                                                    Administer
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                {loadingLogs ? (
                                    <div className="py-12 text-center text-sm font-bold text-gray-500 animate-pulse">Loading logs...</div>
                                ) : logs.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500">
                                        <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                        <p className="font-semibold text-gray-600">No medication administration records found.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold">Time</th>
                                                    <th className="px-4 py-3 font-bold">Medication</th>
                                                    <th className="px-4 py-3 font-bold">Dosage Given</th>
                                                    <th className="px-4 py-3 font-bold">Administered By</th>
                                                    <th className="px-4 py-3 font-bold">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                                {logs.map((log: any) => (
                                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {log.administeredAt ? format(new Date(log.administeredAt), 'dd MMM yyyy HH:mm') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-gray-900">{log.medication}</td>
                                                        <td className="px-4 py-3 text-gray-700">{log.dosageGiven}</td>
                                                        <td className="px-4 py-3 text-gray-700">{log.administeredBy || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{log.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={Boolean(administeringSlot)}
                onClose={() => setAdministeringSlot(null)}
                title="Administer Medication Dose"
                confirmLabel="Confirm Administration"
                onConfirm={handleAdminister}
                confirmDisabled={administerDose.isPending}
            >
                <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Time Slot: {administeringSlot?.slot}</div>
                        <p className="text-base font-bold text-gray-900">{administeringSlot?.medicineName}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-1">Dose: {administeringSlot?.dose}</p>
                    </div>
                    
                    <label className="block text-sm font-bold text-gray-700">
                        Administration Remarks (Optional)
                        <textarea 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)} 
                            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                            placeholder="Patient responded well, taken with water..." 
                            rows={3}
                        />
                    </label>
                </div>
            </Modal>
        </div>
    );
}
