import React, { useState, useMemo } from 'react'
import { DollarSign, Receipt, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { AccountTransaction, CashboxTransaction } from '../../finance/finance.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface FinanceReportsTabProps {
	invoices: AccountTransaction[]
	cashbox: CashboxTransaction[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const FinanceReportsTab: React.FC<FinanceReportsTabProps> = ({
	invoices,
	cashbox,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [activeSubView, setActiveSubView] = useState<'INVOICES' | 'CASHBOX'>('INVOICES')

	// Filter invoices
	const filteredInvoices = useMemo(() => {
		return invoices.filter((inv) => {
			const matchesSearch =
				(inv.refNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(inv.notes || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesStatus =
				statusFilter === 'ALL' ||
				String(inv.status || '').toUpperCase() === statusFilter.toUpperCase()

			return matchesSearch && matchesStatus
		})
	}, [invoices, searchTerm, statusFilter])

	// Filter cashbox
	const filteredCashbox = useMemo(() => {
		return cashbox.filter((cb) => {
			const matchesSearch =
				(cb.receiptNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(cb.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(cb.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(cb.vendor || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesStatus =
				statusFilter === 'ALL' ||
				String(cb.status || '').toUpperCase() === statusFilter.toUpperCase()

			return matchesSearch && matchesStatus
		})
	}, [cashbox, searchTerm, statusFilter])

	// KPI computations (case-insensitive)
	const totalInvoiced = useMemo(
		() => invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
		[invoices]
	)
	const totalCollected = useMemo(
		() =>
			invoices
				.filter((inv) => String(inv.status || '').toUpperCase() === 'PAID')
				.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
		[invoices]
	)
	const totalReceivables = useMemo(
		() =>
			invoices
				.filter((inv) => {
					const s = String(inv.status || '').toUpperCase()
					return s !== 'PAID' && s !== 'CANCELLED'
				})
				.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
		[invoices]
	)
	const totalCashboxIncome = useMemo(
		() =>
			cashbox
				.filter((c) => c.type === 'INCOME')
				.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
		[cashbox]
	)
	const totalCashboxExpense = useMemo(
		() =>
			cashbox
				.filter((c) => c.type === 'EXPENSE')
				.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
		[cashbox]
	)

	const handleExport = () => {
		if (activeSubView === 'INVOICES') {
			exportToCsv(
				'Finance_Invoices_Report',
				[
					{ key: 'refNo', label: 'Invoice No' },
					{ key: 'amount', label: 'Amount (INR)' },
					{ key: 'status', label: 'Status' },
					{ key: 'createdAt', label: 'Date' },
					{ key: 'notes', label: 'Category / Description' },
				],
				filteredInvoices as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Finance_Cashbox_Report',
				[
					{ key: 'receiptNo', label: 'Voucher No' },
					{ key: 'date', label: 'Date' },
					{ key: 'type', label: 'Type' },
					{ key: 'category', label: 'Category' },
					{ key: 'amount', label: 'Amount (INR)' },
					{ key: 'mode', label: 'Payment Mode' },
					{ key: 'status', label: 'Status' },
					{ key: 'clientName', label: 'Party / Client' },
				],
				filteredCashbox as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Total Invoiced"
					value={`₹${totalInvoiced.toLocaleString()}`}
					subtitle={`${invoices.length} Registered Invoices`}
					icon={FileText}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Collections (Paid)"
					value={`₹${totalCollected.toLocaleString()}`}
					subtitle={`${invoices.filter((i) => i.status === 'PAID').length} Invoices Settled`}
					icon={DollarSign}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Outstanding Receivables"
					value={`₹${totalReceivables.toLocaleString()}`}
					subtitle={`${invoices.filter((i) => i.status !== 'PAID' && (i.status as string) !== 'CANCELLED').length} Pending Invoices`}
					icon={Receipt}
					accentColor="amber"
				/>
				<ReportMetricCard
					title="Cashbox Balance"
					value={`₹${(totalCashboxIncome - totalCashboxExpense).toLocaleString()}`}
					subtitle={`+₹${totalCashboxIncome.toLocaleString()} / -₹${totalCashboxExpense.toLocaleString()}`}
					icon={DollarSign}
					accentColor="indigo"
				/>
			</div>

			{/* Filter & Export Bar */}
			<ReportFilterBar
				period={period}
				onPeriodChange={setPeriod}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				activeUnitName={activeUnitName}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onExportCsv={handleExport}
				searchPlaceholder="Search invoices or vouchers..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center justify-between border-b border-slate-200 pb-3">
				<div className="flex gap-2">
					<button
						onClick={() => setActiveSubView('INVOICES')}
						className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
							activeSubView === 'INVOICES'
								? 'bg-primary-600 text-white'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
					>
						Invoices & Receivables ({filteredInvoices.length})
					</button>
					<button
						onClick={() => setActiveSubView('CASHBOX')}
						className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
							activeSubView === 'CASHBOX'
								? 'bg-primary-600 text-white'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
					>
						Cashbox & Vouchers ({filteredCashbox.length})
					</button>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
				>
					<option value="ALL">All Statuses</option>
					<option value="PAID">Paid / Settled</option>
					<option value="PENDING">Pending Approval / Payment</option>
					<option value="OVERDUE">Overdue</option>
					<option value="POSTED">Posted Ledger Entries</option>
				</select>
			</div>

			{/* Invoices Table */}
			{activeSubView === 'INVOICES' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredInvoices.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No invoice records found matching the current criteria.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Invoice Ref</th>
										<th className="px-6 py-3">Date</th>
										<th className="px-6 py-3">Description / Category</th>
										<th className="px-6 py-3">Amount</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredInvoices.map((inv) => (
										<tr key={inv.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold font-mono text-slate-900">
												{inv.refNo || inv.id.slice(0, 8)}
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{inv.date ? String(inv.date).slice(0, 10) : '—'}
											</td>
											<td className="px-6 py-3.5 max-w-xs truncate text-slate-700">
												{inv.notes || 'General Invoicing'}
											</td>
											<td className="px-6 py-3.5 font-bold text-slate-900">
												₹{Number(inv.amount || 0).toLocaleString()}
											</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														inv.status === 'PAID'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: (inv.status as string) === 'OVERDUE' || inv.status === 'REJECTED'
																? 'bg-rose-50 text-rose-700 border-rose-200'
																: 'bg-amber-50 text-amber-700 border-amber-200'
													}`}
												>
													{inv.status}
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

			{/* Cashbox Table */}
			{activeSubView === 'CASHBOX' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredCashbox.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No cashbox voucher records found matching the current criteria.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Voucher No</th>
										<th className="px-6 py-3">Date</th>
										<th className="px-6 py-3">Client / Vendor</th>
										<th className="px-6 py-3">Category</th>
										<th className="px-6 py-3">Type</th>
										<th className="px-6 py-3">Amount</th>
										<th className="px-6 py-3">Mode</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredCashbox.map((cb) => (
										<tr key={cb.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold font-mono text-slate-900">
												{cb.receiptNo}
											</td>
											<td className="px-6 py-3.5 text-slate-500">{cb.date}</td>
											<td className="px-6 py-3.5 text-slate-800">{cb.clientName}</td>
											<td className="px-6 py-3.5 text-slate-600">{cb.category}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center gap-1 font-bold ${
														cb.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
													}`}
												>
													{cb.type === 'INCOME' ? (
														<ArrowUpRight className="w-3.5 h-3.5" />
													) : (
														<ArrowDownRight className="w-3.5 h-3.5" />
													)}
													{cb.type}
												</span>
											</td>
											<td className="px-6 py-3.5 font-bold text-slate-900">
												₹{cb.amount.toLocaleString()}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{cb.mode}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
													{cb.status}
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
		</div>
	)
}
