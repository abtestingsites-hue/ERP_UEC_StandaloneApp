import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardList, DoorOpen, LogOut, LogIn, ShieldCheck, Truck, UserCog, Users, MapPin, AlertCircle } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useDashboardActionQueue, useDailyMovementReport, useCheckoutGateEntry, useRecordResidentExit, useRecordResidentReturn, useSecurityDashboardSummary } from '../hooks/useSecurity'
import type { GateEntry } from '../types'

const normalizeStatus = (value?: string) => String(value || '').trim().toLowerCase()
const todayKey = () => new Date().toISOString().slice(0, 10)
const dateKey = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
}

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const entryName = (entry: GateEntry) => {
    if (entry.entryType === 'VEHICLE') return entry.vehicleNo || '-'
    if (entry.entryType === 'STAFF') return entry.staffName || entry.empId || '-'
    return entry.visitorName || '-'
}

const entryTypeLabel = (entry: GateEntry) => {
    if (entry.entryType === 'VEHICLE') return 'Vehicle'
    if (entry.entryType === 'STAFF') return 'Staff'
    return 'Visitor'
}

export function SecurityDashboard() {
    const today = todayKey()
    const { data: actionQueue = [], isLoading: isQueueLoading } = useDashboardActionQueue()
    const { data: dailyMovement = [], isLoading: isMovementLoading } = useDailyMovementReport(today)
    const { data: summary } = useSecurityDashboardSummary()
    const checkoutEntry = useCheckoutGateEntry()
    const recordReturn = useRecordResidentReturn()
    const [queueType, setQueueType] = useState('ALL')
    const [recentType, setRecentType] = useState('ALL')
    const [viewingEntry, setViewingEntry] = useState<GateEntry | null>(null)

    const isLoading = isQueueLoading || isMovementLoading

    const queueRows = useMemo(() => {
        const rows = actionQueue.filter((entry) => 
            queueType === 'ALL' || 
            (queueType === 'VISITOR' ? (entry.entryType === 'VISITOR' || entry.entryType === 'VISITOR_PASS') : entry.entryType === queueType)
        )
        return rows.slice(0, 8)
    }, [actionQueue, queueType])

    const recentActivityRows = useMemo(() => {
        const rows = dailyMovement.filter((entry) => 
            entry.entryType !== 'RESIDENT' &&
            (recentType === 'ALL' || 
            (recentType === 'VISITOR' ? (entry.entryType === 'VISITOR' || entry.entryType === 'VISITOR_PASS') : entry.entryType === recentType))
        )
        return rows.slice(0, 8)
    }, [dailyMovement, recentType])

    const completedResidentOutings = useMemo(() => {
        return dailyMovement.filter(entry => entry.entryType === 'RESIDENT' && normalizeStatus(entry.status) === 'returned').slice(0, 8)
    }, [dailyMovement])

    const handleCheckout = (entry: GateEntry) => {
        if (entry.entryType === 'RESIDENT') {
            if (!window.confirm(`Are you sure you want to record RETURN for ${entryName(entry)}?`)) return;
            recordReturn.mutate({ id: (entry as any).movementId });
        } else {
            if (!window.confirm(`Are you sure you want to check out ${entryName(entry)}?`)) return;
            checkoutEntry.mutate({ id: entry.id });
        }
    }

    const stats = [
        { label: 'Visitors Inside', value: summary?.activeVisitors ?? 0, icon: Users, tone: 'bg-primary-50 text-primary-700', href: '/security/gate-management' },
        { label: 'Staff Inside', value: summary?.activeStaff ?? 0, icon: UserCog, tone: 'bg-sky-50 text-sky-700', href: '/security/staff-register' },
        { label: 'Vehicles Inside', value: summary?.activeVehicles ?? 0, icon: Truck, tone: 'bg-indigo-50 text-indigo-700', href: '/security/vehicle-register' },
        { label: 'Resident Outings Outside', value: actionQueue.filter((entry) => entry.entryType === 'RESIDENT').length, icon: MapPin, tone: 'bg-fuchsia-50 text-fuchsia-700', href: '/security/resident-outings' },
        { label: 'Resident Outings Completed', value: dailyMovement.filter((entry) => entry.entryType === 'RESIDENT' && normalizeStatus(entry.status) === 'returned').length, icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-700', href: '/security/resident-outings' },
        { label: 'Overdue Resident Returns', value: actionQueue.filter((entry) => entry.entryType === 'RESIDENT' && (entry as any).isOverdue).length, icon: AlertCircle, tone: 'bg-rose-50 text-rose-700', href: '/security/resident-outings' },
    ]

    const columns: Column<GateEntry>[] = [
        { key: 'entryType', header: 'Type', cell: entryTypeLabel, sortable: true },
        { 
            key: 'visitorName', 
            header: 'Name / Ref', 
            sortable: true, 
            cell: (entry) => (
                <div className="flex items-center gap-3">
                    {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-black/5">
                            {entryName(entry).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <span className="block font-extrabold text-slate-900">{entryName(entry)}</span>
                        {(entry.entryType === 'VISITOR' || entry.entryType === 'VISITOR_PASS') && entry.category && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.category.replace(/_/g, ' ')}
                            </span>
                        )}
                        {entry.entryType === 'STAFF' && entry.designation && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.designation}
                            </span>
                        )}
                    </div>
                </div>
            ) 
        },
        { key: 'mobile', header: 'Mobile', cell: (entry) => entry.mobile || entry.driverMobile || '-' },
        { key: 'purpose', header: 'Purpose', cell: (entry) => entry.purpose || '-' },
        { key: 'visitingPerson', header: 'Visiting', cell: (entry) => entry.visitingPerson || entry.department || '-' },
        { key: 'checkInAt', header: 'Check In', cell: (entry) => formatTime(entry.checkInAt), sortable: true },
        { key: 'status', header: 'Status', cell: (entry) => <StatusHighlighter value={entry.status} /> }
    ]

    const historyColumns: Column<GateEntry>[] = [
        { 
            key: 'visitorName', 
            header: 'Name / Ref', 
            sortable: true, 
            cell: (entry) => (
                <div className="flex items-center gap-3">
                    {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-black/5">
                            {entryName(entry).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <span className="block font-extrabold text-slate-900">{entryName(entry)}</span>
                        {(entry.entryType === 'VISITOR' || entry.entryType === 'VISITOR_PASS') && entry.category && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.category.replace(/_/g, ' ')}
                            </span>
                        )}
                        {entry.entryType === 'STAFF' && entry.designation && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.designation}
                            </span>
                        )}
                    </div>
                </div>
            ) 
        },
        { key: 'mobile', header: 'Mobile', cell: (entry) => entry.mobile || entry.driverMobile || '-' },
        { key: 'purpose', header: 'Purpose', cell: (entry) => entry.purpose || '-' },
        { key: 'visitingPerson', header: 'Visiting', cell: (entry) => entry.visitingPerson || entry.department || '-' },
        { key: 'checkInAt', header: 'Time Inside', cell: (entry) => (
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">In: {formatTime(entry.checkInAt)}</span>
                <span className="text-xs font-bold text-slate-800">Out: {formatTime(entry.checkOutAt)}</span>
            </div>
        ) },
        { key: 'status', header: 'Status', cell: (entry) => <StatusHighlighter value={entry.status} /> }
    ]

    const completedOutingColumns: Column<GateEntry>[] = [
        { key: 'visitorName', header: 'Resident', cell: entryName, sortable: true },
        { key: 'expectedAt', header: 'Expected Return', cell: (entry) => formatTime(entry.expectedReturnAt) },
        { key: 'checkInAt', header: 'Actual Exit', cell: (entry) => formatTime(entry.checkInAt) },
        { key: 'checkOutAt', header: 'Actual Return', cell: (entry) => formatTime(entry.checkOutAt) },
        { key: 'exitRecordedBy', header: 'Exit Recorded By', cell: (entry) => <span className="text-xs font-medium text-slate-600">{entry.exitRecordedBy || '-'}</span> },
        { key: 'returnRecordedBy', header: 'Return Recorded By', cell: (entry) => <span className="text-xs font-medium text-slate-600">{entry.returnRecordedBy || '-'}</span> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Security Dashboard"
                subtitle="Live gate, visitor, staff, vehicle, and checkout monitoring."
                breadcrumbs={[{ label: 'UNCF' }, { label: 'Security' }, { label: 'Dashboard' }]}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <Link to="/security/gate-management" className="rounded-full bg-primary-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-primary-700">Gate Entry</Link>
                        <Link to="/security/entry-logs" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50">Entry Logs</Link>
                    </div>
                )}
            />

            <div className="grid gap-3 md:grid-cols-3">
                {stats.map((item) => (
                    <Link key={item.label} to={item.href} className={`rounded-2xl border border-slate-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}>
                        <item.icon className="mb-3 h-5 w-5" />
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {[
                    { label: 'Gate Management', href: '/security/gate-management' },
                    { label: 'Vehicle Register', href: '/security/vehicle-register' },
                    { label: 'Staff Register', href: '/security/staff-register' }
                ].map((item) => (
                    <Link key={item.href} to={item.href} className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-primary-50 hover:text-primary-700">
                        <ClipboardList className="mb-3 h-5 w-5 text-primary-600" />
                        {item.label}
                    </Link>
                ))}
            </div>

            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-600">Action Queue</p>
                        <h2 className="text-xl font-extrabold text-slate-950">Currently inside</h2>
                        <p className="text-sm font-bold text-slate-500">Open movements that still need checkout.</p>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {[
                            ['ALL', 'All'],
                            ['STAFF', 'Staff'],
                            ['VEHICLE', 'Vehicles'],
                            ['VISITOR', 'Visitors'],
                            ['RESIDENT', 'Residents']
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setQueueType(value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${queueType === value ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <DataTable
                    fullHeight={false}
                    data={queueRows}
                    columns={columns}
                    keyExtractor={(entry) => entry.id}
                    isLoading={isLoading}
                    emptyStateMessage="No active gate movements waiting for checkout."
                    actions={(entry) => (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewingEntry(entry)} className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
                                Open
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCheckout(entry)}
                                disabled={checkoutEntry.isPending || recordReturn.isPending}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold disabled:opacity-60 ${entry.entryType === 'RESIDENT' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                title={entry.entryType === 'RESIDENT' ? 'Record Return manually' : 'Check out manually'}
                            >
                                {entry.entryType === 'RESIDENT' ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                                {entry.entryType === 'RESIDENT' ? 'ARRIVED' : 'Check Out'}
                            </button>
                        </div>
                    )}
                />
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Recent Gate Activity</p>
                        <h2 className="text-xl font-extrabold text-slate-950">Recent normal gate activity</h2>
                        <p className="text-sm font-bold text-slate-500">Visitor check-in / checkout • Staff entry / exit • Vehicle entry / exit</p>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {[
                            ['ALL', 'All'],
                            ['VISITOR', 'Visitors'],
                            ['STAFF', 'Staff'],
                            ['VEHICLE', 'Vehicles']
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRecentType(value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${recentType === value ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <DataTable
                    fullHeight={false}
                    data={recentActivityRows}
                    columns={historyColumns}
                    keyExtractor={(entry) => entry.id}
                    isLoading={isLoading}
                    emptyStateMessage="No recent gate activity."
                    actions={(entry) => (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewingEntry(entry)} className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
                                Open
                            </button>
                        </div>
                    )}
                />
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">Completed Resident Outings</p>
                    <h2 className="text-xl font-extrabold text-slate-950">Residents who have ARRIVED</h2>
                </div>
                <DataTable
                    fullHeight={false}
                    data={completedResidentOutings}
                    columns={completedOutingColumns}
                    keyExtractor={(entry) => entry.id}
                    isLoading={isLoading}
                    emptyStateMessage="No residents have returned from outings today."
                    actions={(entry) => (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewingEntry(entry)} className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
                                Open
                            </button>
                        </div>
                    )}
                />
            </section>

            {/* VIEW MODAL */}
            {viewingEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                            {viewingEntry.entryType === 'VEHICLE' ? 'Vehicle Details' : viewingEntry.entryType === 'STAFF' ? 'Staff Details' : 'Visitor Details'}
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Name / Ref:</span>
                                <span className="font-bold text-slate-800">{entryName(viewingEntry)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Mobile:</span>
                                <span className="font-bold text-slate-800">{viewingEntry.mobile || viewingEntry.driverMobile || '-'}</span>
                            </div>
                            {(viewingEntry.entryType === 'VISITOR' || viewingEntry.entryType === 'VISITOR_PASS') && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Category:</span>
                                    <span className="font-bold text-slate-800">{viewingEntry.category ? viewingEntry.category.replace(/_/g, ' ') : '-'}</span>
                                </div>
                            )}
                            {viewingEntry.entryType === 'STAFF' && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Designation / Dept:</span>
                                    <span className="font-bold text-slate-800">{viewingEntry.designation || viewingEntry.department || '-'}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Purpose:</span>
                                <span className="font-bold text-slate-800">{viewingEntry.purpose || '-'}</span>
                            </div>
                            {(viewingEntry.entryType === 'VISITOR' || viewingEntry.entryType === 'VISITOR_PASS') && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Person / Resident Visiting:</span>
                                    <span className="font-bold text-slate-800">{viewingEntry.visitingPerson || '-'}</span>
                                </div>
                            )}
                            {viewingEntry.approvedBy && (
                                <div className="flex justify-between items-start mt-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-50">
                                    <span className="font-semibold text-slate-500">Approved By:</span>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-slate-800">{viewingEntry.approvedBy.name || 'Not available'}</span>
                                        {viewingEntry.approvedBy.empId && (
                                            <span className="text-xs text-slate-500 font-semibold">{viewingEntry.approvedBy.empId}</span>
                                        )}
                                        {viewingEntry.approvedBy.designation && (
                                            <span className="text-xs text-slate-400 font-medium">{viewingEntry.approvedBy.designation}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {viewingEntry.remarks && viewingEntry.remarks.trim().length > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Materials Brought:</span>
                                    <span className="font-bold text-slate-800">{viewingEntry.remarks}</span>
                                </div>
                            )}
                            {viewingEntry.entryType === 'VEHICLE' && viewingEntry.driverName && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Driver Name:</span>
                                    <span className="font-bold text-slate-800">{viewingEntry.driverName}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Check-In Time:</span>
                                <span className="font-bold text-slate-800">{formatTime(viewingEntry.checkInAt)}</span>
                            </div>
                            {viewingEntry.checkOutAt && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Check-Out Time:</span>
                                    <span className="font-bold text-slate-800">{formatTime(viewingEntry.checkOutAt)}</span>
                                </div>
                            )}
                            {viewingEntry.checkInAt && viewingEntry.checkOutAt && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Duration:</span>
                                    <span className="font-bold text-slate-800">
                                        {Math.round((new Date(viewingEntry.checkOutAt).getTime() - new Date(viewingEntry.checkInAt).getTime()) / 60000)} mins
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">Status:</span>
                                <span className="font-bold text-slate-800">
                                    {viewingEntry.checkOutAt ? 'Checked Out' : normalizeStatus(viewingEntry.status) === 'expected' ? 'Expected' : 'Currently Inside'}
                                </span>
                            </div>
                            {(viewingEntry.entryType === 'VISITOR' || viewingEntry.entryType === 'VISITOR_PASS') && (
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-500">Reference:</span>
                                    <span className="font-bold text-slate-800 text-xs">{viewingEntry.id}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end pt-6">
                            <button onClick={() => setViewingEntry(null)} className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
