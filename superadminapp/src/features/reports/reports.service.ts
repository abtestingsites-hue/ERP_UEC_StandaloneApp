import { api } from '../../services/api'
import { financeService } from '../finance/finance.service'
import { inventoryService } from '../inventory/inventory.service'
import { admissionsService } from '../admissions/admissions.service'
import { careService } from '../care/care.service'
import { homeCareService } from '../home-care/homeCare.service'
import { visitorSecurityService } from '../visitor-security/visitorSecurity.service'
import { donorsVolunteersService } from '../donors-volunteers/donorsVolunteers.service'
import { hrOperationsService } from '../hr-operations/hrOperations.service'
import { ambulanceService } from '../ambulance/ambulance.service'

import type {
	ExecutiveKpiSummary,
	CrossDomainPendingItem,
} from './reports.types'

export const reportsService = {
	// ==========================================
	// 1. BACKEND ANALYTICS ENDPOINT
	// ==========================================
	getBackendAnalyticsKpis: async (unitId?: string | null): Promise<Record<string, unknown>> => {
		const headers: Record<string, string> = {}
		if (unitId && unitId !== 'ALL_UNITS') {
			headers['x-unit-id'] = unitId
		}
		try {
			const res = await api.get('/analytics/kpis', { headers })
			return (res.data?.data || {}) as Record<string, unknown>
		} catch {
			return {}
		}
	},

	// ==========================================
	// 2. EXECUTIVE OVERVIEW CROSS-DOMAIN ROLLUP
	// ==========================================
	getExecutiveRollup: async (unitId?: string | null): Promise<ExecutiveKpiSummary> => {
		const isAll = !unitId || unitId === 'ALL_UNITS'
		const uId = isAll ? null : unitId

		// Query domain summaries concurrently with safe error isolation
		const [
			careDash,
			admissions,
			patients,
			invoices,
			donations,
			projects,
			staffList,
			leaves,
			maintenance,
			securitySummary,
			ambVehicles,
			ambTrips,
			homeContracts,
			homeTasks,
			valRes,
		] = await Promise.all([
			careService.getMedicalDashboard(uId).catch(() => null),
			admissionsService.listAdmissions({ unitId: uId, allUnits: isAll }).catch(() => []),
			admissionsService.listPatients({ unitId: uId, allUnits: isAll }).catch(() => []),
			financeService.getInvoices({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => []),
			donorsVolunteersService.getDonations(uId).catch(() => []),
			donorsVolunteersService.getProjects(uId).catch(() => []),
			hrOperationsService.getStaffList({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => []),
			hrOperationsService.getLeaveRequests({ scope: isAll ? 'all' : undefined }).catch(() => []),
			hrOperationsService.getMaintenanceTickets({ unitId: uId }).catch(() => []),
			visitorSecurityService.getDashboardSummary(uId).catch(() => null),
			ambulanceService.getVehicles({ unitId: uId }).catch(() => []),
			ambulanceService.getTrips({ unitId: uId }).catch(() => []),
			homeCareService.getAdmissions(uId).catch(() => []),
			homeCareService.getTasks(undefined, uId).catch(() => []),
			inventoryService.getStockValuation({ unitId: uId, allUnits: isAll }).catch(() => null),
		])

		const safeInvoices = Array.isArray(invoices) ? invoices : []
		const safeDonations = Array.isArray(donations) ? donations : []
		const safeAmbTrips = Array.isArray(ambTrips) ? ambTrips : []
		const safeAmbVehicles = Array.isArray(ambVehicles) ? ambVehicles : []
		const safeHomeTasks = Array.isArray(homeTasks) ? homeTasks : []
		const safePatients = Array.isArray(patients) ? patients : []
		const safeAdmissions = Array.isArray(admissions) ? admissions : []
		const safeHomeContracts = Array.isArray(homeContracts) ? homeContracts : []
		const safeProjects = Array.isArray(projects) ? projects : []
		const safeStaffList = Array.isArray(staffList) ? staffList : []
		const safeLeaves = Array.isArray(leaves) ? leaves : []
		const safeMaintenance = Array.isArray(maintenance) ? maintenance : []

		// Calculate verified receivables & collections (case-insensitive for PAID/paid/pending)
		const totalReceivables = safeInvoices
			.filter((inv) => {
				const s = String(inv?.status || '').toUpperCase()
				return s !== 'PAID' && s !== 'CANCELLED'
			})
			.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

		const totalCollections = safeInvoices
			.filter((inv) => String(inv?.status || '').toUpperCase() === 'PAID')
			.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

		// Calculate total donations
		const totalDonationsAmount = safeDonations.reduce(
			(sum, d) => sum + (Number(d?.amount) || 0),
			0
		)

		// Calculate ambulance metrics
		const activeAmbulanceTrips = safeAmbTrips.filter((t) =>
			t && ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)
		).length
		const availableFleetCount = safeAmbVehicles.filter(
			(v) => v && v.status === 'AVAILABLE'
		).length
		const unbilledTripsCount = safeAmbTrips.filter(
			(t) => t && t.status === 'COMPLETED'
		).length

		// Calculate Home Care metrics
		const pendingHomeCareVisits = safeHomeTasks.filter(
			(t) => t && (t.status === 'PENDING' || t.status === 'SCHEDULED')
		).length

		return {
			totalPatients: safePatients.length,
			activeAdmissions: safeAdmissions.filter((a) => {
				const s = String(a?.status || '').toUpperCase()
				return ['ACTIVE', 'ADMITTED', 'OBSERVATION'].includes(s)
			}).length,
			criticalAlertsCount: careDash?.criticalAlertsCount ?? 0,
			activeHomeCareContracts: safeHomeContracts.length,
			pendingHomeCareVisits,
			totalReceivables,
			totalCollections,
			unbilledTripsCount,
			totalStockValuation: valRes?.summary?.totalValuation || 0,
			lowStockAlertCount: 0,
			totalDonationsAmount,
			totalProjectsFunded: safeProjects.length,
			activeStaffCount: safeStaffList.filter((s) => s && s.status === 'Working').length,
			pendingLeaveRequests: safeLeaves.filter((l) => l && l.status === 'PENDING').length,
			openMaintenanceTickets: safeMaintenance.filter(
				(m) => m && (m.status === 'OPEN' || m.status === 'IN_PROGRESS' || m.status === 'PENDING')
			).length,
			activeVisitorsInside: securitySummary?.activeVisitors ?? 0,
			gateEntriesToday:
				(securitySummary?.activeVisitors ?? 0) +
				(securitySummary?.activeStaff ?? 0) +
				(securitySummary?.activeVehicles ?? 0),
			activeAmbulanceTrips,
			availableFleetCount,
		}
	},

	// ==========================================
	// 3. CROSS-DOMAIN PENDING ACTION REGISTER
	// ==========================================
	getCrossDomainPendingActions: async (
		unitId?: string | null
	): Promise<CrossDomainPendingItem[]> => {
		const isAll = !unitId || unitId === 'ALL_UNITS'
		const uId = isAll ? null : unitId

		const [leaves, maintenance, ambTrips, invoices, careDash, admissions] =
			await Promise.all([
				hrOperationsService.getLeaveRequests({ scope: isAll ? 'all' : undefined }).catch(() => []),
				hrOperationsService.getMaintenanceTickets({ unitId: uId }).catch(() => []),
				ambulanceService.getTrips({ unitId: uId }).catch(() => []),
				financeService.getInvoices({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => []),
				careService.getMedicalDashboard(uId).catch(() => null),
				admissionsService.listAdmissions({ unitId: uId, allUnits: isAll }).catch(() => []),
			])

		const items: CrossDomainPendingItem[] = []

		const safeLeaves = Array.isArray(leaves) ? leaves : []
		const safeMaintenance = Array.isArray(maintenance) ? maintenance : []
		const safeAmbTrips = Array.isArray(ambTrips) ? ambTrips : []
		const safeInvoices = Array.isArray(invoices) ? invoices : []
		const safeAdmissions = Array.isArray(admissions) ? admissions : []

		// 1. Pending HR Leaves
		safeLeaves
			.filter((l) => l && l.status === 'PENDING')
			.forEach((l) => {
				items.push({
					id: `leave-${l.id}`,
					domain: 'HR & Staff',
					reference: l.empId || (l.id ? String(l.id).slice(0, 8) : 'HR-LEAVE'),
					title: `Leave Application: ${l.staffName || 'Staff Member'} (${l.leaveType || 'General'})`,
					status: 'AWAITING_APPROVAL',
					priority: 'NORMAL',
					timestamp: l.createdAt || l.fromDate || '',
					responsibleTeam: 'HR Governance',
					actionPath: '/hr-operations',
				})
			})

		// 2. Open Maintenance Tickets
		safeMaintenance
			.filter((m) => m && (m.status === 'PENDING' || m.status === 'IN_PROGRESS' || m.status === 'OPEN'))
			.forEach((m) => {
				items.push({
					id: `maint-${m.id}`,
					domain: 'HR & Staff',
					reference: m.id ? String(m.id).slice(0, 8) : 'MNT-REQ',
					title: `Facility Maintenance: ${m.type || 'Repair'} (${m.category || m.description || 'Facility'})`,
					status: m.status,
					priority: m.priority === 'HIGH' || m.priority === 'CRITICAL' ? 'HIGH' : 'NORMAL',
					timestamp: m.createdAt || '',
					responsibleTeam: 'Facility Operations',
					actionPath: '/hr-operations',
				})
			})

		// 3. Ambulance Trips Awaiting Invoicing
		safeAmbTrips
			.filter((t) => t && t.status === 'COMPLETED')
			.forEach((t) => {
				items.push({
					id: `amb-${t.id}`,
					domain: 'Ambulance',
					reference: t.refNo || (t.id ? String(t.id).slice(0, 8) : 'AMB-TRIP'),
					title: `Completed Transport Awaiting Invoicing: ${t.clientName || 'Patient Transit'}`,
					status: 'PENDING_INVOICE',
					priority: 'NORMAL',
					timestamp: t.completionTime || t.updatedAt || '',
					responsibleTeam: 'Transport Billing',
					actionPath: '/ambulance',
				})
			})

		// 4. Overdue or Pending Invoices
		safeInvoices
			.filter((inv) => inv && (inv.status === 'CREATED' || inv.status === 'PENDING_APPROVAL'))
			.slice(0, 10)
			.forEach((inv) => {
				items.push({
					id: `inv-${inv.id}`,
					domain: 'Finance',
					reference: inv.refNo || (inv.id ? String(inv.id).slice(0, 8) : 'INV-BILL'),
					title: `Pending Invoice Collection: ₹${Number(inv.amount || 0).toLocaleString()} (${inv.notes || 'Accounts'})`,
					status: inv.status,
					priority: 'NORMAL',
					timestamp: inv.date ? String(inv.date).slice(0, 10) : '',
					responsibleTeam: 'Finance & Accounts',
					actionPath: '/finance',
				})
			})

		// 5. Inhouse Care Approvals
		if (careDash && typeof careDash.waitingApprovalCount === 'number' && careDash.waitingApprovalCount > 0) {
			items.push({
				id: 'care-waiting-approvals',
				domain: 'Inhouse Care',
				reference: 'CARE-APPROVALS',
				title: `${careDash.waitingApprovalCount} Patient Care Records / Medication Logs Awaiting Nurse Supervisor Approval`,
				status: 'PENDING_APPROVAL',
				priority: 'HIGH',
				timestamp: new Date().toISOString().slice(0, 10),
				responsibleTeam: 'Nursing Administration',
				actionPath: '/inhouse-care',
			})
		}

		// 6. Admissions Pending Clearances
		safeAdmissions
			.filter((a) => a && (a.status === 'PENDING' || a.status === 'WAITLISTED'))
			.forEach((a) => {
				items.push({
					id: `adm-${a.id}`,
					domain: 'Admissions',
					reference: a.enquiry?.refNo || (a.id ? String(a.id).slice(0, 8) : 'ADM-REQ'),
					title: `Admission Request: ${a.patient?.name || 'Resident'} (${a.status})`,
					status: a.status,
					priority: 'NORMAL',
					timestamp: a.admittedAt ? String(a.admittedAt).slice(0, 10) : a.createdAt ? String(a.createdAt).slice(0, 10) : '',
					responsibleTeam: 'Admissions Office',
					actionPath: '/admission',
				})
			})

		return items
	},

	// ==========================================
	// 4. DOMAIN REPORTS PASS-THROUGHS
	// ==========================================
	finance: {
		getInvoices: financeService.getInvoices,
		getCashbox: financeService.getCashbox,
	},
	inventory: {
		getStockValuation: inventoryService.getStockValuation,
		getConsumptionAnalytics: inventoryService.getConsumptionAnalytics,
		getStockMovements: inventoryService.getStockMovements,
		getExpiryAlerts: inventoryService.getExpiryAlerts,
		getPhysicalAudits: inventoryService.getPhysicalAudits,
	},
	admissions: {
		listAdmissions: admissionsService.listAdmissions,
		listPatients: admissionsService.listPatients,
		listClosures: admissionsService.listExecutedClosures,
	},
	care: {
		getDashboard: careService.getMedicalDashboard,
		getAssignments: careService.getAssignments,
		getIncidents: careService.getIncidents,
	},
	homeCare: {
		getAdmissions: homeCareService.getAdmissions,
		getAllocations: homeCareService.getAllocations,
		getTasks: homeCareService.getTasks,
	},
	visitorSecurity: {
		getDailyMovement: visitorSecurityService.getDailyMovementReport,
		getAnalytics: visitorSecurityService.getAnalytics,
		getDashboardSummary: visitorSecurityService.getDashboardSummary,
		getPasses: visitorSecurityService.getPasses,
		getGateQueue: visitorSecurityService.getGateQueue,
		getVehicleMovements: visitorSecurityService.getVehicleMovements,
	},
	donors: {
		getDonations: donorsVolunteersService.getDonations,
		getProjects: donorsVolunteersService.getProjects,
		getAllocations: donorsVolunteersService.getAllocations,
		getExpenditures: donorsVolunteersService.getExpenditures,
	},
	hr: {
		getStaffList: hrOperationsService.getStaffList,
		getAttendanceLogs: hrOperationsService.getAttendanceLogs,
		getLeaveRequests: hrOperationsService.getLeaveRequests,
		getPayrollPreview: hrOperationsService.getPayrollPreview,
		getTasks: hrOperationsService.getTasks,
		getMaintenance: hrOperationsService.getMaintenanceTickets,
	},
	ambulance: {
		getVehicles: ambulanceService.getVehicles,
		getTrips: ambulanceService.getTrips,
	},
}
