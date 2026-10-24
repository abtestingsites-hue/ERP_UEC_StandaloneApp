import React from 'react';
import { Calendar, User, MapPin, Phone, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DutyStatusBadge } from './DutyStatusBadge';

interface CaregiverShiftCardProps {
    assignment: any;
}

export const CaregiverShiftCard: React.FC<CaregiverShiftCardProps> = ({ assignment }) => {
    const patientName = assignment.patient?.name || assignment.patientName || 'Home Care Patient';
    const patientMobile = assignment.patient?.mobile || assignment.mobile || 'N/A';
    const patientAddress = assignment.patient?.address || assignment.address || 'Address on record';
    const careReqs = assignment.patient?.careRequirements || assignment.notes || 'General Home Nursing Care';

    const startDate = assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : 'N/A';
    const endDate = assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing';

    const latestTask = (Array.isArray(assignment.operationalTasks) && assignment.operationalTasks.length > 0)
        ? assignment.operationalTasks[0]
        : assignment.task || null;

    return (
        <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-[#0F969C]" />
                            {patientName}
                        </h3>
                        {assignment.assignmentNo && (
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                {assignment.assignmentNo}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {patientAddress}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <DutyStatusBadge status={assignment.status || 'ACTIVE'} />
                    {latestTask && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            Today's Visit: <strong className="text-emerald-600 dark:text-emerald-400">{latestTask.status}</strong>
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-black/20 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0F969C]" />
                    <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Duty Schedule</span>
                        <span className="font-semibold">{startDate} – {endDate}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#0F969C]" />
                    <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Contact</span>
                        <span className="font-semibold">{patientMobile}</span>
                    </div>
                </div>
            </div>

            {careReqs && (
                <div className="mb-4">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Care Requirements</span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/50 dark:border-emerald-800/20">
                        {careReqs}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
                <Link
                    to={`/my-visits`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F969C] hover:text-[#0C7B80] transition-colors"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    View Today's Visits
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                    to={`/care-delivery/${assignment.patientId || assignment.patient?.id || ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F969C] text-white hover:bg-[#0C7B80] shadow-sm transition-colors"
                >
                    <Activity className="w-3.5 h-3.5" />
                    Record Care Delivery
                </Link>
            </div>
        </div>
    );
};
