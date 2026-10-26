import { api } from './api'

export interface UserProfile {
	empId: string
	name: string
	role: string
	department: string
	unitId: string
	phone: string
	email: string
	joiningDate: string
	sessionUser?: {
		id: string
		role?: string
		unitId?: string
	}
}

export interface PersonalAttendanceLog {
	id: string
	date: string
	checkIn: string | null
	checkOut: string | null
	hoursWorked: number | null
	status: string
	note?: string | null
}

export interface PersonalLeaveRequest {
	id: string
	leaveType: string
	fromDate: string
	toDate: string
	reason: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED'
	remarks?: string
	createdAt?: string
}

export interface CreateLeaveRequestPayload {
	leaveType: string
	fromDate: string
	toDate: string
	reason?: string
}

export const profileService = {
	getProfile: async (): Promise<UserProfile> => {
		const res = await api.get('/profile/me')
		return res.data?.data as UserProfile
	},

	updateProfile: async (payload: { phone: string }): Promise<UserProfile> => {
		const res = await api.patch('/profile/me', payload)
		return res.data?.data as UserProfile
	},

	getMyAttendanceLogs: async (date?: string): Promise<{ logs: PersonalAttendanceLog[]; isStaffLinked: boolean; error?: string }> => {
		try {
			const params: Record<string, string> = {}
			if (date) params.date = date
			const res = await api.get('/hr/my-attendance', { params })
			const rawList = Array.isArray(res.data?.data) ? res.data.data : []
			const logs = rawList.map((item: Record<string, unknown>) => ({
				id: String(item.id || item.date || Math.random()),
				date: String(item.date || '').slice(0, 10),
				checkIn: item.checkIn ? String(item.checkIn) : null,
				checkOut: item.checkOut ? String(item.checkOut) : null,
				hoursWorked: typeof item.hoursWorked === 'number' ? item.hoursWorked : null,
				status: String(item.status || 'PRESENT'),
				note: item.note ? String(item.note) : null,
			}))
			const isStaffLinked = res.data?.meta?.isStaffLinked !== undefined
				? Boolean(res.data.meta.isStaffLinked)
				: true
			return { logs, isStaffLinked }
		} catch (err: unknown) {
			const errorObj = err as { response?: { status?: number; data?: { message?: string } } }
			const isNotLinked = errorObj.response?.status === 404 || errorObj.response?.data?.message?.includes('No staff profile')
			return {
				logs: [],
				isStaffLinked: !isNotLinked,
				error: errorObj.response?.data?.message || 'Failed to load attendance logs',
			}
		}
	},

	markAttendance: async (action: 'CHECK_IN' | 'CHECK_OUT', note?: string): Promise<{ success: boolean; message: string; log?: PersonalAttendanceLog }> => {
		const res = await api.post('/hr/my-attendance', { action, note })
		return {
			success: true,
			message: res.data?.message || (action === 'CHECK_IN' ? 'Checked in successfully' : 'Checked out successfully'),
			log: res.data?.data as PersonalAttendanceLog,
		}
	},

	getMyLeaveRequests: async (): Promise<{ requests: PersonalLeaveRequest[]; isStaffLinked: boolean; error?: string }> => {
		try {
			const res = await api.get('/hr/my-leave-requests')
			const rawList = Array.isArray(res.data?.data) ? res.data.data : []
			const requests = rawList.map((item: Record<string, unknown>) => ({
				id: String(item.id || ''),
				leaveType: String(item.leaveType || 'Casual Leave'),
				fromDate: item.fromDate ? String(item.fromDate).slice(0, 10) : '',
				toDate: item.toDate ? String(item.toDate).slice(0, 10) : '',
				reason: item.reason ? String(item.reason) : '',
				status: (String(item.status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED'),
				remarks: item.remarks ? String(item.remarks) : '',
				createdAt: item.createdAt ? String(item.createdAt).slice(0, 10) : '',
			}))
			const isStaffLinked = res.data?.meta?.isStaffLinked !== undefined
				? Boolean(res.data.meta.isStaffLinked)
				: true
			return { requests, isStaffLinked }
		} catch (err: unknown) {
			const errorObj = err as { response?: { status?: number; data?: { message?: string } } }
			const isNotLinked = errorObj.response?.status === 404 || errorObj.response?.data?.message?.includes('No staff profile')
			return {
				requests: [],
				isStaffLinked: !isNotLinked,
				error: errorObj.response?.data?.message || 'Failed to load leave requests',
			}
		}
	},

	createLeaveRequest: async (payload: CreateLeaveRequestPayload): Promise<PersonalLeaveRequest> => {
		const res = await api.post('/hr/my-leave-requests', payload)
		return res.data?.data as PersonalLeaveRequest
	},
}
