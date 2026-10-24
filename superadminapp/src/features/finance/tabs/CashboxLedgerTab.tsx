import { useState, useMemo } from 'react'
import {
	ArrowDownLeft,
	ArrowUpRight,
	Calendar,
	CheckCircle2,
	Eye,
	Search,
	Wallet,
} from 'lucide-react'
import type { CashboxTransaction } from '../finance.types'

type CashboxLedgerTabProps = {
	cashbox: CashboxTransaction[]
	isLoading: boolean
	fromDate: string
	toDate: string
	onDateRangeChange: (from: string, to: string) => void
	onOpenAddTransaction: (type: 'INCOME' | 'EXPENSE') => void
	onSelectTransaction: (transaction: CashboxTransaction) => void
	onApproveTransaction: (transaction: CashboxTransaction) => void
}

export function CashboxLedgerTab({
	cashbox,
	isLoading,
	fromDate,
	toDate,
	onDateRangeChange,
	onOpenAddTransaction,
	onSelectTransaction,
	onApproveTransaction,
}: CashboxLedgerTabProps) {
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [typeFilter, setTypeFilter] = useState<string>('ALL')
	const [statusFilter, setStatusFilter] = useState<string>('ALL')

	const filteredTransactions = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		return cashbox.filter((t) => {
			if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
			if (statusFilter !== 'ALL' && t.status !== statusFilter) return false

			if (!query) return true

			const refNo = (t.receiptNo || '').toLowerCase()
			const client = (t.clientName || '').toLowerCase()
			const notes = (t.notes || '').toLowerCase()
			const cat = (t.category || '').toLowerCase()

			return (
				refNo.includes(query) ||
				client.includes(query) ||
				notes.includes(query) ||
				cat.includes(query)
			)
		})
	}, [cashbox, searchQuery, typeFilter, statusFilter])

	const handleSetThisMonth = () => {
		const now = new Date()
		const first = new Date(now.getFullYear(), now.getMonth(), 1)
			.toISOString()
			.split('T')[0]
		const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
			.toISOString()
			.split('T')[0]
		onDateRangeChange(first, last)
	}

	const handleSetToday = () => {
		const today = new Date().toISOString().split('T')[0]
		onDateRangeChange(today, today)
	}

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Filters & Range Header */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '1rem',
					justifyContent: 'space-between',
					alignItems: 'center',
					backgroundColor: '#ffffff',
					padding: '1rem 1.25rem',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
					<div className="search-box" style={{ minWidth: '220px', flex: 1 }}>
						<Search size={16} />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search voucher, party, or notes..."
						/>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
						<Calendar size={15} color="#64748b" />
						<input
							type="date"
							value={fromDate}
							onChange={(e) => onDateRangeChange(e.target.value, toDate)}
							style={{
								height: '38px',
								border: '1px solid #cbd5e1',
								borderRadius: '6px',
								padding: '0 0.5rem',
								fontSize: '0.8rem',
							}}
						/>
						<span style={{ color: '#64748b', fontSize: '0.8rem' }}>to</span>
						<input
							type="date"
							value={toDate}
							onChange={(e) => onDateRangeChange(fromDate, e.target.value)}
							style={{
								height: '38px',
								border: '1px solid #cbd5e1',
								borderRadius: '6px',
								padding: '0 0.5rem',
								fontSize: '0.8rem',
							}}
						/>
					</div>

					<button
						type="button"
						className="button secondary button--small"
						onClick={handleSetThisMonth}
					>
						This Month
					</button>

					<button
						type="button"
						className="button secondary button--small"
						onClick={handleSetToday}
					>
						Today
					</button>

					<select
						className="filter-select"
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}
						style={{ height: '38px' }}
					>
						<option value="ALL">All Types</option>
						<option value="INCOME">Income (+)</option>
						<option value="EXPENSE">Expense (-)</option>
					</select>

					<select
						className="filter-select"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{ height: '38px' }}
					>
						<option value="ALL">All Statuses</option>
						<option value="APPROVED">Approved</option>
						<option value="PENDING_APPROVAL">Pending Approval</option>
						<option value="REJECTED">Rejected</option>
					</select>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						type="button"
						className="button secondary button--small"
						onClick={() => onOpenAddTransaction('INCOME')}
					>
						<ArrowDownLeft size={14} color="#0F969C" />
						+ Add Income
					</button>
					<button
						type="button"
						className="button primary button--small"
						onClick={() => onOpenAddTransaction('EXPENSE')}
					>
						<ArrowUpRight size={14} />
						- Add Expense
					</button>
				</div>
			</div>

			{/* Cashbox Table */}
			<div
				style={{
					backgroundColor: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					overflow: 'hidden',
				}}
			>
				{isLoading ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<Wallet size={32} className="spin" />
						<p>Loading cashbox transactions...</p>
					</div>
				) : filteredTransactions.length === 0 ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<Wallet size={36} color="#94a3b8" />
						<h3>No cashbox vouchers found</h3>
						<p>Try widening the date range or record a new cashbox voucher.</p>
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
									<th>Mode</th>
									<th style={{ textAlign: 'right' }}>Amount (₹)</th>
									<th>Status</th>
									<th style={{ textAlign: 'center' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredTransactions.map((t) => (
									<tr key={t.id}>
										<td style={{ whiteSpace: 'nowrap' }}>{t.date}</td>
										<td>
											<span
												style={{
													fontWeight: 700,
													color: '#0F969C',
													cursor: 'pointer',
												}}
												onClick={() => onSelectTransaction(t)}
											>
												{t.receiptNo}
											</span>
										</td>
										<td>
											{(() => {
												const isIncome = t.type === 'INCOME' || String(t.type).toUpperCase() === 'RECEIPT'
												return (
													<span
														style={{
															fontWeight: 700,
															fontSize: '0.75rem',
															color: isIncome ? '#0F969C' : '#dc2626',
														}}
													>
														{isIncome ? 'RECEIPT' : 'EXPENSE'}
													</span>
												)
											})()}
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
												color:
													t.type === 'INCOME' || String(t.type).toUpperCase() === 'RECEIPT'
														? '#0F969C'
														: '#dc2626',
											}}
										>
											{t.type === 'INCOME' || String(t.type).toUpperCase() === 'RECEIPT' ? '+' : '-'}₹
											{Math.abs(t.amount).toFixed(2)}
										</td>
										<td>
											<span
												className={`status-badge status-badge--${
													t.status === 'APPROVED'
														? 'active'
														: t.status === 'REJECTED'
															? 'warning'
															: 'pending'
												}`}
											>
												{t.status}
											</span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div style={{ display: 'inline-flex', gap: '0.35rem' }}>
												<button
													type="button"
													className="button secondary button--small"
													onClick={() => onSelectTransaction(t)}
													title="View Voucher Details"
												>
													<Eye size={13} />
													View
												</button>
												{t.status === 'PENDING_APPROVAL' && (
													<button
														type="button"
														className="button primary button--small"
														onClick={() => onApproveTransaction(t)}
														title="Verify & Approve"
													>
														<CheckCircle2 size={13} />
														Audit
													</button>
												)}
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
