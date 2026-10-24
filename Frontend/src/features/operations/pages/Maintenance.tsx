import { useMemo, useState } from 'react'
import { Wrench } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useCreateMaintenanceRecord, useMaintenanceRecords, useUpdateMaintenanceStatus } from '../hooks/useOperations'
import type { MaintenanceRecord } from '../types'

const maintenanceStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

const statusLabel = (status: string) => status.replace(/_/g, ' ')

export function Maintenance() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({ type: '', status: 'PENDING' })

    const { data: records = [], isLoading } = useMaintenanceRecords()
    const createTicket = useCreateMaintenanceRecord()
    const updateTicket = useUpdateMaintenanceStatus()

    const visibleRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return records.filter((record) => !query || [
            record.type,
            record.status,
            record.id
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [records, searchQuery])

    const openTickets = records.filter((record) => record.status !== 'COMPLETED').length
    const inProgressTickets = records.filter((record) => record.status === 'IN_PROGRESS').length
    const completedTickets = records.filter((record) => record.status === 'COMPLETED').length

    const handleCreateTicket = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!formData.type.trim()) return

        await createTicket.mutateAsync({
            type: formData.type.trim(),
            status: formData.status
        })

        setFormData({ type: '', status: 'PENDING' })
        setDrawerOpen(false)
    }

    const columns: Column<MaintenanceRecord>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'type',
            header: 'Maintenance Ticket',
            cell: (record) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                        <Wrench className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.type}</p>
                        <p className="text-xs font-semibold text-slate-500">Facility maintenance</p>
                    </div>
                </div>
            ),
            sortable: true
        },
        { key: 'status', header: 'Status', cell: (record) => <StatusHighlighter value={statusLabel(record.status)} /> },
        { key: 'createdAt', header: 'Created', cell: (record) => formatDateTime(record.createdAt), sortable: true },
        { key: 'updatedAt', header: 'Updated', cell: (record) => formatDateTime(record.updatedAt), sortable: true },
        {
            key: 'nextAction',
            header: 'Next Action',
            cell: (record) => {
                const currentIndex = maintenanceStatuses.indexOf(record.status)
                const nextStatus = currentIndex >= 0 ? maintenanceStatuses[currentIndex + 1] : 'IN_PROGRESS'

                if (!nextStatus) return <span className="text-xs font-extrabold text-emerald-700">Closed</span>

                return (
                    <button
                        type="button"
                        onClick={() => updateTicket.mutate({ id: record.id, status: nextStatus })}
                        disabled={updateTicket.isPending}
                        className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                    >
                        Move to {statusLabel(nextStatus)}
                    </button>
                )
            }
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Maintenance"
                subtitle="Live facility maintenance tickets for the selected operations unit."
                breadcrumbs={[{ label: 'Operations' }, { label: 'Maintenance' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{records.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Tickets</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{openTickets}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Open Tickets</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{inProgressTickets}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">In Progress</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedTickets}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Ticket" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search maintenance ticket, status..."
            />

            <DataTable
                data={visibleRecords}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No live maintenance tickets found. Add a ticket to start tracking."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Maintenance Ticket" size="md">
                <form onSubmit={handleCreateTicket} className="space-y-4">
                    <Input
                        label="Maintenance Type / Issue"
                        required
                        value={formData.type}
                        onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                        placeholder="Room light repair, plumbing leak, bed service..."
                    />
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Starting Status</span>
                        <select
                            value={formData.status}
                            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            {maintenanceStatuses.slice(0, 2).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                    </label>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This saves to the live Maintenance table. No demo entries are used.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createTicket.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {createTicket.isPending ? 'Saving...' : 'Save Ticket'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
