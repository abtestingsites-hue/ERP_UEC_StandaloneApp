import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Activity,
    AlertTriangle,
    Ambulance,
    ArrowRight,
    CalendarClock,
    ClipboardList,
    Headset,
    HeartPulse,
    IndianRupee,
    PhoneCall,
    ShieldCheck,
    TrendingUp,
    Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { useWorkflowTimelines } from '../features/workflow/services/workflowTimeline'
import { getRoleWorkflowActionItems } from '../features/workflow/utils/actionQueue'
import { useCashbox, useInvoices } from '../features/accounts/hooks/useAccounts'
import { useComplaints } from '../features/customer_care/hooks/useCustomerCare'
import { customerCareService } from '../features/customer_care/services/customer_care'
import { useAdmissions, useEnquiries } from '../features/enquiry/hooks/useEnquiry'
import { useClinicalAllocations, useHomeCareAllocations, useInHouseAllocations, useOthersAllocations } from '../features/allocation/hooks/useAllocation'
import { useInventoryProducts, useInventoryPurchases, useInventoryStock, useInventoryStockMovements } from '../features/inventory/hooks/useInventory'
import { useApprovalTasks, useTasks } from '../features/task_log/hooks/useTasks'
import type { Task } from '../features/task_log/types'
import { useAttendanceLogs, useLeaveRequests, usePayrollPreview, useStaff } from '../hooks/useHRData'
import { useLaundryRecords, useMaintenanceRecords, useMealPreps, useOperationsNutritionPlans, useWasteRecords } from '../features/operations/hooks/useOperations'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/axios'
import { useUecAdminDashboard, useUecFinanceDashboard } from '../hooks/useDashboard'
import { useMedicalDashboard } from '../features/medical/hooks/useMedical'
import { useTrips } from '../features/ambulance/hooks/useAmbulance'

type Metric = {
    label: string
    value: string | number
    helper: string
    icon: LucideIcon
}

type WorkItem = {
    id: string
    name: string
    detail: string
    status: string
    owner: string
    due: string
}

type AdminFileDashboardRecord = {
    id?: string
    group?: string
    fileType?: string
    relatedName?: string
    fileNo?: string
    fileName?: string
    maintainedBy?: string
    date?: string
    expiryDate?: string
    renewalReminderDate?: string
    status?: string
    remarks?: string
    uploadedFileUrl?: string
}

const colors = ['#0F969C', '#294D61', '#6DA5C0', '#0C7075', '#072E33', '#8BC7DC']

const formatShortMoney = (amount: number) => {
    if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`
    if (amount >= 1000) return `Rs ${Math.round(amount / 1000)}k`
    return `Rs ${Math.round(amount)}`
}

const currentIsoDate = new Date().toISOString().split('T')[0]
const currentPayrollMonth = new Date().toISOString().slice(0, 7)

const isManualEmployee = (empId?: string) => {
    const normalized = String(empId || '').trim().toUpperCase()
    return normalized && !normalized.startsWith('DEMO-') && !normalized.startsWith('SEED-')
}

const normalizeDashboardStatus = (value?: string) => String(value || '').trim().toUpperCase()

const buildEmptyMonthlyTrend = (keys: string[]) => {
    const today = new Date()
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1)
        return keys.reduce<Record<string, string | number>>((row, key) => {
            row[key] = 0
            return row
        }, { month: date.toLocaleDateString('en-IN', { month: 'short' }) })
    })
}

const buildCurrentMonthTrend = (values: Record<string, number>) => {
    const keys = Object.keys(values)
    const trend = buildEmptyMonthlyTrend(keys)
    const current = trend.at(-1)
    if (current) {
        keys.forEach((key) => {
            current[key] = values[key] || 0
        })
    }

    return trend
}

const fetchAdminFileRegisterRecords = async (): Promise<AdminFileDashboardRecord[]> => {
    const response = await api.get('/admin-files/register')
    return response.data?.data || []
}

const getAdminFileRenewalStatus = (record: AdminFileDashboardRecord) => {
    if (!record.expiryDate) return 'No Expiry'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(record.expiryDate)
    expiryDate.setHours(0, 0, 0, 0)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysToExpiry < 0) return 'Expired'
    if (daysToExpiry <= 30) return 'Due Soon'

    if (record.renewalReminderDate) {
        const reminderDate = new Date(record.renewalReminderDate)
        reminderDate.setHours(0, 0, 0, 0)
        if (today >= reminderDate) return 'Due Soon'
    }

    return 'Active'
}

function MetricCard({ metric }: { metric: Metric }) {
    const Icon = metric.icon
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
            </div>
            <p className="mt-4 text-2xl font-extrabold leading-none text-gray-950 dark:text-gray-100">{metric.value}</p>
            <p className="mt-2 text-sm font-extrabold text-gray-700 dark:text-gray-200">{metric.label}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{metric.helper}</p>
        </div>
    )
}

function QuickLinks({ links }: { links: Array<{ label: string; href: string }> }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {links.map((link) => (
                <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-black dark:text-gray-100"
                >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            ))}
        </div>
    )
}

function TrendChart({ title, subtitle, data, keys }: { title: string; subtitle: string; data: Array<Record<string, string | number>>; keys: string[] }) {
    return (
        <div className="min-h-[340px] rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">{title}</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <div className="h-[260px] w-full min-w-[1px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                        <Tooltip />
                        <Legend />
                        {keys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[8, 8, 0, 0]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

function SplitChart({ title, subtitle, data }: { title: string; subtitle: string; data: Array<{ name: string; value: number }> }) {
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)

    return (
        <div className="min-h-[340px] rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">{title}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
            <div className="mt-4 h-[260px] w-full min-w-[1px]">
                {total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="76%" paddingAngle={4}>
                                {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-sm font-bold text-gray-500">
                        No live split data available.
                    </div>
                )}
            </div>
        </div>
    )
}

function WorkTable({ title, subtitle, rows }: { title: string; subtitle: string; rows: WorkItem[] }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">{title}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs font-extrabold uppercase tracking-wide text-gray-400 dark:border-white/10">
                            <th className="py-3">ID</th>
                            <th className="py-3">Name</th>
                            <th className="py-3">Detail</th>
                            <th className="py-3">Owner</th>
                            <th className="py-3">Status</th>
                            <th className="py-3">Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b border-gray-50 last:border-0 dark:border-white/5">
                                <td className="py-3 font-extrabold text-gray-900 dark:text-gray-100">{row.id}</td>
                                <td className="py-3 font-semibold text-gray-700 dark:text-gray-200">{row.name}</td>
                                <td className="py-3 text-gray-600 dark:text-gray-300">{row.detail}</td>
                                <td className="py-3 text-gray-600 dark:text-gray-300">{row.owner}</td>
                                <td className="py-3">
                                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-700">{row.status}</span>
                                </td>
                                <td className="py-3 text-gray-600 dark:text-gray-300">{row.due}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm font-bold text-gray-500">
                        No live records available for this dashboard yet.
                    </div>
                )}
            </div>
        </div>
    )
}

function WorkflowPulse() {
    const { data: timelines = [], isLoading } = useWorkflowTimelines('')

    const metrics = useMemo(() => {
        const completed = timelines.filter((item) => item.openItems.length === 0 || String(item.currentStep).toLowerCase().includes('closed')).length
        const paymentPending = timelines.filter((item) => Number(item.summary.balanceAmount || 0) > 0).length
        const approvalPending = timelines.filter((item) => item.openItems.some((openItem) => openItem.toLowerCase().includes('approval'))).length
        const paidAmount = timelines.reduce((sum, item) => sum + Number(item.summary.paidAmount || 0), 0)

        return { completed, paymentPending, approvalPending, paidAmount }
    }, [timelines])

    return (
        <section className="rounded-lg border border-primary-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-primary-600">Operational Workflow</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Live workflow reflection</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Enquiry to payment movement visible from the workflow timeline.
                    </p>
                </div>
                <Link
                    to="/workflow/timeline"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary-600 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-primary-700"
                >
                    Open Timeline
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-gray-950">{isLoading ? '-' : timelines.length}</p>
                    <p className="text-xs font-bold text-gray-500">Total Workflows</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-emerald-800">{isLoading ? '-' : metrics.completed}</p>
                    <p className="text-xs font-bold text-emerald-700">Closed</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-amber-800">{isLoading ? '-' : metrics.paymentPending + metrics.approvalPending}</p>
                    <p className="text-xs font-bold text-amber-700">Needs Action</p>
                </div>
                <div className="rounded-lg bg-primary-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-primary-800">Rs {isLoading ? '-' : metrics.paidAmount.toFixed(2)}</p>
                    <p className="text-xs font-bold text-primary-700">Collected</p>
                </div>
            </div>
        </section>
    )
}

function RoleActionQueue() {
    const user = useAuthStore((state) => state.user)
    const { data: timelines = [], isLoading } = useWorkflowTimelines('')
    const actions = useMemo(() => getRoleWorkflowActionItems(timelines, user), [timelines, user])

    return (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-primary-600">My Action Queue</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Role-based workflow actions</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Only workflow items that match this user role are shown here.
                    </p>
                </div>
                <Link
                    to="/workflow/timeline"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-black dark:text-gray-100"
                >
                    Review All
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {isLoading ? (
                    <div className="rounded-xl bg-gray-50 px-4 py-5 text-sm font-bold text-gray-500">
                        Loading role actions...
                    </div>
                ) : actions.length === 0 ? (
                    <div className="rounded-xl bg-emerald-50 px-4 py-5 text-sm font-bold text-emerald-700">
                        No pending role actions.
                    </div>
                ) : actions.map((action) => (
                    <Link
                        key={action.id}
                        to={action.href}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">{action.title}</p>
                                <p className="mt-1 text-xs font-medium text-gray-600">{action.description}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${
                                action.severity === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : action.severity === 'medium'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-200 text-gray-600'
                            }`}>
                                {action.severity}
                            </span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-primary-700">
                            {action.workflowRef} - {action.clientName} - {action.owner}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    )
}

function InventoryWorkflowPulse({
    products,
    stockItems,
    lowStock,
    purchases,
    movements
}: {
    products: number
    stockItems: number
    lowStock: number
    purchases: number
    movements: number
}) {
    return (
        <section className="rounded-lg border border-primary-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-primary-600">Inventory Operational Flow</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Live stock movement reflection</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Product creation, stock update, low-stock alert, purchase, and movement audit in one view.
                    </p>
                </div>
                <Link
                    to="/inventory/stock-movements"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary-600 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-primary-700"
                >
                    Open Movements
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-gray-950">{products}</p>
                    <p className="text-xs font-bold text-gray-500">Products</p>
                </div>
                <div className="rounded-lg bg-primary-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-primary-800">{stockItems}</p>
                    <p className="text-xs font-bold text-primary-700">Stock Records</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-amber-800">{lowStock}</p>
                    <p className="text-xs font-bold text-amber-700">Low Stock</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-emerald-800">{purchases}</p>
                    <p className="text-xs font-bold text-emerald-700">Purchases</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-3">
                    <p className="text-xl font-extrabold text-slate-800">{movements}</p>
                    <p className="text-xs font-bold text-slate-600">Audit Logs</p>
                </div>
            </div>
        </section>
    )
}

function InventoryActionQueue({ lowStockRows, purchaseRows }: { lowStockRows: WorkItem[]; purchaseRows: WorkItem[] }) {
    const hasActions = lowStockRows.length > 0 || purchaseRows.length > 0

    return (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-primary-600">Inventory Action Queue</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Stock actions needing attention</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Low-stock items and recent purchases from live inventory records are shown here.
                    </p>
                </div>
                <Link
                    to="/inventory/low-stock-alerts"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-black dark:text-gray-100"
                >
                    Review Stock
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {!hasActions ? (
                    <div className="rounded-xl bg-emerald-50 px-4 py-5 text-sm font-bold text-emerald-700">
                        No low-stock or purchase action pending for this inventory scope.
                    </div>
                ) : [...lowStockRows, ...purchaseRows].slice(0, 6).map((action) => (
                    <Link
                        key={`${action.status}-${action.id}`}
                        to={action.status === 'PURCHASED' ? '/inventory/purchase-orders' : '/inventory/low-stock-alerts'}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">{action.name}</p>
                                <p className="mt-1 text-xs font-medium text-gray-600">{action.detail}</p>
                            </div>
                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-extrabold uppercase text-primary-700">
                                {action.status}
                            </span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-primary-700">
                            {action.owner} - {action.due}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    )
}

function DashboardFrame({
    title,
    subtitle,
    breadcrumbs,
    links,
    metrics,
    trend,
    trendKeys,
    split,
    splitTitle,
    splitSubtitle,
    table,
    workflowSection,
    actionSection
}: {
    title: string
    subtitle: string
    breadcrumbs: Array<{ label: string }>
    links: Array<{ label: string; href: string }>
    metrics: Metric[]
    trend: { title: string; subtitle: string; data: Array<Record<string, string | number>> }
    trendKeys: string[]
    split: Array<{ name: string; value: number }>
    splitTitle: string
    splitSubtitle: string
    table: { title: string; subtitle: string; rows: WorkItem[] }
    workflowSection?: ReactNode
    actionSection?: ReactNode
}) {
    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
                <QuickLinks links={links} />
            </div>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
            </section>

            {workflowSection || <WorkflowPulse />}

            {actionSection || <RoleActionQueue />}

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <TrendChart title={trend.title} subtitle={trend.subtitle} data={trend.data} keys={trendKeys} />
                <SplitChart title={splitTitle} subtitle={splitSubtitle} data={split} />
            </section>

            <WorkTable title={table.title} subtitle={table.subtitle} rows={table.rows} />
        </div>
    )
}

export function FinanceManagerDashboard() {
    const { data: accountInvoices = [], isLoading: isInvoicesLoading } = useInvoices()
    const { data: cashbox = [], isLoading: isCashboxLoading } = useCashbox()

    const financeMetrics = useMemo(() => {
        const liveInvoices = accountInvoices
            .filter((transaction: any) => transaction.type === 'INVOICE')
            .map((transaction: any) => {
                const amount = Number(transaction.amount || 0)
                const paidAmount = Number(transaction.metadata?.paidAmount || 0)
                const balanceAmount = Number(
                    transaction.metadata?.balanceAmount
                    ?? Math.max(0, amount - paidAmount)
                )
                const paymentStatus = String(transaction.metadata?.paymentStatus || '').toUpperCase()
                const status = String(transaction.status || transaction.currentStatus || '').toUpperCase()

                return {
                    ...transaction,
                    amount,
                    paidAmount,
                    balanceAmount,
                    paymentStatus,
                    status
                }
            })

        const receiptTransactions = cashbox.filter((transaction: any) => String(transaction.type).toUpperCase() === 'RECEIPT')
        const collectedAmount = receiptTransactions.reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0)
        const pendingInvoices = liveInvoices.filter((invoice: any) => invoice.status !== 'REJECTED' && invoice.balanceAmount > 0)
        const pendingTotal = pendingInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.balanceAmount || 0), 0)
        const postedInvoices = liveInvoices.filter((invoice: any) => ['POSTED', 'APPROVED'].includes(invoice.status)).length
        const paidInvoices = liveInvoices.filter((invoice: any) => invoice.paymentStatus === 'PAID' || (invoice.amount > 0 && invoice.balanceAmount <= 0)).length
        const draftInvoices = liveInvoices.filter((invoice: any) => invoice.status === 'CREATED').length

        return {
            hasLiveInvoices: liveInvoices.length > 0,
            collectedAmount,
            pendingTotal,
            pendingInvoices,
            postedInvoices,
            paidInvoices,
            draftInvoices,
            invoiceCount: liveInvoices.length,
            receiptCount: receiptTransactions.length
        }
    }, [accountInvoices, cashbox])

    const isFinanceLoading = isInvoicesLoading || isCashboxLoading
    const pendingTotal = financeMetrics.pendingTotal
    const paidInvoices = financeMetrics.paidInvoices
    const invoiceCount = financeMetrics.invoiceCount
    const financeTrendData = useMemo(() => {
        const buckets = buildEmptyMonthlyTrend(['income', 'expense', 'pending'])
        const bucketMap = new Map(buckets.map((bucket) => [String(bucket.month), bucket]))

        cashbox.forEach((transaction: any) => {
            const date = new Date(transaction.createdAt || transaction.date || transaction.transactionDate || '')
            if (Number.isNaN(date.getTime())) return
            const bucket = bucketMap.get(date.toLocaleDateString('en-IN', { month: 'short' }))
            if (!bucket) return

            const type = String(transaction.type || '').toUpperCase()
            const amount = Number(transaction.amount || 0)
            if (type === 'RECEIPT') bucket.income = Number(bucket.income || 0) + amount
            if (type === 'EXPENSE' || type === 'PAYMENT') bucket.expense = Number(bucket.expense || 0) + amount
        })

        financeMetrics.pendingInvoices.forEach((invoice: any) => {
            const date = new Date(invoice.createdAt || invoice.date || invoice.invoiceDate || '')
            if (Number.isNaN(date.getTime())) return
            const bucket = bucketMap.get(date.toLocaleDateString('en-IN', { month: 'short' }))
            if (!bucket) return
            bucket.pending = Number(bucket.pending || 0) + Number(invoice.balanceAmount || 0)
        })

        return buckets
    }, [cashbox, financeMetrics.pendingInvoices])
    const financeSplit = [
        { name: 'Collected', value: financeMetrics.collectedAmount },
        { name: 'Pending', value: financeMetrics.pendingTotal },
        { name: 'Paid Invoices', value: financeMetrics.paidInvoices },
        { name: 'Draft Invoices', value: financeMetrics.draftInvoices }
    ]
    const collectionRows = financeMetrics.hasLiveInvoices
        ? financeMetrics.pendingInvoices.slice(0, 5).map((row: any) => ({
            id: String(row.id),
            name: String(row.clientName || 'Unknown client'),
            detail: `${row.receiptNo || row.refNo || 'Invoice'} - ${formatShortMoney(Number(row.balanceAmount || 0))} due`,
            status: String(row.paymentStatus || row.status || 'Pending'),
            owner: 'Finance Desk',
            due: 'Collect payment'
        }))
        : []

    return (
        <DashboardFrame
            title="Finance Manager Dashboard"
            subtitle="Cash flow, collections, pending payments, invoices, renewals, and finance workload."
            breadcrumbs={[{ label: 'UNCF' }, { label: 'Finance' }, { label: 'Dashboard' }]}
            links={[
                { label: 'Cashbox', href: '/finance/cashbox' },
                { label: 'Pending Payments', href: '/finance/pending-payments' },
                { label: 'Invoice', href: '/finance/invoice' },
                { label: 'Renewals', href: '/finance/renewals' }
            ]}
            metrics={[
                {
                    label: 'Collected Income',
                    value: isFinanceLoading ? '-' : formatShortMoney(financeMetrics.collectedAmount),
                    helper: `${financeMetrics.receiptCount} receipts reflected in cashbox`,
                    icon: IndianRupee
                },
                {
                    label: 'Pending Payments',
                    value: isFinanceLoading ? '-' : formatShortMoney(pendingTotal),
                    helper: `${financeMetrics.pendingInvoices.length} invoice payments need action`,
                    icon: CalendarClock
                },
                {
                    label: 'Paid Invoices',
                    value: isFinanceLoading ? '-' : paidInvoices,
                    helper: `${invoiceCount} invoices tracked this cycle`,
                    icon: ShieldCheck
                },
                {
                    label: 'Draft Invoices',
                    value: isFinanceLoading ? '-' : financeMetrics.draftInvoices,
                    helper: `${invoiceCount} live invoices visible in finance`,
                    icon: ClipboardList
                }
            ]}
            trend={{ title: 'Finance Movement', subtitle: 'Income, expense, and pending collection trend', data: financeTrendData }}
            trendKeys={['income', 'expense', 'pending']}
            split={financeSplit}
            splitTitle="Finance Split"
            splitSubtitle="Current period finance distribution"
            table={{
                title: 'Collection Watchlist',
                subtitle: 'Payments and invoices that need finance follow-up',
                rows: collectionRows
            }}
        />
    )
}

export function ElderCareAdminDashboard() {
    const { isLoading: isInHouseLoading } = useInHouseAllocations()
    const { data: stock = [], isLoading: isStockLoading } = useInventoryStock()
    const { data: approvalTasks = [], isLoading: isTaskLoading } = useApprovalTasks()
    const { data: uecAdminData, isLoading: isUecAdminLoading } = useUecAdminDashboard()
    
    const lowStockRows = stock.filter((item: any) => Number(item.quantity || 0) <= inventoryLowStockThreshold)
    const pendingTasks = approvalTasks.filter((task: any) => ['PENDING', 'COMPLETED', 'ASSIGNED'].includes(String(task.status || '').toUpperCase()))
    const isLoading = isInHouseLoading || isStockLoading || isTaskLoading || isUecAdminLoading
    
    const summary = uecAdminData?.summary || { totalResidents: 0, pendingTasks: 0, vitalsToday: 0 }
    const trendData = uecAdminData?.trend?.datasets || []
    
    const activeTrend = trendData.length > 0 ? buildEmptyMonthlyTrend(['residents', 'tasks', 'vitals']).map((bucket, index) => {
        bucket.residents = trendData[0]?.data?.[index] || 0;
        bucket.tasks = trendData[1]?.data?.[index] || 0;
        bucket.vitals = trendData[2]?.data?.[index] || 0;
        return bucket;
    }) : buildEmptyMonthlyTrend(['residents', 'tasks', 'vitals'])

    const rows: WorkItem[] = [
        ...pendingTasks.slice(0, 3).map((task: any) => ({
            id: String(task.refNo || task.id),
            name: String(task.title || task.name || 'Scheduled task'),
            detail: String(task.description || task.notes || 'Task waiting review'),
            status: String(task.status || 'PENDING'),
            owner: String(task.staffName || task.assignedTo || 'Task Log'),
            due: String(task.dueDate || task.scheduledAt || 'Review')
        })),
        ...lowStockRows.slice(0, 3).map((item: any) => ({
            id: String(item.product?.sku || item.productId || item.id),
            name: String(item.product?.name || item.name || 'Stock item'),
            detail: `${getInventoryCategoryLabel(item.product?.category)} stock is ${Number(item.quantity || 0)}`,
            status: Number(item.quantity || 0) <= 0 ? 'REORDER' : 'LOW_STOCK',
            owner: 'Inventory',
            due: 'Review stock'
        }))
    ]

    return (
        <DashboardFrame
            title="Elder Care Admin Dashboard"
            subtitle="Resident care, in-house vitals, elder operations, inventory, task approvals, and expenses."
            breadcrumbs={[{ label: 'UEC' }, { label: 'Elder Care Admin' }, { label: 'Dashboard' }]}
            links={[
                { label: 'In-House Care', href: '/inhouse-care/revenue' },
                { label: 'Vitals', href: '/inhouse-care/vitals' },
                { label: 'Task Approval', href: '/task-log/daily-approval' },
                { label: 'Low Stock', href: '/inventory/low-stock-alerts' }
            ]}
            metrics={[
                { label: 'Active Residents', value: isLoading ? '-' : summary.totalResidents, helper: 'Live in-house allocations under monitoring', icon: Users },
                { label: 'Vitals Logged', value: isLoading ? '-' : summary.vitalsToday, helper: 'Live vitals recorded across residents', icon: HeartPulse },
                { label: 'Pending Tasks', value: isLoading ? '-' : summary.pendingTasks, helper: 'Daily and scheduled approvals waiting', icon: ClipboardList },
                { label: 'Low Stock Alerts', value: isLoading ? '-' : lowStockRows.length, helper: 'Inventory items need review', icon: AlertTriangle }
            ]}
            trend={{ title: 'Elder Care Movement', subtitle: 'Residents, tasks, and vitals across the last six months', data: activeTrend }}
            trendKeys={['residents', 'tasks', 'vitals']}
            split={[
                { name: 'Residents', value: summary.totalResidents },
                { name: 'Inventory', value: lowStockRows.length },
                { name: 'Task Log', value: summary.pendingTasks },
                { name: 'Vitals', value: summary.vitalsToday }
            ]}
            splitTitle="Admin Workload"
            splitSubtitle="UEC work areas currently under monitoring"
            table={{
                title: 'Care Administration Watchlist',
                subtitle: 'Resident care and operations items that need admin attention',
                rows
            }}
        />
    )
}

export function MedicalMonitorDashboard() {
    const { data: dashboard, isLoading } = useMedicalDashboard()

    const metrics = useMemo(() => {
        return {
            patientsMonitored: dashboard?.activeCount || 0,
            rounds: dashboard?.staffSummary?.busy || 0,
            assignments: dashboard?.activeCount || 0,
            duty: dashboard?.staffSummary?.total || 0,
            split: {
                critical: dashboard?.statusCounts?.['CRITICAL'] || 0,
                watch: dashboard?.statusCounts?.['WATCH'] || 0,
                stable: dashboard?.statusCounts?.['STABLE'] || 0,
                rounds: dashboard?.statusCounts?.['IN_PROGRESS'] || 0
            }
        }
    }, [dashboard])

    const rows = useMemo<WorkItem[]>(() => {
        if (!dashboard?.activeAssignments) return []
        return dashboard.activeAssignments.map((assignment: any) => ({
            id: String(assignment.id || '').slice(0, 8),
            name: assignment.patient?.firstName 
                ? `${assignment.patient.firstName} ${assignment.patient.lastName || ''}`.trim()
                : 'General Patient',
            detail: assignment.dutyType || 'Medical Duty',
            owner: assignment.staff?.firstName 
                ? `${assignment.staff.firstName} ${assignment.staff.lastName || ''}`.trim() 
                : 'Unassigned',
            status: assignment.status || 'PENDING',
            due: assignment.endAt ? new Date(assignment.endAt).toLocaleDateString() : 'N/A'
        }))
    }, [dashboard])

    return (
        <DashboardFrame
            title="Medical Monitor Dashboard"
            subtitle="Patient vitals, critical alerts, medical rounds, duty assignments, and monitoring workload."
            breadcrumbs={[{ label: 'UHC' }, { label: 'Medical Monitor' }, { label: 'Dashboard' }]}
            links={[
                { label: 'Medical Monitor', href: '/healthcare/medical-monitor' },
                { label: 'Medical Dashboard', href: '/medical/dashboard' },
                { label: 'Clinical View', href: '/medical/clinical-view' },
                { label: 'Doctor Duty', href: '/medical/doctor-duty' },
                { label: 'Doctor Visits', href: '/medical/doctor-visits' },
                { label: 'Critical Patients', href: '/healthcare/critical-patients' },
                { label: 'Vital Form', href: '/healthcare/vitals' },
                { label: 'Patient Dashboard', href: '/healthcare/patient-dashboard' }
            ]}
            metrics={[
                { label: 'Critical Alerts', value: isLoading ? '-' : metrics.split.critical, helper: 'Live critical patient integration', icon: AlertTriangle },
                { label: 'Patients Monitored', value: isLoading ? '-' : metrics.patientsMonitored, helper: 'Live patient dashboard integration', icon: HeartPulse },
                { label: 'Medical Rounds', value: isLoading ? '-' : metrics.rounds, helper: 'Live rounds integration', icon: Activity },
                { label: 'Duty Assignments', value: isLoading ? '-' : metrics.duty, helper: 'Live duty integration', icon: ClipboardList }
            ]}
            trend={{ title: 'Monitoring Movement', subtitle: 'Rounds, alerts, and assignments by month', data: buildEmptyMonthlyTrend(['rounds', 'alerts', 'assignments']) }}
            trendKeys={['rounds', 'alerts', 'assignments']}
            split={[
                { name: 'Critical', value: metrics.split.critical },
                { name: 'Watch', value: metrics.split.watch },
                { name: 'Stable', value: metrics.split.stable },
                { name: 'Rounds', value: metrics.split.rounds }
            ]}
            splitTitle="Patient Risk Split"
            splitSubtitle="Current monitoring priority across patients"
            table={{
                title: 'Critical Monitoring Queue',
                subtitle: 'Patient vitals and medical reviews that need immediate attention',
                rows
            }}
        />
    )
}

export function EmergencyCallDashboard() {
    const { data: trips = [], isLoading } = useTrips()

    const metrics = useMemo(() => {
        const dispatched = trips.filter((t: any) => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(String(t.status).toUpperCase())).length
        const escalations = trips.filter((t: any) => ['HIGH', 'EMERGENCY'].includes(String(t.priority).toUpperCase())).length
        const standby = trips.filter((t: any) => String(t.status).toUpperCase() === 'REQUESTED').length
        return {
            total: trips.length,
            dispatched,
            escalations,
            standby,
            booked: trips.filter((t: any) => String(t.status).toUpperCase() === 'DISPATCH_READY').length
        }
    }, [trips])

    const rows = useMemo<WorkItem[]>(() => {
        return trips.map((trip: any) => ({
            id: String(trip.refNo || trip.id || '').slice(0, 8),
            name: trip.clientName || trip.patient?.firstName || 'Unknown',
            detail: `${trip.pickupLocation || 'Unknown'} → ${trip.destination || 'Unknown'}`,
            owner: trip.driver?.firstName || 'Unassigned',
            status: trip.status || 'REQUESTED',
            due: trip.dispatchTime 
                ? new Date(trip.dispatchTime).toLocaleDateString() 
                : (trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'N/A')
        }))
    }, [trips])

    return (
        <DashboardFrame
            title="Emergency Call Dashboard"
            subtitle="Emergency call intake, dispatch movement, escalation tracking, and ambulance response status."
            breadcrumbs={[{ label: 'UA' }, { label: 'Emergency Calls' }, { label: 'Dashboard' }]}
            links={[
                { label: 'Call Logs', href: '/ambulance/call-logs' },
                { label: 'Dispatch', href: '/ambulance/dispatch' },
                { label: 'Bookings', href: '/ambulance/bookings' },
                { label: 'Field Duty', href: '/hr/field-duty' }
            ]}
            metrics={[
                { label: 'Emergency Calls', value: isLoading ? '-' : metrics.total, helper: 'Live call log intake', icon: PhoneCall },
                { label: 'Dispatched Cases', value: isLoading ? '-' : metrics.dispatched, helper: 'Ambulance response in movement', icon: Ambulance },
                { label: 'Escalations', value: isLoading ? '-' : metrics.escalations, helper: 'Needs coordinator attention', icon: AlertTriangle },
                { label: 'Avg Response', value: '-', helper: 'Live response tracking pending', icon: Activity }
            ]}
            trend={{ title: 'Emergency Response Trend', subtitle: 'Calls, dispatches, and escalations by month', data: buildEmptyMonthlyTrend(['calls', 'dispatches', 'escalations']) }}
            trendKeys={['calls', 'dispatches', 'escalations']}
            split={[
                { name: 'Dispatched', value: metrics.dispatched },
                { name: 'Booked', value: metrics.booked },
                { name: 'Escalated', value: metrics.escalations },
                { name: 'Standby', value: metrics.standby }
            ]}
            splitTitle="Call Status Split"
            splitSubtitle="Current emergency desk call outcomes"
            table={{
                title: 'Emergency Call Watchlist',
                subtitle: 'Calls and dispatches requiring coordinator visibility',
                rows
            }}
        />
    )
}

type RoleDashboardConfig = {
    title: string
    subtitle: string
    breadcrumbs: Array<{ label: string }>
    links: Array<{ label: string; href: string }>
    metrics: Metric[]
    trendTitle: string
    trendSubtitle: string
    trendKeys: string[]
    splitTitle: string
    splitSubtitle: string
    split: Array<{ name: string; value: number }>
    tableTitle: string
    tableSubtitle: string
    rows: WorkItem[]
}

const standardTrend = buildEmptyMonthlyTrend(['volume', 'pending', 'completed'])

const inventoryLowStockThreshold = 10
const elderInventoryCategories = ['ration', 'stationary', 'electrical-plumbing']
const medicalInventoryCategories = ['medical']

const normalizeInventoryCategory = (category?: string) => String(category || '').toLowerCase()

const getInventoryCategoryLabel = (category?: string) => {
    const normalized = normalizeInventoryCategory(category)
    if (normalized === 'electrical-plumbing') return 'Electrical & Plumbing'
    if (normalized === 'stationary') return 'Stationary'
    if (normalized === 'ration') return 'Ration'
    if (normalized === 'medical') return 'Medical'
    return category || 'Inventory'
}

const formatInventoryDate = (date?: string) => {
    if (!date) return '-'
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime())
        ? '-'
        : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const buildInventoryMonthlyTrend = (
    movements: Array<{ createdAt: string; quantity?: number; signedQuantity?: number }>,
    lowStockCount: number
) => {
    const today = new Date()
    const buckets = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        return {
            key,
            month: date.toLocaleDateString('en-IN', { month: 'short' }),
            volume: 0,
            pending: 0,
            completed: 0
        }
    })
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

    movements.forEach((movement) => {
        const date = new Date(movement.createdAt)
        if (Number.isNaN(date.getTime())) return

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const bucket = bucketMap.get(key)
        if (!bucket) return

        bucket.volume += Math.abs(Number(movement.signedQuantity ?? movement.quantity ?? 0))
        bucket.completed += 1
    })

    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentBucket = bucketMap.get(currentMonthKey)
    if (currentBucket) currentBucket.pending = lowStockCount

    return buckets.map(({ key, ...bucket }) => bucket)
}

function RoleDashboard({ config }: { config: RoleDashboardConfig }) {
    const liveReadyMetrics = config.metrics.map((metric) => ({
        ...metric,
        value: 0,
        helper: 'Live dashboard data not connected yet'
    }))

    return (
        <DashboardFrame
            title={config.title}
            subtitle={config.subtitle}
            breadcrumbs={config.breadcrumbs}
            links={config.links}
            metrics={liveReadyMetrics}
            trend={{ title: config.trendTitle, subtitle: config.trendSubtitle, data: standardTrend }}
            trendKeys={config.trendKeys}
            split={[]}
            splitTitle={config.splitTitle}
            splitSubtitle={config.splitSubtitle}
            table={{
                title: config.tableTitle,
                subtitle: config.tableSubtitle,
                rows: []
            }}
        />
    )
}

const adminRows: WorkItem[] = [
    { id: 'MST-101', name: 'Unit Master', detail: '3 master records pending review', status: 'REVIEW', owner: 'Master Desk', due: 'Today' },
    { id: 'MST-118', name: 'Vendor Master', detail: 'Vendor profile update request', status: 'OPEN', owner: 'Master Desk', due: 'Tomorrow' },
    { id: 'MST-126', name: 'Room Management', detail: 'Room mapping and service check', status: 'PENDING', owner: 'Admin Desk', due: 'Friday' }
]

const roleDashboards: Record<string, RoleDashboardConfig> = {
    masterData: {
        title: 'Master Data Manager Dashboard',
        subtitle: 'City, unit, department, designation, service, vendor, payment, and room master monitoring.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'Master' }, { label: 'Dashboard' }],
        links: [
            { label: 'City Master', href: '/master/city' },
            { label: 'Unit Master', href: '/master/unit' },
            { label: 'Vendor Master', href: '/master/vendor' },
            { label: 'Room Management', href: '/master/room' }
        ],
        metrics: [
            { label: 'Master Records', value: 128, helper: 'Core configuration records', icon: ClipboardList },
            { label: 'Pending Reviews', value: 9, helper: 'Records requiring validation', icon: AlertTriangle },
            { label: 'Active Vendors', value: 36, helper: 'Vendor profiles in use', icon: Users },
            { label: 'Service Masters', value: 18, helper: 'Client and labour services', icon: Activity }
        ],
        trendTitle: 'Master Data Activity',
        trendSubtitle: 'Record volume, pending reviews, and completed updates',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Master Coverage',
        splitSubtitle: 'Current master data focus areas',
        split: [{ name: 'Units', value: 24 }, { name: 'Vendors', value: 30 }, { name: 'Services', value: 28 }, { name: 'Rooms', value: 18 }],
        tableTitle: 'Master Data Watchlist',
        tableSubtitle: 'Records and master modules needing manager attention',
        rows: adminRows
    },
    hrManager: {
        title: 'HR Manager Dashboard',
        subtitle: 'Staff, attendance, leave, roster, payroll, training, recruitment, and HR compliance monitoring.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'Human Resource' }, { label: 'Dashboard' }],
        links: [
            { label: 'Staff', href: '/hr/staff' },
            { label: 'Attendance', href: '/hr/attendance' },
            { label: 'Leave', href: '/hr/leave' },
            { label: 'Payroll', href: '/hr/payroll' }
        ],
        metrics: [
            { label: 'Active Staff', value: 84, helper: 'Employees across active units', icon: Users },
            { label: 'Leave Requests', value: 7, helper: 'Pending HR action', icon: CalendarClock },
            { label: 'Roster Gaps', value: 4, helper: 'Open shift coverage items', icon: ClipboardList },
            { label: 'Payroll Queue', value: 12, helper: 'Payroll items under review', icon: IndianRupee }
        ],
        trendTitle: 'HR Movement',
        trendSubtitle: 'Staff workload, pending items, and completed HR actions',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'HR Workload',
        splitSubtitle: 'Current HR operational distribution',
        split: [{ name: 'Staff', value: 34 }, { name: 'Attendance', value: 22 }, { name: 'Leave', value: 18 }, { name: 'Payroll', value: 26 }],
        tableTitle: 'HR Action Queue',
        tableSubtitle: 'Staff and compliance actions needing HR review',
        rows: [
            { id: 'HR-221', name: 'Roster Gap', detail: 'Night shift coverage needed', status: 'OPEN', owner: 'HR Desk', due: 'Today' },
            { id: 'HR-238', name: 'Leave Approval', detail: '3 leave requests pending', status: 'PENDING', owner: 'HR Manager', due: 'Today' },
            { id: 'HR-244', name: 'Payroll Check', detail: 'Allowance entries awaiting confirmation', status: 'REVIEW', owner: 'Payroll', due: 'Tomorrow' }
        ]
    },
    security: {
        title: 'Security Dashboard',
        subtitle: 'Gate, visitor, entry log, OTP, and security exception monitoring.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'Security' }, { label: 'Dashboard' }],
        links: [
            { label: 'Gate', href: '/security/gate-management' },
            { label: 'Staff', href: '/security/staff-register' },
            { label: 'Vehicles', href: '/security/vehicle-register' },
            { label: 'Entry Logs', href: '/security/entry-logs' }
        ],
        metrics: [
            { label: 'Gate Entries', value: 46, helper: 'Entries logged today', icon: ShieldCheck },
            { label: 'Visitors', value: 18, helper: 'Visitor movements tracked', icon: Users },
            { label: 'OTP Checks', value: 27, helper: 'OTP verifications completed', icon: ClipboardList },
            { label: 'Exceptions', value: 3, helper: 'Security reviews pending', icon: AlertTriangle }
        ],
        trendTitle: 'Security Movement',
        trendSubtitle: 'Entries, pending reviews, and completed checks',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Security Coverage',
        splitSubtitle: 'Gate and visitor workload split',
        split: [{ name: 'Gate', value: 42 }, { name: 'Visitors', value: 24 }, { name: 'OTP', value: 20 }, { name: 'Exceptions', value: 8 }],
        tableTitle: 'Security Watchlist',
        tableSubtitle: 'Gate and visitor records requiring supervisor attention',
        rows: [
            { id: 'SEC-410', name: 'Visitor Approval', detail: 'Late visitor checkout', status: 'REVIEW', owner: 'Security Desk', due: 'Now' },
            { id: 'SEC-419', name: 'OTP Mismatch', detail: 'Verification retry exceeded', status: 'FLAGGED', owner: 'Gate Team', due: 'Today' },
            { id: 'SEC-426', name: 'Entry Log', detail: 'Vehicle entry clarification', status: 'OPEN', owner: 'Supervisor', due: 'Today' }
        ]
    },
    cms: {
        title: 'CMS Manager Dashboard',
        subtitle: 'Blogs, FAQ, events, publishing queue, and content update monitoring.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'CMS' }, { label: 'Dashboard' }],
        links: [
            { label: 'Blogs', href: '/cms/blogs' },
            { label: 'FAQ', href: '/cms/faq' },
            { label: 'Events', href: '/cms/events' }
        ],
        metrics: [
            { label: 'Published Items', value: 42, helper: 'Live CMS content', icon: ClipboardList },
            { label: 'Drafts', value: 8, helper: 'Content waiting for completion', icon: Activity },
            { label: 'Events', value: 5, helper: 'Upcoming event records', icon: CalendarClock },
            { label: 'FAQ Updates', value: 11, helper: 'Help content revisions', icon: ShieldCheck }
        ],
        trendTitle: 'CMS Publishing',
        trendSubtitle: 'Content volume, pending drafts, and published updates',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Content Split',
        splitSubtitle: 'CMS work by content type',
        split: [{ name: 'Blogs', value: 36 }, { name: 'FAQ', value: 28 }, { name: 'Events', value: 18 }, { name: 'Drafts', value: 12 }],
        tableTitle: 'CMS Publishing Queue',
        tableSubtitle: 'Content records needing CMS manager review',
        rows: [
            { id: 'CMS-071', name: 'Blog Draft', detail: 'Care service article', status: 'DRAFT', owner: 'CMS Desk', due: 'Today' },
            { id: 'CMS-084', name: 'FAQ Update', detail: 'Admission process revision', status: 'REVIEW', owner: 'CMS Manager', due: 'Tomorrow' },
            { id: 'CMS-090', name: 'Event Page', detail: 'Health awareness camp', status: 'SCHEDULED', owner: 'Events', due: 'Friday' }
        ]
    },
    adminFiles: {
        title: 'Admin Files Manager Dashboard',
        subtitle: 'Document tracker, unit files, licence files, record books, and staff file register monitoring.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'Admin Files' }, { label: 'Dashboard' }],
        links: [
            { label: 'Admin Files', href: '/admin-files' },
            { label: 'UNCF Documents', href: '/admin-files/uncf-documents' },
            { label: 'Record Books', href: '/admin-files/record-books' },
            { label: 'Nursing Files', href: '/admin-files/nursing-files' }
        ],
        metrics: [
            { label: 'Tracked Files', value: 96, helper: 'Documents under register', icon: ClipboardList },
            { label: 'Expiring Soon', value: 6, helper: 'Licence and document renewals', icon: AlertTriangle },
            { label: 'Pending Uploads', value: 12, helper: 'Files waiting for update', icon: CalendarClock },
            { label: 'Verified Files', value: 78, helper: 'Checked document records', icon: ShieldCheck }
        ],
        trendTitle: 'Document Movement',
        trendSubtitle: 'File volume, pending uploads, and completed verifications',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'File Register Split',
        splitSubtitle: 'Admin file workload by category',
        split: [{ name: 'Documents', value: 40 }, { name: 'Licences', value: 20 }, { name: 'Records', value: 24 }, { name: 'Staff Files', value: 16 }],
        tableTitle: 'Document Watchlist',
        tableSubtitle: 'Admin file records needing manager action',
        rows: [
            { id: 'FILE-301', name: 'Licence File', detail: 'UEC licence renewal document', status: 'EXPIRING', owner: 'Admin Files', due: '7 days' },
            { id: 'FILE-318', name: 'Record Book', detail: 'Monthly record reconciliation', status: 'PENDING', owner: 'Records', due: 'Today' },
            { id: 'FILE-332', name: 'Staff File', detail: 'Nursing certificate update', status: 'UPLOAD', owner: 'HR Docs', due: 'Tomorrow' }
        ]
    },
    profileTask: {
        title: 'Profile Task Dashboard',
        subtitle: 'Assigned daily tasks, schedule tasks, approvals, notifications, and profile workload.',
        breadcrumbs: [{ label: 'UNCF' }, { label: 'Profile' }, { label: 'Task Dashboard' }],
        links: [
            { label: 'My Profile', href: '/profile/me' },
            { label: 'Daily Task', href: '/profile/tasks' },
            { label: 'Notifications', href: '/profile/notifications' },
            { label: 'Assign Daily', href: '/task-log/assign-daily' }
        ],
        metrics: [
            { label: 'Assigned Tasks', value: 14, helper: 'Tasks visible to this user', icon: ClipboardList },
            { label: 'Due Today', value: 5, helper: 'Daily items needing action', icon: CalendarClock },
            { label: 'Approvals', value: 3, helper: 'Task approvals waiting', icon: ShieldCheck },
            { label: 'Notifications', value: 9, helper: 'Unread task updates', icon: AlertTriangle }
        ],
        trendTitle: 'Task Movement',
        trendSubtitle: 'Assigned, pending, and completed task volume',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Task Split',
        splitSubtitle: 'Current profile task workload',
        split: [{ name: 'Daily', value: 36 }, { name: 'Schedule', value: 28 }, { name: 'Approval', value: 18 }, { name: 'Notifications', value: 12 }],
        tableTitle: 'Task Watchlist',
        tableSubtitle: 'Profile and task items needing user action',
        rows: [
            { id: 'TASK-501', name: 'Daily Review', detail: 'Resident checklist follow-up', status: 'DUE', owner: 'Task User', due: 'Today' },
            { id: 'TASK-518', name: 'Schedule Task', detail: 'Weekly maintenance check', status: 'OPEN', owner: 'Task User', due: 'Tomorrow' },
            { id: 'TASK-526', name: 'Approval', detail: 'Daily task completion review', status: 'PENDING', owner: 'Approver', due: 'Today' }
        ]
    },
    inHouseCare: {
        title: 'In-House Care Manager Dashboard',
        subtitle: 'In-house care revenue, resident vitals, ADL tracking, and care workload monitoring.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'In-House Care' }, { label: 'Dashboard' }],
        links: [
            { label: 'Revenue', href: '/inhouse-care/revenue' },
            { label: 'Vitals', href: '/inhouse-care/vitals' },
            { label: 'ADL', href: '/healthcare/adl' }
        ],
        metrics: [
            { label: 'Residents', value: 32, helper: 'In-house care residents', icon: Users },
            { label: 'Vitals Logged', value: 116, helper: 'Care vitals this month', icon: HeartPulse },
            { label: 'ADL Reviews', value: 28, helper: 'Daily living assessments', icon: ClipboardList },
            { label: 'Revenue Forms', value: 18, helper: 'Care revenue entries', icon: IndianRupee }
        ],
        trendTitle: 'In-House Care Movement',
        trendSubtitle: 'Care volume, pending items, and completed reviews',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Care Split',
        splitSubtitle: 'In-house care workload distribution',
        split: [{ name: 'Revenue', value: 24 }, { name: 'Vitals', value: 34 }, { name: 'ADL', value: 28 }, { name: 'Reviews', value: 14 }],
        tableTitle: 'In-House Care Watchlist',
        tableSubtitle: 'Resident care records needing manager attention',
        rows: [
            { id: 'IHC-101', name: 'Vitals Review', detail: '6 vitals pending confirmation', status: 'PENDING', owner: 'Care Team', due: 'Today' },
            { id: 'IHC-118', name: 'ADL Check', detail: 'Morning living assessment', status: 'OPEN', owner: 'Care Manager', due: 'Today' },
            { id: 'IHC-124', name: 'Revenue Form', detail: 'Monthly care billing entry', status: 'REVIEW', owner: 'Finance', due: 'Tomorrow' }
        ]
    },
    elderOperations: {
        title: 'Elder Operations Dashboard',
        subtitle: 'Food preparation, nutrition planning, laundry, maintenance, and waste management monitoring.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Elder Operations' }, { label: 'Dashboard' }],
        links: [
            { label: 'Food', href: '/operations/food-preparation' },
            { label: 'Nutrition', href: '/operations/nutrition-planning' },
            { label: 'Laundry', href: '/operations/laundry-management' },
            { label: 'Maintenance', href: '/operations/maintenance' }
        ],
        metrics: [
            { label: 'Meal Plans', value: 21, helper: 'Food and nutrition plans', icon: ClipboardList },
            { label: 'Laundry Loads', value: 18, helper: 'Laundry tasks tracked', icon: Activity },
            { label: 'Maintenance Open', value: 5, helper: 'Facility requests open', icon: AlertTriangle },
            { label: 'Waste Checks', value: 12, helper: 'Waste management rounds', icon: ShieldCheck }
        ],
        trendTitle: 'Operations Movement',
        trendSubtitle: 'Operations volume, pending work, and completed tasks',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Operations Split',
        splitSubtitle: 'Current elder operations workload',
        split: [{ name: 'Food', value: 30 }, { name: 'Nutrition', value: 24 }, { name: 'Laundry', value: 20 }, { name: 'Maintenance', value: 16 }],
        tableTitle: 'Operations Watchlist',
        tableSubtitle: 'Operational items needing manager attention',
        rows: [
            { id: 'OPS-210', name: 'Nutrition Plan', detail: 'Special diet approval pending', status: 'REVIEW', owner: 'Kitchen', due: 'Today' },
            { id: 'OPS-228', name: 'Laundry', detail: 'Wing B linen cycle pending', status: 'OPEN', owner: 'Laundry', due: 'Today' },
            { id: 'OPS-235', name: 'Maintenance', detail: 'Room A plumbing request', status: 'PENDING', owner: 'Maintenance', due: 'Tomorrow' }
        ]
    },
    elderInventory: {
        title: 'Elder Inventory Dashboard',
        subtitle: 'Ration, stationary, electrical and plumbing products, stock, and low-stock monitoring.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Elder Inventory' }, { label: 'Dashboard' }],
        links: [
            { label: 'Ration', href: '/inventory/products/ration' },
            { label: 'Stationary', href: '/inventory/products/stationary' },
            { label: 'Stock', href: '/inventory/stock' },
            { label: 'Low Stock', href: '/inventory/low-stock-alerts' }
        ],
        metrics: [
            { label: 'Stock Items', value: 142, helper: 'Inventory products tracked', icon: ClipboardList },
            { label: 'Low Stock', value: 9, helper: 'Items below threshold', icon: AlertTriangle },
            { label: 'Ration Items', value: 48, helper: 'Food stock records', icon: Activity },
            { label: 'Purchase Need', value: 6, helper: 'Items ready for reorder', icon: IndianRupee }
        ],
        trendTitle: 'Inventory Movement',
        trendSubtitle: 'Stock volume, low-stock, and completed updates',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Inventory Split',
        splitSubtitle: 'Current inventory category distribution',
        split: [{ name: 'Ration', value: 34 }, { name: 'Stationary', value: 22 }, { name: 'Electrical', value: 20 }, { name: 'Stock', value: 24 }],
        tableTitle: 'Inventory Watchlist',
        tableSubtitle: 'Stock and product records needing inventory action',
        rows: [
            { id: 'INV-UEC-11', name: 'Ration Stock', detail: 'Rice stock below threshold', status: 'LOW_STOCK', owner: 'Inventory', due: 'Today' },
            { id: 'INV-UEC-18', name: 'Stationary', detail: 'Care log register reorder', status: 'REORDER', owner: 'Store', due: 'Tomorrow' },
            { id: 'INV-UEC-25', name: 'Electrical', detail: 'Bulb and cable stock check', status: 'OPEN', owner: 'Maintenance', due: 'Friday' }
        ]
    },
    taskLog: {
        title: 'Task Log Coordinator Dashboard',
        subtitle: 'Daily tasks, scheduled tasks, approvals, and task log completion monitoring.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Task Log' }, { label: 'Dashboard' }],
        links: [
            { label: 'Assign Daily', href: '/task-log/assign-daily' },
            { label: 'Assign Schedule', href: '/task-log/assign-schedule' },
            { label: 'Daily Approval', href: '/task-log/daily-approval' },
            { label: 'Schedule Approval', href: '/task-log/schedule-approval' }
        ],
        metrics: [
            { label: 'Daily Tasks', value: 44, helper: 'Tasks assigned today', icon: ClipboardList },
            { label: 'Scheduled Tasks', value: 26, helper: 'Upcoming scheduled work', icon: CalendarClock },
            { label: 'Approvals', value: 11, helper: 'Task approvals waiting', icon: ShieldCheck },
            { label: 'Overdue', value: 4, helper: 'Tasks past due', icon: AlertTriangle }
        ],
        trendTitle: 'Task Log Movement',
        trendSubtitle: 'Task volume, pending approvals, and completed work',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Task Log Split',
        splitSubtitle: 'Daily and scheduled workload',
        split: [{ name: 'Daily', value: 42 }, { name: 'Scheduled', value: 28 }, { name: 'Approvals', value: 20 }, { name: 'Overdue', value: 6 }],
        tableTitle: 'Task Approval Queue',
        tableSubtitle: 'Task log records needing coordinator action',
        rows: [
            { id: 'TL-601', name: 'Daily Task', detail: 'Care checklist approval', status: 'PENDING', owner: 'Care Team', due: 'Today' },
            { id: 'TL-618', name: 'Schedule Task', detail: 'Laundry weekly schedule', status: 'OPEN', owner: 'Operations', due: 'Tomorrow' },
            { id: 'TL-625', name: 'Approval', detail: 'Maintenance completion review', status: 'REVIEW', owner: 'Coordinator', due: 'Today' }
        ]
    },
    elderFinance: {
        title: 'Elder Finance Dashboard',
        subtitle: 'UEC in-house expense, care spending, approvals, and elder finance monitoring.',
        breadcrumbs: [{ label: 'UEC' }, { label: 'Elder Finance' }, { label: 'Dashboard' }],
        links: [
            { label: 'In-House Expense', href: '/finance/inhouse-expense' }
        ],
        metrics: [
            { label: 'Monthly Expense', value: 'Rs 2.4L', helper: 'UEC current period spend', icon: IndianRupee },
            { label: 'Pending Bills', value: 8, helper: 'Bills waiting for review', icon: CalendarClock },
            { label: 'Approved Items', value: 31, helper: 'Expense records approved', icon: ShieldCheck },
            { label: 'Variance', value: '6%', helper: 'Expense variance from plan', icon: TrendingUp }
        ],
        trendTitle: 'Elder Finance Movement',
        trendSubtitle: 'Expense volume, pending records, and approved transactions',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Expense Split',
        splitSubtitle: 'UEC expense category spread',
        split: [{ name: 'Care', value: 34 }, { name: 'Operations', value: 28 }, { name: 'Inventory', value: 24 }, { name: 'Maintenance', value: 14 }],
        tableTitle: 'Expense Watchlist',
        tableSubtitle: 'UEC expense items needing finance action',
        rows: [
            { id: 'UEF-301', name: 'Kitchen Expense', detail: 'Ration purchase bill', status: 'PENDING', owner: 'Kitchen', due: 'Today' },
            { id: 'UEF-318', name: 'Maintenance Bill', detail: 'Plumbing repair invoice', status: 'REVIEW', owner: 'Maintenance', due: 'Tomorrow' },
            { id: 'UEF-325', name: 'Care Supplies', detail: 'Resident care consumables', status: 'APPROVAL', owner: 'Care Team', due: 'Friday' }
        ]
    },
    patientCare: {
        title: 'Patient Care Manager Dashboard',
        subtitle: 'Critical patients, patient dashboard, vitals, medication, nutrition, and care review monitoring.',
        breadcrumbs: [{ label: 'UHC' }, { label: 'Patient Care' }, { label: 'Dashboard' }],
        links: [
            { label: 'Critical Patients', href: '/healthcare/critical-patients' },
            { label: 'Patient Dashboard', href: '/healthcare/patient-dashboard' },
            { label: 'Medication', href: '/healthcare/medication-management' },
            { label: 'Nutrition', href: '/healthcare/nutrition-diet' }
        ],
        metrics: [
            { label: 'Patients', value: 0, helper: 'Patients tracked in dashboard', icon: HeartPulse },
            { label: 'Critical', value: 0, helper: 'Needs urgent care review', icon: AlertTriangle },
            { label: 'Medication Plans', value: 0, helper: 'Medication records active', icon: ClipboardList },
            { label: 'Nutrition Plans', value: 0, helper: 'Diet plans under care', icon: Activity }
        ],
        trendTitle: 'Patient Care Movement',
        trendSubtitle: 'Patient care volume, pending reviews, and completed checks',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Patient Care Split',
        splitSubtitle: 'Current care work distribution',
        split: [],
        tableTitle: 'Patient Care Watchlist',
        tableSubtitle: 'Care records needing manager attention',
        rows: []
    },
    careAllocation: {
        title: 'Care Allocation Dashboard',
        subtitle: 'Clinical care, home care, other care assignments, staff load, and allocation status monitoring.',
        breadcrumbs: [{ label: 'UHC' }, { label: 'Care Allocation' }, { label: 'Dashboard' }],
        links: [
            { label: 'Clinical Care', href: '/allocation/clinical-care' },
            { label: 'Home Care', href: '/allocation/home-care' },
            { label: 'In-House Care', href: '/allocation/inhouse-care' },
            { label: 'Other Care', href: '/allocation/others' }
        ],
        metrics: [
            { label: 'Clinical Allocations', value: 18, helper: 'Clinical care cases active', icon: HeartPulse },
            { label: 'Home Care', value: 22, helper: 'Home care allocations active', icon: Users },
            { label: 'Other Care', value: 7, helper: 'Other care services active', icon: Activity },
            { label: 'Staff Load', value: 11, helper: 'Care staff assignment queue', icon: ClipboardList }
        ],
        trendTitle: 'Allocation Movement',
        trendSubtitle: 'Allocation volume, pending assignments, and completed work',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Care Allocation Split',
        splitSubtitle: 'Current care allocation distribution',
        split: [{ name: 'Clinical', value: 38 }, { name: 'Home', value: 44 }, { name: 'In-House', value: 16 }, { name: 'Other', value: 12 }, { name: 'Pending', value: 8 }],
        tableTitle: 'Allocation Queue',
        tableSubtitle: 'Care allocation records needing manager action',
        rows: [
            { id: 'ALLOC-201', name: 'Clinical Care', detail: 'Nurse assignment pending', status: 'PENDING', owner: 'Allocation Desk', due: 'Today' },
            { id: 'ALLOC-218', name: 'Home Care', detail: 'Caregiver route confirmation', status: 'OPEN', owner: 'Home Care', due: 'Tomorrow' },
            { id: 'ALLOC-225', name: 'Other Care', detail: 'Support service allocation', status: 'REVIEW', owner: 'Care Desk', due: 'Friday' }
        ]
    },
    medicalInventory: {
        title: 'Medical Inventory Dashboard',
        subtitle: 'Medical assets, purchase orders, products, stock, and low-stock inventory monitoring.',
        breadcrumbs: [{ label: 'UHC' }, { label: 'Medical Inventory' }, { label: 'Dashboard' }],
        links: [
            { label: 'Medical Assets', href: '/inventory/products/assets' },
            { label: 'Purchase Orders', href: '/inventory/purchase-orders' },
            { label: 'Stock', href: '/inventory/stock' },
            { label: 'Low Stock', href: '/inventory/low-stock-alerts' }
        ],
        metrics: [
            { label: 'Medical Assets', value: 74, helper: 'Assets under medical stock', icon: ClipboardList },
            { label: 'Purchase Orders', value: 9, helper: 'Medical procurement records', icon: IndianRupee },
            { label: 'Low Stock', value: 7, helper: 'Medical items below threshold', icon: AlertTriangle },
            { label: 'Stock Updates', value: 31, helper: 'Recent stock movements', icon: Activity }
        ],
        trendTitle: 'Medical Inventory Movement',
        trendSubtitle: 'Inventory volume, pending stock, and completed updates',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Medical Stock Split',
        splitSubtitle: 'Inventory categories under monitoring',
        split: [{ name: 'Assets', value: 36 }, { name: 'Products', value: 28 }, { name: 'Orders', value: 18 }, { name: 'Low Stock', value: 10 }],
        tableTitle: 'Medical Inventory Watchlist',
        tableSubtitle: 'Medical stock and purchase records needing action',
        rows: [
            { id: 'MINV-101', name: 'Oxygen Regulator', detail: 'Stock below threshold', status: 'LOW_STOCK', owner: 'Store', due: 'Today' },
            { id: 'MINV-118', name: 'Purchase Order', detail: 'Medical consumables order', status: 'RAISED', owner: 'Inventory', due: 'Tomorrow' },
            { id: 'MINV-124', name: 'Asset Check', detail: 'Nebulizer asset verification', status: 'REVIEW', owner: 'Medical Store', due: 'Friday' }
        ]
    },
    ambulanceBooking: {
        title: 'Ambulance Booking Dashboard',
        subtitle: 'Ambulance bookings, trip sheets, booking queue, and service follow-up monitoring.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Ambulance Booking' }, { label: 'Dashboard' }],
        links: [
            { label: 'Bookings', href: '/ambulance/bookings' },
            { label: 'Trip Sheets', href: '/ambulance/trip-sheets' },
            { label: 'Dispatch', href: '/ambulance/dispatch' }
        ],
        metrics: [
            { label: 'Bookings', value: 28, helper: 'Ambulance bookings this period', icon: Ambulance },
            { label: 'Trip Sheets', value: 19, helper: 'Trip records generated', icon: ClipboardList },
            { label: 'Pending Pickup', value: 6, helper: 'Bookings waiting for dispatch', icon: CalendarClock },
            { label: 'Completed Trips', value: 21, helper: 'Trips completed successfully', icon: ShieldCheck }
        ],
        trendTitle: 'Booking Movement',
        trendSubtitle: 'Bookings, pending work, and completed trips',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Booking Split',
        splitSubtitle: 'Ambulance booking workload',
        split: [{ name: 'Booked', value: 38 }, { name: 'Pending', value: 16 }, { name: 'Trip Sheets', value: 24 }, { name: 'Completed', value: 22 }],
        tableTitle: 'Booking Queue',
        tableSubtitle: 'Ambulance bookings needing coordinator action',
        rows: [
            { id: 'AMB-B-101', name: 'Hospital Pickup', detail: 'Dialysis appointment ride', status: 'BOOKED', owner: 'Booking Desk', due: 'Today' },
            { id: 'AMB-B-118', name: 'In-house Transfer', detail: 'Care unit transfer request', status: 'PENDING', owner: 'Booking Desk', due: 'Today' },
            { id: 'AMB-B-125', name: 'Trip Sheet', detail: 'Trip sheet confirmation needed', status: 'OPEN', owner: 'Trip Desk', due: 'Tomorrow' }
        ]
    },
    dispatch: {
        title: 'Dispatch Manager Dashboard',
        subtitle: 'Dispatch management, driver assignment, field duty, route status, and response monitoring.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Dispatch' }, { label: 'Dashboard' }],
        links: [
            { label: 'Dispatch', href: '/ambulance/dispatch' },
            { label: 'Staff Assignment', href: '/ambulance/staff-assignment' },
            { label: 'Field Duty', href: '/hr/field-duty' },
            { label: 'Bookings', href: '/ambulance/bookings' }
        ],
        metrics: [
            { label: 'Active Dispatches', value: 12, helper: 'Trips currently assigned', icon: Ambulance },
            { label: 'Drivers Assigned', value: 9, helper: 'Driver and staff assignments', icon: Users },
            { label: 'Field Duties', value: 7, helper: 'Field duty items active', icon: ClipboardList },
            { label: 'Escalations', value: 2, helper: 'Dispatch exceptions', icon: AlertTriangle }
        ],
        trendTitle: 'Dispatch Movement',
        trendSubtitle: 'Dispatch volume, pending assignments, and completed trips',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Dispatch Split',
        splitSubtitle: 'Current dispatch operational state',
        split: [{ name: 'Assigned', value: 40 }, { name: 'Pending', value: 18 }, { name: 'Field Duty', value: 22 }, { name: 'Escalated', value: 8 }],
        tableTitle: 'Dispatch Watchlist',
        tableSubtitle: 'Dispatch and field records requiring manager attention',
        rows: [
            { id: 'DSP-201', name: 'Route Assignment', detail: 'Driver confirmation pending', status: 'PENDING', owner: 'Dispatch Desk', due: 'Now' },
            { id: 'DSP-218', name: 'Field Duty', detail: 'Crew route update needed', status: 'OPEN', owner: 'Field Team', due: 'Today' },
            { id: 'DSP-225', name: 'Escalation', detail: 'Delayed ambulance response', status: 'ESCALATED', owner: 'Dispatch Manager', due: 'Now' }
        ]
    },
    fleet: {
        title: 'Fleet Manager Dashboard',
        subtitle: 'Vehicle fleet, ambulance maintenance, availability, service schedules, and fleet readiness.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Fleet' }, { label: 'Dashboard' }],
        links: [
            { label: 'Vehicle Fleet', href: '/ambulance/fleet' },
            { label: 'Maintenance', href: '/ambulance/maintenance' },
            { label: 'Dispatch', href: '/ambulance/dispatch' }
        ],
        metrics: [
            { label: 'Vehicles', value: 16, helper: 'Fleet vehicles tracked', icon: Ambulance },
            { label: 'Available', value: 11, helper: 'Ready for dispatch', icon: ShieldCheck },
            { label: 'Maintenance', value: 3, helper: 'Vehicles under service', icon: AlertTriangle },
            { label: 'Inspections', value: 8, helper: 'Fleet checks due this week', icon: ClipboardList }
        ],
        trendTitle: 'Fleet Movement',
        trendSubtitle: 'Fleet volume, maintenance queue, and completed checks',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Fleet Readiness',
        splitSubtitle: 'Vehicle state distribution',
        split: [{ name: 'Available', value: 52 }, { name: 'On Trip', value: 22 }, { name: 'Maintenance', value: 16 }, { name: 'Inspection', value: 10 }],
        tableTitle: 'Fleet Watchlist',
        tableSubtitle: 'Vehicles and maintenance records needing fleet action',
        rows: [
            { id: 'FLT-301', name: 'Ambulance A-04', detail: 'Scheduled maintenance due', status: 'SERVICE', owner: 'Fleet Team', due: 'Today' },
            { id: 'FLT-318', name: 'Ambulance A-09', detail: 'Fuel and readiness check', status: 'CHECK', owner: 'Driver', due: 'Tomorrow' },
            { id: 'FLT-325', name: 'Ambulance A-12', detail: 'Insurance document update', status: 'REVIEW', owner: 'Fleet Manager', due: 'Friday' }
        ]
    },
    ambulanceBilling: {
        title: 'Ambulance Billing Dashboard',
        subtitle: 'Ambulance billing, trip-sheet charges, pending collections, and service billing monitoring.',
        breadcrumbs: [{ label: 'UA' }, { label: 'Ambulance Billing' }, { label: 'Dashboard' }],
        links: [
            { label: 'Billing', href: '/ambulance/billing' },
            { label: 'Trip Sheets', href: '/ambulance/trip-sheets' },
            { label: 'Bookings', href: '/ambulance/bookings' }
        ],
        metrics: [
            { label: 'Billing Value', value: 'Rs 84k', helper: 'Current ambulance billing', icon: IndianRupee },
            { label: 'Pending Bills', value: 6, helper: 'Billing records waiting', icon: CalendarClock },
            { label: 'Trip Sheets', value: 19, helper: 'Chargeable trip records', icon: ClipboardList },
            { label: 'Collected', value: 'Rs 62k', helper: 'Payments collected', icon: ShieldCheck }
        ],
        trendTitle: 'Ambulance Billing Movement',
        trendSubtitle: 'Billing volume, pending bills, and completed collections',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Billing Split',
        splitSubtitle: 'Ambulance finance workload',
        split: [{ name: 'Collected', value: 42 }, { name: 'Pending', value: 20 }, { name: 'Trip Sheets', value: 24 }, { name: 'Review', value: 10 }],
        tableTitle: 'Billing Watchlist',
        tableSubtitle: 'Ambulance billing records needing finance action',
        rows: [
            { id: 'ABILL-501', name: 'Hospital Transfer', detail: 'Trip charge review', status: 'PENDING', owner: 'Billing Desk', due: 'Today' },
            { id: 'ABILL-508', name: 'Dialysis Transport', detail: 'Payment follow-up', status: 'OPEN', owner: 'Finance', due: 'Tomorrow' },
            { id: 'ABILL-515', name: 'Emergency Support', detail: 'Insurance review pending', status: 'REVIEW', owner: 'Billing Manager', due: 'Friday' }
        ]
    },
    followUp: {
        title: 'Follow-up Coordinator Dashboard',
        subtitle: 'Enquiry follow-up queue, welcome calls, feedback, customer care handoff, and closure monitoring.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Follow-up' }, { label: 'Dashboard' }],
        links: [
            { label: 'Follow-up', href: '/crm/enquiry-follow-up' },
            { label: 'Active Enquiries', href: '/crm/active-enquiries' },
            { label: 'Welcome Call', href: '/business/welcome-call' },
            { label: 'Feedback', href: '/crm/feedback' }
        ],
        metrics: [
            { label: 'Follow-ups Due', value: 18, helper: 'Open follow-up items', icon: CalendarClock },
            { label: 'Overdue', value: 4, helper: 'Delayed follow-ups', icon: AlertTriangle },
            { label: 'Welcome Calls', value: 11, helper: 'Welcome calls in queue', icon: PhoneCall },
            { label: 'Closed Today', value: 9, helper: 'Follow-ups completed', icon: ShieldCheck }
        ],
        trendTitle: 'Follow-up Movement',
        trendSubtitle: 'Follow-up volume, pending work, and completed calls',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Follow-up Split',
        splitSubtitle: 'Follow-up work by channel',
        split: [{ name: 'Call', value: 38 }, { name: 'Customer Care', value: 22 }, { name: 'Feedback', value: 18 }, { name: 'Closure', value: 16 }],
        tableTitle: 'Follow-up Queue',
        tableSubtitle: 'Enquiry follow-ups needing coordinator action',
        rows: [
            { id: 'FUP-701', name: 'Aarav Sharma', detail: 'Care plan follow-up', status: 'DUE', owner: 'Follow-up Desk', due: 'Today' },
            { id: 'FUP-718', name: 'Priya Menon', detail: 'Welcome call pending', status: 'OVERDUE', owner: 'Care Desk', due: '2h ago' },
            { id: 'FUP-725', name: 'Karthik Iyer', detail: 'Feedback closure call', status: 'OPEN', owner: 'Coordinator', due: 'Tomorrow' }
        ]
    },
    customerRelations: {
        title: 'Customer Relations Dashboard',
        subtitle: 'Customer care, welcome calls, complaints, pending feedbacks, feedback, and service history monitoring.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Customer Relations' }, { label: 'Dashboard' }],
        links: [
            { label: 'Customer Care', href: '/crm/customer-care' },
            { label: 'Pending Feedback', href: '/customer-care/pending-feedback' },
            { label: 'Complaints', href: '/customer-care/complaints' },
            { label: 'Service History', href: '/customer-care/service-history' }
        ],
        metrics: [
            { label: 'Customer Cases', value: 21, helper: 'Active customer care records', icon: Headset },
            { label: 'Pending Feedback', value: 8, helper: 'Feedbacks waiting', icon: ClipboardList },
            { label: 'Complaints', value: 5, helper: 'Open complaints', icon: AlertTriangle },
            { label: 'Resolved', value: 16, helper: 'Closed customer items', icon: ShieldCheck }
        ],
        trendTitle: 'Customer Relations Movement',
        trendSubtitle: 'Case volume, pending work, and completed resolutions',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Customer Work Split',
        splitSubtitle: 'Current customer relations workload',
        split: [{ name: 'Care', value: 32 }, { name: 'Feedback', value: 24 }, { name: 'Complaints', value: 18 }, { name: 'History', value: 16 }],
        tableTitle: 'Customer Relations Watchlist',
        tableSubtitle: 'Customer cases needing manager attention',
        rows: [
            { id: 'CR-801', name: 'Complaint Review', detail: 'Delayed care follow-up', status: 'OPEN', owner: 'Customer Care', due: 'Today' },
            { id: 'CR-818', name: 'Pending Feedback', detail: 'Service feedback not closed', status: 'PENDING', owner: 'Feedback Desk', due: 'Tomorrow' },
            { id: 'CR-825', name: 'Welcome Call', detail: 'New admission welcome call', status: 'DUE', owner: 'Relations', due: 'Today' }
        ]
    },
    omnichannel: {
        title: 'Omnichannel Coordinator Dashboard',
        subtitle: 'Conversations, email, WhatsApp, SMS, missed calls, and call handling workload monitoring.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Omnichannel' }, { label: 'Dashboard' }],
        links: [
            { label: 'Conversations', href: '/omnichannel/conversations' },
            { label: 'Email', href: '/omnichannel/email' },
            { label: 'WhatsApp', href: '/omnichannel/whatsapp' },
            { label: 'Calls', href: '/omnichannel/calls' }
        ],
        metrics: [
            { label: 'Conversations', value: 42, helper: 'Open omnichannel threads', icon: Headset },
            { label: 'Emails', value: 18, helper: 'Email items in queue', icon: ClipboardList },
            { label: 'Missed Calls', value: 7, helper: 'Calls needing callback', icon: PhoneCall },
            { label: 'Resolved Today', value: 24, helper: 'Threads closed today', icon: ShieldCheck }
        ],
        trendTitle: 'Omnichannel Movement',
        trendSubtitle: 'Message volume, pending queue, and completed responses',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Channel Split',
        splitSubtitle: 'Current communication workload',
        split: [{ name: 'Chat', value: 34 }, { name: 'Email', value: 22 }, { name: 'WhatsApp', value: 24 }, { name: 'Calls', value: 16 }],
        tableTitle: 'Omnichannel Queue',
        tableSubtitle: 'Communication records needing coordinator action',
        rows: [
            { id: 'OMNI-901', name: 'WhatsApp Thread', detail: 'Admission pricing query', status: 'OPEN', owner: 'Omnichannel', due: 'Now' },
            { id: 'OMNI-918', name: 'Missed Call', detail: 'Care service callback needed', status: 'CALLBACK', owner: 'Call Desk', due: 'Today' },
            { id: 'OMNI-925', name: 'Email', detail: 'Invoice copy request', status: 'PENDING', owner: 'Email Desk', due: 'Tomorrow' }
        ]
    },
    admissions: {
        title: 'Admissions Coordinator Dashboard',
        subtitle: 'Admission tracking, admission forms, client details, document handoff, and conversion movement.',
        breadcrumbs: [{ label: 'UEO' }, { label: 'Admissions' }, { label: 'Dashboard' }],
        links: [
            { label: 'Admission Tracking', href: '/crm/admission-tracking' },
            { label: 'Admission Forms', href: '/crm/admission-forms' },
            { label: 'All Clients', href: '/crm/clients' },
            { label: 'Active Enquiries', href: '/crm/active-enquiries' }
        ],
        metrics: [
            { label: 'Admissions Pipeline', value: 14, helper: 'Admissions being tracked', icon: ClipboardList },
            { label: 'Forms Pending', value: 6, helper: 'Admission forms incomplete', icon: AlertTriangle },
            { label: 'Clients Ready', value: 9, helper: 'Clients ready for admission', icon: Users },
            { label: 'Converted', value: 5, helper: 'Admissions converted this week', icon: ShieldCheck }
        ],
        trendTitle: 'Admission Movement',
        trendSubtitle: 'Admission volume, pending forms, and completed conversions',
        trendKeys: ['volume', 'pending', 'completed'],
        splitTitle: 'Admission Split',
        splitSubtitle: 'Current admission pipeline state',
        split: [{ name: 'Tracking', value: 34 }, { name: 'Forms', value: 22 }, { name: 'Clients', value: 24 }, { name: 'Converted', value: 16 }],
        tableTitle: 'Admission Watchlist',
        tableSubtitle: 'Admission records needing coordinator action',
        rows: [
            { id: 'ADM-1184', name: 'Vivaan Reddy', detail: 'Memory care admission', status: 'ADMITTED', owner: 'Admissions', due: 'Room A-204' },
            { id: 'ADM-1190', name: 'Janani Bose', detail: 'Documents pending', status: 'DOCUMENTS', owner: 'Admissions', due: 'Today' },
            { id: 'ADM-1197', name: 'George Thomas', detail: 'Payment pending', status: 'PAYMENT', owner: 'Coordinator', due: 'Tomorrow' }
        ]
    }
}

export const MasterDataManagerDashboard = () => <RoleDashboard config={roleDashboards.masterData} />

export function HRManagerDashboard() {
    const { data: staffData = [], isLoading: staffLoading } = useStaff({ includeFormer: true, scope: 'all' })
    const { data: attendanceLogs = [], isLoading: attendanceLoading } = useAttendanceLogs({ date: currentIsoDate, scope: 'all' })
    const { data: leaveRequests = [], isLoading: leaveLoading } = useLeaveRequests()
    const { data: payrollRows = [], isLoading: payrollLoading } = usePayrollPreview({ month: currentPayrollMonth, scope: 'all' })

    const liveStaff = useMemo(() => staffData.filter((staff) => isManualEmployee(staff.empId)), [staffData])
    const activeStaff = useMemo(() => liveStaff.filter((staff) => {
        const status = normalizeDashboardStatus(staff.status)
        return !staff.isDeleted && status !== 'RESIGNED' && status !== 'TERMINATED'
    }), [liveStaff])

    const pendingLeave = useMemo(
        () => leaveRequests.filter((request) => normalizeDashboardStatus(request.status) === 'PENDING'),
        [leaveRequests]
    )

    const payrollQueue = useMemo(
        () => payrollRows.filter((row) => normalizeDashboardStatus(row.status) !== 'PROCESSED' && Number(row.grossPay || 0) > 0),
        [payrollRows]
    )

    const processedPayroll = useMemo(
        () => payrollRows.filter((row) => normalizeDashboardStatus(row.status) === 'PROCESSED'),
        [payrollRows]
    )

    const netPayable = useMemo(
        () => payrollRows.reduce((total, row) => total + Number(row.netPay || 0), 0),
        [payrollRows]
    )

    const trendData = useMemo(() => buildCurrentMonthTrend({
        volume: liveStaff.length,
        pending: pendingLeave.length + payrollQueue.length,
        completed: attendanceLogs.length + processedPayroll.length
    }), [attendanceLogs.length, liveStaff.length, payrollQueue.length, pendingLeave.length, processedPayroll.length])

    const splitData = useMemo(() => ([
        { name: 'Staff', value: Math.max(activeStaff.length, 0) },
        { name: 'Attendance', value: Math.max(attendanceLogs.length, 0) },
        { name: 'Leave', value: Math.max(pendingLeave.length, 0) },
        { name: 'Payroll', value: Math.max(payrollQueue.length, 0) }
    ]).filter((item) => item.value > 0), [activeStaff.length, attendanceLogs.length, payrollQueue.length, pendingLeave.length])

    const actionRows = useMemo<WorkItem[]>(() => {
        const leaveItems = pendingLeave.slice(0, 3).map((request) => ({
            id: request.id,
            name: 'Leave Approval',
            detail: `${request.name} - ${request.leaveType}`,
            status: 'PENDING',
            owner: 'HR Manager',
            due: request.fromDate || 'Today'
        }))
        const payrollItems = payrollQueue.slice(0, 3).map((row) => ({
            id: row.id,
            name: 'Payroll Processing',
            detail: `${row.name} - ${formatShortMoney(Number(row.netPay || 0))} net payable`,
            status: row.status || 'READY',
            owner: 'Payroll',
            due: row.month || currentPayrollMonth
        }))
        const attendanceItems = attendanceLogs.slice(0, 2).map((log) => ({
            id: log.id,
            name: 'Attendance Logged',
            detail: `${log.name} - ${log.checkIn || '-'} to ${log.checkOut || '-'}`,
            status: log.status || 'PRESENT',
            owner: 'Attendance',
            due: log.date || currentIsoDate
        }))
        return [...leaveItems, ...payrollItems, ...attendanceItems]
    }, [attendanceLogs, payrollQueue, pendingLeave])

    const isLoading = staffLoading || attendanceLoading || leaveLoading || payrollLoading

    return (
        <div className="space-y-4">
            <PageHeader
                title="HR Manager Dashboard"
                subtitle="Live staff, attendance, leave, payroll, and HR report monitoring."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Human Resource' }, { label: 'Dashboard' }]}
            />

            <div className="flex flex-wrap justify-end gap-3">
                {[
                    { label: 'Staff', href: '/hr/staff' },
                    { label: 'Attendance', href: '/hr/attendance' },
                    { label: 'Leave', href: '/hr/leave' },
                    { label: 'Payroll', href: '/hr/payroll' },
                    { label: 'Reports', href: '/hr/reports' }
                ].map((link) => (
                    <Link key={link.href} to={link.href} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 shadow-sm hover:border-primary-200 hover:bg-primary-50">
                        {link.label}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Active Staff', value: activeStaff.length, helper: 'Manual staff currently working', icon: Users },
                    { label: 'Today Attendance', value: attendanceLogs.length, helper: 'Manual check-ins for today', icon: ClipboardList },
                    { label: 'Pending Leave', value: pendingLeave.length, helper: 'Waiting for HR decision', icon: CalendarClock },
                    { label: 'Payroll Queue', value: payrollQueue.length, helper: `${formatShortMoney(netPayable)} net payable this month`, icon: IndianRupee }
                ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                            <metric.icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-2xl font-extrabold text-slate-950">{isLoading ? '-' : metric.value}</p>
                        <p className="text-sm font-extrabold text-slate-950">{metric.label}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{metric.helper}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-extrabold text-slate-950">HR Movement</h2>
                        <p className="text-sm font-semibold text-slate-500">Live staff volume, pending actions, and completed logs</p>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="volume" fill="#0F969C" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="pending" fill="#0C7075" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="completed" fill="#294D61" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-extrabold text-slate-950">HR Workload Split</h2>
                        <p className="text-sm font-semibold text-slate-500">Current HR operational distribution</p>
                    </div>
                    <div className="h-72">
                        {splitData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={4}>
                                        {splitData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">No live HR workload yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">HR Action Queue</h2>
                        <p className="text-sm font-semibold text-slate-500">Live leave, payroll, and attendance items needing review</p>
                    </div>
                    <Link to="/hr/reports" className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-primary-700">
                        Reports
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-extrabold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Detail</th>
                                <th className="px-4 py-3">Owner</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actionRows.length > 0 ? actionRows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-extrabold text-slate-950">{row.name}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-600">{row.detail}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.owner}</td>
                                    <td className="px-4 py-3"><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-extrabold text-primary-700">{row.status}</span></td>
                                    <td className="px-4 py-3 text-slate-600">{row.due}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-slate-500">No pending live HR actions.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export const SecuritySupervisorDashboard = () => <RoleDashboard config={roleDashboards.security} />
export const CMSManagerDashboard = () => <RoleDashboard config={roleDashboards.cms} />

export function AdminFilesManagerDashboard() {
    const { data: adminFileRecords = [] } = useQuery({
        queryKey: ['admin-file-register'],
        queryFn: fetchAdminFileRegisterRecords
    })

    const adminFileMetrics = useMemo(() => {
        const trackedFiles = adminFileRecords.length
        const pendingUploads = adminFileRecords.filter((record) => {
            const status = String(record.status || '').trim().toLowerCase()
            return status === 'not uploaded' || !record.uploadedFileUrl
        }).length
        const verifiedFiles = adminFileRecords.filter((record) => String(record.status || '').trim().toLowerCase() === 'verified').length
        const expiringSoon = adminFileRecords.filter((record) => ['Expired', 'Due Soon'].includes(getAdminFileRenewalStatus(record))).length
        const uploadedFiles = adminFileRecords.filter((record) => Boolean(record.uploadedFileUrl)).length
        const completedFiles = adminFileRecords.filter((record) => ['received', 'verified', 'archived'].includes(String(record.status || '').trim().toLowerCase())).length

        const groupCounts = adminFileRecords.reduce<Record<string, { total: number, pending: number, completed: number }>>((acc, record) => {
            const group = String(record.group || 'Uncategorized')
            if (!acc[group]) acc[group] = { total: 0, pending: 0, completed: 0 }

            acc[group].total += 1
            if (String(record.status || '').trim().toLowerCase() === 'not uploaded' || !record.uploadedFileUrl) {
                acc[group].pending += 1
            }
            if (['received', 'verified', 'archived'].includes(String(record.status || '').trim().toLowerCase())) {
                acc[group].completed += 1
            }

            return acc
        }, {})

        const trend = Object.entries(groupCounts).map(([group, counts]) => ({
            month: group.replace(' Documents', '').replace(' Files', ''),
            volume: counts.total,
            pending: counts.pending,
            completed: counts.completed
        }))

        const split = Object.entries(groupCounts).map(([name, counts]) => ({
            name: name.replace(' Documents', '').replace(' Files', ''),
            value: counts.total
        }))

        const watchlist = adminFileRecords
            .filter((record) => {
                const status = String(record.status || '').trim().toLowerCase()
                return status === 'not uploaded' || !record.uploadedFileUrl || ['Expired', 'Due Soon'].includes(getAdminFileRenewalStatus(record))
            })
            .slice(0, 6)
            .map((record, index) => {
                const renewalStatus = getAdminFileRenewalStatus(record)
                const status = renewalStatus !== 'No Expiry' && renewalStatus !== 'Active'
                    ? renewalStatus.toUpperCase()
                    : String(record.status || 'Pending').toUpperCase()

                return {
                    id: String(record.fileNo && record.fileNo !== '-' ? record.fileNo : record.id || `FILE-${index + 1}`),
                    name: String(record.fileType || 'Admin File'),
                    detail: String(record.relatedName && record.relatedName !== '-' ? record.relatedName : record.group || 'Admin file register'),
                    status,
                    owner: String(record.maintainedBy || 'Admin Files'),
                    due: record.expiryDate ? `Expiry ${record.expiryDate}` : 'Upload pending'
                }
            })

        return {
            trackedFiles,
            pendingUploads,
            verifiedFiles,
            expiringSoon,
            uploadedFiles,
            completedFiles,
            trend,
            split,
            watchlist
        }
    }, [adminFileRecords])

    return (
        <DashboardFrame
            title="Admin Files Manager Dashboard"
            subtitle="Document tracker, unit files, licence files, record books, and staff file register monitoring."
            breadcrumbs={[{ label: 'UNCF' }, { label: 'Admin Files' }, { label: 'Dashboard' }]}
            links={[
                { label: 'Admin Files', href: '/admin-files' },
                { label: 'UNCF Documents', href: '/admin-files/uncf-documents' },
                { label: 'Record Books', href: '/admin-files/record-books' },
                { label: 'Nursing Files', href: '/admin-files/nursing-files' }
            ]}
            metrics={[
                { label: 'Tracked Files', value: adminFileMetrics.trackedFiles, helper: 'Files currently in admin register', icon: ClipboardList },
                { label: 'Expiring Soon', value: adminFileMetrics.expiringSoon, helper: 'Licence and document renewals', icon: AlertTriangle },
                { label: 'Pending Uploads', value: adminFileMetrics.pendingUploads, helper: 'Register rows without uploaded document', icon: CalendarClock },
                { label: 'Verified Files', value: adminFileMetrics.verifiedFiles, helper: `${adminFileMetrics.uploadedFiles} uploaded files available`, icon: ShieldCheck }
            ]}
            trend={{
                title: 'Document Movement',
                subtitle: 'File volume, pending uploads, and completed verifications',
                data: adminFileMetrics.trend.length ? adminFileMetrics.trend : [{ month: 'No Files', volume: 0, pending: 0, completed: 0 }]
            }}
            trendKeys={['volume', 'pending', 'completed']}
            split={adminFileMetrics.split.length ? adminFileMetrics.split : [{ name: 'No Files', value: 1 }]}
            splitTitle="File Register Split"
            splitSubtitle="Admin file workload by category"
            table={{
                title: 'Document Watchlist',
                subtitle: 'Admin file records needing manager action',
                rows: adminFileMetrics.watchlist
            }}
        />
    )
}
const normalizeTaskStatus = (status?: string) => String(status || '').trim().toUpperCase().replace(/[\s-]+/g, '_')

const parseTaskDescription = (description?: string) => {
    const details: Record<string, string> = {}
    String(description || '').split('\n').forEach((line) => {
        const [rawKey, ...rest] = line.split(':')
        const key = rawKey?.trim()
        const value = rest.join(':').trim()
        if (key && value) details[key] = value
    })
    return details
}

const getStaffTaskKind = (task: Task) => {
    const details = parseTaskDescription(task.description)
    const title = task.title.toLowerCase()
    if (details.Complaint || title.includes('complaint')) return 'Complaint'
    if (details.Allocation || title.includes('care duty')) return 'Service Duty'
    return task.type === 'SCHEDULED' ? 'Scheduled Task' : 'Daily Task'
}

const formatTaskDueDate = (value?: string) => {
    if (!value) return 'No due date'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProfileTaskDashboard() {
    const { data: tasks = [], isLoading } = useTasks({ scope: 'mine' })

    const taskMetrics = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const dueToday = tasks.filter((task) => {
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            if (Number.isNaN(dueDate.getTime())) return false
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
        }).length

        return {
            assigned: tasks.filter((task) => normalizeTaskStatus(task.status) === 'ASSIGNED').length,
            inProgress: tasks.filter((task) => normalizeTaskStatus(task.status) === 'IN_PROGRESS').length,
            waitingApproval: tasks.filter((task) => normalizeTaskStatus(task.status) === 'COMPLETED').length,
            closed: tasks.filter((task) => ['APPROVED', 'VERIFIED'].includes(normalizeTaskStatus(task.status))).length,
            dueToday
        }
    }, [tasks])

    const rows: WorkItem[] = useMemo(() => tasks.slice(0, 6).map((task) => {
        const details = parseTaskDescription(task.description)
        const detailParts = [
            details.Reference ? `Ref ${details.Reference}` : '',
            details.Client ? `Client ${details.Client}` : '',
            details.Patient ? `Patient ${details.Patient}` : '',
            details.Notes || ''
        ].filter(Boolean)

        return {
            id: task.id,
            name: task.title,
            detail: detailParts.join(' - ') || getStaffTaskKind(task),
            status: String(task.status || 'ASSIGNED'),
            owner: String(task.assignedBy || 'System'),
            due: formatTaskDueDate(task.dueDate)
        }
    }), [tasks])

    return (
        <DashboardFrame
            title="My Staff Work Dashboard"
            subtitle="Live task workload for the logged-in staff member only."
            breadcrumbs={[{ label: 'Profile' }, { label: 'Dashboard' }]}
            links={[
                { label: 'My Profile', href: '/profile/me' },
                { label: 'Daily Task', href: '/profile/tasks' },
                { label: 'Notifications', href: '/profile/notifications' }
            ]}
            metrics={[
                { label: 'Assigned', value: isLoading ? '-' : taskMetrics.assigned, helper: 'Live tasks waiting to start', icon: ClipboardList },
                { label: 'In Progress', value: isLoading ? '-' : taskMetrics.inProgress, helper: 'Tasks currently being handled', icon: Activity },
                { label: 'Waiting Approval', value: isLoading ? '-' : taskMetrics.waitingApproval, helper: 'Completed by staff, pending manager approval', icon: ShieldCheck },
                { label: 'Approved', value: isLoading ? '-' : taskMetrics.closed, helper: `${taskMetrics.dueToday} task(s) due today`, icon: CalendarClock }
            ]}
            trend={{
                title: 'My Work Movement',
                subtitle: 'Live assigned, running, waiting approval, and approved task counts',
                data: [
                    { month: 'Assigned', volume: taskMetrics.assigned, pending: taskMetrics.assigned, completed: 0 },
                    { month: 'Progress', volume: taskMetrics.inProgress, pending: taskMetrics.inProgress, completed: 0 },
                    { month: 'Approval', volume: taskMetrics.waitingApproval, pending: taskMetrics.waitingApproval, completed: 0 },
                    { month: 'Closed', volume: taskMetrics.closed, pending: 0, completed: taskMetrics.closed }
                ]
            }}
            trendKeys={['volume', 'pending', 'completed']}
            split={[
                { name: 'Assigned', value: taskMetrics.assigned },
                { name: 'Progress', value: taskMetrics.inProgress },
                { name: 'Approval', value: taskMetrics.waitingApproval },
                { name: 'Approved', value: taskMetrics.closed }
            ]}
            splitTitle="My Task Split"
            splitSubtitle="Current staff workload by live status"
            table={{
                title: 'My Latest Work',
                subtitle: rows.length ? 'Tasks assigned to this staff login' : 'No live tasks assigned to this staff login',
                rows
            }}
        />
    )
}
export const InHouseCareManagerDashboard = () => <RoleDashboard config={roleDashboards.inHouseCare} />

const isClosedOperationsStatus = (status?: string) => ['COMPLETED', 'SERVED'].includes(normalizeDashboardStatus(status))

const formatOperationsDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function ElderOperationsManagerDashboard() {
    const { data: nutritionPlans = [], isLoading: isNutritionLoading } = useOperationsNutritionPlans()
    const { data: mealPreps = [], isLoading: isMealPrepsLoading } = useMealPreps()
    const { data: laundryRecords = [], isLoading: isLaundryLoading } = useLaundryRecords()
    const { data: maintenanceRecords = [], isLoading: isMaintenanceLoading } = useMaintenanceRecords()
    const { data: wasteRecords = [], isLoading: isWasteLoading } = useWasteRecords()

    const isLoading = isNutritionLoading || isMealPrepsLoading || isLaundryLoading || isMaintenanceLoading || isWasteLoading

    const operationsMetrics = useMemo(() => {
        const servedMeals = mealPreps.filter((record) => normalizeDashboardStatus(record.status) === 'SERVED').length
        const completedLaundry = laundryRecords.filter((record) => isClosedOperationsStatus(record.status)).length
        const openMaintenance = maintenanceRecords.filter((record) => !isClosedOperationsStatus(record.status)).length
        const activeWaste = wasteRecords.filter((record) => !isClosedOperationsStatus(record.status)).length

        return {
            servedMeals,
            completedLaundry,
            openMaintenance,
            activeWaste
        }
    }, [laundryRecords, maintenanceRecords, mealPreps, wasteRecords])

    const trendData = useMemo(() => {
        const buckets = buildEmptyMonthlyTrend(['volume', 'pending', 'completed'])
        const bucketMap = new Map(buckets.map((bucket) => [String(bucket.month), bucket]))
        const records = [
            ...nutritionPlans.map((record) => ({ createdAt: record.createdAt, status: 'COMPLETED' })),
            ...mealPreps.map((record) => ({ createdAt: record.createdAt, status: record.status })),
            ...laundryRecords.map((record) => ({ createdAt: record.createdAt, status: record.status })),
            ...maintenanceRecords.map((record) => ({ createdAt: record.createdAt, status: record.status })),
            ...wasteRecords.map((record) => ({ createdAt: record.createdAt, status: record.status }))
        ]

        records.forEach((record) => {
            const date = new Date(record.createdAt || '')
            if (Number.isNaN(date.getTime())) return
            const bucket = bucketMap.get(date.toLocaleDateString('en-IN', { month: 'short' }))
            if (!bucket) return

            bucket.volume = Number(bucket.volume || 0) + 1
            if (isClosedOperationsStatus(record.status)) {
                bucket.completed = Number(bucket.completed || 0) + 1
            } else {
                bucket.pending = Number(bucket.pending || 0) + 1
            }
        })

        return buckets
    }, [laundryRecords, maintenanceRecords, mealPreps, nutritionPlans, wasteRecords])

    const splitData = useMemo(() => [
        { name: 'Food Prep', value: mealPreps.length },
        { name: 'Nutrition', value: nutritionPlans.length },
        { name: 'Laundry', value: laundryRecords.length },
        { name: 'Maintenance', value: maintenanceRecords.length },
        { name: 'Waste', value: wasteRecords.length }
    ].filter((item) => item.value > 0), [laundryRecords.length, maintenanceRecords.length, mealPreps.length, nutritionPlans.length, wasteRecords.length])

    const rows: WorkItem[] = useMemo(() => {
        const mealRows = mealPreps
            .filter((record) => !isClosedOperationsStatus(record.status))
            .map((record, index) => ({
                id: `MEAL-${index + 1}`,
                name: 'Meal Preparation',
                detail: `${record.nutrition?.patient?.name || 'Patient'} - ${record.nutrition?.dietPlan || 'Diet plan'}`,
                status: record.status,
                owner: 'Kitchen',
                due: formatOperationsDate(record.createdAt),
                createdAt: record.createdAt
            }))

        const laundryRows = laundryRecords
            .filter((record) => !isClosedOperationsStatus(record.status))
            .map((record, index) => ({
                id: `LND-${index + 1}`,
                name: 'Laundry',
                detail: record.patient?.name || 'Patient laundry record',
                status: record.status,
                owner: 'Laundry',
                due: formatOperationsDate(record.createdAt),
                createdAt: record.createdAt
            }))

        const maintenanceRows = maintenanceRecords
            .filter((record) => !isClosedOperationsStatus(record.status))
            .map((record, index) => ({
                id: `MNT-${index + 1}`,
                name: 'Maintenance',
                detail: record.type,
                status: record.status,
                owner: 'Maintenance',
                due: formatOperationsDate(record.createdAt),
                createdAt: record.createdAt
            }))

        const wasteRows = wasteRecords
            .filter((record) => !isClosedOperationsStatus(record.status))
            .map((record, index) => ({
                id: `WST-${index + 1}`,
                name: 'Waste Management',
                detail: `${record.category} - ${record.source}`,
                status: record.status,
                owner: 'Sanitation',
                due: formatOperationsDate(record.createdAt),
                createdAt: record.createdAt
            }))

        return [...mealRows, ...laundryRows, ...maintenanceRows, ...wasteRows]
            .sort((first, second) => new Date(second.createdAt || '').getTime() - new Date(first.createdAt || '').getTime())
            .slice(0, 8)
            .map(({ createdAt: _createdAt, ...row }) => row)
    }, [laundryRecords, maintenanceRecords, mealPreps, wasteRecords])

    return (
        <DashboardFrame
            title="Elder Operations Dashboard"
            subtitle="Live food preparation, nutrition planning, laundry, maintenance, and waste management monitoring."
            breadcrumbs={[{ label: 'UEC' }, { label: 'Elder Operations' }, { label: 'Dashboard' }]}
            links={[
                { label: 'Food', href: '/operations/food-preparation' },
                { label: 'Nutrition', href: '/operations/nutrition-planning' },
                { label: 'Laundry', href: '/operations/laundry-management' },
                { label: 'Maintenance', href: '/operations/maintenance' },
                { label: 'Waste', href: '/operations/waste-management' }
            ]}
            metrics={[
                { label: 'Meal Prep', value: isLoading ? '-' : mealPreps.length, helper: `${operationsMetrics.servedMeals} served`, icon: ClipboardList },
                { label: 'Nutrition Plans', value: isLoading ? '-' : nutritionPlans.length, helper: 'Live diet plans linked to patients', icon: Activity },
                { label: 'Laundry Active', value: isLoading ? '-' : Math.max(0, laundryRecords.length - operationsMetrics.completedLaundry), helper: `${operationsMetrics.completedLaundry} completed`, icon: ShieldCheck },
                { label: 'Facility Issues', value: isLoading ? '-' : operationsMetrics.openMaintenance + operationsMetrics.activeWaste, helper: 'Maintenance and waste items open', icon: AlertTriangle }
            ]}
            trend={{
                title: 'Operations Movement',
                subtitle: 'Live operations volume, pending work, and completed tasks',
                data: trendData
            }}
            trendKeys={['volume', 'pending', 'completed']}
            split={splitData}
            splitTitle="Operations Split"
            splitSubtitle="Current live operations workload"
            table={{
                title: 'Operations Watchlist',
                subtitle: rows.length ? 'Live operations records still needing action' : 'No live operations action is pending now',
                rows
            }}
        />
    )
}

function InventoryManagerDashboard({ mode }: { mode: 'elder' | 'medical' }) {
    const config = mode === 'medical' ? roleDashboards.medicalInventory : roleDashboards.elderInventory
    const categories = mode === 'medical' ? medicalInventoryCategories : elderInventoryCategories
    const { data: products = [], isLoading: isProductsLoading } = useInventoryProducts()
    const { data: stock = [], isLoading: isStockLoading } = useInventoryStock()
    const { data: purchases = [], isLoading: isPurchasesLoading } = useInventoryPurchases()
    const { data: movements = [], isLoading: isMovementsLoading } = useInventoryStockMovements()

    const inventoryMetrics = useMemo(() => {
        const categorySet = new Set(categories)
        const productIds = new Set(
            products
                .filter((product) => categorySet.has(normalizeInventoryCategory(product.category)))
                .map((product) => product.id)
        )
        const relevantProducts = products.filter((product) => productIds.has(product.id))
        const relevantStock = stock.filter((item) => {
            const category = normalizeInventoryCategory(item.product?.category)
            return categorySet.has(category) || productIds.has(item.productId)
        })
        const relevantPurchases = purchases.filter((purchase) => {
            const category = normalizeInventoryCategory(purchase.product?.category)
            return categorySet.has(category) || productIds.has(purchase.productId)
        })
        const relevantMovements = movements.filter((movement) => {
            const category = normalizeInventoryCategory(movement.product?.category)
            return categorySet.has(category) || productIds.has(movement.productId)
        })
        const lowStock = relevantStock.filter((item) => Number(item.quantity || 0) <= inventoryLowStockThreshold)
        const productCountByCategory = (category: string) =>
            relevantProducts.filter((product) => normalizeInventoryCategory(product.category) === category).length

        return {
            relevantProducts,
            relevantStock,
            relevantPurchases,
            relevantMovements,
            lowStock,
            productCountByCategory
        }
    }, [categories, movements, products, purchases, stock])

    const isLoading = isProductsLoading || isStockLoading || isPurchasesLoading || isMovementsLoading
    const lowStockRows: WorkItem[] = inventoryMetrics.lowStock.slice(0, 4).map((item) => ({
        id: item.product?.name || item.productId,
        name: item.product?.name || 'Inventory item',
        detail: `${getInventoryCategoryLabel(item.product?.category)} stock is ${Number(item.quantity || 0)} / threshold ${inventoryLowStockThreshold}`,
        status: Number(item.quantity || 0) <= 0 ? 'REORDER' : 'LOW_STOCK',
        owner: 'Inventory',
        due: 'Create purchase'
    }))
    const purchaseRows: WorkItem[] = inventoryMetrics.relevantPurchases.slice(0, 3).map((purchase) => ({
        id: purchase.id,
        name: purchase.product?.name || 'Purchase order',
        detail: `${Number(purchase.quantity || 0)} item(s) from ${purchase.vendor || 'vendor'}`,
        status: 'PURCHASED',
        owner: 'Inventory',
        due: formatInventoryDate(purchase.createdAt)
    }))
    const liveRows: WorkItem[] = [
        ...lowStockRows,
        ...purchaseRows,
        ...inventoryMetrics.relevantMovements.slice(0, 3).map((movement) => ({
            id: movement.id,
            name: movement.product?.name || 'Stock movement',
            detail: `${String(movement.movementType).replaceAll('_', ' ')} ${Number(movement.signedQuantity ?? movement.quantity ?? 0)}`,
            status: String(movement.movementType).replaceAll('_', ' '),
            owner: movement.updatedBy || 'Inventory',
            due: formatInventoryDate(movement.createdAt)
        }))
    ]
    const rows = liveRows.length > 0
        ? liveRows.slice(0, 6)
        : [{
            id: 'LIVE-INVENTORY',
            name: 'No inventory action',
            detail: 'No low stock, purchase, or movement record found for this inventory scope',
            status: 'CLEAR',
            owner: 'Inventory',
            due: '-'
        }]

    const monthlyTrend = buildInventoryMonthlyTrend(inventoryMetrics.relevantMovements, inventoryMetrics.lowStock.length)
    const links = mode === 'medical'
        ? [
            { label: 'Medical Assets', href: '/inventory/products/assets' },
            { label: 'Stock', href: '/inventory/stock' },
            { label: 'Stock Issue', href: '/inventory/stock-issue' },
            { label: 'Purchases', href: '/inventory/purchase-orders' },
            { label: 'Movements', href: '/inventory/stock-movements' },
            { label: 'Low Stock', href: '/inventory/low-stock-alerts' }
        ]
        : [
            { label: 'Ration', href: '/inventory/products/ration' },
            { label: 'Stationary', href: '/inventory/products/stationary' },
            { label: 'Electrical', href: '/inventory/products/electrical-plumbing' },
            { label: 'Stock', href: '/inventory/stock' },
            { label: 'Stock Issue', href: '/inventory/stock-issue' },
            { label: 'Movements', href: '/inventory/stock-movements' },
            { label: 'Low Stock', href: '/inventory/low-stock-alerts' }
        ]

    return (
        <DashboardFrame
            title={config.title}
            subtitle={config.subtitle}
            breadcrumbs={config.breadcrumbs}
            links={links}
            metrics={mode === 'medical'
                ? [
                    { label: 'Medical Products', value: isLoading ? '-' : inventoryMetrics.relevantProducts.length, helper: 'Live medical inventory products', icon: ClipboardList },
                    { label: 'Purchase Orders', value: isLoading ? '-' : inventoryMetrics.relevantPurchases.length, helper: 'Live purchase records in this unit', icon: IndianRupee },
                    { label: 'Low Stock', value: isLoading ? '-' : inventoryMetrics.lowStock.length, helper: 'Items at or below reorder threshold', icon: AlertTriangle },
                    { label: 'Stock Updates', value: isLoading ? '-' : inventoryMetrics.relevantMovements.length, helper: 'Live stock movement audit records', icon: Activity }
                ]
                : [
                    { label: 'Stock Items', value: isLoading ? '-' : inventoryMetrics.relevantStock.length, helper: 'Live inventory stock records', icon: ClipboardList },
                    { label: 'Low Stock', value: isLoading ? '-' : inventoryMetrics.lowStock.length, helper: 'Items at or below reorder threshold', icon: AlertTriangle },
                    { label: 'Ration Items', value: isLoading ? '-' : inventoryMetrics.productCountByCategory('ration'), helper: 'Live ration product records', icon: Activity },
                    { label: 'Purchase Orders', value: isLoading ? '-' : inventoryMetrics.relevantPurchases.length, helper: 'Live purchase records in this unit', icon: IndianRupee }
                ]}
            trend={{
                title: config.trendTitle,
                subtitle: 'Real stock movement quantity, current low stock, and completed stock updates by month',
                data: monthlyTrend
            }}
            trendKeys={config.trendKeys}
            split={mode === 'medical'
                ? [
                    { name: 'Medical', value: inventoryMetrics.productCountByCategory('medical') },
                    { name: 'Stock', value: inventoryMetrics.relevantStock.length },
                    { name: 'Purchases', value: inventoryMetrics.relevantPurchases.length },
                    { name: 'Low Stock', value: inventoryMetrics.lowStock.length }
                ]
                : [
                    { name: 'Ration', value: inventoryMetrics.productCountByCategory('ration') },
                    { name: 'Stationary', value: inventoryMetrics.productCountByCategory('stationary') },
                    { name: 'Electrical', value: inventoryMetrics.productCountByCategory('electrical-plumbing') },
                    { name: 'Low Stock', value: inventoryMetrics.lowStock.length }
                ]}
            splitTitle={config.splitTitle}
            splitSubtitle="Live inventory distribution from current product and stock data"
            table={{
                title: config.tableTitle,
                subtitle: liveRows.length ? 'Live stock, purchase, and movement records needing inventory visibility' : 'No live inventory action is pending',
                rows
            }}
            workflowSection={
                <InventoryWorkflowPulse
                    products={inventoryMetrics.relevantProducts.length}
                    stockItems={inventoryMetrics.relevantStock.length}
                    lowStock={inventoryMetrics.lowStock.length}
                    purchases={inventoryMetrics.relevantPurchases.length}
                    movements={inventoryMetrics.relevantMovements.length}
                />
            }
            actionSection={<InventoryActionQueue lowStockRows={lowStockRows} purchaseRows={purchaseRows} />}
        />
    )
}

export const ElderInventoryManagerDashboard = () => <InventoryManagerDashboard mode="elder" />
export function TaskLogCoordinatorDashboard() {
    const { data: allTasks = [], isLoading: isTasksLoading } = useTasks()
    const { data: approvalTasks = [], isLoading: isApprovalLoading } = useApprovalTasks()
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('')

    const taskMetrics = useMemo(() => {
        const dailyTasks = allTasks.filter((task) => String(task.type || 'DAILY').toUpperCase() === 'DAILY')
        const scheduledTasks = allTasks.filter((task) => String(task.type || '').toUpperCase() === 'SCHEDULED')
        const approvalPending = approvalTasks.filter((task) => String(task.status).toUpperCase() === 'COMPLETED')
        const approvedTasks = allTasks.filter((task) => String(task.status).toUpperCase() === 'APPROVED')
        const inProgressTasks = allTasks.filter((task) => String(task.status).toUpperCase() === 'IN_PROGRESS')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueTasks = allTasks.filter((task) => {
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate < today && !['COMPLETED', 'APPROVED', 'REJECTED'].includes(String(task.status).toUpperCase())
        })
        const workflowApprovalPending = timelines.filter((item) => {
            const task = item.stages.find((stage) => stage.key === 'task')
            const approval = item.stages.find((stage) => stage.key === 'approval')
            return Boolean(task?.complete && !approval?.complete)
        })

        return {
            dailyTasks,
            scheduledTasks,
            approvalPending,
            approvedTasks,
            inProgressTasks,
            overdueTasks,
            workflowApprovalPending
        }
    }, [allTasks, approvalTasks, timelines])

    const isLoading = isTasksLoading || isApprovalLoading || isWorkflowLoading
    const liveRows: WorkItem[] = [
        ...taskMetrics.approvalPending.slice(0, 4).map((task) => ({
            id: task.id,
            name: task.title,
            detail: `${task.type || 'DAILY'} task completed by ${task.assignedTo || 'staff'}`,
            status: 'APPROVAL',
            owner: task.assignedBy || 'Task Coordinator',
            due: task.dueDate || 'Review now'
        })),
        ...taskMetrics.overdueTasks.slice(0, 2).map((task) => ({
            id: task.id,
            name: task.title,
            detail: `${task.type || 'DAILY'} task is overdue`,
            status: String(task.status || 'OVERDUE'),
            owner: task.assignedTo || 'Assigned Staff',
            due: task.dueDate || 'Past due'
        })),
        ...taskMetrics.workflowApprovalPending.slice(0, 2).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `${workflow.service} duty completed and waiting approval`,
            status: 'WORKFLOW',
            owner: 'Task Approval',
            due: 'Approve duty'
        }))
    ]
    const rows = liveRows.slice(0, 6)

    return (
        <DashboardFrame
            title={roleDashboards.taskLog.title}
            subtitle={roleDashboards.taskLog.subtitle}
            breadcrumbs={roleDashboards.taskLog.breadcrumbs}
            links={roleDashboards.taskLog.links}
            metrics={[
                {
                    label: 'Daily Tasks',
                    value: isLoading ? '-' : taskMetrics.dailyTasks.length,
                    helper: `${taskMetrics.inProgressTasks.length} currently in progress`,
                    icon: ClipboardList
                },
                {
                    label: 'Scheduled Tasks',
                    value: isLoading ? '-' : taskMetrics.scheduledTasks.length,
                    helper: 'Planned work assigned to staff',
                    icon: CalendarClock
                },
                {
                    label: 'Approvals',
                    value: isLoading ? '-' : taskMetrics.approvalPending.length + taskMetrics.workflowApprovalPending.length,
                    helper: 'Completed tasks waiting coordinator review',
                    icon: ShieldCheck
                },
                {
                    label: 'Overdue',
                    value: isLoading ? '-' : taskMetrics.overdueTasks.length,
                    helper: 'Assigned work past due date',
                    icon: AlertTriangle
                }
            ]}
            trend={{
                title: 'Task Log Movement',
                subtitle: 'Daily tasks, scheduled work, approval queue, and completed duties',
                data: buildCurrentMonthTrend({
                    volume: allTasks.length,
                    pending: taskMetrics.approvalPending.length + taskMetrics.overdueTasks.length,
                    completed: taskMetrics.approvedTasks.length
                })
            }}
            trendKeys={roleDashboards.taskLog.trendKeys}
            split={[
                { name: 'Daily', value: taskMetrics.dailyTasks.length },
                { name: 'Scheduled', value: taskMetrics.scheduledTasks.length },
                { name: 'Approvals', value: taskMetrics.approvalPending.length },
                { name: 'Overdue', value: taskMetrics.overdueTasks.length }
            ]}
            splitTitle="Task Log Split"
            splitSubtitle="Live daily, scheduled, approval, and overdue workload"
            table={{
                title: 'Task Approval Queue',
                subtitle: 'Task log records needing coordinator action',
                rows
            }}
        />
    )
}
export function ElderFinanceManagerDashboard() {
    const { data: uecFinanceData, isLoading } = useUecFinanceDashboard()
    const trendData = uecFinanceData?.trend?.datasets || []

    const activeTrend = trendData.length > 0 ? buildEmptyMonthlyTrend(['volume', 'pending', 'completed']).map((bucket, index) => {
        bucket.volume = trendData[0]?.data?.[index] || 0;
        bucket.pending = trendData[1]?.data?.[index] || 0;
        bucket.completed = trendData[2]?.data?.[index] || 0;
        return bucket;
    }) : buildEmptyMonthlyTrend(['volume', 'pending', 'completed'])

    const volumeCurrent = trendData[0]?.data?.[5] || 0;
    const pendingCurrent = trendData[1]?.data?.[5] || 0;
    const completedCurrent = trendData[2]?.data?.[5] || 0;

    return (
        <DashboardFrame
            title="Elder Finance Dashboard"
            subtitle="UEC in-house expense, care spending, approvals, and elder finance monitoring."
            breadcrumbs={[{ label: 'UEC' }, { label: 'Elder Finance' }, { label: 'Dashboard' }]}
            links={[
                { label: 'In-House Expense', href: '/finance/inhouse-expense' }
            ]}
            metrics={[
                { label: 'Monthly Expense', value: isLoading ? '-' : formatShortMoney(volumeCurrent), helper: 'UEC current period spend', icon: IndianRupee },
                { label: 'Pending Bills', value: isLoading ? '-' : pendingCurrent, helper: 'Bills waiting for review', icon: CalendarClock },
                { label: 'Approved Items', value: isLoading ? '-' : completedCurrent, helper: 'Expense records approved', icon: ShieldCheck },
                { label: 'Variance', value: '0%', helper: 'Expense variance from plan', icon: TrendingUp }
            ]}
            trend={{ title: 'Elder Finance Movement', subtitle: 'Expense volume, pending records, and approved transactions', data: activeTrend }}
            trendKeys={['volume', 'pending', 'completed']}
            split={[
                { name: 'Monthly Expense', value: volumeCurrent },
                { name: 'Pending Bills', value: pendingCurrent },
                { name: 'Approved Items', value: completedCurrent }
            ]}
            splitTitle="Finance Split"
            splitSubtitle="Current period finance distribution"
            table={{
                title: 'Elder Finance Watchlist',
                subtitle: 'Bills and expenses that need finance follow-up',
                rows: []
            }}
        />
    )
}
export const PatientCareManagerDashboard = () => <RoleDashboard config={roleDashboards.patientCare} />
export function CareAllocationManagerDashboard() {
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('')
    const { data: clinicalAllocations = [], isLoading: isClinicalLoading } = useClinicalAllocations()
    const { data: homeCareAllocations = [], isLoading: isHomeLoading } = useHomeCareAllocations()
    const { data: inHouseAllocations = [], isLoading: isInHouseLoading } = useInHouseAllocations()
    const { data: otherAllocations = [], isLoading: isOtherLoading } = useOthersAllocations()

    const allocationMetrics = useMemo(() => {
        const allocations = [...clinicalAllocations, ...homeCareAllocations, ...inHouseAllocations, ...otherAllocations]
        const waitingForAllocation = timelines.filter((item) => {
            const admission = item.stages.find((stage) => stage.key === 'admission')
            const allocation = item.stages.find((stage) => stage.key === 'allocation')
            return Boolean(admission?.complete && !allocation?.complete)
        })
        const dutyPending = timelines.filter((item) => {
            const allocation = item.stages.find((stage) => stage.key === 'allocation')
            const task = item.stages.find((stage) => stage.key === 'task')
            return Boolean(allocation?.complete && !task?.complete)
        })
        const approvalPending = timelines.filter((item) => {
            const task = item.stages.find((stage) => stage.key === 'task')
            const approval = item.stages.find((stage) => stage.key === 'approval')
            return Boolean(task?.complete && !approval?.complete)
        })
        const assignedAllocations = allocations.filter((allocation: any) => allocation.staffId || allocation.staffName !== 'Not Assigned').length

        return {
            allocations,
            waitingForAllocation,
            dutyPending,
            approvalPending,
            assignedAllocations
        }
    }, [clinicalAllocations, homeCareAllocations, inHouseAllocations, otherAllocations, timelines])

    const isLoading = isWorkflowLoading || isClinicalLoading || isHomeLoading || isInHouseLoading || isOtherLoading
    const allocationRows: WorkItem[] = allocationMetrics.allocations
        .filter((allocation: any) => allocation.status === 'Pending' || allocation.staffName === 'Not Assigned' || !allocation.staffId)
        .slice(0, 5)
        .map((allocation: any) => ({
            id: String(allocation.ref || allocation.id),
            name: String(allocation.patient || allocation.clientName || 'Care allocation'),
            detail: `${allocation.service || 'Care service'} - ${allocation.notes || 'staff assignment pending'}`,
            status: String(allocation.status || 'Pending').toUpperCase(),
            owner: String(allocation.staffName || 'Allocation Desk'),
            due: allocation.scheduleText && allocation.scheduleText !== '- - -'
                ? allocation.scheduleText
                : 'Assign staff'
        }))
    const liveRows: WorkItem[] = [
        ...allocationRows,
        ...allocationMetrics.waitingForAllocation.slice(0, 3).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `${workflow.service} - admission handoff waiting for allocation`,
            status: 'PENDING',
            owner: 'Allocation Desk',
            due: 'Create allocation'
        })),
        ...allocationMetrics.dutyPending.slice(0, 3).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `${workflow.service} - staff duty not completed`,
            status: 'DUTY',
            owner: 'Care Allocation',
            due: 'Monitor staff'
        })),
        ...allocationMetrics.approvalPending.slice(0, 2).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `${workflow.service} - completed duty waiting approval`,
            status: 'APPROVAL',
            owner: 'Task Approval',
            due: 'Review duty'
        }))
    ]

    const rows = liveRows.slice(0, 5)

    return (
        <DashboardFrame
            title={roleDashboards.careAllocation.title}
            subtitle={roleDashboards.careAllocation.subtitle}
            breadcrumbs={roleDashboards.careAllocation.breadcrumbs}
            links={roleDashboards.careAllocation.links}
            metrics={[
                {
                    label: 'Waiting Allocation',
                    value: isLoading ? '-' : allocationMetrics.waitingForAllocation.length,
                    helper: 'Admissions not yet moved to care allocation',
                    icon: AlertTriangle
                },
                {
                    label: 'Active Allocations',
                    value: isLoading ? '-' : allocationMetrics.allocations.length,
                    helper: `${allocationMetrics.assignedAllocations} with assigned staff`,
                    icon: HeartPulse
                },
                {
                    label: 'Staff Duty Pending',
                    value: isLoading ? '-' : allocationMetrics.dutyPending.length,
                    helper: 'Allocated care where duty is not completed',
                    icon: Users
                },
                {
                    label: 'Approval Waiting',
                    value: isLoading ? '-' : allocationMetrics.approvalPending.length,
                    helper: 'Completed duty waiting admin approval',
                    icon: ClipboardList
                }
            ]}
            trend={{
                title: 'Allocation Movement',
                subtitle: 'Admission handoff, staff assignment, duty completion, and approval readiness',
                data: buildCurrentMonthTrend({
                    volume: allocationMetrics.allocations.length,
                    pending: allocationMetrics.waitingForAllocation.length + allocationMetrics.dutyPending.length,
                    completed: allocationMetrics.assignedAllocations
                })
            }}
            trendKeys={roleDashboards.careAllocation.trendKeys}
            split={[
                { name: 'Clinical', value: clinicalAllocations.length },
                { name: 'Home', value: homeCareAllocations.length },
                { name: 'In-House', value: inHouseAllocations.length },
                { name: 'Other', value: otherAllocations.length },
                { name: 'Pending', value: allocationMetrics.waitingForAllocation.length }
            ]}
            splitTitle="Care Allocation Split"
            splitSubtitle="Live care allocation distribution"
            table={{
                title: 'Allocation Queue',
                subtitle: 'Care allocation records needing manager action',
                rows
            }}
        />
    )
}
export const MedicalInventoryManagerDashboard = () => <InventoryManagerDashboard mode="medical" />
export const AmbulanceBookingCoordinatorDashboard = () => <RoleDashboard config={roleDashboards.ambulanceBooking} />
export const DispatchManagerDashboard = () => <RoleDashboard config={roleDashboards.dispatch} />
export const FleetManagerDashboard = () => <RoleDashboard config={roleDashboards.fleet} />
export const AmbulanceBillingManagerDashboard = () => <RoleDashboard config={roleDashboards.ambulanceBilling} />

const getEnquiryFollowUpStatus = (enquiry: any) =>
    String(enquiry.lastFollowUpStatus || enquiry.nextFollowupStatus || enquiry.nextFollowUpStatus || enquiry.status || '').toLowerCase()

const getEnquiryFollowUpDate = (enquiry: any) =>
    enquiry.lastFollowUp || enquiry.followUpDate || enquiry.nextFollowUpDate || enquiry.nextDate || null

export function FollowUpCoordinatorDashboard() {
    const { data: enquiries = [], isLoading: isEnquiriesLoading } = useEnquiries()
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('')

    const followUpMetrics = useMemo(() => {
        const activeEnquiries = enquiries.filter((enquiry: any) => !['Closed', 'Converted', 'CLOSED', 'Lost'].includes(String(enquiry.status)))
        const followUpDue = enquiries.filter((enquiry: any) => {
            const status = String(enquiry.status || '').toLowerCase()
            const followUpStatus = getEnquiryFollowUpStatus(enquiry)
            return status === 'in progress'
                || followUpStatus.includes('follow')
                || followUpStatus.includes('call')
                || followUpStatus.includes('renewal')
                || Boolean(getEnquiryFollowUpDate(enquiry))
        })
        const overdueFollowUps = followUpDue.filter((enquiry: any) => {
            const rawDate = getEnquiryFollowUpDate(enquiry)
            if (!rawDate) return false
            const followUpDate = new Date(rawDate)
            if (Number.isNaN(followUpDate.getTime())) return false
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            followUpDate.setHours(0, 0, 0, 0)
            return followUpDate < today
        })
        const renewalFollowUps = timelines.filter((item) => item.renewal?.followUpId)
        const callLaterRenewals = renewalFollowUps.filter((item) => String(item.renewal?.outcome || '').toLowerCase().includes('call later'))
        const convertedRenewals = renewalFollowUps.filter((item) => item.renewal?.convertedEnquiryRefNo)
        const welcomeOrFeedback = timelines.filter((item) => (
            item.openItems.some((openItem) => /welcome|feedback|customer/i.test(openItem))
            || item.closure?.feedbackStatus === 'PENDING'
        ))

        return {
            activeEnquiries,
            followUpDue,
            overdueFollowUps,
            renewalFollowUps,
            callLaterRenewals,
            convertedRenewals,
            welcomeOrFeedback
        }
    }, [enquiries, timelines])

    const isLoading = isEnquiriesLoading || isWorkflowLoading
    const liveRows: WorkItem[] = [
        ...followUpMetrics.callLaterRenewals.slice(0, 3).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: workflow.renewal?.notes || `${workflow.service} renewal call scheduled`,
            status: 'CALL LATER',
            owner: 'Follow-up Desk',
            due: workflow.renewal?.scheduledAt ? new Date(workflow.renewal.scheduledAt).toLocaleDateString() : 'Next call'
        })),
        ...followUpMetrics.convertedRenewals.slice(0, 2).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `Converted to new enquiry ${workflow.renewal?.convertedEnquiryRefNo}`,
            status: 'CONVERTED',
            owner: 'Enquiry Desk',
            due: 'Monitor lead'
        })),
        ...followUpMetrics.followUpDue.slice(0, 3).map((enquiry: any) => ({
            id: String(enquiry.refNo || enquiry.id),
            name: String(enquiry.clientName || enquiry.name || enquiry.patientName || 'Client'),
            detail: String(enquiry.service || enquiry.description || enquiry.comments || 'Enquiry follow-up required'),
            status: String(enquiry.lastFollowUpStatus || enquiry.status || 'FOLLOW_UP'),
            owner: String(enquiry.lastFollowedBy || enquiry.assignedStaff || enquiry.staffName || 'Follow-up Desk'),
            due: String(getEnquiryFollowUpDate(enquiry) || 'Today')
        }))
    ]
    const rows = liveRows.slice(0, 6)

    return (
        <DashboardFrame
            title={roleDashboards.followUp.title}
            subtitle={roleDashboards.followUp.subtitle}
            breadcrumbs={roleDashboards.followUp.breadcrumbs}
            links={roleDashboards.followUp.links}
            metrics={[
                {
                    label: 'Follow-ups Due',
                    value: isLoading ? '-' : followUpMetrics.followUpDue.length + followUpMetrics.callLaterRenewals.length,
                    helper: 'Active enquiry and renewal calls needing action',
                    icon: CalendarClock
                },
                {
                    label: 'Overdue',
                    value: isLoading ? '-' : followUpMetrics.overdueFollowUps.length,
                    helper: 'Delayed enquiry follow-ups',
                    icon: AlertTriangle
                },
                {
                    label: 'Renewal Calls',
                    value: isLoading ? '-' : followUpMetrics.renewalFollowUps.length,
                    helper: `${followUpMetrics.convertedRenewals.length} converted to new enquiry`,
                    icon: PhoneCall
                },
                {
                    label: 'Customer Handoff',
                    value: isLoading ? '-' : followUpMetrics.welcomeOrFeedback.length,
                    helper: 'Welcome call, feedback, or customer care items',
                    icon: ShieldCheck
                }
            ]}
            trend={{
                title: 'Follow-up Movement',
                subtitle: 'Enquiry follow-ups, renewal callbacks, and converted renewal leads',
                data: buildCurrentMonthTrend({
                    volume: followUpMetrics.activeEnquiries.length,
                    pending: followUpMetrics.followUpDue.length + followUpMetrics.callLaterRenewals.length,
                    completed: followUpMetrics.convertedRenewals.length
                })
            }}
            trendKeys={roleDashboards.followUp.trendKeys}
            split={[
                { name: 'Enquiry', value: followUpMetrics.followUpDue.length },
                { name: 'Call Later', value: followUpMetrics.callLaterRenewals.length },
                { name: 'Converted', value: followUpMetrics.convertedRenewals.length },
                { name: 'Customer Care', value: followUpMetrics.welcomeOrFeedback.length }
            ]}
            splitTitle="Follow-up Split"
            splitSubtitle="Live follow-up workload by source"
            table={{
                title: 'Follow-up Queue',
                subtitle: 'Enquiry and renewal follow-ups needing coordinator action',
                rows
            }}
        />
    )
}
export function CustomerRelationsManagerDashboard() {
    const canReadAllUnits = useAuthStore((state) => state.user?.unitAccess?.includes('*') || false)
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('')
    const { data: complaints = [], isLoading: isComplaintsLoading } = useComplaints()
    const { data: serviceHistory = [], isLoading: isServiceHistoryLoading } = useQuery({
        queryKey: ['customer-care', 'service-history', canReadAllUnits ? 'all' : 'unit'],
        queryFn: () => customerCareService.getServiceHistory(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    })
    const { data: pendingFeedback = [], isLoading: isPendingFeedbackLoading } = useQuery({
        queryKey: ['customer-care', 'pending-feedback', canReadAllUnits ? 'all' : 'unit'],
        queryFn: () => customerCareService.getPendingFeedback(canReadAllUnits ? { scope: 'all' } : undefined),
        retry: false
    })

    const customerMetrics = useMemo(() => {
        const feedbackCompleted = serviceHistory.filter((row: any) => Number(row.feedbackRating || row.rating || 0) > 0).length
        const openComplaints = complaints.filter((row: any) => !['Resolved', 'Closed'].includes(String(row.status))).length
        const renewalFollowUps = timelines.filter((item) => item.renewal?.followUpId).length
        const convertedRenewals = timelines.filter((item) => item.renewal?.convertedEnquiryRefNo).length
        const callLaterRenewals = timelines.filter((item) => String(item.renewal?.outcome || '').toLowerCase().includes('call later')).length
        const liveCases = serviceHistory.length || timelines.filter((item) => item.stages.some((stage) => stage.key === 'payment' && stage.complete)).length

        return {
            liveCases,
            pendingFeedback: pendingFeedback.length,
            feedbackCompleted,
            openComplaints,
            renewalFollowUps,
            convertedRenewals,
            callLaterRenewals
        }
    }, [complaints, pendingFeedback.length, serviceHistory, timelines])

    const isLoading = isWorkflowLoading || isComplaintsLoading || isServiceHistoryLoading || isPendingFeedbackLoading
    const watchlistRows: WorkItem[] = [
        ...pendingFeedback.slice(0, 3).map((row: any) => ({
            id: String(row.allocationRef || row.allocationId || row.id || 'FB'),
            name: String(row.clientName || row.client || 'Pending Feedback'),
            detail: String(row.service || row.invoiceNo || 'Service feedback not closed'),
            status: 'PENDING',
            owner: 'Feedback Desk',
            due: 'Collect feedback'
        })),
        ...complaints
            .filter((row: any) => !['Resolved', 'Closed'].includes(String(row.status)))
            .slice(0, 2)
            .map((row: any) => ({
                id: String(row.ticketNo || row.id),
                name: String(row.clientName || 'Complaint Review'),
                detail: String(row.description || row.category || 'Complaint needs action'),
                status: String(row.status || 'OPEN'),
                owner: String(row.assignedTo || 'Customer Care'),
                due: String(row.priority || 'Today')
            }))
    ]

    const rows = watchlistRows.slice(0, 5)

    return (
        <DashboardFrame
            title={roleDashboards.customerRelations.title}
            subtitle={roleDashboards.customerRelations.subtitle}
            breadcrumbs={roleDashboards.customerRelations.breadcrumbs}
            links={roleDashboards.customerRelations.links}
            metrics={[
                {
                    label: 'Paid Services',
                    value: isLoading ? '-' : customerMetrics.liveCases,
                    helper: 'Completed payments ready for care closure',
                    icon: Headset
                },
                {
                    label: 'Pending Feedback',
                    value: isLoading ? '-' : customerMetrics.pendingFeedback,
                    helper: 'Paid services waiting for feedback',
                    icon: ClipboardList
                },
                {
                    label: 'Open Complaints',
                    value: isLoading ? '-' : customerMetrics.openComplaints,
                    helper: `${customerMetrics.feedbackCompleted} feedback records completed`,
                    icon: AlertTriangle
                },
                {
                    label: 'Renewal Follow-ups',
                    value: isLoading ? '-' : customerMetrics.renewalFollowUps,
                    helper: `${customerMetrics.convertedRenewals} converted, ${customerMetrics.callLaterRenewals} call later`,
                    icon: ShieldCheck
                }
            ]}
            trend={{
                title: 'Customer Relations Movement',
                subtitle: 'Service closure, pending feedback, and renewal follow-up trend',
                data: buildCurrentMonthTrend({
                    volume: customerMetrics.liveCases,
                    pending: customerMetrics.pendingFeedback + customerMetrics.openComplaints,
                    completed: customerMetrics.feedbackCompleted
                })
            }}
            trendKeys={roleDashboards.customerRelations.trendKeys}
            split={[
                { name: 'Paid Services', value: customerMetrics.liveCases },
                { name: 'Feedback', value: customerMetrics.pendingFeedback },
                { name: 'Complaints', value: customerMetrics.openComplaints },
                { name: 'Renewals', value: customerMetrics.renewalFollowUps }
            ]}
            splitTitle="Customer Work Split"
            splitSubtitle="Live customer relations workload"
            table={{
                title: 'Customer Relations Watchlist',
                subtitle: 'Feedback, complaint, and renewal items needing manager attention',
                rows
            }}
        />
    )
}
export const OmnichannelCoordinatorDashboard = () => <RoleDashboard config={roleDashboards.omnichannel} />
export function AdmissionsCoordinatorDashboard() {
    const { data: timelines = [], isLoading: isWorkflowLoading } = useWorkflowTimelines('')
    const { data: admissions = [], isLoading: isAdmissionsLoading } = useAdmissions()
    const { data: enquiries = [], isLoading: isEnquiriesLoading } = useEnquiries()

    const admissionMetrics = useMemo(() => {
        const convertedEnquiries = enquiries.filter((row: any) => row.status === 'Converted' || row.admissionId).length
        const admissionsCreated = admissions.length
        const convertedPendingAdmission = Math.max(0, convertedEnquiries - admissionsCreated)
        const admissionNoAllocation = timelines.filter((item) => {
            const admission = item.stages.find((stage) => stage.key === 'admission')
            const allocation = item.stages.find((stage) => stage.key === 'allocation')
            return Boolean(admission?.complete && !allocation?.complete)
        })
        const formsPending = admissions.filter((row: any) => !row.patientAge || !row.patientGender || !row.clientAddress).length
        const clientsReadyForAllocation = Math.max(0, admissionsCreated - admissionNoAllocation.length)

        return {
            convertedEnquiries,
            admissionsCreated,
            convertedPendingAdmission,
            admissionNoAllocation,
            formsPending,
            clientsReadyForAllocation
        }
    }, [admissions, enquiries, timelines])

    const isLoading = isWorkflowLoading || isAdmissionsLoading || isEnquiriesLoading
    const liveRows: WorkItem[] = [
        ...admissionMetrics.admissionNoAllocation.slice(0, 4).map((workflow) => ({
            id: workflow.refNo,
            name: workflow.clientName,
            detail: `${workflow.service} - admission created, allocation pending`,
            status: 'ALLOCATION',
            owner: 'Admissions',
            due: 'Move to allocation'
        })),
        ...admissions
            .filter((row: any) => !row.patientAge || !row.patientGender || !row.clientAddress)
            .slice(0, 2)
            .map((row: any) => ({
                id: String(row.refNo || row.id),
                name: String(row.clientName || row.patientName || 'Admission'),
                detail: `${row.service || 'Service'} - form details pending`,
                status: 'DOCUMENTS',
                owner: 'Admissions',
                due: 'Complete form'
            }))
    ]

    const rows = liveRows.slice(0, 5)

    return (
        <DashboardFrame
            title={roleDashboards.admissions.title}
            subtitle={roleDashboards.admissions.subtitle}
            breadcrumbs={roleDashboards.admissions.breadcrumbs}
            links={roleDashboards.admissions.links}
            metrics={[
                {
                    label: 'Admissions Created',
                    value: isLoading ? '-' : admissionMetrics.admissionsCreated,
                    helper: 'Enquiries moved into admission tracking',
                    icon: ClipboardList
                },
                {
                    label: 'Forms Pending',
                    value: isLoading ? '-' : admissionMetrics.formsPending,
                    helper: 'Admission details missing patient or address data',
                    icon: AlertTriangle
                },
                {
                    label: 'Ready For Allocation',
                    value: isLoading ? '-' : admissionMetrics.clientsReadyForAllocation,
                    helper: 'Admissions that can move to care allocation',
                    icon: Users
                },
                {
                    label: 'Converted Leads',
                    value: isLoading ? '-' : admissionMetrics.convertedEnquiries,
                    helper: `${admissionMetrics.convertedPendingAdmission} converted enquiries need admission check`,
                    icon: ShieldCheck
                }
            ]}
            trend={{
                title: 'Admission Movement',
                subtitle: 'Converted enquiries, admission forms, and allocation readiness',
                data: buildCurrentMonthTrend({
                    volume: admissionMetrics.admissionsCreated,
                    pending: admissionMetrics.formsPending + admissionMetrics.admissionNoAllocation.length,
                    completed: admissionMetrics.clientsReadyForAllocation
                })
            }}
            trendKeys={roleDashboards.admissions.trendKeys}
            split={[
                { name: 'Admissions', value: admissionMetrics.admissionsCreated },
                { name: 'Forms', value: admissionMetrics.formsPending },
                { name: 'Allocation', value: admissionMetrics.admissionNoAllocation.length },
                { name: 'Converted', value: admissionMetrics.convertedEnquiries }
            ]}
            splitTitle="Admission Split"
            splitSubtitle="Live admission pipeline state"
            table={{
                title: 'Admission Watchlist',
                subtitle: 'Admission records needing coordinator action',
                rows
            }}
        />
    )
}
