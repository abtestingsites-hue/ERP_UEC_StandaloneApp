import { useMemo, useState, type FormEvent } from 'react'
import { CalendarClock, Eye, LogIn, LogOut, Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { Input } from '../../../components/Input'
import { Modal } from '../../../components/Modal'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useCheckInExpectedVisitor, useCheckoutGateEntry, useGateQueue } from '../hooks/useSecurity'
import { ResidentOutingsList } from '../components/ResidentOutingsList'
import type { GateEntry } from '../types'



const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const normalizeStatus = (value?: string) => String(value || '').trim().toLowerCase()


export function GateManagement() {
    const { data: entries = [], isLoading, refetch, isFetching } = useGateQueue()

    const checkInExpectedVisitor = useCheckInExpectedVisitor()
    const checkoutEntry = useCheckoutGateEntry()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEntry, setSelectedEntry] = useState<GateEntry | null>(null)
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'RESIDENTS'>('VISITORS')


    const visitorEntries = useMemo(() => entries.filter((entry) => entry.entryType === 'VISITOR' || entry.entryType === 'VISITOR_PASS'), [entries])
    const activeEntries = useMemo(() => visitorEntries.filter((entry) => normalizeStatus(entry.status) === 'checked in'), [visitorEntries])
    const checkedOutEntries = useMemo(() => visitorEntries.filter((entry) => normalizeStatus(entry.status) === 'checked out'), [visitorEntries])
    const filteredEntries = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return activeEntries.filter((entry) =>
            String(entry.visitorName || '').toLowerCase().includes(query) ||
            String(entry.mobile || '').toLowerCase().includes(query) ||
            String(entry.purpose || '').toLowerCase().includes(query) ||
            String(entry.visitingPerson || '').toLowerCase().includes(query)
        )
    }, [activeEntries, searchQuery])



    const handleCheckout = (entry: GateEntry) => {
        // OTP temporarily frozen for manual checkout
        // if (!isCheckoutOtpVerified(entry)) return
        const remarks = window.prompt(`Checkout remarks for ${entry.visitorName || 'visitor'}`, '')
        checkoutEntry.mutate({ id: entry.id, remarks: remarks || undefined })
    }



    const handleExpectedCheckIn = async (entry: GateEntry) => {
        const remarks = window.prompt(`Arrival remarks for ${entry.visitorName || 'visitor'}`, '')
        try {
            await checkInExpectedVisitor.mutateAsync({ id: entry.id, remarks: remarks || undefined })
            setSearchQuery('')
        } catch {
            // Toast is handled by the mutation hook.
        }
    }

    const columns: Column<GateEntry>[] = [
        { 
            key: 'visitorName', 
            header: 'Visitor', 
            sortable: true, 
            cell: (entry) => (
                <div className="flex items-center gap-3">
                    {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-black/5">
                            {(entry.visitorName || entry.staffName || entry.driverName || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <span className="block font-extrabold text-slate-900">{entry.visitorName || entry.staffName || entry.driverName || '-'}</span>
                        {entry.category && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.category.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>
                </div>
            ) 
        },
        { key: 'mobile', header: 'Mobile', cell: (entry) => entry.mobile || entry.driverMobile || '-' },
        { key: 'purpose', header: 'Purpose' },
        { key: 'visitingPerson', header: 'Visiting', cell: (entry) => entry.visitingPerson || entry.department || '-' },
        { key: 'vehicleNo', header: 'Vehicle', cell: (entry) => entry.vehicleNo || '-' },
        { key: 'checkInAt', header: 'Check In', cell: (entry) => formatTime(entry.checkInAt), sortable: true },
        // {
        //     key: 'checkoutOtp',
        //     header: 'Checkout OTP',
        //     cell: (entry) => {
        //         const otpLog = getCheckoutOtp(entry)
        //         return otpLog ? <StatusHighlighter value={otpLog.status} /> : <span className="text-xs font-bold text-slate-400">Not Sent</span>
        //     }
        // },
        { key: 'status', header: 'Status', cell: (entry) => <StatusHighlighter value={entry.status} /> }
    ]

    const historyColumns: Column<GateEntry>[] = [
        { 
            key: 'visitorName', 
            header: 'Visitor', 
            sortable: true, 
            cell: (entry) => (
                <div className="flex items-center gap-3">
                    {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-black/5">
                            {(entry.visitorName || entry.staffName || entry.driverName || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <span className="block font-extrabold text-slate-900">{entry.visitorName || entry.staffName || entry.driverName || '-'}</span>
                        {entry.category && (
                            <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                {entry.category.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>
                </div>
            ) 
        },
        { key: 'mobile', header: 'Mobile', cell: (entry) => entry.mobile || entry.driverMobile || '-' },
        { key: 'purpose', header: 'Purpose' },
        { key: 'visitingPerson', header: 'Visiting', cell: (entry) => entry.visitingPerson || entry.department || '-' },
        { key: 'checkInAt', header: 'Time Inside', cell: (entry) => (
            <div className="flex flex-col">
                <span className="text-xs text-slate-500">In: {formatTime(entry.checkInAt)}</span>
                <span className="text-xs font-bold text-slate-800">Out: {formatTime(entry.checkOutAt)}</span>
            </div>
        ) },
        { key: 'status', header: 'Status', cell: (entry) => <StatusHighlighter value={entry.status} /> }
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Gate Management"
                subtitle="Live visitor check-in and checkout register for the selected unit."
                breadcrumbs={[{ label: 'Security' }, { label: 'Gate Management' }]}
            />

            <div className="flex w-full max-w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 p-1 md:inline-flex md:w-auto">
                <button 
                    onClick={() => setActiveTab('VISITORS')}
                    className={`min-w-0 flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-extrabold transition-all md:flex-none md:px-6 ${activeTab === 'VISITORS' ? 'bg-white dark:bg-white/10 text-slate-950 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Visitors
                </button>
                <button 
                    onClick={() => setActiveTab('RESIDENTS')}
                    className={`min-w-0 flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-extrabold transition-all md:flex-none md:px-6 ${activeTab === 'RESIDENTS' ? 'bg-white dark:bg-white/10 text-slate-950 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Resident Outings
                </button>
            </div>

            {activeTab === 'VISITORS' && (
                <>
                    <div className="grid gap-3 md:grid-cols-2">
                {[
                    { label: 'Currently Inside', value: activeEntries.length, tone: 'bg-primary-50 text-primary-700' },
                    { label: 'Checked Out', value: visitorEntries.filter((entry) => normalizeStatus(entry.status) === 'checked out').length, tone: 'bg-emerald-50 text-emerald-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>



            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">Active Visitors</h2>
                        <p className="text-sm font-bold text-slate-500">Visitors currently inside and waiting for checkout.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <FilterSection searchQuery={searchQuery} onSearchChange={(event) => setSearchQuery(event.target.value)} searchPlaceholder="Search active visitors..." />

                <div className="min-h-[320px]">
                    <DataTable
                        data={filteredEntries}
                        columns={columns}
                        keyExtractor={(entry) => entry.id}
                        isLoading={isLoading}
                        emptyStateMessage={activeEntries.length > 0 ? 'No active visitors match the current search.' : 'No active visitors are currently checked in.'}
                        actions={(entry) => (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCheckout(entry)}
                                    disabled={checkoutEntry.isPending}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                                    title="Check out visitor manually"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Check Out
                                </button>
                            </div>
                        )}
                    />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">Recently Visited</h2>
                        <p className="text-sm font-bold text-slate-500">History of visitors who completed their visit today.</p>
                    </div>
                </div>

                <div className="min-h-[220px]">
                    <DataTable
                        data={checkedOutEntries}
                        columns={historyColumns}
                        keyExtractor={(entry) => entry.id}
                        isLoading={isLoading}
                        emptyStateMessage="No visitors have checked out today."
                        actions={(entry) => null}
                    />
                </div>
            </section>

                </>
            )}

            {activeTab === 'RESIDENTS' && (
                <ResidentOutingsList />
            )}
        </div>
    )
}
