import { useMemo, useState } from 'react'
import { Truck } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useVehicles, useCreateVehicle, useUpdateVehicleStatus } from '../hooks/useAmbulance'
import type { AmbulanceVehicle, VehicleStatus } from '../types'

export function VehicleFleet() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        vehicleNo: '',
        type: '',
        baseLocation: ''
    })

    const { data: vehicles = [], isLoading } = useVehicles()
    const createVehicle = useCreateVehicle()
    const updateStatus = useUpdateVehicleStatus()

    const visibleVehicles = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return vehicles

        return vehicles.filter((v) => (
            [v.vehicleNo, v.type, v.baseLocation, v.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [vehicles, searchQuery])

    const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length
    const onTripCount = vehicles.filter((v) => v.status === 'ON_TRIP').length
    const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length

    const resetForm = () => {
        setFormData({ vehicleNo: '', type: '', baseLocation: '' })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await createVehicle.mutateAsync(formData)
        resetForm()
        setDrawerOpen(false)
    }

    const columns: Column<AmbulanceVehicle>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'vehicle',
            header: 'Vehicle No.',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Truck className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.vehicleNo}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.type}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        {
            key: 'baseLocation',
            header: 'Base Location',
            cell: (record) => <span className="block max-w-[260px] truncate">{record.baseLocation || '-'}</span>,
            sortable: true
        },
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
        },
        {
            key: 'nextAction',
            header: 'Actions',
            cell: (record) => {
                if (record.status === 'AVAILABLE') {
                    return (
                        <button
                            type="button"
                            onClick={() => updateStatus.mutate({ id: record.id, status: 'MAINTENANCE' })}
                            disabled={updateStatus.isPending}
                            className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                        >
                            Move to Maintenance
                        </button>
                    )
                }
                if (record.status === 'MAINTENANCE') {
                    return (
                        <button
                            type="button"
                            onClick={() => updateStatus.mutate({ id: record.id, status: 'AVAILABLE' })}
                            disabled={updateStatus.isPending}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                        >
                            Mark Available
                        </button>
                    )
                }
                return <span className="text-xs font-extrabold text-amber-700">On Trip</span>
            },
            sortable: false
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Vehicle & Fleet"
                subtitle="Live ambulance vehicle register and readiness status."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Vehicle & Fleet' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{vehicles.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Vehicles</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{availableCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Available</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{onTripCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">On Trip</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{maintenanceCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Maintenance</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Vehicle" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search vehicles..."
            />

            <DataTable
                data={visibleVehicles}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No live ambulance vehicles found. Add a vehicle to start fleet tracking."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Vehicle" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Vehicle No.</span>
                            <input
                                type="text"
                                required
                                value={formData.vehicleNo}
                                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                placeholder="TN 00 AB 0000"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Vehicle Type</span>
                            <input
                                type="text"
                                required
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                placeholder="Basic / ICU / Oxygen"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                        <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-bold text-slate-700">Base Location</span>
                            <input
                                type="text"
                                value={formData.baseLocation}
                                onChange={(e) => setFormData({ ...formData, baseLocation: e.target.value })}
                                placeholder="Base Location"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                            />
                        </label>
                    </div>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This saves live ambulance vehicle data to the database for the selected unit.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createVehicle.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {createVehicle.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
