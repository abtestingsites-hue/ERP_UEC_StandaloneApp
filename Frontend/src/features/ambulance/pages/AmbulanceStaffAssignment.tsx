import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useTrips } from '../hooks/useAmbulance'
import type { AmbulanceTrip } from '../types'

export function AmbulanceStaffAssignment() {
    const [searchQuery, setSearchQuery] = useState('')
    const { data: trips = [], isLoading } = useTrips()

    const assignedTrips = useMemo(() => 
        trips.filter(t => t.driverId && !['COMPLETED', 'BILLED', 'CANCELLED'].includes(t.status)),
    [trips])

    const visibleTrips = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return assignedTrips

        return assignedTrips.filter((t) => (
            [t.refNo, t.driver?.name, t.vehicle?.vehicleNo, t.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [assignedTrips, searchQuery])

    const columns: Column<AmbulanceTrip>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: 'Driver',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Users className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.driver?.name || 'Unknown'}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        { key: 'vehicle', header: 'Vehicle', cell: (r) => r.vehicle?.vehicleNo || '-', sortable: true },
        { key: 'bookingRef', header: 'Booking Ref', cell: (r) => r.refNo, sortable: true },
        {
            key: 'status',
            header: 'Trip Status',
            cell: (record) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} />,
            sortable: true
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Driver & Staff Assignment"
                subtitle="Read-only view of live ambulance duty assignments from Dispatch."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Staff Assignment' }]}
            />

            <div className="mb-5 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm font-semibold text-primary-800 shadow-sm">
                Staff assignment is now securely handled during the Dispatch phase. This screen provides a read-only view of active assignments.
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search assignments..."
            />

            <DataTable
                data={visibleTrips}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No active staff assignments found."
            />
        </div>
    )
}
