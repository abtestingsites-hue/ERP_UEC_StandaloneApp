import { useEffect, useState } from 'react'
import {
	AlertTriangle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	FileCheck,
	FileText,
	PackageCheck,
	Plus,
	RefreshCw,
	Search,
	ShieldAlert,
	X,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type {
	CreateVendorBillPayload,
	RecordVendorBillPaymentPayload,
	VendorBill,
	VendorBillStatus,
} from '../finance.types'

type VendorBillsTabProps = {
	activeUnitId?: string | null
}

export function VendorBillsTab({ activeUnitId }: VendorBillsTabProps) {
	const [bills, setBills] = useState<VendorBill[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('ALL')
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [totalPages, setTotalPages] = useState<number>(1)
	const [totalCount, setTotalCount] = useState<number>(0)
	const [p2pMigrationApplied, setP2pMigrationApplied] = useState<boolean>(false)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	// Modals and Drawers
	const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
	const [paymentBill, setPaymentBill] = useState<VendorBill | null>(null)
	const [actionLoading, setActionLoading] = useState<boolean>(false)
	const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	useEffect(() => {
		let isMounted = true

		const fetchBills = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const res = await financeService.getVendorBills({
					page: currentPage,
					limit: 10,
					status: statusFilter !== 'ALL' ? statusFilter : undefined,
					search: searchQuery.trim() || undefined,
					scope: activeUnitId === 'ALL_UNITS' ? 'all' : undefined,
					unitId: activeUnitId,
				})

				if (isMounted) {
					setBills(res.data)
					setTotalPages(res.pagination.totalPages || 1)
					setTotalCount(res.pagination.total || 0)
					setP2pMigrationApplied(Boolean(res.schemaStatus?.p2pMigrationApplied))
					setIsLoading(false)
				}
			} catch (err: unknown) {
				if (isMounted) {
					const msg = err instanceof Error ? err.message : 'Failed to fetch vendor bills'
					setError(msg)
					setIsLoading(false)
				}
			}
		}

		fetchBills()
		return () => {
			isMounted = false
		}
	}, [activeUnitId, currentPage, searchQuery, statusFilter, refreshTrigger])

	const handleRefresh = () => {
		setRefreshTrigger((prev) => prev + 1)
		setActionMessage(null)
	}

	const handleApproveBill = async (bill: VendorBill) => {
		if (!p2pMigrationApplied) {
			setActionMessage({
				type: 'error',
				text: 'Approval blocked: P2P schema migration is pending deployment.',
			})
			return
		}
		setActionLoading(true)
		setActionMessage(null)
		try {
			await financeService.approveVendorBill(bill.id)
			setActionMessage({
				type: 'success',
				text: `Vendor bill ${bill.billNumber} successfully approved and posted to General Ledger.`,
			})
			handleRefresh()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to approve bill'
			setActionMessage({ type: 'error', text: msg })
		} finally {
			setActionLoading(false)
		}
	}

	const formatStatusBadge = (status: VendorBillStatus) => {
		switch (status) {
			case 'APPROVED':
				return { label: 'Approved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
			case 'PAID':
				return { label: 'Settled / Paid', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
			case 'PARTIALLY_PAID':
				return { label: 'Partially Paid', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
			case 'MATCHED':
				return { label: '3-Way Matched', bg: '#fdf4ff', color: '#9333ea', border: '#f0abfc' }
			case 'REJECTED':
				return { label: 'Variance Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
			case 'CANCELLED':
				return { label: 'Cancelled', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
			case 'DRAFT':
			default:
				return { label: 'Draft', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
		}
	}

	const formatMatchBadge = (matchStatus: string, pVariance: number, qVariance: number) => {
		if (matchStatus === 'MATCHED_OK') {
			return { label: 'Perfect Match (0.00)', bg: '#f0fdf4', color: '#16a34a' }
		}
		if (matchStatus === 'VARIANCE_REJECTED' || pVariance > 0 || qVariance > 0) {
			return {
				label: `Variance (P: ₹${pVariance.toFixed(2)}, Q: ${qVariance})`,
				bg: '#fef2f2',
				color: '#dc2626',
			}
		}
		if (matchStatus === 'FORCE_APPROVED') {
			return { label: 'Variance Overridden', bg: '#fffbeb', color: '#d97706' }
		}
		return { label: 'Unmatched / Pending', bg: '#f1f5f9', color: '#475569' }
	}

	return (
		<div>
			{/* Top Bar with Title and Action */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '1.25rem',
					flexWrap: 'wrap',
					gap: '1rem',
				}}
			>
				<div>
					<h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
						Vendor Bills & 3-Way Matching
					</h2>
					<p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
						Audit supplier invoices against Purchase Orders and Goods Receipt Notes, detect variances, and record AP settlements.
					</p>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					<button
						type="button"
						className="button secondary"
						onClick={handleRefresh}
						disabled={isLoading}
						style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
					>
						<RefreshCw size={15} className={isLoading ? 'spin' : ''} />
						Refresh
					</button>

					<button
						type="button"
						className="button primary"
						onClick={() => setIsCreateModalOpen(true)}
						disabled={!p2pMigrationApplied}
						title={
							!p2pMigrationApplied
								? 'Vendor bill registration is disabled until P2P schema migration is applied to the operational database'
								: 'Register new vendor bill and perform 3-way match'
						}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.4rem',
							opacity: !p2pMigrationApplied ? 0.6 : 1,
							cursor: !p2pMigrationApplied ? 'not-allowed' : 'pointer',
						}}
					>
						<Plus size={16} />
						Register Vendor Bill
					</button>
				</div>
			</div>

			{/* Operational DB Migration Notice */}
			{!p2pMigrationApplied && (
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: '0.75rem',
						backgroundColor: '#fffbeb',
						border: '1px solid #fde68a',
						borderRadius: '10px',
						padding: '1rem 1.25rem',
						marginBottom: '1.25rem',
						color: '#92400e',
					}}
				>
					<ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
					<div style={{ fontSize: '0.875rem', lineHeight: '1.45' }}>
						<strong style={{ display: 'block', marginBottom: '0.25rem' }}>
							Database Migration Pending — Read-Only Compatibility Mode
						</strong>
						Vendor bill registration, 3-way matching, and Accounts Payable liability tracking are paused awaiting deployment of migration{' '}
						<code>20261104000000_p2p_costing_ap_gl</code> to the operational database. All operational procurement records, goods receipts, and existing GL transactions remain safely intact. Write endpoints safely reject requests with code <code>MIGRATION_PENDING</code>.
					</div>
				</div>
			)}

			{/* Action Message Feedback */}
			{actionMessage && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.75rem',
						backgroundColor: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
						border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
						borderRadius: '8px',
						padding: '0.75rem 1rem',
						marginBottom: '1rem',
						color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
						fontSize: '0.875rem',
					}}
				>
					{actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
					<span>{actionMessage.text}</span>
				</div>
			)}

			{/* KPI Summary Cards */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
					gap: '1rem',
					marginBottom: '1.25rem',
				}}
			>
				<div
					style={{
						backgroundColor: '#ffffff',
						border: '1px solid #e2e8f0',
						borderRadius: '10px',
						padding: '1rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
						<FileText size={16} color="#0F969C" />
						TOTAL VENDOR BILLS
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
						{p2pMigrationApplied ? totalCount : 'Unavailable'}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
						{p2pMigrationApplied ? 'Active liabilities registered' : 'Awaiting schema migration'}
					</div>
				</div>

				<div
					style={{
						backgroundColor: '#ffffff',
						border: '1px solid #e2e8f0',
						borderRadius: '10px',
						padding: '1rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
						<FileCheck size={16} color="#16a34a" />
						3-WAY MATCH STATUS
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
						{p2pMigrationApplied ? bills.filter((b) => b.matchStatus === 'MATCHED_OK').length : 'Unavailable'}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
						{p2pMigrationApplied ? 'Perfect PO/GRN quantity & price matches' : 'Schema migration pending'}
					</div>
				</div>

				<div
					style={{
						backgroundColor: '#ffffff',
						border: '1px solid #e2e8f0',
						borderRadius: '10px',
						padding: '1rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
						<AlertTriangle size={16} color="#dc2626" />
						MATCH EXCEPTIONS / VARIANCES
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
						{p2pMigrationApplied ? bills.filter((b) => b.matchStatus === 'VARIANCE_REJECTED').length : 'Unavailable'}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
						{p2pMigrationApplied ? 'Price/quantity variance flags' : 'Schema migration pending'}
					</div>
				</div>

				<div
					style={{
						backgroundColor: '#ffffff',
						border: '1px solid #e2e8f0',
						borderRadius: '10px',
						padding: '1rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
						<DollarSign size={16} color="#d97706" />
						OUTSTANDING AP LIABILITY
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
						{p2pMigrationApplied
							? `₹${bills.reduce((acc, b) => acc + (b.outstandingAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
							: 'Unavailable'}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
						{p2pMigrationApplied ? 'Verified posted AP balance' : 'Schema migration pending'}
					</div>
				</div>
			</div>

			{/* Search & Filters */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '1rem',
					marginBottom: '1rem',
					flexWrap: 'wrap',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
					<div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
						<Search
							size={16}
							style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
						/>
						<input
							type="text"
							placeholder="Search by Bill # or Supplier Inv #..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value)
								setCurrentPage(1)
							}}
							style={{
								width: '100%',
								padding: '0.5rem 0.75rem 0.5rem 2.25rem',
								borderRadius: '8px',
								border: '1px solid #cbd5e1',
								fontSize: '0.875rem',
							}}
						/>
					</div>

					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value)
							setCurrentPage(1)
						}}
						style={{
							padding: '0.5rem 0.75rem',
							borderRadius: '8px',
							border: '1px solid #cbd5e1',
							fontSize: '0.875rem',
							backgroundColor: '#ffffff',
						}}
					>
						<option value="ALL">All Statuses</option>
						<option value="DRAFT">Draft</option>
						<option value="MATCHED">3-Way Matched</option>
						<option value="APPROVED">Approved / Posted</option>
						<option value="PARTIALLY_PAID">Partially Paid</option>
						<option value="PAID">Paid / Settled</option>
						<option value="REJECTED">Variance Rejected</option>
					</select>
				</div>
			</div>

			{/* Table Content */}
			{isLoading ? (
				<div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
					<RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto' }} />
					<p>Loading vendor bills and accounts payable data...</p>
				</div>
			) : error ? (
				<div
					style={{
						padding: '2rem',
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '10px',
						color: '#991b1b',
						textAlign: 'center',
					}}
				>
					<AlertTriangle size={24} style={{ margin: '0 auto 0.5rem auto' }} />
					<p style={{ fontWeight: 600 }}>Failed to load vendor bills</p>
					<p style={{ fontSize: '0.85rem', color: '#b91c1c' }}>{error}</p>
					<button type="button" className="button secondary button--small" onClick={handleRefresh} style={{ marginTop: '0.75rem' }}>
						Try Again
					</button>
				</div>
			) : bills.length === 0 ? (
				<div
					style={{
						padding: '3.5rem 2rem',
						backgroundColor: '#f8fafc',
						border: '1px dashed #cbd5e1',
						borderRadius: '12px',
						textAlign: 'center',
						color: '#64748b',
					}}
				>
					<FileText size={40} style={{ margin: '0 auto 1rem auto', color: '#94a3b8' }} />
					<h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>
						No Vendor Bills Found
					</h3>
					<p style={{ fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto 1.25rem auto' }}>
						{!p2pMigrationApplied
							? 'Vendor bill tables will be initialized once the approved P2P database migration is deployed. No fake or unmigrated records are displayed.'
							: 'No vendor invoices match the selected filter criteria. When supplier bills are received, register them here to run automated 3-way matching.'}
					</p>
				</div>
			) : (
				<div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
						<thead>
							<tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
								<th style={{ padding: '0.75rem 1rem' }}>Bill # & Date</th>
								<th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
								<th style={{ padding: '0.75rem 1rem' }}>Supplier Inv #</th>
								<th style={{ padding: '0.75rem 1rem' }}>PO & GRN Ref</th>
								<th style={{ padding: '0.75rem 1rem' }}>3-Way Match</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Amount</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Outstanding</th>
								<th style={{ padding: '0.75rem 1rem' }}>Status</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{bills.map((bill) => {
								const statusStyle = formatStatusBadge(bill.status)
								const matchStyle = formatMatchBadge(bill.matchStatus, bill.priceVariance, bill.quantityVariance)

								return (
									<tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
										<td style={{ padding: '0.75rem 1rem' }}>
											<strong style={{ color: '#0f172a' }}>{bill.billNumber}</strong>
											<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
												{bill.supplierInvoiceDate ? new Date(bill.supplierInvoiceDate).toLocaleDateString() : 'N/A'}
											</div>
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<div style={{ fontWeight: 600, color: '#334155' }}>{bill.vendor?.name || 'Unknown Vendor'}</div>
											{bill.vendor?.code && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bill.vendor.code}</div>}
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<span style={{ fontFamily: 'monospace', color: '#1e293b' }}>{bill.supplierInvoiceNumber}</span>
										</td>
										<td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
											{bill.purchaseOrder && (
												<div>
													PO: <strong>{bill.purchaseOrder.poNumber}</strong>
												</div>
											)}
											{bill.goodsReceiptNote && (
												<div style={{ color: '#059669' }}>
													GRN: <strong>{bill.goodsReceiptNote.grnNumber}</strong>
												</div>
											)}
											{!bill.purchaseOrder && !bill.goodsReceiptNote && (
												<span style={{ color: '#94a3b8' }}>Direct Expense</span>
											)}
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<span
												style={{
													display: 'inline-block',
													padding: '0.2rem 0.5rem',
													borderRadius: '4px',
													fontSize: '0.75rem',
													fontWeight: 600,
													backgroundColor: matchStyle.bg,
													color: matchStyle.color,
												}}
											>
												{matchStyle.label}
											</span>
										</td>
										<td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
											₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
										</td>
										<td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: bill.outstandingAmount > 0 ? '#b45309' : '#16a34a' }}>
											₹{bill.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
										</td>
										<td style={{ padding: '0.75rem 1rem' }}>
											<span
												style={{
													display: 'inline-block',
													padding: '0.2rem 0.55rem',
													borderRadius: '9999px',
													fontSize: '0.75rem',
													fontWeight: 600,
													backgroundColor: statusStyle.bg,
													color: statusStyle.color,
													border: `1px solid ${statusStyle.border}`,
												}}
											>
												{statusStyle.label}
											</span>
										</td>
										<td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
											<div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
												<button
													type="button"
													className="button secondary button--small"
													onClick={() => setSelectedBill(bill)}
													title="View details and line items"
												>
													Details
												</button>

												{bill.status === 'MATCHED' && (
													<button
														type="button"
														className="button primary button--small"
														onClick={() => handleApproveBill(bill)}
														disabled={actionLoading || !p2pMigrationApplied}
														title="Approve bill and post to Accounts Payable GL"
													>
														Approve
													</button>
												)}

												{(bill.status === 'APPROVED' || bill.status === 'PARTIALLY_PAID') && (
													<button
														type="button"
														className="button secondary button--small"
														onClick={() => setPaymentBill(bill)}
														disabled={!p2pMigrationApplied}
														title="Record vendor payment"
														style={{ color: '#059669', borderColor: '#a7f3d0' }}
													>
														Pay
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

			{/* Pagination */}
			{bills.length > 0 && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: '1rem',
						fontSize: '0.875rem',
						color: '#64748b',
					}}
				>
					<div>
						Showing Page {currentPage} of {totalPages} ({totalCount} total bills)
					</div>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						<button
							type="button"
							className="button secondary button--small"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage <= 1 || isLoading}
						>
							<ChevronLeft size={16} />
							Previous
						</button>
						<button
							type="button"
							className="button secondary button--small"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage >= totalPages || isLoading}
						>
							Next
							<ChevronRight size={16} />
						</button>
					</div>
				</div>
			)}

			{/* Detail Drawer */}
			{selectedBill && (
				<div className="receipt-overlay" role="dialog" aria-modal="true">
					<div className="receipt-drawer" style={{ maxWidth: '640px' }}>
						<div className="drawer-header">
							<div className="receipt-header-branding">
								<span className="section-kicker">ACCOUNTS PAYABLE & 3-WAY MATCH</span>
								<h2>Bill #{selectedBill.billNumber}</h2>
								<p className="field-hint">Supplier Invoice Audit & GL Posting</p>
							</div>
							<button
								type="button"
								className="icon-button"
								onClick={() => setSelectedBill(null)}
								aria-label="Close details"
							>
								<X size={18} />
							</button>
						</div>

						<div className="receipt-body" style={{ padding: '1.5rem' }}>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
								<div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>Vendor</div>
									<div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedBill.vendor?.name}</div>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {selectedBill.vendor?.code || 'N/A'}</div>
								</div>
								<div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>Supplier Invoice #</div>
									<div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedBill.supplierInvoiceNumber}</div>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
										Date: {selectedBill.supplierInvoiceDate ? new Date(selectedBill.supplierInvoiceDate).toLocaleDateString() : 'N/A'}
									</div>
								</div>
							</div>

							{/* 3-Way Match Summary Card */}
							<div
								style={{
									border: '1px solid #e2e8f0',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1.5rem',
									backgroundColor: '#ffffff',
								}}
							>
								<div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
									<PackageCheck size={16} color="#0F969C" />
									3-Way Matching Verification
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
									<div>
										<span style={{ color: '#64748b', display: 'block' }}>Purchase Order:</span>
										<strong>{selectedBill.purchaseOrder?.poNumber || 'None'}</strong>
									</div>
									<div>
										<span style={{ color: '#64748b', display: 'block' }}>Goods Receipt Note:</span>
										<strong>{selectedBill.goodsReceiptNote?.grnNumber || 'None'}</strong>
									</div>
									<div>
										<span style={{ color: '#64748b', display: 'block' }}>Match Status:</span>
										<strong style={{ color: selectedBill.matchStatus === 'MATCHED_OK' ? '#16a34a' : '#d97706' }}>
											{selectedBill.matchStatus}
										</strong>
									</div>
								</div>
								{(selectedBill.priceVariance > 0 || selectedBill.quantityVariance > 0) && (
									<div
										style={{
											marginTop: '0.75rem',
											padding: '0.5rem 0.75rem',
											backgroundColor: '#fef2f2',
											borderRadius: '6px',
											color: '#991b1b',
											fontSize: '0.75rem',
										}}
									>
										Detected Variance: Price Variance: ₹{selectedBill.priceVariance.toFixed(2)} | Quantity Variance: {selectedBill.quantityVariance} units
									</div>
								)}
							</div>

							{/* Financial Totals */}
							<div
								style={{
									backgroundColor: '#f8fafc',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1.5rem',
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
									<span style={{ color: '#64748b' }}>Subtotal:</span>
									<span>₹{selectedBill.subtotal.toFixed(2)}</span>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
									<span style={{ color: '#64748b' }}>Tax Amount:</span>
									<span>₹{selectedBill.taxAmount.toFixed(2)}</span>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										paddingTop: '0.4rem',
										borderTop: '1px solid #e2e8f0',
										fontWeight: 700,
										fontSize: '0.95rem',
									}}
								>
									<span>Total Billed Amount:</span>
									<span>₹{selectedBill.totalAmount.toFixed(2)}</span>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.85rem', color: '#16a34a' }}>
									<span>Paid Amount:</span>
									<span>₹{selectedBill.paidAmount.toFixed(2)}</span>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
									<span>Outstanding Balance:</span>
									<span>₹{selectedBill.outstandingAmount.toFixed(2)}</span>
								</div>
							</div>

							{/* Bill Items */}
							{selectedBill.items && selectedBill.items.length > 0 && (
								<div>
									<h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
										Line Items ({selectedBill.items.length})
									</h4>
									<div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
										<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
											<thead>
												<tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
													<th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Item</th>
													<th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Qty</th>
													<th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Rate</th>
													<th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Tax</th>
													<th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Total</th>
												</tr>
											</thead>
											<tbody>
												{selectedBill.items.map((it) => (
													<tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
														<td style={{ padding: '0.5rem 0.75rem' }}>
															<div style={{ fontWeight: 600 }}>{it.product?.name || it.productId}</div>
															{it.product?.sku && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{it.product.sku}</div>}
														</td>
														<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{it.quantity}</td>
														<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>₹{it.unitPrice.toFixed(2)}</td>
														<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{it.taxPercent ? `${it.taxPercent}%` : '0%'}</td>
														<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{it.totalAmount.toFixed(2)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Create Vendor Bill Modal */}
			{isCreateModalOpen && (
				<CreateVendorBillModal
					p2pMigrationApplied={p2pMigrationApplied}
					onClose={() => setIsCreateModalOpen(false)}
					onSuccess={() => {
						setIsCreateModalOpen(false)
						handleRefresh()
					}}
				/>
			)}

			{/* Record Payment Modal */}
			{paymentBill && (
				<RecordBillPaymentModal
					bill={paymentBill}
					onClose={() => setPaymentBill(null)}
					onSuccess={() => {
						setPaymentBill(null)
						handleRefresh()
					}}
				/>
			)}
		</div>
	)
}

function CreateVendorBillModal({
	p2pMigrationApplied,
	onClose,
	onSuccess,
}: {
	p2pMigrationApplied: boolean
	onClose: () => void
	onSuccess: () => void
}) {
	const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('')
	const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
	const [vendorId, setVendorId] = useState('')
	const [purchaseOrderId, setPurchaseOrderId] = useState('')
	const [goodsReceiptNoteId, setGoodsReceiptNoteId] = useState('')
	const [notes, setNotes] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!p2pMigrationApplied) {
			setErrorMessage('Operation blocked: P2P schema migration is pending deployment.')
			return
		}

		if (!supplierInvoiceNumber.trim()) {
			setErrorMessage('Supplier Invoice Number is required')
			return
		}

		if (!vendorId.trim()) {
			setErrorMessage('Vendor ID is required')
			return
		}

		setIsSubmitting(true)
		setErrorMessage(null)

		try {
			const payload: CreateVendorBillPayload = {
				supplierInvoiceNumber: supplierInvoiceNumber.trim(),
				supplierInvoiceDate,
				vendorId: vendorId.trim(),
				purchaseOrderId: purchaseOrderId.trim() || undefined,
				goodsReceiptNoteId: goodsReceiptNoteId.trim() || undefined,
				notes: notes.trim() || undefined,
				items: [],
			}

			await financeService.createVendorBill(payload)
			onSuccess()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to register vendor bill'
			setErrorMessage(msg)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer" style={{ maxWidth: '520px' }}>
				<div className="drawer-header">
					<div>
						<span className="section-kicker">ACCOUNTS PAYABLE</span>
						<h2>Register Vendor Bill</h2>
						<p className="field-hint">Record supplier invoice and trigger 3-way match</p>
					</div>
					<button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
					{!p2pMigrationApplied && (
						<div
							style={{
								padding: '0.75rem 1rem',
								backgroundColor: '#fffbeb',
								border: '1px solid #fde68a',
								borderRadius: '8px',
								color: '#92400e',
								fontSize: '0.8rem',
								marginBottom: '1rem',
							}}
						>
							<ShieldAlert size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }} />
							Creation is blocked until the P2P migration is applied to the operational database.
						</div>
					)}

					{errorMessage && (
						<div
							style={{
								padding: '0.75rem 1rem',
								backgroundColor: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '8px',
								color: '#991b1b',
								fontSize: '0.8rem',
								marginBottom: '1rem',
							}}
						>
							{errorMessage}
						</div>
					)}

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Supplier Invoice Number *
						</label>
						<input
							type="text"
							required
							value={supplierInvoiceNumber}
							onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
							placeholder="e.g. INV-2026-9041"
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Invoice Date *
						</label>
						<input
							type="date"
							required
							value={supplierInvoiceDate}
							onChange={(e) => setSupplierInvoiceDate(e.target.value)}
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Vendor ID *
						</label>
						<input
							type="text"
							required
							value={vendorId}
							onChange={(e) => setVendorId(e.target.value)}
							placeholder="Supplier / Vendor UUID"
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Purchase Order ID (Optional for 3-Way Match)
						</label>
						<input
							type="text"
							value={purchaseOrderId}
							onChange={(e) => setPurchaseOrderId(e.target.value)}
							placeholder="PO UUID"
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Goods Receipt Note ID (Optional for 3-Way Match)
						</label>
						<input
							type="text"
							value={goodsReceiptNoteId}
							onChange={(e) => setGoodsReceiptNoteId(e.target.value)}
							placeholder="GRN UUID"
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1.25rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Remarks / Notes
						</label>
						<textarea
							rows={2}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Audit notes or terms..."
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
						<button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
							Cancel
						</button>
						<button
							type="submit"
							className="button primary"
							disabled={isSubmitting || !p2pMigrationApplied}
							style={{ opacity: !p2pMigrationApplied ? 0.6 : 1 }}
						>
							{isSubmitting ? 'Registering...' : 'Register Bill'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

function RecordBillPaymentModal({
	bill,
	onClose,
	onSuccess,
}: {
	bill: VendorBill
	onClose: () => void
	onSuccess: () => void
}) {
	const [amount, setAmount] = useState<string>(String(bill.outstandingAmount || bill.totalAmount))
	const [paymentMode, setPaymentMode] = useState<string>('BANK_TRANSFER')
	const [referenceNumber, setReferenceNumber] = useState<string>('')
	const [notes, setNotes] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const parsedAmount = parseFloat(amount)
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			setErrorMessage('Please enter a valid positive payment amount')
			return
		}

		if (parsedAmount > bill.outstandingAmount) {
			setErrorMessage(`Payment amount cannot exceed outstanding liability of ₹${bill.outstandingAmount.toFixed(2)}`)
			return
		}

		setIsSubmitting(true)
		setErrorMessage(null)

		try {
			const payload: RecordVendorBillPaymentPayload = {
				amount: parsedAmount,
				paymentMode,
				referenceNumber: referenceNumber.trim() || undefined,
				paymentDate: new Date().toISOString(),
				notes: notes.trim() || undefined,
			}

			await financeService.recordVendorBillPayment(bill.id, payload)
			onSuccess()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to record vendor bill payment'
			setErrorMessage(msg)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer" style={{ maxWidth: '480px' }}>
				<div className="drawer-header">
					<div>
						<span className="section-kicker">AP DISBURSEMENT</span>
						<h2>Record Vendor Payment</h2>
						<p className="field-hint">Bill #{bill.billNumber} • Outstanding: ₹{bill.outstandingAmount.toFixed(2)}</p>
					</div>
					<button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
					{errorMessage && (
						<div
							style={{
								padding: '0.75rem 1rem',
								backgroundColor: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '8px',
								color: '#991b1b',
								fontSize: '0.8rem',
								marginBottom: '1rem',
							}}
						>
							{errorMessage}
						</div>
					)}

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Payment Amount (₹) *
						</label>
						<input
							type="number"
							step="0.01"
							required
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Disbursement Method *
						</label>
						<select
							value={paymentMode}
							onChange={(e) => setPaymentMode(e.target.value)}
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
						>
							<option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
							<option value="UPI">UPI Payment</option>
							<option value="CHEQUE">Cheque / Demand Draft</option>
							<option value="CASH">Cashbox Voucher</option>
						</select>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Transaction Reference / Cheque No.
						</label>
						<input
							type="text"
							value={referenceNumber}
							onChange={(e) => setReferenceNumber(e.target.value)}
							placeholder="e.g. UTR / Transaction ID"
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ marginBottom: '1.25rem' }}>
						<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
							Notes / Settlement Remarks
						</label>
						<textarea
							rows={2}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Settlement notes..."
							style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
						<button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
							Cancel
						</button>
						<button type="submit" className="button primary" disabled={isSubmitting}>
							{isSubmitting ? 'Recording...' : 'Record Payment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
