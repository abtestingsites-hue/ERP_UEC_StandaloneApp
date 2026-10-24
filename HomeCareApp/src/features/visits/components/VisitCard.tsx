import React, { useState } from 'react';
import { Calendar, User, PlayCircle, CheckCircle2, Activity, Eye, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { VisitTask } from '../api/visitsApi';
import { DutyStatusBadge } from '../../roster/components/DutyStatusBadge';
import { VisitCheckInModal } from './VisitCheckInModal';
import { VisitCheckOutModal } from './VisitCheckOutModal';

interface VisitCardProps {
    visit: VisitTask;
    onUpdateStatus: (id: string, payload: { status: string; completedAt?: string | null; remarks?: string | null }) => Promise<any>;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onUpdateStatus }) => {
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [showCheckOut, setShowCheckOut] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const normStatus = String(visit.status || '').toUpperCase();
    const clientName = visit.enquiry?.patientName || visit.enquiry?.clientName || 'Home Care Patient';
    const clientAddress = visit.enquiry?.address || 'Client Address on record';

    const dueDate = visit.dueDate ? new Date(visit.dueDate).toLocaleString() : 'Today';
    const completedAtDate = visit.completedAt ? new Date(visit.completedAt).toLocaleString() : null;

    const handleConfirmCheckIn = async () => {
        setIsSubmitting(true);
        try {
            await onUpdateStatus(visit.id, { status: 'IN_PROGRESS' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmCheckOut = async (remarks: string) => {
        setIsSubmitting(true);
        try {
            await onUpdateStatus(visit.id, {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                remarks
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {visit.title}
                                </h3>
                                {visit.refNo && (
                                    <span className="text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                        {visit.refNo}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                                <User className="w-3.5 h-3.5 text-[#0F969C] shrink-0" />
                                Patient: <strong className="text-gray-800 dark:text-gray-200">{clientName}</strong>
                            </p>
                        </div>
                        <DutyStatusBadge status={visit.status} />
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {clientAddress}
                    </p>

                    {visit.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40 mb-3">
                            {visit.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50/70 dark:bg-black/10 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0F969C]" />
                            <span>Scheduled: <strong>{dueDate}</strong></span>
                        </div>

                        {completedAtDate && (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed: <strong>{completedAtDate}</strong></span>
                            </div>
                        )}
                    </div>

                    {visit.remarks && (
                        <div className="mb-4 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100/40 dark:border-emerald-800/20 text-xs">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-0.5">Caregiver Remarks:</span>
                            <p className="text-gray-700 dark:text-gray-300">{visit.remarks}</p>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                    <Link
                        to={`/visits/${visit.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0F969C] transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                        <ChevronRight className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-2">
                        {['ASSIGNED', 'PENDING'].includes(normStatus) && (
                            <button
                                onClick={() => setShowCheckIn(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] shadow-sm transition-colors"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Check In
                            </button>
                        )}

                        {normStatus === 'IN_PROGRESS' && (
                            <>
                                <Link
                                    to={`/care-delivery/${visit.enquiry?.admission?.patientId || visit.enquiry?.admission?.patient?.id || visit.metadata?.patientId || visit.patientId || ''}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-[#0F969C] border border-teal-200 dark:border-teal-800/40 hover:bg-teal-100 transition-colors"
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    Care Delivery
                                </Link>

                                <button
                                    onClick={() => setShowCheckOut(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Check Out
                                </button>
                            </>
                        )}

                        {normStatus === 'COMPLETED' && (
                            <Link
                                to={`/visits/${visit.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Completed
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <VisitCheckInModal
                isOpen={showCheckIn}
                onClose={() => setShowCheckIn(false)}
                onConfirm={handleConfirmCheckIn}
                visit={visit}
                isSubmitting={isSubmitting}
            />

            <VisitCheckOutModal
                isOpen={showCheckOut}
                onClose={() => setShowCheckOut(false)}
                onConfirm={handleConfirmCheckOut}
                visit={visit}
                isSubmitting={isSubmitting}
            />
        </>
    );
};
