import { useEffect, useState } from 'react'
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Database,
	FileText,
	Layers,
	PackageCheck,
	RefreshCw,
	ShieldAlert,
	ShoppingBag,
	Truck,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { P2PSummaryData } from '../finance.types'

type P2POverviewTabProps = {
	activeUnitId?: string | null
	onNavigateTab: (tabKey: string) => void
}

export function P2POverviewTab({ activeUnitId, onNavigateTab }: P2POverviewTabProps) {
	const [summary, setSummary] = useState<P2PSummaryData | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	useEffect(() => {
		let isMounted = true

		const fetchSummary = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const data = await financeService.getP2PSummary({
					scope: activeUnitId === 'ALL_UNITS' ? 'all' : undefined,
					unitId: activeUnitId,
				})
				if (isMounted) {
					setSummary(data)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				if (isMounted) {
					const msg = err instanceof Error ? err.message : 'Failed to fetch P2P summary'
					setError(msg)
					setIsLoading(false)
				}
			}
		}

		fetchSummary()
		return () => {
			isMounted = false
		}
	}, [activeUnitId, refreshTrigger])

	const handleRefresh = () => {
		setRefreshTrigger((prev) => prev + 1)
	}

	const isMigrationPending = summary ? !summary.schemaParity?.p2pFinanceMigrated : true

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			{/* Top Controls Header */}
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
						Procure-to-Pay (P2P) Pipeline & Financial Readiness
					</h3>
					<p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
						Commercial commitments, Goods Receipts, Accounts Payable 3-way matching, and General Ledger clearing.
					</p>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					<button
						type="button"
						className="button button--secondary button--small"
						onClick={handleRefresh}
						disabled={isLoading}
					>
						<RefreshCw size={14} className={isLoading ? 'spin' : ''} />
						Refresh P2P Status
					</button>

					<button
						type="button"
						className="button button--secondary button--small"
						onClick={() => onNavigateTab('p2p-vendor-bills')}
					>
						<FileText size={14} />
						Vendor Bills & 3-Way Match
					</button>

					<button
						type="button"
						className="button button--primary button--small"
						onClick={() => onNavigateTab('p2p-grn-accruals')}
					>
						<PackageCheck size={14} />
						View GRN Accrual Register
					</button>
				</div>
			</div>

			{/* Database Compatibility Alert Banner */}
			{isMigrationPending && !isLoading && (
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: '0.75rem',
						backgroundColor: '#fffbeb',
						border: '1px solid #fef3c7',
						borderLeft: '4px solid #f59e0b',
						padding: '1rem 1.25rem',
						borderRadius: '8px',
					}}
				>
					<AlertTriangle size={20} color="#d97706" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
					<div>
						<h4 style={{ margin: 0, fontSize: '0.95rem', color: '#92400e', fontWeight: 700 }}>
							Database Schema Notice: P2P Costing & GL Accrual Migration Pending
						</h4>
						<p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#b45309', lineHeight: 1.45 }}>
							Financial costing and accrual data are unavailable until the approved database migration is deployed.
							Procurement documents (POs and GRNs) are fully operational in compatibility mode. Financial values remain strictly unavailable rather than showing fabricated zero balances.
						</p>
					</div>
				</div>
			)}

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
						padding: '1rem 1.25rem',
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

			{/* Metric Ribbon */}
			<div className="summary-ribbon" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
				{/* 1. Purchase Orders */}
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Purchase Orders</span>
						<ShoppingBag size={18} className="summary-card__icon" color="#0F969C" />
					</div>
					<div className="summary-card__value">
						{isLoading ? '...' : (summary?.procurement?.totalPurchaseOrders ?? 0)}
					</div>
					<span className="summary-card__subtext">
						{isLoading ? 'Loading...' : `Completed: ${summary?.procurement?.purchaseOrdersByStatus?.COMPLETED ?? 0}`}
					</span>
				</div>

				{/* 2. Goods Receipts */}
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Goods Receipts (GRN)</span>
						<Truck size={18} className="summary-card__icon" color="#0F969C" />
					</div>
					<div className="summary-card__value">
						{isLoading ? '...' : (summary?.procurement?.totalGoodsReceipts ?? 0)}
					</div>
					<span className="summary-card__subtext">
						{isLoading ? 'Loading...' : 'Received delivery challans'}
					</span>
				</div>

				{/* 3. Accounts Payable (AP) Liability */}
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">Accounts Payable (AP)</span>
						<Layers size={18} className="summary-card__icon" color="#64748b" />
					</div>
					<div className="summary-card__value" style={{ color: summary?.accountsPayable?.available ? '#0f172a' : '#94a3b8' }}>
						{isLoading ? '...' : summary?.accountsPayable?.available ? `₹${summary.accountsPayable.totalOutstandingAmount?.toLocaleString()}` : '—'}
					</div>
					<span
						className="summary-card__subtext"
						style={{ color: summary?.accountsPayable?.available ? '#64748b' : '#d97706', fontWeight: 600 }}
					>
						{isLoading ? 'Checking...' : summary?.accountsPayable?.available ? `${summary.accountsPayable.totalVendorBills} approved vendor bills` : 'Unavailable (Migration Pending)'}
					</span>
				</div>

				{/* 4. GRN Accrued Liability (GRNI) */}
				<div className="summary-card">
					<div className="summary-card__header">
						<span className="summary-card__label">GRNI Clearing Liability</span>
						<Clock size={18} className="summary-card__icon" color="#64748b" />
					</div>
					<div className="summary-card__value" style={{ color: summary?.grnAccruals?.available ? '#0f172a' : '#94a3b8' }}>
						{isLoading ? '...' : summary?.grnAccruals?.available ? 'Active' : '—'}
					</div>
					<span
						className="summary-card__subtext"
						style={{ color: summary?.grnAccruals?.available ? '#0F969C' : '#d97706', fontWeight: 600 }}
					>
						{isLoading ? 'Checking...' : summary?.grnAccruals?.available ? 'Reconciled to GL 2100' : 'Unavailable (Migration Pending)'}
					</span>
				</div>
			</div>

			{/* P2P Subsystems Operational Status Table */}
			<div
				style={{
					backgroundColor: '#ffffff',
					border: '1px solid #e2e8f0',
					borderRadius: '10px',
					padding: '1.25rem',
				}}
			>
				<h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
					P2P Financial Architecture Subsystem Status
				</h4>

				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
						<thead>
							<tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
								<th style={{ padding: '0.75rem 0.5rem' }}>Subsystem Component</th>
								<th style={{ padding: '0.75rem 0.5rem' }}>Required Models / Columns</th>
								<th style={{ padding: '0.75rem 0.5rem' }}>Operational Status</th>
								<th style={{ padding: '0.75rem 0.5rem' }}>Financial Action</th>
							</tr>
						</thead>
						<tbody>
							{/* Row 1: Procurement */}
							<tr style={{ borderBottom: '1px solid #f1f5f9' }}>
								<td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>
									Purchase Orders & GRN Receiving
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									PurchaseOrder, GoodsReceiptNote, Items
								</td>
								<td style={{ padding: '0.85rem 0.5rem' }}>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											padding: '0.2rem 0.5rem',
											borderRadius: '4px',
											fontSize: '0.75rem',
											fontWeight: 700,
											backgroundColor: '#f0fdf4',
											color: '#15803d',
										}}
									>
										<CheckCircle2 size={12} />
										Operational (Compatibility Safe)
									</span>
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#334155' }}>
									Read workflows active & safeguarded
								</td>
							</tr>

							{/* Row 2: Double-Entry General Ledger */}
							<tr style={{ borderBottom: '1px solid #f1f5f9' }}>
								<td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>
									General Ledger Chart of Accounts
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									GLAccount, JournalEntry, JournalLine
								</td>
								<td style={{ padding: '0.85rem 0.5rem' }}>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											padding: '0.2rem 0.5rem',
											borderRadius: '4px',
											fontSize: '0.75rem',
											fontWeight: 700,
											backgroundColor: '#fffbeb',
											color: '#b45309',
										}}
									>
										<Database size={12} />
										Migration Pending
									</span>
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									Awaiting operational database rollout
								</td>
							</tr>

							{/* Row 3: Three-Way Invoice Matching */}
							<tr style={{ borderBottom: '1px solid #f1f5f9' }}>
								<td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>
									Accounts Payable 3-Way Matching
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									VendorBill, VendorBillItem
								</td>
								<td style={{ padding: '0.85rem 0.5rem' }}>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											padding: '0.2rem 0.5rem',
											borderRadius: '4px',
											fontSize: '0.75rem',
											fontWeight: 700,
											backgroundColor: '#fffbeb',
											color: '#b45309',
										}}
									>
										<Database size={12} />
										Migration Pending
									</span>
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									No bills created until schema migrated
								</td>
							</tr>

							{/* Row 4: Inventory Costing & Valuation */}
							<tr>
								<td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>
									GAAP/IFRS Inventory Cost Valuation
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									Product.averageCost, ProductBatch.unitCost
								</td>
								<td style={{ padding: '0.85rem 0.5rem' }}>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											padding: '0.2rem 0.5rem',
											borderRadius: '4px',
											fontSize: '0.75rem',
											fontWeight: 700,
											backgroundColor: '#f8fafc',
											color: '#475569',
										}}
									>
										Safe Segregation
									</span>
								</td>
								<td style={{ padding: '0.85rem 0.5rem', color: '#64748b' }}>
									Physical counts available; valuations segregated
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
