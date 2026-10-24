export type ReportingPeriod = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'

export interface ReportDateFilter {
	period: ReportingPeriod
	startDate?: string
	endDate?: string
}

export interface ReportFilterState {
	dateRange: ReportDateFilter
	unitId?: string | null
	searchTerm?: string
	statusFilter?: string
}

export interface ExecutiveKpiSummary {
	// Healthcare & Inpatient
	totalPatients: number
	activeAdmissions: number
	criticalAlertsCount: number
	// Home Care
	activeHomeCareContracts: number
	pendingHomeCareVisits: number
	// Finance & Revenue
	totalReceivables: number
	totalCollections: number
	unbilledTripsCount: number
	// Inventory
	totalStockValuation: number
	lowStockAlertCount: number
	// Donors
	totalDonationsAmount: number
	totalProjectsFunded: number
	// HR & Operations
	activeStaffCount: number
	pendingLeaveRequests: number
	openMaintenanceTickets: number
	// Security & Visitors
	activeVisitorsInside: number
	gateEntriesToday: number
	// Ambulance
	activeAmbulanceTrips: number
	availableFleetCount: number
}

export interface CrossDomainPendingItem {
	id: string
	domain:
		| 'Admissions'
		| 'Inhouse Care'
		| 'Home Care'
		| 'Finance'
		| 'Inventory'
		| 'Donors & Grants'
		| 'HR & Staff'
		| 'Security Gate'
		| 'Ambulance'
	reference: string
	title: string
	status: string
	priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
	timestamp: string
	responsibleTeam: string
	actionPath: string
}
