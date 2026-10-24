import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Filter } from 'lucide-react'
import type { CrossDomainPendingItem, ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface CrossDomainWorkflowTabProps {
	items: CrossDomainPendingItem[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const CrossDomainWorkflowTab: React.FC<CrossDomainWorkflowTabProps> = ({
	items,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [domainFilter, setDomainFilter] = useState('ALL')
	const [priorityFilter, setPriorityFilter] = useState('ALL')

	const filteredItems = useMemo(() => {
		return items.filter((item) => {
			const matchesSearch =
				(item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(item.responsibleTeam || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesDomain = domainFilter === 'ALL' || item.domain === domainFilter
			const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter

			return matchesSearch && matchesDomain && matchesPriority
		})
	}, [items, searchTerm, domainFilter, priorityFilter])

	const criticalCount = useMemo(
		() => items.filter((i) => i.priority === 'CRITICAL' || i.priority === 'HIGH').length,
		[items]
	)

	const distinctDomains = useMemo(() => {
		const set = new Set(items.map((i) => i.domain))
		return Array.from(set)
	}, [items])

	const handleExport = () => {
		exportToCsv(
			'Cross_Domain_Pending_Actions_Audit',
			[
				{ key: 'domain', label: 'Domain' },
				{ key: 'reference', label: 'Record Ref' },
				{ key: 'title', label: 'Action Title' },
				{ key: 'status', label: 'Status' },
				{ key: 'priority', label: 'Priority' },
				{ key: 'responsibleTeam', label: 'Responsible Team' },
				{ key: 'timestamp', label: 'Date Logged' },
			],
			filteredItems as unknown as Record<string, unknown>[]
		)
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Total Pending Clearances"
					value={items.length}
					subtitle="Across 9 Integrated Modules"
					icon={Clock}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="High / Critical Urgency"
					value={criticalCount}
					subtitle="Requires Prompt Intervention"
					icon={AlertTriangle}
					accentColor={criticalCount > 0 ? 'rose' : 'emerald'}
				/>
				<ReportMetricCard
					title="Impacted Domains"
					value={distinctDomains.length}
					subtitle="Active Operational Areas"
					icon={Filter}
					accentColor="indigo"
				/>
				<ReportMetricCard
					title="Governance Status"
					value={items.length === 0 ? 'All Clear' : 'Active Queue'}
					subtitle="Read-Only Oversight"
					icon={CheckCircle2}
					accentColor={items.length === 0 ? 'emerald' : 'amber'}
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
				searchPlaceholder="Search pending actions by reference, title, or team..."
			/>

			{/* Filter Dropdowns */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<label className="text-xs font-semibold text-slate-500">Domain:</label>
						<select
							value={domainFilter}
							onChange={(e) => setDomainFilter(e.target.value)}
							className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
						>
							<option value="ALL">All Domains</option>
							{distinctDomains.map((d) => (
								<option key={d} value={d}>
									{d}
								</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-2">
						<label className="text-xs font-semibold text-slate-500">Priority:</label>
						<select
							value={priorityFilter}
							onChange={(e) => setPriorityFilter(e.target.value)}
							className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
						>
							<option value="ALL">All Priorities</option>
							<option value="CRITICAL">Critical</option>
							<option value="HIGH">High</option>
							<option value="NORMAL">Normal</option>
						</select>
					</div>
				</div>

				<div className="text-xs text-slate-500 font-medium">
					Showing {filteredItems.length} of {items.length} pending workflow items
				</div>
			</div>

			{/* Pending Actions Table */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				{filteredItems.length === 0 ? (
					<div className="p-12 text-center text-slate-500 text-sm">
						<CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
						<p className="font-semibold text-slate-800">No pending workflow actions in this scope!</p>
						<p className="text-xs text-slate-400 mt-1">All queues and approvals are currently clear.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs text-slate-700">
							<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
								<tr>
									<th className="px-6 py-3">Source Domain</th>
									<th className="px-6 py-3">Reference</th>
									<th className="px-6 py-3">Workflow Action Item</th>
									<th className="px-6 py-3">Status</th>
									<th className="px-6 py-3">Responsible Team</th>
									<th className="px-6 py-3">Date Logged</th>
									<th className="px-6 py-3 text-right">Action in Domain</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredItems.map((item) => (
									<tr key={item.id} className="hover:bg-slate-50/80 transition">
										<td className="px-6 py-3.5">
											<span className="font-bold text-slate-900">{item.domain}</span>
										</td>
										<td className="px-6 py-3.5 font-mono text-slate-600 font-semibold">
											{item.reference}
										</td>
										<td className="px-6 py-3.5 max-w-sm">
											<div className="font-bold text-slate-800">{item.title}</div>
										</td>
										<td className="px-6 py-3.5">
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
													item.priority === 'CRITICAL' || item.priority === 'HIGH'
														? 'bg-rose-50 text-rose-700 border-rose-200'
														: 'bg-amber-50 text-amber-700 border-amber-200'
												}`}
											>
												{item.status}
											</span>
										</td>
										<td className="px-6 py-3.5 text-slate-600">{item.responsibleTeam}</td>
										<td className="px-6 py-3.5 text-slate-500">{item.timestamp || '—'}</td>
										<td className="px-6 py-3.5 text-right">
											<Link
												to={item.actionPath}
												className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold hover:underline"
												title={`Open ${item.domain} module to act`}
											>
												Open Module
												<ArrowRight className="w-3.5 h-3.5" />
											</Link>
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
