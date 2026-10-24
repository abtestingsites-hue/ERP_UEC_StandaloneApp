import { useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { useCashbox, useApproveTransaction } from '../hooks/useAccounts'
import { Check, X } from 'lucide-react'

export function CashboxPending() {
    const { data: rawData = [], isLoading } = useCashbox()
    const approveMutation = useApproveTransaction()

    const [selectedUnit, setSelectedUnit] = useState('ALL')
    const [selectedPayment, setSelectedPayment] = useState('ALL')

    const data = rawData.filter((t: any) => t.currentStatus === 'PENDING_APPROVAL')
        .map((t: any) => ({
            id: t.id,
            invoiceNo: t.receiptNo || 'N/A',
            receiptNoRaw: t.receiptNo,
            dateTime: `${t.date} 06:51 PM`,
            category: t.category,
            clientName: t.clientName,
            amount: t.amount,
            notes: t.notes,
            date: t.date,
            type: t.type,
            income: t.amount > 0 ? t.amount : null,
            expense: t.amount < 0 ? Math.abs(t.amount) : null,
            status: t.currentStatus,
            typeLabel: t.amount > 0 ? 'Income' : 'Expense'
        }))

    const pendingIncome = data.filter(d => d.income !== null).length;
    const pendingExpense = data.filter(d => d.expense !== null).length;

    const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
        approveMutation.mutate({ id, status: action, comments: action === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin' })
    }

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: () => null, sortable: false },
        {
            key: 'invoiceNo', header: 'Invoice/Voucher No', cell: (t) => (
                <div className="flex flex-col space-y-1">
                    <span className="text-blue-600 font-medium text-sm">{t.type}</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{t.invoiceNo}</span>
                    <span className="text-xs text-gray-500">UEC, Coimbatore</span>
                </div>
            )
        },
        {
            key: 'dateTime', header: 'Date & Time', cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{t.dateTime.split(' ')[0]}</span>
                    <span className="text-xs text-gray-500">{t.dateTime.split(' ').slice(1).join(' ')}</span>
                </div>
            )
        },
        {
            key: 'category', header: 'Category | SubCategory', cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100">{t.category}</span>
                    <span className="text-xs text-gray-500">Advance</span>
                </div>
            )
        },
        {
            key: 'clientName', header: 'Receipt To', cell: (t) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{t.clientName} ()</span>
                    <span className="text-xs text-gray-500">{t.receiptNoRaw}</span>
                </div>
            )
        },
        { key: 'income', header: 'Income', cell: (t) => t.income ? <span className="font-semibold">₹ {t.income.toFixed(2)}</span> : '-' },
        { key: 'expense', header: 'Expense', cell: (t) => t.expense ? <span className="font-semibold">₹ {t.expense.toFixed(2)}</span> : '-' },
        {
            key: 'action', header: 'Action', cell: (t) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleAction(t.id, 'APPROVED')}
                        className="rounded bg-[#0F969C] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0C7A7E] disabled:opacity-50"
                    >
                        <Check className="w-3 h-3" /> Approve
                    </button>
                    <button
                        onClick={() => handleAction(t.id, 'REJECTED')}
                        className="rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                        <X className="w-3 h-3" /> Reject
                    </button>
                </div>
            )
        }
    ]

    columns[0].cell = (item) => data.findIndex((a: any) => a.id === item.id) + 1

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Cashbox Pending Report" breadcrumbs={[{ label: 'Home' }, { label: 'Cashbox Pending' }]} />

            {/* Metrics Row */}
            <div className="flex flex-col md:flex-row items-center justify-around p-6 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="text-center">
                    <span className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
                        {pendingIncome.toString().padStart(2, '0')}
                    </span>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Income Pending</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-gray-200"></div>
                <div className="text-center mt-4 md:mt-0">
                    <span className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
                        {pendingExpense.toString().padStart(2, '0')}
                    </span>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Expense Pending</p>
                </div>
            </div>

            <FilterSection
                filters={[
                    {
                        name: 'unit',
                        value: selectedUnit,
                        onChange: (e) => setSelectedUnit(e.target.value),
                        options: [{ value: 'ALL', label: 'Universal Edler Care' }]
                    },
                    {
                        name: 'paymentType',
                        value: selectedPayment,
                        onChange: (e) => setSelectedPayment(e.target.value),
                        options: [
                            { value: 'ALL', label: 'All Payments' },
                            { value: 'Income', label: 'Income' },
                            { value: 'Expense', label: 'Expense' }
                        ]
                    }
                ]}
            />

            <DataTable
                data={data}
                columns={columns}
                keyExtractor={(t) => t.id}
                isLoading={isLoading}
                emptyStateMessage="No data available in table"
            />
        </div>
    )
}
