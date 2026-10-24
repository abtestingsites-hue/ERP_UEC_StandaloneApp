import { AlertCircle, CalendarClock, CheckCircle2, CreditCard, Eye, HandHelping, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Modal } from '../../../components/Modal'
import { useClientPortalServices, useClientPortalSummary } from '../hooks/useClientPortal'
import type { ClientPortalService } from '../services/clientPortal'

const money = (value?: number) => `Rs ${Number(value || 0).toFixed(2)}`
const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const DetailBox = ({ label, value }: { label: string; value?: ReactNode }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-1 text-sm font-bold text-gray-900">{value || '-'}</div>
    </div>
)

export function ClientPortalDashboard() {
    const { data, isLoading } = useClientPortalSummary()
    const { data: allServices = [], isLoading: isServicesLoading } = useClientPortalServices()
    const services = data?.recentServices || []
    const [details, setDetails] = useState<ClientPortalService | null>(null)
    const totalInvoice = allServices.reduce((sum, service) => sum + Number(service.invoiceAmount || 0), 0)
    const totalPaid = allServices.reduce((sum, service) => sum + Number(service.paidAmount || 0), 0)
    const totalDue = allServices.reduce((sum, service) => sum + Number(service.balanceAmount || 0), 0)
    const scheduledRenewals = allServices.filter((service) => Boolean(service.renewalFollowUpStatus || service.renewalFollowUpScheduledAt)).length
    const convertedRenewals = allServices.filter((service) => Boolean(service.renewalConvertedEnquiryRefNo)).length
    const nextRenewal = allServices
        .filter((service) => service.renewalFollowUpScheduledAt)
        .sort((first, second) => new Date(first.renewalFollowUpScheduledAt || '').getTime() - new Date(second.renewalFollowUpScheduledAt || '').getTime())[0]

    const columns: Column<ClientPortalService>[] = [
        { key: 'allocationRef', header: 'Service Ref', cell: (row) => row.allocationRef || row.ref || '-' },
        { key: 'service', header: 'Service' },
        { key: 'patientName', header: 'Patient', cell: (row) => row.patientName || row.clientName || '-' },
        { key: 'allocatedDetails', header: 'Assigned Staff' },
        { key: 'paymentStatus', header: 'Payment', cell: (row) => <StatusHighlighter value={row.paymentStatus || 'Pending'} /> },
        { key: 'feedbackStatus', header: 'Feedback', cell: (row) => <StatusHighlighter value={row.feedbackStatus || 'Waiting'} /> }
    ]

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <PageHeader
                    title="My Service Dashboard"
                    subtitle="Live services linked to this login by client email or mobile."
                    breadcrumbs={[{ label: 'Client Portal' }, { label: 'Dashboard' }]}
                />
                <div className="flex flex-wrap gap-2">
                    <Link to="/client-portal/services" className="rounded-full bg-primary-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm">My Services</Link>
                    <Link to="/client-portal/complaints" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm">Complaints</Link>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-primary-100 bg-white p-4 shadow-sm">
                    <HandHelping className="h-5 w-5 text-primary-700" />
                    <p className="mt-3 text-2xl font-extrabold">{isLoading ? '-' : data?.metrics.services || 0}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">My Services</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <CreditCard className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 text-2xl font-extrabold text-emerald-900">{isLoading ? '-' : data?.metrics.paidServices || 0}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Paid Services</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <AlertCircle className="h-5 w-5 text-amber-700" />
                    <p className="mt-3 text-2xl font-extrabold text-amber-900">{isLoading ? '-' : data?.metrics.pendingFeedback || 0}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pending Feedback</p>
                </div>
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-sky-700" />
                    <p className="mt-3 text-2xl font-extrabold text-sky-900">{isLoading ? '-' : data?.metrics.openComplaints || 0}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Open Complaints</p>
                </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <ReceiptText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">Payment Summary</h3>
                            <p className="text-sm font-semibold text-gray-500">Invoice and receipt totals from your linked live services.</p>
                        </div>
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                        <DetailBox label="Total Billed" value={isServicesLoading ? '-' : money(totalInvoice)} />
                        <DetailBox label="Total Paid" value={isServicesLoading ? '-' : money(totalPaid)} />
                        <DetailBox label="Total Due" value={isServicesLoading ? '-' : money(totalDue)} />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">Renewal Summary</h3>
                            <p className="text-sm font-semibold text-gray-500">Follow-up and repeat-service status from live service history.</p>
                        </div>
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                        <DetailBox label="Scheduled Renewals" value={isServicesLoading ? '-' : scheduledRenewals} />
                        <DetailBox label="Converted Renewals" value={isServicesLoading ? '-' : convertedRenewals} />
                        <DetailBox label="Next Follow-up" value={isServicesLoading ? '-' : formatDateTime(nextRenewal?.renewalFollowUpScheduledAt)} />
                    </div>
                </div>
            </div>

            <DataTable
                data={services}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No live services are linked to this login. Create the family login with the same client email or mobile, then refresh."
                actions={(row) => (
                    <button
                        onClick={() => setDetails(row)}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:border-primary-200 hover:text-primary-700"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                    </button>
                )}
                actionsTitle="Billing"
            />

            <Modal isOpen={Boolean(details)} onClose={() => setDetails(null)} title="Service Snapshot">
                {details && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary-700">{details.allocationRef || details.ref || '-'}</p>
                            <h3 className="mt-1 text-lg font-extrabold text-gray-900">{details.service || 'Care Service'}</h3>
                            <p className="text-sm font-semibold text-gray-600">{details.patientName || details.clientName || 'Client'}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailBox label="Assigned Staff" value={details.allocatedDetails} />
                            <DetailBox label="Completed On" value={formatDateTime(details.completedAt)} />
                            <DetailBox label="Invoice" value={details.invoiceNo || '-'} />
                            <DetailBox label="Paid / Due" value={`${money(details.paidAmount)} paid / ${money(details.balanceAmount)} due`} />
                            <DetailBox label="Receipt" value={details.receiptNo || '-'} />
                            <DetailBox label="Payment Closed On" value={formatDateTime(details.workflowClosedAt)} />
                            <DetailBox label="Feedback" value={details.feedbackStatus === 'COLLECTED' ? `${details.feedbackRating || '-'} / 5` : <StatusHighlighter value={details.feedbackStatus || 'Waiting'} />} />
                            <DetailBox label="Complaint" value={details.complaintRefNo || 'No complaint raised'} />
                            <DetailBox label="Renewal Status" value={details.renewalFollowUpStatus ? <StatusHighlighter value={details.renewalFollowUpStatus} /> : 'Not scheduled'} />
                            <DetailBox label="Renewal Date" value={formatDateTime(details.renewalFollowUpScheduledAt)} />
                            <DetailBox label="Renewal Enquiry" value={details.renewalConvertedEnquiryRefNo || '-'} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Link to="/client-portal/services" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-extrabold text-white">Open Services</Link>
                            <button onClick={() => setDetails(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
