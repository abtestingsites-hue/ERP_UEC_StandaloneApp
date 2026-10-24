import { useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useInvoices } from '../../accounts/hooks/useAccounts'

export function PendingPaymentsView() {
    const { data: invoices = [], isLoading } = useInvoices()

    const pendingInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const status = String(inv.status || '').toUpperCase()
            return status === 'PENDING' || status === 'UNPAID' || status === 'OVERDUE'
        })
    }, [invoices])

    const columns: Column<any>[] = [
        { key: 'receiptNo', header: 'Reference', cell: (row) => <span className="text-sm font-semibold text-primary-600">{row.receiptNo || 'N/A'}</span> },
        { key: 'date', header: 'Date', cell: (row) => <span className="text-sm text-gray-800 dark:text-gray-200">{row.date}</span> },
        { key: 'clientName', header: 'Client', cell: (row) => <span className="text-sm font-bold text-gray-900 dark:text-white">{row.clientName}</span> },
        { key: 'amount', header: 'Amount', cell: (row) => <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Rs {row.amount?.toLocaleString('en-IN') || 0}</span> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col bg-transparent pb-4 overflow-y-auto dark:bg-black">
            <PageHeader
                title="Pending Payments"
                subtitle="View all pending and overdue invoices."
                breadcrumbs={[{ label: 'Home' }, { label: 'Finance' }, { label: 'Pending Payments' }]}
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#6DA5C0]/20 bg-white shadow-sm dark:border-white/10 dark:bg-black p-4">
                {isLoading ? (
                    <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ) : (
                    <DataTable
                        data={pendingInvoices}
                        columns={columns}
                        keyExtractor={(r) => r.id}
                        emptyStateMessage="No pending payments found."
                    />
                )}
            </div>
        </div>
    )
}
