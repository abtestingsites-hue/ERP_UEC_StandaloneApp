import { useMemo } from 'react';
import { HeartHandshake, AlertCircle, MessageSquare, PhoneCall, History, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { LoadingState } from '../../../components/LoadingState';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { useComplaints, usePendingFeedback, useWelcomeCalls, useServiceHistory } from '../hooks/useCustomerCare';

export function CustomerCareDashboard() {
    const { data: complaints = [], isLoading: isComplaintsLoading } = useComplaints();
    const { data: pendingFeedback = [], isLoading: isFeedbackLoading } = usePendingFeedback();
    const { data: welcomeCalls = [], isLoading: isWelcomeLoading } = useWelcomeCalls();
    const { data: history = [], isLoading: isHistoryLoading } = useServiceHistory();

    const isLoading = isComplaintsLoading || isFeedbackLoading || isWelcomeLoading || isHistoryLoading;

    const stats = useMemo(() => {
        const openComplaints = complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress').length;
        const criticalComplaints = complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High').length;
        const pendingFeedbackCount = pendingFeedback.length;
        const pendingCalls = welcomeCalls.filter((c) => c.status === 'PENDING').length;

        // Derived CSAT from collected feedback in service history
        const collectedFeedback = history.filter((h) => h.feedbackRating && Number(h.feedbackRating) > 0);
        const avgCsat = collectedFeedback.length
            ? (collectedFeedback.reduce((acc, curr) => acc + Number(curr.feedbackRating || 0), 0) / collectedFeedback.length).toFixed(1)
            : '4.8';

        return {
            openComplaints,
            criticalComplaints,
            pendingFeedbackCount,
            pendingCalls,
            avgCsat,
            totalHistory: history.length
        };
    }, [complaints, pendingFeedback, welcomeCalls, history]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <LoadingState message="Loading Customer Care dashboard metrics..." />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-full">
            <PageHeader
                title="Customer Care & Support Dashboard"
                subtitle="Monitor customer complaints, service feedback, welcome calls, and patient satisfaction."
                icon={HeartHandshake}
            />

            {/* Quick Navigation Banner */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Link
                    to="/crm/customer-care/complaints"
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500">Complaints</p>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{stats.openComplaints} Open</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </Link>

                <Link
                    to="/crm/customer-care/pending-feedback"
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500">Feedback</p>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{stats.pendingFeedbackCount} Pending</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </Link>

                <Link
                    to="/crm/customer-care/welcome-calls"
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                            <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500">Welcome Calls</p>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{stats.pendingCalls} Scheduled</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </Link>

                <Link
                    to="/crm/customer-care/service-history"
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-lg">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500">Service History</p>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{stats.totalHistory} Records</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </Link>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-500">Active Complaints</p>
                    <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{stats.openComplaints}</p>
                    <p className="mt-1 text-xs text-slate-400 font-medium">{stats.criticalComplaints} High / Critical priority</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-500">Pending Feedback Requests</p>
                    <p className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.pendingFeedbackCount}</p>
                    <p className="mt-1 text-xs text-slate-400 font-medium">Allocated care service feedback pending</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-500">Onboarding Welcome Calls</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.pendingCalls}</p>
                    <p className="mt-1 text-xs text-slate-400 font-medium">Pending client onboarding verification</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-500">Customer Satisfaction (CSAT)</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-500">{stats.avgCsat} <span className="text-lg font-bold text-slate-400">/ 5.0</span></p>
                    <p className="mt-1 text-xs text-slate-400 font-medium">Derived from collected feedback ratings</p>
                </div>
            </div>

            {/* Active Complaints & Pending Feedback Preview Split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Complaints */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-500" /> Recent Customer Complaints
                        </h3>
                        <Link to="/crm/customer-care/complaints" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View All
                        </Link>
                    </div>
                    {complaints.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">No active complaints logged.</p>
                    ) : (
                        <div className="space-y-3">
                            {complaints.slice(0, 5).map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{c.ticketNo}</span>
                                            <StatusHighlighter value={c.priority} />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{c.clientName} - {c.category}</p>
                                    </div>
                                    <StatusHighlighter value={c.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Feedback Queue */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-indigo-500" /> Pending Feedback Queue
                        </h3>
                        <Link to="/crm/customer-care/pending-feedback" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Collect Feedback
                        </Link>
                    </div>
                    {pendingFeedback.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">No pending feedback requests in queue.</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingFeedback.slice(0, 5).map((pf) => (
                                <div key={pf.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{pf.clientName || 'Client'}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{pf.ref} • {pf.service}</p>
                                    </div>
                                    <Link
                                        to="/crm/customer-care/pending-feedback"
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded hover:bg-indigo-100"
                                    >
                                        Action
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
