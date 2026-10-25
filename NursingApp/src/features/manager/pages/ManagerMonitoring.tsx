import { useState } from 'react';
import { HeartPulse, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Sliders, UserCheck, Search } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { useAllPatientsMonitoringStatus, useUpsertMonitoringRequirement } from '../../vitals/hooks/useVitals';
import { AttentionModal } from '../../vitals/components/AttentionModal';

const FREQUENCY_OPTIONS = [
    { label: 'Hourly (1 Hour)', value: 'HOURLY' },
    { label: 'Every 2 Hours', value: 'EVERY_2_HOURS' },
    { label: 'Every 4 Hours', value: 'EVERY_4_HOURS' },
    { label: 'Every 6 Hours', value: 'EVERY_6_HOURS' },
    { label: 'Every 8 Hours', value: 'EVERY_8_HOURS' },
    { label: 'Custom Interval', value: 'CUSTOM' }
];

export default function ManagerMonitoring() {
    const { data: patientsList = [], isLoading, isError } = useAllPatientsMonitoringStatus();
    const upsertRequirementMutation = useUpsertMonitoringRequirement();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [isConfigureOpen, setIsConfigureOpen] = useState(false);
    const [selectedPatientForAttention, setSelectedPatientForAttention] = useState<any | null>(null);

    // Form state for configuration modal
    const [frequency, setFrequency] = useState('EVERY_4_HOURS');
    const [customMinutes, setCustomMinutes] = useState(120);
    const [notes, setNotes] = useState('');

    const filteredPatients = patientsList.filter((p: any) =>
        p.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.assignedNurseName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPatients = patientsList.length;
    const overdueCount = patientsList.filter((p: any) => (p.monitoringStatus?.overdueCount || 0) > 0).length;
    const dueCount = patientsList.filter((p: any) => (p.monitoringStatus?.dueCount || 0) > 0).length;
    const totalOpenAttentions = patientsList.reduce((sum: number, p: any) => sum + (p.openAttentionCount || 0), 0);

    const handleOpenConfigure = (patient: any) => {
        setSelectedPatient(patient);
        const existingFreq = patient.monitoringRequirement?.frequency || 'EVERY_4_HOURS';
        setFrequency(existingFreq);
        setCustomMinutes(patient.monitoringRequirement?.customIntervalMinutes || 120);
        setNotes(patient.monitoringRequirement?.notes || '');
        setIsConfigureOpen(true);
    };

    const handleSaveRequirement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        upsertRequirementMutation.mutate(
            {
                patientId: selectedPatient.patientId,
                payload: {
                    frequency,
                    customIntervalMinutes: frequency === 'CUSTOM' ? Number(customMinutes) : undefined,
                    notes
                }
            },
            {
                onSuccess: () => {
                    setIsConfigureOpen(false);
                    setSelectedPatient(null);
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-full flex-col space-y-6">
                <PageHeader title="Clinical Vitals Monitoring & Attention" subtitle="Manage care-plan monitoring frequencies and patient observations." />
                <div className="flex flex-col items-center justify-center py-20 text-[#0F969C]">
                    <HeartPulse className="h-10 w-10 animate-bounce mb-3 text-[#0F969C]" />
                    <p className="text-sm font-bold animate-pulse">Loading clinical monitoring data...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-full flex-col space-y-6">
                <PageHeader title="Clinical Vitals Monitoring & Attention" subtitle="Manage care-plan monitoring frequencies and patient observations." />
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
                    <p className="text-rose-700 font-bold">Failed to load monitoring dashboard. Verify your manager session.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col space-y-6">
            <PageHeader
                title="Clinical Vitals Monitoring & Attention"
                subtitle="Manager Workspace: Configure care-plan vital frequencies and review attention flags."
                breadcrumbs={[{ label: 'Manager Workspace' }, { label: 'Monitoring & Attention' }]}
            />

            {/* Summary Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                        <UserCheck className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-blue-800">{totalPatients}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Active Patients</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                        <Clock className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-amber-800">{dueCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Vitals Due</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm">
                        <ShieldAlert className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-rose-800">{overdueCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Overdue Monitoring</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-purple-700 shadow-sm">
                        <AlertTriangle className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-purple-800">{totalOpenAttentions}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Open Attention Flags</p>
                    </div>
                </div>
            </div>

            {/* Filter & Table Container */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5 gap-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <HeartPulse className="h-5 w-5 text-[#0F969C]" /> Patient Care Monitoring Roster
                    </h3>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patient or nurse..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 focus:border-[#0F969C] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                            <tr>
                                <th className="py-3.5 px-5">Patient Name</th>
                                <th className="py-3.5 px-5">Assigned Staff</th>
                                <th className="py-3.5 px-5">Care Plan Frequency</th>
                                <th className="py-3.5 px-5">Status</th>
                                <th className="py-3.5 px-5">Next Due</th>
                                <th className="py-3.5 px-5">Last Vital Recorded</th>
                                <th className="py-3.5 px-5">Attention Flags</th>
                                <th className="py-3.5 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500">
                                        <p className="text-base font-bold text-gray-700">No monitoring records found matching search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient: any) => {
                                    const isOverdue = (patient.monitoringStatus?.overdueCount || 0) > 0;
                                    const isDue = (patient.monitoringStatus?.dueCount || 0) > 0;
                                    const req = patient.monitoringRequirement;
                                    const freqText = req ? req.frequency.replace(/_/g, ' ') : 'Default (4 Hrs)';

                                    return (
                                        <tr key={patient.patientId} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-4 px-5">
                                                <p className="font-extrabold text-gray-900">{patient.patientName}</p>
                                                <span className="text-[11px] font-semibold text-gray-400">ID: {patient.patientId.slice(0, 8)}</span>
                                            </td>

                                            <td className="py-4 px-5 font-semibold text-gray-700">
                                                {patient.assignedNurseName}
                                            </td>

                                            <td className="py-4 px-5 font-bold text-gray-800">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs text-gray-800">
                                                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                    {freqText}
                                                </span>
                                            </td>

                                            <td className="py-4 px-5">
                                                {isOverdue ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                                                        <ShieldAlert className="h-3.5 w-3.5" /> OVERDUE
                                                    </span>
                                                ) : isDue ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 border border-amber-200">
                                                        <Clock className="h-3.5 w-3.5" /> DUE
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> ON TRACK
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5 font-bold text-gray-900">
                                                {patient.monitoringStatus?.nextDueSlot || '-'}
                                            </td>

                                            <td className="py-4 px-5 text-xs text-gray-600 font-medium">
                                                {patient.lastVital ? (
                                                    <div>
                                                        <p className="font-bold text-gray-800">
                                                            {new Date(patient.lastVital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">
                                                            SpO2: {patient.lastVital.spO2 || '-'}% &bull; Temp: {patient.lastVital.temp || '-'}°F
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">No vitals today</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5">
                                                {patient.openAttentionCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700 border border-purple-200">
                                                        <AlertTriangle className="h-3.5 w-3.5" /> {patient.openAttentionCount} Open
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-semibold">0 Flags</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenConfigure(patient)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-700 hover:bg-gray-50 shadow-sm"
                                                    title="Configure Frequency"
                                                >
                                                    <Sliders className="h-3.5 w-3.5" /> Frequency
                                                </button>

                                                <button
                                                    onClick={() => setSelectedPatientForAttention(patient)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700 hover:bg-amber-100 shadow-sm"
                                                    title="Review Attention Flags"
                                                >
                                                    <AlertTriangle className="h-3.5 w-3.5" /> Attention
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Configure Frequency Modal */}
            {isConfigureOpen && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-5">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-extrabold text-gray-900">Configure Monitoring Requirement</h3>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">
                                Patient: <strong className="text-gray-800">{selectedPatient.patientName}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleSaveRequirement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Clinical Frequency
                                </label>
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-800 focus:border-[#0F969C] focus:outline-none"
                                >
                                    {FREQUENCY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {frequency === 'CUSTOM' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Custom Interval (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={customMinutes}
                                        onChange={(e) => setCustomMinutes(Number(e.target.value))}
                                        min={30}
                                        max={1440}
                                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-800 focus:border-[#0F969C] focus:outline-none"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Clinical Care Plan Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter clinical rationale or care plan notes for this monitoring schedule..."
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-gray-800 focus:border-[#0F969C] focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsConfigureOpen(false);
                                        setSelectedPatient(null);
                                    }}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={upsertRequirementMutation.isPending}
                                    className="rounded-xl bg-[#0F969C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0c7a7f] shadow-sm disabled:opacity-50"
                                >
                                    {upsertRequirementMutation.isPending ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attention Modal */}
            {selectedPatientForAttention && (
                <AttentionModal
                    isOpen={!!selectedPatientForAttention}
                    onClose={() => setSelectedPatientForAttention(null)}
                    patientId={selectedPatientForAttention.patientId}
                    patientName={selectedPatientForAttention.patientName}
                    canResolve={true}
                />
            )}
        </div>
    );
}
