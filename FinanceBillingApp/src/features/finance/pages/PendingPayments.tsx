import { useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { DataTable, type Column } from '../../../components/DataTable'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useInvoices } from '../../accounts/hooks/useAccounts'

export function PendingPayments() {
    const { data: transactions = [], isLoading } = useInvoices()
    const [search, setSearch] = useState('')

    const pendingInvoices = useMemo(() => {
        const query = search.trim().toLowerCase()

        return transactions
            .filter((transaction) => transaction.type === 'INVOICE' && transaction.currentStatus === 'POSTED')
            .map((transaction) => {
                const amount = Number(transaction.amount || 0)
                const paidAmount = Number(transaction.metadata?.paidAmount || 0)
                const balanceAmount = Number(transaction.metadata?.balanceAmount ?? Math.max(0, amount - paidAmount))

                return {
                    ...transaction,
                    amount,
                    paidAmount,
                    balanceAmount,
                    paymentStatus: transaction.metadata?.paymentStatus || (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
                    allocationRef: transaction.metadata?.allocationRef || '-',
                    taskRefNo: transaction.metadata?.taskRefNo || '-'
                }
            })
            .filter((transaction) => transaction.balanceAmount > 0.01)
            .filter((transaction) => {
                if (!query) return true
                return [
                    transaction.receiptNo,
                    transaction.clientName,
                    transaction.category,
                    transaction.allocationRef,
                    transaction.taskRefNo,
                    transaction.paymentStatus
                ].some((value) => String(value || '').toLowerCase().includes(query))
            })
    }, [transactions, search])

    const columns: Column<any>[] = [
        { key: 'receiptNo', header: 'Invoice No', cell: (row) => <span className="font-semibold text-[#0F969C]">{row.receiptNo}</span> },
        { key: 'clientName', header: 'Client', cell: (row) => <span className="font-medium">{row.clientName || '-'}</span> },
        { key: 'category', header: 'Service', cell: (row) => row.category || '-' },
        { key: 'allocationRef', header: 'Allocation', cell: (row) => row.allocationRef },
        { key: 'amount', header: 'Invoice Amount', cell: (row) => <span className="font-semibold">Rs {Number(row.amount || 0).toFixed(2)}</span> },
        { key: 'paidAmount', header: 'Paid', cell: (row) => <span className="font-semibold text-emerald-700">Rs {Number(row.paidAmount || 0).toFixed(2)}</span> },
        { key: 'balanceAmount', header: 'Pending', cell: (row) => <span className="font-semibold text-orange-700">Rs {Number(row.balanceAmount || 0).toFixed(2)}</span> },
        { key: 'paymentStatus', header: 'Status', cell: (row) => <StatusHighlighter value={row.paymentStatus} /> }
    ]

    return (
        <div className="flex h-full min-w-0 flex-col">
            <PageHeader
                title="Pending Payments"
                breadcrumbs={[{ label: 'Finance' }, { label: 'Pending Payments' }]}
            />

            <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex max-w-md items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search pending invoices..."
                            className="w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-orange-100 bg-orange-50 px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                            <Receipt className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Pending Due</p>
                            <p className="text-lg font-extrabold text-gray-900">
                                Rs {pendingInvoices.reduce((total, invoice) => total + Number(invoice.balanceAmount || 0), 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                data={pendingInvoices}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                emptyStateMessage="No pending invoice payments"
            />
        </div>
    )
}
