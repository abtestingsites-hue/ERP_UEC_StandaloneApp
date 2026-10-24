import { useEffect, useState } from 'react'
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileText,
	Info,
	PackageCheck,
	RefreshCw,
	Search,
	ShieldAlert,
	Truck,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { GRNAccrualItem } from '../finance.types'

type P2PGRNAccrualsTabProps = {
	activeUnitId?: string | null
}

export function P2PGRNAccrualsTab({ activeUnitId }: P2PGRNAccrualsTabProps) {
	const [accruals, setAccruals] = useState<GRNAccrualItem[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [totalPages, setTotalPages] = useState<number>(1)
	const [totalCount, setTotalCount] = useState<number>(0)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	useEffect(() => {
		let isMounted = true

		const fetchAccruals = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const res = await financeService.getGRNAccruals({
					page: currentPage,
					limit: 10,
					search: searchQuery.trim() || undefined,
					scope: activeUnitId === 'ALL_UNITS' ? 'all' : undefined,
					unitId: activeUnitId,
				})

				if (isMounted) {
					setAccruals(res.data)
					setTotalPages(res.pagination.totalPages || 1)
					setTotalCount(res.pagination.total || 0)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				if (isMounted) {
					const msg = err instanceof Error ? err.message : 'Failed to fetch GRN accruals'
					setError(msg)
					setIsLoading(false)
				}
			}
		}

		fetchAccruals()
		return () => {
			isMounted = false
		}
	}, [activeUnitId, currentPage, searchQuery, refreshTrigger])

	const handleRefresh = () => {
		setRefreshTrigger((prev) => prev + 1)
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
		setCurrentPage(1)
	}

	const formatAccrualStatus = (status: string) => {
		if (status === 'UNACCRUED_PENDING_MIGRATION') {
			return {
				label: 'Pending Migration',
				bg: '#fffbeb',
				color: '#b45309',
				border: '#fde68a',
			}
		}
		if (status === 'ACCRUED') {
			return {
				label: 'Accrued to GL 2100',
				bg: '#f0fdf4',
				color: '#15803d',
				border: '#bbf7d0',
			}
		}
		return {
			label: status || 'Unknown',
			bg: '#f1f5f9',
			color: '#475569',
			border: '#e2e8f0',
		}
	}

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Header & Controls */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: 'wrap',
					gap: '1rem',
				}}
			>
				<div>
					<h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
						Goods Received Not Invoiced (GRNI) Accrual Register
					</h3>
					<p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
						Audit log of physical goods receipts awaiting formal vendor bill clearance and GL 2100 accrual settlement.
					</p>
				</div>

				<button
					type="button"
					className="button button--secondary button--small"
					onClick={handleRefresh}
					disabled={isLoading}
				>
					<RefreshCw size={14} className={isLoading ? 'spin' : ''} />
					Refresh Accruals
				</button>
			</div>

			{/* Informational Guidance Notice */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.75rem',
					backgroundColor: '#f8fafc',
					border: '1px solid #e2e8f0',
					padding: '0.75rem 1rem',
					borderRadius: '8px',
					fontSize: '0.825rem',
					color: '#475569',
				}}
			>
				<Info size={16} color="#0F969C" style={{ flexShrink: 0 }} />
				<span>
					Showing Goods Receipt Notes and their General Ledger accrual status. For unmigrated records, accruals remain in <strong>Pending Migration</strong> state without fabricated cost substitutions.
				</span>
			</div>

			{/* Search & Filter Bar */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '1rem',
					backgroundColor: '#ffffff',
					padding: '0.75rem 1rem',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
					<Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
					<input
						type="text"
						placeholder="Search GRN number, challan..."
						value={searchQuery}
						onChange={handleSearchChange}
						style={{
							width: '100%',
							padding: '0.45rem 0.75rem 0.45rem 2.25rem',
							fontSize: '0.85rem',
							border: '1px solid #cbd5e1',
							borderRadius: '6px',
							outline: 'none',
						}}
					/>
				</div>

				<div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
					Total GRN Records: <strong>{totalCount}</strong>
				</div>
			</div>

			{/* Error State */}
			{error && !isLoading && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '1rem',
						backgroundColor: '#fef2f2',
						border: '1px solid #fee2e2',
						borderLeft: '4px solid #ef4444',
						padding: '1rem',
						borderRadius: '8px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
						<ShieldAlert size={18} />
						<span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
					</div>
					<button type="button" className="button button--secondary button--small" onClick={handleRefresh}>
						Retry
					</button>
				</div>
			)}

			{/* Accruals Table */}
			<div
				style={{
					backgroundColor: '#ffffff',
					border: '1px solid #e2e8f0',
					borderRadius: '10px',
					overflow: 'hidden',
				}}
			>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
						<thead>
							<tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
								<th style={{ padding: '0.75rem 1rem' }}>GRN Number</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Receipt Date</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Vendor</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>PO Reference</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Challan / Inv</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Items</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Accepted Qty</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Cost Tracking</th>
								<th style={{ padding: '0.75rem 0.75rem' }}>Accrual Status</th>
								<th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Accrual Value</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={10} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
										<RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: '#0F969C' }} />
										Loading GRN accruals register...
									</td>
								</tr>
							) : accruals.length === 0 ? (
								<tr>
									<td colSpan={10} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
										<PackageCheck size={36} color="#cbd5e1" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
										No Goods Receipt Notes found.
									</td>
								</tr>
							) : (
								accruals.map((item) => {
									const statusMeta = formatAccrualStatus(item.accrualStatus)
									return (
										<tr
											key={item.id}
											style={{
												borderBottom: '1px solid #f1f5f9',
												transition: 'background-color 0.15s ease',
											}}
										>
											{/* GRN Number */}
											<td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F969C' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
													<FileText size={14} color="#0F969C" />
													{item.grnNumber}
												</div>
											</td>

											{/* Receipt Date */}
											<td style={{ padding: '0.75rem 0.75rem', color: '#334155' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
													<Calendar size={13} color="#94a3b8" />
													{item.receivedDate ? new Date(item.receivedDate).toLocaleDateString() : '—'}
												</div>
											</td>

											{/* Vendor */}
											<td style={{ padding: '0.75rem 0.75rem', fontWeight: 600, color: '#1e293b' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
													<Truck size={13} color="#94a3b8" />
													{item.vendor?.name || 'Unassigned Vendor'}
												</div>
											</td>

											{/* PO Reference */}
											<td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>
												{item.poNumber || 'Direct Receipt'}
											</td>

											{/* Challan No */}
											<td style={{ padding: '0.75rem 0.75rem', color: '#64748b' }}>
												{item.deliveryChallanNo || item.supplierInvoiceNo || '—'}
											</td>

											{/* Items Count */}
											<td style={{ padding: '0.75rem 0.75rem', color: '#334155' }}>
												{item.itemsCount} lines
											</td>

											{/* Accepted Qty */}
											<td style={{ padding: '0.75rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
												{item.totalAcceptedQuantity} units
												{item.totalRejectedQuantity > 0 && (
													<span style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '0.35rem' }}>
														(-{item.totalRejectedQuantity} rej)
													</span>
												)}
											</td>

											{/* Cost Tracking */}
											<td style={{ padding: '0.75rem 0.75rem' }}>
												<span
													style={{
														display: 'inline-block',
														padding: '0.2rem 0.45rem',
														borderRadius: '4px',
														fontSize: '0.75rem',
														fontWeight: 600,
														backgroundColor: item.costAvailable ? '#f0fdf4' : '#f1f5f9',
														color: item.costAvailable ? '#15803d' : '#64748b',
													}}
												>
													{item.costAvailable ? 'Recorded' : 'No Cost Recorded'}
												</span>
											</td>

											{/* Accrual Status */}
											<td style={{ padding: '0.75rem 0.75rem' }}>
												<span
													style={{
														display: 'inline-block',
														padding: '0.2rem 0.5rem',
														borderRadius: '4px',
														fontSize: '0.75rem',
														fontWeight: 700,
														backgroundColor: statusMeta.bg,
														color: statusMeta.color,
														border: `1px solid ${statusMeta.border}`,
													}}
												>
													{statusMeta.label}
												</span>
											</td>

											{/* Accrual Value */}
											<td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: item.accrualAmount !== null && item.accrualAmount !== undefined ? '#0f172a' : '#94a3b8' }}>
												{item.accrualAmount !== null && item.accrualAmount !== undefined
													? `₹${Number(item.accrualAmount).toLocaleString()}`
													: '—'}
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Controls */}
				{!isLoading && totalPages > 1 && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '0.75rem 1rem',
							backgroundColor: '#f8fafc',
							borderTop: '1px solid #e2e8f0',
							fontSize: '0.85rem',
							color: '#64748b',
						}}
					>
						<span>
							Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
						</span>

						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<button
								type="button"
								className="button button--secondary button--small"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage <= 1}
							>
								<ChevronLeft size={14} />
								Previous
							</button>

							<button
								type="button"
								className="button button--secondary button--small"
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage >= totalPages}
							>
								Next
								<ChevronRight size={14} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
