import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useTrips, useUpdateTripStatus } from '../hooks/useAmbulance'
import type { AmbulanceTrip } from '../types'

export function TripSheets() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerState, setDrawerState] = useState<{ isOpen: boolean; trip: AmbulanceTrip | null; action: string | null }>({
        isOpen: false,
        trip: null,
        action: null
    })
    const [formData, setFormData] = useState({ kmStart: '', kmEnd: '', totalAmount: '' })

    const { data: trips = [], isLoading } = useTrips()
    const updateTripStatus = useUpdateTripStatus()

    const activeTrips = useMemo(() => 
        trips.filter(t => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'BILLED'].includes(t.status)),
    [trips])

    const visibleTrips = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return activeTrips

        return activeTrips.filter((t) => (
            [t.refNo, t.vehicle?.vehicleNo, t.driver?.name, t.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [activeTrips, searchQuery])

    const openCount = activeTrips.filter((t) => !['COMPLETED', 'BILLED'].includes(t.status)).length
    const completedCount = activeTrips.filter((t) => ['COMPLETED', 'BILLED'].includes(t.status)).length

    const resetForm = () => setFormData({ kmStart: '', kmEnd: '', totalAmount: '' })

    const handleActionClick = (trip: AmbulanceTrip, action: string) => {
        setDrawerState({ isOpen: true, trip, action })
        resetForm()
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const { trip, action } = drawerState
        if (!trip || !action) return

        let payload: any = { status: action }

        if (action === 'EN_ROUTE') {
            payload.kmStart = Number(formData.kmStart)
        } else if (action === 'COMPLETED') {
            payload.kmEnd = Number(formData.kmEnd)
        } else if (action === 'BILLED') {
            payload.totalAmount = Number(formData.totalAmount)
        }

        await updateTripStatus.mutateAsync({ id: trip.id, payload })
        setDrawerState({ isOpen: false, trip: null, action: null })
        resetForm()
    }

    const columns: Column<AmbulanceTrip>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: 'Booking Ref',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <ClipboardList className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.refNo}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        { key: 'vehicle', header: 'Vehicle', cell: (r) => r.vehicle?.vehicleNo || '-', sortable: true },
        { key: 'driver', header: 'Driver', cell: (r) => r.driver?.name || '-', sortable: true },
        { key: 'kmStart', header: 'KM Start', cell: (r) => r.kmStart !== null ? r.kmStart : '-', sortable: true },
        { key: 'kmEnd', header: 'KM End', cell: (r) => r.kmEnd !== null ? r.kmEnd : '-', sortable: true },
        {
            key: 'status',
            header: 'Status',
            cell: (record) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} />,
            sortable: true
        },
        {
            key: 'nextAction',
            header: 'Next Action',
            cell: (record) => {
                let nextStatus = ''
                if (record.status === 'DISPATCHED') nextStatus = 'EN_ROUTE'
                else if (record.status === 'EN_ROUTE') nextStatus = 'ARRIVED'
                else if (record.status === 'ARRIVED') nextStatus = 'COMPLETED'
                else if (record.status === 'COMPLETED') nextStatus = 'BILLED'

                if (!nextStatus) return <span className="text-xs font-extrabold text-slate-500">Done</span>

                return (
                    <button
                        type="button"
                        onClick={() => handleActionClick(record, nextStatus)}
                        disabled={updateTripStatus.isPending}
                        className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                    >
                        Mark {nextStatus.replace(/_/g, ' ')}
                    </button>
                )
            },
            sortable: false
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Trip Sheets"
                subtitle="Live trip sheet records for ambulance trips, kilometres, and closure."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Trip Sheets' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{activeTrips.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Trip Sheets</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{openCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Active Trips</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed / Billed</p>
                </div>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search trip sheets..."
            />

            <DataTable
                data={visibleTrips}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No live trip sheets found. Dispatched trips will appear here."
            />

            <Drawer isOpen={drawerState.isOpen} onClose={() => setDrawerState({ isOpen: false, trip: null, action: null })} title={`Mark ${drawerState.action?.replace(/_/g, ' ')}`} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {drawerState.action === 'EN_ROUTE' && (
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">KM Start Reading</span>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.kmStart}
                                onChange={(e) => setFormData({ ...formData, kmStart: e.target.value })}
                                placeholder="Enter starting kilometers"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                    )}
                    {drawerState.action === 'COMPLETED' && (
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">KM End Reading</span>
                            <input
                                type="number"
                                required
                                min={drawerState.trip?.kmStart || 0}
                                value={formData.kmEnd}
                                onChange={(e) => setFormData({ ...formData, kmEnd: e.target.value })}
                                placeholder="Enter ending kilometers"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                    )}
                    {drawerState.action === 'BILLED' && (
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Total Bill Amount</span>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                placeholder="Enter total amount"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                    )}
                    {(drawerState.action === 'ARRIVED') && (
                        <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                            Confirm that the ambulance has arrived at the destination.
                        </div>
                    )}
                    {drawerState.action === 'COMPLETED' && (
                        <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                            Completing this trip will release the vehicle back to AVAILABLE status.
                        </div>
                    )}
                    {drawerState.action === 'BILLED' && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            Note: Finance and accounting integration is pending (Phase 3B-4). This will only update the trip status.
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerState({ isOpen: false, trip: null, action: null })} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={updateTripStatus.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {updateTripStatus.isPending ? 'Saving...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
