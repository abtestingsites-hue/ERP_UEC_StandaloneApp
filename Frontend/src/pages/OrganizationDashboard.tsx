// @ts-nocheck
import { Activity, AlertCircle, ClipboardCheck, IndianRupee, Mail, Megaphone, MessageSquare, RefreshCw, Target, TrendingUp, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { SkeletonLoader } from '../components/SkeletonLoader'
import { useOrganizationDashboard } from '../hooks/useOrganizationDashboard'
import type { OrganizationDashboardData, OrganizationKPI } from '../services/organizationDashboardService'

const orgFallbacks = {
    uncf: { code: 'UNCF', title: 'UNCF Dashboard', subtitle: 'Foundation-wide administration, finance, HR, security, CMS, and profile monitoring.' },
    uec: { code: 'UEC', title: 'UEC Dashboard', subtitle: 'Elder care overview and operations monitoring.' },
    uhc: { code: 'UHC', title: 'UHC Dashboard', subtitle: 'Healthcare overview and patient monitoring.' },
    ua: { code: 'UA', title: 'UA Dashboard', subtitle: 'Ambulance operations and service monitoring.' },
    ueo: { code: 'UEO', title: 'UEO Dashboard', subtitle: 'Enquiry office and customer relations monitoring.' }
}

const fallbackDashboards: Record<string, OrganizationDashboardData> = {
    UNCF: {
        ...orgFallbacks.uncf,
        accent: '#0F969C',
        kpis: [
            { label: 'Active Enquiries', value: 0, tone: 'teal' },
            { label: 'Critical Patients', value: 0, tone: 'rose' },
            { label: 'Low Stock Alerts', value: 0, tone: 'amber' },
            { label: 'Pending Payments', value: 0, tone: 'green' },
            { label: 'Total Income', value: 0, format: 'currency', tone: 'teal' },
            { label: 'Schedule Tasks', value: 0, tone: 'blue' },
            { label: 'Complaints', value: 0, tone: 'violet' },
            { label: 'Recent Activities', value: 0, tone: 'orange' }
        ],
        trend: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((name) => ({ name, enquiries: 0, income: 0, tasks: 0 })),
        taskStatus: [{ name: 'No Tasks', value: 1 }],
        activities: []
    },
    UEC: {
        ...orgFallbacks.uec,
        accent: '#0F969C',
        kpis: [
            { label: 'Active Residents', value: 0, tone: 'teal' },
            { label: 'In-House Care', value: 0, tone: 'blue' },
            { label: 'Daily Tasks', value: 0, tone: 'green' },
            { label: 'Pending Tasks', value: 0, tone: 'amber' },
            { label: 'Revenue', value: 0, format: 'currency', tone: 'teal' },
            { label: 'Laundry Open', value: 0, tone: 'violet' },
            { label: 'Maintenance Open', value: 0, tone: 'rose' },
            { label: 'Low Stock', value: 0, tone: 'amber' }
        ],
        trend: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((name) => ({ name, residents: 0, tasks: 0, revenue: 0 })),
        taskStatus: [{ name: 'No Tasks', value: 1 }],
        activities: []
    },
    UHC: {
        ...orgFallbacks.uhc,
        accent: '#294D61',
        kpis: [
            { label: 'Patients', value: 0, tone: 'blue' },
            { label: 'Active Admissions', value: 0, tone: 'green' },
            { label: 'Critical Vitals', value: 0, tone: 'rose' },
            { label: 'Medical Assignments', value: 0, tone: 'teal' },
            { label: 'Medications', value: 0, tone: 'violet' },
            { label: 'Nutrition Plans', value: 0, tone: 'amber' },
            { label: 'Clinical Care', value: 0, tone: 'blue' },
            { label: 'Pending Approvals', value: 0, tone: 'amber' }
        ],
        trend: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((name) => ({ name, patients: 0, vitals: 0, assignments: 0 })),
        taskStatus: [{ name: 'No Tasks', value: 1 }],
        activities: []
    },
    UA: {
        ...orgFallbacks.ua,
        accent: '#0C7075',
        kpis: [
            { label: 'Bookings', value: 0, tone: 'orange' },
            { label: 'Dispatch Active', value: 0, tone: 'blue' },
            { label: 'Field Duty', value: 0, tone: 'teal' },
            { label: 'Emergency Calls', value: 0, tone: 'rose' },
            { label: 'Missed Calls', value: 0, tone: 'amber' },
            { label: 'Billing', value: 0, format: 'currency', tone: 'green' },
            { label: 'Maintenance', value: 0, tone: 'violet' },
            { label: 'Active Staff', value: 0, tone: 'blue' }
        ],
        trend: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((name) => ({ name, calls: 0, bookings: 0, billing: 0 })),
        taskStatus: [{ name: 'No Tasks', value: 1 }],
        activities: []
    },
    UEO: {
        ...orgFallbacks.ueo,
        accent: '#0F969C',
        kpis: [
            { label: 'Active Enquiries', value: 0, tone: 'teal' },
            { label: 'New Leads', value: 0, tone: 'blue' },
            { label: 'Follow-ups', value: 0, tone: 'amber' },
            { label: 'Admissions', value: 0, tone: 'green' },
            { label: 'Complaints', value: 0, tone: 'rose' },
            { label: 'Feedbacks', value: 0, tone: 'violet' },
            { label: 'Conversations', value: 0, tone: 'blue' },
            { label: 'Missed Calls', value: 0, tone: 'amber' }
        ],
        trend: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((name) => ({ name, enquiries: 0, followups: 0, complaints: 0 })),
        taskStatus: [{ name: 'No Tasks', value: 1 }],
        activities: []
    }
}

const mergeDashboardData = (fallback: OrganizationDashboardData, data?: OrganizationDashboardData) => ({
    ...fallback,
    ...data,
    kpis: data?.kpis?.length ? data.kpis : fallback.kpis,
    trend: data?.trend?.length ? data.trend : fallback.trend,
    taskStatus: data?.taskStatus?.length ? data.taskStatus : fallback.taskStatus,
    activities: data?.activities || fallback.activities
})

const toneStyles: Record<string, { bg: string; text: string; icon: string }> = {
    teal: { bg: 'bg-primary-50', text: 'text-primary-700', icon: 'bg-primary-500' },
    blue: { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'bg-sky-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'bg-rose-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-500' }
}

const formatValue = (kpi: OrganizationKPI) => {
    if (kpi.format === 'currency') {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(kpi.value || 0)
    }

    return new Intl.NumberFormat('en-IN').format(kpi.value || 0)
}

function UncfStandaloneLauncherCard() {
    const uncfUrl = import.meta.env.VITE_UNCF_APP_URL || ''

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="UNCF Donations & Funding Domain"
                subtitle="UNCF operates as an independent standalone domain application connected to the shared ERP Backend."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Standalone Application' }]}
            />

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Standalone Application Active
                    </span>

                    <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                        UNCF Donations & Funding Hub
                    </h2>

                    <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                        All donation processing, 80G receipt generation, project budgeting, funding allocations, donor directory management, and expenditure approvals are managed in the dedicated UNCF standalone application.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4">
                        <a
                            href={uncfUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0F969C] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0c7a7f] transition-all"
                        >
                            Open UNCF Application
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <h3 className="font-bold text-slate-900 text-sm">Donation & Receipt Desk</h3>
                            <p className="mt-1 text-xs text-slate-500">Record cash/online donations, generate PDF receipts with 80G tax deductions.</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <h3 className="font-bold text-slate-900 text-sm">Project & Funding Allocations</h3>
                            <p className="mt-1 text-xs text-slate-500">Track project budgets, assign collected funds, approve project expenditures.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ kpi, index }: { kpi: OrganizationKPI; index: number }) {
    const Icon = kpi.format === 'currency' ? IndianRupee : index % 3 === 0 ? Activity : index % 3 === 1 ? ClipboardCheck : TrendingUp
    const tone = toneStyles[kpi.tone] || toneStyles.teal

    return (
        <div className="min-h-[120px] rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-black">
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.bg}`}>
                    <Icon className={`h-5 w-5 ${tone.text}`} />
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${tone.icon}`} />
            </div>
            <p className="mt-4 text-2xl font-extrabold leading-none text-gray-950 dark:text-gray-100">{formatValue(kpi)}</p>
            <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400">{kpi.label}</p>
        </div>
    )
}

export function OrganizationDashboard() {
    const params = useParams()
    const routeOrg = (params.org || 'uncf').toLowerCase() as keyof typeof orgFallbacks
    if (routeOrg === 'uncf') return <UncfStandaloneLauncherCard />

    return <OrganizationAnalyticsDashboard routeOrg={routeOrg} />
}


const findKpi = (dashboard: OrganizationDashboardData, label: string) =>
    dashboard.kpis.find((kpi) => kpi.label.toLowerCase() === label.toLowerCase())?.value || 0

const getOrgFocus = (dashboard: OrganizationDashboardData) => {
    const code = dashboard.code

    if (code === 'UEC') {
        return [
            { title: 'Care Operations', detail: `${findKpi(dashboard, 'Active Residents')} residents, ${findKpi(dashboard, 'Daily Tasks')} daily tasks`, status: findKpi(dashboard, 'Pending Tasks') > 0 ? 'Pending attention' : 'Stable', tone: 'text-primary-700 bg-primary-50' },
            { title: 'Facility Readiness', detail: `${findKpi(dashboard, 'Laundry Open')} laundry and ${findKpi(dashboard, 'Maintenance Open')} maintenance items open`, status: 'Housekeeping view', tone: 'text-amber-700 bg-amber-50' },
            { title: 'Stock Watch', detail: `${findKpi(dashboard, 'Low Stock')} low-stock items need review`, status: findKpi(dashboard, 'Low Stock') > 0 ? 'Reorder required' : 'No alert', tone: 'text-rose-700 bg-rose-50' }
        ]
    }

    if (code === 'UHC') {
        return [
            { title: 'Patient Safety', detail: `${findKpi(dashboard, 'Critical Vitals')} critical vitals from ${findKpi(dashboard, 'Patients')} patients`, status: findKpi(dashboard, 'Critical Vitals') > 0 ? 'Clinical review' : 'No critical alert', tone: 'text-rose-700 bg-rose-50' },
            { title: 'Care Workload', detail: `${findKpi(dashboard, 'Medical Assignments')} assignments and ${findKpi(dashboard, 'Medications')} medications`, status: 'Nursing queue', tone: 'text-sky-700 bg-sky-50' },
            { title: 'Approvals', detail: `${findKpi(dashboard, 'Pending Approvals')} approvals waiting`, status: findKpi(dashboard, 'Pending Approvals') > 0 ? 'Admin action' : 'Clear', tone: 'text-amber-700 bg-amber-50' }
        ]
    }

    if (code === 'UA') {
        return [
            { title: 'Dispatch Control', detail: `${findKpi(dashboard, 'Bookings')} bookings and ${findKpi(dashboard, 'Dispatch Active')} active dispatches`, status: 'Live operations', tone: 'text-orange-700 bg-orange-50' },
            { title: 'Emergency Queue', detail: `${findKpi(dashboard, 'Emergency Calls')} inbound calls, ${findKpi(dashboard, 'Missed Calls')} missed`, status: findKpi(dashboard, 'Missed Calls') > 0 ? 'Call back needed' : 'Queue clear', tone: 'text-rose-700 bg-rose-50' },
            { title: 'Fleet Support', detail: `${findKpi(dashboard, 'Maintenance')} maintenance items and ${findKpi(dashboard, 'Active Staff')} available staff`, status: 'Resource check', tone: 'text-sky-700 bg-sky-50' }
        ]
    }

    return [
        { title: 'Lead Intake', detail: `${findKpi(dashboard, 'New Leads')} new leads, ${findKpi(dashboard, 'Active Enquiries')} active enquiries`, status: 'CRM queue', tone: 'text-primary-700 bg-primary-50' },
        { title: 'Follow-up Discipline', detail: `${findKpi(dashboard, 'Follow-ups')} follow-ups and ${findKpi(dashboard, 'Admissions')} admissions`, status: findKpi(dashboard, 'Follow-ups') > 0 ? 'Staff action' : 'No pending follow-up', tone: 'text-amber-700 bg-amber-50' },
        { title: 'Customer Signals', detail: `${findKpi(dashboard, 'Complaints')} complaints, ${findKpi(dashboard, 'Missed Calls')} missed calls`, status: findKpi(dashboard, 'Complaints') > 0 || findKpi(dashboard, 'Missed Calls') > 0 ? 'Resolve today' : 'Stable', tone: 'text-rose-700 bg-rose-50' }
    ]
}

const getMonthSummary = (dashboard: OrganizationDashboardData) => {
    const current = dashboard.trend[dashboard.trend.length - 1]
    if (!current) return []

    return Object.entries(current)
        .filter(([key]) => key !== 'name')
        .slice(0, 3)
        .map(([key, value]) => ({ label: key, value }))
}

function FocusPanel({ title, detail, status, tone }: { title: string; detail: string; status: string; tone: string }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${tone}`}>{status}</div>
            <h3 className="mt-4 text-lg font-extrabold text-gray-950 dark:text-gray-100">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">{detail}</p>
        </div>
    )
}

function TaskStatusPanel({ tasks }: { tasks: Array<{ name: string; value: number }> }) {
    const total = tasks.reduce((sum, task) => sum + task.value, 0)
    return (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">Workload Status</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Live task split from current records</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-primary-500" />
            </div>
            <div className="mt-4 space-y-3">
                {tasks.map((task) => {
                    const width = total > 0 ? Math.max(6, Math.round((task.value / total) * 100)) : 0
                    return (
                        <div key={task.name}>
                            <div className="mb-1 flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                                <span>{task.name}</span>
                                <span>{task.value}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                <div className="h-full rounded-full bg-primary-500" style={{ width: `${width}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function MonthSnapshot({ items }: { items: Array<{ label: string; value: string | number }> }) {
    return (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">Current Month Snapshot</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Compact trend readout without heavy charts</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {items.map((item) => (
                    <div key={item.label} className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
                        <p className="mt-2 text-2xl font-extrabold text-gray-950 dark:text-gray-100">{typeof item.value === 'number' ? new Intl.NumberFormat('en-IN').format(item.value) : item.value}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function OrganizationAnalyticsDashboard({ routeOrg }: { routeOrg: keyof typeof orgFallbacks }) {
    const fallback = orgFallbacks[routeOrg] || orgFallbacks.uncf
    const { data, isLoading, isError, refetch, isFetching } = useOrganizationDashboard(fallback.code)
    const dashboard = mergeDashboardData(fallbackDashboards[fallback.code], data)
    const focusItems = getOrgFocus(dashboard)
    const monthSummary = getMonthSummary(dashboard)

    if (isLoading) return <SkeletonLoader />

    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <PageHeader
                    title={dashboard.title}
                    subtitle={dashboard.subtitle}
                    breadcrumbs={[{ label: dashboard.code }, { label: 'Dashboard' }]}
                />
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 sm:w-auto dark:border-white/10 dark:bg-black dark:text-gray-100"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {isError && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Live organization analytics could not be loaded. Showing an empty dashboard shell.
                </div>
            )}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
                {dashboard.kpis.map((kpi, index) => <KpiCard key={kpi.label} kpi={kpi} index={index} />)}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {focusItems.map((item) => <FocusPanel key={item.title} {...item} />)}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.42fr)_minmax(0,0.58fr)]">
                <div className="space-y-4">
                    <TaskStatusPanel tasks={dashboard.taskStatus} />
                    {monthSummary.length > 0 && <MonthSnapshot items={monthSummary} />}
                </div>

                <div className="min-h-[300px] rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-gray-100">Recent Activity</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest workflow updates from the database</p>
                    <div className="mt-4 space-y-3">
                        {dashboard.activities.length > 0 ? dashboard.activities.map((activity) => (
                            <div key={activity.id} className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dashboard.accent }} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-extrabold text-gray-900 dark:text-gray-100">{activity.title}</p>
                                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm font-bold text-gray-400 dark:border-white/10">
                                No recent activity found
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}



