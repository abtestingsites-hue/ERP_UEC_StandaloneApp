import React, { useState, useMemo } from 'react'
import { Heart, DollarSign, FolderGit2, Receipt } from 'lucide-react'
import type { Donation, Project, FundingAllocation, ProjectExpenditure } from '../../donors-volunteers/donorsVolunteers.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface DonorsFundingReportsTabProps {
	donations: Donation[]
	projects: Project[]
	allocations: FundingAllocation[]
	expenditures: ProjectExpenditure[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const DonorsFundingReportsTab: React.FC<DonorsFundingReportsTabProps> = ({
	donations,
	projects,
	allocations,
	expenditures,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'DONATIONS' | 'PROJECTS' | 'ALLOCATIONS'>('DONATIONS')

	// Filter donations
	const filteredDonations = useMemo(() => {
		if (!searchTerm.trim()) return donations
		return donations.filter((d) => {
			const name = d.donor?.name || ''
			const ref = d.receiptNo || d.id || ''
			return name.toLowerCase().includes(searchTerm.toLowerCase()) || ref.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [donations, searchTerm])

	// Filter projects
	const filteredProjects = useMemo(() => {
		if (!searchTerm.trim()) return projects
		return projects.filter((p) => {
			const name = p.name || ''
			const desc = p.description || ''
			return name.toLowerCase().includes(searchTerm.toLowerCase()) || desc.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [projects, searchTerm])

	// Filter allocations
	const filteredAllocations = useMemo(() => {
		if (!searchTerm.trim()) return allocations
		return allocations.filter((a) => {
			const pName = a.project?.name || ''
			const notes = a.notes || ''
			return pName.toLowerCase().includes(searchTerm.toLowerCase()) || notes.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [allocations, searchTerm])

	const totalDonationsAmount = useMemo(
		() => donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
		[donations]
	)
	const totalAllocatedAmount = useMemo(
		() => allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
		[allocations]
	)
	const totalExpenditureAmount = useMemo(
		() => expenditures.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
		[expenditures]
	)

	const handleExport = () => {
		if (activeSubView === 'DONATIONS') {
			exportToCsv(
				'Donations_Collections_Report',
				[
					{ key: 'receiptNo', label: 'Receipt No' },
					{ key: 'amount', label: 'Amount (INR)' },
					{ key: 'paymentMode', label: 'Payment Mode' },
					{ key: 'isReceiptSent', label: 'Receipt Sent' },
					{ key: 'createdAt', label: 'Date' },
				],
				filteredDonations as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'PROJECTS') {
			exportToCsv(
				'Funding_Projects_Report',
				[
					{ key: 'name', label: 'Project Name' },
					{ key: 'totalBudget', label: 'Budget (INR)' },
					{ key: 'approvalStatus', label: 'Approval Status' },
					{ key: 'status', label: 'Status' },
				],
				filteredProjects as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Funding_Allocations_Report',
				[
					{ key: 'amount', label: 'Amount (INR)' },
					{ key: 'source', label: 'Funding Source' },
					{ key: 'createdAt', label: 'Date' },
				],
				filteredAllocations as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Total Donations Collected"
					value={`₹${totalDonationsAmount.toLocaleString()}`}
					subtitle={`${donations.length} Registered Contributions`}
					icon={Heart}
					accentColor="purple"
				/>
				<ReportMetricCard
					title="Active Funding Projects"
					value={projects.length}
					subtitle={`${projects.filter((p) => p.status === 'ACTIVE').length} Projects Active`}
					icon={FolderGit2}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Allocated Grant Funding"
					value={`₹${totalAllocatedAmount.toLocaleString()}`}
					subtitle={`${allocations.length} Allocations Recorded`}
					icon={DollarSign}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Project Expenditures"
					value={`₹${totalExpenditureAmount.toLocaleString()}`}
					subtitle={`${expenditures.length} Incurred Expenses`}
					icon={Receipt}
					accentColor="amber"
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
				searchPlaceholder="Search donor names, project titles, or references..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('DONATIONS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'DONATIONS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Donations Ledger ({filteredDonations.length})
				</button>
				<button
					onClick={() => setActiveSubView('PROJECTS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'PROJECTS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Projects Registry ({filteredProjects.length})
				</button>
				<button
					onClick={() => setActiveSubView('ALLOCATIONS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'ALLOCATIONS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Allocations & Grants ({filteredAllocations.length})
				</button>
			</div>

			{/* Donations Table */}
			{activeSubView === 'DONATIONS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredDonations.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No donation records match the search filter.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Donor Name</th>
										<th className="px-6 py-3">Amount</th>
										<th className="px-6 py-3">Payment Mode</th>
										<th className="px-6 py-3">Transaction Ref</th>
										<th className="px-6 py-3">Receipt Dispatch</th>
										<th className="px-6 py-3">Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredDonations.map((d) => (
										<tr key={d.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{d.donor?.name || 'Supporter'}</td>
											<td className="px-6 py-3.5 font-bold text-purple-700">
												₹{Number(d.amount).toLocaleString()}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{d.paymentMode}</td>
											<td className="px-6 py-3.5 font-mono text-slate-500">{d.receiptNo || '—'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
														d.isReceiptSent || d.receiptSentAt
															? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
															: 'bg-amber-50 text-amber-700 border border-amber-200'
													}`}
												>
													{d.isReceiptSent || d.receiptSentAt ? 'Dispatched' : 'Pending Receipt'}
												</span>
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{d.date ? String(d.date).slice(0, 10) : '—'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Projects Table */}
			{activeSubView === 'PROJECTS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredProjects.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No funding projects recorded.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Project Name</th>
										<th className="px-6 py-3">Total Budget</th>
										<th className="px-6 py-3">Approval Status</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredProjects.map((p) => (
										<tr key={p.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{p.name}</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												₹{p.totalBudget.toLocaleString()}
											</td>
											<td className="px-6 py-3.5 text-indigo-700 font-semibold">
												{p.approvalStatus || 'APPROVED'}
											</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
													{p.status || 'ACTIVE'}
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

			{/* Allocations Table */}
			{activeSubView === 'ALLOCATIONS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAllocations.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No grant allocations found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Project</th>
										<th className="px-6 py-3">Allocated Amount</th>
										<th className="px-6 py-3">Funding Source</th>
										<th className="px-6 py-3">Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAllocations.map((a) => (
										<tr key={a.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">
												{a.project?.name || 'General Project Fund'}
											</td>
											<td className="px-6 py-3.5 font-bold text-emerald-700">
												₹{a.amount.toLocaleString()}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{a.source || 'Direct Donor Grant'}</td>
											<td className="px-6 py-3.5 text-slate-500">
												{a.createdAt ? String(a.createdAt).slice(0, 10) : '—'}
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
