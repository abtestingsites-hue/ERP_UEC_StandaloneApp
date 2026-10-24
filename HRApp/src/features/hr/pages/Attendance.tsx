import { useMemo, useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAttendanceLogs } from '../hooks/useHR'

const getLocalDateString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Attendance() {
    const [selectedDate, setSelectedDate] = useState(getLocalDateString())
    const { data = [], isLoading } = useAttendanceLogs({ scope: 'all', date: selectedDate })
    const [searchQuery, setSearchQuery] = useState('')

    const filteredData = useMemo(() => {
        return data.filter((row) =>
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.empId.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [data, searchQuery])

    const columns: Column<any>[] = [
        { key: 'date', header: 'Date', sortable: true },
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'checkIn', header: 'Check In Time' },
        { key: 'checkOut', header: 'Check Out Time' },
        { key: 'status', header: 'Daily Status', cell: (d) => <StatusHighlighter value={d.status} /> }
    ]

    const datePickerAction = (
        <div className="flex items-center gap-2">
            <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
            </label>
            <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block h-10 rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-3 py-2 text-sm font-medium text-[#05161A] shadow-sm transition-all hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
            />
        </div>
    )

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader 
                title="Daily Attendance Logs" 
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Attendance' }]} 
                action={datePickerAction}
            />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search employees..." />
            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(d) => d.id}
                isLoading={isLoading}
                emptyStateMessage="No attendance logs found"
            />
        </div>
    )
}
