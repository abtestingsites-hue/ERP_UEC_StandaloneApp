import { useEffect, useState } from 'react'
import {
	BarChart3,
	Building2,
	FileText,
	Receipt,
	RefreshCw,
	ShoppingBag,
	Wallet,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { useActiveUnit } from '../../context/useActiveUnit'
import { financeService } from './finance.service'
import type {
	AccountTransaction,
	CashboxTransaction,
	PatientDailyCost,
	PatientService,
} from './finance.types'

import { FinanceOverviewTab } from './tabs/FinanceOverviewTab'
import { InvoicesLedgerTab } from './tabs/InvoicesLedgerTab'
import { CashboxLedgerTab } from './tabs/CashboxLedgerTab'
import { PendingApprovalsTab } from './tabs/PendingApprovalsTab'
import { ElderBillingTab } from './tabs/ElderBillingTab'
import { ManualBillingTab } from './tabs/ManualBillingTab'
import { PatientDailyCostTab } from './tabs/PatientDailyCostTab'
import { P2POverviewTab } from './tabs/P2POverviewTab'
import { P2PGRNAccrualsTab } from './tabs/P2PGRNAccrualsTab'
import { VendorBillsTab } from './tabs/VendorBillsTab'

import { RecordPaymentModal } from './components/RecordPaymentModal'
import { AddTransactionModal } from './components/AddTransactionModal'
import { ApprovalDialog } from './components/ApprovalDialog'
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer'
import { PatientBillReceiptDrawer } from './components/PatientBillReceiptDrawer'
import { BankReconciliationModal } from './components/BankReconciliationModal'
import { GstComplianceModal } from './components/GstComplianceModal'
import { RecurringBillingModal } from './components/RecurringBillingModal'

export type FinancePerspective =
	| 'EXECUTIVE_INVOICES'
	| 'CASHBOX_OPERATIONS'
	| 'ELDER_UNIVERSAL_BILLING'
	| 'PATIENT_LEDGER'
	| 'P2P_FINANCE'

export function FinanceWorkspace() {
	const { activeUnitName, activeUnitId } = useActiveUnit()

	// Perspective and tab selection
	const [perspective, setPerspective] = useState<FinancePerspective>(
		'EXECUTIVE_INVOICES',
	)
	const [activeTab, setActiveTab] = useState<string>('overview')

	// Cashbox date range defaults to current month
	const now = new Date()
	const defaultFirst = new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString()
		.split('T')[0]
	const defaultLast = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		.toISOString()
		.split('T')[0]
	const [fromDate, setFromDate] = useState<string>(defaultFirst)
	const [toDate, setToDate] = useState<string>(defaultLast)

	// State
	const [invoices, setInvoices] = useState<AccountTransaction[]>([])
	const [cashbox, setCashbox] = useState<CashboxTransaction[]>([])
	const [patientServices, setPatientServices] = useState<PatientService[]>([])
	const [patientDailyCosts, setPatientDailyCosts] = useState<PatientDailyCost[]>([])

	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	// Modals and Drawers
	const [selectedInvoice, setSelectedInvoice] =
		useState<AccountTransaction | null>(null)
	const [paymentInvoice, setPaymentInvoice] =
		useState<AccountTransaction | null>(null)
	const [selectedCashboxTransaction, setSelectedCashboxTransaction] =
		useState<CashboxTransaction | null>(null)
	const [approvingTransaction, setApprovingTransaction] =
		useState<CashboxTransaction | null>(null)
	const [addTransactionType, setAddTransactionType] = useState<
		'INCOME' | 'EXPENSE' | null
	>(null)

	// Automated Tools & Compliance Modals
	const [isBankReconOpen, setIsBankReconOpen] = useState<boolean>(false)
	const [isGstComplianceOpen, setIsGstComplianceOpen] = useState<boolean>(false)
	const [isRecurringBillingOpen, setIsRecurringBillingOpen] = useState<boolean>(false)

	// Fetch data when activeUnitId or refreshTrigger changes
	useEffect(() => {
		let isMounted = true

		const loadAllFinanceData = async () => {
			try {
				const [invRes, cashRes, servRes, costsRes] = await Promise.all([
					financeService.getInvoices({
						scope: activeUnitId === 'ALL_UNITS' ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					financeService.getCashbox({
						fromDate,
						toDate,
						scope: activeUnitId === 'ALL_UNITS' ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					financeService.getPatientBillingServices(),
					financeService.getPatientDailyCosts(),
				])

				if (isMounted) {
					setInvoices(invRes)
					setCashbox(cashRes)
					setPatientServices(servRes)
					setPatientDailyCosts(costsRes)
					setIsLoading(false)
				}
			} catch (err) {
				console.error('[FinanceWorkspace] Failed to fetch finance data:', err)
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadAllFinanceData()

		return () => {
			isMounted = false
		}
	}, [activeUnitId, fromDate, toDate, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((prev) => prev + 1)
	}

	const handleNavigateTab = (tabKey: string) => {
		if (tabKey === 'overview' || tabKey === 'invoices') {
			setPerspective('EXECUTIVE_INVOICES')
			setActiveTab(tabKey)
		} else if (tabKey === 'cashbox' || tabKey === 'approvals') {
			setPerspective('CASHBOX_OPERATIONS')
			setActiveTab(tabKey)
		} else if (tabKey === 'elder-billing' || tabKey === 'manual-billing') {
			setPerspective('ELDER_UNIVERSAL_BILLING')
			setActiveTab(tabKey)
		} else if (tabKey === 'patient-daily-costs') {
			setPerspective('PATIENT_LEDGER')
			setActiveTab('patient-daily-costs')
		} else if (
			tabKey === 'p2p-overview' ||
			tabKey === 'p2p-grn-accruals' ||
			tabKey === 'p2p-vendor-bills'
		) {
			setPerspective('P2P_FINANCE')
			setActiveTab(tabKey)
		}
	}

	const handlePerspectiveChange = (newPerspective: FinancePerspective) => {
		setPerspective(newPerspective)
		if (newPerspective === 'EXECUTIVE_INVOICES') {
			setActiveTab('overview')
		} else if (newPerspective === 'CASHBOX_OPERATIONS') {
			setActiveTab('cashbox')
		} else if (newPerspective === 'ELDER_UNIVERSAL_BILLING') {
			setActiveTab('elder-billing')
		} else if (newPerspective === 'PATIENT_LEDGER') {
			setActiveTab('patient-daily-costs')
		} else if (newPerspective === 'P2P_FINANCE') {
			setActiveTab('p2p-overview')
		}
	}

	const unbilledCostsCount = patientDailyCosts.filter(
		(c) => c.status === 'DRAFT' || c.status === 'REVIEWED',
	).length

	const pendingApprovalsCount = cashbox.filter(
		(t) => t.status === 'PENDING_APPROVAL' || t.status === 'CREATED',
	).length

	return (
		<div className="workspace-container">
			<PageHeader
				eyebrow="DOMAIN INTEGRATION — PHASE 10"
				title="Finance & Accounts Command Center"
				description="Enterprise billing engine, general ledger invoices, cashbox vouchers, elder boarding fees, and patient expense lifecycle."
			/>

			{/* Perspective & Operating Unit Header */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '1rem',
					marginBottom: '1rem',
					backgroundColor: '#ffffff',
					padding: '0.85rem 1.25rem',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
				}}
			>
				{/* Perspective Switcher */}
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
					<button
						type="button"
						className={`button ${perspective === 'EXECUTIVE_INVOICES' ? 'primary' : 'secondary'} button--small`}
						onClick={() => handlePerspectiveChange('EXECUTIVE_INVOICES')}
					>
						<Receipt size={14} />
						Executive & Invoices
					</button>

					<button
						type="button"
						className={`button ${perspective === 'CASHBOX_OPERATIONS' ? 'primary' : 'secondary'} button--small`}
						onClick={() => handlePerspectiveChange('CASHBOX_OPERATIONS')}
					>
						<Wallet size={14} />
						Cashbox & Operations
						{pendingApprovalsCount > 0 && (
							<span
								style={{
									marginLeft: '0.35rem',
									backgroundColor: '#e11d48',
									color: '#fff',
									borderRadius: '10px',
									padding: '0.1rem 0.4rem',
									fontSize: '0.7rem',
									fontWeight: 800,
								}}
							>
								{pendingApprovalsCount}
							</span>
						)}
					</button>

					<button
						type="button"
						className={`button ${perspective === 'ELDER_UNIVERSAL_BILLING' ? 'primary' : 'secondary'} button--small`}
						onClick={() => handlePerspectiveChange('ELDER_UNIVERSAL_BILLING')}
					>
						<BarChart3 size={14} />
						Elder Care & Manual Billing
					</button>

					<button
						type="button"
						className={`button ${perspective === 'PATIENT_LEDGER' ? 'primary' : 'secondary'} button--small`}
						onClick={() => handlePerspectiveChange('PATIENT_LEDGER')}
					>
						<FileText size={14} />
						Patient Cost Ledger
						{unbilledCostsCount > 0 && (
							<span
								style={{
									marginLeft: '0.35rem',
									backgroundColor: '#0F969C',
									color: '#fff',
									borderRadius: '10px',
									padding: '0.1rem 0.4rem',
									fontSize: '0.7rem',
									fontWeight: 800,
								}}
							>
								{unbilledCostsCount}
							</span>
						)}
					</button>

					<button
						type="button"
						className={`button ${perspective === 'P2P_FINANCE' ? 'primary' : 'secondary'} button--small`}
						onClick={() => handlePerspectiveChange('P2P_FINANCE')}
					>
						<ShoppingBag size={14} />
						Procure-to-Pay (P2P)
					</button>
				</div>

				{/* Active Unit Badge & Action Tools */}
				<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
					<button
						type="button"
						className="button button--small secondary"
						onClick={() => setIsBankReconOpen(true)}
						title="Automated Bank Statement Reconciliation"
						style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
					>
						<Building2 size={13} color="#0284c7" />
						Bank Reconciliation
					</button>

					<button
						type="button"
						className="button button--small secondary"
						onClick={() => setIsGstComplianceOpen(true)}
						title="GST Tax Compliance & E-Invoice Export"
						style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
					>
						<FileText size={13} color="#059669" />
						GST & E-Invoices
					</button>

					{perspective === 'ELDER_UNIVERSAL_BILLING' && (
						<button
							type="button"
							className="button button--small secondary"
							onClick={() => setIsRecurringBillingOpen(true)}
							title="Automated Monthly Recurring Billing Engine"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.35rem',
								fontSize: '0.8rem',
								backgroundColor: '#eff6ff',
								borderColor: '#bfdbfe',
								color: '#1d4ed8',
								fontWeight: 600,
							}}
						>
							<Receipt size={13} color="#2563eb" />
							Monthly Recurring Cycle
						</button>
					)}

					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.4rem',
							backgroundColor: '#f1f5f9',
							padding: '0.35rem 0.75rem',
							borderRadius: '6px',
							fontSize: '0.8rem',
							color: '#334155',
							fontWeight: 600,
						}}
					>
						<Building2 size={14} color="#0F969C" />
						Unit Scope: <strong>{activeUnitName || activeUnitId}</strong>
					</div>

					<button
						type="button"
						className="icon-button"
						onClick={handleRefresh}
						title="Refresh Finance Data"
						disabled={isLoading}
					>
						<RefreshCw size={16} className={isLoading ? 'spin' : ''} />
					</button>
				</div>
			</div>

			{/* Secondary Navigation Tabs within Active Perspective */}
			<div className="tab-navigation" style={{ marginBottom: '1.25rem' }}>
				{perspective === 'EXECUTIVE_INVOICES' && (
					<>
						<button
							type="button"
							className={`tab-button ${activeTab === 'overview' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('overview')}
						>
							Finance Overview
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === 'invoices' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('invoices')}
						>
							Invoices Ledger ({invoices.length})
						</button>
					</>
				)}

				{perspective === 'CASHBOX_OPERATIONS' && (
					<>
						<button
							type="button"
							className={`tab-button ${activeTab === 'cashbox' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('cashbox')}
						>
							Cashbox Ledger ({cashbox.length})
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === 'approvals' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('approvals')}
						>
							Pending Approval Queue ({pendingApprovalsCount})
						</button>
					</>
				)}

				{perspective === 'ELDER_UNIVERSAL_BILLING' && (
					<>
						<button
							type="button"
							className={`tab-button ${activeTab === 'elder-billing' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('elder-billing')}
						>
							Elder Care Recurring Billing
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === 'manual-billing' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('manual-billing')}
						>
							Universal Manual Bill Generator
						</button>
					</>
				)}

				{perspective === 'PATIENT_LEDGER' && (
					<button
						type="button"
						className="tab-button tab-button--active"
						onClick={() => setActiveTab('patient-daily-costs')}
					>
						Patient Daily Expense Ledger ({patientDailyCosts.length})
					</button>
				)}

				{perspective === 'P2P_FINANCE' && (
					<>
						<button
							type="button"
							className={`tab-button ${activeTab === 'p2p-overview' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('p2p-overview')}
						>
							P2P Overview & Financial Readiness
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === 'p2p-grn-accruals' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('p2p-grn-accruals')}
						>
							GRN Accrual Register
						</button>
						<button
							type="button"
							className={`tab-button ${activeTab === 'p2p-vendor-bills' ? 'tab-button--active' : ''}`}
							onClick={() => setActiveTab('p2p-vendor-bills')}
						>
							Vendor Bills & 3-Way Match
						</button>
					</>
				)}
			</div>

			{/* Main Tab Content */}
			{perspective === 'EXECUTIVE_INVOICES' && activeTab === 'overview' && (
				<FinanceOverviewTab
					invoices={invoices}
					cashbox={cashbox}
					unbilledCostsCount={unbilledCostsCount}
					onNavigateTab={handleNavigateTab}
					onOpenAddTransaction={(type) => setAddTransactionType(type)}
					onSelectInvoice={(inv) => setSelectedInvoice(inv)}
				/>
			)}

			{perspective === 'EXECUTIVE_INVOICES' && activeTab === 'invoices' && (
				<InvoicesLedgerTab
					invoices={invoices}
					isLoading={isLoading}
					onSelectInvoice={(inv) => setSelectedInvoice(inv)}
					onRecordPayment={(inv) => setPaymentInvoice(inv)}
					onCreateElderBill={() => {
						setPerspective('ELDER_UNIVERSAL_BILLING')
						setActiveTab('elder-billing')
					}}
					onGenerateManualBill={() => {
						setPerspective('ELDER_UNIVERSAL_BILLING')
						setActiveTab('manual-billing')
					}}
				/>
			)}

			{perspective === 'CASHBOX_OPERATIONS' && activeTab === 'cashbox' && (
				<CashboxLedgerTab
					cashbox={cashbox}
					isLoading={isLoading}
					fromDate={fromDate}
					toDate={toDate}
					onDateRangeChange={(from, to) => {
						setFromDate(from)
						setToDate(to)
					}}
					onOpenAddTransaction={(type) => setAddTransactionType(type)}
					onSelectTransaction={(t) => setSelectedCashboxTransaction(t)}
					onApproveTransaction={(t) => setApprovingTransaction(t)}
				/>
			)}

			{perspective === 'CASHBOX_OPERATIONS' && activeTab === 'approvals' && (
				<PendingApprovalsTab
					cashbox={cashbox}
					isLoading={isLoading}
					onSelectTransaction={(t) => setSelectedCashboxTransaction(t)}
					onApproveTransaction={(t) => setApprovingTransaction(t)}
				/>
			)}

			{perspective === 'ELDER_UNIVERSAL_BILLING' && activeTab === 'elder-billing' && (
				<ElderBillingTab
					onInvoiceGenerated={() => {
						handleRefresh()
					}}
				/>
			)}

			{perspective === 'ELDER_UNIVERSAL_BILLING' && activeTab === 'manual-billing' && (
				<ManualBillingTab
					onInvoiceGenerated={() => {
						handleRefresh()
					}}
				/>
			)}

			{perspective === 'PATIENT_LEDGER' && activeTab === 'patient-daily-costs' && (
				<PatientDailyCostTab
					entries={patientDailyCosts}
					services={patientServices}
					isLoading={isLoading}
					onRefresh={handleRefresh}
					onInvoiceGenerated={() => {
						handleRefresh()
					}}
				/>
			)}

			{perspective === 'P2P_FINANCE' && activeTab === 'p2p-overview' && (
				<P2POverviewTab
					activeUnitId={activeUnitId}
					onNavigateTab={handleNavigateTab}
				/>
			)}

			{perspective === 'P2P_FINANCE' && activeTab === 'p2p-grn-accruals' && (
				<P2PGRNAccrualsTab
					activeUnitId={activeUnitId}
				/>
			)}

			{perspective === 'P2P_FINANCE' && activeTab === 'p2p-vendor-bills' && (
				<VendorBillsTab
					activeUnitId={activeUnitId}
				/>
			)}

			{/* Modals and Drawers */}
			{paymentInvoice && (
				<RecordPaymentModal
					invoice={paymentInvoice}
					onClose={() => setPaymentInvoice(null)}
					onSuccess={() => {
						setPaymentInvoice(null)
						handleRefresh()
					}}
				/>
			)}

			{addTransactionType && (
				<AddTransactionModal
					defaultType={addTransactionType}
					onClose={() => setAddTransactionType(null)}
					onSuccess={() => {
						setAddTransactionType(null)
						handleRefresh()
					}}
				/>
			)}

			{approvingTransaction && (
				<ApprovalDialog
					transaction={approvingTransaction}
					onClose={() => setApprovingTransaction(null)}
					onSuccess={() => {
						setApprovingTransaction(null)
						handleRefresh()
					}}
				/>
			)}

			{selectedCashboxTransaction && (
				<TransactionDetailDrawer
					transaction={selectedCashboxTransaction}
					onClose={() => setSelectedCashboxTransaction(null)}
					onApprove={() => {
						const t = selectedCashboxTransaction
						setSelectedCashboxTransaction(null)
						setApprovingTransaction(t)
					}}
				/>
			)}

			{selectedInvoice && (
				<PatientBillReceiptDrawer
					invoice={selectedInvoice}
					onClose={() => setSelectedInvoice(null)}
					onMarkSent={async (contact?: string) => {
						try {
							const familyContact =
								contact ||
								(selectedInvoice.metadata?.familyContact as string) ||
								undefined
							await financeService.markPatientReceiptSent({
								invoiceId: selectedInvoice.id,
								sentVia: 'WhatsApp',
								familyContact,
							})
							setSelectedInvoice(null)
							handleRefresh()
						} catch (err) {
							const error = err as Error
							alert(error?.message || 'Failed to update statement dispatch.')
						}
					}}
				/>
			)}

			<BankReconciliationModal
				isOpen={isBankReconOpen}
				onClose={() => setIsBankReconOpen(false)}
				activeUnitId={activeUnitId || undefined}
				onSuccess={handleRefresh}
			/>

			<GstComplianceModal
				isOpen={isGstComplianceOpen}
				onClose={() => setIsGstComplianceOpen(false)}
				activeUnitId={activeUnitId || undefined}
			/>

			<RecurringBillingModal
				isOpen={isRecurringBillingOpen}
				onClose={() => setIsRecurringBillingOpen(false)}
				activeUnitId={activeUnitId || undefined}
				onSuccess={handleRefresh}
			/>
		</div>
	)
}
