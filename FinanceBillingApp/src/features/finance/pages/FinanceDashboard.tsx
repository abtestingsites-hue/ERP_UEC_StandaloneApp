import { useMemo } from 'react'
import type { ReactNode } from 'react'
import {
    ArrowRight,
    CalendarClock,
    ClipboardList,
    IndianRupee,
    ShieldCheck,
    TrendingUp
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../../../components/PageHeader'
import { useWorkflowTimelines } from '../../workflow/services/workflowTimeline'
import { getRoleWorkflowActionItems } from '../../workflow/utils/actionQueue'
import { useCashbox, useInvoices } from '../../accounts/hooks/useAccounts'
import { useAuthStore } from '../../../store/authStore'

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

const colors = ['#0F969C', '#294D61', '#6DA5C0', '#0C7075', '#072E33', '#8BC7DC']

const formatShortMoney = (amount: number) => {
    if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`
    if (amount >= 1000) return `Rs ${Math.round(amount / 1000)}k`
    return `Rs ${Math.round(amount)}`
}

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

function MetricCard({ metric }: { metric: Metric }) {
    const Icon = metric.icon
    return (
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F969C]/10 text-[#0F969C]">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#0F969C]" />
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-extrabold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-100"
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
        <div className="min-h-[340px] rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">{title}</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-[#0F969C]" />
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
        <div className="min-h-[340px] rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
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
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
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
                                    <span className="rounded-full bg-[#0F969C]/10 px-3 py-1 text-xs font-extrabold text-[#0C7A7E]">{row.status}</span>
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
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#0F969C]">Operational Workflow</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Live workflow reflection</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Enquiry to payment movement visible from the workflow timeline.
                    </p>
                </div>
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
                <div className="rounded-lg bg-[#0F969C]/10 px-3 py-3">
                    <p className="text-xl font-extrabold text-primary-800">Rs {isLoading ? '-' : metrics.paidAmount.toFixed(2)}</p>
                    <p className="text-xs font-bold text-[#0C7A7E]">Collected</p>
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
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#0F969C]">My Action Queue</p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-950 dark:text-gray-100">Role-based workflow actions</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Only workflow items that match this user role are shown here.
                    </p>
                </div>
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
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-primary-200 hover:bg-[#0F969C]/10"
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
                        <p className="mt-2 text-xs font-bold text-[#0C7A7E]">
                            {action.workflowRef} - {action.clientName} - {action.owner}
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

export function FinanceDashboard() {
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
            breadcrumbs={[{ label: 'Finance' }, { label: 'Dashboard' }]}
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
