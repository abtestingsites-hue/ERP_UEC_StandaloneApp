import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Circle, Clock, Eye, IndianRupee, ReceiptText, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusHighlighter } from '../../../components/StatusHighlighter';
import { useWorkflowTimelines, type WorkflowStage, type WorkflowTimeline as WorkflowTimelineRecord } from '../services/workflowTimeline';

const formatDateTime = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const stageTone = (stage: WorkflowStage) => {
    const status = String(stage.status || '').toUpperCase();
    if ([
        'POSTED',
        'APPROVED',
        'COMPLETED',
        'CLOSED',
        'ACTIVE',
        'RENEWAL CREATED',
        'RENEWAL INTERESTED',
        'RENEWAL NOT INTERESTED',
        'RENEWAL CALL LATER',
        'RENEWAL CONVERTED TO NEW SERVICE',
        'CONVERTED TO NEW SERVICE'
    ].includes(status)) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (['CREATED', 'ASSIGNED', 'IN PROGRESS', 'IN_PROGRESS'].includes(status)) {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    if (['REJECTED', 'CANCELLED'].includes(status)) {
        return 'border-red-200 bg-red-50 text-red-700';
    }
    return 'border-gray-200 bg-gray-50 text-gray-500';
};

const labelize = (value: string | null | undefined) => String(value || '-').replace(/_/g, ' ');

type WorkflowException = {
    key: string;
    label: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    workflow: WorkflowTimelineRecord;
};

const getStage = (workflow: WorkflowTimelineRecord, key: string) => workflow.stages.find((stage) => stage.key === key);

const guidedStageKeys = [
    'healthcare-monitoring',
    'billing',
    'customer-care',
    'renewal',
    'repeat-service'
];

const getWorkflowExceptions = (workflow: WorkflowTimelineRecord): WorkflowException[] => {
    const exceptions: WorkflowException[] = [];
    const addException = (key: string, label: string, reason: string, severity: WorkflowException['severity'] = 'medium') => {
        exceptions.push({ key: `${workflow.id}-${key}`, label, reason, severity, workflow });
    };

    const enquiry = getStage(workflow, 'enquiry');
    const followUp = getStage(workflow, 'follow-up');
    const admission = getStage(workflow, 'admission');
    const allocation = getStage(workflow, 'allocation');
    const staffExecution = getStage(workflow, 'staff-execution');
    const healthcareMonitoring = getStage(workflow, 'healthcare-monitoring');
    const billing = getStage(workflow, 'billing');
    const customerCare = getStage(workflow, 'customer-care');
    const renewal = getStage(workflow, 'renewal');
    const repeatService = getStage(workflow, 'repeat-service');

    if (enquiry?.complete && !followUp?.complete) {
        addException('follow-up', 'Follow-up pending', 'Enquiry is created but follow-up is not completed.', 'high');
    }
    if (followUp?.complete && !admission?.complete) {
        addException('admission', 'Admission pending', 'Follow-up is done but admission is not created.', 'high');
    }
    if (admission?.complete && !allocation?.complete) {
        addException('allocation', 'Allocation pending', 'Admission exists but allocation and staff assignment are not completed.', 'high');
    }
    if (allocation?.complete && !staffExecution?.complete) {
        addException('staff-execution', 'Staff execution pending', 'Allocation exists but staff execution is not completed.', 'medium');
    }
    if (staffExecution?.complete && !healthcareMonitoring?.complete) {
        addException('healthcare-monitoring', 'Healthcare monitoring pending', 'Staff execution is done but healthcare monitoring is not complete.', 'medium');
    }
    if (healthcareMonitoring?.complete && !billing?.complete) {
        addException('billing', 'Billing pending', 'Care work is complete but billing/payment is not completed.', 'high');
    }
    if (billing?.complete && !customerCare?.complete) {
        addException('customer-care', 'Customer care pending', 'Billing is complete but feedback or complaint closure is pending.', 'medium');
    }
    if (customerCare?.complete && !renewal?.complete) {
        addException('renewal', 'Renewal pending', 'Customer care is complete but renewal follow-up is not created.', 'low');
    }
    if (renewal?.complete && !repeatService?.complete) {
        addException('repeat-service', 'Repeat service pending', 'Renewal exists but repeat service outcome is not completed.', 'low');
    }

    workflow.stages
        .filter((stage) => stage.complete && !stage.ref)
        .forEach((stage) => {
            addException(`missing-ref-${stage.key}`, 'Missing reference', `${stage.label} is marked complete but has no reference number.`, 'low');
        });

    workflow.openItems.forEach((item, index) => {
        addException(`open-${index}`, 'Open item', item, 'low');
    });

    return exceptions;
};

export function WorkflowTimeline() {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const [search, setSearch] = useState(initialSearch);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTimelineRecord | null>(null);
    const { data: timelines = [], isLoading } = useWorkflowTimelines(search.trim());

    useEffect(() => {
        const nextSearch = searchParams.get('search') || '';
        setSearch(nextSearch);
    }, [searchParams]);

    const totals = useMemo(() => ({
        records: timelines.length,
        completed: timelines.filter((item) => item.stages.every((stage) => stage.complete)).length,
        draftInvoices: timelines.filter((item) => item.stages.some((stage) => stage.key === 'billing' && stage.status === 'CREATED')).length,
        invoiceAmount: timelines.reduce((sum, item) => sum + Number(item.summary.invoiceAmount || 0), 0)
    }), [timelines]);

    const workflowExceptions = useMemo(
        () => timelines.flatMap((workflow) => getWorkflowExceptions(workflow)),
        [timelines]
    );

    const exceptionTotals = useMemo(() => ({
        high: workflowExceptions.filter((exception) => exception.severity === 'high').length,
        medium: workflowExceptions.filter((exception) => exception.severity === 'medium').length,
        low: workflowExceptions.filter((exception) => exception.severity === 'low').length
    }), [workflowExceptions]);

    return (
        <div className="flex min-w-0 flex-col gap-5 pb-8">
            <PageHeader
                title="Workflow Timeline"
                breadcrumbs={[{ label: 'Home' }, { label: 'Workflow Timeline' }]}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tracked Workflows</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">{totals.records}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Fully Completed</p>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-900">{totals.completed}</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Draft Invoices</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-900">{totals.draftInvoices}</p>
                </div>
                <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Invoice Value</p>
                    <p className="mt-2 flex items-center gap-1 text-2xl font-extrabold text-primary-900">
                        <IndianRupee className="h-5 w-5" />
                        {totals.invoiceAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex max-w-lg items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search enquiry, client, mobile, or status..."
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>
            </div>

            <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <h2 className="text-lg font-extrabold text-gray-900">Workflow Exceptions</h2>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Finds workflows that are stuck between enquiry, allocation, approval, invoice, payment, or closure.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-red-50 px-3 py-2">
                            <p className="text-lg font-extrabold text-red-700">{exceptionTotals.high}</p>
                            <p className="font-bold text-red-600">High</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2">
                            <p className="text-lg font-extrabold text-amber-700">{exceptionTotals.medium}</p>
                            <p className="font-bold text-amber-600">Medium</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-lg font-extrabold text-gray-700">{exceptionTotals.low}</p>
                            <p className="font-bold text-gray-500">Low</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm font-medium text-gray-500">
                            Checking workflow exceptions...
                        </div>
                    ) : workflowExceptions.length === 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center text-sm font-bold text-emerald-700">
                            No workflow exceptions found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {workflowExceptions.slice(0, 6).map((exception) => (
                                <button
                                    key={exception.key}
                                    type="button"
                                    onClick={() => setSelectedWorkflow(exception.workflow)}
                                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-primary-200 hover:bg-primary-50"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-extrabold text-gray-900">{exception.label}</p>
                                            <p className="mt-1 text-xs font-medium text-gray-600">{exception.reason}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${
                                            exception.severity === 'high'
                                                ? 'bg-red-100 text-red-700'
                                                : exception.severity === 'medium'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {exception.severity}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-bold text-primary-700">
                                        {exception.workflow.refNo} - {exception.workflow.clientName}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                    {workflowExceptions.length > 6 && (
                        <p className="mt-3 text-xs font-bold text-gray-500">
                            Showing 6 of {workflowExceptions.length} exceptions. Use search or open timeline details to inspect more.
                        </p>
                    )}
                </div>
            </section>

            <div className="flex flex-col gap-4">
                {isLoading ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">
                        Loading workflow timelines...
                    </div>
                ) : timelines.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">
                        No workflow timelines found.
                    </div>
                ) : timelines.map((item) => (
                    <section key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-extrabold text-gray-900">{item.refNo}</h2>
                                    <StatusHighlighter value={item.status} />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    {item.clientName} {item.mobile ? `- ${item.mobile}` : ''} · {item.service}
                                </p>
                            </div>
                            <div className="flex flex-col items-stretch gap-2 sm:items-end">
                                <div className="grid grid-cols-3 gap-2 text-right text-xs text-gray-500">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="font-semibold text-gray-900">{item.summary.followUps}</p>
                                        <p>Follow-ups</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="font-semibold text-gray-900">{item.summary.tasks}</p>
                                        <p>Tasks</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="font-semibold text-gray-900">Rs {Number(item.summary.invoiceAmount || 0).toFixed(2)}</p>
                                        <p>Invoice</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="font-semibold text-gray-900">{item.summary.convertedRenewals || 0}</p>
                                        <p>Renewals</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                    {item.nextAction?.route ? (
                                        <Link
                                            to={item.nextAction.route}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
                                        >
                                            {item.nextAction.label}
                                        </Link>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWorkflow(item)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
                            {item.stages.map((stage) => (
                                <div key={stage.key} className={`rounded-xl border p-4 ${stageTone(stage)}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-extrabold">{stage.label}</p>
                                            <p className="mt-1 text-xs opacity-80">{stage.ref || 'No reference yet'}</p>
                                        </div>
                                        {stage.complete ? <CheckCircle className="h-5 w-5 shrink-0" /> : stage.at ? <Clock className="h-5 w-5 shrink-0" /> : <Circle className="h-5 w-5 shrink-0" />}
                                    </div>
                                    <div className="mt-4 space-y-1 text-xs">
                                        <p className="font-semibold uppercase tracking-wide">{stage.status}</p>
                                        <p>{stage.owner || '-'}</p>
                                        <p className="line-clamp-2 opacity-80">{stage.detail || '-'}</p>
                                        <p className="pt-1 opacity-70">{formatDateTime(stage.at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {item.openItems.length > 0 && (
                            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
                                Pending: {item.openItems.join(', ')}
                            </p>
                        )}

                        <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-sm font-extrabold text-primary-900">Guided continuation</p>
                                    <p className="text-xs font-semibold text-primary-700">
                                        Follow-up staff and treatment staff are tracked separately; continue only the next pending step.
                                    </p>
                                </div>
                                {item.nextAction?.route ? (
                                    <Link
                                        to={item.nextAction.route}
                                        className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-primary-800"
                                    >
                                        {item.nextAction.label}
                                    </Link>
                                ) : (
                                    <span className="rounded-lg bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                                        Workflow complete
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-5">
                                {guidedStageKeys.map((key) => {
                                    const stage = getStage(item, key);
                                    return (
                                        <div key={key} className={`rounded-lg border px-3 py-2 text-xs font-bold ${stage ? stageTone(stage) : 'border-gray-200 bg-white text-gray-500'}`}>
                                            <p>{stage?.label || key}</p>
                                            <p className="mt-1 font-extrabold">{stage?.complete ? 'Done' : stage?.status || 'Pending'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {selectedWorkflow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-extrabold text-gray-900">{selectedWorkflow.refNo}</h2>
                                    <StatusHighlighter value={selectedWorkflow.status} />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    {selectedWorkflow.clientName} {selectedWorkflow.mobile ? `- ${selectedWorkflow.mobile}` : ''} - {selectedWorkflow.service}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedWorkflow(null)}
                                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Close workflow details"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 overflow-y-auto px-6 py-5">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Step</p>
                                    <p className="mt-2 text-lg font-extrabold text-gray-900">{selectedWorkflow.currentStep}</p>
                                </div>
                                <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Invoice Amount</p>
                                    <p className="mt-2 text-lg font-extrabold text-primary-900">Rs {Number(selectedWorkflow.summary.invoiceAmount || 0).toFixed(2)}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Paid Amount</p>
                                    <p className="mt-2 text-lg font-extrabold text-emerald-900">Rs {Number(selectedWorkflow.summary.paidAmount || 0).toFixed(2)}</p>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Balance</p>
                                    <p className="mt-2 text-lg font-extrabold text-amber-900">Rs {Number(selectedWorkflow.summary.balanceAmount || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                                    <ReceiptText className="h-4 w-4 text-primary-600" />
                                    <h3 className="text-sm font-extrabold text-gray-900">Workflow Steps</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {selectedWorkflow.stages.map((stage, index) => (
                                        <div key={stage.key} className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[48px_1fr_160px] lg:items-start">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-extrabold ${stageTone(stage)}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-extrabold text-gray-900">{stage.label}</p>
                                                    <StatusHighlighter value={stage.status || 'Pending'} />
                                                </div>
                                                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-3">
                                                    <p><span className="font-semibold text-gray-800">Reference:</span> {stage.ref || '-'}</p>
                                                    <p><span className="font-semibold text-gray-800">Owner:</span> {stage.owner || '-'}</p>
                                                    <p><span className="font-semibold text-gray-800">Time:</span> {formatDateTime(stage.at)}</p>
                                                </div>
                                                <p className="mt-2 text-sm text-gray-600">{stage.detail || 'No details recorded yet.'}</p>
                                            </div>
                                            <div className="flex justify-start lg:justify-end">
                                                <div className="flex flex-col items-start gap-2 lg:items-end">
                                                    {stage.complete ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                            <CheckCircle className="h-4 w-4" />
                                                            Done
                                                        </span>
                                                    ) : stage.at ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                                            <Clock className="h-4 w-4" />
                                                            In Progress
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                                                            <Circle className="h-4 w-4" />
                                                            Pending
                                                        </span>
                                                    )}
                                                    {!stage.complete && stage.nextRoute ? (
                                                        <Link
                                                            to={stage.nextRoute}
                                                            className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
                                                        >
                                                            {stage.actionLabel || `Open ${stage.label}`}
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-gray-100 bg-white">
                                    <div className="border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-extrabold text-gray-900">Renewal Trace</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-500">
                                            Renewal follow-up status and converted enquiry reference.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 p-4 text-sm text-gray-700 sm:grid-cols-2">
                                        <p><span className="font-semibold text-gray-900">Status:</span> {labelize(selectedWorkflow.renewal?.status)}</p>
                                        <p><span className="font-semibold text-gray-900">Outcome:</span> {labelize(selectedWorkflow.renewal?.outcome)}</p>
                                        <p><span className="font-semibold text-gray-900">Next Call:</span> {formatDateTime(selectedWorkflow.renewal?.scheduledAt || null)}</p>
                                        <p><span className="font-semibold text-gray-900">New Enquiry:</span> {selectedWorkflow.renewal?.convertedEnquiryRefNo || '-'}</p>
                                        <p className="sm:col-span-2">
                                            <span className="font-semibold text-gray-900">Notes:</span> {selectedWorkflow.renewal?.notes || 'No renewal notes recorded.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-white">
                                    <div className="border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-extrabold text-gray-900">Customer Closure</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-500">
                                            Final feedback and complaint status for this service.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 p-4 text-sm text-gray-700 sm:grid-cols-2">
                                        <p><span className="font-semibold text-gray-900">Feedback:</span> {labelize(selectedWorkflow.closure?.feedbackStatus)}</p>
                                        <p><span className="font-semibold text-gray-900">Rating:</span> {selectedWorkflow.closure?.feedbackRating ? `${selectedWorkflow.closure.feedbackRating}/5` : '-'}</p>
                                        <p><span className="font-semibold text-gray-900">Recorded:</span> {formatDateTime(selectedWorkflow.closure?.feedbackAt || null)}</p>
                                        <p><span className="font-semibold text-gray-900">Closure:</span> {labelize(selectedWorkflow.closure?.finalClosureStatus)}</p>
                                        <p><span className="font-semibold text-gray-900">Complaint:</span> {selectedWorkflow.closure?.complaintRefNo || '-'}</p>
                                        <p><span className="font-semibold text-gray-900">Complaint Status:</span> {labelize(selectedWorkflow.closure?.complaintStatus)}</p>
                                        <p className="sm:col-span-2">
                                            <span className="font-semibold text-gray-900">Comments:</span> {selectedWorkflow.closure?.feedbackComments || 'No feedback comments recorded.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-white">
                                    <div className="border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-extrabold text-gray-900">Audit Trail</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-500">
                                            Stored workflow logs from enquiry through closure.
                                        </p>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-4">
                                        {selectedWorkflow.auditTrail?.length ? (
                                            <div className="space-y-3">
                                                {selectedWorkflow.auditTrail.map((event) => (
                                                    <div key={event.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-extrabold text-gray-900">{labelize(event.entityType)}</p>
                                                            <p className="text-xs font-semibold text-gray-500">{formatDateTime(event.createdAt)}</p>
                                                        </div>
                                                        <p className="mt-1 text-xs font-bold text-primary-700">
                                                            {labelize(event.fromState)} -&gt; {labelize(event.toState)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-600">
                                                            By {event.actionByName || 'System'}{event.notes ? ` - ${event.notes}` : ''}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm font-medium text-gray-500">
                                                No workflow audit logs recorded yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                                {selectedWorkflow.openItems.length > 0
                                    ? `Pending items: ${selectedWorkflow.openItems.join(', ')}`
                                    : 'All workflow stages are complete.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
