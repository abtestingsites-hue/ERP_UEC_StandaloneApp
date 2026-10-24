import { useMemo, useState } from 'react'
import { FileText, Receipt } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useTrips, useGenerateAmbulanceInvoice } from '../hooks/useAmbulance'
import type { AmbulanceTrip } from '../types'

export function AmbulanceBilling() {
    const [searchQuery, setSearchQuery] = useState('')

    const { data: trips = [], isLoading } = useTrips()
    const generateInvoice = useGenerateAmbulanceInvoice()

    const billableTrips = useMemo(() => 
        trips.filter(t => ['COMPLETED', 'BILLED'].includes(t.status)),
    [trips])

    const visibleTrips = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return billableTrips

        return billableTrips.filter((t) => (
            [t.refNo, t.clientName, t.vehicle?.vehicleNo, t.status]
                .some((val) => String(val || '').toLowerCase().includes(query))
        ))
    }, [billableTrips, searchQuery])

    const unbilledCount = billableTrips.filter((t) => t.status === 'COMPLETED').length
    const billedCount = billableTrips.filter((t) => t.status === 'BILLED').length

    const handleGenerateInvoice = async (trip: AmbulanceTrip) => {
        if (!window.confirm(`Generate invoice for trip ${trip.refNo}?`)) return
        await generateInvoice.mutateAsync(trip.id)
    }

    const columns: Column<AmbulanceTrip>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: 'Trip / Client',
            cell: (record) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${record.status === 'BILLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-primary-50 text-primary-700'}`}>
                        {record.status === 'BILLED' ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.clientName || 'Unknown Client'}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.refNo}</p>
                    </div>
                </div>
            ),
            sortable: false
        },
        { key: 'pickupLocation', header: 'Pickup', cell: (r) => <span className="block max-w-[150px] truncate">{r.pickupLocation || '-'}</span>, sortable: true },
        { key: 'destination', header: 'Destination', cell: (r) => <span className="block max-w-[150px] truncate">{r.destination || '-'}</span>, sortable: true },
        { key: 'amount', header: 'Total Amount', cell: (r) => r.totalAmount ? `₹${r.totalAmount.toLocaleString()}` : '-', sortable: true },
        {
            key: 'status',
            header: 'Status',
            cell: (record) => <StatusHighlighter value={record.status.replace(/_/g, ' ')} />,
            sortable: true
        },
        {
            key: 'action',
            header: 'Action',
            cell: (record) => {
                if (record.status === 'COMPLETED') {
                    return (
                        <button
                            type="button"
                            onClick={() => handleGenerateInvoice(record)}
                            disabled={generateInvoice.isPending || (record.totalAmount || 0) <= 0}
                            className="rounded-lg bg-[#0F969C] px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#0b7479] disabled:opacity-60"
                        >
                            Generate Invoice
                        </button>
                    )
                }
                return <span className="text-xs font-extrabold text-emerald-700">Invoice Generated</span>
            },
            sortable: false
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Ambulance Billing"
                subtitle="Live ambulance billing records integrated with Finance."
                breadcrumbs={[{ label: 'Ambulance' }, { label: 'Billing' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{billableTrips.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Billable Trips</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{unbilledCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Pending Invoices</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{billedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Billed Invoices</p>
                </div>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search trips..."
            />

            <DataTable
                data={visibleTrips}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No completed or billed trips found."
            />
        </div>
    )
}
