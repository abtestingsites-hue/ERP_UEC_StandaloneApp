import { useMemo, useState } from 'react';
import { CalendarClock, UserCircle, Activity, HeartPulse, Pill, Apple, Receipt, AlertTriangle } from 'lucide-react';

import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { useMyShift } from '../hooks/useMyShift';
import { AttentionModal } from '../../vitals/components/AttentionModal';
import { useAuthStore } from '../../../store/authStore';
import { useAssignments } from '../../manager/hooks/useAssignments';


const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB');
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'ON_HOLD': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export default function MyShift() {
    const [attentionPatient, setAttentionPatient] = useState<any | null>(null);
    const { data: shiftData, isLoading, isError } = useMyShift();
    const { user } = useAuthStore();
    const { data: allAssignments = [] } = useAssignments(
        user?.staffId ? { staffId: user.staffId } : undefined
    );

    const historyAssignments = useMemo(() => {
        return allAssignments.filter((a: any) => 
            ['WAITING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED'].includes(a.status)
        ).sort((a: any, b: any) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    }, [allAssignments]);


    const activeAssignments = useMemo(() => {
        if (!shiftData?.assignments) return [];
        return shiftData.assignments.filter((a: any) => 
            ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(a.status)
        );
    }, [shiftData]);

    if (isLoading) {
        return (
            <div className="flex h-full flex-col">
                <PageHeader title="My Shift" subtitle="Your active clinical assignments for today." />
                <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
                    <Activity className="h-10 w-10 animate-bounce text-emerald-400 mb-3" />
                    <p className="text-sm font-bold animate-pulse">Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-full flex-col">
                <PageHeader title="My Shift" subtitle="Your active clinical assignments for today." />
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
                    <p className="text-rose-700 font-bold">Failed to load My Shift data. Please try again or check your session.</p>
                </div>
            </div>
        );
    }

    const assignedPatients = activeAssignments.filter((a: any) => a.patientId);

    return (
        <div className="flex flex-col space-y-6 pb-10">
            <PageHeader
                title="My Shift"
                subtitle="Your daily assignments and clinical tasks."
                breadcrumbs={[{ label: 'Nursing Care' }, { label: 'My Shift' }]}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-blue-700">
                        <UserCircle className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-blue-700">{activeAssignments.length}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active Assignments</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-emerald-700">
                        <CalendarClock className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-2xl font-black text-emerald-700">{(shiftData?.assignments || []).length}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Shift Duties</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                    <h3 className="text-lg font-bold text-gray-900">Today's Duties</h3>
                </div>

                <div className="p-0">
                    {assignedPatients.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            <UserCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p className="text-base font-bold text-gray-700">No patients are currently assigned to your shift.</p>
                            <p className="text-sm text-gray-500 mt-1">If you believe this is an error, contact your Nursing Manager.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {assignedPatients.map((assignment: any) => (
                                <div key={assignment.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-extrabold text-gray-900">
                                                    {assignment.patient?.name || 'Unknown Patient'}
                                                </h4>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${getStatusColor(assignment.status)}`}>
                                                    {assignment.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="text-xs font-semibold text-gray-500 mb-3 space-x-2">
                                                <span>PT-{assignment.patientId.substring(0, 4).toUpperCase()}</span>
                                                <span>&bull;</span>
                                                <span>{assignment.role}</span>
                                                <span>&bull;</span>
                                                <span>{assignment.dutyType}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4 max-w-lg">
                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                    <span className="block text-xs font-semibold text-gray-400 uppercase mb-0.5">Shift Start</span>
                                                    <span className="font-medium text-gray-800">{formatDateTime(assignment.startAt)}</span>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                    <span className="block text-xs font-semibold text-gray-400 uppercase mb-0.5">Shift End</span>
                                                    <span className="font-medium text-gray-800">{assignment.endAt ? formatDateTime(assignment.endAt) : 'Ongoing'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                                            <button
                                                onClick={() => setAttentionPatient(assignment.patient)}
                                                className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                                            >
                                                <AlertTriangle className="h-4 w-4" /> Attention Flag
                                            </button>
                                            <Link
                                                to={`/clinical-duty/${assignment.id}`}
                                                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Open Workspace &rarr;
                                            </Link>

                                        </div>

                                    </div>
                                    {assignment.notes && (
                                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="font-bold text-gray-700 mr-2">Notes:</span> {assignment.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {historyAssignments.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
                    <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                        <h3 className="text-lg font-bold text-gray-900">Duty History (Completed)</h3>
                    </div>
                    <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {historyAssignments.map((assignment: any) => (
                                <div key={assignment.id} className="rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900">
                                                {assignment.patient?.name || 'Unknown Patient'}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {assignment.patient?.elderId || 'New'}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${getStatusColor(assignment.status)}`}>
                                            {assignment.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                                        <p><span className="font-bold">Date:</span> {formatDateTime(assignment.startAt)}</p>
                                        <p><span className="font-bold">Duty:</span> {assignment.dutyType.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {attentionPatient && (
                <AttentionModal
                    isOpen={!!attentionPatient}
                    onClose={() => setAttentionPatient(null)}
                    patientId={attentionPatient.id}
                    patientName={attentionPatient.name || 'Patient'}
                />
            )}
        </div>
    );

}
