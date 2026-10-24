import React, { useState, useEffect, useMemo } from 'react'
import { Plus, RotateCw, CheckCircle2, X } from 'lucide-react'
import type { LeaveRequestItem, StaffMember } from '../hrOperations.types'
import { LeaveActionDialog } from '../components/LeaveActionDialog'
import { ApplyLeaveModal } from '../components/ApplyLeaveModal'
import { hrOperationsService } from '../hrOperations.service'

interface LeaveGovernanceTabProps {
	hasExplicitAllUnits: boolean
	staffList?: StaffMember[]
}

const statusBadgeClasses: Record<string, string> = {
	PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
	APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const LeaveGovernanceTab: React.FC<LeaveGovernanceTabProps> = ({
	hasExplicitAllUnits,
	staffList = [],
}) => {
	const [requests, setRequests] = useState<LeaveRequestItem[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
	const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null)
	const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
	const [actionSuccess, setActionSuccess] = useState<string | null>(null)

	useEffect(() => {
		if (actionSuccess) {
			const t = setTimeout(() => setActionSuccess(null), 5000)
			return () => clearTimeout(t)
		}
	}, [actionSuccess])

	const [refreshTrigger, setRefreshTrigger] = useState(0)

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			try {
				const data = await hrOperationsService.getLeaveRequests({
					scope: hasExplicitAllUnits ? 'all' : undefined,
				})
				if (isMounted) {
					setRequests(data)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
				if (isMounted) {
					setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch leave requests')
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [hasExplicitAllUnits, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((p) => p + 1)
	}

	const counts = useMemo(() => {
		let pending = 0
		let approved = 0
		let rejected = 0
		requests.forEach((r) => {
			const st = (r.status || '').toUpperCase()
			if (st === 'PENDING') pending++
			else if (st === 'APPROVED') approved++
			else if (st === 'REJECTED') rejected++
		})
		return { total: requests.length, pending, approved, rejected }
	}, [requests])

	const filteredRequests = useMemo(() => {
		return requests.filter((r) => {
			const matchesSearch =
				(r.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(r.empId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(r.leaveType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(r.department || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesStatus =
				statusFilter === 'ALL' || (r.status || '').toUpperCase() === statusFilter

			return matchesSearch && matchesStatus
		})
	}, [requests, searchTerm, statusFilter])

	return (
		<div className="space-y-6">
			{actionSuccess && (
				<div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
						<span>{actionSuccess}</span>
					</div>
					<button
						type="button"
						onClick={() => setActionSuccess(null)}
						className="text-emerald-700 hover:text-emerald-900"
						aria-label="Dismiss banner"
					>
						<X size={16} />
					</button>
				</div>
			)}

			{/* KPI Ribbon */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
						Total Requests
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-900">{counts.total}</div>
				</div>

				<div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-amber-700">
						Pending Approval
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700">{counts.pending}</div>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Approved
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700">{counts.approved}</div>
				</div>

				<div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-rose-700">
						Rejected
					</div>
					<div className="mt-1 text-2xl font-bold text-rose-700">{counts.rejected}</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-3">
					<div className="relative min-w-[240px] flex-1">
						<input
							type="text"
							placeholder="Search by staff name, ID, type, dept..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
						/>
						<svg
							className="absolute left-3 top-2 h-4 w-4 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>

					<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
						{(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
							<button
								key={st}
								type="button"
								onClick={() => setStatusFilter(st)}
								className={`rounded-md px-3 py-1 transition ${
									statusFilter === st
										? 'bg-white font-semibold text-slate-900 shadow-sm'
										: 'hover:text-slate-900'
								}`}
							>
								{st === 'ALL' ? 'All' : st[0] + st.slice(1).toLowerCase()}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isLoading}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
					>
						<RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
						Refresh
					</button>

					<button
						type="button"
						onClick={() => setIsApplyModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
					>
						<Plus className="h-3.5 w-3.5" />
						Submit Leave Request
					</button>
				</div>
			</div>


			{error && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
					{error}
				</div>
			)}

			{/* Leave Requests Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
							<tr>
								<th className="px-4 py-3.5">Employee</th>
								<th className="px-4 py-3.5">Department</th>
								<th className="px-4 py-3.5">Leave Type</th>
								<th className="px-4 py-3.5">Period (From - To)</th>
								<th className="px-4 py-3.5">Reason</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5 text-right">Decision</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{isLoading && requests.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										<div className="inline-flex items-center gap-2">
											<svg
												className="h-5 w-5 animate-spin text-indigo-500"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8v8H4z"
												/>
											</svg>
											Loading leave requests...
										</div>
									</td>
								</tr>
							) : filteredRequests.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										No leave requests found for the selected criteria.
									</td>
								</tr>
							) : (
								filteredRequests.map((req) => {
									const stUpper = (req.status || 'PENDING').toUpperCase()
									const badgeCls =
										statusBadgeClasses[stUpper] ||
										'bg-slate-100 text-slate-700 border-slate-200'
									const isPending = stUpper === 'PENDING'

									return (
										<tr key={req.id} className="hover:bg-slate-50/70">
											<td className="px-4 py-3.5">
												<div className="font-medium text-slate-900">
													{req.staffName || 'Staff Member'}
												</div>
												<div className="font-mono text-xs text-slate-400">
													{req.empId || 'NO-ID'}
												</div>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600">
												{req.department || 'General'}
											</td>

											<td className="px-4 py-3.5">
												<span className="font-medium text-slate-800">{req.leaveType}</span>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600">
												<div>{req.fromDate}</div>
												<div className="text-slate-400">to {req.toDate}</div>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs truncate">
												{req.reason || '—'}
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}
												>
													{stUpper}
												</span>
											</td>

											<td className="px-4 py-3.5 text-right">
												{isPending ? (
													<button
														type="button"
														onClick={() => setSelectedRequest(req)}
														className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
													>
														Review
													</button>
												) : (
													<span className="text-xs text-slate-400">
														{req.remarks ? `"${req.remarks}"` : 'Decided'}
													</span>
												)}
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
					<span>
						Showing <strong>{filteredRequests.length}</strong> of{' '}
						<strong>{requests.length}</strong> requests
					</span>
					<span>Administrative Authorization Protected</span>
				</div>
			</div>

			{/* Review Modal */}
			<LeaveActionDialog
				request={selectedRequest}
				allRequests={requests}
				isOpen={Boolean(selectedRequest)}
				onClose={() => setSelectedRequest(null)}
				onSuccess={() => {
					handleRefresh()
					setActionSuccess('Leave decision recorded successfully!')
				}}
			/>

			{/* Apply Leave Request Modal */}
			{isApplyModalOpen && (
				<ApplyLeaveModal
					staffList={staffList}
					isOpen={isApplyModalOpen}
					onClose={() => setIsApplyModalOpen(false)}
					onSuccess={() => {
						handleRefresh()
						setActionSuccess('Leave request submitted and logged in governance register!')
					}}
				/>
			)}
		</div>
	)
}
