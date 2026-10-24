export type StaffStatus = 'Working' | 'On Leave' | 'Resigned' | 'Terminated' | string

export type StaffMember = {
	id: string
	empId: string
	name: string
	firstName?: string
	lastName?: string
	photoUrl?: string
	role: string
	designation?: string
	department: string
	unitId: string
	phone: string
	email: string
	joiningDate: string
	status: StaffStatus
	isDeleted: boolean
	deletedAt?: string
	skills?: string[]
	performanceScore?: number
	workload?: number
	shiftStart?: string | null
	shiftEnd?: string | null
	user?: {
		id: string
		role?: string
		isActive?: boolean
	} | null
	metadata?: Record<string, unknown>
}

export type CreateStaffPayload = {
	empId?: string
	name: string
	role: string
	department: string
	phone?: string
	email?: string
	unitId?: string
	status?: string
	joiningDate?: string
	photoUrl?: string
	userId?: string
	metadata?: Record<string, unknown>
}

export type AttendanceRecord = {
	id: string
	staffId?: string
	date: string
	empId: string
	name: string
	checkIn: string
	checkOut: string
	status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | string
	notes?: string
}

export type LeaveRequestItem = {
	id: string
	staffId: string
	staffName?: string
	empId?: string
	department?: string
	leaveType: string
	fromDate: string
	toDate: string
	reason?: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
	remarks?: string
	reviewedBy?: string
	reviewedAt?: string
	createdAt?: string
	staff?: {
		id: string
		empId: string
		firstName: string
		lastName?: string
		department?: string
		designation?: string
	}
}

export type PayrollPreviewItem = {
	id: string
	staffId: string
	empId: string
	name: string
	role: string
	department: string
	month: string
	workingDays: number
	presentDays: number
	approvedLeaveDays: number
	absentDays: number
	baseSalary: number
	fixedAllowance: number
	fixedDeduction: number
	grossPay: number
	deductions: number
	netPay: number
	status: string
	processedAt?: string | null
	processedBy?: string | null
}

export type CandidateItem = {
	id: string
	name: string
	phone?: string
	email?: string
	designationApplied?: string
	department?: string
	status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'PLACED' | 'REJECTED' | string
	rating?: number
	expectedSalary?: number
	experienceYears?: number
	resumeUrl?: string
	createdAt?: string
}

export type OperationalTask = {
	id: string
	refNo: string
	title: string
	description?: string
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string
	status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string
	type?: string
	dueDate?: string | null
	assigneeId?: string | null
	assignedStaffId?: string | null
	assignedStaff?: {
		id: string
		empId: string
		firstName: string
		lastName?: string
		designation?: string
	} | null
	completedAt?: string | null
	unitId: string
	createdAt: string
	updatedAt: string
}

export type CreateTaskPayload = {
	title: string
	description?: string
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
	dueDate?: string
	assignedStaffId?: string
	assigneeId?: string
	unitId?: string
	type?: string
}

export type MaintenanceTicket = {
	id: string
	ticketNumber?: string | null
	refNo?: string | null
	type: string
	category?: string
	description?: string
	status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | string
	priority?: string
	vehicleId?: string | null
	resolvedBy?: string | null
	unitId: string
	createdAt: string
	updatedAt: string
}

export type CreateMaintenancePayload = {
	type: string
	description?: string
	priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
	vendorName?: string
	location?: string
	unitId?: string
	vehicleId?: string
}

export type RecordAttendancePayload = {
	staffId: string
	date: string
	checkIn?: string
	checkOut?: string
	status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | string
	notes?: string
}

export type CreateLeaveRequestPayload = {
	staffId: string
	leaveType: string
	fromDate: string
	toDate: string
	reason?: string
}

export type CreateCandidatePayload = {
	name: string
	mobileNo: string
	email?: string
	preferredRole?: string
	department?: string
	stage?: string
	experienceYears?: number
	expectedSalary?: number
}

export type UpdateCandidatePayload = {
	stage?: string
	status?: string
	isPlaced?: boolean
	rating?: number
}

export type UpdateTaskWithDetailsPayload = {
	status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
	remarks?: string
	completedAt?: string
}

export type ResolveMaintenancePayload = {
	status: 'RESOLVED'
	resolvedBy?: string
	resolutionNotes?: string
	cost?: number
	partsReplaced?: string
}

export type HrOverviewMetrics = {
	totalStaff: number
	activeStaffCount: number
	onDutyTodayCount: number
	pendingLeaveCount: number
	openTasksCount: number
	pendingMaintenanceCount: number
}

