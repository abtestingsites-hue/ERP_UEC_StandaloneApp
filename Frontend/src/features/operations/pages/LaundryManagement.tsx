import { useMemo, useState } from 'react'
import { Shirt, Workflow } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useCreateLaundryRecord, useLaundryRecords, useOperationsPatients, useUpdateLaundryStatus } from '../hooks/useOperations'
import type { LaundryRecord } from '../types'

const laundryStatuses = ['COLLECTED', 'WASHING', 'READY', 'DELIVERED', 'COMPLETED']

const statusLabel = (status: string) => status.replace(/_/g, ' ')

export function LaundryManagement() {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({ patientId: '', status: 'COLLECTED' })

    const { data: patients = [], isLoading: patientsLoading } = useOperationsPatients()
    const { data: laundryRecords = [], isLoading: laundryLoading } = useLaundryRecords()
    const createLaundry = useCreateLaundryRecord()
    const updateLaundry = useUpdateLaundryStatus()

    const visibleRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return laundryRecords.filter((record) => !query || [
            record.patient?.name || '',
            record.status,
            record.id
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [laundryRecords, searchQuery])

    const openRecords = laundryRecords.filter((record) => record.status !== 'COMPLETED').length
    const completedRecords = laundryRecords.filter((record) => record.status === 'COMPLETED').length

    const handleCreateLaundry = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!formData.patientId) return

        await createLaundry.mutateAsync({
            patientId: formData.patientId,
            status: formData.status
        })

        setFormData({ patientId: '', status: 'COLLECTED' })
        setDrawerOpen(false)
    }

    const columns: Column<LaundryRecord>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'patient',
            header: 'Patient',
            cell: (record) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Shirt className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.patient?.name || 'Patient'}</p>
                        <p className="text-xs font-semibold text-slate-500">Laundry record</p>
                    </div>
                </div>
            )
        },
        { key: 'status', header: 'Status', cell: (record) => <StatusHighlighter value={statusLabel(record.status)} /> },
        { key: 'createdAt', header: 'Created', cell: (record) => formatDateTime(record.createdAt), sortable: true },
        { key: 'updatedAt', header: 'Updated', cell: (record) => formatDateTime(record.updatedAt), sortable: true },
        {
            key: 'nextAction',
            header: 'Next Action',
            cell: (record) => {
                const currentIndex = laundryStatuses.indexOf(record.status)
                const nextStatus = currentIndex >= 0 ? laundryStatuses[currentIndex + 1] : 'WASHING'

                if (!nextStatus) {
                    return <span className="text-xs font-extrabold text-emerald-700">Closed</span>
                }

                return (
                    <button
                        type="button"
                        onClick={() => updateLaundry.mutate({ id: record.id, status: nextStatus })}
                        disabled={updateLaundry.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                    >
                        <Workflow className="h-3.5 w-3.5" />
                        Move to {statusLabel(nextStatus)}
                    </button>
                )
            }
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Laundry Management"
                subtitle="Live patient laundry register with collection, washing, ready, delivered and completed movement."
                breadcrumbs={[{ label: 'Operations' }, { label: 'Laundry Management' }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{laundryRecords.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Records</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{openRecords}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Open Laundry</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedRecords}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{patients.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Patients Available</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel="Add Laundry" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search patient, status, record..."
            />

            <DataTable
                data={visibleRecords}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={patientsLoading || laundryLoading}
                emptyStateMessage="No live laundry records found. Add laundry for an existing patient."
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Laundry Record" size="md">
                <form onSubmit={handleCreateLaundry} className="space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Patient</span>
                        <select
                            required
                            value={formData.patientId}
                            onChange={(event) => setFormData((prev) => ({ ...prev, patientId: event.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">{patients.length ? 'Select patient' : 'No live patients found'}</option>
                            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700">Starting Status</span>
                        <select
                            value={formData.status}
                            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            {laundryStatuses.slice(0, 3).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                    </label>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This uses real patient records from the tenant and saves the laundry movement to the current operations unit.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createLaundry.isPending || !patients.length} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {createLaundry.isPending ? 'Saving...' : 'Save Laundry'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
