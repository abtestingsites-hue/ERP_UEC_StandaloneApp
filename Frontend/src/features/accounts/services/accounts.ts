import { api } from '../../../lib/axios'


const mapTransaction = (t: any) => ({
    ...t,
    id: t.id,
    date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date(t.createdAt).toISOString().split('T')[0],
    receiptNo: t.refNo || t.receiptNo,
    clientName: t.clientName || t.notes || 'Unknown',
    category: t.category || t.metadata?.category || t.notes || 'General',
    amount: t.amount,
    mode: t.paymentMode || t.metadata?.mode || t.mode || 'Cash',
    status: t.status,
    type: t.type,
    notes: t.notes,
    vendor: t.vendor || t.metadata?.vendor || t.clientName,
    remarks: t.remarks || t.metadata?.remarks || t.notes,
    recordedBy: 'Admin',
    currentStatus: t.status
})

export const accountsService = {
    getCashbox: async (options?: { fromDate?: string, toDate?: string }): Promise<any[]> => {
        let transactions: any[] = []

        try {
            const params: any = {}
            if (options?.fromDate) params.fromDate = options.fromDate
            if (options?.toDate) params.toDate = options.toDate

            const res = await api.get('/accounts/cashbox', { params })
            transactions = Array.isArray(res.data.data) ? res.data.data : []
        } catch (error) {
            transactions = []
        }

        return transactions.map(mapTransaction)
    },

    getInvoices: async (options?: { scope?: 'all', unitId?: string | null, search?: string, limit?: number }): Promise<any[]> => {
        const params = {
            ...(options?.scope === 'all' ? { scope: 'all' } : {}),
            ...(options?.search?.trim() ? { search: options.search.trim() } : {}),
            ...(options?.limit ? { limit: options.limit } : {})
        }

        const res = await api.get('/accounts/invoice', {
            params,
            headers: options?.unitId ? { 'x-unit-id': options.unitId } : undefined
        })
        const invoices = Array.isArray(res.data.data) ? res.data.data : []
        return invoices.map(mapTransaction)
    },

    addIncome: async (data: any): Promise<any> => {
        const res = await api.post('/accounts/income', data)
        return res.data.data
    },

    addExpense: async (data: any): Promise<any> => {
        const res = await api.post('/accounts/expense', data)
        return res.data.data
    },

    approveTransaction: async (id: string, status: 'APPROVED' | 'REJECTED', comments?: string): Promise<any> => {
        const res = await api.put(`/accounts/${id}/approve`, { status, comments })
        const t = res.data.data
        return {
            id: t.id,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date(t.createdAt).toISOString().split('T')[0],
            receiptNo: t.refNo,
            clientName: t.clientName || t.notes,
            category: t.category || t.notes,
            amount: t.amount,
            mode: t.paymentMode || 'Cash',
            status: t.status,
            type: t.type,
            notes: t.notes,
            recordedBy: 'Admin',
            currentStatus: t.status
        }
    },

    recordInvoicePayment: async (id: string, data: any): Promise<any> => {
        const res = await api.post(`/accounts/invoice/${id}/payment`, data)
        return res.data.data
    },

    updateTransaction: async (id: string, data: any): Promise<any> => {
        const res = await api.put(`/accounts/${id}`, data)
        return res.data.data
    },

    deleteTransaction: async (id: string): Promise<any> => {
        const res = await api.delete(`/accounts/${id}`)
        return res.data.data
    }
}
