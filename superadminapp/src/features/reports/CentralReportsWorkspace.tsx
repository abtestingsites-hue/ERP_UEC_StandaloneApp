import { useEffect, useState } from 'react'
import {
	BarChart3,
	DollarSign,
	Package,
	Users,
	Home,
	ShieldCheck,
	Heart,
	Briefcase,
	Ambulance,
	RefreshCw,
	Building2,
	AlertCircle,
	CheckSquare,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { useActiveUnit } from '../../context/useActiveUnit'
import { reportsService } from './reports.service'
import type { ExecutiveKpiSummary, CrossDomainPendingItem } from './reports.types'

import { ExecutiveOverviewTab } from './tabs/ExecutiveOverviewTab'
import { FinanceReportsTab } from './tabs/FinanceReportsTab'
import { InventoryReportsTab } from './tabs/InventoryReportsTab'
import { AdmissionsCareReportsTab } from './tabs/AdmissionsCareReportsTab'
import { HomeCareReportsTab } from './tabs/HomeCareReportsTab'
import { VisitorSecurityReportsTab } from './tabs/VisitorSecurityReportsTab'
import { DonorsFundingReportsTab } from './tabs/DonorsFundingReportsTab'
import { HROperationsReportsTab } from './tabs/HROperationsReportsTab'
import { AmbulanceReportsTab } from './tabs/AmbulanceReportsTab'
import { CrossDomainWorkflowTab } from './tabs/CrossDomainWorkflowTab'
import { useAuth } from '../auth/useAuth'
import { canAccessDomain, isSuperAdmin } from '../../utils/permissions'

import type { AccountTransaction, CashboxTransaction } from '../finance/finance.types'
import type {
	StockValuationResponse,
	InventoryStockMovement,
	InventoryExpiryAlertBatch,
	InventoryExpirySummary,
	PhysicalAudit,
} from '../inventory/inventory.types'
import type { AdmissionRecord, Patient, ServiceClosure } from '../admissions/admissions.types'
import type { MedicalAssignment, IncidentReport, MedicalDashboardSummary } from '../care/care.types'
import type { HomeCareAdmission, HomeCareAllocation, VisitTask } from '../home-care/homeCare.types'
import type {
	GateEntry,
	VisitorPass,
	VehicleMovement,
	SecurityDashboardSummary,
	PassAnalytics,
} from '../visitor-security/visitorSecurity.types'
import type { Donation, Project, FundingAllocation, ProjectExpenditure } from '../donors-volunteers/donorsVolunteers.types'
import type {
	StaffMember,
	AttendanceRecord,
	LeaveRequestItem,
	MaintenanceTicket,
	PayrollPreviewItem,
} from '../hr-operations/hrOperations.types'
import type { AmbulanceTrip, AmbulanceVehicle } from '../ambulance/ambulance.types'

const EMPTY_EXECUTIVE_SUMMARY: ExecutiveKpiSummary = {
	totalPatients: 0,
	activeAdmissions: 0,
	criticalAlertsCount: 0,
	activeHomeCareContracts: 0,
	pendingHomeCareVisits: 0,
	totalReceivables: 0,
	totalCollections: 0,
	unbilledTripsCount: 0,
	totalStockValuation: 0,
	lowStockAlertCount: 0,
	totalDonationsAmount: 0,
	totalProjectsFunded: 0,
	activeStaffCount: 0,
	pendingLeaveRequests: 0,
	openMaintenanceTickets: 0,
	activeVisitorsInside: 0,
	gateEntriesToday: 0,
	activeAmbulanceTrips: 0,
	availableFleetCount: 0,
}

export function CentralReportsWorkspace() {
	const { activeUnitName, activeUnitId, hasExplicitAllUnits } = useActiveUnit()
	const { session } = useAuth()
	const user = session?.user

	const canSeeOverview = isSuperAdmin(user) || Boolean(user?.permissions?.includes('ALL_ACCESS'))
	const canSeeCrossDomain = isSuperAdmin(user)
	const canSeeFinance = canAccessDomain('finance', user)
	const canSeeInventory = canAccessDomain('inventory', user)
	const canSeeAdmissionsCare = canAccessDomain('admission', user) || canAccessDomain('inhouse-care', user)
	const canSeeHomeCare = canAccessDomain('home-care', user)
	const canSeeSecurity = canAccessDomain('visitor-security', user)
	const canSeeDonors = canAccessDomain('donors-volunteers', user)
	const canSeeHR = canAccessDomain('hr-operations', user)
	const canSeeAmbulance = canAccessDomain('ambulance', user)

	const getFirstAvailableTab = () => {
		if (canSeeOverview) return 'overview'
		if (canSeeFinance) return 'finance'
		if (canSeeInventory) return 'inventory'
		if (canSeeAdmissionsCare) return 'admissions'
		if (canSeeHomeCare) return 'homecare'
		if (canSeeHR) return 'hr'
		if (canSeeAmbulance) return 'ambulance'
		if (canSeeSecurity) return 'security'
		if (canSeeDonors) return 'donors'
		return 'overview'
	}

	const isTabPermitted = (tab: string) => {
		if (tab === 'overview') return canSeeOverview
		if (tab === 'cross-domain') return canSeeCrossDomain
		if (tab === 'finance') return canSeeFinance
		if (tab === 'inventory') return canSeeInventory
		if (tab === 'admissions') return canSeeAdmissionsCare
		if (tab === 'homecare') return canSeeHomeCare
		if (tab === 'security') return canSeeSecurity
		if (tab === 'donors') return canSeeDonors
		if (tab === 'hr') return canSeeHR
		if (tab === 'ambulance') return canSeeAmbulance
		return false
	}

	const [selectedTab, setSelectedTab] = useState<string>(getFirstAvailableTab)
	const activeTab = isTabPermitted(selectedTab) ? selectedTab : getFirstAvailableTab()
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

	// Executive Summary & Cross-Domain Pending Actions
	const [summary, setSummary] = useState<ExecutiveKpiSummary>(EMPTY_EXECUTIVE_SUMMARY)
	const [pendingActions, setPendingActions] = useState<CrossDomainPendingItem[]>([])

	// Domain Data States
	const [invoices, setInvoices] = useState<AccountTransaction[]>([])
	const [cashbox, setCashbox] = useState<CashboxTransaction[]>([])
	const [valuation, setValuation] = useState<StockValuationResponse | null>(null)
	const [movements, setMovements] = useState<InventoryStockMovement[]>([])
	const [expiryData, setExpiryData] = useState<{
		alerts: InventoryExpiryAlertBatch[]
		summary: InventoryExpirySummary
	} | null>(null)
	const [audits, setAudits] = useState<PhysicalAudit[]>([])
	const [admissions, setAdmissions] = useState<AdmissionRecord[]>([])
	const [patients, setPatients] = useState<Patient[]>([])
	const [closures, setClosures] = useState<ServiceClosure[]>([])
	const [careDashboard, setCareDashboard] = useState<MedicalDashboardSummary | null>(null)
	const [careAssignments, setCareAssignments] = useState<MedicalAssignment[]>([])
	const [incidents, setIncidents] = useState<IncidentReport[]>([])
	const [homeAdmissions, setHomeAdmissions] = useState<HomeCareAdmission[]>([])
	const [homeAllocations, setHomeAllocations] = useState<HomeCareAllocation[]>([])
	const [homeTasks, setHomeTasks] = useState<VisitTask[]>([])
	const [dailyMovements, setDailyMovements] = useState<GateEntry[]>([])
	const [visitorPasses, setVisitorPasses] = useState<VisitorPass[]>([])
	const [vehicleMovements, setVehicleMovements] = useState<VehicleMovement[]>([])
	const [secSummary, setSecSummary] = useState<SecurityDashboardSummary | null>(null)
	const [passAnalytics, setPassAnalytics] = useState<PassAnalytics | null>(null)
	const [donations, setDonations] = useState<Donation[]>([])
	const [projects, setProjects] = useState<Project[]>([])
	const [allocations, setAllocations] = useState<FundingAllocation[]>([])
	const [expenditures, setExpenditures] = useState<ProjectExpenditure[]>([])
	const [staffList, setStaffList] = useState<StaffMember[]>([])
	const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
	const [leaves, setLeaves] = useState<LeaveRequestItem[]>([])
	const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([])
	const [payrollPreview, setPayrollPreview] = useState<PayrollPreviewItem[]>([])
	const [ambTrips, setAmbTrips] = useState<AmbulanceTrip[]>([])
	const [ambVehicles, setAmbVehicles] = useState<AmbulanceVehicle[]>([])

	const handleRefresh = () => {
		setRefreshTrigger((prev) => prev + 1)
	}

	useEffect(() => {
		let isMounted = true

		const loadReportsData = async () => {
			setIsLoading(true)
			try {
				const isAll = hasExplicitAllUnits || !activeUnitId || activeUnitId === 'ALL_UNITS'
				const uId = isAll ? null : activeUnitId

				// Concurrently fetch all domain datasets with explicit types and isolated error boundaries
				const [
					execSummary,
					pendingItems,
					financeData,
					inventoryData,
					admissionsCareData,
					homeCareData,
					securityData,
					donorsData,
					hrData,
					ambulanceData,
				] = await Promise.all([
					canSeeOverview
						? reportsService.getExecutiveRollup(uId).catch(() => EMPTY_EXECUTIVE_SUMMARY)
						: Promise.resolve(EMPTY_EXECUTIVE_SUMMARY),
					canSeeCrossDomain
						? reportsService.getCrossDomainPendingActions(uId).catch(() => [])
						: Promise.resolve([]),
					canSeeFinance
						? Promise.all([
								reportsService.finance.getInvoices({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => [] as AccountTransaction[]),
								reportsService.finance.getCashbox({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => [] as CashboxTransaction[]),
						  ]).then(([invRes, cbRes]) => ({ invRes, cbRes }))
						: Promise.resolve({ invRes: [] as AccountTransaction[], cbRes: [] as CashboxTransaction[] }),
					canSeeInventory
						? Promise.all([
								reportsService.inventory.getStockValuation({ unitId: uId, allUnits: isAll }).catch(() => null),
								reportsService.inventory.getStockMovements({ unitId: uId, allUnits: isAll }).catch(() => [] as InventoryStockMovement[]),
								reportsService.inventory.getExpiryAlerts({ unitId: uId, allUnits: isAll }).catch(() => null),
								reportsService.inventory.getPhysicalAudits({ unitId: uId, allUnits: isAll }).catch(() => [] as PhysicalAudit[]),
						  ]).then(([valRes, movRes, expRes, audRes]) => ({ valRes, movRes, expRes, audRes }))
						: Promise.resolve({ valRes: null as StockValuationResponse | null, movRes: [] as InventoryStockMovement[], expRes: null as { alerts: InventoryExpiryAlertBatch[]; summary: InventoryExpirySummary } | null, audRes: [] as PhysicalAudit[] }),
					canSeeAdmissionsCare
						? Promise.all([
								reportsService.admissions.listAdmissions({ unitId: uId, allUnits: isAll, status: 'ALL' }).catch(() => [] as AdmissionRecord[]),
								reportsService.admissions.listPatients({ unitId: uId, allUnits: isAll }).catch(() => [] as Patient[]),
								reportsService.admissions.listClosures().catch(() => [] as ServiceClosure[]),
								reportsService.care.getDashboard(uId).catch(() => null),
								reportsService.care.getAssignments({ unitId: uId }).catch(() => [] as MedicalAssignment[]),
								reportsService.care.getIncidents(null, uId).catch(() => [] as IncidentReport[]),
						  ]).then(([admRes, patRes, closRes, careDashRes, careAsgnRes, incRes]) => ({ admRes, patRes, closRes, careDashRes, careAsgnRes, incRes }))
						: Promise.resolve({ admRes: [] as AdmissionRecord[], patRes: [] as Patient[], closRes: [] as ServiceClosure[], careDashRes: null as MedicalDashboardSummary | null, careAsgnRes: [] as MedicalAssignment[], incRes: [] as IncidentReport[] }),
					canSeeHomeCare
						? Promise.all([
								reportsService.homeCare.getAdmissions(uId).catch(() => [] as HomeCareAdmission[]),
								reportsService.homeCare.getAllocations(uId).catch(() => [] as HomeCareAllocation[]),
								reportsService.homeCare.getTasks(undefined, uId).catch(() => [] as VisitTask[]),
						  ]).then(([homeAdmRes, homeAllocRes, homeTaskRes]) => ({ homeAdmRes, homeAllocRes, homeTaskRes }))
						: Promise.resolve({ homeAdmRes: [] as HomeCareAdmission[], homeAllocRes: [] as HomeCareAllocation[], homeTaskRes: [] as VisitTask[] }),
					canSeeSecurity
						? Promise.all([
								reportsService.visitorSecurity.getDailyMovement('', uId).catch(() => [] as GateEntry[]),
								reportsService.visitorSecurity.getPasses(uId).catch(() => [] as VisitorPass[]),
								reportsService.visitorSecurity.getVehicleMovements(uId).catch(() => [] as VehicleMovement[]),
								reportsService.visitorSecurity.getDashboardSummary(uId).catch(() => null),
								reportsService.visitorSecurity.getAnalytics(uId).catch(() => null),
						  ]).then(([dmRes, vpRes, vmRes, secSumRes, pAnalyticRes]) => ({ dmRes, vpRes, vmRes, secSumRes, pAnalyticRes }))
						: Promise.resolve({ dmRes: [] as GateEntry[], vpRes: [] as VisitorPass[], vmRes: [] as VehicleMovement[], secSumRes: null as SecurityDashboardSummary | null, pAnalyticRes: null as PassAnalytics | null }),
					canSeeDonors
						? Promise.all([
								reportsService.donors.getDonations(uId).catch(() => [] as Donation[]),
								reportsService.donors.getProjects(uId).catch(() => [] as Project[]),
								reportsService.donors.getAllocations(uId).catch(() => [] as FundingAllocation[]),
								reportsService.donors.getExpenditures(uId).catch(() => [] as ProjectExpenditure[]),
						  ]).then(([donRes, projRes, allocRes, expendRes]) => ({ donRes, projRes, allocRes, expendRes }))
						: Promise.resolve({ donRes: [] as Donation[], projRes: [] as Project[], allocRes: [] as FundingAllocation[], expendRes: [] as ProjectExpenditure[] }),
					canSeeHR
						? Promise.all([
								reportsService.hr.getStaffList({ unitId: uId, scope: isAll ? 'all' : undefined }).catch(() => [] as StaffMember[]),
								reportsService.hr.getAttendanceLogs({ scope: isAll ? 'all' : undefined }).catch(() => [] as AttendanceRecord[]),
								reportsService.hr.getLeaveRequests({ scope: isAll ? 'all' : undefined }).catch(() => [] as LeaveRequestItem[]),
								reportsService.hr.getMaintenance({ unitId: uId }).catch(() => [] as MaintenanceTicket[]),
								reportsService.hr.getPayrollPreview({ scope: isAll ? 'all' : undefined }).catch(() => [] as PayrollPreviewItem[]),
						  ]).then(([stRes, attRes, lvRes, maintRes, payRes]) => ({ stRes, attRes, lvRes, maintRes, payRes }))
						: Promise.resolve({ stRes: [] as StaffMember[], attRes: [] as AttendanceRecord[], lvRes: [] as LeaveRequestItem[], maintRes: [] as MaintenanceTicket[], payRes: [] as PayrollPreviewItem[] }),
					canSeeAmbulance
						? Promise.all([
								reportsService.ambulance.getTrips({ unitId: uId }).catch(() => [] as AmbulanceTrip[]),
								reportsService.ambulance.getVehicles({ unitId: uId }).catch(() => [] as AmbulanceVehicle[]),
						  ]).then(([ambTRes, ambVRes]) => ({ ambTRes, ambVRes }))
						: Promise.resolve({ ambTRes: [] as AmbulanceTrip[], ambVRes: [] as AmbulanceVehicle[] }),
				])

				const { invRes, cbRes } = financeData
				const { valRes, movRes, expRes, audRes } = inventoryData
				const { admRes, patRes, closRes, careDashRes, careAsgnRes, incRes } = admissionsCareData
				const { homeAdmRes, homeAllocRes, homeTaskRes } = homeCareData
				const { dmRes, vpRes, vmRes, secSumRes, pAnalyticRes } = securityData
				const { donRes, projRes, allocRes, expendRes } = donorsData
				const { stRes, attRes, lvRes, maintRes, payRes } = hrData
				const { ambTRes, ambVRes } = ambulanceData

				// Enrich summary with live domain query aggregates if available (case-insensitive for status)
				const liveReceivables = (invRes || [])
					.filter((inv) => {
						const s = String(inv?.status || '').toUpperCase()
						return s !== 'PAID' && s !== 'CANCELLED'
					})
					.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)
				const liveCollections = (invRes || [])
					.filter((inv) => String(inv?.status || '').toUpperCase() === 'PAID')
					.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)
				const liveStockValuation = valRes?.summary?.totalValuation || 0

				const activeAdmissionsCount = (admRes || []).filter((a) => {
					const s = String(a?.status || '').toUpperCase()
					return ['ACTIVE', 'ADMITTED', 'OBSERVATION'].includes(s)
				}).length

				const safeSummary: ExecutiveKpiSummary = {
					...execSummary,
					totalPatients: execSummary.totalPatients || (patRes?.length ?? 0),
					activeAdmissions: execSummary.activeAdmissions || activeAdmissionsCount,
					totalReceivables: execSummary.totalReceivables || liveReceivables,
					totalCollections: execSummary.totalCollections || liveCollections,
					totalStockValuation: execSummary.totalStockValuation || liveStockValuation,
					activeStaffCount: execSummary.activeStaffCount || (stRes?.filter((s) => s?.status === 'Working').length ?? 0),
					activeHomeCareContracts: execSummary.activeHomeCareContracts || (homeAdmRes?.length ?? 0),
					availableFleetCount: execSummary.availableFleetCount || (ambVRes?.filter((v) => v?.status === 'AVAILABLE').length ?? 0),
					activeAmbulanceTrips: execSummary.activeAmbulanceTrips || (ambTRes?.filter((t) => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)).length ?? 0),
				}

				if (isMounted) {
					setSummary(safeSummary)
					setPendingActions(pendingItems)
					setInvoices(invRes)
					setCashbox(cbRes)
					setValuation(valRes)
					setMovements(movRes)
					setExpiryData(expRes)
					setAudits(audRes)
					setAdmissions(admRes)
					setPatients(patRes)
					setClosures(closRes)
					setCareDashboard(careDashRes)
					setCareAssignments(careAsgnRes)
					setIncidents(incRes)
					setHomeAdmissions(homeAdmRes)
					setHomeAllocations(homeAllocRes)
					setHomeTasks(homeTaskRes)
					setDailyMovements(dmRes)
					setVisitorPasses(vpRes)
					setVehicleMovements(vmRes)
					setSecSummary(secSumRes)
					setPassAnalytics(pAnalyticRes)
					setDonations(donRes)
					setProjects(projRes)
					setAllocations(allocRes)
					setExpenditures(expendRes)
					setStaffList(stRes)
					setAttendance(attRes)
					setLeaves(lvRes)
					setMaintenance(maintRes)
					setPayrollPreview(payRes)
					setAmbTrips(ambTRes)
					setAmbVehicles(ambVRes)
					setLoadError(null)
				}
			} catch (err: unknown) {
				if (isMounted) {
					const msg = err instanceof Error ? err.message : 'Error synchronizing central reports'
					setLoadError(msg)
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadReportsData()

		return () => {
			isMounted = false
		}
	}, [
		refreshTrigger,
		activeUnitId,
		hasExplicitAllUnits,
		canSeeOverview,
		canSeeCrossDomain,
		canSeeFinance,
		canSeeInventory,
		canSeeAdmissionsCare,
		canSeeHomeCare,
		canSeeSecurity,
		canSeeDonors,
		canSeeHR,
		canSeeAmbulance,
	])

	return (
		<div className="min-h-screen bg-slate-50/50 pb-16">
			{/* Page Header */}
			<PageHeader
				eyebrow="ORGANIZATION-WIDE AUDIT & INTELLIGENCE"
				title="Central Reports & Executive Dashboard"
				description="Unified reporting and audit journals across Finance, Inventory, Admissions, Inhouse Care, Home Care, Security, Donors, HR, and Ambulance domains."
				action={
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg shadow-xs">
							<Building2 className="w-3.5 h-3.5 text-primary-600" />
							<span>Active Unit:</span>
							<span className="text-primary-700 font-bold">{activeUnitName || 'Global Enterprise'}</span>
						</div>
						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
							title="Synchronize all reports"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
							Sync
						</button>
					</div>
				}
			/>

			{/* Main Container */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
				{/* Load Error Alert */}
				{loadError && (
					<div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
						<div>
							<h4 className="text-sm font-semibold text-rose-900">Reports Synchronization Notice</h4>
							<p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
						</div>
					</div>
				)}

				{/* Tab Navigation Ribbon */}
				<div className="border-b border-slate-200 mb-6">
					<nav className="flex space-x-6 overflow-x-auto pb-px">
						{canSeeOverview && (
							<button
								onClick={() => setSelectedTab('overview')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'overview'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<BarChart3 className="w-4 h-4" />
								Executive Overview
							</button>
						)}

						{canSeeCrossDomain && (
							<button
								onClick={() => setSelectedTab('cross-domain')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'cross-domain'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<CheckSquare className="w-4 h-4" />
								Pending Actions
								{pendingActions.length > 0 && (
									<span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-700 font-bold">
										{pendingActions.length}
									</span>
								)}
							</button>
						)}

						{canSeeFinance && (
							<button
								onClick={() => setSelectedTab('finance')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'finance'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<DollarSign className="w-4 h-4" />
								Finance & Ledger
							</button>
						)}

						{canSeeInventory && (
							<button
								onClick={() => setSelectedTab('inventory')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'inventory'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Package className="w-4 h-4" />
								Inventory & Valuation
							</button>
						)}

						{canSeeAdmissionsCare && (
							<button
								onClick={() => setSelectedTab('admissions')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'admissions'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Users className="w-4 h-4" />
								Admissions & Care
							</button>
						)}

						{canSeeHomeCare && (
							<button
								onClick={() => setSelectedTab('homecare')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'homecare'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Home className="w-4 h-4" />
								Home Care
							</button>
						)}

						{canSeeSecurity && (
							<button
								onClick={() => setSelectedTab('security')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'security'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<ShieldCheck className="w-4 h-4" />
								Security & Gate
							</button>
						)}

						{canSeeDonors && (
							<button
								onClick={() => setSelectedTab('donors')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'donors'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Heart className="w-4 h-4" />
								Donors & Grants
							</button>
						)}

						{canSeeHR && (
							<button
								onClick={() => setSelectedTab('hr')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'hr'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Briefcase className="w-4 h-4" />
								HR & Operations
							</button>
						)}

						{canSeeAmbulance && (
							<button
								onClick={() => setSelectedTab('ambulance')}
								className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
									activeTab === 'ambulance'
										? 'border-primary-600 text-primary-600'
										: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
								}`}
							>
								<Ambulance className="w-4 h-4" />
								Ambulance
							</button>
						)}
					</nav>
				</div>

				{/* Tab Panels */}
				{activeTab === 'overview' && (
					<ExecutiveOverviewTab
						summary={summary}
						isLoading={isLoading}
						onNavigateTab={(tabId) => setSelectedTab(tabId)}
					/>
				)}

				{activeTab === 'cross-domain' && (
					<CrossDomainWorkflowTab
						items={pendingActions}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'finance' && (
					<FinanceReportsTab
						invoices={invoices}
						cashbox={cashbox}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'inventory' && (
					<InventoryReportsTab
						valuation={valuation}
						movements={movements}
						expiryData={expiryData}
						audits={audits}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'admissions' && (
					<AdmissionsCareReportsTab
						admissions={admissions}
						patients={patients}
						closures={closures}
						careDashboard={careDashboard}
						assignments={careAssignments}
						incidents={incidents}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'homecare' && (
					<HomeCareReportsTab
						admissions={homeAdmissions}
						allocations={homeAllocations}
						tasks={homeTasks}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'security' && (
					<VisitorSecurityReportsTab
						dailyMovement={dailyMovements}
						passes={visitorPasses}
						vehicles={vehicleMovements}
						dashboardSummary={secSummary}
						analytics={passAnalytics}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'donors' && (
					<DonorsFundingReportsTab
						donations={donations}
						projects={projects}
						allocations={allocations}
						expenditures={expenditures}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'hr' && (
					<HROperationsReportsTab
						staffList={staffList}
						attendance={attendance}
						leaves={leaves}
						maintenance={maintenance}
						payrollPreview={payrollPreview}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}

				{activeTab === 'ambulance' && (
					<AmbulanceReportsTab
						trips={ambTrips}
						vehicles={ambVehicles}
						isLoading={isLoading}
						onRefresh={handleRefresh}
						activeUnitName={activeUnitName}
					/>
				)}
			</div>
		</div>
	)
}

export default CentralReportsWorkspace
