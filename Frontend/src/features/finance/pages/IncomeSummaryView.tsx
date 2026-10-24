import { useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useCashbox } from '../../accounts/hooks/useAccounts'

export function IncomeSummaryView() {
    const { data: transactions = [], isLoading } = useCashbox()

    const incomeRecords = useMemo(() => {
        return transactions.filter(t => String(t.type || '').toUpperCase() === 'INCOME')
    }, [transactions])

    const totalIncome = useMemo(() => incomeRecords.reduce((sum, t) => sum + (Number(t.amount) || 0), 0), [incomeRecords])

    const columns: Column<any>[] = [
        { key: 'receiptNo', header: 'Reference', cell: (row) => <span className="text-sm font-semibold text-primary-600">{row.receiptNo || 'N/A'}</span> },
        { key: 'date', header: 'Date', cell: (row) => <span className="text-sm text-gray-800 dark:text-gray-200">{row.date}</span> },
        { key: 'clientName', header: 'Client', cell: (row) => <span className="text-sm font-bold text-gray-900 dark:text-white">{row.clientName}</span> },
        { key: 'category', header: 'Category', cell: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.category}</span> },
        { key: 'mode', header: 'Mode', cell: (row) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.mode}</span> },
        { key: 'amount', header: 'Amount', cell: (row) => <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rs {row.amount?.toLocaleString('en-IN') || 0}</span> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> }
    ]

    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col bg-transparent pb-4 overflow-y-auto dark:bg-black">
            <PageHeader
                title="Total Income"
                subtitle="View collected income and transactions."
                breadcrumbs={[{ label: 'Home' }, { label: 'Finance' }, { label: 'Total Income' }]}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-900/20">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Total Income</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-900 dark:text-emerald-300">Rs {totalIncome.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl border border-[#6DA5C0]/20 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Transactions</p>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{incomeRecords.length}</p>
                </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#6DA5C0]/20 bg-white shadow-sm dark:border-white/10 dark:bg-black p-4">
                {isLoading ? (
                    <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                ) : (
                    <DataTable
                        data={incomeRecords}
                        columns={columns}
                        keyExtractor={(r) => r.id}
                        emptyStateMessage="No income records found."
                    />
                )}
            </div>
        </div>
    )
}
