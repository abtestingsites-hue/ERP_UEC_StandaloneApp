import { useQuery } from '@tanstack/react-query'
import { customerCareService } from '../services/customer_care'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'

export function PendingFeedbackView() {
    const { data: feedbackList = [], isLoading } = useQuery({
        queryKey: ['customer-care', 'pending-feedback', 'all'],
        queryFn: () => customerCareService.getPendingFeedback({ scope: 'all' })
    })

    const columns: Column<any>[] = [
        { key: 'refNo', header: 'Reference', cell: (row) => <span className="text-sm font-semibold text-primary-600">{row.refNo || row.allocationRef || 'N/A'}</span> },
        { key: 'date', header: 'Date', cell: (row) => <span className="text-sm text-gray-800 dark:text-gray-200">{new Date(row.date || row.createdAt || Date.now()).toLocaleDateString('en-IN')}</span> },
        { key: 'clientName', header: 'Client', cell: (row) => <span className="text-sm font-bold text-gray-900 dark:text-white">{row.clientName || 'Unknown'}</span> },
        { key: 'service', header: 'Service', cell: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.service || row.type || 'Service'}</span> },
        { key: 'status', header: 'Status', cell: (row) => <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Pending Feedback</span> }
    ]

    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col bg-transparent pb-4 overflow-y-auto dark:bg-black">
            <PageHeader
                title="Pending Feedback"
                subtitle="View pending feedback items for services."
                breadcrumbs={[{ label: 'Home' }, { label: 'Customer Care' }, { label: 'Pending Feedback' }]}
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#6DA5C0]/20 bg-white shadow-sm dark:border-white/10 dark:bg-black p-4">
                {isLoading ? (
                    <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ) : (
                    <DataTable
                        data={feedbackList}
                        columns={columns}
                        keyExtractor={(r) => r.id}
                        emptyStateMessage="No pending feedback found."
                    />
                )}
            </div>
        </div>
    )
}
