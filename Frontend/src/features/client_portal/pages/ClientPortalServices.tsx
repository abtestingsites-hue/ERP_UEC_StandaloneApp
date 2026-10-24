import { useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarClock, Eye, FileText, MessageSquare } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Modal } from '../../../components/Modal'
import { useClientPortalFeedback, useClientPortalServices } from '../hooks/useClientPortal'
import type { ClientPortalService } from '../services/clientPortal'

const money = (value?: number) => `Rs ${Number(value || 0).toFixed(2)}`
const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const DetailBox = ({ label, value, wide = false }: { label: string; value?: ReactNode; wide?: boolean }) => (
    <div className={`rounded-lg border border-gray-200 bg-white p-3 ${wide ? 'sm:col-span-2' : ''}`}>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-1 text-sm font-bold text-gray-900">{value || '-'}</div>
    </div>
)

const payableAmount = (service: ClientPortalService) => (
    service.paymentStatus === 'PAID'
        ? 0
        : Number(service.amountToPay ?? service.balanceAmount ?? service.invoiceAmount ?? 0)
)

const DummyQr = () => {
    const active = new Set([0, 1, 2, 4, 6, 7, 8, 10, 14, 16, 18, 20, 21, 23, 25, 28, 30, 32, 33, 34, 36, 39, 40, 42, 45, 46, 48, 50, 52, 54, 55, 56, 60, 62, 64, 65, 66, 68, 70, 72, 76, 78, 80])
    return (
        <div className="grid h-32 w-32 grid-cols-9 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {Array.from({ length: 81 }).map((_, index) => (
                <span key={index} className={active.has(index) ? 'rounded-sm bg-slate-900' : 'rounded-sm bg-slate-100'} />
            ))}
        </div>
    )
}

const RenewalStep = ({ label, done }: { label: string; done: boolean }) => (
    <div className={`rounded-lg border px-3 py-2 text-center text-xs font-extrabold ${done ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-400'}`}>
        {label}
    </div>
)

export function ClientPortalServices() {
    const { data = [], isLoading } = useClientPortalServices()
    const feedbackMutation = useClientPortalFeedback()
    const [selected, setSelected] = useState<ClientPortalService | null>(null)
    const [details, setDetails] = useState<ClientPortalService | null>(null)
    const [billing, setBilling] = useState<ClientPortalService | null>(null)
    const [renewal, setRenewal] = useState<ClientPortalService | null>(null)
    const [rating, setRating] = useState(5)
    const [comments, setComments] = useState('')

    const columns: Column<ClientPortalService>[] = [
        { key: 'allocationRef', header: 'Service Ref', cell: (row) => row.allocationRef || row.ref || '-' },
        { key: 'service', header: 'Service' },
        { key: 'patientName', header: 'Patient', cell: (row) => row.patientName || row.clientName || '-' },
        { key: 'allocatedDetails', header: 'Assigned Staff' },
        { key: 'status', header: 'Service Status', cell: (row) => <StatusHighlighter value={row.status || 'Pending'} /> },
        { key: 'paymentStatus', header: 'Payment', cell: (row) => <StatusHighlighter value={row.paymentStatus || 'Pending'} /> },
        { key: 'invoiceNo', header: 'Billing', cell: (row) => <div><p className="font-bold">{row.invoiceNo || '-'}</p><p className="text-xs text-gray-500">{money(payableAmount(row))} to pay now</p></div> },
        { key: 'renewalFollowUpStatus', header: 'Renewal', cell: (row) => row.renewalFollowUpStatus ? <StatusHighlighter value={row.renewalFollowUpStatus} /> : <span className="text-xs font-bold text-gray-400">Not scheduled</span> },
        { key: 'feedbackStatus', header: 'Feedback', cell: (row) => <StatusHighlighter value={row.feedbackStatus || 'Waiting'} /> }
    ]

    const submitFeedback = () => {
        if (!selected) return
        feedbackMutation.mutate({ allocationId: selected.id, rating, comments }, {
            onSuccess: () => {
                setSelected(null)
                setRating(5)
                setComments('')
            }
        })
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="My Services"
                subtitle="Service, payment, feedback, and closure status from live workflow data."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'My Services' }]}
            />

            <DataTable
                data={data}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No live service history is linked to this login."
                actions={(row) => (
                    <>
                        <button
                            onClick={() => setDetails(row)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:border-primary-200 hover:text-primary-700"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                        </button>
                        <button
                            onClick={() => setBilling(row)}
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 shadow-sm hover:border-emerald-300"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Invoice
                        </button>
                        <button
                            onClick={() => setRenewal(row)}
                            className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-700 shadow-sm hover:border-amber-300"
                        >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Renewal
                        </button>
                        <button
                            onClick={() => setSelected(row)}
                            disabled={row.paymentStatus !== 'PAID' || row.feedbackStatus === 'COLLECTED'}
                            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Feedback
                        </button>
                    </>
                )}
            />

            <Modal isOpen={Boolean(details)} onClose={() => setDetails(null)} title="Service Details">
                {details && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary-700">Service</p>
                            <h3 className="mt-1 text-lg font-extrabold text-gray-900">{details.service || 'Care Service'}</h3>
                            <p className="text-sm font-semibold text-gray-600">{details.allocationRef || details.ref || '-'} - {details.patientName || details.clientName || 'Client'}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailBox label="Assigned Staff" value={details.allocatedDetails} />
                            <DetailBox label="Service Status" value={<StatusHighlighter value={details.status || 'Pending'} />} />
                            <DetailBox label="Duty Reference" value={details.taskRefNo} />
                            <DetailBox label="Completed On" value={formatDateTime(details.completedAt)} />
                            <DetailBox label="Invoice" value={details.invoiceNo} />
                            <DetailBox label="Receipt" value={details.receiptNo} />
                            <DetailBox label="Invoice Amount" value={money(details.invoiceAmount)} />
                            <DetailBox label="Paid / Due" value={`${money(details.paidAmount)} paid / ${money(details.balanceAmount)} due`} />
                            <DetailBox label="Payment Status" value={<StatusHighlighter value={details.paymentStatus || 'Pending'} />} />
                            <DetailBox label="Payment Mode" value={details.paymentMode} />
                            <DetailBox label="Receipt Status" value={details.receiptNo ? 'Receipt generated' : details.paymentStatus === 'PAID' ? 'Paid, receipt not linked' : 'Payment pending'} />
                            <DetailBox label="Payment Closed On" value={formatDateTime(details.workflowClosedAt)} />
                            <DetailBox label="Feedback" value={details.feedbackStatus === 'COLLECTED' ? `${details.feedbackRating || '-'} / 5` : <StatusHighlighter value={details.feedbackStatus || 'Waiting'} />} />
                            <DetailBox label="Complaint" value={details.complaintRefNo ? <StatusHighlighter value={details.complaintRefNo} /> : 'No complaint raised'} />
                            <DetailBox label="Renewal Follow-up" value={details.renewalFollowUpStatus ? <StatusHighlighter value={details.renewalFollowUpStatus} /> : 'Not scheduled'} />
                            <DetailBox label="Renewal Date" value={formatDateTime(details.renewalFollowUpScheduledAt)} />
                            <DetailBox label="Renewal Outcome" value={details.renewalFollowUpOutcome || '-'} />
                            <DetailBox label="Renewal Enquiry" value={details.renewalConvertedEnquiryRefNo || '-'} />
                            <DetailBox label="Renewal Notes" value={details.renewalFollowUpNotes || '-'} wide />
                            <DetailBox label="Feedback Comments" value={details.feedbackComments || '-'} wide />
                            <DetailBox label="Service Notes" value={details.notes || '-'} wide />
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setDetails(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={Boolean(renewal)} onClose={() => setRenewal(null)} title="Renewal Follow-up">
                {renewal && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">Renewal Status</p>
                            <h3 className="mt-1 text-lg font-extrabold text-gray-900">{renewal.renewalFollowUpStatus || 'Not scheduled'}</h3>
                            <p className="text-sm font-semibold text-gray-600">{renewal.allocationRef || renewal.ref || '-'} - {renewal.service || 'Care Service'}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailBox label="Client" value={renewal.clientName} />
                            <DetailBox label="Patient" value={renewal.patientName || renewal.clientName} />
                            <DetailBox label="Next Follow-up Date" value={formatDateTime(renewal.renewalFollowUpScheduledAt)} />
                            <DetailBox label="Follow-up Outcome" value={renewal.renewalFollowUpOutcome || '-'} />
                            <DetailBox label="Renewal Enquiry Ref" value={renewal.renewalConvertedEnquiryRefNo || '-'} />
                            <DetailBox label="Last Renewal Update" value={formatDateTime(renewal.renewalFollowUpAt)} />
                            <DetailBox label="Renewal Notes" value={renewal.renewalFollowUpNotes || '-'} wide />
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Renewal Progress</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <RenewalStep label="Scheduled" done={Boolean(renewal.renewalFollowUpStatus || renewal.renewalFollowUpScheduledAt)} />
                                <RenewalStep label="Contacted" done={Boolean(renewal.renewalFollowUpOutcome || renewal.renewalFollowUpAt)} />
                                <RenewalStep label="Converted" done={Boolean(renewal.renewalConvertedEnquiryRefNo)} />
                            </div>
                        </div>

                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                            Request Renewal can be added next after we decide whether family members should create a new enquiry directly or only notify the follow-up coordinator.
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setRenewal(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={Boolean(billing)} onClose={() => setBilling(null)} title="Invoice & Payment">
                {billing && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">Current Payment</p>
                            <h3 className="mt-1 text-lg font-extrabold text-gray-900">{billing.invoiceNo || 'Invoice not generated'}</h3>
                            <p className="text-sm font-semibold text-gray-600">{billing.allocationRef || billing.ref || '-'} - {billing.service || 'Care Service'}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Amount To Pay Now</p>
                                <p className="mt-1 text-3xl font-extrabold text-emerald-700">{money(payableAmount(billing))}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
                                    <StatusHighlighter value={billing.paymentStatus || 'Pending'} />
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{billing.invoiceNo || '-'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <DummyQr />
                                <p className="mt-2 text-center text-xs font-extrabold text-slate-600">
                                    {payableAmount(billing) > 0 ? 'Scan to pay current amount' : 'Payment completed'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Why You Are Paying</p>
                            {billing.billingItems?.length ? (
                                <div className="mt-3 divide-y divide-slate-100">
                                    {billing.billingItems.map((item, index) => (
                                        <div key={`${item.costNo || index}`} className="flex items-start justify-between gap-3 py-3">
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-900">{item.category || 'Care Cost'}</p>
                                                <p className="text-xs font-semibold text-slate-500">{item.description || item.costNo || '-'}</p>
                                                <p className="mt-1 text-[11px] font-bold text-slate-400">Qty {Number(item.quantity || 0)} x {money(item.rate)}</p>
                                            </div>
                                            <p className="text-sm font-extrabold text-slate-900">{money(item.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                                    {billing.invoiceNotes || `${billing.service || 'Care service'} charges for ${billing.patientName || billing.clientName || 'patient'}.`}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailBox label="Patient" value={billing.patientName || billing.clientName} />
                            <DetailBox label="Service" value={billing.service || 'Care Service'} />
                            <DetailBox label="Invoice Amount" value={money(billing.invoiceAmount)} />
                            <DetailBox label="Payment Status" value={<StatusHighlighter value={billing.paymentStatus || 'Pending'} />} />
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setBilling(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Service Feedback">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Rating</label>
                        <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Comments</label>
                        <textarea value={comments} onChange={(event) => setComments(event.target.value)} className="mt-1 min-h-[110px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setSelected(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Cancel</button>
                        <button onClick={submitFeedback} disabled={feedbackMutation.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Submit</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
