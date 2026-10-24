import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useDailyMovementReport } from '../hooks/useSecurity'
import type { GateEntry } from '../types'

type SecurityReportRow = GateEntry & {
    duration: string
}

const todayKey = () => new Date().toISOString().slice(0, 10)
const normalizeStatus = (value?: string) => String(value || '').trim().toLowerCase()
const entryDateKey = (entry: GateEntry) => {
    const date = new Date(entry.checkInAt || entry.createdAt)
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const durationText = (start?: string, end?: string | null) => {
    if (!start || !end) return '-'
    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return '-'
    const minutes = Math.max(1, Math.round((endMs - startMs) / 60000))
    if (minutes < 60) return `${minutes} min`
    return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

const entryTypeLabel = (entry: GateEntry) => {
    if (entry.entryType === 'VEHICLE') return 'Vehicle'
    if (entry.entryType === 'STAFF') return 'Staff'
    return 'Visitor'
}

const entryName = (entry: GateEntry) => {
    if (entry.entryType === 'VEHICLE') return entry.vehicleNo || '-'
    if (entry.entryType === 'STAFF') return entry.staffName || entry.empId || '-'
    return entry.visitorName || '-'
}

const escapeCsv = (value?: string | number | null) => {
    const text = String(value ?? '')
    return `"${text.replace(/"/g, '""')}"`
}

export function SecurityReports() {
    const [reportDate, setReportDate] = useState(todayKey())
    const { data: entries = [], isLoading } = useDailyMovementReport(reportDate)
    const [typeFilter, setTypeFilter] = useState('ALL')

    const reportRows = useMemo<SecurityReportRow[]>(() => entries
        .filter((entry) => entryDateKey(entry) === reportDate)
        .filter((entry) => typeFilter === 'ALL' || entry.entryType === typeFilter)
        .map((entry) => ({
            ...entry,
            duration: durationText(entry.checkInAt, entry.checkOutAt)
        })), [entries, reportDate, typeFilter])

    const summary = useMemo(() => {
        const allForDate = entries.filter((entry) => entryDateKey(entry) === reportDate)
        const checkedIn = allForDate.filter((entry) => normalizeStatus(entry.status) === 'checked in')
        const checkedOut = allForDate.filter((entry) => normalizeStatus(entry.status) === 'checked out')

        return [
            { label: 'Total Movements', value: allForDate.length, tone: 'bg-slate-50 text-slate-700' },
            { label: 'Visitors', value: allForDate.filter((entry) => entry.entryType !== 'VEHICLE' && entry.entryType !== 'STAFF').length, tone: 'bg-primary-50 text-primary-700' },
            { label: 'Staff', value: allForDate.filter((entry) => entry.entryType === 'STAFF').length, tone: 'bg-sky-50 text-sky-700' },
            { label: 'Vehicles', value: allForDate.filter((entry) => entry.entryType === 'VEHICLE').length, tone: 'bg-indigo-50 text-indigo-700' },
            { label: 'Still Inside', value: checkedIn.length, tone: 'bg-amber-50 text-amber-700' },
            { label: 'Checked Out', value: checkedOut.length, tone: 'bg-emerald-50 text-emerald-700' }
        ]
    }, [entries, reportDate])

    const handleExportCsv = () => {
        const headers = ['Type', 'Name / Ref', 'Mobile', 'Purpose', 'In Time', 'Out Time', 'Duration', 'Status', 'Recorded By']
        const lines = reportRows.map((entry) => [
            entryTypeLabel(entry),
            entryName(entry),
            entry.entryType === 'VEHICLE' ? entry.driverMobile || '' : entry.mobile || '',
            entry.purpose || '',
            formatTime(entry.checkInAt),
            formatTime(entry.checkOutAt),
            entry.duration,
            entry.status || '',
            entry.recordedBy || ''
        ].map(escapeCsv).join(','))
        const csv = [headers.map(escapeCsv).join(','), ...lines].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `security-report-${reportDate}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handlePrint = () => {
        window.print()
    }

    const columns: Column<SecurityReportRow>[] = [
        { key: 'entryType', header: 'Type', cell: entryTypeLabel, sortable: true },
        { key: 'visitorName', header: 'Name / Ref', cell: (entry) => <span className="font-extrabold text-slate-900">{entryName(entry)}</span>, sortable: true },
        { key: 'mobile', header: 'Mobile', cell: (entry) => entry.entryType === 'VEHICLE' ? entry.driverMobile || '-' : entry.mobile || '-' },
        { key: 'purpose', header: 'Purpose', cell: (entry) => entry.purpose || '-' },
        { key: 'checkInAt', header: 'In Time', cell: (entry) => formatTime(entry.checkInAt), sortable: true },
        { key: 'checkOutAt', header: 'Out Time', cell: (entry) => formatTime(entry.checkOutAt), sortable: true },
        { key: 'duration', header: 'Duration' },
        { key: 'status', header: 'Status', cell: (entry) => <StatusHighlighter value={entry.status} /> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Daily Security Report"
                subtitle="Date-wise report for visitor, staff, and vehicle gate movements."
                breadcrumbs={[{ label: 'Security' }, { label: 'Reports' }]}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button type="button" onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-primary-700">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                )}
            />

            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Report Date
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(event) => setReportDate(event.target.value)}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold normal-case tracking-normal text-slate-700 outline-none focus:border-primary-400"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Movement Type
                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold normal-case tracking-normal text-slate-700 outline-none focus:border-primary-400"
                        >
                            <option value="ALL">All Types</option>
                            <option value="VISITOR">Visitors</option>
                            <option value="STAFF">Staff</option>
                            <option value="VEHICLE">Vehicles</option>
                        </select>
                    </label>
                </div>
            </section>

            <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
                {summary.map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <DataTable
                data={reportRows}
                columns={columns}
                keyExtractor={(entry) => entry.id}
                isLoading={isLoading}
                emptyStateMessage="No security movements found for the selected date."
            />
        </div>
    )
}
