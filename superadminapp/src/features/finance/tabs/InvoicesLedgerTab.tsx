import { useState, useMemo } from 'react'
import {
	Eye,
	Filter,
	IndianRupee,
	Plus,
	Receipt,
	Search,
} from 'lucide-react'
import type { AccountTransaction } from '../finance.types'

type InvoicesLedgerTabProps = {
	invoices: AccountTransaction[]
	isLoading: boolean
	onSelectInvoice: (invoice: AccountTransaction) => void
	onRecordPayment: (invoice: AccountTransaction) => void
	onCreateElderBill: () => void
	onGenerateManualBill: () => void
}

export function InvoicesLedgerTab({
	invoices,
	isLoading,
	onSelectInvoice,
	onRecordPayment,
	onCreateElderBill,
	onGenerateManualBill,
}: InvoicesLedgerTabProps) {
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('ALL')

	const filteredInvoices = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		return invoices.filter((inv) => {
			if (inv.type !== 'INVOICE') return false

			const matchesStatus =
				statusFilter === 'ALL' ||
				(statusFilter === 'PAID' && inv.status === 'PAID') ||
				(statusFilter === 'UNPAID' &&
					(inv.status === 'CREATED' || inv.status === 'PENDING_APPROVAL' || inv.status === 'PARTIALLY_PAID')) ||
				(statusFilter === 'PARTIALLY_PAID' && inv.status === 'PARTIALLY_PAID')

			if (!matchesStatus) return false

			if (!query) return true

			const refNo = (inv.refNo || '').toLowerCase()
			const client = (inv.clientName || '').toLowerCase()
			const notes = (inv.notes || '').toLowerCase()
			const cat = (inv.category || '').toLowerCase()

			return (
				refNo.includes(query) ||
				client.includes(query) ||
				notes.includes(query) ||
				cat.includes(query)
			)
		})
	}, [invoices, searchQuery, statusFilter])

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Filter Header */}
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
					<div className="search-box" style={{ minWidth: '240px', flex: 1 }}>
						<Search size={16} />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by invoice #, resident name, or details..."
						/>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<Filter size={15} color="#64748b" />
						<select
							className="filter-select"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							style={{ height: '38px' }}
						>
							<option value="ALL">All Payment Statuses</option>
							<option value="UNPAID">Unpaid / Outstanding Only</option>
							<option value="PARTIALLY_PAID">Partially Paid</option>
							<option value="PAID">Fully Paid</option>
						</select>
					</div>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						type="button"
						className="button secondary button--small"
						onClick={onCreateElderBill}
					>
						<Receipt size={14} />
						Generate Elder Bill
					</button>
					<button
						type="button"
						className="button primary button--small"
						onClick={onGenerateManualBill}
					>
						<Plus size={14} />
						Universal Manual Bill
					</button>
				</div>
			</div>

			{/* Table Card */}
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
						<Receipt size={32} className="spin" />
						<p>Loading invoice ledger...</p>
					</div>
				) : filteredInvoices.length === 0 ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<Receipt size={36} color="#94a3b8" />
						<h3>No matching billing invoices found</h3>
						<p>Adjust your search query or generate a new patient invoice.</p>
					</div>
				) : (
					<div style={{ overflowX: 'auto' }}>
						<table className="data-table" style={{ width: '100%' }}>
							<thead>
								<tr>
									<th>Invoice / Ref #</th>
									<th>Date</th>
									<th>Resident / Client</th>
									<th>Service Category</th>
									<th style={{ textAlign: 'right' }}>Total (₹)</th>
									<th style={{ textAlign: 'right' }}>Collected (₹)</th>
									<th style={{ textAlign: 'right' }}>Balance Due (₹)</th>
									<th>Status</th>
									<th style={{ textAlign: 'center' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredInvoices.map((inv) => {
									const total = Number(inv.amount || 0)
									const paid = Number(inv.metadata?.paidAmount || 0)
									const balance = Number(
										inv.metadata?.balanceAmount !== undefined
											? inv.metadata.balanceAmount
											: total - paid,
									)

									return (
										<tr key={inv.id}>
											<td>
												<span
													style={{
														fontWeight: 700,
														color: '#0F969C',
														cursor: 'pointer',
													}}
													onClick={() => onSelectInvoice(inv)}
												>
													{inv.refNo}
												</span>
											</td>
											<td style={{ whiteSpace: 'nowrap' }}>
												{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '-'}
											</td>
											<td>
												<span style={{ fontWeight: 600, color: '#0f172a' }}>
													{inv.clientName || inv.notes || 'Patient Family'}
												</span>
											</td>
											<td>
												<span style={{ fontSize: '0.8rem', color: '#475569' }}>
													{inv.category || String(inv.metadata?.serviceType || 'General Care')}
												</span>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 600 }}>
												₹{total.toFixed(2)}
											</td>
											<td style={{ textAlign: 'right', color: '#0F969C', fontWeight: 600 }}>
												₹{paid.toFixed(2)}
											</td>
											<td
												style={{
													textAlign: 'right',
													fontWeight: 700,
													color: balance > 0 ? '#d97706' : '#64748b',
												}}
											>
												₹{balance.toFixed(2)}
											</td>
											<td>
												<span
													className={`status-badge status-badge--${
														inv.status === 'PAID'
															? 'active'
															: inv.status === 'PARTIALLY_PAID'
																? 'warning'
																: 'pending'
													}`}
												>
													{inv.status}
												</span>
											</td>
											<td style={{ textAlign: 'center' }}>
												<div style={{ display: 'inline-flex', gap: '0.35rem' }}>
													<button
														type="button"
														className="button secondary button--small"
														onClick={() => onSelectInvoice(inv)}
														title="View Statement & Receipt"
													>
														<Eye size={13} />
														View
													</button>
													{balance > 0 && (
														<button
															type="button"
															className="button primary button--small"
															onClick={() => onRecordPayment(inv)}
															title="Collect Payment"
														>
															<IndianRupee size={13} />
															Collect
														</button>
													)}
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
