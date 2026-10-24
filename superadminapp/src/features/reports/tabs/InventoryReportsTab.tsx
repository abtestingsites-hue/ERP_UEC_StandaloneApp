import React, { useState, useMemo } from 'react'
import { Package, TrendingUp, AlertTriangle, ArrowRightLeft, ShieldAlert } from 'lucide-react'
import type {
	StockValuationResponse,
	InventoryStockMovement,
	InventoryExpiryAlertBatch,
	InventoryExpirySummary,
	PhysicalAudit,
} from '../../inventory/inventory.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface InventoryReportsTabProps {
	valuation: StockValuationResponse | null
	movements: InventoryStockMovement[]
	expiryData: { alerts: InventoryExpiryAlertBatch[]; summary: InventoryExpirySummary } | null
	audits: PhysicalAudit[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const InventoryReportsTab: React.FC<InventoryReportsTabProps> = ({
	valuation,
	movements,
	expiryData,
	audits,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'VALUATION' | 'MOVEMENTS' | 'EXPIRY' | 'AUDITS'>('VALUATION')

	// Filter valuation items
	const filteredValuationItems = useMemo(() => {
		const items = valuation?.items || []
		if (!searchTerm.trim()) return items
		return items.filter(
			(i) =>
				(i.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(i.category || '').toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [valuation, searchTerm])

	// Filter movements
	const filteredMovements = useMemo(() => {
		if (!searchTerm.trim()) return movements
		return movements.filter(
			(m) =>
				(m.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(m.movementType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(m.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [movements, searchTerm])

	// Filter expiry alerts
	const filteredExpiryAlerts = useMemo(() => {
		const alerts = expiryData?.alerts || []
		if (!searchTerm.trim()) return alerts
		return alerts.filter(
			(a) =>
				(a.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(a.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [expiryData, searchTerm])

	// Filter audits
	const filteredAudits = useMemo(() => {
		if (!searchTerm.trim()) return audits
		return audits.filter(
			(a) =>
				(a.auditNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(a.status || '').toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [audits, searchTerm])

	const handleExport = () => {
		if (activeSubView === 'VALUATION') {
			exportToCsv(
				'Inventory_Valuation_Report',
				[
					{ key: 'productName', label: 'Product Name' },
					{ key: 'category', label: 'Category' },
					{ key: 'totalQuantity', label: 'Stock Quantity' },
					{ key: 'unitCost', label: 'Unit Cost (INR)' },
					{ key: 'totalValuation', label: 'Total Value (INR)' },
				],
				filteredValuationItems as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'MOVEMENTS') {
			exportToCsv(
				'Inventory_Movements_Report',
				[
					{ key: 'movementType', label: 'Movement Type' },
					{ key: 'quantity', label: 'Quantity' },
					{ key: 'notes', label: 'Notes' },
					{ key: 'createdAt', label: 'Timestamp' },
				],
				filteredMovements as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'EXPIRY') {
			exportToCsv(
				'Inventory_Expiry_Alerts_Report',
				[
					{ key: 'productName', label: 'Product' },
					{ key: 'batchNumber', label: 'Batch No' },
					{ key: 'expiryDate', label: 'Expiry Date' },
					{ key: 'quantity', label: 'Quantity At Risk' },
					{ key: 'status', label: 'Risk Status' },
				],
				filteredExpiryAlerts as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Inventory_Physical_Audits_Report',
				[
					{ key: 'auditNumber', label: 'Audit Ref' },
					{ key: 'status', label: 'Status' },
					{ key: 'varianceQuantity', label: 'Variance Quantity' },
					{ key: 'createdAt', label: 'Date' },
				],
				filteredAudits as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Total Stock Valuation"
					value={valuation?.summary?.totalValuation ? `₹${valuation.summary.totalValuation.toLocaleString()}` : 'Live Valued'}
					subtitle={`${valuation?.summary?.totalItemsValued || 0} Distinct Valued Products`}
					icon={Package}
					accentColor="cyan"
				/>
				<ReportMetricCard
					title="Total Units On Hand"
					value={(valuation?.summary?.totalUnitsInStock || 0).toLocaleString()}
					subtitle="Physical Inventory Warehouse"
					icon={TrendingUp}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Batches At Expiry Risk"
					value={expiryData?.summary?.expiringSoonCount || 0}
					subtitle={`${expiryData?.summary?.totalQuantityAtRisk || 0} Units at Risk`}
					icon={AlertTriangle}
					accentColor="amber"
				/>
				<ReportMetricCard
					title="Physical Audits Conducted"
					value={audits.length}
					subtitle={`${audits.filter((a) => a.status === 'RECONCILED').length} Audits Reconciled`}
					icon={ShieldAlert}
					accentColor="primary"
				/>
			</div>

			{/* Filter Bar */}
			<ReportFilterBar
				period={period}
				onPeriodChange={setPeriod}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				activeUnitName={activeUnitName}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onExportCsv={handleExport}
				searchPlaceholder="Search products, batches, or movement reasons..."
			/>

			{/* Sub-view navigation */}
			<div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('VALUATION')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'VALUATION'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Stock Valuation ({filteredValuationItems.length})
				</button>
				<button
					onClick={() => setActiveSubView('MOVEMENTS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'MOVEMENTS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Movements Journal ({filteredMovements.length})
				</button>
				<button
					onClick={() => setActiveSubView('EXPIRY')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'EXPIRY'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Expiry Alerts ({filteredExpiryAlerts.length})
				</button>
				<button
					onClick={() => setActiveSubView('AUDITS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'AUDITS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Physical Audits ({filteredAudits.length})
				</button>
			</div>

			{/* Valuation Table */}
			{activeSubView === 'VALUATION' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredValuationItems.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No stock valuation records loaded for the active scope.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Product Name</th>
										<th className="px-6 py-3">Category</th>
										<th className="px-6 py-3">Units in Stock</th>
										<th className="px-6 py-3">Average Unit Cost</th>
										<th className="px-6 py-3">Total Value</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredValuationItems.map((item, idx) => (
										<tr key={item.productId || idx} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{item.productName}</td>
											<td className="px-6 py-3.5 text-slate-600">{item.category || 'General'}</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												{item.totalQuantity.toLocaleString()}
											</td>
											<td className="px-6 py-3.5 text-slate-600">
												₹{(item.unitCost ?? 0).toLocaleString()}
											</td>
											<td className="px-6 py-3.5 font-bold text-slate-900">
												₹{(item.totalValuation ?? 0).toLocaleString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Movements Table */}
			{activeSubView === 'MOVEMENTS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredMovements.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No stock movement records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Movement Type</th>
										<th className="px-6 py-3">Product</th>
										<th className="px-6 py-3">Quantity</th>
										<th className="px-6 py-3">Notes</th>
										<th className="px-6 py-3">Timestamp</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredMovements.map((m) => (
										<tr key={m.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
													<ArrowRightLeft className="w-3 h-3" />
													{m.movementType}
												</span>
											</td>
											<td className="px-6 py-3.5 font-semibold text-slate-900">
												{m.product?.name || 'Stock Item'}
											</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">
												{m.quantity > 0 ? `+${m.quantity}` : m.quantity}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{m.notes || 'Operational movement'}</td>
											<td className="px-6 py-3.5 text-slate-500">
												{new Date(m.createdAt).toLocaleString([], {
													dateStyle: 'short',
													timeStyle: 'short',
												})}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Expiry Alerts Table */}
			{activeSubView === 'EXPIRY' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredExpiryAlerts.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No items currently at expiry risk within the monitoring window.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Product Name</th>
										<th className="px-6 py-3">Batch Number</th>
										<th className="px-6 py-3">Quantity at Risk</th>
										<th className="px-6 py-3">Expiry Date</th>
										<th className="px-6 py-3">Risk Assessment</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredExpiryAlerts.map((alert) => (
										<tr key={alert.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{alert.productName}</td>
											<td className="px-6 py-3.5 font-mono text-slate-600">{alert.batchNumber}</td>
											<td className="px-6 py-3.5 font-bold text-amber-700">{alert.quantity}</td>
											<td className="px-6 py-3.5 text-slate-600">{alert.expiryDate}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
													{alert.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Physical Audits Table */}
			{activeSubView === 'AUDITS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAudits.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No physical audit journals found for the active unit.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Audit Reference</th>
										<th className="px-6 py-3">Status</th>
										<th className="px-6 py-3">Scope / Items Audited</th>
										<th className="px-6 py-3">Variance Quantity</th>
										<th className="px-6 py-3">Initiated Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAudits.map((audit) => (
										<tr key={audit.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{audit.auditNumber}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
													{audit.status}
												</span>
											</td>
											<td className="px-6 py-3.5 text-slate-600">{audit.product?.name || 'Inventory Item'}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">
												{audit.varianceQuantity ?? 0}
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{new Date(audit.createdAt).toLocaleDateString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
