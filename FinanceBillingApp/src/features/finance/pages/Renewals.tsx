import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, CalendarClock, CheckCircle2, MessageCircleWarning, Search } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { customerCareService } from '../../customer_care/services/customer_care'
import { useCreateRenewalFollowUp } from '../../customer_care/hooks/useCustomerCare'
import { useAuthStore } from '../../../store/authStore'

type RenewalCandidate = {
    id: string
    enquiryId: string | null
    enquiryRef: string | null
    clientName: string
    service: string
    allocationRef: string
    invoiceNo: string
    receiptNo: string
    paidAmount: number
    paymentDate: string | null
    feedbackRating: number | null
    complaintRefNo: string | null
    complaintStatus: string | null
    renewalDate: string | null
    renewalFollowUpId: string | null
    renewalFollowUpStatus: string | null
    renewalConvertedEnquiryRefNo: string | null
    status: string
}

const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

const addDays = (value?: string | null, days = 30) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    date.setDate(date.getDate() + days)
    return date.toISOString()
}

const formatRenewalStatus = (value?: string | null, hasFollowUp = false) => {
    const normalized = String(value || '').trim().toUpperCase()
    if (normalized === 'RENEWAL_CALL_LATER') return 'Call Later'
    if (normalized === 'RENEWAL_INTERESTED') return 'Interested'
    if (normalized === 'RENEWAL_NOT_INTERESTED') return 'Not Interested'
    if (normalized === 'RENEWAL_CONVERTED_TO_NEW_SERVICE') return 'Converted To New Service'
    if (normalized === 'RENEWAL_CLOSED') return 'Closed'
    if (normalized === 'RENEWAL' || normalized === 'CREATED' || hasFollowUp) return 'Follow-up Created'
    return ''
}

const buildCandidateStatus = (item: any): RenewalCandidate['status'] => {
    const renewalStatus = formatRenewalStatus(item.renewalFollowUpStatus, Boolean(item.renewalFollowUpId))
    if (renewalStatus) {
        return renewalStatus
    }
    const complaintStatus = String(item.complaintStatus || '').toUpperCase()
    if (item.complaintId && (!complaintStatus || !['CLOSED', 'RESOLVED'].includes(complaintStatus))) {
        return 'Complaint Pending'
    }
    if (item.feedbackStatus !== 'COLLECTED') {
        return 'Feedback Pending'
    }
    return 'Ready for Follow-up'
}

export function Renewals() {
    const [searchParams] = useSearchParams()
    const routeUnitId = searchParams.get('unitId')
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [renewalCandidate, setRenewalCandidate] = useState<RenewalCandidate | null>(null)
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)
    const createRenewalFollowUp = useCreateRenewalFollowUp()

    const { data: serviceHistory = [], isLoading } = useQuery({
        queryKey: ['finance', 'renewal-candidates', routeUnitId || (canReadAllUnits ? 'all' : 'unit')],
        queryFn: () => customerCareService.getRenewalCandidates({
            ...(routeUnitId ? { unitId: routeUnitId } : { scope: canReadAllUnits ? 'all' : undefined })
        }),
        retry: false
    })

    const candidates = useMemo<RenewalCandidate[]>(() => {
        return serviceHistory
            .filter((item: any) => String(item.paymentStatus || '').toUpperCase() === 'PAID')
            .map((item: any) => ({
                id: item.id,
                enquiryId: item.enquiryId || null,
                enquiryRef: item.ref || item.enquiryRef || null,
                clientName: item.clientName || 'Client',
                service: item.service || 'Service',
                allocationRef: item.allocationRef || item.ref || '-',
                invoiceNo: item.invoiceNo || '-',
                receiptNo: item.receiptNo || '-',
                paidAmount: Number(item.paidAmount || 0),
                paymentDate: item.workflowClosedAt || item.feedbackAt || null,
                feedbackRating: item.feedbackRating || null,
                complaintRefNo: item.complaintRefNo || item.complaintId || null,
                complaintStatus: item.complaintStatus || null,
                renewalDate: item.renewalFollowUpScheduledAt || addDays(item.workflowClosedAt || item.feedbackAt, 30),
                renewalFollowUpId: item.renewalFollowUpId || null,
                renewalFollowUpStatus: item.renewalFollowUpStatus || null,
                renewalConvertedEnquiryRefNo: item.renewalConvertedEnquiryRefNo || null,
                status: buildCandidateStatus(item)
            }))
            .filter((item: RenewalCandidate) => {
                const query = searchQuery.trim().toLowerCase()
                if (!query) return true
                return [
                    item.clientName,
                    item.enquiryRef,
                    item.service,
                    item.allocationRef,
                    item.invoiceNo,
                    item.receiptNo,
                    item.renewalConvertedEnquiryRefNo,
                    item.status
                ].some((value) => String(value || '').toLowerCase().includes(query))
            })
    }, [serviceHistory, searchQuery])

    const totals = useMemo(() => ({
        total: candidates.length,
        ready: candidates.filter((item) => item.status === 'Ready for Follow-up').length,
        created: candidates.filter((item) => item.renewalFollowUpId || item.status === 'Follow-up Created').length,
        complaint: candidates.filter((item) => item.status === 'Complaint Pending').length,
        feedback: candidates.filter((item) => item.status === 'Feedback Pending').length
    }), [candidates])

    const handleCreateFollowUp = (candidate: RenewalCandidate) => {
        createRenewalFollowUp.mutate({
            allocationId: candidate.id,
            data: {
                nextDate: candidate.renewalDate,
                channel: 'CALL',
                notes: `Renewal follow-up for ${candidate.clientName} after ${candidate.service} service ${candidate.allocationRef}`
            },
            options: canReadAllUnits ? { scope: 'all' } : undefined
        }, {
            onSuccess: () => setRenewalCandidate(candidate)
        })
    }

    const columns: Column<RenewalCandidate>[] = [
        {
            key: 'clientName',
            header: 'Client',
            cell: (row) => (
                <div>
                    <p className="font-bold text-gray-900">{row.clientName}</p>
                    <p className="text-xs font-medium text-gray-500">{row.allocationRef}</p>
                </div>
            )
        },
        { key: 'service', header: 'Service' },
        {
            key: 'billing',
            header: 'Billing',
            cell: (row) => (
                <div>
                    <p className="text-sm font-bold text-gray-900">{row.invoiceNo}</p>
                    <p className="text-xs text-gray-500">{row.receiptNo}</p>
                </div>
            )
        },
        {
            key: 'paidAmount',
            header: 'Paid',
            sortable: true,
            cell: (row) => <span className="font-extrabold text-emerald-700">Rs {row.paidAmount.toFixed(2)}</span>
        },
        { key: 'paymentDate', header: 'Closed On', cell: (row) => formatDate(row.paymentDate) },
        { key: 'renewalDate', header: 'Suggested Follow-up', cell: (row) => formatDate(row.renewalDate) },
        {
            key: 'feedback',
            header: 'Feedback',
            cell: (row) => row.feedbackRating ? `${row.feedbackRating}/5` : '-'
        },
        {
            key: 'status',
            header: 'Renewal Status',
            cell: (row) => (
                <div className="flex flex-col items-start gap-1">
                    <StatusHighlighter value={row.status} />
                    {row.renewalConvertedEnquiryRefNo && (
                        <span className="text-xs font-bold text-[#0C7A7E]">
                            New Enquiry: {row.renewalConvertedEnquiryRefNo}
                        </span>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full min-w-0 flex-col gap-5">
            <PageHeader
                title="Renewals"
                breadcrumbs={[{ label: 'Finance' }, { label: 'Renewals' }]}
            />

            {renewalCandidate && (
                <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-extrabold text-emerald-900">Renewal follow-up created</p>
                        <p className="text-sm font-semibold text-emerald-700">
                            Continue to enquiry follow-up to record call later, not interested, or convert to repeat service.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Paid Services</p>
                        <CalendarClock className="h-5 w-5 text-[#0F969C]" />
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">{totals.total}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Ready</p>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-900">{totals.ready}</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Follow-ups Created</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-900">{totals.created}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Complaint Pending</p>
                        <MessageCircleWarning className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-red-900">{totals.complaint}</p>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex max-w-lg items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search renewals by client, service, invoice, or status..."
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>
            </div>

            <DataTable
                data={candidates}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                emptyStateMessage="No paid service renewal candidates found"
                actions={(item) => (
                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => handleCreateFollowUp(item)}
                            disabled={item.status !== 'Ready for Follow-up' || createRenewalFollowUp.isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-[#0F969C] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0C7A7E] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                        >
                            <CalendarPlus className="h-4 w-4" />
                            {item.renewalFollowUpId ? 'Created' : 'Create Follow-up'}
                        </button>
                    </div>
                )}
            />
        </div>
    )
}
