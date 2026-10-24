import { CheckCircle2, Clock, Eye, ShieldCheck, XCircle } from 'lucide-react'
import type { CashboxTransaction } from '../finance.types'

type PendingApprovalsTabProps = {
	cashbox: CashboxTransaction[]
	isLoading: boolean
	onSelectTransaction: (transaction: CashboxTransaction) => void
	onApproveTransaction: (transaction: CashboxTransaction) => void
}

export function PendingApprovalsTab({
	cashbox,
	isLoading,
	onSelectTransaction,
	onApproveTransaction,
}: PendingApprovalsTabProps) {
	const pendingList = cashbox.filter(
		(t) => t.status === 'PENDING_APPROVAL' || t.status === 'CREATED',
	)

	const pendingExpenseTotal = pendingList
		.filter((t) => t.type === 'EXPENSE')
		.reduce((sum, t) => sum + t.amount, 0)

	const pendingIncomeTotal = pendingList
		.filter((t) => t.type === 'INCOME')
		.reduce((sum, t) => sum + t.amount, 0)

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Metric Ribbon */}
			<div className="summary-ribbon" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Pending Review Vouchers</span>
						<Clock size={18} className="summary-card__icon" color="#e11d48" />
					</div>
					<div className="summary-card__value" style={{ color: '#e11d48' }}>
						{pendingList.length}
					</div>
					<span className="summary-card__subtext">Awaiting administrative approval</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Pending Disbursements</span>
						<XCircle size={18} className="summary-card__icon" color="#dc2626" />
					</div>
					<div className="summary-card__value" style={{ color: '#dc2626' }}>
						₹{pendingExpenseTotal.toFixed(2)}
					</div>
					<span className="summary-card__subtext">Expense claims to be verified</span>
				</div>

				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Pending Receipts</span>
						<CheckCircle2 size={18} className="summary-card__icon" color="#0F969C" />
					</div>
					<div className="summary-card__value" style={{ color: '#0F969C' }}>
						₹{pendingIncomeTotal.toFixed(2)}
					</div>
					<span className="summary-card__subtext">Income vouchers to be confirmed</span>
				</div>
			</div>

			{/* Queue Table */}
			<div
				style={{
					backgroundColor: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: '1rem 1.25rem',
						borderBottom: '1px solid #e2e8f0',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<ShieldCheck size={18} color="#0F969C" />
					<div>
						<h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
							Financial Governance & Approval Queue
						</h3>
						<p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
							Backend RBAC checks enforce authorized approval rights on submission.
						</p>
					</div>
				</div>

				{isLoading ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<Clock size={32} className="spin" />
						<p>Checking pending vouchers...</p>
					</div>
				) : pendingList.length === 0 ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<CheckCircle2 size={40} color="#0F969C" />
						<h3>All vouchers are reviewed</h3>
						<p>There are no transactions currently awaiting authorization.</p>
					</div>
				) : (
					<div style={{ overflowX: 'auto' }}>
						<table className="data-table" style={{ width: '100%' }}>
							<thead>
								<tr>
									<th>Date</th>
									<th>Voucher #</th>
									<th>Type</th>
									<th>Party (Payer / Payee)</th>
									<th>Category</th>
									<th>Payment Mode</th>
									<th style={{ textAlign: 'right' }}>Amount (₹)</th>
									<th>Notes / Details</th>
									<th style={{ textAlign: 'center' }}>Audit Action</th>
								</tr>
							</thead>
							<tbody>
								{pendingList.map((t) => (
									<tr key={t.id}>
										<td style={{ whiteSpace: 'nowrap' }}>{t.date}</td>
										<td>
											<strong style={{ color: '#0F969C' }}>{t.receiptNo}</strong>
										</td>
										<td>
											<span
												style={{
													fontWeight: 700,
													fontSize: '0.75rem',
													color: t.type === 'INCOME' ? '#0F969C' : '#dc2626',
												}}
											>
												{t.type}
											</span>
										</td>
										<td>
											<span style={{ fontWeight: 600, color: '#0f172a' }}>
												{t.clientName}
											</span>
										</td>
										<td>
											<span style={{ fontSize: '0.8rem', color: '#475569' }}>
												{t.category}
											</span>
										</td>
										<td>
											<span style={{ fontSize: '0.8rem', color: '#64748b' }}>
												{t.mode}
											</span>
										</td>
										<td
											style={{
												textAlign: 'right',
												fontWeight: 700,
												fontSize: '0.95rem',
												color: t.type === 'INCOME' ? '#0F969C' : '#0f172a',
											}}
										>
											{t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toFixed(2)}
										</td>
										<td>
											<span style={{ fontSize: '0.8rem', color: '#64748b' }}>
												{t.notes || '-'}
											</span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div style={{ display: 'inline-flex', gap: '0.4rem' }}>
												<button
													type="button"
													className="button secondary button--small"
													onClick={() => onSelectTransaction(t)}
												>
													<Eye size={13} />
													Details
												</button>
												<button
													type="button"
													className="button primary button--small"
													onClick={() => onApproveTransaction(t)}
												>
													<CheckCircle2 size={13} />
													Approve / Reject
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
