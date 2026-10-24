import { useMemo, useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff } from '../hooks/useHR'

export function TrainingCompliance() {
    const { data: staff = [] } = useStaff()
    const [searchQuery, setSearchQuery] = useState('')

    const trainingRows = useMemo(() => {
        if (staff.length === 0) return []

        const programs = ['Patient Handling', 'Hygiene Protocol', 'Emergency Response', 'Medication Support']
        return staff.slice(0, 12).map((s, index) => ({
            id: `${s.id}-training`,
            empId: s.empId,
            name: s.name,
            program: programs[index % programs.length],
            completedOn: index % 3 === 0 ? '-' : `2026-04-${String(8 + index).padStart(2, '0')}`,
            renewalDue: `2026-${String(7 + (index % 5)).padStart(2, '0')}-${String(12 + index).padStart(2, '0')}`,
            status: index % 3 === 0 ? 'Pending' : index % 4 === 0 ? 'Due Soon' : 'Completed'
        }))
    }, [staff])

    const filteredData = useMemo(() => {
        return trainingRows.filter((row) =>
            (row.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.empId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.program || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [trainingRows, searchQuery])

    const columns: Column<any>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'program', header: 'Training Program' },
        { key: 'completedOn', header: 'Completed On' },
        { key: 'renewalDue', header: 'Renewal Due' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Training & Compliance"
                subtitle="Track mandatory care training and renewal readiness."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Training & Compliance' }]}
            />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search training records..." />
            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(row) => row.id}
                emptyStateMessage="No training records found"
            />
        </div>
    )
}
