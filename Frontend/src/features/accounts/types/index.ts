export interface Transaction {
    id: string
    date: string
    receiptNo: string
    clientName: string
    category: string
    amount: number
    mode: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer'
    status: 'Approved' | 'Pending' | 'Rejected' | string
    recordedBy: string
    currentStatus?: string
}
