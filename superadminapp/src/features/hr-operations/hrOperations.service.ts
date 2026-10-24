import { api } from '../../services/api'
import type {
	AttendanceRecord,
	CandidateItem,
	CreateCandidatePayload,
	CreateLeaveRequestPayload,
	CreateMaintenancePayload,
	CreateStaffPayload,
	CreateTaskPayload,
	LeaveRequestItem,
	MaintenanceTicket,
	OperationalTask,
	PayrollPreviewItem,
	RecordAttendancePayload,
	ResolveMaintenancePayload,
	StaffMember,
	UpdateCandidatePayload,
	UpdateTaskWithDetailsPayload,
} from './hrOperations.types'

const safeFormatDate = (val: unknown): string => {
	if (!val) return ''
	try {
		const d = new Date(String(val))
		return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
	} catch {
		return ''
	}
}

const mapStaff = (raw: unknown): StaffMember => {
	const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	const user = s.user && typeof s.user === 'object' ? (s.user as Record<string, unknown>) : null
	const metadata = s.metadata && typeof s.metadata === 'object' ? (s.metadata as Record<string, unknown>) : undefined

	return {
		id: String(s.id || ''),
		empId: String(s.empId || ''),
		name: `${String(s.firstName || '')} ${String(s.lastName || '')}`.trim() || 'Staff Member',
		firstName: String(s.firstName || ''),
		lastName: s.lastName ? String(s.lastName) : undefined,
		photoUrl: s.photoUrl ? String(s.photoUrl) : undefined,
		role: String(s.designation || 'Staff'),
		designation: s.designation ? String(s.designation) : undefined,
		department: String(s.department || 'General'),
		unitId: String(s.unitId || ''),
		phone: String(s.phone || ''),
		email: String(s.email || ''),
		joiningDate: safeFormatDate(s.joiningDate) || safeFormatDate(s.createdAt) || '',
		status: String(s.status || 'Working'),
		isDeleted: Boolean(s.isDeleted),
		deletedAt: s.deletedAt ? String(s.deletedAt) : undefined,
		performanceScore: typeof s.performanceScore === 'number' ? s.performanceScore : 50,
		workload: typeof s.workload === 'number' ? s.workload : 0,
		shiftStart: s.shiftStart ? String(s.shiftStart) : null,
		shiftEnd: s.shiftEnd ? String(s.shiftEnd) : null,
		user: user
			? {
					id: String(user.id || ''),
					role: user.role ? String(user.role) : undefined,
					isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
				}
			: null,
		metadata,
	}
}

const mapTask = (raw: unknown): OperationalTask => {
	const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	const staff =
		t.assignedStaff && typeof t.assignedStaff === 'object'
			? (t.assignedStaff as Record<string, unknown>)
			: null

	return {
		id: String(t.id || ''),
		refNo: String(t.refNo || 'TASK'),
		title: String(t.title || 'Untitled Task'),
		description: t.description ? String(t.description) : '',
		priority: (String(t.priority || 'MEDIUM') as OperationalTask['priority']),
		status: (String(t.status || 'ASSIGNED') as OperationalTask['status']),
		type: t.type ? String(t.type) : 'DAILY',
		dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : null,
		assigneeId: t.assigneeId ? String(t.assigneeId) : null,
		assignedStaffId: t.assignedStaffId ? String(t.assignedStaffId) : null,
		assignedStaff: staff
			? {
					id: String(staff.id || ''),
					empId: String(staff.empId || ''),
					firstName: String(staff.firstName || ''),
					lastName: staff.lastName ? String(staff.lastName) : undefined,
					designation: staff.designation ? String(staff.designation) : undefined,
				}
			: null,
		completedAt: t.completedAt ? String(t.completedAt) : null,
		unitId: String(t.unitId || ''),
		createdAt: String(t.createdAt || new Date().toISOString()),
		updatedAt: String(t.updatedAt || new Date().toISOString()),
	}
}

const mapMaintenance = (raw: unknown): MaintenanceTicket => {
	const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	const att = (m.attachments && typeof m.attachments === 'object' ? m.attachments : {}) as Record<string, unknown>
	return {
		id: String(m.id || ''),
		type: String(m.type || 'General Maintenance'),
		category: m.category ? String(m.category) : undefined,
		description: m.description ? String(m.description) : '',
		status: (String(m.status || 'PENDING') as MaintenanceTicket['status']),
		priority: String(att.priority || m.priority || 'MEDIUM'),
		vehicleId: m.vehicleId ? String(m.vehicleId) : null,
		resolvedBy: m.resolvedBy ? String(m.resolvedBy) : null,
		unitId: String(m.unitId || ''),
		createdAt: String(m.createdAt || new Date().toISOString()),
		updatedAt: String(m.updatedAt || new Date().toISOString()),
	}
}

export const hrOperationsService = {
	// ==========================================
	// 1. STAFF MANAGEMENT (/hr)
	// ==========================================
	getStaffList: async (options?: {
		includeFormer?: boolean
		scope?: 'all'
		unitId?: string | null
	}): Promise<StaffMember[]> => {
		const params: Record<string, string | boolean> = {}
		if (options?.includeFormer) params.includeFormer = true
		if (options?.scope === 'all') params.scope = 'all'

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		try {
			const res = await api.get('/hr/staff', { params, headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map(mapStaff)
		} catch {
			return []
		}
	},

	createStaff: async (data: CreateStaffPayload): Promise<StaffMember> => {
		const [firstName, ...lastNames] = data.name.trim().split(' ')
		const payload = {
			empId: data.empId || undefined,
			firstName,
			lastName: lastNames.length > 0 ? lastNames.join(' ') : undefined,
			designation: data.role || undefined,
			department: data.department || undefined,
			email: data.email || undefined,
			phone: data.phone || undefined,
			unitId: data.unitId || undefined,
			status: data.status || 'Working',
			joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
			photoUrl: data.photoUrl || undefined,
			metadata: data.metadata || {},
		}
		const res = await api.post('/hr/staff', payload)
		return mapStaff(res.data?.data)
	},

	updateStaff: async (
		id: string,
		data: Partial<CreateStaffPayload>,
	): Promise<StaffMember> => {
		const payload: Record<string, unknown> = { ...data }
		if (data.name) {
			const [firstName, ...lastNames] = data.name.trim().split(' ')
			payload.firstName = firstName
			payload.lastName = lastNames.length > 0 ? lastNames.join(' ') : undefined
			delete payload.name
		}
		const res = await api.put(`/hr/staff/${id}`, payload)
		return mapStaff(res.data?.data)
	},

	deleteStaff: async (id: string): Promise<void> => {
		await api.delete(`/hr/staff/${id}`)
	},

	// ==========================================
	// 2. ATTENDANCE & LEAVE (/hr)
	// ==========================================
	getAttendanceLogs: async (options?: {
		date?: string
		scope?: 'all'
	}): Promise<AttendanceRecord[]> => {
		const params: Record<string, string> = {}
		if (options?.date) params.date = options.date
		if (options?.scope === 'all') params.scope = 'all'

		try {
			const res = await api.get('/hr/attendance', { params })
			return (res.data?.data || []) as AttendanceRecord[]
		} catch {
			return []
		}
	},

	recordAttendance: async (data: RecordAttendancePayload): Promise<AttendanceRecord> => {
		const res = await api.post('/hr/attendance', data)
		return res.data?.data as AttendanceRecord
	},


	getLeaveRequests: async (options?: {
		scope?: 'all'
	}): Promise<LeaveRequestItem[]> => {
		const params: Record<string, string> = {}
		if (options?.scope === 'all') params.scope = 'all'

		try {
			const res = await api.get('/hr/leave-requests', { params })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map((item: Record<string, unknown>) => {
				const staff = item.staff && typeof item.staff === 'object' ? (item.staff as Record<string, unknown>) : null
				return {
					id: String(item.id || ''),
					staffId: String(item.staffId || ''),
					staffName: staff ? `${String(staff.firstName || '')} ${String(staff.lastName || '')}`.trim() : 'Staff Member',
					empId: staff ? String(staff.empId || '') : '',
					department: staff ? String(staff.department || 'General') : 'General',
					leaveType: String(item.leaveType || 'Casual Leave'),
					fromDate: item.fromDate ? String(item.fromDate).slice(0, 10) : '',
					toDate: item.toDate ? String(item.toDate).slice(0, 10) : '',
					reason: item.reason ? String(item.reason) : '',
					status: String(item.status || 'PENDING'),
					remarks: item.remarks ? String(item.remarks) : '',
					reviewedBy: item.reviewedBy ? String(item.reviewedBy) : undefined,
					reviewedAt: item.reviewedAt ? String(item.reviewedAt) : undefined,
					createdAt: item.createdAt ? String(item.createdAt).slice(0, 10) : undefined,
				}
			})
		} catch {
			return []
		}
	},

	updateLeaveRequestStatus: async (
		id: string,
		data: { status: 'APPROVED' | 'REJECTED'; remarks?: string },
	): Promise<LeaveRequestItem> => {
		const res = await api.patch(`/hr/leave-requests/${id}`, data)
		return res.data?.data as LeaveRequestItem
	},

	createLeaveRequest: async (data: CreateLeaveRequestPayload): Promise<LeaveRequestItem> => {
		const res = await api.post('/hr/leave-requests', data)
		return res.data?.data as LeaveRequestItem
	},

	// ==========================================
	// 3. PAYROLL & RECRUITMENT (/hr)
	// ==========================================
	getPayrollPreview: async (options?: {
		month?: string
		scope?: 'all'
	}): Promise<PayrollPreviewItem[]> => {
		const params: Record<string, string> = {}
		if (options?.month) params.month = options.month
		if (options?.scope === 'all') params.scope = 'all'

		try {
			const res = await api.get('/hr/payroll', { params })
			return (res.data?.data || []) as PayrollPreviewItem[]
		} catch {
			return []
		}
	},

	processPayroll: async (data: {
		staffId: string
		month: string
	}): Promise<Record<string, unknown>> => {
		const res = await api.post('/hr/payroll/process', data)
		return (res.data?.data || {}) as Record<string, unknown>
	},

	getCandidates: async (): Promise<CandidateItem[]> => {
		try {
			const res = await api.get('/hr/candidates')
			return (res.data?.data || []) as CandidateItem[]
		} catch {
			return []
		}
	},

	getRoles: async (): Promise<Array<{ id: string; name: string }>> => {
		try {
			const res = await api.get('/hr/roles')
			return (res.data?.data || []) as Array<{ id: string; name: string }>
		} catch {
			return []
		}
	},

	// ==========================================
	// 4. OPERATIONAL TASKS & MAINTENANCE (/tasks, /operations)
	// ==========================================
	getTasks: async (options?: {
		scope?: 'all'
		unitId?: string | null
	}): Promise<OperationalTask[]> => {
		const params: Record<string, string> = {}
		if (options?.scope === 'all') params.scope = 'all'

		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		try {
			const res = await api.get('/tasks', { params, headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map(mapTask)
		} catch {
			return []
		}
	},

	createTask: async (payload: CreateTaskPayload): Promise<OperationalTask> => {
		const res = await api.post('/tasks', payload)
		return mapTask(res.data?.data)
	},

	updateTaskStatus: async (
		id: string,
		status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
	): Promise<OperationalTask> => {
		const res = await api.patch(`/tasks/${id}/status`, { status })
		return mapTask(res.data?.data)
	},

	updateTaskWithDetails: async (
		id: string,
		data: UpdateTaskWithDetailsPayload,
	): Promise<OperationalTask> => {
		const res = await api.patch(`/tasks/${id}/status`, data)
		return mapTask(res.data?.data)
	},

	createCandidate: async (data: CreateCandidatePayload): Promise<CandidateItem> => {
		const res = await api.post('/hr/candidates', data)
		return (res.data?.data || {}) as CandidateItem
	},

	updateCandidate: async (id: string, data: UpdateCandidatePayload): Promise<CandidateItem> => {
		const res = await api.patch(`/hr/candidates/${id}`, data)
		return (res.data?.data || {}) as CandidateItem
	},

	getMaintenanceTickets: async (options?: {
		unitId?: string | null
	}): Promise<MaintenanceTicket[]> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}

		try {
			const res = await api.get('/operations/maintenance', { headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map(mapMaintenance)
		} catch {
			return []
		}
	},

	createMaintenanceTicket: async (
		payload: CreateMaintenancePayload,
	): Promise<MaintenanceTicket> => {
		const res = await api.post('/operations/maintenance', {
			type: payload.type,
			description: payload.description,
			unitId: payload.unitId,
			vehicleId: payload.vehicleId,
			attachments: {
				priority: payload.priority || 'MEDIUM',
				vendorName: payload.vendorName || null,
				location: payload.location || null,
			},
		})
		return mapMaintenance(res.data?.data)
	},

	updateMaintenanceStatus: async (
		id: string,
		status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED',
	): Promise<MaintenanceTicket> => {
		const res = await api.patch(`/operations/maintenance/${id}`, { status })
		return mapMaintenance(res.data?.data)
	},

	resolveMaintenance: async (
		id: string,
		data: ResolveMaintenancePayload,
	): Promise<MaintenanceTicket> => {
		const res = await api.patch(`/operations/maintenance/${id}`, {
			status: 'RESOLVED',
			resolvedBy: data.resolvedBy,
			description: data.resolutionNotes,
			attachments: {
				resolutionNotes: data.resolutionNotes,
				cost: data.cost,
				partsReplaced: data.partsReplaced,
			},
		})
		return mapMaintenance(res.data?.data)
	},
}

