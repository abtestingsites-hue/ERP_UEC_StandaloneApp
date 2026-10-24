import React, { useState, useMemo } from 'react'
import type { StaffMember, StaffStatus } from '../hrOperations.types'
import { StaffDetailDrawer } from '../components/StaffDetailDrawer'
import { AddStaffModal } from '../components/AddStaffModal'
import { hrOperationsService } from '../hrOperations.service'

interface StaffDirectoryTabProps {
	staffList: StaffMember[]
	isLoading: boolean
	onRefresh: () => void
}

const statusBadgeClasses: Record<string, string> = {
	Working: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
	Resigned: 'bg-slate-100 text-slate-700 border-slate-300',
	Terminated: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const StaffDirectoryTab: React.FC<StaffDirectoryTabProps> = ({
	staffList,
	isLoading,
	onRefresh,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedDepartment, setSelectedDepartment] = useState('ALL')
	const [selectedStatus, setSelectedStatus] = useState('ALL')
	const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [actionSuccess, setActionSuccess] = useState<string | null>(null)

	const departments = useMemo(() => {
		const set = new Set<string>()
		staffList.forEach((s) => {
			if (s.department) set.add(s.department)
		})
		return Array.from(set).sort()
	}, [staffList])

	const filteredStaff = useMemo(() => {
		return staffList.filter((s) => {
			const matchesSearch =
				s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.phone.toLowerCase().includes(searchTerm.toLowerCase())

			const matchesDept =
				selectedDepartment === 'ALL' || s.department === selectedDepartment

			const matchesStatus =
				selectedStatus === 'ALL' || s.status === selectedStatus

			return matchesSearch && matchesDept && matchesStatus
		})
	}, [staffList, searchTerm, selectedDepartment, selectedStatus])

	const handleStatusChange = async (staff: StaffMember, newStatus: StaffStatus) => {
		try {
			setActionError(null)
			setActionSuccess(null)
			await hrOperationsService.updateStaff(staff.id, { status: newStatus })
			setActionSuccess(`Updated ${staff.name}'s status to ${newStatus}.`)
			onRefresh()
			if (selectedStaff?.id === staff.id) {
				setSelectedStaff((prev) => (prev ? { ...prev, status: newStatus } : null))
			}
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setActionError(axiosError.response?.data?.message || axiosError.message || 'Failed to update status')
		}
	}

	return (
		<div className="space-y-6">
			{/* Top Action & Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-3">
					<div className="relative min-w-[240px] flex-1">
						<input
							type="text"
							placeholder="Search by name, ID, role, email..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 pl-9 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						/>
						<svg
							className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
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
						value={selectedDepartment}
						onChange={(e) => setSelectedDepartment(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Departments ({departments.length})</option>
						{departments.map((dept) => (
							<option key={dept} value={dept}>
								{dept}
							</option>
						))}
					</select>

					<select
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Statuses</option>
						<option value="Working">Working</option>
						<option value="On Leave">On Leave</option>
						<option value="Resigned">Resigned</option>
						<option value="Terminated">Terminated</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onRefresh}
						disabled={isLoading}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
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
						onClick={() => setIsAddModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Onboard Staff
					</button>
				</div>
			</div>

			{/* Alert banners */}
			{actionError && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
					{actionError}
				</div>
			)}
			{actionSuccess && (
				<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
					{actionSuccess}
				</div>
			)}

			{/* Staff Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
							<tr>
								<th className="px-4 py-3.5">Staff Member</th>
								<th className="px-4 py-3.5">Role & Department</th>
								<th className="px-4 py-3.5">Contact Info</th>
								<th className="px-4 py-3.5">Joined Date</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{isLoading && staffList.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-slate-400">
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
											Loading employee directory...
										</div>
									</td>
								</tr>
							) : filteredStaff.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-12 text-center text-slate-400">
										No staff members match the selected filters.
									</td>
								</tr>
							) : (
								filteredStaff.map((staff) => {
									const statusCls =
										statusBadgeClasses[staff.status] ||
										'bg-slate-100 text-slate-700 border-slate-200'
									return (
										<tr
											key={staff.id}
											className="transition hover:bg-slate-50/80 cursor-pointer"
											onClick={() => setSelectedStaff(staff)}
										>
											<td className="px-4 py-3.5">
												<div className="flex items-center gap-3">
													{staff.photoUrl ? (
														<img
															src={staff.photoUrl}
															alt={staff.name}
															className="h-9 w-9 rounded-full object-cover border border-slate-200"
														/>
													) : (
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
															{staff.name
																.split(' ')
																.map((n) => n[0])
																.slice(0, 2)
																.join('')
																.toUpperCase()}
														</div>
													)}
													<div>
														<div className="font-medium text-slate-900">{staff.name}</div>
														<div className="text-xs text-slate-400 font-mono">
															{staff.empId || 'NO-ID'}
														</div>
													</div>
												</div>
											</td>

											<td className="px-4 py-3.5">
												<div className="font-medium text-slate-800">{staff.role}</div>
												<div className="text-xs text-slate-500">{staff.department}</div>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600">
												<div>{staff.phone || '—'}</div>
												<div className="text-slate-400">{staff.email || '—'}</div>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600">
												{staff.joiningDate || '—'}
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCls}`}
												>
													{staff.status}
												</span>
											</td>

											<td
												className="px-4 py-3.5 text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<div className="inline-flex items-center gap-1.5">
													<button
														type="button"
														onClick={() => setSelectedStaff(staff)}
														className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
														title="View full profile"
													>
														<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
															/>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
															/>
														</svg>
													</button>

													<select
														value={staff.status}
														onChange={(e) => handleStatusChange(staff, e.target.value as StaffStatus)}
														className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
													>
														<option value="Working">Working</option>
														<option value="On Leave">On Leave</option>
														<option value="Resigned">Resigned</option>
														<option value="Terminated">Terminated</option>
													</select>
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
						Showing <strong>{filteredStaff.length}</strong> of{' '}
						<strong>{staffList.length}</strong> staff members
					</span>
					<span>Active Unit Context Enforced</span>
				</div>
			</div>

			{/* Drawers and Modals */}
			<StaffDetailDrawer
				staff={selectedStaff}
				isOpen={Boolean(selectedStaff)}
				onClose={() => setSelectedStaff(null)}
				onUpdated={() => {
					onRefresh()
				}}
			/>

			<AddStaffModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onCreated={() => {
					onRefresh()
				}}
			/>
		</div>
	)
}
