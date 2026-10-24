import { useMemo, useState } from 'react'
import { ClipboardList, Pill } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useInventoryStockIssueRequests } from '../../inventory/hooks/useInventory'
import type { InventoryStockIssueRequest } from '../../inventory/types'

const medicineCategory = 'medical'
const medicineUsageType = 'PATIENT_MEDICATION'

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-GB')
}

const formatClinicalNotes = (value?: string | null) => {
    const text = String(value || '').trim()
    if (!text) return { summary: '-', details: '' }

    const referenceIndex = text.search(/\b(Reference|Allocation|Task|Task ID|Care Type):/i)
    if (referenceIndex <= 0) return { summary: text, details: '' }

    return {
        summary: text.slice(0, referenceIndex).trim() || '-',
        details: text.slice(referenceIndex).trim()
    }
}

export function MedicineIssueLog() {
    const [searchQuery, setSearchQuery] = useState('')
    const { data: issueRequests = [], isLoading } = useInventoryStockIssueRequests()

    const issuedMedicines = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return issueRequests
            .filter((request) => {
                const category = String(request.category || '').toLowerCase()
                return request.status === 'APPROVED' && (category === medicineCategory || request.usageType === medicineUsageType)
            })
            .filter((request) => !query || [
                request.productName,
                request.issuedTo || '',
                request.notes || '',
                request.requestedBy || '',
                request.approvedBy || '',
                request.quantity
            ].some((value) => String(value).toLowerCase().includes(query)))
    }, [issueRequests, searchQuery])

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
                        <span className="text-xs font-semibold text-gray-500">Qty issued: {request.quantity}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'issuedTo',
            header: 'Patient / Receiver',
            cell: (request) => (
                <span className="block max-w-36 truncate" title={request.issuedTo || '-'}>
                    {request.issuedTo || '-'}
                </span>
            )
        },
        {
            key: 'notes',
            header: 'Clinical Notes',
            cell: (request) => {
                const notes = formatClinicalNotes(request.notes)

                return (
                    <div className="max-w-[30rem] whitespace-normal break-words leading-relaxed">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-gray-100" title={notes.summary}>
                            {notes.summary}
                        </p>
                        {notes.details && (
                            <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500" title={notes.details}>
                                {notes.details}
                            </p>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'approved',
            header: 'Issued / Approved',
            cell: (request) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{request.approvedBy || 'Approved'}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(request.approvedAt || request.updatedAt)}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'requested',
            header: 'Requested By',
            cell: (request) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{request.requestedBy || '-'}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(request.requestedAt)}</span>
                </div>
            )
        },
        { key: 'status', header: 'Status', cell: () => <StatusHighlighter value="Issued" /> }
    ]

    const totalQuantity = issuedMedicines.reduce((sum, request) => sum + Number(request.quantity || 0), 0)
    const uniquePatients = new Set(issuedMedicines.map((request) => request.issuedTo || '').filter(Boolean)).size

    const summary = [
        { label: 'Issued Records', value: issuedMedicines.length, tone: 'bg-primary-50 text-primary-700' },
        { label: 'Total Qty Issued', value: totalQuantity, tone: 'bg-emerald-50 text-emerald-700' },
        { label: 'Patients / Receivers', value: uniquePatients, tone: 'bg-sky-50 text-sky-700' }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Medicine Issue Log"
                subtitle="Approved medicine issues recorded from live medication requests."
                breadcrumbs={[{ label: 'Healthcare' }, { label: 'Medicine Issue Log' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                {summary.map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    This log is generated from approved medicine requests, so it follows the same live stock approval trail.
                </div>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search medicine, patient, requester, approver, notes..."
            />

            <DataTable
                data={issuedMedicines}
                columns={columns}
                keyExtractor={(request) => request.id}
                isLoading={isLoading}
                emptyStateMessage="No approved medicine issue records found."
            />
        </div>
    )
}
