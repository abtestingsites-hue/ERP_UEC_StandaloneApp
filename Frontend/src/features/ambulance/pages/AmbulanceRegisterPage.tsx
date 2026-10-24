import { useMemo, useState } from 'react'
import { Ambulance, ClipboardList, IndianRupee, PhoneCall, Radio, Truck, Users, Wrench } from 'lucide-react'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { formatDateTime } from '../../healthcare/utils'
import { useAmbulanceRecords, useCreateAmbulanceRecord, useUpdateAmbulanceStatus } from '../hooks/useAmbulance'
import type { AmbulanceField, AmbulanceRecord, AmbulanceRecordType } from '../types'

interface AmbulanceRegisterConfig {
    type: AmbulanceRecordType
    title: string
    subtitle: string
    addLabel: string
    emptyMessage: string
    initialStatus: string
    fields: AmbulanceField[]
    columns: { key: string; header: string }[]
    statuses: string[]
}

const iconByType: Record<AmbulanceRecordType, typeof Ambulance> = {
    BOOKING: Ambulance,
    DISPATCH: Radio,
    FLEET: Truck,
    STAFF_ASSIGNMENT: Users,
    TRIP_SHEET: ClipboardList,
    MAINTENANCE: Wrench,
    BILLING: IndianRupee,
    EMERGENCY_CALL: PhoneCall
}

const statusLabel = (status: string) => status.replace(/_/g, ' ')

const valueText = (value: unknown) => String(value ?? '-')

export function AmbulanceRegisterPage({ config }: { config: AmbulanceRegisterConfig }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [formData, setFormData] = useState<Record<string, string>>(() => (
        Object.fromEntries(config.fields.map((field) => [field.key, '']))
    ))

    const { data: records = [], isLoading } = useAmbulanceRecords(config.type)
    const createRecord = useCreateAmbulanceRecord(config.type)
    const updateStatus = useUpdateAmbulanceStatus(config.type)

    const Icon = iconByType[config.type]

    const visibleRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return records

        return records.filter((record) => (
            [record.status, record.entityId, ...config.fields.map((field) => record[field.key])]
                .some((value) => valueText(value).toLowerCase().includes(query))
        ))
    }, [config.fields, records, searchQuery])

    const openCount = records.filter((record) => !['COMPLETED', 'CLOSED', 'PAID', 'RESOLVED'].includes(record.status)).length
    const completedCount = records.length - openCount
    const latestRecord = records[0]

    const resetForm = () => {
        setFormData(Object.fromEntries(config.fields.map((field) => [field.key, ''])))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        const payload = Object.fromEntries(
            config.fields.map((field) => [field.key, formData[field.key]?.trim() || ''])
        )

        await createRecord.mutateAsync({
            type: config.type,
            status: config.initialStatus,
            data: payload
        })

        resetForm()
        setDrawerOpen(false)
    }

    const columns: Column<AmbulanceRecord>[] = [
        { key: 'sno', header: 'S.No', cell: (_record, index) => index + 1, sortable: false },
        {
            key: 'record',
            header: config.columns[0]?.header || 'Record',
            cell: (record) => {
                const primaryKey = config.columns[0]?.key
                const secondaryKey = config.columns[1]?.key
                return (
                    <div className="flex min-w-[220px] items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                            <Icon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="font-extrabold text-slate-950">{valueText(primaryKey ? record[primaryKey] : record.entityId)}</p>
                            <p className="text-xs font-semibold text-slate-500">{valueText(secondaryKey ? record[secondaryKey] : record.entityId)}</p>
                        </div>
                    </div>
                )
            },
            sortable: false
        },
        ...config.columns.slice(1).map((column): Column<AmbulanceRecord> => ({
            key: column.key,
            header: column.header,
            cell: (record) => <span className="block max-w-[260px] truncate">{valueText(record[column.key])}</span>,
            sortable: true
        })),
        {
            key: 'status',
            header: 'Status',
            cell: (record) => <StatusHighlighter value={statusLabel(record.status)} />,
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
            header: 'Next Action',
            cell: (record) => {
                const currentIndex = config.statuses.indexOf(record.status)
                const nextStatus = currentIndex >= 0 ? config.statuses[currentIndex + 1] : undefined

                if (!nextStatus) return <span className="text-xs font-extrabold text-emerald-700">Closed</span>

                return (
                    <button
                        type="button"
                        onClick={() => updateStatus.mutate({ entityId: record.entityId, status: nextStatus, type: config.type })}
                        disabled={updateStatus.isPending}
                        className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-extrabold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                    >
                        Move to {statusLabel(nextStatus)}
                    </button>
                )
            },
            sortable: false
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title={config.title}
                subtitle={config.subtitle}
                breadcrumbs={[{ label: 'Ambulance' }, { label: config.title }]}
            />

            <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{records.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Total Records</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{openCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Open / Active</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                    <p className="text-2xl font-extrabold">{completedCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Closed</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-700 shadow-sm">
                    <p className="truncate text-2xl font-extrabold">{latestRecord ? statusLabel(latestRecord.status) : '-'}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide">Latest Status</p>
                </div>
            </div>

            <ActionBar onAdd={() => setDrawerOpen(true)} addLabel={config.addLabel} />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search live ambulance records..."
            />

            <DataTable
                data={visibleRecords}
                columns={columns}
                keyExtractor={(record) => record.entityId}
                isLoading={isLoading}
                emptyStateMessage={config.emptyMessage}
            />

            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={config.addLabel} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {config.fields.map((field) => (
                            <label key={field.key} className="block">
                                <span className="mb-1 block text-sm font-bold text-slate-700">{field.label}</span>
                                <input
                                    type={field.type || 'text'}
                                    required={field.required}
                                    value={formData[field.key] || ''}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20"
                                />
                            </label>
                        ))}
                    </div>
                    <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                        This saves live ambulance workflow data to the database for the selected unit. No demo records are used.
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Cancel</button>
                        <button type="submit" disabled={createRecord.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                            {createRecord.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}

export type { AmbulanceRegisterConfig }
