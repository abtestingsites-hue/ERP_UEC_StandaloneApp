import { useMemo, useState } from 'react'
import { Edit2, Eye, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { Drawer } from '../../../components/Drawer'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { FilterSection } from '../../../components/FilterSection'
import { useCashbox, useAddIncome, useUpdateTransaction, useDeleteTransaction } from '../hooks/useAccounts'
import { TransactionActionModal } from '../components/TransactionActionModal'

export function Income() {
    const { data: rawCashbox = [], isLoading } = useCashbox()
    const { mutate: addIncome, isPending } = useAddIncome()
    const updateTransaction = useUpdateTransaction()
    const deleteTransaction = useDeleteTransaction()

    const rawData = useMemo(() => rawCashbox.filter((t: any) => t.type === 'RECEIPT'), [rawCashbox])

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

    const [formData, setFormData] = useState({
        clientName: '',
        category: 'Admission Fee',
        subCategory: '',
        amount: '',
        date: '',
        mode: 'UPI',
        remarks: ''
    })

    const data = useMemo(() => {
        return rawData
            .filter((t: any) => {
                const matchesSearch =
                    t.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.clientName?.toLowerCase().includes(searchQuery.toLowerCase())

                const uiStatus = t.currentStatus === 'PENDING_APPROVAL' ? 'Not yet Approved' : 'Approved'
                const matchesStatus = selectedStatus === 'ALL' || uiStatus === selectedStatus

                return matchesSearch && matchesStatus
            })
            .map((t: any) => ({
                id: t.id,
                unit: 'Universal Edler Care',
                clientName: t.clientName,
                receiptNoRaw: t.receiptNo,
                category: t.category,
                amount: t.amount,
                mode: t.mode,
                notes: t.notes,
                metadata: t.metadata,
                date: t.date,
                type: t.type,
                receiptNo: t.receiptNo || 'N/A',
                dateTime: `${t.date} 06:51 PM`,
                status: t.currentStatus === 'PENDING_APPROVAL' ? 'Not yet Approved' : 'Approved'
            }))
    }, [rawData, searchQuery, selectedStatus])

    const resetForm = () => {
        setFormData({
            clientName: '',
            category: 'Admission Fee',
            subCategory: '',
            amount: '',
            date: '',
            mode: 'UPI',
            remarks: ''
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

    const handleAdd = () => setIsDrawerOpen(true)

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        addIncome({
            clientName: formData.clientName,
            category: formData.category,
            amount: Number(formData.amount),
            date: formData.date,
            mode: formData.mode,
            remarks: formData.remarks
        }, {
            onSuccess: () => {
                setIsDrawerOpen(false)
                resetForm()
            }
        })
    }

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: () => null, sortable: false },
        { key: 'unit', header: 'Unit', sortable: true },
        {
            key: 'clientDetails',
            header: 'Client Details',
            cell: (t) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{t.clientName || 'Unknown Client'}</span>
                    <span className="text-xs text-gray-500">{t.receiptNoRaw}</span>
                </div>
            )
        },
        {
            key: 'category',
            header: 'Category',
            cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100">{t.category}</span>
                    <span className="text-xs text-gray-500">Advance</span>
                </div>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            cell: (t) => <span className="font-semibold text-emerald-600">Rs {t.amount.toFixed(2)}</span>,
            sortable: true
        },
        {
            key: 'receiptDetails',
            header: 'Receipt Details',
            cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{t.receiptNo}</span>
                    <span className="text-xs text-gray-500">{t.dateTime}</span>
                </div>
            )
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
            <PageHeader title="Income" breadcrumbs={[{ label: 'Home' }, { label: 'Income Master' }]} />

            <div className="mb-4 flex items-center justify-end">
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F969C] text-white font-semibold rounded-2xl shadow-[0_10px_24px_rgba(15,150,156,0.24)] hover:bg-[#294D61] transition-colors"
                >
                    Add Income
                </button>
            </div>

            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search by Client / Receipt No..."
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
                        options: [
                            { value: 'ALL', label: 'All Status' },
                            { value: 'Approved', label: 'Approved' },
                            { value: 'Not yet Approved', label: 'Not yet Approved' }
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

            <TransactionActionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(p => ({ ...p, isOpen: false }))}
                transaction={modalState.transaction}
                type={modalState.type}
                onConfirm={handleConfirmAction}
                isPending={updateTransaction.isPending || deleteTransaction.isPending}
            />

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add New Income">
                <form onSubmit={onSubmit} className="space-y-4">
                    <Input
                        label="Client Name / Ref. No."
                        required
                        value={formData.clientName}
                        onChange={e => setFormData(p => ({ ...p, clientName: e.target.value }))}
                        placeholder="Search Ref No. or Name or Mobile No."
                    />
                    <Select
                        label="Payment Category"
                        required
                        value={formData.category}
                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                        options={[
                            { value: 'Admission Fee', label: 'Admission Fee' },
                            { value: 'Recurring Service', label: 'Recurring Service' },
                            { value: 'Deposit', label: 'Deposit' },
                            { value: 'Other', label: 'Other Income' }
                        ]}
                    />
                    <Input
                        label="Payment Sub-Category"
                        value={formData.subCategory}
                        onChange={e => setFormData(p => ({ ...p, subCategory: e.target.value }))}
                        placeholder="Select the Payment Sub-Category"
                    />
                    <Input
                        label="Invoice Date & Time"
                        type="datetime-local"
                        required
                        value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    />
                    <Input
                        label="Income Amount (Rs)"
                        type="number"
                        required
                        value={formData.amount}
                        onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                        placeholder="Enter the Amount"
                    />
                    <Select
                        label="Payment Mode"
                        required
                        value={formData.mode}
                        onChange={e => setFormData(p => ({ ...p, mode: e.target.value }))}
                        options={[
                            { value: 'UPI', label: 'UPI' },
                            { value: 'Cash', label: 'Cash' },
                            { value: 'Bank Transfer', label: 'Bank Transfer' },
                            { value: 'Cheque', label: 'Cheque' }
                        ]}
                    />
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks / Narrations</label>
                        <textarea
                            value={formData.remarks}
                            onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F969C]"
                            placeholder="Enter the Remarks / Narrations"
                        />
                    </div>
                    <div className="pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm()
                                setIsDrawerOpen(false)
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 bg-[#0F969C] text-white rounded-md hover:bg-[#294D61] font-medium shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {isPending ? 'Saving...' : 'Submit Income'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    )
}
