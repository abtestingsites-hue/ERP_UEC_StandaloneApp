import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { ActionBar } from '../../../components/ActionBar'
import { FilterSection } from '../../../components/FilterSection'
import { Edit2, Eye, Trash2 } from 'lucide-react'
import { useCashbox, useAddExpense, useUpdateTransaction, useDeleteTransaction } from '../hooks/useAccounts'
import { TransactionActionModal } from '../components/TransactionActionModal'

export function InHouseExpense() {
    const { data: rawCashbox = [], isLoading } = useCashbox()
    const { mutate: addExpense, isPending } = useAddExpense()
    const updateTransaction = useUpdateTransaction()
    const deleteTransaction = useDeleteTransaction()

    const rawData = useMemo(() => rawCashbox.filter((t: any) => t.type === 'EXPENSE' && t.category === 'In-House'), [rawCashbox])

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUnit, setSelectedUnit] = useState('ALL')
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const [modalState, setModalState] = useState<{
        isOpen: boolean,
        type: 'VIEW' | 'EDIT' | 'DELETE',
        transaction: any | null
    }>({
        isOpen: false,
        type: 'VIEW',
        transaction: null
    })

    const data = useMemo(() => {
        return rawData
            .filter((t: any) => {
                const query = searchQuery.trim().toLowerCase()
                const matchesSearch =
                    !query ||
                    t.claimId?.toLowerCase().includes(query) ||
                    t.item?.toLowerCase().includes(query) ||
                    t.receiptNo?.toLowerCase().includes(query) ||
                    t.category?.toLowerCase().includes(query) ||
                    t.vendor?.toLowerCase().includes(query) ||
                    t.clientName?.toLowerCase().includes(query) ||
                    t.notes?.toLowerCase().includes(query) ||
                    t.remarks?.toLowerCase().includes(query);

                const displayStatus = t.status === 'PENDING_APPROVAL' ? 'Not yet Approved' : t.status
                const matchesStatus = selectedStatus === 'ALL' || displayStatus === selectedStatus;

                return matchesSearch && matchesStatus;
            })
            .map((t: any) => ({
                id: t.id,
                unit: 'Universal Edler Care',
                category: t.category || 'In-House',
                amount: Math.abs(t.amount),
                notes: t.notes,
                date: t.date,
                type: t.type,
                paymentModeDate: `${t.mode || 'Cash'} / ${t.date}`,
                vendorDetails: `${t.vendor || t.clientName || '-'} / ${t.remarks || t.notes || '-'}`,
                status: t.status === 'PENDING_APPROVAL' ? 'Not yet Approved' : t.status
            }))
    }, [rawData, searchQuery, selectedStatus])

    const [formData, setFormData] = useState({ item: '', amount: '', date: '', remarks: '' })

    const handleAdd = () => setIsDrawerOpen(true)
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense({
            category: 'In-House',
            amount: Number(formData.amount),
            date: formData.date,
            vendor: formData.item,
            mode: 'Cash',
            remarks: formData.remarks
        }, {
            onSuccess: () => {
                setIsDrawerOpen(false);
                setFormData({ item: '', amount: '', date: '', remarks: '' })
            }
        })
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

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: () => null, sortable: false },
        { key: 'unit', header: 'Unit', sortable: true },
        { key: 'category', header: 'Category' },
        { key: 'amount', header: 'Expense Amount', cell: (t) => <span className="font-semibold text-orange-600">₹ {t.amount.toFixed(2)}</span>, sortable: true },
        {
            key: 'paymentModeDate', header: 'Payment Mode / Date & Time', cell: (t) => {
                const [mode, ...dateParts] = t.paymentModeDate.split(' / ')
                const dateSplit = dateParts.join(' / ')
                return (
                    <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{mode}</span>
                        <span className="text-xs text-gray-500">{dateSplit}</span>
                    </div>
                )
            }
        },
        {
            key: 'vendorDetails', header: 'Vendor Details / Remark', cell: (t) => {
                const [vendor, ...remarkParts] = t.vendorDetails.split(' / ')
                const remark = remarkParts.join(' / ')
                return (
                    <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100">{vendor}</span>
                        <span className="text-xs text-gray-500">{remark}</span>
                    </div>
                )
            }
        },
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
        <div className="flex flex-col h-full">
            <PageHeader title="In-House / In-Patient Expenses" breadcrumbs={[{ label: 'Home' }, { label: 'Accounts' }]} />

            <ActionBar
                onAdd={handleAdd}
                addLabel="Add New Expense"
            />

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search by Claim ID / Item..."
                filters={[
                    {
                        name: 'unit',
                        value: selectedUnit,
                        onChange: (e) => setSelectedUnit(e.target.value),
                        options: [{ value: 'ALL', label: 'Universal Edler Care' }]
                    },
                    {
                        name: 'status',
                        value: selectedStatus,
                        onChange: (e) => setSelectedStatus(e.target.value),
                        options: [{ value: 'ALL', label: 'All Status' }, { value: 'Approved', label: 'Approved' }, { value: 'Not yet Approved', label: 'Not yet Approved' }]
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

            <TransactionActionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(p => ({ ...p, isOpen: false }))}
                transaction={modalState.transaction}
                type={modalState.type}
                onConfirm={handleConfirmAction}
                isPending={updateTransaction.isPending || deleteTransaction.isPending}
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add New Expense">
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input label="Vendor Details" required value={formData.item} onChange={e => setFormData(p => ({ ...p, item: e.target.value }))} />
                    <Input label="Amount Spent (₹)" type="number" required value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} />
                    <Input label="Date of Purchase" type="date" required value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details & Justification</label>
                        <textarea required value={formData.remarks} onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))} className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F969C]" placeholder="Explain the context of this expense..." />
                    </div>
                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-4 py-2 bg-[#0F969C] text-white rounded-md hover:bg-[#0C7A7E] font-medium shadow-sm disabled:opacity-50 transition-colors">
                            {isPending ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
