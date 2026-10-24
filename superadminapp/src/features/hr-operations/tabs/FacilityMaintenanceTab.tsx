import React, { useState, useEffect, useMemo } from 'react'
import type { MaintenanceTicket } from '../hrOperations.types'
import { LogMaintenanceModal } from '../components/LogMaintenanceModal'
import { ResolveMaintenanceModal } from '../components/ResolveMaintenanceModal'
import { hrOperationsService } from '../hrOperations.service'
import { formatMaintenanceTicketNumber } from '../../../utils/idFormatters'

interface FacilityMaintenanceTabProps {
	activeUnitId: string | null
}

const statusBadgeClasses: Record<string, string> = {
	PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
	IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
	RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const priorityBadgeClasses: Record<string, string> = {
	LOW: 'bg-slate-100 text-slate-700 border-slate-300',
	MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
	HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
	URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const FacilityMaintenanceTab: React.FC<FacilityMaintenanceTabProps> = ({
	activeUnitId,
}) => {
	const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [isLogModalOpen, setIsLogModalOpen] = useState(false)
	const [ticketToResolve, setTicketToResolve] = useState<MaintenanceTicket | null>(null)
	const [actionMessage, setActionMessage] = useState<string | null>(null)

	const [refreshTrigger, setRefreshTrigger] = useState(0)

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			try {
				const data = await hrOperationsService.getMaintenanceTickets({
					unitId: activeUnitId,
				})
				if (isMounted) {
					setTickets(data)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
				if (isMounted) {
					setError(axiosError.response?.data?.message || axiosError.message || 'Failed to load maintenance tickets')
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [activeUnitId, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((p) => p + 1)
	}

	const counts = useMemo(() => {
		let pending = 0
		let inProgress = 0
		let resolved = 0
		tickets.forEach((t) => {
			const s = t.status.toUpperCase()
			if (s === 'PENDING') pending++
			else if (s === 'IN_PROGRESS') inProgress++
			else if (s === 'RESOLVED') resolved++
		})
		return { total: tickets.length, pending, inProgress, resolved }
	}, [tickets])

	const filteredTickets = useMemo(() => {
		return tickets.filter((t) => {
			const matchesSearch =
				t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.description || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesStatus =
				statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter

			return matchesSearch && matchesStatus
		})
	}, [tickets, searchTerm, statusFilter])

	const handleStatusChange = async (
		ticketId: string,
		newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED',
	) => {
		try {
			setActionMessage(null)
			await hrOperationsService.updateMaintenanceStatus(ticketId, newStatus)
			setActionMessage(`Updated maintenance status to ${newStatus}.`)
			handleRefresh()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(axiosError.response?.data?.message || axiosError.message || 'Failed to update maintenance status')
		}
	}

	return (
		<div className="space-y-6">
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
						Pending Intake
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700">{counts.pending}</div>
				</div>

				<div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-blue-700">
						Under Repair
					</div>
					<div className="mt-1 text-2xl font-bold text-blue-700">{counts.inProgress}</div>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Resolved
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700">{counts.resolved}</div>
				</div>
			</div>

			{/* Filter & Action Controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-3">
					<div className="relative min-w-[220px] flex-1">
						<input
							type="text"
							placeholder="Search by ticket type or description..."
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

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Statuses</option>
						<option value="PENDING">Pending</option>
						<option value="IN_PROGRESS">In Progress</option>
						<option value="RESOLVED">Resolved</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isLoading}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
					>
						<svg
							className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Refresh
					</button>

					<button
						type="button"
						onClick={() => setIsLogModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Log Issue
					</button>
				</div>
			</div>

			{error && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
					{error}
				</div>
			)}
			{actionMessage && (
				<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
					{actionMessage}
				</div>
			)}

			{/* Tickets Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
							<tr>
								<th className="px-4 py-3.5">Ticket #</th>
								<th className="px-4 py-3.5">Issue Type</th>
								<th className="px-4 py-3.5">Priority</th>
								<th className="px-4 py-3.5">Description & Location</th>
								<th className="px-4 py-3.5">Logged Date</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{isLoading && tickets.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										<div className="inline-flex items-center gap-2">
											<svg className="h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
											</svg>
											Loading maintenance tickets...
										</div>
									</td>
								</tr>
							) : filteredTickets.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										No maintenance tickets found matching the criteria.
									</td>
								</tr>
							) : (
								filteredTickets.map((t) => {
									const stUpper = t.status.toUpperCase()
									const badgeCls =
										statusBadgeClasses[stUpper] ||
										'bg-slate-100 text-slate-700 border-slate-200'
									const prioCls =
										priorityBadgeClasses[t.priority?.toUpperCase() || 'MEDIUM'] ||
										priorityBadgeClasses['MEDIUM']

									return (
										<tr key={t.id} className="hover:bg-slate-50/70">
											<td className="px-4 py-3.5 font-mono font-bold text-indigo-700">
												{formatMaintenanceTicketNumber(t.ticketNumber || t.refNo, t.id)}
											</td>
											<td className="px-4 py-3.5 font-medium text-slate-900">{t.type}</td>
											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${prioCls}`}
												>
													{t.priority || 'MEDIUM'}
												</span>
											</td>
											<td className="px-4 py-3.5 text-xs text-slate-600 max-w-sm">
												<div className="font-medium text-slate-800">{t.description || '—'}</div>
												{t.resolvedBy && (
													<div className="mt-0.5 text-[11px] text-emerald-700">
														Tech: {t.resolvedBy}
													</div>
												)}
											</td>
											<td className="px-4 py-3.5 text-xs text-slate-500">
												{t.createdAt.slice(0, 10)}
											</td>
											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}
												>
													{t.status}
												</span>
											</td>
											<td className="px-4 py-3.5 text-right">
												<div className="inline-flex items-center gap-1.5">
													{stUpper === 'PENDING' && (
														<button
															type="button"
															onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')}
															className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
														>
															Start Repair
														</button>
													)}
													{stUpper === 'IN_PROGRESS' && (
														<button
															type="button"
															onClick={() => setTicketToResolve(t)}
															className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
														>
															Verify & Resolve...
														</button>
													)}
													{stUpper === 'RESOLVED' && (
														<span className="text-xs font-bold text-emerald-600">✓ Closed</span>
													)}
												</div>
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
						Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
					</span>
					<span>Facility & Asset Operations</span>
				</div>
			</div>

			<LogMaintenanceModal
				isOpen={isLogModalOpen}
				onClose={() => setIsLogModalOpen(false)}
				onCreated={() => {
					handleRefresh()
				}}
				activeUnitId={activeUnitId}
			/>

			{ticketToResolve && (
				<ResolveMaintenanceModal
					ticket={ticketToResolve}
					isOpen={Boolean(ticketToResolve)}
					onClose={() => setTicketToResolve(null)}
					onSuccess={() => {
						handleRefresh()
						setActionMessage(`Ticket resolved and verified successfully.`)
					}}
				/>
			)}
		</div>
	)
}
