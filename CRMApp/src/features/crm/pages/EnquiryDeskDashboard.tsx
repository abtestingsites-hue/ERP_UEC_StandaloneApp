import { useMemo } from 'react';
import { Activity, ArrowRight, CalendarClock, ClipboardList, Headset, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/PageHeader';
import { useAuthStore } from '../../../store/authStore';
import { useEnquiries } from '../../enquiry/hooks/useEnquiry';
import { useWorkflowTimelines } from '../hooks/useCrm';
import type { Enquiry } from '../../enquiry/types';
import { LoadingState } from '../../../components/LoadingState';

const statusColors: Record<string, string> = {
    HOT: '#4f46e5',
    WARM: '#0284c7',
    PENDING: '#0d9488',
    ADMITTED: '#16a34a',
    DOCUMENTS_PENDING: '#d97706',
    PAYMENT_PENDING: '#e11d48'
};

const trendData = [
    { month: 'Jan', enquiries: 18, followUps: 12, admissions: 4 },
    { month: 'Feb', enquiries: 24, followUps: 16, admissions: 6 },
    { month: 'Mar', enquiries: 21, followUps: 18, admissions: 5 },
    { month: 'Apr', enquiries: 29, followUps: 20, admissions: 8 },
    { month: 'May', enquiries: 34, followUps: 25, admissions: 9 },
    { month: 'Jun', enquiries: 31, followUps: 22, admissions: 7 }
];

const quickLinks = [
    { label: 'Active Enquiries', href: '/crm/active-enquiries' },
    { label: 'New Enquiry', href: '/crm/new-enquiry' },
    { label: 'Follow-up Queue', href: '/crm/enquiry-follow-up' },
    { label: 'B2P Referrals', href: '/crm/b2p' },
    { label: 'Marketing', href: '/crm/marketing' }
];

const extractNoteValue = (notes: string | undefined, label: string) => {
    const match = String(notes || '').match(new RegExp(`${label}:\\s*([^|\\n]+)`, 'i'));
    return match?.[1]?.trim() || '';
};

const getLatestFollowUpValue = (enquiry: Enquiry, label: string) => {
    const followUps = Array.isArray(enquiry.followUps) ? enquiry.followUps : [];

    for (const followUp of followUps) {
        const value = extractNoteValue(followUp.notes, label);
        if (value) return value;
    }

    return '';
};

const getLeadControl = (enquiry: Enquiry) => {
    const leadValidity = getLatestFollowUpValue(enquiry, 'Lead Validity') || 'Not filtered';
    const conversionReadiness = getLatestFollowUpValue(enquiry, 'Conversion Readiness') || 'Discussion Stage';
    const urgency = getLatestFollowUpValue(enquiry, 'Urgency') || 'Normal';

    return {
        leadValidity,
        conversionReadiness,
        urgency,
        needsFiltering: leadValidity === 'Not filtered',
        isReadyToConvert: conversionReadiness === 'Ready To Convert' || conversionReadiness === 'Converted',
        isUrgent: urgency === 'Immediate' || urgency === 'Within 24 hours',
        isInvalid: ['Fake', 'Duplicate Enquiry', 'Not Service Related'].includes(leadValidity) || conversionReadiness === 'Not Convertible'
    };
};

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string | number; helper: string; icon: typeof Activity }) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            </div>
            <p className="mt-4 text-2xl font-extrabold leading-none text-slate-900 dark:text-slate-100">{value}</p>
            <p className="mt-2 text-sm font-extrabold text-slate-700 dark:text-slate-200">{label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
    );
}

function WorkflowPulse() {
    const { data: timelines = [], isLoading } = useWorkflowTimelines('');

    const metrics = useMemo(() => {
        const converted = timelines.filter((item) => item.stages.some((stage) => stage.key === 'admission' && stage.complete)).length;
        const closed = timelines.filter((item) => item.openItems.length === 0 || item.stages.some((stage) => stage.key === 'customer-care' && stage.complete)).length;
        const pendingPayment = timelines.filter((item) => Number(item.summary?.balanceAmount || 0) > 0).length;

        return { converted, closed, pendingPayment };
    }, [timelines]);

    return (
        <section className="rounded-xl border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Operational Workflow</p>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">Enquiry conversion reflection</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Tracks enquiries after creation through admission, allocation, invoice, and payment.
                    </p>
                </div>
                <Link
                    to="/crm/active-enquiries"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-indigo-700"
                >
                    View Active Pipeline
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 px-4 py-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{isLoading ? '-' : timelines.length}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tracked Enquiries</p>
                </div>
                <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">{isLoading ? '-' : metrics.converted}</p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Admissions</p>
                </div>
                <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300">{isLoading ? '-' : metrics.pendingPayment}</p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Payment Pending</p>
                </div>
                <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 px-4 py-3 border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-xl font-extrabold text-indigo-800 dark:text-indigo-300">{isLoading ? '-' : metrics.closed}</p>
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Closed</p>
                </div>
            </div>
        </section>
    );
}

function RoleActionQueue() {
    const user = useAuthStore((state) => state.user);
    const { data: timelines = [], isLoading } = useWorkflowTimelines('');

    const actions = useMemo(() => {
        return timelines.slice(0, 4).map((t) => ({
            id: t.id,
            title: `Follow up required for ${t.clientName}`,
            description: `Ref: ${t.refNo} • Service: ${t.service}`,
            severity: t.status === 'HOT' ? 'high' : 'medium',
            workflowRef: t.refNo,
            clientName: t.clientName,
            owner: 'Enquiry Desk',
            href: `/crm/enquiry-follow-up/${t.id}`
        }));
    }, [timelines]);

    return (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Action Queue</p>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">Enquiry desk priorities</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Shows enquiry workflow items needing immediate desk attention.
                    </p>
                </div>
                <Link
                    to="/crm/enquiry-follow-up"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                >
                    Review Queue
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {isLoading ? (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 px-4 py-5 text-sm font-bold text-slate-500">
                        Loading enquiry actions...
                    </div>
                ) : actions.length === 0 ? (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-4 py-5 text-sm font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                        No pending urgent desk actions.
                    </div>
                ) : (
                    actions.map((action) => (
                        <Link
                            key={action.id}
                            to={action.href}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{action.title}</p>
                                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{action.description}</p>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                                        action.severity === 'high'
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                    }`}
                                >
                                    {action.severity}
                                </span>
                            </div>
                            <p className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {action.workflowRef} - {action.clientName} - {action.owner}
                            </p>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

const hasStage = (item: { stages: Array<{ key: string; complete: boolean }> }, key: string) =>
    item.stages.some((stage) => stage.key === key && stage.complete);

export function EnquiryDeskDashboard() {
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('');
    const { data: enquiries = [], isLoading: isEnquiriesLoading } = useEnquiries();
    const isLoading = isWorkflowLoading || isEnquiriesLoading;

    const enquiryRows = enquiries as Enquiry[];
    const liveActiveEnquiries = useMemo(
        () => enquiryRows.filter((enquiry) => !enquiry.admissionId && enquiry.status !== 'Converted' && enquiry.status !== 'Lost'),
        [enquiryRows]
    );

    const dashboardActiveEnquiries: Enquiry[] = liveActiveEnquiries;

    const workflowMetrics = useMemo(() => {
        const active = timelines.filter((item) => !hasStage(item, 'admission') && !hasStage(item, 'allocation')).length;
        const admissionsInPipeline = timelines.filter((item) => hasStage(item, 'admission') && !hasStage(item, 'customer-care')).length;
        const renewalConverted = timelines.filter((item) => item.renewal?.convertedEnquiryRefNo).length;
        const needsAttention = timelines.filter((item) => item.openItems.length > 0).length;
        const liveConversionRate = timelines.length ? Math.round((admissionsInPipeline / timelines.length) * 100) : 0;

        return {
            active: timelines.length ? active : dashboardActiveEnquiries.length,
            followUpsDue: timelines.length ? needsAttention : dashboardActiveEnquiries.length,
            admissionsInPipeline: timelines.length ? admissionsInPipeline : 0,
            clientsTracked: timelines.length ? timelines.length : dashboardActiveEnquiries.length,
            renewalConverted,
            conversionRate: liveConversionRate
        };
    }, [dashboardActiveEnquiries.length, timelines]);

    const prioritySplit = useMemo(() => {
        const getCount = (priority: string) =>
            dashboardActiveEnquiries.filter((row) => String('automationPriority' in row ? row.automationPriority : row.status) === priority).length;
        return [
            { name: 'Hot', value: getCount('HOT') },
            { name: 'Warm', value: getCount('WARM') },
            { name: 'Pending', value: Math.max(0, dashboardActiveEnquiries.length - getCount('HOT') - getCount('WARM')) }
        ].filter((item) => item.value > 0);
    }, [dashboardActiveEnquiries]);

    const serviceSplit = useMemo(
        () =>
            dashboardActiveEnquiries.reduce<Array<{ name: string; value: number }>>((items, row) => {
                const service = String(row.service || 'Standard');
                const existing = items.find((item) => item.name === service);
                if (existing) {
                    existing.value += 1;
                    return items;
                }
                return [...items, { name: service, value: 1 }];
            }, []),
        [dashboardActiveEnquiries]
    );

    const urgentRows = useMemo(
        () =>
            dashboardActiveEnquiries.slice(0, 8).map((row) => ({
                id: String(row.id || row.refNo),
                refNo: String(row.refNo),
                name: String(row.clientName || 'Unknown Client'),
                service: String(row.service || 'Standard'),
                owner: String(row.lastFollowedBy || 'Enquiry Desk'),
                due: String(row.lastFollowUp || 'Follow-up')
            })),
        [dashboardActiveEnquiries]
    );

    const staffWorkload = useMemo(() => {
        const workload = liveActiveEnquiries.reduce<Record<string, number>>((items, row) => {
            const owner = row.lastFollowedBy || 'Enquiry Desk';
            items[owner] = (items[owner] || 0) + 1;
            return items;
        }, {});
        return Object.entries(workload)
            .map(([name, value]) => ({ name, value }))
            .slice(0, 6);
    }, [liveActiveEnquiries]);

    const operationalSnapshot = useMemo(() => {
        const controls = dashboardActiveEnquiries.map((enquiry) => ({ enquiry, control: getLeadControl(enquiry) }));
        const needsFiltering = controls.filter((item) => item.control.needsFiltering).length;
        const urgent = controls.filter((item) => item.control.isUrgent).length;
        const readyToConvert = controls.filter((item) => item.control.isReadyToConvert).length;
        const invalid = controls.filter((item) => item.control.isInvalid).length;
        const unattended = dashboardActiveEnquiries.filter((enquiry) => !enquiry.lastFollowUp && (!enquiry.followUps || enquiry.followUps.length === 0)).length;

        return {
            needsFiltering,
            urgent,
            readyToConvert,
            invalid,
            unattended,
            rows: controls
                .filter((item) => item.control.isUrgent || item.control.isReadyToConvert || item.control.needsFiltering)
                .slice(0, 6)
        };
    }, [dashboardActiveEnquiries]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <LoadingState message="Loading CRM dashboard metrics..." />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <PageHeader
                    title="Enquiry Desk Dashboard"
                    subtitle="Lead intake, enquiry follow-up, client conversion, and admission movement."
                />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                        >
                            {link.label}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    ))}
                </div>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label="Active Enquiries"
                    value={workflowMetrics.active}
                    helper="Open leads before admission or allocation"
                    icon={Headset}
                />
                <MetricCard
                    label="Follow-ups Due"
                    value={workflowMetrics.followUpsDue}
                    helper="Workflow items needing enquiry desk attention"
                    icon={CalendarClock}
                />
                <MetricCard
                    label="Admissions In Pipeline"
                    value={workflowMetrics.admissionsInPipeline}
                    helper={`${workflowMetrics.conversionRate}% enquiry to admission movement`}
                    icon={ClipboardList}
                />
                <MetricCard
                    label="Clients Tracked"
                    value={workflowMetrics.clientsTracked}
                    helper={`${workflowMetrics.renewalConverted} renewal conversions captured`}
                    icon={Users}
                />
            </section>

            <section className="rounded-xl border border-amber-200/80 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">Workflow Attention</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">What the enquiry desk should watch now</h2>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Live workflow counts shown from active enquiry records.
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900 px-4 py-3">
                        <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">{workflowMetrics.active}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">New or open enquiry</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900 px-4 py-3">
                        <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">{workflowMetrics.followUpsDue}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">Follow-up / stuck item</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900 px-4 py-3">
                        <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">{workflowMetrics.renewalConverted}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">Renewal converted to enquiry</p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Daily Operational Snapshot</p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-100">Lead control for today</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Shows leads that need filtering, urgent action, or conversion follow-through.
                        </p>
                    </div>
                    <Link
                        to="/crm/active-enquiries"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        Open Lead Action View
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {[
                        { label: 'Needs Filtering', value: operationalSnapshot.needsFiltering, tone: 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' },
                        { label: 'Urgent', value: operationalSnapshot.urgent, tone: 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30' },
                        { label: 'Ready To Convert', value: operationalSnapshot.readyToConvert, tone: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' },
                        { label: 'Invalid / Fake', value: operationalSnapshot.invalid, tone: 'text-slate-700 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' },
                        { label: 'Unattended', value: operationalSnapshot.unattended, tone: 'text-sky-700 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30' }
                    ].map((item) => (
                        <div key={item.label} className={`rounded-lg border px-4 py-3 ${item.tone}`}>
                            <p className="text-2xl font-extrabold">{item.value}</p>
                            <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                <th className="py-3">Lead</th>
                                <th className="py-3">Client</th>
                                <th className="py-3">Lead Filter</th>
                                <th className="py-3">Conversion</th>
                                <th className="py-3">Urgency</th>
                                <th className="py-3">Owner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operationalSnapshot.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                        No urgent lead-control exceptions.
                                    </td>
                                </tr>
                            ) : (
                                operationalSnapshot.rows.map(({ enquiry, control }) => (
                                    <tr key={enquiry.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                                        <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100">{enquiry.refNo}</td>
                                        <td className="py-3">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{enquiry.clientName}</p>
                                            <p className="text-xs font-medium text-slate-500">{enquiry.mobile}</p>
                                        </td>
                                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{control.leadValidity}</td>
                                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{control.conversionReadiness}</td>
                                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{control.urgency}</td>
                                        <td className="py-3 text-slate-600 dark:text-slate-400">{enquiry.lastFollowedBy || 'Enquiry Desk'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <WorkflowPulse />

            <RoleActionQueue />

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <div className="min-h-[340px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Enquiry Movement</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly enquiry, follow-up, and admission trend</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="h-[260px] w-full min-w-[1px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={trendData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="enquiries" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="followUps" fill="#0284c7" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="admissions" fill="#16a34a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="min-h-[340px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Priority Split</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current active enquiry urgency</p>
                    <div className="mt-4 h-[260px] w-full min-w-[1px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <PieChart>
                                <Pie data={prioritySplit} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="76%" paddingAngle={4}>
                                    {prioritySplit.map((entry) => (
                                        <Cell key={entry.name} fill={statusColors[entry.name.toUpperCase()] || '#4f46e5'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Urgent Enquiries</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hot and overdue leads needing desk action</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[580px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                    <th className="py-3">Lead</th>
                                    <th className="py-3">Client</th>
                                    <th className="py-3">Service</th>
                                    <th className="py-3">Follow-up</th>
                                </tr>
                            </thead>
                            <tbody>
                                {urgentRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-sm font-medium text-slate-500">
                                            No active urgent leads.
                                        </td>
                                    </tr>
                                ) : (
                                    urgentRows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                                            <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100">{row.refNo}</td>
                                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                                            <td className="py-3 text-slate-600 dark:text-slate-400">{row.service}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                                                    {row.due}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Service Demand</h2>
                        <div className="mt-4 space-y-3">
                            {serviceSplit.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No active service demands recorded.</p>
                            ) : (
                                serviceSplit.map((item) => (
                                    <div key={item.name}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.value}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(18, item.value * 25)}%` }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Staff Follow-up Load</h2>
                        <div className="mt-4 h-[190px] w-full min-w-[1px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <BarChart data={staffWorkload} layout="vertical" margin={{ top: 0, right: 16, left: 6, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0284c7" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
