import { useState, useEffect } from 'react'
import { Edit2, Eye, Trash2, X } from 'lucide-react'

interface TransactionActionModalProps {
    isOpen: boolean
    onClose: () => void
    transaction: any | null
    type: 'VIEW' | 'EDIT' | 'DELETE'
    onConfirm: (data?: any) => void
    isPending?: boolean
}

export function TransactionActionModal({ isOpen, onClose, transaction, type, onConfirm, isPending }: TransactionActionModalProps) {
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        date: '',
        clientName: '',
        notes: ''
    })

    useEffect(() => {
        if (transaction && (type === 'EDIT' || type === 'VIEW')) {
            setFormData({
                category: transaction.category || '',
                amount: Math.abs(transaction.amount || 0).toString(),
                date: transaction.date || new Date().toISOString().split('T')[0],
                clientName: transaction.clientName || '',
                notes: transaction.notes || ''
            })
        }
    }, [transaction, type])

    if (!isOpen || !transaction) return null

    const isInvoiceReceipt = transaction.type === 'RECEIPT' && transaction.metadata?.source === 'INVOICE_PAYMENT'
    const receiptDetails = [
        { label: 'Receipt No', value: transaction.receiptNo || transaction.receiptNoRaw || transaction.invoiceNo || 'N/A' },
        { label: 'Invoice No', value: transaction.metadata?.invoiceRefNo || 'N/A' },
        { label: 'Payment Mode', value: transaction.mode || 'Cash' },
        { label: 'Payment Status', value: transaction.metadata?.paymentStatus || 'POSTED' },
        { label: 'Paid Amount', value: `Rs ${Number(transaction.metadata?.paidAmount ?? transaction.amount ?? 0).toFixed(2)}` },
        { label: 'Balance Amount', value: `Rs ${Number(transaction.metadata?.balanceAmount ?? 0).toFixed(2)}` },
        { label: 'Allocation Ref', value: transaction.metadata?.allocationRef || transaction.metadata?.allocationId || 'N/A' },
        { label: 'Duty Ref', value: transaction.metadata?.taskRefNo || 'N/A' }
    ]

    const handleConfirm = () => {
        if (type === 'DELETE') {
            onConfirm()
        } else if (type === 'EDIT') {
            onConfirm(formData)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a]">
                <div className="flex shrink-0 items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {type === 'VIEW' && <><Eye className="w-5 h-5 text-yellow-500" /> Transaction Details</>}
                        {type === 'EDIT' && <><Edit2 className="w-5 h-5 text-[#0F969C]" /> Edit Transaction</>}
                        {type === 'DELETE' && <><Trash2 className="w-5 h-5 text-red-500" /> Delete Transaction</>}
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {type === 'DELETE' ? (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete this transaction record? This action cannot be undone.
                            </p>
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-red-700 dark:text-red-400">{transaction.category}</span>
                                    <span className="text-red-900 dark:text-red-300">₹ {Number(transaction.amount || 0).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-red-600/60 mt-1">{transaction.invoiceNo || transaction.receiptNo}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {type === 'VIEW' && isInvoiceReceipt && (
                                <div className="rounded-2xl border border-primary-100 bg-[#0F969C]/10 p-4">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-[#0C7A7E]">Service Receipt</p>
                                            <p className="text-lg font-extrabold text-gray-900">{transaction.receiptNo || transaction.receiptNoRaw || transaction.invoiceNo}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0C7A7E] shadow-sm">
                                            {transaction.metadata?.paymentStatus || 'POSTED'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {receiptDetails.map((detail) => (
                                            <div key={detail.label} className="rounded-xl bg-white/80 p-3">
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{detail.label}</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">{detail.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider uppercase ml-1">Category</label>
                                    <input
                                        disabled={type === 'VIEW'}
                                        value={formData.category}
                                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] dark:text-gray-200 transition-all disabled:opacity-60"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider uppercase ml-1">Date</label>
                                    <input
                                        type="date"
                                        disabled={type === 'VIEW'}
                                        value={formData.date}
                                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] dark:text-gray-200 transition-all disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider uppercase ml-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    disabled={type === 'VIEW'}
                                    value={formData.amount}
                                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] transition-all disabled:opacity-60"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider uppercase ml-1">Entity / Client Name</label>
                                <input
                                    disabled={type === 'VIEW'}
                                    value={formData.clientName}
                                    onChange={e => setFormData(p => ({ ...p, clientName: e.target.value }))}
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] dark:text-gray-200 transition-all disabled:opacity-60"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider uppercase ml-1">Notes / Remarks</label>
                                <textarea
                                    disabled={type === 'VIEW'}
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] dark:text-gray-200 transition-all disabled:opacity-60 resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 p-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50/30 dark:bg-white/1">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        {type === 'VIEW' ? 'Close' : 'Cancel'}
                    </button>
                    {type !== 'VIEW' && (
                        <button
                            onClick={handleConfirm}
                            disabled={isPending}
                            className={`px-6 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 ${type === 'DELETE'
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[#0F969C] hover:bg-[#0C7A7E] text-white'
                                }`}
                        >
                            {isPending ? 'Processing...' : type === 'DELETE' ? 'Yes, Delete' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
