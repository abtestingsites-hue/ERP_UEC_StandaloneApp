// @ts-nocheck
import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import {
    useLeaveRequests,
    useUpdateLeaveRequestStatus
} from '../hooks/useHR'
import type { LeaveRequest } from '../types'
import { ApprovalDialog } from '../../../components/ApprovalDialog'

const normalizeStatus = (value?: string) => String(value || 'PENDING').toUpperCase()

const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

export function LeaveManagement() {
    const { data: leaveRequests = [], isLoading } = useLeaveRequests()
    const updateLeaveStatus = useUpdateLeaveRequestStatus()
    const [searchQuery, setSearchQuery] = useState('')

    const [approvalOpen, setApprovalOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

    const summary = useMemo(() => {
        return leaveRequests.reduce(
            (acc, request) => {
                const status = normalizeStatus(request.status)
                acc.total += 1
                if (status === 'PENDING') acc.pending += 1
                if (status === 'APPROVED') acc.approved += 1
                if (status === 'REJECTED') acc.rejected += 1
                return acc
            },
            { total: 0, pending: 0, approved: 0, rejected: 0 }
        )
    }, [leaveRequests])

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return leaveRequests.filter((row) =>
            (row.name || '').toLowerCase().includes(query) ||
            (row.empId || '').toLowerCase().includes(query) ||
            (row.leaveType || '').toLowerCase().includes(query) ||
            normalizeStatus(row.status).toLowerCase().includes(query)
        )
    }, [leaveRequests, searchQuery])

    const handleActionClick = (request: LeaveRequest) => {
        setSelectedRequest(request)
        setApprovalOpen(true)
    }

    const handleDecision = (comments: string, status: 'APPROVED' | 'REJECTED') => {
        if (!selectedRequest) return
        updateLeaveStatus.mutate({ id: selectedRequest.id, status })
        setApprovalOpen(false)
        setSelectedRequest(null)
    }

    const columns: Column<LeaveRequest>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'unitName', header: 'Unit', cell: (row) => row.unitName || row.unitId || '-' },
        { key: 'leaveType', header: 'Leave Type' },
        { key: 'fromDate', header: 'From', cell: (row) => formatDate(row.fromDate) },
        { key: 'toDate', header: 'To', cell: (row) => formatDate(row.toDate) },
        { key: 'reason', header: 'Reason', cell: (row) => row.reason || '-' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={normalizeStatus(row.status)} /> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Leave Management"
                subtitle="Review staff-submitted leave requests and approve or reject them."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Leave Management' }]}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                    { label: 'Total Requests', value: summary.total, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Pending', value: summary.pending, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Approved', value: summary.approved, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Rejected', value: summary.rejected, tone: 'bg-red-50 text-red-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search staff, leave type, or status..."
            />

            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No live leave requests found. Add one manually to start the flow."
                actions={(row) => {
                    const isPending = normalizeStatus(row.status) === 'PENDING'
                    return (
                        <div className="flex justify-end gap-2">
                            <button
                                disabled={!isPending || updateLeaveStatus.isPending}
                                onClick={() => handleActionClick(row)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#0F969C] px-2.5 py-1.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Review
                            </button>
                        </div>
                    )
                }}
            />

            <ApprovalDialog
                isOpen={approvalOpen}
                onClose={() => { setApprovalOpen(false); setSelectedRequest(null); }}
                title="Review Leave Request"
                entityName={`Leave for ${selectedRequest?.name} (${selectedRequest?.leaveType})`}
                onApprove={(comments) => handleDecision(comments, 'APPROVED')}
                onReject={(comments) => handleDecision(comments, 'REJECTED')}
                isProcessing={updateLeaveStatus.isPending}
            />

        </div>
    )
}

