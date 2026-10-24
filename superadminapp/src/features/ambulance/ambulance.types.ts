export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE'

export type AmbulanceVehicle = {
	id: string
	vehicleNo: string
	type: string
	status: VehicleStatus
	baseLocation: string | null
	tenantId: string
	unitId: string
	createdAt: string
	updatedAt: string
}

export type TripStatus =
	| 'REQUESTED'
	| 'DISPATCH_READY'
	| 'DISPATCHED'
	| 'EN_ROUTE'
	| 'ARRIVED'
	| 'COMPLETED'
	| 'BILLED'
	| 'CANCELLED'

export type AmbulanceTrip = {
	id: string
	refNo: string
	clientName: string | null
	mobile: string | null
	pickupLocation: string | null
	destination: string | null
	priority: 'NORMAL' | 'URGENT' | 'EMERGENCY' | string | null
	status: TripStatus
	dispatchTime: string | null
	endTime?: string | null
	completionTime?: string | null
	kmStart: number | null
	kmEnd: number | null
	tripNotes: string | null
	totalAmount: number | null
	vehicleId: string | null
	driverId: string | null
	supportStaffId: string | null
	patientId: string | null
	tenantId: string
	unitId: string
	createdAt: string
	updatedAt: string
	vehicle?: AmbulanceVehicle | null
	driver?: {
		id: string
		empId?: string
		firstName?: string
		lastName?: string
		name?: string
		designation?: string
	} | null
	supportStaff?: {
		id: string
		empId?: string
		firstName?: string
		lastName?: string
		name?: string
		designation?: string
	} | null
	patient?: {
		id: string
		name?: string
		uhid?: string
		age?: number
		gender?: string
	} | null
}

export type CreateTripPayload = {
	clientName?: string
	mobile?: string
	pickupLocation?: string
	destination?: string
	priority?: string
	tripNotes?: string
	patientId?: string
	status?: 'REQUESTED'
}

export type DispatchTripPayload = {
	status: 'DISPATCHED'
	vehicleId: string
	driverId: string
	supportStaffId?: string
	dispatchTime?: string
}

export type EnRouteTripPayload = {
	status: 'EN_ROUTE'
	kmStart?: number
}

export type CompleteTripPayload = {
	status: 'COMPLETED'
	kmEnd: number
	totalAmount?: number
}

export type CreateVehiclePayload = {
	vehicleNo: string
	type: string
	status?: VehicleStatus
	baseLocation?: string
}

export type DriverOption = {
	id: string
	name: string
	empId?: string
	designation?: string
	phone?: string
}

export type AmbulanceOverviewMetrics = {
	totalTrips: number
	activeDispatches: number
	availableVehicles: number
	onTripVehicles: number
	maintenanceVehicles: number
	completedTrips: number
	unbilledTrips: number
	billedTrips: number
	totalVehicles?: number
	activeTrips?: number
	pendingDispatchTrips?: number
}
