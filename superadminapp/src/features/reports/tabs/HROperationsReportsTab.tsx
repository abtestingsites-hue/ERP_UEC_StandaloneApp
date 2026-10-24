import React, { useState, useMemo } from 'react'
import { Briefcase, UserCheck, CalendarDays, Wrench, DollarSign } from 'lucide-react'
import type {
	StaffMember,
	AttendanceRecord,
	LeaveRequestItem,
	MaintenanceTicket,
	PayrollPreviewItem,
} from '../../hr-operations/hrOperations.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'
import { formatMaintenanceTicketNumber } from '../../../utils/idFormatters'

interface HROperationsReportsTabProps {
	staffList: StaffMember[]
	attendance: AttendanceRecord[]
	leaves: LeaveRequestItem[]
	maintenance: MaintenanceTicket[]
	payrollPreview: PayrollPreviewItem[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const HROperationsReportsTab: React.FC<HROperationsReportsTabProps> = ({
	staffList,
	attendance,
	leaves,
	maintenance,
	payrollPreview,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'STAFF' | 'ATTENDANCE' | 'LEAVES' | 'MAINTENANCE' | 'PAYROLL'>('STAFF')

	// Filter staff
	const filteredStaff = useMemo(() => {
		if (!searchTerm.trim()) return staffList
		return staffList.filter((s) => {
			const name = s.name || ''
			const emp = s.empId || ''
			const dept = s.department || ''
			return (
				name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				emp.toLowerCase().includes(searchTerm.toLowerCase()) ||
				dept.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [staffList, searchTerm])

	// Filter attendance
	const filteredAttendance = useMemo(() => {
		if (!searchTerm.trim()) return attendance
		return attendance.filter((a) => {
			const name = a.name || a.empId || ''
			const stat = a.status || ''
			return name.toLowerCase().includes(searchTerm.toLowerCase()) || stat.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [attendance, searchTerm])

	// Filter leaves
	const filteredLeaves = useMemo(() => {
		if (!searchTerm.trim()) return leaves
		return leaves.filter((l) => {
			const name = l.staffName || ''
			const type = l.leaveType || ''
			const stat = l.status || ''
			return (
				name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				type.toLowerCase().includes(searchTerm.toLowerCase()) ||
				stat.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [leaves, searchTerm])

	// Filter maintenance
	const filteredMaintenance = useMemo(() => {
		if (!searchTerm.trim()) return maintenance
		return maintenance.filter((m) => {
			const desc = m.description || ''
			const cat = m.category || ''
			const tType = m.type || ''
			return (
				desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
				tType.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [maintenance, searchTerm])

	const handleExport = () => {
		if (activeSubView === 'STAFF') {
			exportToCsv(
				'HR_Staff_Roster_Report',
				[
					{ key: 'empId', label: 'Employee ID' },
					{ key: 'name', label: 'Full Name' },
					{ key: 'role', label: 'Designation' },
					{ key: 'department', label: 'Department' },
					{ key: 'status', label: 'Status' },
					{ key: 'joiningDate', label: 'Joining Date' },
				],
				filteredStaff as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'ATTENDANCE') {
			exportToCsv(
				'HR_Attendance_Report',
				[
					{ key: 'name', label: 'Staff' },
					{ key: 'date', label: 'Date' },
					{ key: 'status', label: 'Attendance Status' },
					{ key: 'checkIn', label: 'Check In' },
					{ key: 'checkOut', label: 'Check Out' },
				],
				filteredAttendance as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'LEAVES') {
			exportToCsv(
				'HR_Leave_Requests_Report',
				[
					{ key: 'staffName', label: 'Staff Name' },
					{ key: 'leaveType', label: 'Leave Type' },
					{ key: 'fromDate', label: 'From Date' },
					{ key: 'toDate', label: 'To Date' },
					{ key: 'status', label: 'Status' },
					{ key: 'reason', label: 'Reason' },
				],
				filteredLeaves as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'MAINTENANCE') {
			exportToCsv(
				'Operations_Maintenance_Report',
				[
					{ key: 'id', label: 'Ticket ID' },
					{ key: 'type', label: 'Type' },
					{ key: 'category', label: 'Category' },
					{ key: 'priority', label: 'Priority' },
					{ key: 'status', label: 'Status' },
				],
				filteredMaintenance as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'HR_Payroll_Preview_Report',
				[
					{ key: 'empId', label: 'Emp ID' },
					{ key: 'name', label: 'Employee' },
					{ key: 'grossPay', label: 'Gross Pay' },
					{ key: 'deductions', label: 'Deductions' },
					{ key: 'netPay', label: 'Net Pay' },
					{ key: 'status', label: 'Payroll Status' },
				],
				payrollPreview as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Active Staff Workforce"
					value={staffList.filter((s) => s.status === 'Working').length}
					subtitle={`${staffList.length} Total Registered Personnel`}
					icon={Briefcase}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Attendance Logged Today"
					value={attendance.length}
					subtitle={`${attendance.filter((a) => a.status === 'PRESENT').length} Present on Duty`}
					icon={UserCheck}
					accentColor="emerald"
				/>
				<ReportMetricCard
					title="Pending Leave Approvals"
					value={leaves.filter((l) => l.status === 'PENDING').length}
					subtitle={`${leaves.length} Total Requests Submitted`}
					icon={CalendarDays}
					accentColor="amber"
				/>
				<ReportMetricCard
					title="Facility Maintenance"
					value={maintenance.filter((m) => m.status === 'OPEN' || m.status === 'IN_PROGRESS').length}
					subtitle={`${maintenance.length} Total Logged Work Orders`}
					icon={Wrench}
					accentColor="indigo"
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
				searchPlaceholder="Search staff by name, empId, department, or maintenance ticket..."
			/>

			{/* Sub-view switcher */}
			<div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('STAFF')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'STAFF'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Staff Roster ({filteredStaff.length})
				</button>
				<button
					onClick={() => setActiveSubView('ATTENDANCE')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'ATTENDANCE'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Attendance Logs ({filteredAttendance.length})
				</button>
				<button
					onClick={() => setActiveSubView('LEAVES')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'LEAVES'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Leave Governance ({filteredLeaves.length})
				</button>
				<button
					onClick={() => setActiveSubView('MAINTENANCE')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'MAINTENANCE'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Maintenance Tickets ({filteredMaintenance.length})
				</button>
				<button
					onClick={() => setActiveSubView('PAYROLL')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'PAYROLL'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Payroll Preview (Read-Only)
				</button>
			</div>

			{/* Staff Table */}
			{activeSubView === 'STAFF' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredStaff.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No staff records found for this unit.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Employee ID</th>
										<th className="px-6 py-3">Staff Name</th>
										<th className="px-6 py-3">Designation / Role</th>
										<th className="px-6 py-3">Department</th>
										<th className="px-6 py-3">Joining Date</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredStaff.map((s) => (
										<tr key={s.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{s.empId || '—'}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">{s.name}</td>
											<td className="px-6 py-3.5 text-slate-600">{s.role || s.designation}</td>
											<td className="px-6 py-3.5 text-slate-600">{s.department || 'General'}</td>
											<td className="px-6 py-3.5 text-slate-500">{s.joiningDate || '—'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														s.status === 'Working'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: 'bg-slate-100 text-slate-700 border-slate-200'
													}`}
												>
													{s.status}
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

			{/* Attendance Table */}
			{activeSubView === 'ATTENDANCE' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredAttendance.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No attendance records found for this period.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Staff Name</th>
										<th className="px-6 py-3">Date</th>
										<th className="px-6 py-3">Check In</th>
										<th className="px-6 py-3">Check Out</th>
										<th className="px-6 py-3">Attendance Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredAttendance.map((a) => (
										<tr key={a.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{a.name || a.empId || 'Staff'}</td>
											<td className="px-6 py-3.5 text-slate-500">{a.date}</td>
											<td className="px-6 py-3.5 text-slate-600">{a.checkIn || '—'}</td>
											<td className="px-6 py-3.5 text-slate-600">{a.checkOut || 'On Duty'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														a.status === 'PRESENT'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: a.status === 'ABSENT'
																? 'bg-rose-50 text-rose-700 border-rose-200'
																: 'bg-amber-50 text-amber-700 border-amber-200'
													}`}
												>
													{a.status}
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

			{/* Leaves Table */}
			{activeSubView === 'LEAVES' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredLeaves.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No leave applications recorded.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Staff Name</th>
										<th className="px-6 py-3">Leave Type</th>
										<th className="px-6 py-3">Dates</th>
										<th className="px-6 py-3">Reason</th>
										<th className="px-6 py-3">Governance Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredLeaves.map((l) => (
										<tr key={l.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{l.staffName}</td>
											<td className="px-6 py-3.5 text-slate-600">{l.leaveType}</td>
											<td className="px-6 py-3.5 text-slate-500">
												{l.fromDate} to {l.toDate}
											</td>
											<td className="px-6 py-3.5 max-w-xs truncate text-slate-600">{l.reason || 'Personal'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														l.status === 'APPROVED'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: l.status === 'REJECTED'
																? 'bg-rose-50 text-rose-700 border-rose-200'
																: 'bg-amber-50 text-amber-700 border-amber-200'
													}`}
												>
													{l.status}
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

			{/* Maintenance Table */}
			{activeSubView === 'MAINTENANCE' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredMaintenance.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No maintenance tickets logged.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Ticket ID</th>
										<th className="px-6 py-3">Type</th>
										<th className="px-6 py-3">Description / Category</th>
										<th className="px-6 py-3">Priority</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredMaintenance.map((m) => (
										<tr key={m.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{formatMaintenanceTicketNumber(m.ticketNumber || m.refNo, m.id)}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">{m.type}</td>
											<td className="px-6 py-3.5 text-slate-600">{m.description || m.category || 'General'}</td>
											<td className="px-6 py-3.5 text-slate-700">{m.priority || 'NORMAL'}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
													{m.status}
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

			{/* Payroll Preview (Strictly Read-Only) */}
			{activeSubView === 'PAYROLL' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
					<div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
						<DollarSign className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
						<div>
							<h4 className="text-sm font-bold text-blue-900">Read-Only Payroll Overview</h4>
							<p className="text-xs text-blue-700 mt-0.5">
								Central Reports provides read-only transparency into current monthly payroll summaries. Central Reports strictly does not trigger payroll generation or bank disbursements.
							</p>
						</div>
					</div>

					{payrollPreview.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No payroll processing preview records found for this cycle.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Emp ID</th>
										<th className="px-6 py-3">Employee Name</th>
										<th className="px-6 py-3">Gross Compensation</th>
										<th className="px-6 py-3">Deductions</th>
										<th className="px-6 py-3">Net Disbursable</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{payrollPreview.map((item) => (
										<tr key={item.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{item.empId}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">{item.name}</td>
											<td className="px-6 py-3.5 text-slate-700">₹{item.grossPay.toLocaleString()}</td>
											<td className="px-6 py-3.5 text-rose-600">₹{item.deductions.toLocaleString()}</td>
											<td className="px-6 py-3.5 font-bold text-slate-900">₹{item.netPay.toLocaleString()}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
													{item.status}
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
