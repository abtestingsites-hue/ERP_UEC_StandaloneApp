import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarPlus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useCreateMyLeaveRequest, useMyLeaveRequests } from '../../hr/hooks/useHR'
import type { LeaveRequest } from '../../hr/types'

const today = new Date().toISOString().split('T')[0]

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

export function MyLeave() {
    const { data: leaveRequests = [], isLoading } = useMyLeaveRequests()
    const createLeave = useCreateMyLeaveRequest()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        leaveType: 'Casual Leave',
        fromDate: today,
        toDate: today,
        reason: ''
    })

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

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        createLeave.mutate(formData, {
            onSuccess: () => {
                setIsDrawerOpen(false)
                setFormData({
                    leaveType: 'Casual Leave',
                    fromDate: today,
                    toDate: today,
                    reason: ''
                })
            }
        })
    }

    const columns: Column<LeaveRequest>[] = [
        { key: 'leaveType', header: 'Leave Type' },
        { key: 'fromDate', header: 'From', cell: (row) => formatDate(row.fromDate) },
        { key: 'toDate', header: 'To', cell: (row) => formatDate(row.toDate) },
        { key: 'reason', header: 'Reason', cell: (row) => row.reason || '-' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={normalizeStatus(row.status)} /> },
        { key: 'remarks', header: 'HR Remarks', cell: (row) => row.remarks || '-' }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="My Leave"
                subtitle="Apply for leave and track HR approval status."
                breadcrumbs={[{ label: 'Profile' }, { label: 'My Leave' }]}
                action={
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61]"
                    >
                        <CalendarPlus className="h-4 w-4" />
                        Apply Leave
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                    { label: 'Total Applied', value: summary.total, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Waiting HR', value: summary.pending, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Approved', value: summary.approved, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Rejected', value: summary.rejected, tone: 'bg-red-50 text-red-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <DataTable
                data={leaveRequests}
                columns={columns}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyStateMessage="No leave requests submitted yet."
            />

            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl dark:bg-black">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Apply Leave</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">This request will be sent to HR for approval.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <label className="block">
                                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Leave Type</span>
                                <select
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, leaveType: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                                >
                                    <option>Casual Leave</option>
                                    <option>Sick Leave</option>
                                    <option>Emergency Leave</option>
                                    <option>Comp Off</option>
                                    <option>Permission</option>
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">From</span>
                                    <input
                                        required
                                        type="date"
                                        value={formData.fromDate}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, fromDate: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">To</span>
                                    <input
                                        required
                                        type="date"
                                        value={formData.toDate}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, toDate: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Reason</span>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                                    rows={4}
                                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                                    placeholder="Enter leave reason..."
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLeave.isPending}
                                className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61] disabled:opacity-60"
                            >
                                Submit to HR
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
