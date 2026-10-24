import {
	AlertCircle,
	ArrowDownLeft,
	ArrowUpRight,
	CheckCircle2,
	Clock,
	FileText,
	Plus,
	Receipt,
	ShoppingBag,
	Wallet,
} from 'lucide-react'
import type { AccountTransaction, CashboxTransaction } from '../finance.types'

type FinanceOverviewTabProps = {
	invoices: AccountTransaction[]
	cashbox: CashboxTransaction[]
	unbilledCostsCount: number
	onNavigateTab: (tabKey: string) => void
	onOpenAddTransaction: (type: 'INCOME' | 'EXPENSE') => void
	onSelectInvoice: (invoice: AccountTransaction) => void
}

export function FinanceOverviewTab({
	invoices,
	cashbox,
	unbilledCostsCount,
	onNavigateTab,
	onOpenAddTransaction,
	onSelectInvoice,
}: FinanceOverviewTabProps) {
	// Aggregate metrics
	const totalInvoiced = invoices
		.filter((i) => i.type === 'INVOICE')
		.reduce((sum, i) => sum + Number(i.amount || 0), 0)

	const totalCollected = invoices
		.filter((i) => i.type === 'INVOICE')
		.reduce((sum, i) => sum + Number(i.metadata?.paidAmount || 0), 0)

	const outstandingBalance = Math.max(0, totalInvoiced - totalCollected)

	const totalIncome = cashbox
		.filter((t) => t.type === 'INCOME' && t.status === 'APPROVED')
		.reduce((sum, t) => sum + Number(t.amount || 0), 0)

	const totalExpense = cashbox
		.filter((t) => t.type === 'EXPENSE' && t.status === 'APPROVED')
		.reduce((sum, t) => sum + Number(t.amount || 0), 0)

	const netCashbox = totalIncome - totalExpense

	const pendingApprovals = cashbox.filter(
		(t) => t.status === 'PENDING_APPROVAL' || t.status === 'CREATED',
	)

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			{/* Metric Ribbon */}
			<div className="summary-ribbon" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Total Invoiced</span>
						<Receipt size={18} className="summary-card__icon" color="#0F969C" />
					</div>
					<div className="summary-card__value">₹{totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
					<span className="summary-card__subtext">Across {invoices.length} billing statements</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Collections</span>
						<CheckCircle2 size={18} className="summary-card__icon" color="#0F969C" />
					</div>
					<div className="summary-card__value" style={{ color: '#0F969C' }}>
						₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
					</div>
					<span className="summary-card__subtext">
						{totalInvoiced > 0
							? `${((totalCollected / totalInvoiced) * 100).toFixed(1)}% recovery rate`
							: 'No active dues'}
					</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Outstanding Dues</span>
						<AlertCircle size={18} className="summary-card__icon" color="#d97706" />
					</div>
					<div className="summary-card__value" style={{ color: outstandingBalance > 0 ? '#d97706' : '#64748b' }}>
						₹{outstandingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
					</div>
					<span className="summary-card__subtext">Receivables pending payment</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Net Cashbox</span>
						<Wallet size={18} className="summary-card__icon" color="#2563eb" />
					</div>
					<div className="summary-card__value" style={{ color: netCashbox >= 0 ? '#2563eb' : '#dc2626' }}>
						₹{netCashbox.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
					</div>
					<span className="summary-card__subtext">Income - Expense balance</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Pending Approvals</span>
						<Clock size={18} className="summary-card__icon" color="#e11d48" />
					</div>
					<div className="summary-card__value" style={{ color: pendingApprovals.length > 0 ? '#e11d48' : '#0F969C' }}>
						{pendingApprovals.length}
					</div>
					<span className="summary-card__subtext">Vouchers requiring audit sign-off</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Unbilled Daily Costs</span>
						<FileText size={18} className="summary-card__icon" color="#64748b" />
					</div>
					<div className="summary-card__value">{unbilledCostsCount}</div>
					<span className="summary-card__subtext">Entries awaiting monthly invoicing</span>
				</div>
			</div>

			{/* Operational Shortcuts Ribbon */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '0.75rem',
					padding: '1rem 1.25rem',
					backgroundColor: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div>
					<h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
						Finance Operational Actions
					</h3>
					<p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
						Issue invoices, log cash flow entries, or finalize monthly statements.
					</p>
				</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onOpenAddTransaction('INCOME')}
					>
						<ArrowDownLeft size={14} color="#0F969C" />
						+ Record Income
					</button>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onOpenAddTransaction('EXPENSE')}
					>
						<ArrowUpRight size={14} color="#dc2626" />
						- Record Expense
					</button>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onNavigateTab('elder-billing')}
					>
						<Receipt size={14} />
						Elder Billing
					</button>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onNavigateTab('manual-billing')}
					>
						<Plus size={14} />
						Manual Universal Bill
					</button>
					<button
						type="button"
						className="button primary button--small"
						onClick={() => onNavigateTab('patient-daily-costs')}
					>
						<FileText size={14} />
						Patient Cost Ledger
					</button>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onNavigateTab('p2p-overview')}
					>
						<ShoppingBag size={14} />
						P2P Accruals & Readiness
					</button>
				</div>
			</div>

			{/* Dual Column: Recent Invoices & Recent Cashbox Transactions */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
				{/* Recent Invoices */}
				<div
					style={{
						backgroundColor: '#ffffff',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
						padding: '1.25rem',
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Recent Patient & Elder Invoices</h3>
							<p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
								Latest statements posted to accounting ledger
							</p>
						</div>
						<button
							type="button"
							className="button text-button button--small"
							onClick={() => onNavigateTab('invoices')}
						>
							View All ({invoices.length}) →
						</button>
					</div>

					{invoices.length === 0 ? (
						<div className="empty-state" style={{ padding: '2rem 1rem' }}>
							<Receipt size={32} />
							<p>No billing invoices recorded yet.</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
							{invoices.slice(0, 5).map((inv) => (
								<div
									key={inv.id}
									onClick={() => onSelectInvoice(inv)}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '0.75rem 0.85rem',
										borderRadius: '8px',
										backgroundColor: '#f8fafc',
										border: '1px solid #f1f5f9',
										cursor: 'pointer',
										transition: 'background-color 0.15s ease',
									}}
								>
									<div>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<strong style={{ fontSize: '0.85rem', color: '#0F969C' }}>{inv.refNo}</strong>
											<span
												className={`status-badge status-badge--${
													inv.status === 'PAID'
														? 'active'
														: inv.status === 'PARTIALLY_PAID'
															? 'warning'
															: 'pending'
												}`}
												style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
											>
												{inv.status}
											</span>
										</div>
										<p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: '#475569' }}>
											{inv.clientName || inv.notes || 'Patient Family'}
										</p>
									</div>
									<div style={{ textAlign: 'right' }}>
										<strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
											₹{Number(inv.amount || 0).toFixed(2)}
										</strong>
										<p style={{ margin: '0.15rem 0 0', fontSize: '0.725rem', color: '#94a3b8' }}>
											{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '-'}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Recent Cashbox & Approvals */}
				<div
					style={{
						backgroundColor: '#ffffff',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
						padding: '1.25rem',
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Cashbox & Approval Queue</h3>
							<p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
								{pendingApprovals.length} vouchers pending verification
							</p>
						</div>
						<button
							type="button"
							className="button text-button button--small"
							onClick={() => onNavigateTab('approvals')}
						>
							View Queue ({pendingApprovals.length}) →
						</button>
					</div>

					{cashbox.length === 0 ? (
						<div className="empty-state" style={{ padding: '2rem 1rem' }}>
							<Wallet size={32} />
							<p>No cashbox vouchers logged.</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
							{cashbox.slice(0, 5).map((t) => (
								<div
									key={t.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '0.75rem 0.85rem',
										borderRadius: '8px',
										backgroundColor: '#f8fafc',
										border: '1px solid #f1f5f9',
									}}
								>
									<div>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<strong style={{ fontSize: '0.85rem', color: '#334155' }}>{t.receiptNo}</strong>
											<span
												style={{
													fontSize: '0.7rem',
													fontWeight: 700,
													color: t.type === 'INCOME' ? '#0F969C' : '#dc2626',
												}}
											>
												{t.type}
											</span>
											<span
												className={`status-badge status-badge--${
													t.status === 'APPROVED' ? 'active' : t.status === 'REJECTED' ? 'warning' : 'pending'
												}`}
												style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
											>
												{t.status}
											</span>
										</div>
										<p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: '#475569' }}>
											{t.clientName} · {t.category}
										</p>
									</div>
									<div style={{ textAlign: 'right' }}>
										<strong
											style={{
												fontSize: '0.9rem',
												color: t.type === 'INCOME' ? '#0F969C' : '#0f172a',
											}}
										>
											{t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toFixed(2)}
										</strong>
										<p style={{ margin: '0.15rem 0 0', fontSize: '0.725rem', color: '#94a3b8' }}>
											{t.date}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
