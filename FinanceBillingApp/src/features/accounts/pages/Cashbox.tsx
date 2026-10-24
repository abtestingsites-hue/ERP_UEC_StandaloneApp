import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Input } from '../../../components/Input'
import { useCashbox, useUpdateTransaction, useDeleteTransaction } from '../hooks/useAccounts'
import { Edit2, Eye, Trash2 } from 'lucide-react'
import { TransactionActionModal } from '../components/TransactionActionModal'
import { useUnits } from '../../master/hooks/useUnit'
import { useAuthStore } from '../../../store/authStore'
import { hasAllAccess, hasUnitAccess } from '../../../lib/access'

export function Cashbox() {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
    const [activeDateRange, setActiveDateRange] = useState({ start: fromDate, end: toDate })

    const user = useAuthStore((state) => state.user)
    const activeUnitId = useAuthStore((state) => state.activeUnitId)
    const setActiveUnitId = useAuthStore((state) => state.setActiveUnitId)
    const { data: units = [] } = useUnits()

    const accessibleUnits = useMemo(
        () => hasAllAccess(user) ? units : units.filter((unit: any) => hasUnitAccess(user, unit.id)),
        [units, user]
    )

    const safeActiveUnitId = useMemo(() => {
        if (accessibleUnits.some((u: any) => u.id === activeUnitId)) {
            return activeUnitId || ''
        }
        return accessibleUnits[0]?.id || ''
    }, [accessibleUnits, activeUnitId])

    const { data: transactions = [], isLoading } = useCashbox(activeDateRange.start, activeDateRange.end)
    const updateTransaction = useUpdateTransaction()
    const deleteTransaction = useDeleteTransaction()

    const [modalState, setModalState] = useState<{
        isOpen: boolean,
        type: 'VIEW' | 'EDIT' | 'DELETE',
        transaction: any | null
    }>({
        isOpen: false,
        type: 'VIEW',
        transaction: null
    })

    const handleViewMonth = () => {
        const date = new Date()
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const fDate = firstDay.toISOString().split('T')[0]
        const tDate = lastDay.toISOString().split('T')[0]

        setFromDate(fDate)
        setToDate(tDate)
        setActiveDateRange({ start: fDate, end: tDate })
    }

    const handleSearchDate = () => {
        setActiveDateRange({ start: fromDate, end: toDate })
    }

    const openModal = (transaction: any, type: 'VIEW' | 'EDIT' | 'DELETE') => {
        setModalState({ isOpen: true, type, transaction })
    }

    const handleConfirmAction = (data?: any) => {
        if (!modalState.transaction) return

        if (modalState.type === 'DELETE') {
            deleteTransaction.mutate(modalState.transaction.id, {
                onSuccess: () => setModalState(p => ({ ...p, isOpen: false }))
            })
        } else if (modalState.type === 'EDIT' && data) {
            updateTransaction.mutate({
                id: modalState.transaction.id,
                data: { ...data, type: modalState.transaction.type }
            }, {
                onSuccess: () => setModalState(p => ({ ...p, isOpen: false }))
            })
        }
    }

    const data = useMemo(() => {
        return transactions.filter((t: any) => t.currentStatus === 'APPROVED' || t.currentStatus === 'POSTED')
            .map((t: any) => ({
                id: t.id,
                invoiceNo: t.receiptNo || 'N/A',
                dateTime: `${t.date} 10:00 AM`,
                category: t.category,
                clientName: t.clientName,
                amount: t.amount,
                mode: t.mode,
                notes: t.notes,
                metadata: t.metadata,
                date: t.date,
                type: t.type,
                income: t.amount > 0 ? t.amount : null,
                expense: t.amount < 0 ? Math.abs(t.amount) : null,
                status: t.currentStatus
            }))
    }, [transactions])

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: () => null, sortable: false },
        {
            key: 'invoiceNo', header: 'Invoice/Voucher No', cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">{t.invoiceNo}</span>
                    <span className="text-xs text-gray-500">UEC, Coimbatore</span>
                </div>
            )
        },
        { key: 'dateTime', header: 'Date & Time', sortable: true },
        { key: 'category', header: 'Category | SubCategory' },
        {
            key: 'clientName', header: 'Receipt To', cell: (t) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.clientName} ()</span>
                    <span className="text-xs text-gray-500">{t.invoiceNo}</span>
                </div>
            )
        },
        { key: 'income', header: 'Income', cell: (t) => t.income ? <span className="font-medium">₹ {t.income.toFixed(2)}</span> : '-' },
        { key: 'expense', header: 'Expense', cell: (t) => t.expense ? <span className="font-medium">₹ {t.expense.toFixed(2)}</span> : '-' },
        { key: 'status', header: 'Approved Status', cell: (t) => <StatusHighlighter value={t.status} /> },
        {
            key: 'action', header: 'Action', cell: (t) => (
                <div className="flex items-center gap-1 justify-center">
                    <button onClick={() => openModal(t, 'VIEW')} className="p-1.5 bg-yellow-400 text-white rounded hover:bg-yellow-500" title="View"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openModal(t, 'EDIT')} className="p-1.5 bg-[#0F969C] text-white rounded hover:bg-[#0F969C]" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => openModal(t, 'DELETE')} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ]

    columns[0].cell = (item) => data.findIndex((a: any) => a.id === item.id) + 1

    return (
        <div className="flex h-full min-w-0 flex-col">
            <PageHeader title="Cashbox" breadcrumbs={[{ label: 'Home' }, { label: 'Cashbox' }]} />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 2xl:mb-6 2xl:p-5">
                {/* Date Filters Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        {accessibleUnits.length > 0 && (
                            <div className="w-full sm:w-48 flex-shrink-0">
                                <select
                                    value={safeActiveUnitId}
                                    onChange={(e) => setActiveUnitId(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-[9px] text-sm text-gray-900 shadow-sm focus:border-[#0F969C] focus:outline-none focus:ring-1 focus:ring-[#0F969C]"
                                >
                                    {accessibleUnits.map((unit: any) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="w-full sm:w-40 flex-shrink-0">
                            <Input
                                label=""
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-40 flex-shrink-0">
                            <Input
                                label=""
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <button
                                onClick={handleViewMonth}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-50 transition-colors"
                            >
                                This Month
                            </button>
                            <button
                                onClick={handleSearchDate}
                                className="px-4 py-2 bg-[#0F969C] border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:bg-[#0C7A7E] transition-colors"
                            >
                                Search Dates
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-sm text-gray-500 mb-4 px-1">
                Records showing from <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(activeDateRange.start).toLocaleDateString()}</span> to <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(activeDateRange.end).toLocaleDateString()}</span>
            </div>

            <DataTable
                data={data}
                columns={columns}
                keyExtractor={(t) => t.id}
                isLoading={isLoading}
                emptyStateMessage="No data available in table"
            />

            <TransactionActionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(p => ({ ...p, isOpen: false }))}
                transaction={modalState.transaction}
                type={modalState.type}
                onConfirm={handleConfirmAction}
                isPending={updateTransaction.isPending || deleteTransaction.isPending}
            />
        </div>
    )
}
