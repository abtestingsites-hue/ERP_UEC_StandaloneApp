import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useComplaints } from '../hooks/useCustomerCare'

export function ComplaintsListView() {
    const { data: complaints = [], isLoading } = useComplaints()

    const columns: Column<any>[] = [
        { key: 'ticketNo', header: 'Ticket No', cell: (row) => <span className="text-sm font-semibold text-primary-600">{row.ticketNo}</span> },
        { key: 'date', header: 'Date', cell: (row) => <span className="text-sm text-gray-800 dark:text-gray-200">{row.date}</span> },
        { key: 'clientName', header: 'Client', cell: (row) => <span className="text-sm font-bold text-gray-900 dark:text-white">{row.clientName}</span> },
        { key: 'category', header: 'Category', cell: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.category}</span> },
        { key: 'priority', header: 'Priority', cell: (row) => <span className={`text-xs font-bold ${row.priority === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>{row.priority}</span> },
        { key: 'assignedTo', header: 'Assigned To', cell: (row) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.assignedTo || 'Unassigned'}</span> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col bg-transparent pb-4 overflow-y-auto dark:bg-black">
            <PageHeader
                title="Complaints"
                subtitle="View and track customer complaints."
                breadcrumbs={[{ label: 'Home' }, { label: 'Customer Care' }, { label: 'Complaints' }]}
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#6DA5C0]/20 bg-white shadow-sm dark:border-white/10 dark:bg-black p-4">
                {isLoading ? (
                    <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ) : (
                    <DataTable
                        data={complaints}
                        columns={columns}
                        keyExtractor={(r) => r.id}
                        emptyStateMessage="No complaints found."
                    />
                )}
            </div>
        </div>
    )
}
