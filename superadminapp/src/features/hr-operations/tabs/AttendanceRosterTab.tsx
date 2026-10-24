import React, { useState, useEffect, useMemo } from 'react'
import {
	Calendar,
	CalendarCheck,
	Clock,
	AlertTriangle,
	Users,
	ShieldCheck,
	Plus,
	RotateCw,
	CheckCircle2,
	X,
} from 'lucide-react'
import type { AttendanceRecord, StaffMember } from '../hrOperations.types'
import { hrOperationsService } from '../hrOperations.service'
import { RecordAttendanceModal } from '../components/RecordAttendanceModal'

interface AttendanceRosterTabProps {
	hasExplicitAllUnits: boolean
	staffList?: StaffMember[]
}

const statusBadgeClasses: Record<string, string> = {
	PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
	HALF_DAY: 'bg-amber-50 text-amber-700 border-amber-200',
	ON_LEAVE: 'bg-blue-50 text-blue-700 border-blue-200',
}

const SHIFT_BUCKETS = [
	{ id: 'MORNING', label: 'Morning Shift', timing: '07:00 - 15:00', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
	{ id: 'GENERAL', label: 'General Day Shift', timing: '09:00 - 18:00', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
	{ id: 'EVENING', label: 'Evening Shift', timing: '15:00 - 23:00', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
	{ id: 'NIGHT', label: 'Night Shift', timing: '23:00 - 07:00', icon: Clock, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

export const AttendanceRosterTab: React.FC<AttendanceRosterTabProps> = ({
	hasExplicitAllUnits,
	staffList = [],
}) => {
	const [viewMode, setViewMode] = useState<'LOGS' | 'ROSTER'>('LOGS')
	const [selectedDate, setSelectedDate] = useState(() => {
		return new Date().toISOString().slice(0, 10)
	})
	const [records, setRecords] = useState<AttendanceRecord[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
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
				setIsLoading(true)
				const data = await hrOperationsService.getAttendanceLogs({
					date: selectedDate,
					scope: hasExplicitAllUnits ? 'all' : undefined,
				})
				if (isMounted) {
					setRecords(data)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
				if (isMounted) {
					setError(axiosError.response?.data?.message || axiosError.message || 'Failed to load attendance logs')
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [selectedDate, hasExplicitAllUnits, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((p) => p + 1)
	}

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const matchesSearch =
				(r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(r.empId || '').toLowerCase().includes(searchTerm.toLowerCase())
			const matchesStatus =
				statusFilter === 'ALL' || (r.status || '').toUpperCase() === statusFilter.toUpperCase()
			return matchesSearch && matchesStatus
		})
	}, [records, searchTerm, statusFilter])

	const counts = useMemo(() => {
		let present = 0
		let absent = 0
		let halfDay = 0
		let onLeave = 0
		let incomplete = 0

		records.forEach((r) => {
			const st = (r.status || '').toUpperCase()
			if (st === 'PRESENT') present++
			else if (st === 'ABSENT') absent++
			else if (st === 'HALF_DAY') halfDay++
			else if (st === 'ON_LEAVE') onLeave++

			if (r.checkIn && !r.checkOut && st !== 'ABSENT' && st !== 'ON_LEAVE') {
				incomplete++
			}
		})

		return { total: records.length, present, absent, halfDay, onLeave, incomplete }
	}, [records])

	// Shift mapping for Roster View
	const shiftDistribution = useMemo(() => {
		const activeStaff = staffList.filter((s) => !s.isDeleted && s.status !== 'Terminated' && s.status !== 'Resigned')
		const presentEmpIds = new Set(records.filter((r) => (r.status || '').toUpperCase() === 'PRESENT').map((r) => r.empId))
		const absentEmpIds = new Set(records.filter((r) => (r.status || '').toUpperCase() === 'ABSENT').map((r) => r.empId))
		const leaveEmpIds = new Set(records.filter((r) => (r.status || '').toUpperCase() === 'ON_LEAVE').map((r) => r.empId))

		const buckets: Record<string, Array<{ staff: StaffMember; status: string; log?: AttendanceRecord }>> = {
			MORNING: [],
			GENERAL: [],
			EVENING: [],
			NIGHT: [],
		}

		activeStaff.forEach((s, idx) => {
			const log = records.find((r) => r.empId === s.empId || r.staffId === s.id)
			let st = 'SCHEDULED'
			if (presentEmpIds.has(s.empId)) st = 'PRESENT'
			else if (absentEmpIds.has(s.empId)) st = 'ABSENT'
			else if (leaveEmpIds.has(s.empId)) st = 'ON_LEAVE'

			// Determine bucket based on shiftStart or cycle index
			let bucketId = 'GENERAL'
			if (s.shiftStart?.includes('07:') || idx % 4 === 1) bucketId = 'MORNING'
			else if (s.shiftStart?.includes('15:') || idx % 4 === 2) bucketId = 'EVENING'
			else if (s.shiftStart?.includes('23:') || idx % 4 === 3) bucketId = 'NIGHT'

			buckets[bucketId].push({ staff: s, status: st, log })
		})

		return buckets
	}, [staffList, records])

	// Department Coverage summary
	const departmentCoverage = useMemo(() => {
		const deptMap: Record<string, { total: number; present: number }> = {}
		staffList.forEach((s) => {
			const dept = s.department || 'General'
			if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 }
			deptMap[dept].total++
			const isPres = records.some((r) => (r.empId === s.empId || r.staffId === s.id) && (r.status || '').toUpperCase() === 'PRESENT')
			if (isPres) deptMap[dept].present++
		})
		return Object.entries(deptMap).map(([dept, val]) => ({
			department: dept,
			total: val.total,
			present: val.present,
			percentage: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
		}))
	}, [staffList, records])

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

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
						Total Logged
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-900">{counts.total}</div>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Present
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700">{counts.present}</div>
				</div>

				<div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-rose-700">
						Absent
					</div>
					<div className="mt-1 text-2xl font-bold text-rose-700">{counts.absent}</div>
				</div>

				<div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-blue-700">
						On Leave
					</div>
					<div className="mt-1 text-2xl font-bold text-blue-700">{counts.onLeave}</div>
				</div>

				<div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-amber-700">
						Pending Clock-Out
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700">{counts.incomplete}</div>
				</div>
			</div>

			{/* Sub-view switcher & Action Controls */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setViewMode('LOGS')}
						className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
							viewMode === 'LOGS'
								? 'bg-indigo-600 text-white shadow-sm'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
					>
						Daily Attendance Logs
					</button>
					<button
						type="button"
						onClick={() => setViewMode('ROSTER')}
						className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
							viewMode === 'ROSTER'
								? 'bg-indigo-600 text-white shadow-sm'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
					>
						Shift Roster & Coverage Matrix
					</button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<label htmlFor="attendance-date" className="text-xs font-medium text-slate-600">
							Roster Date:
						</label>
						<input
							id="attendance-date"
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
						/>
					</div>

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
						onClick={() => setIsRecordModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
					>
						<Plus className="h-3.5 w-3.5" />
						Record Attendance
					</button>
				</div>
			</div>

			{error && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
					{error}
				</div>
			)}

			{/* ========================================================================= */}
			{/* VIEW 1: DAILY ATTENDANCE LOGS REGISTER                                    */}
			{/* ========================================================================= */}
			{viewMode === 'LOGS' && (
				<div className="space-y-4">
					{/* Search & Filter */}
					<div className="flex flex-wrap items-center gap-3">
						<div className="relative min-w-[220px] flex-1">
							<input
								type="text"
								placeholder="Search employee name or ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 pl-8 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
							/>
						</div>

						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
						>
							<option value="ALL">All Statuses</option>
							<option value="PRESENT">Present</option>
							<option value="ABSENT">Absent</option>
							<option value="HALF_DAY">Half Day</option>
							<option value="ON_LEAVE">On Leave</option>
						</select>
					</div>

					{/* Attendance Table */}
					<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
									<tr>
										<th className="px-4 py-3.5">Date</th>
										<th className="px-4 py-3.5">Emp ID</th>
										<th className="px-4 py-3.5">Staff Name</th>
										<th className="px-4 py-3.5">Check In</th>
										<th className="px-4 py-3.5">Check Out</th>
										<th className="px-4 py-3.5">Status</th>
										<th className="px-4 py-3.5">Verification & Notes</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-700">
									{isLoading ? (
										<tr>
											<td colSpan={7} className="py-12 text-center text-slate-400">
												Loading attendance records...
											</td>
										</tr>
									) : filteredRecords.length === 0 ? (
										<tr>
											<td colSpan={7} className="py-12 text-center text-slate-400">
												No attendance records found for {selectedDate}. Use "Record Attendance" above to log walk-in check-in.
											</td>
										</tr>
									) : (
										filteredRecords.map((rec) => {
											const stUpper = (rec.status || '').toUpperCase()
											const badgeCls =
												statusBadgeClasses[stUpper] ||
												'bg-slate-100 text-slate-700 border-slate-200'
											const isIncomplete =
												rec.checkIn && !rec.checkOut && stUpper !== 'ABSENT' && stUpper !== 'ON_LEAVE'
											return (
												<tr key={rec.id || `${rec.empId}-${rec.date}`} className="hover:bg-slate-50/70">
													<td className="px-4 py-3 text-xs text-slate-500">{rec.date}</td>
													<td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
														{rec.empId}
													</td>
													<td className="px-4 py-3 font-medium text-slate-900">{rec.name}</td>
													<td className="px-4 py-3 text-xs font-mono text-slate-700">
														{rec.checkIn || '—'}
													</td>
													<td className="px-4 py-3 text-xs font-mono text-slate-700">
														{rec.checkOut || (
															isIncomplete ? (
																<span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
																	<AlertTriangle size={10} /> Pending Clock-Out
																</span>
															) : (
																'—'
															)
														)}
													</td>
													<td className="px-4 py-3">
														<span
															className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}
														>
															{stUpper}
														</span>
													</td>
													<td className="px-4 py-3 text-xs text-slate-500">
														{rec.notes || 'Verified'}
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
								Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records for {selectedDate}
							</span>
							<span>Scope: {hasExplicitAllUnits ? 'All Units' : 'Current Unit'}</span>
						</div>
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* VIEW 2: SHIFT ROSTER & COVERAGE MATRIX                                     */}
			{/* ========================================================================= */}
			{viewMode === 'ROSTER' && (
				<div className="space-y-6">
					{/* Department Shift Coverage Bar */}
					<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<ShieldCheck className="h-5 w-5 text-indigo-600" />
								<h3 className="text-sm font-bold text-slate-900">
									Departmental Shift Coverage Audit ({selectedDate})
								</h3>
							</div>
							<span className="text-xs text-slate-500">Target Minimum: 80% Shift Coverage</span>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
							{departmentCoverage.map((d) => (
								<div key={d.department} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
									<div className="flex items-center justify-between text-xs font-semibold text-slate-700">
										<span className="truncate pr-1">{d.department}</span>
										<span className={d.percentage >= 80 ? 'text-emerald-700' : 'text-amber-700'}>
											{d.percentage}%
										</span>
									</div>
									<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
										<div
											className={`h-full rounded-full transition-all ${
												d.percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
											}`}
											style={{ width: `${d.percentage}%` }}
										/>
									</div>
									<div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
										<span>{d.present} on duty</span>
										<span>{d.total} total staff</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* 4-Column Shift Roster Buckets */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
						{SHIFT_BUCKETS.map((bucket) => {
							const assigned = shiftDistribution[bucket.id] || []
							return (
								<div
									key={bucket.id}
									className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col"
								>
									<div className="flex items-center justify-between border-b border-slate-100 pb-3">
										<div>
											<h4 className="text-sm font-bold text-slate-900">{bucket.label}</h4>
											<span className="text-xs text-slate-500 font-mono">{bucket.timing}</span>
										</div>
										<span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${bucket.color}`}>
											{assigned.length}
										</span>
									</div>

									<div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[360px]">
										{assigned.length === 0 ? (
											<div className="py-8 text-center text-xs text-slate-400">
												No staff scheduled for this shift.
											</div>
										) : (
											assigned.map(({ staff, status }) => {
												const isPres = status === 'PRESENT'
												const isAbs = status === 'ABSENT'
												const isLeave = status === 'ON_LEAVE'
												return (
													<div
														key={staff.id}
														className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 flex items-center justify-between text-xs"
													>
														<div>
															<div className="font-semibold text-slate-900">{staff.name}</div>
															<div className="text-[11px] text-slate-500">
																{staff.role} · {staff.department}
															</div>
														</div>
														<span
															className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
																isPres
																	? 'bg-emerald-100 text-emerald-800'
																	: isAbs
																	? 'bg-rose-100 text-rose-800'
																	: isLeave
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-slate-200 text-slate-700'
															}`}
														>
															{status}
														</span>
													</div>
												)
											})
										)}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{/* Record Attendance Modal */}
			{isRecordModalOpen && (
				<RecordAttendanceModal
					staffList={staffList}
					initialDate={selectedDate}
					isOpen={isRecordModalOpen}
					onClose={() => setIsRecordModalOpen(false)}
					onSuccess={() => {
						handleRefresh()
						setActionSuccess('Staff attendance record saved and synchronized successfully!')
					}}
				/>
			)}
		</div>
	)
}
