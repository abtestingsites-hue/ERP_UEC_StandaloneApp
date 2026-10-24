import { useMemo, useState, type FormEvent } from 'react'
import { Eye, LogOut, Plus, RefreshCw, LogIn, Clock } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { Input } from '../../../components/Input'
import { StaffCombobox } from '../components/StaffCombobox'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaffMovements, useNewStaffEntry, useStaffReturn, useStaffFinalExit } from '../hooks/useSecurity'
import { StaffTempExitModal } from '../components/StaffTempExitModal'
import { StaffMovementDetailModal } from '../components/StaffMovementDetailModal'
import type { StaffDailyMovement } from '../types'

const formatTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function StaffRegister() {
    const { data: movements = [], isLoading, refetch, isFetching } = useStaffMovements()
    const createEntry = useNewStaffEntry()
    const recordReturn = useStaffReturn()
    const recordFinalExit = useStaffFinalExit()

    const [selectedStaffId, setSelectedStaffId] = useState<string>('')
    const [selectedStaffDisplay, setSelectedStaffDisplay] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    
    const [tempExitModalMovement, setTempExitModalMovement] = useState<StaffDailyMovement | null>(null)
    const [detailModalMovement, setDetailModalMovement] = useState<StaffDailyMovement | null>(null)

    const activeMovements = useMemo(() => movements.filter(m => m.status !== 'COMPLETED'), [movements])
    const completedMovements = useMemo(() => movements.filter(m => m.status === 'COMPLETED'), [movements])
    
    const filteredMovements = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return activeMovements.filter((entry) =>
            String(entry.staff?.firstName || '').toLowerCase().includes(query) ||
            String(entry.staff?.lastName || '').toLowerCase().includes(query) ||
            String(entry.staff?.empId || '').toLowerCase().includes(query) ||
            String(entry.staff?.department || '').toLowerCase().includes(query)
        )
    }, [activeMovements, searchQuery])

    const handleStaffSelect = (staff: any) => {
        setSelectedStaffId(staff.id)
        setSelectedStaffDisplay(staff)
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (!selectedStaffId) return
        try {
            await createEntry.mutateAsync(selectedStaffId)
            setSelectedStaffId('')
            setSelectedStaffDisplay(null)
            setSearchQuery('')
        } catch {
            // Handled in hook
        }
    }

    const handleReturn = (movement: StaffDailyMovement) => {
        const activeTrip = movement.trips.find(t => t.status === 'OUTSIDE')
        if (!activeTrip) return
        
        if (window.confirm('Confirm that this staff member has returned?')) {
            recordReturn.mutate({ id: movement.id, tripId: activeTrip.id })
        }
    }

    const handleFinalExit = (movement: StaffDailyMovement) => {
        if (window.confirm('Confirm final exit for this staff member?')) {
            recordFinalExit.mutate(movement.id)
        }
    }

    const getMovementDisplayState = (movement: StaffDailyMovement) => {
        const activeTrip = movement.trips.find(t => t.status === 'OUTSIDE')
        if (activeTrip) {
            return { label: 'Outside', color: 'text-amber-600', trip: activeTrip }
        }
        return { label: 'Inside', color: 'text-emerald-600', trip: null }
    }

    const columns: Column<StaffDailyMovement>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true, cell: (entry) => <span className="font-extrabold text-slate-900">{entry.staff?.empId}</span> },
        { key: 'staffName', header: 'Staff Name', sortable: true, cell: (entry) => `${entry.staff?.firstName || ''} ${entry.staff?.lastName || ''}`.trim() || '-' },
        { key: 'department', header: 'Department', cell: (entry) => entry.staff?.department || '-' },
        { key: 'designation', header: 'Designation', cell: (entry) => entry.staff?.designation || '-' },
        { key: 'entryAt', header: 'Entry', cell: (entry) => formatTime(entry.entryAt), sortable: true },
        { key: 'status', header: 'State', cell: (entry) => {
            const state = getMovementDisplayState(entry)
            return (
                <div className="flex flex-col">
                    <span className={`font-bold ${state.color}`}>{state.label.toUpperCase()}</span>
                    {state.trip && <span className="text-xs text-slate-500">{state.trip.reason}</span>}
                </div>
            )
        }}
    ]

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent">
            <PageHeader
                title="Staff In-Out Register"
                subtitle="Live staff gate movement register with temporary trips and HR attendance synchronization."
                breadcrumbs={[{ label: 'Security' }, { label: 'Staff In-Out Register' }]}
            />

            <div className="grid gap-3 md:grid-cols-3">
                {[
                    { label: 'Staff Inside', value: activeMovements.filter(m => !m.trips.find(t => t.status === 'OUTSIDE')).length, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Staff Outside (Temp)', value: activeMovements.filter(m => m.trips.find(t => t.status === 'OUTSIDE')).length, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Completed Today', value: completedMovements.length, tone: 'bg-slate-50 text-slate-700' }
                ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border border-slate-100 px-4 py-3 ${item.tone}`}>
                        <p className="text-2xl font-extrabold">{item.value}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">{item.label}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-extrabold text-slate-950">New Staff Entry</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-3">
                        <StaffCombobox onSelect={handleStaffSelect} />
                    </div>
                    <Input label="Staff Name" value={selectedStaffDisplay ? `${selectedStaffDisplay.firstName || ''} ${selectedStaffDisplay.lastName || ''}`.trim() : ''} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                    <Input label="Employee ID" value={selectedStaffDisplay?.empId || ''} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={createEntry.isPending || !selectedStaffId}
                            className="h-11 w-full rounded-xl bg-primary-600 px-4 text-sm font-extrabold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                        >
                            {createEntry.isPending ? 'Recording...' : 'Record Initial Entry'}
                        </button>
                    </div>
                </div>
            </form>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">Active Staff</h2>
                        <p className="text-sm font-bold text-slate-500">Staff currently inside the premises or outside on temporary trips.</p>
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

                <FilterSection searchQuery={searchQuery} onSearchChange={(event) => setSearchQuery(event.target.value)} searchPlaceholder="Search staff, employee ID, department..." />

                <div className="min-h-[320px]">
                    <DataTable
                        data={filteredMovements}
                        columns={columns}
                        keyExtractor={(entry) => entry.id}
                        isLoading={isLoading}
                        emptyStateMessage={activeMovements.length > 0 ? 'No active staff match the current search.' : 'No staff movements are currently active.'}
                        actions={(entry) => {
                            const isOutside = entry.trips.some(t => t.status === 'OUTSIDE')
                            return (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDetailModalMovement(entry)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 border border-slate-200"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Details
                                    </button>
                                    
                                    {isOutside ? (
                                        <button
                                            type="button"
                                            onClick={() => handleReturn(entry)}
                                            disabled={recordReturn.isPending}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                        >
                                            <LogIn className="h-3.5 w-3.5" />
                                            Return
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setTempExitModalMovement(entry)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700 hover:bg-amber-100"
                                            >
                                                <Clock className="h-3.5 w-3.5" />
                                                Temp Exit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFinalExit(entry)}
                                                disabled={recordFinalExit.isPending}
                                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                Final Exit
                                            </button>
                                        </>
                                    )}
                                </div>
                            )
                        }}
                    />
                </div>
            </section>

            <StaffTempExitModal 
                movement={tempExitModalMovement} 
                onClose={() => setTempExitModalMovement(null)} 
            />
            
            <StaffMovementDetailModal
                movement={detailModalMovement}
                onClose={() => setDetailModalMovement(null)}
            />
        </div>
    )
}
