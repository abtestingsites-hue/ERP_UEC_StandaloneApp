export type TransactionType = 'INVOICE' | 'INCOME' | 'EXPENSE'

export type TransactionStatus =
	| 'CREATED'
	| 'PENDING_APPROVAL'
	| 'APPROVED'
	| 'REJECTED'
	| 'PAID'
	| 'PARTIALLY_PAID'
	| 'FINALIZED'
	| 'DRAFT'

export type AccountTransaction = {
	id: string
	refNo: string
	allocationId?: string | null
	type: TransactionType
	amount: number
	paymentMode?: string | null
	category?: string | null
	clientName?: string | null
	status: TransactionStatus
	notes?: string | null
	discountAmount?: number | null
	discountApprovedBy?: string | null
	metadata?: {
		paidAmount?: number
		balanceAmount?: number
		mode?: string
		remarks?: string
		category?: string
		vendor?: string
		invoiceType?: string
		invoiceWorkflowStatus?: string
		chargeSummary?: Array<{
			category?: string
			description?: string
			quantity?: number
			rate?: number
			amount?: number
		}>
		[key: string]: unknown
	} | null
	date: string
	tenantId: string
	unitId: string
	isDeleted?: boolean
	createdAt: string
	updatedAt: string
	allocation?: {
		id: string
		refNo?: string
		patientName?: string
	} | null
}

export type InvoiceRecord = {
	id: string
	refNo?: string | null
	patientId?: string | null
	amount: number
	status: string
	isFinalized: boolean
	isSent?: boolean
	sentAt?: string | null
	contractStartDate?: string | null
	contractEndDate?: string | null
	metadata?: Record<string, unknown> | null
	tenantId: string
	unitId: string
	createdAt: string
	updatedAt: string
}

export type CashboxTransaction = {
	id: string
	date: string
	receiptNo: string
	clientName: string
	category: string
	amount: number
	mode: string
	status: TransactionStatus
	type: TransactionType
	notes?: string
	vendor?: string
	remarks?: string
	recordedBy?: string
	currentStatus?: string
	metadata?: Record<string, unknown> | null
}

export type PatientService = {
	allocationId: string
	allocationRef: string
	admissionId?: string | null
	patientId?: string | null
	patientName: string
	clientName: string
	familyContact?: string
	serviceType: string
	serviceLabel: string
	serviceName: string
	status: string
}

export type PatientDailyCost = {
	id: string
	costNo: string
	allocationId: string
	admissionId?: string | null
	patientName: string
	clientName?: string | null
	serviceType: string
	costDate: string
	category: string
	description: string
	quantity: number
	rate: number
	amount: number
	sourceType?: string | null
	sourceId?: string | null
	status: 'DRAFT' | 'REVIEWED' | 'INVOICED' | 'PAID' | string
	invoiceId?: string | null
	invoiceRefNo?: string | null
	sentAt?: string | null
	sentVia?: string | null
	familyContact?: string | null
	createdAt?: string | null
	updatedAt?: string | null
	metadata?: {
		uploadedBill?: {
			fileName?: string
			originalName?: string
			fileUrl?: string
			mimeType?: string
			size?: number
			uploadedAt?: string
		}
		[key: string]: unknown
	} | null
}

export type CreateTransactionPayload = {
	amount: number
	paymentMode: string
	category: string
	clientName?: string
	notes?: string
	date?: string
	metadata?: Record<string, unknown>
}

export type RecordInvoicePaymentPayload = {
	amount: number
	mode: string
	remarks?: string
}

export type GenerateElderBillPayload = {
	patientId: string
	amount: number
	type: string
	description?: string
}

export type ManualBillingPayload = {
	patientId?: string
	patientName: string
	contractStartDate?: string
	contractEndDate?: string
	totalAmount: number
	billingMonthYear?: string
	billType: 'ELDER_CARE' | 'HOME_CARE'
	patientAge?: string
	patientSex?: string
	patientDob?: string
	membershipPlan?: string
	membershipCategory?: string
	bedSharing?: string
	guardianName?: string
	guardianContact?: string
	guardianAddress?: {
		flat?: string
		building?: string
		street?: string
		area?: string
		city?: string
		district?: string
		state?: string
		pin?: string
	}
	billId?: string
	billingFrequency?: string
	billingDays?: string
	careStaff?: Record<string, unknown>
	therapy?: Record<string, unknown>
	medicalSupport?: Record<string, unknown>
	transportation?: Record<string, unknown>
	lifestyle?: Record<string, unknown>
	accommodation?: Record<string, unknown>
	utility?: Record<string, unknown>
	food?: Record<string, unknown>
	linen?: Record<string, unknown>
	medicalConsumables?: Record<string, unknown>
	homeFields?: Record<string, unknown>
}

export type GeneratePatientInvoicePayload = {
	allocationId?: string
	entryIds?: string[]
	periodFrom?: string
	periodTo?: string
	upiId?: string
	qrLabel?: string
	notes?: string
}

export type PatientLookupResult = {
	id: string
	elderId?: string | null
	name: string
	age?: number | null
	gender?: string | null
	dob?: string | null
	email?: string | null
	phone?: string | null
	address?: string | null
	bloodGroup?: string | null
}

export type FinanceOverviewMetrics = {
	totalInvoiced: number
	totalCollected: number
	outstandingBalance: number
	cashboxBalance: number
	pendingApprovalsCount: number
	unbilledDailyCosts: number
}

export interface P2PSummaryData {
	schemaParity: {
		p2pFinanceMigrated: boolean
		operationalStatus: string
		missingTables?: string[]
		missingColumns?: Record<string, string[]>
	}
	procurement: {
		totalPurchaseOrders: number
		purchaseOrdersByStatus: Record<string, number>
		totalGoodsReceipts: number
	}
	accountsPayable: {
		available: boolean
		status?: string
		message?: string
		totalVendorBills?: number
		vendorBillsByStatus?: Record<string, number>
		totalBilledAmount?: number
		totalPaidAmount?: number
		totalOutstandingAmount?: number
	}
	grnAccruals: {
		available: boolean
		status?: string
		message?: string
		totalUnbilledGRNs?: number
	}
}

export interface GRNAccrualItem {
	id: string
	grnNumber: string
	purchaseOrderId?: string | null
	poNumber?: string | null
	poStatus?: string | null
	vendor?: {
		id: string
		name: string
		code?: string | null
	} | null
	receivedDate: string
	deliveryChallanNo?: string | null
	supplierInvoiceNo?: string | null
	receivedByName?: string | null
	itemsCount: number
	totalReceivedQuantity: number
	totalRejectedQuantity: number
	totalAcceptedQuantity: number
	costAvailable: boolean
	accrualStatus: string
	accrualAmount?: number | null
	journalEntryNumber?: string | null
	notes?: string | null
	createdAt: string
}

export interface GRNAccrualsResponse {
	data: GRNAccrualItem[]
	pagination: {
		total: number
		page: number
		limit: number
		totalPages: number
	}
	schemaStatus: {
		p2pMigrationApplied: boolean
		costTrackingAvailable: boolean
	}
}

export interface VendorBillItem {
	id: string
	vendorBillId: string
	productId: string
	quantity: number
	unitPrice: number
	taxPercent?: number | null
	taxAmount?: number | null
	totalAmount: number
	poItemId?: string | null
	grnItemId?: string | null
	product?: {
		id: string
		name: string
		sku?: string | null
	} | null
}

export type VendorBillStatus =
	| 'DRAFT'
	| 'MATCHED'
	| 'APPROVED'
	| 'PARTIALLY_PAID'
	| 'PAID'
	| 'REJECTED'
	| 'CANCELLED'

export type ThreeWayMatchStatus =
	| 'NOT_MATCHED'
	| 'MATCHED_OK'
	| 'VARIANCE_REJECTED'
	| 'FORCE_APPROVED'

export interface VendorBill {
	id: string
	billNumber: string
	supplierInvoiceNumber: string
	supplierInvoiceDate: string
	vendorId: string
	purchaseOrderId?: string | null
	goodsReceiptNoteId?: string | null
	status: VendorBillStatus
	subtotal: number
	taxAmount: number
	totalAmount: number
	paidAmount: number
	outstandingAmount: number
	matchStatus: ThreeWayMatchStatus
	priceVariance: number
	quantityVariance: number
	journalEntryId?: string | null
	notes?: string | null
	createdAt: string
	updatedAt?: string
	vendor?: {
		id: string
		name: string
		code?: string | null
	} | null
	purchaseOrder?: {
		id: string
		poNumber: string
		status: string
	} | null
	goodsReceiptNote?: {
		id: string
		grnNumber: string
	} | null
	items?: VendorBillItem[]
}

export interface VendorBillsResponse {
	data: VendorBill[]
	pagination: {
		total: number
		page: number
		limit: number
		totalPages: number
	}
	schemaStatus: {
		p2pMigrationApplied: boolean
	}
}

export interface CreateVendorBillPayload {
	supplierInvoiceNumber: string
	supplierInvoiceDate: string
	vendorId: string
	purchaseOrderId?: string | null
	goodsReceiptNoteId?: string | null
	notes?: string | null
	items: Array<{
		productId: string
		quantity: number
		unitPrice: number
		taxPercent?: number
		poItemId?: string | null
		grnItemId?: string | null
	}>
}

export interface RecordVendorBillPaymentPayload {
	amount: number
	paymentMode: string
	referenceNumber?: string
	paymentDate?: string
	notes?: string
}

// ==========================================
// 6. BANK RECONCILIATION
// ==========================================
export interface BankStatementLine {
	id?: string
	date: string
	description: string
	utr: string
	amount: number
	type: 'CR' | 'DR'
}

export interface MatchCandidate {
	lineId: string
	statementLine: BankStatementLine
	matchType: 'EXACT_REF' | 'AMOUNT_AND_PARTY' | 'AMOUNT_ONLY' | 'NO_MATCH'
	confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
	matchedRecord?: {
		id: string
		refNo: string
		partyName: string
		expectedAmount: number
		balanceAmount: number
		recordType: 'INVOICE' | 'VENDOR_BILL'
		status: string
	}
}

export interface BankReconciliationParseResponse {
	totalLines: number
	matchedCount: number
	unmatchedCount: number
	candidates: MatchCandidate[]
}

// ==========================================
// 7. RECURRING MONTHLY BILLING
// ==========================================
export interface RecurringBillingItem {
	allocationId: string
	admissionId?: string | null
	patientId?: string | null
	patientName: string
	clientName: string
	unitId: string
	monthlyBoardingFee: number
	careTariffFee: number
	totalMonthlyFee: number
	status: 'READY_TO_BILL' | 'ALREADY_BILLED'
	existingInvoiceRef?: string | null
	existingInvoiceId?: string | null
}

export interface RecurringBillingPreviewResponse {
	cycleLabel: string
	month: number
	year: number
	totalEligible: number
	readyToBillCount: number
	alreadyBilledCount: number
	estimatedTotalBilling: number
	items: RecurringBillingItem[]
}

// ==========================================
// 8. GST TAX COMPLIANCE & E-INVOICE
// ==========================================
export interface GstSummaryResponse {
	period: {
		fromDate: string
		toDate: string
	}
	totalInvoices: number
	taxableTurnover: number
	exemptTurnover: number
	totalGrossTurnover: number
	taxBreakdown: {
		cgst: number
		sgst: number
		igst: number
		totalTax: number
	}
	b2bInvoicesCount: number
	b2cInvoicesCount: number
	topHsnCodes: Array<{
		hsn: string
		description: string
		taxableAmount: number
		taxRate: number
		taxAmount: number
	}>
}
