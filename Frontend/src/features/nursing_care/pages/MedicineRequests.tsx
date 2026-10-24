import { useMemo, useState } from 'react'
import { ClipboardCheck, Pill, Search } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { hasPermissionAccess } from '../../../lib/access'
import { useAuthStore } from '../../../store/authStore'
import {
    useApproveInventoryStockIssueRequest,
    useInventoryStock,
    useInventoryStockIssueRequests,
    useRejectInventoryStockIssueRequest
} from '../../inventory/hooks/useInventory'
import type { InventoryStockIssueRequest } from '../../inventory/types'

const medicineCategory = 'medical'
const medicineUsageType = 'PATIENT_MEDICATION'

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-GB')
}

const formatUsageType = (value: string) => {
    if (value === medicineUsageType) return 'Patient Medication'
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

const getNoteValue = (notes: string | null | undefined, key: string) => {
    const line = String(notes || '').split('\n').find((item) => item.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`))
    return line ? line.split(':').slice(1).join(':').trim() : ''
}

const getClinicalNote = (notes: string | null | undefined) => {
    const firstLine = String(notes || '').split('\n').find((line) => {
        const normalized = line.trim().toLowerCase()
        return normalized && !['reference:', 'allocation:', 'task:', 'task id:', 'care type:'].some((prefix) => normalized.startsWith(prefix))
    })
    return firstLine || '-'
}

export function MedicineRequests() {
    const user = useAuthStore((state) => state.user)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | InventoryStockIssueRequest['status']>('ALL')

    const { data: issueRequests = [], isLoading } = useInventoryStockIssueRequests()
    const { data: stock = [] } = useInventoryStock()
    const approveIssueRequest = useApproveInventoryStockIssueRequest()
    const rejectIssueRequest = useRejectInventoryStockIssueRequest()

    const canApproveMedicine = hasPermissionAccess(user, ['Stock Issue Approval'])

    const medicineRequests = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return issueRequests
            .filter((request) => {
                const category = String(request.category || '').toLowerCase()
                return category === medicineCategory || request.usageType === medicineUsageType
            })
            .filter((request) => statusFilter === 'ALL' || request.status === statusFilter)
            .filter((request) => !query || [
                request.productName,
                request.category,
                request.usageType,
                request.issuedTo || '',
                request.notes || '',
                request.status,
                request.requestedBy || ''
            ].some((value) => String(value).toLowerCase().includes(query)))
    }, [issueRequests, searchQuery, statusFilter])

    const stockByProductId = useMemo(() => new Map(stock.map((item) => [item.productId, Number(item.quantity || 0)])), [stock])

    const handleApprove = async (request: InventoryStockIssueRequest) => {
        const currentQuantity = stockByProductId.get(request.productId) || 0
        if (!canApproveMedicine || request.status !== 'PENDING' || request.quantity > currentQuantity) return

        await approveIssueRequest.mutateAsync(request.id)
    }

    const handleReject = async (request: InventoryStockIssueRequest) => {
        if (!canApproveMedicine || request.status !== 'PENDING') return

        await rejectIssueRequest.mutateAsync(request.id)
    }

    const columns: Column<InventoryStockIssueRequest>[] = [
        { key: 'sno', header: 'S.No', cell: (_item, index) => index + 1, sortable: false },
        {
            key: 'medicine',
            header: 'Medicine',
            cell: (request) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Pill className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100">{request.productName}</span>
                        <span className="text-xs font-semibold text-gray-500">{request.category || 'medical'}</span>
                    </div>
                </div>
            )
        },
        { key: 'quantity', header: 'Qty', sortable: true },
        {
            key: 'purpose',
            header: 'Patient / Purpose',
            cell: (request) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{request.issuedTo || '-'}</span>
                    <span className="text-xs text-gray-500">{formatUsageType(request.usageType)}</span>
                    <span className="text-xs text-gray-400">{getClinicalNote(request.notes)}</span>
                    {(getNoteValue(request.notes, 'Reference') || getNoteValue(request.notes, 'Allocation')) ? (
                        <span className="text-xs font-semibold text-primary-700">
                            {[getNoteValue(request.notes, 'Reference'), getNoteValue(request.notes, 'Allocation')].filter(Boolean).join(' / ')}
                        </span>
                    ) : null}
                </div>
            )
        },
        {
            key: 'requested',
            header: 'Requested',
            cell: (request) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{request.requestedBy || 'Requester'}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(request.requestedAt)}</span>
                </div>
            ),
            sortable: true
        },
        { key: 'status', header: 'Status', cell: (request) => <StatusHighlighter value={request.status} /> },
        {
            key: 'action',
            header: 'Action',
            cell: (request) => {
                const currentQuantity = stockByProductId.get(request.productId) || 0
                const canApprove = request.status === 'PENDING' && request.quantity <= currentQuantity

                if (request.status !== 'PENDING') {
                    return <span className="text-xs font-bold text-gray-500">Closed</span>
                }

                if (!canApproveMedicine) {
                    return <span className="text-xs font-bold text-amber-600">Waiting approval</span>
                }

                return (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleApprove(request)}
                            disabled={!canApprove || approveIssueRequest.isPending || rejectIssueRequest.isPending}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={() => handleReject(request)}
                            disabled={approveIssueRequest.isPending || rejectIssueRequest.isPending}
                            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                            Reject
                        </button>
                    </div>
                )
            },
            sortable: false
        }
    ]

    const summary = [
        { label: 'Total Medicine Requests', value: medicineRequests.length, tone: 'bg-primary-50 text-primary-700' },
        { label: 'Pending', value: medicineRequests.filter((request) => request.status === 'PENDING').length, tone: 'bg-amber-50 text-amber-700' },
        { label: 'Approved', value: medicineRequests.filter((request) => request.status === 'APPROVED').length, tone: 'bg-emerald-50 text-emerald-700' },
        { label: 'Rejected', value: medicineRequests.filter((request) => request.status === 'REJECTED').length, tone: 'bg-rose-50 text-rose-700' }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Medicine Requests"
                subtitle="Medical stock issue requests separated from ration and general inventory."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Medicine Requests' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                {summary.map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                            if (item.label === 'Pending') setStatusFilter('PENDING')
                            else if (item.label === 'Approved') setStatusFilter('APPROVED')
                            else if (item.label === 'Rejected') setStatusFilter('REJECTED')
                            else setStatusFilter('ALL')
                        }}
                        className={`rounded-2xl border border-slate-100 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}
                    >
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </button>
                ))}
            </div>

            <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Medicine requests are filtered from live inventory issue requests using medical category or patient medication purpose.
                </div>
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                <FilterSection
                    searchQuery={searchQuery}
                    onSearchChange={(event) => setSearchQuery(event.target.value)}
                    searchPlaceholder="Search medicine, patient, requester, status..."
                />
                <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
                    <Search className="h-4 w-4 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <DataTable
                data={medicineRequests}
                columns={columns}
                keyExtractor={(request) => request.id}
                isLoading={isLoading}
                emptyStateMessage="No live medicine requests found. Create a request from Medication Management."
            />
        </div>
    )
}
