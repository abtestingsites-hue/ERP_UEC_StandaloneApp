import { useMemo, useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useStaff } from '../hooks/useHR'
import { Link } from 'react-router-dom'

export function StaffPrivilege() {
    const { data: staffData = [] } = useStaff({ includeFormer: true, scope: 'all' })
    const [searchQuery, setSearchQuery] = useState('')

    const filteredData = searchQuery.trim()
        ? staffData.filter(s =>
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.empId || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : staffData

    const columns: Column<any>[] = [
        { key: 'photo', header: 'Staff Photo', cell: () => <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs">IMG</div> },
        {
            key: 'name', header: 'Staff Name & Ref. ID', sortable: true, cell: (s) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                    <div className="text-xs text-gray-500">ID: {s.empId}</div>
                </div>
            )
        },
        { key: 'designation', header: 'Staff Designation', cell: (s) => s.role },
        {
            key: 'loginId', header: 'Login - User ID', cell: (s) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{s.user ? s.user.email : 'Unassigned'}</div>
                    {s.user && <div className="text-xs text-gray-400">UUID: {s.user.id.substring(0, 8)}...</div>}
                </div>
            )
        },
        { key: 'approval', header: 'Approval Authority', cell: (s) => s.user?.role?.name || 'None' },
        { key: 'loginStatus', header: 'Login Status', cell: (s) => <StatusHighlighter value={s.user?.isActive ? 'Login Activated' : 'Login Disabled'} /> }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader title="Staff Access Summary" breadcrumbs={[{ label: 'HR' }, { label: 'Access Summary' }]} />

            <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Staff Access Summary (Total: {staffData.length})</h3>
                    <p className="text-sm text-gray-500 mt-1">This is a read-only view. To manage staff login access, roles, and privileges, please use the User Management module.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/super-admin/users" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">
                        Go to User Management
                    </Link>
                </div>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search by name or ID..."
            />

            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(s) => s.id}
            />
        </div>
    )
}
