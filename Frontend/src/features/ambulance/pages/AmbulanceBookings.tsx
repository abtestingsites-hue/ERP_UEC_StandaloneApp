import { useMemo, useState } from 'react'
import { Ambulance } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useTrips, useCreateTrip } from '../hooks/useAmbulance'
import type { AmbulanceTrip } from '../types'

export function AmbulanceBookings() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        clientName: '',
        mobile: '',
        pickupLocation: '',
        destination: '',
        priority: '',
        tripNotes: ''
    })

    const { data: trips = [], isLoading } = useTrips()
    const createTrip = useCreateTrip()

    const visibleTrips = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return trips

        return trips.filter((t) => (
            [t.refNo, t.clientName, t.mobile, t.pickupLocation, t.destination, t.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [trips, searchQuery])

    const openCount = trips.filter((t) => !['COMPLETED', 'BILLED', 'CANCELLED'].includes(t.status)).length
    const completedCount = trips.length - openCount
    const latestTrip = trips[0]

    const resetForm = () => {
        setFormData({
            clientName: '',
            mobile: '',
            pickupLocation: '',
            destination: '',
            priority: '',
            tripNotes: ''
        })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await createTrip.mutateAsync(formData)
        resetForm()
        setDrawerOpen(false)
    }

    const columns: Column<AmbulanceTrip>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: 'Client / Booking',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Ambulance className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.clientName || 'Unknown Client'}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.refNo}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        { key: 'mobile', header: 'Mobile', cell: (r) => r.mobile || '-', sortable: true },
        { key: 'pickupLocation', header: 'Pickup', cell: (r) => <span className="block max-w-[200px] truncate">{r.pickupLocation || '-'}</span>, sortable: true },
        { key: 'destination', header: 'Destination', cell: (r) => <span className="block max-w-[200px] truncate">{r.destination || '-'}</span>, sortable: true },
        { key: 'priority', header: 'Priority', cell: (r) => r.priority || '-', sortable: true },
        {
            key: 'status',
            header: 'Status',
            cell: (record) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} />,
            sortable: true
        },
        {
            key: 'createdAt',
            header: 'Created',
            cell: (record) => formatDateTime(record.createdAt),
            sortable: true
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Ambulance Bookings"
                subtitle="Live ambulance booking requests created manually for dispatch follow-up."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Bookings' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{trips.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Bookings</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{openCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Active Bookings</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="truncate text-2xl font-extrabold">{latestTrip ? latestTrip.status.replace(/_/g, ' ') : '-'}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Latest Status</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Booking" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search bookings..."
            />

            <DataTable
                data={visibleTrips}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No live ambulance bookings found. Add a booking to start dispatch flow."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Booking" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Client / Patient Name</span>
                            <input
                                type="text"
                                required
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                placeholder="Enter client or patient name"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Mobile</span>
                            <input
                                type="text"
                                required
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="Contact number"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Pickup Location</span>
                            <input
                                type="text"
                                required
                                value={formData.pickupLocation}
                                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                placeholder="Pickup Location"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Destination</span>
                            <input
                                type="text"
                                required
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                placeholder="Destination"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Priority</span>
                            <input
                                type="text"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                placeholder="Emergency / Normal"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Notes</span>
                            <input
                                type="text"
                                value={formData.tripNotes}
                                onChange={(e) => setFormData({ ...formData, tripNotes: e.target.value })}
                                placeholder="Ambulance need, oxygen, stretcher..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                    </div>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This creates a new ambulance trip request (Status: REQUESTED).
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createTrip.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {createTrip.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
