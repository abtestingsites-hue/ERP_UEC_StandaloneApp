import { useEffect, useState, useMemo } from 'react'
import {
	Users,
	UserCheck,
	CalendarDays,
	FileCheck2,
	Calculator,
	CheckSquare,
	Wrench,
	RefreshCw,
	Building2,
	Plus,
	CheckCircle2,
	X,
	ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { useActiveUnit } from '../../context/useActiveUnit'
import { hrOperationsService } from './hrOperations.service'
import type {
	AttendanceRecord,
	LeaveRequestItem,
	MaintenanceTicket,
	OperationalTask,
	StaffMember,
} from './hrOperations.types'

import { HrOverviewTab } from './tabs/HrOverviewTab'
import { StaffDirectoryTab } from './tabs/StaffDirectoryTab'
import { AttendanceRosterTab } from './tabs/AttendanceRosterTab'
import { LeaveGovernanceTab } from './tabs/LeaveGovernanceTab'
import { RecruitmentPayrollTab } from './tabs/RecruitmentPayrollTab'
import { TasksRegisterTab } from './tabs/TasksRegisterTab'
import { FacilityMaintenanceTab } from './tabs/FacilityMaintenanceTab'
import { ClientPortalAccessTab } from './tabs/ClientPortalAccessTab'

import { AddStaffModal } from './components/AddStaffModal'
import { CreateTaskModal } from './components/CreateTaskModal'
import { LogMaintenanceModal } from './components/LogMaintenanceModal'

export type HrOperationsPerspective = 'HR_WORKFORCE' | 'FACILITY_OPERATIONS'

export function HrOperationsWorkspace() {
	const { activeUnitName, activeUnitId, hasExplicitAllUnits } = useActiveUnit()

	// Perspective and tab selection
	const [perspective, setPerspective] = useState<HrOperationsPerspective>('HR_WORKFORCE')
	const [activeTab, setActiveTab] = useState<string>('overview')

	// Shared data collections
	const [staffList, setStaffList] = useState<StaffMember[]>([])
	const [tasks, setTasks] = useState<OperationalTask[]>([])
	const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([])
	const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([])
	const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	// Quick action modals
	const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
	const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
	const [isLogMaintenanceOpen, setIsLogMaintenanceOpen] = useState(false)
	const [actionSuccess, setActionSuccess] = useState<string | null>(null)

	useEffect(() => {
		if (actionSuccess) {
			const timer = setTimeout(() => setActionSuccess(null), 5000)
			return () => clearTimeout(timer)
		}
	}, [actionSuccess])

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			try {
				const [staffRes, tasksRes, maintRes, leavesRes, attRes] = await Promise.all([
					hrOperationsService.getStaffList({
						scope: hasExplicitAllUnits ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					hrOperationsService.getTasks({
						scope: hasExplicitAllUnits ? 'all' : undefined,
						unitId: activeUnitId,
					}),
					hrOperationsService.getMaintenanceTickets({
						unitId: activeUnitId,
					}),
					hrOperationsService.getLeaveRequests({
						scope: hasExplicitAllUnits ? 'all' : undefined,
					}),
					hrOperationsService.getAttendanceLogs({
						scope: hasExplicitAllUnits ? 'all' : undefined,
					}),
				])

				if (isMounted) {
					setStaffList(staffRes)
					setTasks(tasksRes)
					setMaintenanceTickets(maintRes)
					setLeaveRequests(leavesRes)
					setAttendanceRecords(attRes)
					setIsLoading(false)
				}
			} catch (err: unknown) {
				const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
				if (isMounted) {
					setLoadError(
						axiosError.response?.data?.message ||
							axiosError.message ||
							'Failed to synchronize HR & Operations data',
					)
					setIsLoading(false)
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [activeUnitId, hasExplicitAllUnits, refreshTrigger])

	const handleRefresh = () => {
		setIsLoading(true)
		setRefreshTrigger((prev) => prev + 1)
	}

	// Dynamic tab items based on perspective
	const tabs = useMemo(() => {
		if (perspective === 'HR_WORKFORCE') {
			return [
				{ id: 'overview', label: 'Workforce Overview', icon: Users },
				{ id: 'directory', label: 'Staff Directory', icon: UserCheck, count: staffList.length },
				{ id: 'client_access', label: 'Client Portal Access', icon: ShieldCheck },
				{ id: 'attendance', label: 'Attendance & Roster', icon: CalendarDays },
				{
					id: 'leaves',
					label: 'Leave Governance',
					icon: FileCheck2,
					count: leaveRequests.filter((l) => l.status.toUpperCase() === 'PENDING').length,
				},
				{ id: 'payroll_recruitment', label: 'Payroll & Recruitment', icon: Calculator },
			]
		}
		return [
			{
				id: 'tasks',
				label: 'Operational Tasks',
				icon: CheckSquare,
				count: tasks.filter((t) => t.status.toUpperCase() !== 'COMPLETED').length,
			},
			{
				id: 'maintenance',
				label: 'Facility Maintenance',
				icon: Wrench,
				count: maintenanceTickets.filter((m) => m.status.toUpperCase() !== 'RESOLVED').length,
			},
		]
	}, [perspective, staffList.length, leaveRequests, tasks, maintenanceTickets])

	// Automatically adjust active tab when switching perspectives
	const handlePerspectiveChange = (newPerspective: HrOperationsPerspective) => {
		setPerspective(newPerspective)
		if (newPerspective === 'HR_WORKFORCE') {
			setActiveTab('overview')
		} else {
			setActiveTab('tasks')
		}
	}

	return (
		<div className="space-y-6">
			{/* Top Bar Header */}
			<PageHeader
				eyebrow="DOMAIN INTEGRATION — PHASE 11"
				title="HR & Operations Command Center"
				description="Unified human resources directory, rosters, leave governance, operational staff tasks, and facility maintenance tickets."
				action={
					<div className="flex flex-wrap items-center gap-2">
						<div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
							<Building2 className="h-4 w-4 text-indigo-600" />
							<span>{activeUnitName}</span>
						</div>

						<button
							type="button"
							onClick={handleRefresh}
							disabled={isLoading}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
						>
							<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
							<span>Sync</span>
						</button>

						{perspective === 'HR_WORKFORCE' ? (
							<button
								type="button"
								onClick={() => setIsAddStaffOpen(true)}
								className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
							>
								<Plus className="h-3.5 w-3.5" />
								<span>Onboard Staff</span>
							</button>
						) : (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setIsCreateTaskOpen(true)}
									className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
								>
									<Plus className="h-3.5 w-3.5" />
									<span>New Task</span>
								</button>
								<button
									type="button"
									onClick={() => setIsLogMaintenanceOpen(true)}
									className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
								>
									<Wrench className="h-3.5 w-3.5 text-slate-500" />
									<span>Log Maintenance</span>
								</button>
							</div>
						)}
					</div>
				}
			/>

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

			{loadError && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
					<div className="font-semibold">Data Synchronization Warning</div>
					<div className="mt-1">{loadError}</div>
				</div>
			)}

			{/* Perspective Switcher */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
				<div className="flex items-center rounded-xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
					<button
						type="button"
						onClick={() => handlePerspectiveChange('HR_WORKFORCE')}
						className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
							perspective === 'HR_WORKFORCE'
								? 'bg-white font-semibold text-indigo-600 shadow-sm'
								: 'hover:text-slate-900'
						}`}
					>
						<Users className="h-4 w-4" />
						<span>Human Resources & Workforce</span>
					</button>

					<button
						type="button"
						onClick={() => handlePerspectiveChange('FACILITY_OPERATIONS')}
						className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
							perspective === 'FACILITY_OPERATIONS'
								? 'bg-white font-semibold text-indigo-600 shadow-sm'
								: 'hover:text-slate-900'
						}`}
					>
						<CheckSquare className="h-4 w-4" />
						<span>Facility Operations & Tasks</span>
					</button>
				</div>

				<div className="text-xs text-slate-400">
					Active View: {perspective === 'HR_WORKFORCE' ? 'Staff Directory & Governance' : 'Operations & Facilities'}
				</div>
			</div>

			{/* Tabs Ribbon */}
			<div className="flex space-x-1 border-b border-slate-200">
				{tabs.map((tab) => {
					const Icon = tab.icon
					const isActive = activeTab === tab.id
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
								isActive
									? 'border-indigo-600 text-indigo-600'
									: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
							}`}
						>
							<Icon className="h-4 w-4" />
							<span>{tab.label}</span>
							{typeof tab.count === 'number' && (
								<span
									className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
										isActive
											? 'bg-indigo-100 text-indigo-700'
											: 'bg-slate-100 text-slate-600'
									}`}
								>
									{tab.count}
								</span>
							)}
						</button>
					)
				})}
			</div>

			{/* Tab Contents */}
			<div>
				{/* HR & Workforce Perspective */}
				{perspective === 'HR_WORKFORCE' && activeTab === 'overview' && (
					<HrOverviewTab
						staffList={staffList}
						tasks={tasks}
						maintenanceTickets={maintenanceTickets}
						leaveRequests={leaveRequests}
						attendanceRecords={attendanceRecords}
						isLoading={isLoading}
						onNavigate={(tabKey: string) => {
							if (tabKey === 'tasks' || tabKey === 'maintenance') {
								setPerspective('FACILITY_OPERATIONS')
								setActiveTab(tabKey)
							} else {
								setActiveTab(tabKey)
							}
						}}
					/>
				)}

				{perspective === 'HR_WORKFORCE' && activeTab === 'directory' && (
					<StaffDirectoryTab
						staffList={staffList}
						isLoading={isLoading}
						onRefresh={handleRefresh}
					/>
				)}

				{perspective === 'HR_WORKFORCE' && activeTab === 'client_access' && (
					<ClientPortalAccessTab
						activeUnitId={activeUnitId}
						activeUnitName={activeUnitName}
					/>
				)}

				{perspective === 'HR_WORKFORCE' && activeTab === 'attendance' && (
					<AttendanceRosterTab
						hasExplicitAllUnits={hasExplicitAllUnits}
						staffList={staffList}
					/>
				)}

				{perspective === 'HR_WORKFORCE' && activeTab === 'leaves' && (
					<LeaveGovernanceTab
						hasExplicitAllUnits={hasExplicitAllUnits}
						staffList={staffList}
					/>
				)}

				{perspective === 'HR_WORKFORCE' && activeTab === 'payroll_recruitment' && (
					<RecruitmentPayrollTab hasExplicitAllUnits={hasExplicitAllUnits} />
				)}

				{/* Facility Operations Perspective */}
				{perspective === 'FACILITY_OPERATIONS' && activeTab === 'tasks' && (
					<TasksRegisterTab
						staffList={staffList}
						activeUnitId={activeUnitId}
						hasExplicitAllUnits={hasExplicitAllUnits}
					/>
				)}

				{perspective === 'FACILITY_OPERATIONS' && activeTab === 'maintenance' && (
					<FacilityMaintenanceTab activeUnitId={activeUnitId} />
				)}
			</div>

			{/* Top-Level Quick Action Modals */}
			<AddStaffModal
				isOpen={isAddStaffOpen}
				onClose={() => setIsAddStaffOpen(false)}
				onCreated={() => {
					handleRefresh()
					setActionSuccess('Staff member onboarded successfully into the organization directory!')
				}}
				activeUnitId={activeUnitId}
			/>

			<CreateTaskModal
				isOpen={isCreateTaskOpen}
				onClose={() => setIsCreateTaskOpen(false)}
				onCreated={() => {
					handleRefresh()
					setActionSuccess('Operational task dispatched and assigned successfully!')
				}}
				staffList={staffList}
				activeUnitId={activeUnitId}
			/>

			<LogMaintenanceModal
				isOpen={isLogMaintenanceOpen}
				onClose={() => setIsLogMaintenanceOpen(false)}
				onCreated={() => {
					handleRefresh()
					setActionSuccess('Facility maintenance ticket logged successfully!')
				}}
				activeUnitId={activeUnitId}
			/>
		</div>
	)
}
export default HrOperationsWorkspace
