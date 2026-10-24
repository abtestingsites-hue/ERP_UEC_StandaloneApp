import React, { useState, useMemo } from 'react'
import { Home, UserCheck, Clock, CheckCircle } from 'lucide-react'
import type { HomeCareAdmission, HomeCareAllocation, VisitTask } from '../../home-care/homeCare.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface HomeCareReportsTabProps {
	admissions: HomeCareAdmission[]
	allocations: HomeCareAllocation[]
	tasks: VisitTask[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const HomeCareReportsTab: React.FC<HomeCareReportsTabProps> = ({
	admissions,
	allocations,
	tasks,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'CONTRACTS' | 'ALLOCATIONS' | 'VISITS'>('CONTRACTS')

	// Filter admissions
	const filteredAdmissions = useMemo(() => {
		if (!searchTerm.trim()) return admissions
		return admissions.filter((a) => {
			const client = a.enquiry?.client?.name || a.patient?.name || ''
			const num = a.serviceContract?.contractNumber || a.enquiry?.refNo || (a.id ? String(a.id) : '')
			return (
				client.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(num || '').toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [admissions, searchTerm])

	// Filter allocations
	const filteredAllocations = useMemo(() => {
		if (!searchTerm.trim()) return allocations
		return allocations.filter((al) => {
			const client = al.clientName || al.enquiry?.client?.name || ''
			const staff = al.staffName || (al.staff ? `${al.staff.firstName || ''} ${al.staff.lastName || ''}`.trim() : '')
			return (
				client.toLowerCase().includes(searchTerm.toLowerCase()) ||
				staff.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [allocations, searchTerm])

	// Filter tasks / visits
	const filteredTasks = useMemo(() => {
		if (!searchTerm.trim()) return tasks
		return tasks.filter((t) => {
			const title = t.title || ''
			const status = t.status || ''
			return (
				title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				status.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [tasks, searchTerm])

	const completedVisitsCount = useMemo(
		() => tasks.filter((t) => t.status === 'COMPLETED').length,
		[tasks]
	)
	const pendingVisitsCount = useMemo(
		() => tasks.filter((t) => t.status === 'PENDING' || t.status === 'SCHEDULED').length,
		[tasks]
	)

	const handleExport = () => {
		if (activeSubView === 'CONTRACTS') {
			exportToCsv(
				'HomeCare_Contracts_Report',
				[
					{ key: 'admissionNumber', label: 'Admission No' },
					{ key: 'clientName', label: 'Client Name' },
					{ key: 'status', label: 'Status' },
					{ key: 'startDate', label: 'Start Date' },
				],
				filteredAdmissions as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'ALLOCATIONS') {
			exportToCsv(
				'HomeCare_Allocations_Report',
				[
					{ key: 'clientName', label: 'Client' },
					{ key: 'caregiverName', label: 'Caregiver' },
					{ key: 'status', label: 'Status' },
				],
				filteredAllocations as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'HomeCare_Visits_Report',
				[
					{ key: 'title', label: 'Task Title' },
					{ key: 'status', label: 'Visit Status' },
					{ key: 'dueDate', label: 'Scheduled Date' },
				],
				filteredTasks as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Active Home Care Clients"
					value={admissions.length}
					subtitle="Enrolled In Community Care"
					icon={Home}
					accentColor="indigo"
				/>
				<ReportMetricCard
					title="Field Allocations"
					value={allocations.length}
					subtitle={`${allocations.filter((a) => a.status === 'ACTIVE').length} Active Assignments`}
					icon={UserCheck}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Visits Completed"
					value={completedVisitsCount}
					subtitle="Care Delivery Confirmed"
					icon={CheckCircle}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Visits Scheduled / Pending"
					value={pendingVisitsCount}
					subtitle="Pending Care Tasks"
					icon={Clock}
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
				searchPlaceholder="Search clients, caregivers, or task references..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('CONTRACTS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'CONTRACTS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Clients & Contracts ({filteredAdmissions.length})
				</button>
				<button
					onClick={() => setActiveSubView('ALLOCATIONS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'ALLOCATIONS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Field Staff Allocations ({filteredAllocations.length})
				</button>
				<button
					onClick={() => setActiveSubView('VISITS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'VISITS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Visit Execution Log ({filteredTasks.length})
				</button>
			</div>

			{/* Contracts Table */}
			{activeSubView === 'CONTRACTS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAdmissions.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No home care contracts found for this unit.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Contract / Admission No</th>
										<th className="px-6 py-3">Client Name</th>
										<th className="px-6 py-3">Start Date</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAdmissions.map((adm) => (
										<tr key={adm.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">
												{adm.serviceContract?.contractNumber || adm.enquiry?.refNo || adm.id.slice(0, 8)}
											</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												{adm.enquiry?.client?.name || adm.patient?.name || 'Home Care Client'}
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{adm.serviceContract?.startDate ? String(adm.serviceContract.startDate).slice(0, 10) : '—'}
											</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
													{adm.status || 'ACTIVE'}
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
							No caregiver allocation records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Client</th>
										<th className="px-6 py-3">Allocated Caregiver</th>
										<th className="px-6 py-3">Service Shift</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAllocations.map((al) => (
										<tr key={al.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{al.clientName || al.enquiry?.client?.name || 'Client'}</td>
											<td className="px-6 py-3.5 text-slate-700">{al.staffName || (al.staff ? `${al.staff.firstName || ''} ${al.staff.lastName || ''}`.trim() : '') || 'Caregiver'}</td>
											<td className="px-6 py-3.5 text-slate-600">{al.type || 'Home Care'}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
													{al.status}
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

			{/* Visits Table */}
			{activeSubView === 'VISITS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredTasks.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No visit tasks recorded.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Task / Visit Title</th>
										<th className="px-6 py-3">Scheduled Date</th>
										<th className="px-6 py-3">Type</th>
										<th className="px-6 py-3">Execution Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredTasks.map((t) => (
										<tr key={t.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{t.title}</td>
											<td className="px-6 py-3.5 text-slate-500">{t.dueDate ? String(t.dueDate).slice(0, 10) : '—'}</td>
											<td className="px-6 py-3.5 text-slate-700">{t.type || 'VISIT'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														t.status === 'COMPLETED'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: 'bg-amber-50 text-amber-700 border-amber-200'
													}`}
												>
													{t.status}
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
