import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CreditCard, UserCog, Users, ClipboardList, FileText, Clock, Lock, Search, UserPlus, HardHat, BarChart3 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAttendanceLogs, useLeaveRequests, usePayrollPreview, useStaff, useCandidates } from '../hooks/useHR'

const today = new Date().toISOString().split('T')[0]
const currentMonth = new Date().toISOString().slice(0, 7)

const isManualEmployee = (empId?: string) => {
    const normalized = String(empId || '').trim().toUpperCase()
    return normalized && !normalized.startsWith('DEMO-') && !normalized.startsWith('SEED-')
}

const normalizeStatus = (value?: string) => String(value || '').trim().toUpperCase()
const money = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const hrActions = [
    { title: 'Staff Management', description: 'Add, edit, and manage real staff records.', href: '/hr/staff', icon: Users },
    { title: 'Staff Privileges', description: 'Control staff menu and module access.', href: '/hr/staff-privileges', icon: UserCog },
    { title: 'Menu Privileges', description: 'Configure granular menu visibility & access rules.', href: '/hr/menu-privileges', icon: Lock },
    { title: 'Attendance Tracker', description: 'View staff check-in and attendance logs.', href: '/hr/attendance', icon: CalendarCheck },
    { title: 'Leave Management', description: 'Review, approve, and manage staff leave requests.', href: '/hr/leaves', icon: ClipboardList },
    { title: 'Shift Roster', description: 'Assign staff shifts, view capacity and resolve scheduling gaps.', href: '/hr/shift-roster', icon: Clock },
    { title: 'Document Tracker', description: 'Track and manage staff compliance documents.', href: '/hr/document-tracker', icon: FileText },
    { title: 'Payroll & Compensation', description: 'Salary preview and payroll processing.', href: '/hr/payroll', icon: CreditCard },
    { title: 'Job Enquiries', description: 'Create and review candidate enquiries.', href: '/hr/recruitment/job-enquiry', icon: Search },
    { title: 'Recruitment Pipeline', description: 'Manage candidate pipeline and placements.', href: '/hr/recruitment/pipeline', icon: UserPlus },
    { title: 'Labour Management', description: 'Manage contractors, daily wages, and labour allocation.', href: '/hr/labour-management', icon: HardHat },
    { title: 'HR Reports', description: 'Analytics, workforce metrics, and audit summaries.', href: '/hr/reports', icon: BarChart3 }
]

export function HRDashboard() {
    const { data: staffData = [] } = useStaff({ includeFormer: true, scope: 'all' })
    const { data: attendanceLogs = [] } = useAttendanceLogs({ date: today, scope: 'all' })
    const { data: leaveRequests = [] } = useLeaveRequests()
    const { data: payrollRows = [] } = usePayrollPreview({ month: currentMonth, scope: 'all' })
    const { data: candidates = [] } = useCandidates()
    const staff = useMemo(() => staffData.filter((s) => isManualEmployee(s.empId)), [staffData])

    const metrics = useMemo(() => {
        const active = staff.filter((s) => !s.isDeleted && !['RESIGNED', 'TERMINATED'].includes(normalizeStatus(s.status)))
        const pendingLeave = leaveRequests.filter((request) => normalizeStatus(request.status) === 'PENDING')
        const activeCandidates = candidates.filter((c) => !c.isPlaced)
        const payrollQueue = payrollRows.filter((row) => normalizeStatus(row.status) !== 'PROCESSED' && Number(row.grossPay || 0) > 0)
        const netPayable = payrollRows.reduce((total, row) => total + Number(row.netPay || 0), 0)

        return [
            { label: 'Active Staff', value: active.length, note: 'Manual staff currently working' },
            { label: 'Today Attendance', value: attendanceLogs.length, note: 'Staff check-ins logged today' },
            { label: 'Recruitment Pipeline', value: activeCandidates.length, note: 'Active candidates in pipeline' },
            { label: 'Payroll Queue', value: payrollQueue.length, note: `${money(netPayable)} net payable` },
            { label: 'Pending Leave', value: pendingLeave.length, note: 'Waiting for HR approval' }
        ]
    }, [attendanceLogs.length, leaveRequests, payrollRows, staff])

    const followUps = useMemo(() => {
        const leaveItems = leaveRequests
            .filter((request) => normalizeStatus(request.status) === 'PENDING')
            .slice(0, 4)
            .map((request) => ({
                id: request.id,
                item: 'Leave approval',
                owner: request.name,
                department: request.leaveType,
                status: 'Pending'
            }))
        const payrollItems = payrollRows
            .filter((row) => normalizeStatus(row.status) !== 'PROCESSED' && Number(row.grossPay || 0) > 0)
            .slice(0, 4)
            .map((row) => ({
                id: row.id,
                item: 'Payroll processing',
                owner: row.name,
                department: row.role,
                status: row.status
            }))
        const candidateItems = candidates
            .filter((c) => !c.isPlaced)
            .slice(0, 4)
            .map((c) => ({
                id: c.id,
                item: 'Candidate Pipeline',
                owner: c.name,
                department: c.preferredRole || 'General',
                status: c.stage || 'LEAD'
            }))
        return [...leaveItems, ...payrollItems, ...candidateItems]
    }, [leaveRequests, payrollRows, candidates])

    const columns: Column<any>[] = [
        { key: 'item', header: 'HR Follow-up' },
        { key: 'owner', header: 'Staff' },
        { key: 'department', header: 'Department' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent">
            <PageHeader
                title="HR Dashboard"
                subtitle="Live staff strength, attendance, leave, payroll, and HR follow-ups."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'HR Dashboard' }]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 rounded-3xl p-5 shadow-xs transition-all">
                        <p className="text-sm font-bold text-gray-500 dark:text-[#B8D9E8]">{metric.label}</p>
                        <p className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">{metric.value}</p>
                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-[#6DA5C0]">{metric.note}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {hrActions.map((action) => (
                    <Link
                        key={action.href}
                        to={action.href}
                        className="group rounded-3xl border border-gray-100 dark:border-[#6DA5C0]/15 bg-white dark:bg-[#072E33] p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0F969C]/50 hover:shadow-md dark:hover:border-[#0F969C] dark:hover:shadow-[0_12px_24px_rgba(5,22,26,0.3)] cursor-pointer flex flex-col justify-between"
                    >
                        <div>
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0F969C]/10 text-[#0F969C] group-hover:bg-[#0F969C] group-hover:text-white transition-colors">
                                <action.icon className="h-5 w-5 shrink-0" />
                            </div>
                            <p className="text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-[#0F969C] dark:group-hover:text-[#D8EEF5] transition-colors">{action.title}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-[#B8D9E8] line-clamp-2">{action.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <DataTable
                data={followUps}
                columns={columns}
                keyExtractor={(row) => row.id}
                emptyStateMessage="No live HR follow-ups available"
            />
        </div>
    )
}
