import { useMemo, useState } from 'react'
import { Plus, Recycle, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useCreateWasteRecord, useUpdateWasteStatus, useWasteRecords } from '../hooks/useOperations'
import type { WasteRecord } from '../types'

const initialForm = {
    category: 'General Waste',
    source: '',
    quantity: 0,
    disposalMethod: 'Municipal pickup',
    remarks: ''
}

const getNextStatus = (status: WasteRecord['status']) => {
    if (status === 'COLLECTED') return 'SEGREGATED'
    if (status === 'SEGREGATED') return 'DISPOSED'
    if (status === 'DISPOSED') return 'COMPLETED'
    return null
}

export function WasteManagement() {
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form, setForm] = useState(initialForm)
    const { data: wasteRecords = [], isLoading } = useWasteRecords()
    const createWaste = useCreateWasteRecord()
    const updateWaste = useUpdateWasteStatus()

    const visibleRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return wasteRecords.filter((record) => !query || [
            record.category,
            record.source,
            record.disposalMethod,
            record.remarks || '',
            record.status
        ].some((value) => String(value).toLowerCase().includes(query)))
    }, [wasteRecords, searchQuery])

    const activeCount = wasteRecords.filter((record) => record.status !== 'COMPLETED').length
    const completedCount = wasteRecords.filter((record) => record.status === 'COMPLETED').length
    const totalQuantity = wasteRecords.reduce((sum, record) => sum + Number(record.quantity || 0), 0)

    const submitWaste = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!form.source.trim()) return

        createWaste.mutate({
            category: form.category,
            source: form.source.trim(),
            quantity: Number(form.quantity || 0),
            disposalMethod: form.disposalMethod,
            remarks: form.remarks.trim()
        }, {
            onSuccess: () => {
                setForm(initialForm)
                setIsModalOpen(false)
            }
        })
    }

    const columns: Column<WasteRecord>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'category',
            header: 'Waste Details',
            cell: (record) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Recycle className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">{record.category}</p>
                        <p className="text-xs font-semibold text-slate-500">{record.source}</p>
                    </div>
                </div>
            )
        },
        { key: 'quantity', header: 'Qty', cell: (record) => `${record.quantity || 0} kg`, sortable: true },
        { key: 'method', header: 'Disposal Method', cell: (record) => record.disposalMethod || '-' },
        { key: 'status', header: 'Status', cell: (record) => <StatusHighlighter value={record.status} />, sortable: true },
        { key: 'date', header: 'Updated', cell: (record) => formatDateTime(record.updatedAt || record.createdAt), sortable: true },
        {
            key: 'action',
            header: 'Action',
            sortable: false,
            cell: (record) => {
                const nextStatus = getNextStatus(record.status)
                if (!nextStatus) return <span className="text-sm font-extrabold text-slate-500">Closed</span>

                return (
                    <button
                        type="button"
                        onClick={() => updateWaste.mutate({ entityId: record.entityId, status: nextStatus })}
                        disabled={updateWaste.isPending}
                        className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Mark {nextStatus}
                    </button>
                )
            }
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Waste Management"
                subtitle="Live waste collection, segregation, disposal, and closure tracking."
                breadcrumbs={[{ label: 'Operations' }, { label: 'Waste Management' }]}
                action={
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Waste Record
                    </button>
                }
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{wasteRecords.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Records</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{activeCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Active Disposal</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Completed</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{totalQuantity}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Kg</p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
                <Trash2 className="mr-2 inline h-4 w-4" />
                Waste records are stored as live workflow entries and move through Collected, Segregated, Disposed, and Completed.
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search waste category, source, method, status..."
            />

            <DataTable
                data={visibleRecords}
                columns={columns}
                keyExtractor={(record) => record.id}
                isLoading={isLoading}
                emptyStateMessage="No live waste records found. Add a waste record to start tracking."
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
                    <form onSubmit={submitWaste} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="shrink-0 border-b border-slate-100 px-6 py-5">
                            <h2 className="text-xl font-extrabold text-slate-950">Add Waste Record</h2>
                        </div>
                        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5">
                            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                                Waste Category
                                <select
                                    value={form.category}
                                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                                    className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-primary-400"
                                >
                                    <option>General Waste</option>
                                    <option>Food Waste</option>
                                    <option>Medical Waste</option>
                                    <option>Laundry Waste</option>
                                    <option>Maintenance Waste</option>
                                    <option>Rag Waste</option>
                                </select>
                            </label>
                            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                                Source / Area
                                <input
                                    value={form.source}
                                    onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                                    placeholder="Kitchen, ward, laundry, maintenance..."
                                    className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-primary-400"
                                />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                                    Quantity Kg
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.quantity}
                                        onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                                        className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-primary-400"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                                    Disposal Method
                                    <input
                                        value={form.disposalMethod}
                                        onChange={(event) => setForm((current) => ({ ...current, disposalMethod: event.target.value }))}
                                        className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-primary-400"
                                    />
                                </label>
                            </div>
                            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                                Remarks
                                <textarea
                                    value={form.remarks}
                                    onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
                                    rows={3}
                                    className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-primary-400"
                                />
                            </label>
                        </div>
                        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-5">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createWaste.isPending || !form.source.trim()}
                                className="rounded-xl bg-primary-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Save Waste
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
