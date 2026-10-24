import { useMemo, useState } from 'react'
import { Activity, CheckCircle2, PauseCircle, PlayCircle, Trash2, XCircle } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useToast } from '../../../components/Toast'
import {
    useCreateMedicalAssignment,
    useDeleteMedicalAssignment,
    useMedicalAssignments,
    useMedicalDashboard,
    useMedicalPatients,
    useMedicalStaff,
    useUpdateMedicalAssignmentStatus
} from '../hooks/useMedical'
import type { MedicalAssignment, MedicalAssignmentFormValues, MedicalAssignmentStatus, MedicalStaff } from '../types'
import { useAuthStore } from '../../../store/authStore'
import { useAuthorizedUnits } from '../../master/hooks/useUnit'

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
]

const dutyTypeOptions = [
    { value: 'ROUND', label: 'Medical Round' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'NURSING_CARE', label: 'Nursing Care' },
    { value: 'VITALS_REVIEW', label: 'Vitals Review' },
    { value: 'MEDICATION', label: 'Medication' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'FOLLOW_UP', label: 'Follow Up' }
]

const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' }
]

const toDateTimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
}

const createDefaultForm = (): MedicalAssignmentFormValues => ({
    staffId: '',
    patientId: '',
    dutyType: 'ROUND',
    role: '',
    location: '',
    startAt: toDateTimeLocalValue(new Date()),
    endAt: '',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    notes: ''
})

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString([], {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatStatus = (status: string) => status.replace(/_/g, ' ')

const staffFullName = (assignment: MedicalAssignment) => {
    const staff = assignment.staff
    if (!staff) return 'Unassigned'
    return `${staff.firstName} ${staff.lastName || ''}`.trim()
}

const medicalStaffName = (staff: MedicalStaff) => `${staff.firstName} ${staff.lastName || ''}`.trim()

const statusActionClass = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-[#0F969C] hover:text-[#0F969C] dark:border-white/10 dark:bg-black dark:text-gray-300'

export function MedicalMonitor() {
    const { toast } = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState<MedicalAssignmentFormValues>(createDefaultForm)

    const { data: staff = [] } = useMedicalStaff()
    const { data: patients = [] } = useMedicalPatients()
    const { data: dashboard } = useMedicalDashboard()
    const { data: assignments = [], isLoading } = useMedicalAssignments({
        search: searchQuery,
        status: statusFilter || undefined
    })

    const createAssignment = useCreateMedicalAssignment()
    const updateStatus = useUpdateMedicalAssignmentStatus()
    const deleteAssignment = useDeleteMedicalAssignment()

    const { data: units = [] } = useAuthorizedUnits()
    const activeUnitId = useAuthStore(state => state.activeUnitId)
    const currentUnitName = useMemo(() => {
        return units.find((u: any) => u.id === activeUnitId)?.name || 'Current Unit'
    }, [units, activeUnitId])

    const medicalStaffOptions = useMemo(() => {
        return staff.map((member) => ({
            value: member.id,
            label: `${medicalStaffName(member)} - ${member.designation || member.department || 'Medical Staff'} (${currentUnitName})`
        }))
    }, [staff, currentUnitName])

    const patientOptions = useMemo(() => ([
        { value: '', label: 'No patient linked' },
        ...patients.map((patient) => ({ value: patient.id, label: `${patient.name}${patient.elderId ? ` (${patient.elderId})` : ''} - ${currentUnitName}` }))
    ]), [patients, currentUnitName])

    const localSummary = useMemo(() => {
        const activeAssignments = assignments.filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status))
        const busyStaffIds = new Set(activeAssignments.map((item) => item.staffId))
        return {
            active: dashboard?.activeCount ?? activeAssignments.length,
            inProgress: dashboard?.statusCounts?.IN_PROGRESS ?? assignments.filter((item) => item.status === 'IN_PROGRESS').length,
            assigned: dashboard?.statusCounts?.ASSIGNED ?? assignments.filter((item) => item.status === 'ASSIGNED').length,
            busyStaff: dashboard?.staffSummary?.busy ?? busyStaffIds.size,
            criticalPriority: assignments.filter((item) => item.priority === 'CRITICAL' && !['COMPLETED', 'CANCELLED'].includes(item.status)).length,
            linkedPatients: new Set(assignments.map((item) => item.patientId).filter(Boolean)).size
        }
    }, [assignments, dashboard])

    const resetForm = () => setFormData(createDefaultForm())

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = staff.find((member) => member.id === staffId)
        setFormData((current) => ({
            ...current,
            staffId,
            role: selectedStaff?.designation || selectedStaff?.department || current.role
        }))
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        if (formData.startAt && formData.endAt && new Date(formData.endAt) < new Date(formData.startAt)) {
            toast({ type: 'error', title: 'Invalid Time', message: 'End time must be after start time' })
            return
        }

        createAssignment.mutate(formData, {
            onSuccess: () => {
                resetForm()
                setIsDrawerOpen(false)
            }
        })
    }

    const handleStatusChange = (assignment: MedicalAssignment, status: MedicalAssignmentStatus) => {
        updateStatus.mutate({ id: assignment.id, status })
    }

    const handleDelete = (assignment: MedicalAssignment) => {
        if (!window.confirm(`Remove ${assignment.refNo}?`)) return
        deleteAssignment.mutate(assignment.id)
    }

    const columns: Column<MedicalAssignment>[] = [
        { key: 'refNo', header: 'Ref No', sortable: true, cell: (row) => <span className="font-bold text-[#294D61]">{row.refNo}</span> },
        {
            key: 'staff',
            header: 'Doctor / Nurse',
            cell: (row) => (
                <div>
                    <div className="font-semibold">{staffFullName(row)}</div>
                    <div className="text-xs text-gray-500">{row.staff?.empId || '-'} · {row.role || row.staff?.designation || '-'}</div>
                </div>
            )
        },
        { key: 'patient', header: 'Patient', cell: (row) => row.patient?.name || '-' },
        { key: 'dutyType', header: 'Duty', cell: (row) => formatStatus(row.dutyType) },
        { key: 'location', header: 'Location', cell: (row) => row.location || '-' },
        { key: 'startAt', header: 'Start', sortable: true, cell: (row) => formatDateTime(row.startAt) },
        {
            key: 'workload',
            header: 'Workload',
            cell: (row) => row.staff ? `${row.staff.currentWorkload}/${row.staff.capacity}` : '-'
        },
        { key: 'priority', header: 'Priority', cell: (row) => <StatusHighlighter value={row.priority} /> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={formatStatus(row.status)} /> }
    ]

    const renderActions = (row: MedicalAssignment) => {
        const isTerminal = ['COMPLETED', 'CANCELLED'].includes(row.status)

        return (
            <div className="flex justify-end gap-2">
                {['PENDING', 'ASSIGNED'].includes(row.status) && (
                    <button title="Start" className={statusActionClass} onClick={() => handleStatusChange(row, 'IN_PROGRESS')}>
                        <PlayCircle className="h-4 w-4" />
                    </button>
                )}
                {row.status === 'IN_PROGRESS' && (
                    <button title="Hold" className={statusActionClass} onClick={() => handleStatusChange(row, 'ON_HOLD')}>
                        <PauseCircle className="h-4 w-4" />
                    </button>
                )}
                {row.status === 'ON_HOLD' && (
                    <button title="Resume" className={statusActionClass} onClick={() => handleStatusChange(row, 'IN_PROGRESS')}>
                        <Activity className="h-4 w-4" />
                    </button>
                )}
                {!isTerminal && (
                    <button title="Complete" className={statusActionClass} onClick={() => handleStatusChange(row, 'COMPLETED')}>
                        <CheckCircle2 className="h-4 w-4" />
                    </button>
                )}
                {!isTerminal && (
                    <button title="Cancel" className={statusActionClass} onClick={() => handleStatusChange(row, 'CANCELLED')}>
                        <XCircle className="h-4 w-4" />
                    </button>
                )}
                <button title="Remove" className={statusActionClass} onClick={() => handleDelete(row)}>
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Medical Monitor Dashboard"
                subtitle="Track critical clinical workload, active medical duties, patient links, staff capacity, and assignment status."
                breadcrumbs={[{ label: 'UHC' }, { label: 'Medical Monitor' }]}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {[
                    { label: 'Active Duties', value: localSummary.active },
                    { label: 'In Progress', value: localSummary.inProgress },
                    { label: 'Assigned', value: localSummary.assigned },
                    { label: 'Critical Priority', value: localSummary.criticalPriority },
                    { label: 'Patients Linked', value: localSummary.linkedPatients },
                    { label: 'Busy Staff', value: localSummary.busyStaff }
                ].map((metric) => (
                    <div key={metric.label} className="min-h-[104px] rounded-lg border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black">
                        <div className="text-xs font-bold uppercase text-gray-500">{metric.label}</div>
                        <div className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">{metric.value}</div>
                    </div>
                ))}
            </div>

            <ActionBar onAdd={() => setIsDrawerOpen(true)} addLabel="Assign Medical Duty" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search staff, patient, duty, location..."
                filters={[
                    {
                        name: 'status',
                        value: statusFilter,
                        onChange: (event) => setStatusFilter(event.target.value),
                        options: statusOptions
                    }
                ]}
            />

            <DataTable
                data={assignments}
                columns={columns}
                keyExtractor={(row) => row.id}
                actions={renderActions}
                actionsTitle="Status"
                isLoading={isLoading}
                emptyStateMessage="No medical assignments found"
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Assign Medical Duty" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Select
                            label="Doctor / Nurse"
                            value={formData.staffId}
                            onChange={(event) => handleStaffChange(event.target.value)}
                            options={medicalStaffOptions}
                            placeholder={medicalStaffOptions.length ? 'Select staff' : 'No doctors or nurses found'}
                            required
                        />
                        <Select
                            label="Patient"
                            value={formData.patientId || ''}
                            onChange={(event) => setFormData((current) => ({ ...current, patientId: event.target.value }))}
                            options={patientOptions}
                        />
                        <Select
                            label="Duty Type"
                            value={formData.dutyType}
                            onChange={(event) => setFormData((current) => ({ ...current, dutyType: event.target.value }))}
                            options={dutyTypeOptions}
                        />
                        <Input label="Role" value={formData.role || ''} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} placeholder="Doctor / Nurse" />
                        <Input label="Location" value={formData.location || ''} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Ward / room / visit area" />
                        <Select
                            label="Priority"
                            value={formData.priority}
                            onChange={(event) => setFormData((current) => ({ ...current, priority: event.target.value as any }))}
                            options={priorityOptions}
                        />
                        <Input label="Start Time" type="datetime-local" value={formData.startAt || ''} onChange={(event) => setFormData((current) => ({ ...current, startAt: event.target.value }))} required />
                        <Input label="End Time" type="datetime-local" min={formData.startAt || undefined} value={formData.endAt || ''} onChange={(event) => setFormData((current) => ({ ...current, endAt: event.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                            className="min-h-[96px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-white/10 dark:bg-black dark:text-gray-100"
                            placeholder="Clinical notes, handoff details, or special instructions"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-gray-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={createAssignment.isPending} className="rounded-xl bg-[#0F969C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            {createAssignment.isPending ? 'Saving...' : 'Save Duty'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
