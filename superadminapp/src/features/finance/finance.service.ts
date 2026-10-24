import { api } from '../../services/api'
import type {
	AccountTransaction,
	CashboxTransaction,
	CreateTransactionPayload,
	GenerateElderBillPayload,
	GeneratePatientInvoicePayload,
	InvoiceRecord,
	ManualBillingPayload,
	P2PSummaryData,
	PatientDailyCost,
	PatientLookupResult,
	PatientService,
	RecordInvoicePaymentPayload,
	GRNAccrualItem,
	GRNAccrualsResponse,
	VendorBill,
	VendorBillsResponse,
	CreateVendorBillPayload,
	RecordVendorBillPaymentPayload,
	BankReconciliationParseResponse,
	BankStatementLine,
	RecurringBillingPreviewResponse,
	GstSummaryResponse,
} from './finance.types'

const mapTransaction = (raw: unknown): CashboxTransaction => {
	const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	const metadata = (t.metadata && typeof t.metadata === 'object' ? t.metadata : {}) as Record<string, unknown>

	const rawType = String(t.type || 'EXPENSE').toUpperCase()
	const isIncome = rawType === 'INCOME' || rawType === 'RECEIPT' || rawType === 'INFLOW'
	const mappedType: CashboxTransaction['type'] = isIncome ? 'INCOME' : (rawType === 'INVOICE' ? 'INVOICE' : 'EXPENSE')

	return {
		id: String(t.id || ''),
		date: t.date
			? String(t.date).slice(0, 10)
			: t.createdAt
				? String(t.createdAt).slice(0, 10)
				: new Date().toISOString().slice(0, 10),
		receiptNo: String(t.refNo || t.receiptNo || 'VOUCHER'),
		clientName: String(t.clientName || t.notes || 'General Counter'),
		category: String(t.category || metadata.category || t.notes || 'General'),
		amount: Math.abs(Number(t.amount || 0)),
		mode: String(t.paymentMode || metadata.mode || t.mode || 'Cash'),
		status: (t.status as CashboxTransaction['status']) || 'CREATED',
		type: mappedType,
		notes: String(t.notes || ''),
		vendor: String(t.vendor || metadata.vendor || t.clientName || ''),
		remarks: String(t.remarks || metadata.remarks || t.notes || ''),
		recordedBy: String(t.recordedBy || 'Admin'),
		currentStatus: String(t.status || ''),
		metadata,
	}
}

export const financeService = {
	// ==========================================
	// 1. INVOICES & GENERAL LEDGER (/accounts)
	// ==========================================
	getInvoices: async (options?: {
		scope?: 'all'
		unitId?: string | null
		search?: string
		limit?: number
	}): Promise<AccountTransaction[]> => {
		const params: Record<string, string | number> = {}
		if (options?.scope === 'all') params.scope = 'all'
		if (options?.search?.trim()) params.search = options.search.trim()
		if (options?.limit) params.limit = options.limit

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		const res = await api.get('/accounts/invoice', { params, headers })
		const invoices = Array.isArray(res.data?.data) ? res.data.data : []
		return invoices as AccountTransaction[]
	},

	recordInvoicePayment: async (
		id: string,
		data: RecordInvoicePaymentPayload,
	): Promise<Record<string, unknown>> => {
		const res = await api.post(`/accounts/invoice/${id}/payment`, data)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	// ==========================================
	// 2. CASHBOX & VOUCHERS (/accounts)
	// ==========================================
	getCashbox: async (options?: {
		fromDate?: string
		toDate?: string
		scope?: 'all'
		unitId?: string | null
	}): Promise<CashboxTransaction[]> => {
		const params: Record<string, string> = {}
		if (options?.fromDate) params.fromDate = options.fromDate
		if (options?.toDate) params.toDate = options.toDate
		if (options?.scope === 'all') params.scope = 'all'

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		try {
			const res = await api.get('/accounts/cashbox', { params, headers })
			const transactions = Array.isArray(res.data?.data) ? res.data.data : []
			return transactions.map(mapTransaction)
		} catch {
			return []
		}
	},

	addIncome: async (data: CreateTransactionPayload): Promise<Record<string, unknown>> => {
		const res = await api.post('/accounts/income', data)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	addExpense: async (data: CreateTransactionPayload): Promise<Record<string, unknown>> => {
		const res = await api.post('/accounts/expense', data)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	approveTransaction: async (
		id: string,
		status: 'APPROVED' | 'REJECTED',
		comments?: string,
	): Promise<Record<string, unknown>> => {
		const res = await api.put(`/accounts/${id}/approve`, { status, comments })
		return (res.data?.data || {}) as Record<string, unknown>
	},

	updateTransaction: async (
		id: string,
		data: Record<string, unknown>,
	): Promise<Record<string, unknown>> => {
		const res = await api.put(`/accounts/${id}`, data)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	deleteTransaction: async (id: string): Promise<Record<string, unknown>> => {
		const res = await api.delete(`/accounts/${id}`)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	getForecast: async (): Promise<Record<string, unknown> | null> => {
		try {
			const res = await api.get('/accounts/finance/forecast')
			return (res.data?.data || null) as Record<string, unknown> | null
		} catch {
			return null
		}
	},

	// ==========================================
	// 3. ELDER & MANUAL BILLING (/uec)
	// ==========================================
	getElderFinanceDashboard: async (): Promise<Record<string, unknown> | null> => {
		try {
			const res = await api.get('/uec/dashboard/finance')
			return (res.data?.data || null) as Record<string, unknown> | null
		} catch {
			return null
		}
	},

	generateElderBill: async (payload: GenerateElderBillPayload): Promise<InvoiceRecord> => {
		const res = await api.post('/uec/billing/generate', payload)
		return res.data?.data as InvoiceRecord
	},

	generateManualBill: async (payload: ManualBillingPayload): Promise<InvoiceRecord> => {
		const res = await api.post('/uec/billing/manual-generate', payload)
		return res.data?.data as InvoiceRecord
	},

	getElderBillHistory: async (refNo: string): Promise<InvoiceRecord | null> => {
		const res = await api.get('/uec/billing/history', { params: { refNo } })
		return (res.data?.data || null) as InvoiceRecord | null
	},

	markElderBillSent: async (id: string): Promise<Record<string, unknown>> => {
		const res = await api.patch(`/uec/billing/${id}/mark-sent`)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	// ==========================================
	// 4. PATIENT DAILY EXPENSE LEDGER (/patient-billing)
	// ==========================================
	getPatientBillingServices: async (): Promise<PatientService[]> => {
		try {
			const res = await api.get('/patient-billing/services', { params: { scope: 'all' } })
			return (res.data?.data || []) as PatientService[]
		} catch {
			return []
		}
	},

	getPatientDailyCosts: async (): Promise<PatientDailyCost[]> => {
		try {
			const res = await api.get('/patient-billing/entries', { params: { scope: 'all' } })
			return (res.data?.data || []) as PatientDailyCost[]
		} catch {
			return []
		}
	},

	createPatientDailyCost: async (payload: {
		allocationId: string
		costDate: string
		category: string
		description: string
		quantity: number
		rate: number
		sourceType?: string | null
		sourceId?: string | null
	}): Promise<PatientDailyCost> => {
		const res = await api.post('/patient-billing/entries', payload)
		return res.data?.data as PatientDailyCost
	},

	generatePatientInvoice: async (
		payload: GeneratePatientInvoicePayload,
	): Promise<{ invoice: InvoiceRecord; entries: PatientDailyCost[] }> => {
		const res = await api.post('/patient-billing/generate-invoice', payload)
		return res.data?.data as { invoice: InvoiceRecord; entries: PatientDailyCost[] }
	},

	markPatientReceiptSent: async (payload: {
		invoiceId: string
		sentVia?: string
		familyContact?: string
	}): Promise<Record<string, unknown>> => {
		const res = await api.post('/patient-billing/mark-sent', payload)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	lookupPatient: async (query: string): Promise<PatientLookupResult[]> => {
		if (!query || query.length < 3) return []
		try {
			const res = await api.get('/patient-billing/patient-lookup', {
				params: { query: query.trim() },
			})
			return (res.data?.data || []) as PatientLookupResult[]
		} catch {
			return []
		}
	},

	// ==========================================
	// 5. PROCURE-TO-PAY (P2P) FINANCE (/finance/p2p)
	// ==========================================
	getP2PSummary: async (options?: {
		scope?: 'all'
		unitId?: string | null
	}): Promise<P2PSummaryData> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		const params: Record<string, string> = {}
		if (options?.scope === 'all') params.allUnits = 'true'

		const res = await api.get('/finance/p2p/summary', { params, headers })
		return res.data?.data as P2PSummaryData
	},

	getGRNAccruals: async (options?: {
		page?: number
		limit?: number
		search?: string
		scope?: 'all'
		unitId?: string | null
	}): Promise<GRNAccrualsResponse> => {
		const params: Record<string, string | number> = {}
		if (options?.page) params.page = options.page
		if (options?.limit) params.limit = options.limit
		if (options?.search?.trim()) params.search = options.search.trim()
		if (options?.scope === 'all') params.allUnits = 'true'

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		const res = await api.get('/finance/p2p/grn-accruals', { params, headers })
		return {
			data: (res.data?.data || []) as GRNAccrualItem[],
			pagination: res.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
			schemaStatus: res.data?.schemaStatus || { p2pMigrationApplied: false, costTrackingAvailable: false },
		}
	},

	getVendorBills: async (options?: {
		page?: number
		limit?: number
		status?: string
		search?: string
		scope?: 'all'
		unitId?: string | null
	}): Promise<VendorBillsResponse> => {
		const params: Record<string, string | number> = {}
		if (options?.page) params.page = options.page
		if (options?.limit) params.limit = options.limit
		if (options?.status) params.status = options.status
		if (options?.search?.trim()) params.search = options.search.trim()
		if (options?.scope === 'all') params.allUnits = 'true'

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		const res = await api.get('/finance/p2p/bills', { params, headers })
		return {
			data: (res.data?.data || []) as VendorBill[],
			pagination: res.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
			schemaStatus: res.data?.schemaStatus || { p2pMigrationApplied: false },
		}
	},

	getVendorBillById: async (id: string): Promise<VendorBill> => {
		const res = await api.get(`/finance/p2p/bills/${id}`)
		return res.data?.data as VendorBill
	},

	createVendorBill: async (payload: CreateVendorBillPayload): Promise<VendorBill> => {
		const res = await api.post('/finance/p2p/bills', payload)
		return res.data?.data as VendorBill
	},

	approveVendorBill: async (id: string, notes?: string): Promise<VendorBill> => {
		const res = await api.post(`/finance/p2p/bills/${id}/approve`, { notes })
		return res.data?.data as VendorBill
	},

	recordVendorBillPayment: async (
		id: string,
		payload: RecordVendorBillPaymentPayload,
	): Promise<Record<string, unknown>> => {
		const res = await api.post(`/finance/p2p/bills/${id}/payments`, payload)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	// ==========================================
	// 6. BANK RECONCILIATION
	// ==========================================
	parseBankStatement: async (payload: {
		rawText?: string
		lines?: BankStatementLine[]
		unitId?: string | null
	}): Promise<BankReconciliationParseResponse> => {
		const headers: Record<string, string> = {}
		if (payload.unitId && payload.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = payload.unitId
		}
		const res = await api.post('/finance/bank-reconciliation/parse', payload, { headers })
		return res.data?.data as BankReconciliationParseResponse
	},

	reconcileBankRecord: async (payload: {
		statementLine: BankStatementLine
		targetRecordId: string
		recordType: 'INVOICE' | 'VENDOR_BILL'
		unitId?: string | null
	}): Promise<Record<string, unknown>> => {
		const headers: Record<string, string> = {}
		if (payload.unitId && payload.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = payload.unitId
		}
		const res = await api.post('/finance/bank-reconciliation/reconcile', payload, { headers })
		return (res.data?.data || {}) as Record<string, unknown>
	},

	// ==========================================
	// 7. RECURRING MONTHLY BILLING
	// ==========================================
	getRecurringBillingPreview: async (options?: {
		month?: number
		year?: number
		unitId?: string | null
	}): Promise<RecurringBillingPreviewResponse> => {
		const params: Record<string, number> = {}
		if (options?.month) params.month = options.month
		if (options?.year) params.year = options.year

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		const res = await api.get('/patient-billing/recurring/preview', { params, headers })
		return res.data?.data as RecurringBillingPreviewResponse
	},

	runRecurringBillingCycle: async (payload: {
		month?: number
		year?: number
		selectedAllocationIds?: string[]
		unitId?: string | null
	}): Promise<{ success: boolean; cycleLabel: string; invoicesGenerated: number; totalAmountBilled: number }> => {
		const headers: Record<string, string> = {}
		if (payload.unitId && payload.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = payload.unitId
		}
		const res = await api.post('/patient-billing/recurring/run-cycle', payload, { headers })
		return (res.data?.data || {}) as { success: boolean; cycleLabel: string; invoicesGenerated: number; totalAmountBilled: number }
	},

	// ==========================================
	// 8. GST COMPLIANCE & E-INVOICE EXPORT
	// ==========================================
	getGstSummary: async (options?: {
		fromDate?: string
		toDate?: string
		unitId?: string | null
	}): Promise<GstSummaryResponse> => {
		const params: Record<string, string> = {}
		if (options?.fromDate) params.fromDate = options.fromDate
		if (options?.toDate) params.toDate = options.toDate

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		const res = await api.get('/finance/gst/summary', { params, headers })
		return res.data?.data as GstSummaryResponse
	},

	exportGstEInvoices: async (options?: {
		fromDate?: string
		toDate?: string
		format?: 'json' | 'csv'
		unitId?: string | null
	}): Promise<any> => {
		const params: Record<string, string> = {}
		if (options?.fromDate) params.fromDate = options.fromDate
		if (options?.toDate) params.toDate = options.toDate
		if (options?.format) params.format = options.format

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		if (options?.format === 'csv') {
			const res = await api.get('/finance/gst/e-invoice-export', {
				params,
				headers,
				responseType: 'blob',
			})
			return res.data
		}

		const res = await api.get('/finance/gst/e-invoice-export', { params, headers })
		return res.data?.data
	},
}
