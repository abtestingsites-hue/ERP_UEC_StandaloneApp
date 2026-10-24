import { api } from '../../services/api'
import type {
	AmbulanceTrip,
	AmbulanceVehicle,
	CreateTripPayload,
	CreateVehiclePayload,
	VehicleStatus,
} from './ambulance.types'

const mapVehicle = (raw: unknown): AmbulanceVehicle => {
	const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	return {
		id: String(v.id || ''),
		vehicleNo: String(v.vehicleNo || ''),
		type: String(v.type || 'Standard Ambulance'),
		status: (String(v.status || 'AVAILABLE') as VehicleStatus),
		baseLocation: v.baseLocation ? String(v.baseLocation) : null,
		tenantId: String(v.tenantId || ''),
		unitId: String(v.unitId || ''),
		createdAt: String(v.createdAt || new Date().toISOString()),
		updatedAt: String(v.updatedAt || new Date().toISOString()),
	}
}

const mapTrip = (raw: unknown): AmbulanceTrip => {
	const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
	const vehicle = t.vehicle && typeof t.vehicle === 'object' ? mapVehicle(t.vehicle) : null

	const driver =
		t.driver && typeof t.driver === 'object'
			? (t.driver as Record<string, unknown>)
			: null

	const supportStaff =
		t.supportStaff && typeof t.supportStaff === 'object'
			? (t.supportStaff as Record<string, unknown>)
			: null

	const patient =
		t.patient && typeof t.patient === 'object'
			? (t.patient as Record<string, unknown>)
			: null

	return {
		id: String(t.id || ''),
		refNo: String(t.refNo || 'AMB-TRIP'),
		clientName: t.clientName ? String(t.clientName) : null,
		mobile: t.mobile ? String(t.mobile) : null,
		pickupLocation: t.pickupLocation ? String(t.pickupLocation) : null,
		destination: t.destination ? String(t.destination) : null,
		priority: t.priority ? String(t.priority) : 'NORMAL',
		status: (String(t.status || 'REQUESTED') as AmbulanceTrip['status']),
		dispatchTime: t.dispatchTime ? String(t.dispatchTime) : null,
		endTime: t.endTime ? String(t.endTime) : null,
		completionTime: t.endTime ? String(t.endTime) : null,
		kmStart: typeof t.kmStart === 'number' ? t.kmStart : null,
		kmEnd: typeof t.kmEnd === 'number' ? t.kmEnd : null,
		tripNotes: t.tripNotes ? String(t.tripNotes) : null,
		totalAmount: typeof t.totalAmount === 'number' ? t.totalAmount : null,
		vehicleId: t.vehicleId ? String(t.vehicleId) : null,
		driverId: t.driverId ? String(t.driverId) : null,
		supportStaffId: t.supportStaffId ? String(t.supportStaffId) : null,
		patientId: t.patientId ? String(t.patientId) : null,
		tenantId: String(t.tenantId || ''),
		unitId: String(t.unitId || ''),
		createdAt: String(t.createdAt || new Date().toISOString()),
		updatedAt: String(t.updatedAt || new Date().toISOString()),
		vehicle,
		driver: driver
			? {
					id: String(driver.id || ''),
					empId: driver.empId ? String(driver.empId) : undefined,
					firstName: driver.firstName ? String(driver.firstName) : undefined,
					lastName: driver.lastName ? String(driver.lastName) : undefined,
					name: driver.name
						? String(driver.name)
						: `${String(driver.firstName || '')} ${String(driver.lastName || '')}`.trim() ||
							'Driver',
					designation: driver.designation ? String(driver.designation) : undefined,
				}
			: null,
		supportStaff: supportStaff
			? {
					id: String(supportStaff.id || ''),
					empId: supportStaff.empId ? String(supportStaff.empId) : undefined,
					firstName: supportStaff.firstName ? String(supportStaff.firstName) : undefined,
					lastName: supportStaff.lastName ? String(supportStaff.lastName) : undefined,
					name: supportStaff.name
						? String(supportStaff.name)
						: `${String(supportStaff.firstName || '')} ${String(supportStaff.lastName || '')}`.trim() ||
							'Staff',
					designation: supportStaff.designation
						? String(supportStaff.designation)
						: undefined,
				}
			: null,
		patient: patient
			? {
					id: String(patient.id || ''),
					name: patient.name ? String(patient.name) : undefined,
					uhid: patient.uhid ? String(patient.uhid) : undefined,
					age: typeof patient.age === 'number' ? patient.age : undefined,
					gender: patient.gender ? String(patient.gender) : undefined,
				}
			: null,
	}
}

export const ambulanceService = {
	// ==========================================
	// 1. VEHICLE / FLEET ENDPOINTS
	// ==========================================
	getVehicles: async (options?: { unitId?: string | null; scope?: string }): Promise<AmbulanceVehicle[]> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		try {
			const res = await api.get('/ambulance/vehicles', { headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map(mapVehicle)
		} catch {
			return []
		}
	},

	getVehicleById: async (id: string): Promise<AmbulanceVehicle | null> => {
		try {
			const res = await api.get(`/ambulance/vehicles/${id}`)
			return res.data?.data ? mapVehicle(res.data.data) : null
		} catch {
			return null
		}
	},

	createVehicle: async (
		payload: CreateVehiclePayload,
		options?: { unitId?: string | null; scope?: string },
	): Promise<AmbulanceVehicle> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		const res = await api.post('/ambulance/vehicles', payload, { headers })
		return mapVehicle(res.data?.data)
	},

	updateVehicle: async (
		id: string,
		payload: Partial<CreateVehiclePayload>,
	): Promise<AmbulanceVehicle> => {
		const res = await api.patch(`/ambulance/vehicles/${id}`, payload)
		return mapVehicle(res.data?.data)
	},

	updateVehicleStatus: async (
		id: string,
		status: VehicleStatus,
	): Promise<AmbulanceVehicle> => {
		const res = await api.patch(`/ambulance/vehicles/${id}/status`, { status })
		return mapVehicle(res.data?.data)
	},

	// ==========================================
	// 2. TRIP / TRANSPORT ENDPOINTS
	// ==========================================
	getTrips: async (options?: { unitId?: string | null; scope?: string }): Promise<AmbulanceTrip[]> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		try {
			const res = await api.get('/ambulance/trips', { headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map(mapTrip)
		} catch {
			return []
		}
	},

	getTripById: async (id: string): Promise<AmbulanceTrip | null> => {
		try {
			const res = await api.get(`/ambulance/trips/${id}`)
			return res.data?.data ? mapTrip(res.data.data) : null
		} catch {
			return null
		}
	},

	createTrip: async (
		payload: CreateTripPayload,
		options?: { unitId?: string | null; scope?: string },
	): Promise<AmbulanceTrip> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		const res = await api.post('/ambulance/trips', payload, { headers })
		return mapTrip(res.data?.data)
	},

	updateTrip: async (
		id: string,
		payload: Partial<CreateTripPayload>,
	): Promise<AmbulanceTrip> => {
		const res = await api.patch(`/ambulance/trips/${id}`, payload)
		return mapTrip(res.data?.data)
	},

	updateTripStatus: async (
		id: string,
		payload: Record<string, unknown>,
	): Promise<AmbulanceTrip> => {
		const res = await api.patch(`/ambulance/trips/${id}/status`, payload)
		return mapTrip(res.data?.data)
	},

	// ==========================================
	// 3. AUTHORITATIVE FINANCE INVOICE GENERATION
	// ==========================================
	generateInvoice: async (tripId: string, amount?: number): Promise<Record<string, unknown>> => {
		const res = await api.post(`/ambulance/trips/${tripId}/invoice`, amount != null ? { amount } : {})
		return (res.data?.data || {}) as Record<string, unknown>
	},

	generateTripInvoice: async (tripId: string, amount?: number): Promise<Record<string, unknown>> => {
		return ambulanceService.generateInvoice(tripId, amount)
	},

	// ==========================================
	// 4. AVAILABLE DRIVERS & CREW LOOKUP
	// ==========================================
	getStaffCrew: async (options?: { unitId?: string | null; scope?: string }): Promise<Array<{ id: string; name: string; role: string; empId: string }>> => {
		const headers: Record<string, string> = {}
		if (options?.unitId && options.unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = options.unitId
		}
		try {
			const res = await api.get('/hr/staff', { headers })
			const list = Array.isArray(res.data?.data) ? res.data.data : []
			return list.map((s: Record<string, unknown>) => ({
				id: String(s.id || ''),
				name: `${String(s.firstName || '')} ${String(s.lastName || '')}`.trim() || 'Staff Member',
				role: String(s.designation || 'Staff'),
				empId: String(s.empId || ''),
			}))
		} catch {
			return []
		}
	},

	getDrivers: async (options?: { unitId?: string | null; scope?: string }): Promise<Array<{ id: string; name: string; role: string; empId: string }>> => {
		return ambulanceService.getStaffCrew(options)
	},
}
