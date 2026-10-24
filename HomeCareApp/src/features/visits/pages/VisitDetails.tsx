import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Phone, MapPin, CheckCircle2, PlayCircle, Activity, FileText, AlertCircle } from 'lucide-react';
import { useVisitDetails, useVisits } from '../hooks/useVisits';
import { DutyStatusBadge } from '../../roster/components/DutyStatusBadge';
import { VisitStatusTimeline } from '../components/VisitStatusTimeline';
import { VisitCheckInModal } from '../components/VisitCheckInModal';
import { VisitCheckOutModal } from '../components/VisitCheckOutModal';

export default function VisitDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { visit, isLoading, refetch } = useVisitDetails(id || '');
    const { updateStatus } = useVisits();

    const [showCheckIn, setShowCheckIn] = useState(false);
    const [showCheckOut, setShowCheckOut] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                <div className="w-8 h-8 border-4 border-[#0F969C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading visit details...</p>
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="bg-white dark:bg-[#072E33] rounded-2xl p-12 border border-gray-100 dark:border-[#6DA5C0]/15 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Visit Record Not Found</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    The requested Home Care visit task could not be located.
                </p>
                <button
                    onClick={() => navigate('/my-visits')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Visits
                </button>
            </div>
        );
    }

    const normStatus = String(visit.status || '').toUpperCase();
    const clientName = visit.enquiry?.patientName || visit.enquiry?.clientName || 'Home Care Patient';
    const clientMobile = visit.enquiry?.mobile || 'N/A';
    const clientAddress = visit.enquiry?.address || 'Address on record';
    const careReqs = visit.enquiry?.careRequirements || visit.description || 'General Home Nursing Visit';

    const handleConfirmCheckIn = async () => {
        setIsSubmitting(true);
        try {
            await updateStatus({ id: visit.id, payload: { status: 'IN_PROGRESS' } });
            refetch();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmCheckOut = async (remarks: string) => {
        setIsSubmitting(true);
        try {
            await updateStatus({
                id: visit.id,
                payload: {
                    status: 'COMPLETED',
                    completedAt: new Date().toISOString(),
                    remarks
                }
            });
            refetch();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <DutyStatusBadge status={visit.status} />
            </div>

            {/* Visit Details Header Card */}
            <div className="bg-white dark:bg-[#072E33] p-6 rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm space-y-6">
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <h1 className="text-xl font-black text-gray-900 dark:text-white">
                            {visit.title}
                        </h1>
                        {visit.refNo && (
                            <span className="text-xs font-mono bg-teal-50 dark:bg-teal-950/40 text-[#0F969C] px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-800/40">
                                {visit.refNo}
                            </span>
                        )}
                    </div>
                    {visit.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            {visit.description}
                        </p>
                    )}
                </div>

                {/* Workflow Status Timeline */}
                <VisitStatusTimeline status={visit.status} />

                {/* Client & Duty Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 text-xs">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Patient / Client Info</span>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-[#0F969C]" />
                            {clientName}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {clientMobile}
                        </div>
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            {clientAddress}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Visit Schedule & Timestamps</span>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="w-4 h-4 text-[#0F969C]" />
                            Scheduled: <strong>{visit.dueDate ? new Date(visit.dueDate).toLocaleString() : 'N/A'}</strong>
                        </div>
                        {visit.completedAt && (
                            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed: <strong>{new Date(visit.completedAt).toLocaleString()}</strong>
                            </div>
                        )}
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Task Type: <strong>{visit.type || 'SCHEDULED'}</strong>
                        </div>
                    </div>
                </div>

                {/* Care Requirements */}
                <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Care Requirements / Instructions</span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 bg-teal-50/40 dark:bg-teal-950/20 p-3.5 rounded-xl border border-teal-100/50 dark:border-teal-800/20">
                        {careReqs}
                    </p>
                </div>

                {/* Caregiver Remarks if Completed */}
                {visit.remarks && (
                    <div>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Caregiver Completion Remarks
                        </span>
                        <p className="text-xs text-gray-800 dark:text-gray-200 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                            {visit.remarks}
                        </p>
                    </div>
                )}

                {/* Action Bar */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/my-visits"
                        className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0F969C] transition-colors"
                    >
                        ← Back to Visits List
                    </Link>

                    <div className="flex items-center gap-3">
                        {['ASSIGNED', 'PENDING'].includes(normStatus) && (
                            <button
                                onClick={() => setShowCheckIn(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F969C] text-white hover:bg-[#0C7B80] shadow-sm transition-colors"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Start / Check-In Visit
                            </button>
                        )}

                        {normStatus === 'IN_PROGRESS' && (
                            <>
                                <Link
                                    to={`/care-delivery/${visit.enquiry?.admission?.patientId || visit.enquiry?.admission?.patient?.id || visit.metadata?.patientId || visit.patientId || ''}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-[#0F969C] border border-teal-200 dark:border-teal-800/40 hover:bg-teal-100 transition-colors"
                                >
                                    <Activity className="w-4 h-4" />
                                    Record Care Delivery
                                </Link>

                                <button
                                    onClick={() => setShowCheckOut(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Check-Out & Complete
                                </button>
                            </>
                        )}

                        {normStatus === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Visit Completed
                            </span>
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
        </div>
    );
}
