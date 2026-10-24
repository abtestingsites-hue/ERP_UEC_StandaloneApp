import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'

import { DataTable, type Column } from '../../../components/DataTable'


import { Search } from 'lucide-react'
import { useAuditLogs } from '../hooks/useAudit'

const formatDateTime = (value: string | undefined | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-GB')
}

export function ActionHistory() {
    const [page, setPage] = useState(1)
    const [moduleFilter, setModuleFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const { data: response, isLoading } = useAuditLogs({
        page,
        limit: 50,
        module: moduleFilter || undefined
    })

    const logs = (response as any)?.data || []
    const pagination = (response as any)?.pagination

    const visibleLogs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return logs

        return logs.filter((log: any) => [
            log.user?.firstName,
            log.user?.lastName,
            log.user?.email,
            log.action,
            log.module
        ].some((val) => String(val || '').toLowerCase().includes(query)))
    }, [logs, searchQuery])

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: (_row, index) => ((page - 1) * 50) + index + 1 },
        { 
            key: 'timestamp', 
            header: 'Timestamp', 
            cell: (row) => formatDateTime(row.createdAt) 
        },
        { 
            key: 'user', 
            header: 'User', 
            cell: (row) => row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || row.user.email : 'System / Unknown' 
        },
        { 
            key: 'role', 
            header: 'Role', 
            cell: (row) => row.user?.role?.name || '-' 
        },
        { key: 'module', header: 'Module', cell: (row) => row.module },
        { key: 'action', header: 'Action', cell: (row) => row.action },
        { 
            key: 'payload', 
            header: 'Details', 
            cell: (row) => (
                <div className="max-w-xs truncate text-xs text-slate-500" title={JSON.stringify(row.payload, null, 2)}>
                    {row.payload ? JSON.stringify(row.payload) : '-'}
                </div>
            )
        }
    ]

    return (
        <div className="flex h-full flex-col">
            <PageHeader 
                title="Action History" 
                subtitle="View and monitor system-wide audit logs and actions." 
                 
            />

            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-white/10 md:flex-row md:items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by user, email, or action..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block h-10 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] dark:border-white/10 dark:bg-black"
                    />
                </div>
                <div className="w-64">
                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="block h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C] dark:border-white/10 dark:bg-black"
                    >
                        <option value="">All Modules</option>
                        <option value="HEALTHCARE_MEDICATION">Medication</option>
                        <option value="HEALTHCARE_VITALS">Vitals</option>
                        <option value="HEALTHCARE_ADL">ADL</option>
                        <option value="PATIENT_BILLING">Billing</option>
                        <option value="CRM">CRM</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6">
                <DataTable
                    columns={columns}
                    data={visibleLogs}
                    isLoading={isLoading}
                    keyExtractor={(item: any) => item.id || Math.random().toString()}
                    pagination={{
                        currentPage: page,
                        totalPages: pagination?.totalPages || 1,
                        onPageChange: setPage
                    }}
                />
            </div>
        </div>
    )
}


