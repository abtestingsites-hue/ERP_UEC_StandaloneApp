import React, { useState, useEffect, useMemo } from 'react'
import type { OperationalTask, StaffMember } from '../hrOperations.types'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { UpdateTaskStatusModal } from '../components/UpdateTaskStatusModal'
import { hrOperationsService } from '../hrOperations.service'

interface TasksRegisterTabProps {
	staffList: StaffMember[]
	activeUnitId: string | null
	hasExplicitAllUnits: boolean
}

const priorityBadgeClasses: Record<string, string> = {
	LOW: 'bg-slate-100 text-slate-700 border-slate-300',
	MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
	HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
	URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusBadgeClasses: Record<string, string> = {
	ASSIGNED: 'bg-slate-100 text-slate-700 border-slate-300',
	IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
	COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const TasksRegisterTab: React.FC<TasksRegisterTabProps> = ({
	staffList,
	activeUnitId,
	hasExplicitAllUnits,
}) => {
	const [tasks, setTasks] = useState<OperationalTask[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [priorityFilter, setPriorityFilter] = useState('ALL')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [actionMessage, setActionMessage] = useState<string | null>(null)
	const [taskToUpdate, setTaskToUpdate] = useState<OperationalTask | null>(null)
	const [targetStatus, setTargetStatus] = useState<'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('IN_PROGRESS')

	const [refreshTrigger, setRefreshTrigger] = useState(0)

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			try {
				const data = await hrOperationsService.getTasks({
					scope: hasExplicitAllUnits ? 'all' : undefined,
					unitId: activeUnitId,
				})
				if (isMounted) {
					setTasks(data)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
				if (isMounted) {
					setError(axiosError.response?.data?.message || axiosError.message || 'Failed to load operational tasks')
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [hasExplicitAllUnits, activeUnitId, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((p) => p + 1)
	}

	const filteredTasks = useMemo(() => {
		return tasks.filter((t) => {
			const staffName = t.assignedStaff
				? `${t.assignedStaff.firstName} ${t.assignedStaff.lastName || ''}`.toLowerCase()
				: ''
			const matchesSearch =
				t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				t.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				staffName.includes(searchTerm.toLowerCase())

			const matchesPriority =
				priorityFilter === 'ALL' || t.priority.toUpperCase() === priorityFilter

			const matchesStatus =
				statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter

			return matchesSearch && matchesPriority && matchesStatus
		})
	}, [tasks, searchTerm, priorityFilter, statusFilter])

	const handleStatusTransition = async (
		task: OperationalTask,
		newStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
	) => {
		try {
			setActionMessage(null)
			await hrOperationsService.updateTaskStatus(task.id, newStatus)
			setActionMessage(`Updated task ${task.refNo} status to ${newStatus}.`)
			handleRefresh()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(axiosError.response?.data?.message || axiosError.message || 'Failed to update task status')
		}
	}

	const taskStats = useMemo(() => {
		let assigned = 0
		let inProgress = 0
		let completed = 0
		tasks.forEach((t) => {
			const s = t.status.toUpperCase()
			if (s === 'ASSIGNED') assigned++
			else if (s === 'IN_PROGRESS') inProgress++
			else if (s === 'COMPLETED') completed++
		})
		return { total: tasks.length, assigned, inProgress, completed }
	}, [tasks])

	return (
		<div className="space-y-6">
			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
						Total Tasks
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-900">{taskStats.total}</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-slate-600">
						Assigned / Pending
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-700">{taskStats.assigned}</div>
				</div>

				<div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-amber-700">
						In Progress
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700">{taskStats.inProgress}</div>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Completed
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700">{taskStats.completed}</div>
				</div>
			</div>

			{/* Filter & Action Controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-3">
					<div className="relative min-w-[220px] flex-1">
						<input
							type="text"
							placeholder="Search by title, ref no, description, assignee..."
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
						value={priorityFilter}
						onChange={(e) => setPriorityFilter(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Priorities</option>
						<option value="URGENT">Urgent</option>
						<option value="HIGH">High</option>
						<option value="MEDIUM">Medium</option>
						<option value="LOW">Low</option>
					</select>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Statuses</option>
						<option value="ASSIGNED">Assigned</option>
						<option value="IN_PROGRESS">In Progress</option>
						<option value="COMPLETED">Completed</option>
						<option value="CANCELLED">Cancelled</option>
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
						onClick={() => setIsCreateModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						New Task
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

			{/* Tasks Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
							<tr>
								<th className="px-4 py-3.5">Ref No & Title</th>
								<th className="px-4 py-3.5">Assigned Staff</th>
								<th className="px-4 py-3.5">Priority</th>
								<th className="px-4 py-3.5">Due Date</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5 text-right">Transition Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{isLoading && tasks.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-slate-400">
										<div className="inline-flex items-center gap-2">
											<svg className="h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
											</svg>
											Loading operational tasks...
										</div>
									</td>
								</tr>
							) : filteredTasks.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-slate-400">
										No operational tasks found matching criteria.
									</td>
								</tr>
							) : (
								filteredTasks.map((t) => {
									const prioBadge =
										priorityBadgeClasses[t.priority.toUpperCase()] ||
										'bg-slate-100 text-slate-700 border-slate-200'
									const stBadge =
										statusBadgeClasses[t.status.toUpperCase()] ||
										'bg-slate-100 text-slate-700 border-slate-200'
									const stUpper = t.status.toUpperCase()

									return (
										<tr key={t.id} className="hover:bg-slate-50/70">
											<td className="px-4 py-3.5">
												<div className="font-medium text-slate-900">{t.title}</div>
												<div className="font-mono text-xs text-slate-400">{t.refNo}</div>
												{t.description && (
													<div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
														{t.description}
													</div>
												)}
											</td>

											<td className="px-4 py-3.5">
												{t.assignedStaff ? (
													<div>
														<div className="font-medium text-slate-800">
															{t.assignedStaff.firstName} {t.assignedStaff.lastName || ''}
														</div>
														<div className="text-xs text-slate-400 font-mono">
															{t.assignedStaff.empId}
														</div>
													</div>
												) : (
													<span className="text-xs italic text-slate-400">Unassigned</span>
												)}
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${prioBadge}`}
												>
													{t.priority}
												</span>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600">
												{t.dueDate || '—'}
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stBadge}`}
												>
													{t.status}
												</span>
											</td>

											<td className="px-4 py-3.5 text-right">
												<div className="inline-flex items-center gap-1.5">
													{stUpper === 'ASSIGNED' && (
														<button
															type="button"
															onClick={() => {
																setTaskToUpdate(t)
																setTargetStatus('IN_PROGRESS')
															}}
															className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
														>
															Start Task
														</button>
													)}
													{stUpper === 'IN_PROGRESS' && (
														<button
															type="button"
															onClick={() => {
																setTaskToUpdate(t)
																setTargetStatus('COMPLETED')
															}}
															className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
														>
															Complete
														</button>
													)}
													<button
														type="button"
														onClick={() => {
															setTaskToUpdate(t)
															setTargetStatus(t.status as any)
														}}
														className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
													>
														Update...
													</button>
													{stUpper === 'COMPLETED' && (
														<span className="text-xs text-emerald-600 font-bold ml-1">✓ Done</span>
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
						Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
					</span>
					<span>Active Unit Context: {activeUnitId || 'All Units'}</span>
				</div>
			</div>

			<CreateTaskModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onCreated={() => {
					handleRefresh()
				}}
				staffList={staffList}
				activeUnitId={activeUnitId}
			/>

			{taskToUpdate && (
				<UpdateTaskStatusModal
					task={taskToUpdate}
					targetStatus={targetStatus}
					isOpen={Boolean(taskToUpdate)}
					onClose={() => setTaskToUpdate(null)}
					onSuccess={() => {
						handleRefresh()
						setActionMessage(`Updated task ${taskToUpdate.refNo} successfully.`)
					}}
				/>
			)}
		</div>
	)
}
