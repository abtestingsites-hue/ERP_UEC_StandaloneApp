import { useMemo, useState } from 'react'
import { Stethoscope, Clock, CheckCircle2, PlayCircle, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useMedicalAssignments, useUpdateMedicalAssignmentStatus } from '../hooks/useMedical'
import { useAuthStore } from '../../../store/authStore'
import { formatDateTime } from '../../healthcare/utils'

export function DoctorDuty() {
    const [searchQuery, setSearchQuery] = useState('')
    const user = useAuthStore((state) => state.user)
    const isDoctor = user?.role === 'MEDICAL_DOCTOR'

    const { data: assignments = [], isLoading } = useMedicalAssignments({ staffId: isDoctor ? user?.id : undefined })
    const updateStatus = useUpdateMedicalAssignmentStatus()

    const visibleAssignments = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return assignments.filter((a) => !query || [
            a.staff?.firstName,
            a.staff?.lastName,
            a.dutyType,
            a.status
        ].some(val => String(val || '').toLowerCase().includes(query)))
    }, [assignments, searchQuery])

    const myAssignments = isDoctor ? assignments : []
    const pendingCount = myAssignments.filter(a => a.status === 'ASSIGNED').length
    const inProgressCount = myAssignments.filter(a => a.status === 'IN_PROGRESS').length
    const completedCount = myAssignments.filter(a => a.status === 'COMPLETED').length

    const handleClockIn = async (id: string) => {
        await updateStatus.mutateAsync({ id, status: 'IN_PROGRESS', notes: 'Clocked in to duty' })
    }

    const handleClockOut = async (id: string) => {
        await updateStatus.mutateAsync({ id, status: 'COMPLETED', notes: 'Clocked out of duty' })
    }

    const columns: Column<any>[] = [
        { key: 'refNo', header: 'Ref No', cell: (a) => <span className="font-mono text-xs font-bold text-gray-500">{a.refNo}</span> },
        { 
            key: 'doctor', 
            header: 'Doctor', 
            cell: (a) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <Stethoscope className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="font-extrabold text-slate-950">Dr. {a.staff?.firstName} {a.staff?.lastName}</p>
                        <p className="text-xs font-semibold text-slate-500">{a.dutyType}</p>
                    </div>
                </div>
            ) 
        },
        { key: 'startAt', header: 'Start Time', cell: (a) => formatDateTime(a.startAt), sortable: true },
        { key: 'endAt', header: 'End Time', cell: (a) => a.endAt ? formatDateTime(a.endAt) : '-' },
        { key: 'status', header: 'Status', cell: (a) => <StatusHighlighter value={a.status} /> },
        {
            key: 'actions',
            header: 'Duty Actions',
            cell: (a) => (
                <div className="flex flex-wrap gap-2">
                    {a.status === 'ASSIGNED' && (isDoctor ? a.staffId === user?.id : true) && (
                        <button
                            type="button"
                            onClick={() => handleClockIn(a.id)}
                            disabled={updateStatus.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                            <PlayCircle className="h-3.5 w-3.5" /> Start Time (Clock In)
                        </button>
                    )}
                    {a.status === 'IN_PROGRESS' && (isDoctor ? a.staffId === user?.id : true) && (
                        <button
                            type="button"
                            onClick={() => handleClockOut(a.id)}
                            disabled={updateStatus.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" /> End Time (Clock Out)
                        </button>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Doctor Duty Schedule"
                subtitle="Manage doctor duty assignments, clock-ins, and shift tracking."
                breadcrumbs={[{ label: 'Medical' }, { label: 'Doctor Duty' }]}
            />

            {isDoctor && (
                <div className="mb-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700 shadow-sm">
                        <p className="text-2xl font-extrabold">{pendingCount}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">Upcoming Duties</p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700 shadow-sm">
                        <p className="text-2xl font-extrabold">{inProgressCount}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">Active Shift</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                        <p className="text-2xl font-extrabold">{completedCount}</p>
                        <p className="text-xs font-extrabold uppercase tracking-wide">Completed Duties</p>
                    </div>
                </div>
            )}

            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                <Clock className="mr-2 inline h-4 w-4" />
                Doctors can start and end their duty time directly from this board to update their Medical Assignment Status.
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search doctor or duty type..."
            />

            <DataTable
                data={visibleAssignments}
                columns={columns}
                keyExtractor={(a) => a.id}
                isLoading={isLoading}
                emptyStateMessage="No doctor duty assignments found."
            />
        </div>
    )
}
