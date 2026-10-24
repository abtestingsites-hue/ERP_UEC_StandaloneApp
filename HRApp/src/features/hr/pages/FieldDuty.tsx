import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { ActionBar } from '../../../components/ActionBar'
import { DataTable, type Column } from '../../../components/DataTable'
import { Drawer } from '../../../components/Drawer'
import { FilterSection } from '../../../components/FilterSection'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff } from '../hooks/useHR'

export function FieldDuty() {
    const navigate = useNavigate()
    const { data: staff = [] } = useStaff()
    const [duties, setDuties] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState({
        staffId: '',
        staff: '',
        role: '',
        dutyType: 'Patient Visit',
        location: '',
        dutyDate: '',
        startTime: '',
        endTime: '',
        status: 'Assigned'
    })

    const staffOptions = useMemo(() => {
        const options = staff
            .filter((member) => {
                const status = String(member.status || '').trim().toLowerCase()
                return !member.isDeleted && status !== 'terminated' && status !== 'resigned'
            })
            .map((member) => ({
                value: member.id,
                label: `${member.name}${member.empId ? ` (${member.empId})` : ''} - ${member.role || 'Staff'}`
            }))

        return options
    }, [staff])

    const filteredDuties = useMemo(() => {
        return duties.filter((duty) => {
            const matchesSearch =
                (duty.staff || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (duty.dutyType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (duty.location || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'ALL' || duty.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [duties, searchQuery, statusFilter])

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = staff.find((member) => member.id === staffId)
        setFormData((current) => ({
            ...current,
            staffId,
            staff: selectedStaff?.name || '',
            role: selectedStaff?.role || current.role
        }))
    }

    const resetForm = () => {
        setFormData({
            staffId: '',
            staff: '',
            role: '',
            dutyType: 'Patient Visit',
            location: '',
            dutyDate: '',
            startTime: '',
            endTime: '',
            status: 'Assigned'
        })
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        setDuties((current) => [
            {
                id: `FD-${2000 + current.length + 1}`,
                staff: formData.staff || 'Unassigned Staff',
                role: formData.role || 'Staff',
                dutyType: formData.dutyType,
                location: formData.location,
                dutyDate: formData.dutyDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                status: formData.status
            },
            ...current
        ])
        resetForm()
        setIsDrawerOpen(false)
    }

    const createAllowanceClaim = (duty: any) => {
        navigate('/finance/allowance-tracking', {
            state: {
                allowanceDraft: {
                    staff: duty.staff,
                    role: duty.role,
                    purpose: `${duty.dutyType} - ${duty.location}`,
                    tripDate: duty.dutyDate,
                    fromLocation: 'UNI Senth',
                    toLocation: duty.location
                }
            }
        })
    }

    const columns: Column<any>[] = [
        { key: 'id', header: 'Duty ID', sortable: true },
        { key: 'staff', header: 'Staff' },
        { key: 'role', header: 'Role' },
        { key: 'dutyType', header: 'Duty Type' },
        { key: 'location', header: 'Location' },
        { key: 'dutyDate', header: 'Date', sortable: true },
        { key: 'time', header: 'Time', cell: (row) => `${row.startTime} - ${row.endTime}` },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> },
        {
            key: 'allowance',
            header: 'Allowance',
            cell: (row) => (
                row.status === 'Completed' ? (
                    <button
                        onClick={() => createAllowanceClaim(row)}
                        className="rounded-xl bg-[#0F969C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#294D61] transition-colors"
                    >
                        Create Claim
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Complete duty first</span>
                )
            )
        }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Field Duty"
                subtitle="Assign and monitor staff visits that may later create allowance claims."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Field Duty' }]}
            />

            <ActionBar onAdd={() => setIsDrawerOpen(true)} addLabel="Assign Field Duty" />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(event) => setSearchQuery(event.target.value)}
                searchPlaceholder="Search staff, duty type, or location..."
                filters={[
                    {
                        name: 'status',
                        value: statusFilter,
                        onChange: (event) => setStatusFilter(event.target.value),
                        options: [
                            { value: 'ALL', label: 'All Status' },
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Assigned', label: 'Assigned' },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'Cancelled', label: 'Cancelled' }
                        ]
                    }
                ]}
            />

            <DataTable
                data={filteredDuties}
                columns={columns}
                keyExtractor={(row) => row.id}
                emptyStateMessage="No field duty assignments found"
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Assign Field Duty" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Staff"
                            value={formData.staffId}
                            onChange={(event) => handleStaffChange(event.target.value)}
                            options={staffOptions}
                            placeholder="Select staff"
                            required
                        />
                        <Input label="Role" value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} placeholder="Doctor / Nurse / Driver" required />
                        <Select
                            label="Duty Type"
                            value={formData.dutyType}
                            onChange={(event) => setFormData((current) => ({ ...current, dutyType: event.target.value }))}
                            options={[
                                { value: 'Patient Visit', label: 'Patient Visit' },
                                { value: 'Home Care Visit', label: 'Home Care Visit' },
                                { value: 'Hospital Transfer', label: 'Hospital Transfer' },
                                { value: 'Medicine Pickup', label: 'Medicine Pickup' },
                                { value: 'Vendor Visit', label: 'Vendor Visit' },
                                { value: 'Other', label: 'Other' }
                            ]}
                        />
                        <Input label="Location" value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Visit area / destination" required />
                        <Input label="Duty Date" type="date" value={formData.dutyDate} onChange={(event) => setFormData((current) => ({ ...current, dutyDate: event.target.value }))} required />
                        <Input label="Start Time" type="time" value={formData.startTime} onChange={(event) => setFormData((current) => ({ ...current, startTime: event.target.value }))} required />
                        <Input label="End Time" type="time" value={formData.endTime} onChange={(event) => setFormData((current) => ({ ...current, endTime: event.target.value }))} required />
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                            options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Assigned', label: 'Assigned' },
                                { value: 'Completed', label: 'Completed' },
                                { value: 'Cancelled', label: 'Cancelled' }
                            ]}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:border-white/10">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-[#0F969C] text-sm font-semibold text-white">
                            Save Duty
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
