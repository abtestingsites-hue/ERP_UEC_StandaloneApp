import { useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAttendanceLogs, useLeaveRequests, usePayrollPreview, useStaff } from '../hooks/useHR'
import type { LeaveRequest, Staff } from '../types'

type AttendanceRow = {
    id: string
    date: string
    empId: string
    name: string
    checkIn: string
    checkOut: string
    status: string
}

type PayrollRow = {
    id: string
    empId: string
    name: string
    role: string
    month: string
    presentDays: number
    approvedLeaveDays: number
    absentDays: number
    grossPay: number
    deductions: number
    netPay: number
    status: string
}

type SettlementRow = {
    id: string
    empId: string
    name: string
    unitId: string
    exitDate: string
    exitReason: string
    staffStatus: string
    settlementStatus: string
    lastSalary: number
    allowance: number
    deduction: number
    payable: number
}

const today = new Date().toISOString().split('T')[0]
const currentMonth = new Date().toISOString().slice(0, 7)
const money = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`
const normalizeStatus = (value?: string) => String(value || '').trim().toUpperCase()

const getMetadata = (staff: Staff) => (
    staff.metadata && typeof staff.metadata === 'object' ? staff.metadata : {}
)

const isFormerStaff = (staff: Staff) => {
    const status = normalizeStatus(staff.status)
    return Boolean(staff.isDeleted) || status === 'RESIGNED' || status === 'TERMINATED'
}

const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<string | number>>) => {
    const escapeValue = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escapeValue).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
}

export function HRReports() {
    const [searchQuery, setSearchQuery] = useState('')
    const [attendanceDate, setAttendanceDate] = useState(today)
    const [payrollMonth, setPayrollMonth] = useState(currentMonth)
    const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL')

    const attendanceQuery = useAttendanceLogs({ date: attendanceDate, scope: 'all' })
    const leaveQuery = useLeaveRequests()
    const payrollQuery = usePayrollPreview({ month: payrollMonth, scope: 'all' })
    const staffQuery = useStaff({ includeFormer: true, scope: 'all' })

    const attendanceRows = (attendanceQuery.data || []) as AttendanceRow[]
    const leaveRows = leaveQuery.data || []
    const payrollRows = (payrollQuery.data || []) as PayrollRow[]
    const settlementRows = useMemo<SettlementRow[]>(() => {
        return ((staffQuery.data || []) as Staff[])
            .filter(isFormerStaff)
            .map((staff) => {
                const metadata = getMetadata(staff)
                const exit = metadata.exit && typeof metadata.exit === 'object' ? metadata.exit : {}
                const settlement = metadata.finalSettlement && typeof metadata.finalSettlement === 'object' ? metadata.finalSettlement : {}

                return {
                    id: staff.id,
                    empId: staff.empId || '-',
                    name: staff.name || '-',
                    unitId: staff.unitId || '-',
                    exitDate: exit.date || staff.deletedAt || '',
                    exitReason: exit.reason || '-',
                    staffStatus: staff.isDeleted ? 'Archived' : staff.status || 'Former',
                    settlementStatus: settlement.status || 'Pending',
                    lastSalary: Number(settlement.lastSalary || 0),
                    allowance: Number(settlement.allowance || 0),
                    deduction: Number(settlement.deduction || 0),
                    payable: Number(settlement.payable || 0)
                }
            })
    }, [staffQuery.data])

    const filteredAttendance = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return attendanceRows.filter((row) =>
            (row.name || '').toLowerCase().includes(query) ||
            (row.empId || '').toLowerCase().includes(query) ||
            (row.status || '').toLowerCase().includes(query)
        )
    }, [attendanceRows, searchQuery])

    const filteredLeave = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return leaveRows.filter((row) =>
            (row.name || '').toLowerCase().includes(query) ||
            (row.empId || '').toLowerCase().includes(query) ||
            (row.leaveType || '').toLowerCase().includes(query) ||
            normalizeStatus(row.status).toLowerCase().includes(query)
        )
    }, [leaveRows, searchQuery])

    const filteredPayroll = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return payrollRows.filter((row) =>
            (row.name || '').toLowerCase().includes(query) ||
            (row.empId || '').toLowerCase().includes(query) ||
            (row.role || '').toLowerCase().includes(query) ||
            (row.status || '').toLowerCase().includes(query)
        )
    }, [payrollRows, searchQuery])

    const filteredSettlement = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return settlementRows.filter((row) => {
            const matchesStatus = settlementStatusFilter === 'ALL' || normalizeStatus(row.settlementStatus) === settlementStatusFilter
            const matchesSearch =
                (row.name || '').toLowerCase().includes(query) ||
                (row.empId || '').toLowerCase().includes(query) ||
                (row.exitReason || '').toLowerCase().includes(query) ||
                (row.staffStatus || '').toLowerCase().includes(query) ||
                (row.settlementStatus || '').toLowerCase().includes(query)

            return matchesStatus && matchesSearch
        })
    }, [settlementRows, searchQuery, settlementStatusFilter])

    const summary = useMemo(() => {
        const pendingLeave = leaveRows.filter((row) => normalizeStatus(row.status) === 'PENDING').length
        const processedPayroll = payrollRows.filter((row) => normalizeStatus(row.status) === 'PROCESSED').length
        const netPayable = payrollRows.reduce((total, row) => total + Number(row.netPay || 0), 0)
        const pendingSettlement = settlementRows.filter((row) => normalizeStatus(row.settlementStatus) !== 'PAID').length
        return { attendance: attendanceRows.length, pendingLeave, processedPayroll, netPayable, pendingSettlement }
    }, [attendanceRows, leaveRows, payrollRows, settlementRows])

    const attendanceColumns: Column<AttendanceRow>[] = [
        { key: 'date', header: 'Date', cell: (row) => formatDate(row.date), sortable: true },
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'checkIn', header: 'Check In' },
        { key: 'checkOut', header: 'Check Out' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    const leaveColumns: Column<LeaveRequest>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'unitName', header: 'Unit', cell: (row) => row.unitName || row.unitId || '-' },
        { key: 'leaveType', header: 'Leave Type' },
        { key: 'fromDate', header: 'From', cell: (row) => formatDate(row.fromDate) },
        { key: 'toDate', header: 'To', cell: (row) => formatDate(row.toDate) },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={normalizeStatus(row.status)} /> }
    ]

    const payrollColumns: Column<PayrollRow>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'month', header: 'Month' },
        { key: 'presentDays', header: 'Present' },
        { key: 'approvedLeaveDays', header: 'Leave' },
        { key: 'absentDays', header: 'Absent' },
        { key: 'grossPay', header: 'Gross', cell: (row) => money(row.grossPay) },
        { key: 'deductions', header: 'Deductions', cell: (row) => money(row.deductions) },
        { key: 'netPay', header: 'Net Pay', cell: (row) => <span className="font-extrabold">{money(row.netPay)}</span> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    const settlementColumns: Column<SettlementRow>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'unitId', header: 'Unit' },
        { key: 'exitDate', header: 'Exit Date', cell: (row) => formatDate(row.exitDate), sortable: true },
        { key: 'exitReason', header: 'Exit Reason' },
        { key: 'staffStatus', header: 'Staff Status', cell: (row) => <StatusHighlighter value={row.staffStatus} /> },
        { key: 'settlementStatus', header: 'Settlement', cell: (row) => <StatusHighlighter value={row.settlementStatus} /> },
        { key: 'lastSalary', header: 'Last Salary', cell: (row) => money(row.lastSalary) },
        { key: 'allowance', header: 'Allowance', cell: (row) => money(row.allowance) },
        { key: 'deduction', header: 'Deduction', cell: (row) => money(row.deduction) },
        { key: 'payable', header: 'Final Payable', cell: (row) => <span className="font-extrabold">{money(row.payable)}</span> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="HR Reports"
                subtitle="Live attendance, leave, and payroll reports from manually created HR data."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Reports' }]}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                    { label: 'Attendance Logs', value: summary.attendance, tone: 'bg-slate-50 text-slate-700' },
                    { label: 'Pending Leave', value: summary.pendingLeave, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Processed Payroll', value: summary.processedPayroll, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Net Payable', value: money(summary.netPayable), tone: 'bg-primary-50 text-primary-700' },
                    { label: 'Settlement Pending', value: summary.pendingSettlement, tone: 'bg-orange-50 text-orange-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        Attendance Date
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(event) => setAttendanceDate(event.target.value || today)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        Payroll Month
                        <input
                            type="month"
                            value={payrollMonth}
                            onChange={(event) => setPayrollMonth(event.target.value || currentMonth)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        Settlement
                        <select
                            value={settlementStatusFilter}
                            onChange={(event) => setSettlementStatusFilter(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN PROGRESS">In Progress</option>
                            <option value="PAID">Paid</option>
                            <option value="HOLD">Hold</option>
                        </select>
                    </label>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        attendanceQuery.refetch()
                        leaveQuery.refetch()
                        payrollQuery.refetch()
                        staffQuery.refetch()
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#294D61]"
                >
                    <RefreshCw className={`h-4 w-4 ${attendanceQuery.isFetching || leaveQuery.isFetching || payrollQuery.isFetching || staffQuery.isFetching ? 'animate-spin' : ''}`} />
                    Refresh Reports
                </button>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search staff, employee ID, status, role, or leave type..."
            />

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-950">Attendance Report</h2>
                    <button
                        type="button"
                        onClick={() => downloadCsv(
                            `attendance-${attendanceDate}.csv`,
                            ['Date', 'Emp ID', 'Staff Name', 'Check In', 'Check Out', 'Status'],
                            filteredAttendance.map((row) => [row.date, row.empId, row.name, row.checkIn, row.checkOut, row.status])
                        )}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>
                </div>
                <DataTable data={filteredAttendance} columns={attendanceColumns} keyExtractor={(row) => row.id} isLoading={attendanceQuery.isLoading} emptyStateMessage="No manual attendance logs found for this date." />
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-950">Leave Report</h2>
                    <button
                        type="button"
                        onClick={() => downloadCsv(
                            'leave-report.csv',
                            ['Emp ID', 'Staff Name', 'Unit', 'Leave Type', 'From', 'To', 'Status'],
                            filteredLeave.map((row) => [row.empId, row.name, row.unitName || row.unitId || '-', row.leaveType, row.fromDate, row.toDate, row.status])
                        )}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>
                </div>
                <DataTable data={filteredLeave} columns={leaveColumns} keyExtractor={(row) => row.id} isLoading={leaveQuery.isLoading} emptyStateMessage="No live leave requests found." />
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-950">Payroll Report</h2>
                    <button
                        type="button"
                        onClick={() => downloadCsv(
                            `payroll-${payrollMonth}.csv`,
                            ['Emp ID', 'Staff Name', 'Month', 'Present', 'Leave', 'Absent', 'Gross', 'Deductions', 'Net Pay', 'Status'],
                            filteredPayroll.map((row) => [row.empId, row.name, row.month, row.presentDays, row.approvedLeaveDays, row.absentDays, row.grossPay, row.deductions, row.netPay, row.status])
                        )}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>
                </div>
                <DataTable data={filteredPayroll} columns={payrollColumns} keyExtractor={(row) => row.id} isLoading={payrollQuery.isLoading} emptyStateMessage="No manual payroll data found for this month." />
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-950">Final Settlement Report</h2>
                    <button
                        type="button"
                        onClick={() => downloadCsv(
                            'final-settlement-report.csv',
                            ['Emp ID', 'Staff Name', 'Unit', 'Exit Date', 'Exit Reason', 'Staff Status', 'Settlement Status', 'Last Salary', 'Allowance', 'Deduction', 'Final Payable'],
                            filteredSettlement.map((row) => [row.empId, row.name, row.unitId, row.exitDate, row.exitReason, row.staffStatus, row.settlementStatus, row.lastSalary, row.allowance, row.deduction, row.payable])
                        )}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>
                </div>
                <DataTable data={filteredSettlement} columns={settlementColumns} keyExtractor={(row) => row.id} isLoading={staffQuery.isLoading} emptyStateMessage="No former staff settlement records found. Mark a staff as resigned or terminated first." />
            </section>
        </div>
    )
}
