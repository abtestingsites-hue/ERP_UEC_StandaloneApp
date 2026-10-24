import { useState } from 'react'
import { Activity, AlertTriangle, Boxes, CheckCircle2, ClipboardList, FileText, IndianRupee, MessageSquare, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useEnquiries, useAdmissions } from '../features/enquiry/hooks/useEnquiry'
import { useClinicalAllocations, useHomeCareAllocations, useInHouseAllocations, useOthersAllocations } from '../features/allocation/hooks/useAllocation'
import { useInvoices, useCashbox } from '../features/accounts/hooks/useAccounts'
import { useComplaints } from '../features/customer_care/hooks/useCustomerCare'
import { useApprovalTasks, useTasks } from '../features/task_log/hooks/useTasks'
import { useInventoryProducts, useInventoryPurchases, useInventoryStock, useInventoryStockIssueRequests, useInventoryStockMovements } from '../features/inventory/hooks/useInventory'
import { useWorkflowTimelines } from '../features/workflow/services/workflowTimeline'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const asArray = <T,>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : []

const getNumber = (value: unknown) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

const getText = (item: any, keys: string[]) => {
    for (const key of keys) {
        const value = key.split('.').reduce((current, part) => current?.[part], item)
        if (value !== undefined && value !== null && String(value).trim()) return String(value)
    }
    return ''
}

const isDemoLike = (item: any) => {
    const text = [
        getText(item, ['refNo', 'enquiry.refNo', 'clientRefNo', 'invoiceNo', 'sku', 'name', 'clientName', 'patientName', 'title']),
        getText(item, ['id', 'allocationId', 'taskId'])
    ].join(' ').toUpperCase()

    return text.includes('DEMO') || text.includes('SEED')
}

const isClosedStatus = (value: unknown) => ['COMPLETED', 'APPROVED', 'CLOSED', 'RESOLVED', 'PAID', 'POSTED'].includes(String(value || '').toUpperCase())

const recentDate = (item: any) => getText(item, ['updatedAt', 'createdAt', 'date', 'issuedAt', 'completedAt']) || '-'

type ReportModule = 'all' | 'service' | 'finance' | 'inventory' | 'customer' | 'tasks'
type ReportStatus = 'all' | 'pending' | 'completed' | 'attention'
type ReportDate = 'all' | 'today' | 'week' | 'month'

type ReportSignal = {
    ref: string
    title: string
    detail: string
    date: string
    module: ReportModule
    status: ReportStatus
}

const isWithinDateFilter = (value: string, filter: ReportDate) => {
    if (filter === 'all' || value === '-') return true
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return true

    const now = new Date()
    const start = new Date(now)
    if (filter === 'today') {
        start.setHours(0, 0, 0, 0)
    } else if (filter === 'week') {
        start.setDate(now.getDate() - 7)
    } else {
        start.setMonth(now.getMonth() - 1)
    }
    return date >= start
}

function StatCard({ label, value, detail, icon: Icon, tone = 'teal', onClick, active = false }: {
    label: string
    value: string | number
    detail: string
    icon: any
    tone?: 'teal' | 'blue' | 'amber' | 'green'
    onClick?: () => void
    active?: boolean
}) {
    const tones = {
        teal: 'bg-primary-50 text-primary-600 border-primary-100',
        blue: 'bg-sky-50 text-sky-700 border-sky-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md ${active ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'}`}
        >
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border ${tones[tone]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-gray-950">{value}</p>
            <p className="mt-1 text-sm font-extrabold text-gray-950">{label}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{detail}</p>
        </button>
    )
}

function ReportPanel({ title, subtitle, rows }: { title: string; subtitle: string; rows: Array<{ label: string; value: string | number; tone?: string }> }) {
    const max = Math.max(...rows.map((row) => getNumber(row.value)), 1)

    return (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-extrabold text-gray-950">{title}</h2>
                <p className="text-sm font-medium text-gray-500">{subtitle}</p>
            </div>
            <div className="space-y-3">
                {rows.map((row) => {
                    const numeric = getNumber(row.value)
                    const width = `${Math.max((numeric / max) * 100, numeric > 0 ? 8 : 0)}%`
                    return (
                        <div key={row.label}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                <span className="font-bold text-gray-700">{row.label}</span>
                                <span className="font-extrabold text-gray-950">{row.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                                <div className={`h-full rounded-full ${row.tone || 'bg-primary-500'}`} style={{ width }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export function ReportsDashboard() {
    const [moduleFilter, setModuleFilter] = useState<ReportModule>('all')
    const [statusFilter, setStatusFilter] = useState<ReportStatus>('all')
    const [dateFilter, setDateFilter] = useState<ReportDate>('all')

    const enquiries = asArray(useEnquiries().data).filter((item) => !isDemoLike(item))
    const admissions = asArray(useAdmissions().data).filter((item) => !isDemoLike(item))
    const homeCare = asArray(useHomeCareAllocations().data).filter((item) => !isDemoLike(item))
    const clinical = asArray(useClinicalAllocations().data).filter((item) => !isDemoLike(item))
    const inHouse = asArray(useInHouseAllocations().data).filter((item) => !isDemoLike(item))
    const others = asArray(useOthersAllocations().data).filter((item) => !isDemoLike(item))
    const invoices = asArray(useInvoices().data).filter((item) => !isDemoLike(item))
    const cashbox = asArray(useCashbox().data).filter((item) => !isDemoLike(item))
    const complaints = asArray(useComplaints().data).filter((item) => !isDemoLike(item))
    const tasks = asArray(useTasks().data).filter((item) => !isDemoLike(item))
    const approvalTasks = asArray(useApprovalTasks().data).filter((item) => !isDemoLike(item))
    const products = asArray(useInventoryProducts().data).filter((item) => !isDemoLike(item))
    const stock = asArray(useInventoryStock().data).filter((item) => !isDemoLike(item))
    const purchases = asArray(useInventoryPurchases().data).filter((item) => !isDemoLike(item))
    const stockIssues = asArray(useInventoryStockIssueRequests().data).filter((item) => !isDemoLike(item))
    const stockMovements = asArray(useInventoryStockMovements().data).filter((item) => !isDemoLike(item))
    const workflows = asArray(useWorkflowTimelines('').data).filter((item) => !isDemoLike(item))

    const allocations = [...homeCare, ...clinical, ...inHouse, ...others]
    const completedAllocations = allocations.filter((item) => isClosedStatus(getText(item, ['status', 'allocatedStatus'])))
    const openComplaints = complaints.filter((item) => !isClosedStatus(getText(item, ['status', 'complaintStatus'])))
    const lowStock = stock.filter((item) => getNumber(getText(item, ['quantity', 'currentStock', 'qty'])) <= getNumber(getText(item, ['threshold', 'reorderLevel', 'minimumStock'])))
    const paidInvoices = invoices.filter((item) => isClosedStatus(getText(item, ['paymentStatus', 'status'])))
    const totalInvoiceAmount = invoices.reduce((sum, item) => sum + getNumber(getText(item, ['amount', 'totalAmount', 'invoiceAmount'])), 0)
    const totalCollected = cashbox.reduce((sum, item) => sum + getNumber(getText(item, ['amount', 'paidAmount', 'credit'])), 0)
    const reportSignals: ReportSignal[] = [
        ...workflows.map((item) => ({
            ref: getText(item, ['refNo']) || '-',
            title: getText(item, ['clientName']) || 'Workflow',
            detail: getText(item, ['currentStep', 'status']) || 'Workflow tracking',
            date: recentDate(item),
            module: 'service' as ReportModule,
            status: isClosedStatus(getText(item, ['status', 'currentStep'])) ? 'completed' as ReportStatus : 'pending' as ReportStatus
        })),
        ...invoices.map((item) => ({
            ref: getText(item, ['invoiceNo', 'refNo']) || '-',
            title: getText(item, ['clientName', 'client.name']) || 'Invoice',
            detail: `${currency.format(getNumber(getText(item, ['amount', 'totalAmount', 'invoiceAmount'])))} - ${getText(item, ['paymentStatus', 'status']) || 'Invoice'}`,
            date: recentDate(item),
            module: 'finance' as ReportModule,
            status: isClosedStatus(getText(item, ['paymentStatus', 'status'])) ? 'completed' as ReportStatus : 'pending' as ReportStatus
        })),
        ...complaints.map((item) => ({
            ref: getText(item, ['refNo', 'complaintNo']) || '-',
            title: getText(item, ['clientName', 'client.name']) || 'Complaint',
            detail: getText(item, ['status', 'complaintStatus']) || 'Customer complaint',
            date: recentDate(item),
            module: 'customer' as ReportModule,
            status: isClosedStatus(getText(item, ['status', 'complaintStatus'])) ? 'completed' as ReportStatus : 'attention' as ReportStatus
        })),
        ...stockIssues.map((item) => ({
            ref: getText(item, ['refNo', 'id']) || '-',
            title: getText(item, ['product.name', 'productName', 'itemName']) || 'Stock issue',
            detail: getText(item, ['status']) || 'Inventory request',
            date: recentDate(item),
            module: 'inventory' as ReportModule,
            status: isClosedStatus(getText(item, ['status'])) ? 'completed' as ReportStatus : 'attention' as ReportStatus
        })),
        ...tasks.map((item) => ({
            ref: getText(item, ['refNo', 'taskNo', 'id']) || '-',
            title: getText(item, ['title', 'name']) || 'Staff task',
            detail: getText(item, ['status']) || 'Task',
            date: recentDate(item),
            module: 'tasks' as ReportModule,
            status: isClosedStatus(getText(item, ['status'])) ? 'completed' as ReportStatus : 'pending' as ReportStatus
        }))
    ]
    const filteredSignals = reportSignals
        .filter((item) => moduleFilter === 'all' || item.module === moduleFilter)
        .filter((item) => statusFilter === 'all' || item.status === statusFilter)
        .filter((item) => isWithinDateFilter(item.date, dateFilter))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12)

    return (
        <div className="space-y-5">
            <PageHeader
                title="Reports Dashboard"
                subtitle="Live operational reports from the manual ERP workflow data."
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Workflow Records" value={workflows.length} detail="Live enquiry-to-service timelines" icon={Activity} active={moduleFilter === 'service'} onClick={() => setModuleFilter('service')} />
                <StatCard label="Care Allocations" value={allocations.length} detail={`${completedAllocations.length} completed or approved`} icon={Users} tone="green" active={moduleFilter === 'service' && statusFilter === 'completed'} onClick={() => { setModuleFilter('service'); setStatusFilter('completed') }} />
                <StatCard label="Invoice Value" value={currency.format(totalInvoiceAmount)} detail={`${paidInvoices.length} invoices marked paid/posting complete`} icon={IndianRupee} tone="blue" active={moduleFilter === 'finance'} onClick={() => setModuleFilter('finance')} />
                <StatCard label="Open Attention" value={openComplaints.length + approvalTasks.length + lowStock.length} detail="Complaints, approvals, and low stock" icon={AlertTriangle} tone="amber" active={statusFilter === 'attention'} onClick={() => setStatusFilter('attention')} />
            </div>

            <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-4">
                    <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                        Module
                        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value as ReportModule)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-gray-800 outline-none focus:border-primary-400">
                            <option value="all">All Modules</option>
                            <option value="service">Service Flow</option>
                            <option value="finance">Finance</option>
                            <option value="inventory">Inventory</option>
                            <option value="customer">Customer Care</option>
                            <option value="tasks">Staff Tasks</option>
                        </select>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                        Status
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReportStatus)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-gray-800 outline-none focus:border-primary-400">
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="attention">Needs Attention</option>
                        </select>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                        Date
                        <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as ReportDate)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-gray-800 outline-none focus:border-primary-400">
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </label>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => { setModuleFilter('all'); setStatusFilter('all'); setDateFilter('all') }}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-extrabold text-gray-700 hover:bg-white"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <ReportPanel
                    title="Service Flow"
                    subtitle="Counts from enquiry, admission, and allocation records."
                    rows={[
                        { label: 'Enquiries Created', value: enquiries.length },
                        { label: 'Admissions Created', value: admissions.length, tone: 'bg-sky-500' },
                        { label: 'Care Allocations', value: allocations.length, tone: 'bg-emerald-500' },
                        { label: 'Completed Services', value: completedAllocations.length, tone: 'bg-primary-700' }
                    ]}
                />
                <ReportPanel
                    title="Inventory Flow"
                    subtitle="Current stock, purchases, issue requests, and movement audit."
                    rows={[
                        { label: 'Products', value: products.length },
                        { label: 'Stock Records', value: stock.length, tone: 'bg-emerald-500' },
                        { label: 'Purchase Orders', value: purchases.length, tone: 'bg-sky-500' },
                        { label: 'Stock Movements', value: stockMovements.length, tone: 'bg-primary-700' },
                        { label: 'Low Stock', value: lowStock.length, tone: 'bg-amber-500' }
                    ]}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-950">Recent Report Signals</h2>
                            <p className="text-sm font-medium text-gray-500">Filtered live references from the selected module, status, and date.</p>
                        </div>
                        <Link to="/workflow/timeline" className="rounded-full bg-primary-500 px-4 py-2 text-xs font-extrabold text-white shadow-sm">
                            Open Timeline
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-extrabold uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Record</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSignals.length > 0 ? filteredSignals.map((item) => (
                                    <tr key={`${item.ref}-${item.title}-${item.date}`} className="border-t border-gray-100">
                                        <td className="px-4 py-3 font-extrabold text-primary-700">{item.ref}</td>
                                        <td className="px-4 py-3 font-bold text-gray-950">{item.title}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.detail}</td>
                                        <td className="px-4 py-3 text-gray-500">{item.date === '-' ? '-' : new Date(item.date).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center font-semibold text-gray-500">
                                            No live report records found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-extrabold text-gray-950">Action Summary</h2>
                    <p className="text-sm font-medium text-gray-500">Live queues that still need review.</p>
                    <div className="mt-4 space-y-3">
                        {[
                            { label: 'Total staff tasks', value: tasks.length, icon: ClipboardList },
                            { label: 'Task approvals', value: approvalTasks.length, icon: ClipboardList },
                            { label: 'Open complaints', value: openComplaints.length, icon: MessageSquare },
                            { label: 'Low stock items', value: lowStock.length, icon: Boxes },
                            { label: 'Paid invoices', value: paidInvoices.length, icon: CheckCircle2 },
                            { label: 'Collected amount', value: currency.format(totalCollected), icon: FileText }
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                                        <item.icon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                </div>
                                <span className="text-sm font-extrabold text-gray-950">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
