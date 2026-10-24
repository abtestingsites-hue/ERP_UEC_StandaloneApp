import { CheckCircle2, Clock, Pill } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useClientPortalMedicines } from '../hooks/useClientPortal'
import type { ClientPortalMedicineSchedule } from '../services/clientPortal'

const formatDateTime = (value?: string | null) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'
}

const statusLabel = (status?: string) => {
    if (status === 'COMPLETED') return 'Administered'
    if (status === 'IN_PROGRESS') return 'Partially Given'
    return status || 'Scheduled'
}

export function ClientPortalMedicines() {
    const { data = [], isLoading } = useClientPortalMedicines()
    const totalDoses = data.reduce((sum, item) => sum + (Array.isArray(item.times) ? item.times.length : 0), 0)
    const givenDoses = data.reduce((sum, item) => sum + (Array.isArray(item.administeredSlots) ? item.administeredSlots.length : 0), 0)
    const pendingDoses = Math.max(0, totalDoses - givenDoses)

    const columns: Column<ClientPortalMedicineSchedule>[] = [
        {
            key: 'medicine',
            header: 'Medicine / Patient',
            cell: (item) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                        <Pill className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-gray-900">{item.medicineName}</p>
                        <p className="text-xs font-semibold text-gray-500">{item.patientName}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'dose',
            header: 'Dose Plan',
            cell: (item) => (
                <div>
                    <p className="font-bold text-gray-900">{item.dose}</p>
                    <p className="text-xs font-semibold text-gray-500">{item.frequency} from {item.startDate || '-'}</p>
                    <p className="text-xs text-gray-400">Issued qty: {item.issuedQuantity ?? '-'}</p>
                </div>
            )
        },
        {
            key: 'slots',
            header: 'Dose Status',
            cell: (item) => (
                <div className="flex flex-wrap gap-2">
                    {(item.times || []).map((slot) => {
                        const given = item.administeredSlots?.includes(slot)
                        return (
                            <span key={slot} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${given ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {given ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                {slot} {given ? 'Given' : 'Pending'}
                            </span>
                        )
                    })}
                </div>
            )
        },
        {
            key: 'lastGiven',
            header: 'Latest Given',
            cell: (item) => {
                const latest = item.administeredHistory?.[item.administeredHistory.length - 1]
                return latest ? (
                    <div>
                        <p className="font-bold text-gray-900">{latest.slot}</p>
                        <p className="text-xs font-semibold text-gray-500">{latest.administeredBy || 'Care staff'}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(latest.administeredAt)}</p>
                    </div>
                ) : <span className="text-xs font-semibold text-gray-400">No dose given yet</span>
            }
        },
        {
            key: 'status',
            header: 'Status',
            cell: (item) => <StatusHighlighter value={statusLabel(item.status)} />
        }
    ]

    return (
        <div className="space-y-5">
            <PageHeader
                title="My Medicines"
                subtitle="Read-only medicine schedule and dose administration history for your linked patient services."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'My Medicines' }]}
            />

            <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Schedules" value={data.length} tone="teal" />
                <SummaryCard label="Given Doses" value={givenDoses} tone="emerald" />
                <SummaryCard label="Pending Doses" value={pendingDoses} tone="amber" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                emptyStateMessage="No medicine schedules are linked to this family login yet."
            />
        </div>
    )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'emerald' | 'amber' }) {
    const classes = {
        teal: 'border-primary-100 bg-primary-50 text-primary-700',
        emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        amber: 'border-amber-100 bg-amber-50 text-amber-700'
    }

    return (
        <div className={`rounded-lg border p-4 ${classes[tone]}`}>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-wide">{label}</p>
        </div>
    )
}
