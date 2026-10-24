import { useMemo, useState } from 'react'
import { Radio } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Select } from '../../../components/Select'
import { StaffSelector } from '../../../components/StaffSelector'
import { formatDateTime } from '../../healthcare/utils'
import { useTrips, useUpdateTripStatus, useVehicles } from '../hooks/useAmbulance'
import type { AmbulanceTrip } from '../types'

export function DispatchManagement() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        tripId: '',
        vehicleId: '',
        driverId: '',
        supportStaffId: ''
    })

    const { data: trips = [], isLoading: tripsLoading } = useTrips()
    const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles()
    const updateTripStatus = useUpdateTripStatus()

    const dispatchableTrips = useMemo(() => 
        trips.filter(t => ['REQUESTED', 'DISPATCH_READY'].includes(t.status)),
    [trips])

    const availableVehicles = useMemo(() => 
        vehicles.filter(v => v.status === 'AVAILABLE'),
    [vehicles])

    const visibleTrips = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return trips

        return trips.filter((t) => (
            [t.refNo, t.clientName, t.vehicle?.vehicleNo, t.driver?.name, t.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [trips, searchQuery])

    const dispatchedCount = trips.filter((t) => t.status === 'DISPATCHED').length
    const enRouteCount = trips.filter((t) => t.status === 'EN_ROUTE').length
    const arrivedCount = trips.filter((t) => t.status === 'ARRIVED').length

    const resetForm = () => {
        setFormData({
            tripId: '',
            vehicleId: '',
            driverId: '',
            supportStaffId: ''
        })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await updateTripStatus.mutateAsync({
            id: formData.tripId,
            payload: {
                status: 'DISPATCHED',
                vehicleId: formData.vehicleId,
                driverId: formData.driverId,
                supportStaffId: formData.supportStaffId || null,
                dispatchTime: new Date().toISOString()
            }
        })
        resetForm()
        setDrawerOpen(false)
    }

    const columns: Column<AmbulanceTrip>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: 'Booking Ref',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Radio className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.refNo}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.clientName || 'Unknown'}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        { key: 'vehicle', header: 'Ambulance', cell: (r) => r.vehicle?.vehicleNo || '-', sortable: true },
        { key: 'driver', header: 'Driver', cell: (r) => r.driver?.name || '-', sortable: true },
        { key: 'pickupLocation', header: 'Pickup', cell: (r) => <span className="block max-w-[150px] truncate">{r.pickupLocation || '-'}</span>, sortable: true },
        { key: 'destination', header: 'Destination', cell: (r) => <span className="block max-w-[150px] truncate">{r.destination || '-'}</span>, sortable: true },
        {
            key: 'status',
            header: 'Status',
            cell: (record) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} />,
            sortable: true
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Dispatch Management"
                subtitle="Live ambulance dispatch movement with vehicle and driver tracking."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Dispatch Management' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{trips.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Trips</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{dispatchedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Dispatched</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{enRouteCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">En Route</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{arrivedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Arrived</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Dispatch" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search dispatch records..."
            />

            <DataTable
                data={visibleTrips}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={tripsLoading}
                emptyStateMessage="No live dispatch records found. Add dispatch details after booking confirmation."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Dispatch" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Select
                            label="Select Booking/Trip"
                            required
                            className="md:col-span-2"
                            value={formData.tripId}
                            onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                            options={dispatchableTrips.map(t => ({
                                value: t.id,
                                label: `${t.refNo} - ${t.clientName || 'Unknown'} (${t.pickupLocation || 'No location'})`
                            }))}
                            placeholder={tripsLoading ? 'Loading trips...' : (dispatchableTrips.length === 0 ? 'No pending bookings available' : 'Select a booking')}
                            disabled={tripsLoading || dispatchableTrips.length === 0}
                        />
                        <Select
                            label="Assign Ambulance"
                            required
                            value={formData.vehicleId}
                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                            options={availableVehicles.map(v => ({
                                value: v.id,
                                label: `${v.vehicleNo} (${v.type})`
                            }))}
                            placeholder={vehiclesLoading ? 'Loading vehicles...' : (availableVehicles.length === 0 ? 'No available vehicles' : 'Select a vehicle')}
                            disabled={vehiclesLoading || availableVehicles.length === 0}
                        />
                        <StaffSelector
                            label="Assign Driver"
                            required
                            value={formData.driverId}
                            onChange={(id) => setFormData({ ...formData, driverId: id })}
                        />
                        <StaffSelector
                            label="Assign Support Staff (Optional)"
                            value={formData.supportStaffId}
                            onChange={(id) => setFormData({ ...formData, supportStaffId: id })}
                        />
                    </div>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This action will mark the trip as DISPATCHED and lock the selected ambulance (ON_TRIP).
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={updateTripStatus.isPending || !formData.tripId || !formData.vehicleId || !formData.driverId} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {updateTripStatus.isPending ? 'Dispatching...' : 'Dispatch'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
