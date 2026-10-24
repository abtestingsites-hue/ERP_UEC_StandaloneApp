import React from 'react'
import {
	Activity,
	Users,
	HeartPulse,
	Home,
	DollarSign,
	Package,
	Heart,
	Briefcase,
	ShieldCheck,
	Ambulance,
	AlertTriangle,
	ArrowRight,
	TrendingUp,
} from 'lucide-react'
import type { ExecutiveKpiSummary } from '../reports.types'
import { ReportMetricCard } from '../components/ReportMetricCard'

interface ExecutiveOverviewTabProps {
	summary: ExecutiveKpiSummary
	isLoading: boolean
	onNavigateTab: (tabId: string) => void
}

export const ExecutiveOverviewTab: React.FC<ExecutiveOverviewTabProps> = ({
	summary,
	isLoading,
	onNavigateTab,
}) => {
	if (isLoading) {
		return (
			<div className="p-12 text-center text-slate-500">
				<Activity className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
				<p className="text-sm font-semibold">Aggregating cross-domain ERP reports...</p>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* High-level Alert Notice if pending clearances */}
			{(summary.criticalAlertsCount > 0 || summary.pendingLeaveRequests > 0 || summary.unbilledTripsCount > 0) && (
				<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
					<div className="flex items-center gap-3">
						<span className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
							<AlertTriangle className="w-5 h-5" />
						</span>
						<div>
							<h4 className="text-sm font-bold text-amber-900">
								Executive Attention Required Across Domains
							</h4>
							<p className="text-xs text-amber-700 mt-0.5">
								{summary.criticalAlertsCount > 0 && `${summary.criticalAlertsCount} critical clinical alerts. `}
								{summary.pendingLeaveRequests > 0 && `${summary.pendingLeaveRequests} pending staff leave applications. `}
								{summary.unbilledTripsCount > 0 && `${summary.unbilledTripsCount} completed ambulance trips awaiting invoice generation.`}
							</p>
						</div>
					</div>
					<button
						onClick={() => onNavigateTab('cross-domain')}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-lg transition-colors shrink-0"
					>
						Review Action Center
						<ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Executive 9-Domain KPI Grid */}
			<div>
				<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
					Cross-Domain Operational Metrics (All 9 Integrated Modules)
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					<ReportMetricCard
						title="Inpatient Residents"
						value={summary.activeAdmissions}
						subtitle={`${summary.totalPatients} Registered Patients`}
						icon={Users}
						accentColor="primary"
						trendLabel="Active Census"
					/>
					<ReportMetricCard
						title="Clinical Care Vitals"
						value={summary.criticalAlertsCount === 0 ? 'Optimal' : `${summary.criticalAlertsCount} Alerts`}
						subtitle="Inhouse Care Monitoring"
						icon={HeartPulse}
						accentColor={summary.criticalAlertsCount > 0 ? 'rose' : 'emerald'}
						trendLabel="Nursing Roster Active"
					/>
					<ReportMetricCard
						title="Home Care Delivery"
						value={summary.activeHomeCareContracts}
						subtitle={`${summary.pendingHomeCareVisits} Visits Scheduled`}
						icon={Home}
						accentColor="indigo"
						trendLabel="Active Contracts"
					/>
					<ReportMetricCard
						title="Outstanding Receivables"
						value={`₹${summary.totalReceivables.toLocaleString()}`}
						subtitle={`₹${summary.totalCollections.toLocaleString()} Collected`}
						icon={DollarSign}
						accentColor="amber"
						trendLabel="Finance & General Ledger"
					/>
					<ReportMetricCard
						title="Inventory Valuation"
						value={summary.totalStockValuation > 0 ? `₹${summary.totalStockValuation.toLocaleString()}` : 'Live Stocked'}
						subtitle="Medical & Nutrition Warehouses"
						icon={Package}
						accentColor="cyan"
						trendLabel="Multi-Unit Available"
					/>
					<ReportMetricCard
						title="Donations & Grants"
						value={`₹${summary.totalDonationsAmount.toLocaleString()}`}
						subtitle={`${summary.totalProjectsFunded} Active Funded Projects`}
						icon={Heart}
						accentColor="purple"
						trendLabel="UNCF Donor Community"
					/>
					<ReportMetricCard
						title="Workforce On Duty"
						value={summary.activeStaffCount}
						subtitle={`${summary.pendingLeaveRequests} Pending Leaves`}
						icon={Briefcase}
						accentColor="emerald"
						trendLabel="HR & Operations"
					/>
					<ReportMetricCard
						title="Campus Security"
						value={summary.activeVisitorsInside}
						subtitle={`${summary.gateEntriesToday} Total Move Logs Today`}
						icon={ShieldCheck}
						accentColor="indigo"
						trendLabel="Gate Pass Verified"
					/>
					<ReportMetricCard
						title="Ambulance Transit"
						value={`${summary.availableFleetCount} Available`}
						subtitle={`${summary.activeAmbulanceTrips} Active Road Runs`}
						icon={Ambulance}
						accentColor="rose"
						trendLabel="Transport Logistics"
					/>
				</div>
			</div>

			{/* Domain Specific Reporting Deep-Dives */}
			<div>
				<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
					Domain-Specific Detailed Audits
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div
						onClick={() => onNavigateTab('finance')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
								<DollarSign className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Finance & Ledger</h4>
						<p className="text-xs text-slate-500 mt-1">
							Invoices, collection summaries, cashbox vouchers, elder care billing, and accounts audit trails.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('inventory')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-cyan-50 text-cyan-700">
								<Package className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Inventory & Valuation</h4>
						<p className="text-xs text-slate-500 mt-1">
							Stock valuation, consumption analytics, stock movement journals, expiry risk, and physical audit discrepancies.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('admissions')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-primary-50 text-primary-700">
								<Users className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Admissions & Clinical Care</h4>
						<p className="text-xs text-slate-500 mt-1">
							Inpatient census, bed occupancy, doctor assignments, nursing approval queues, and UEC incident logs.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('homecare')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
								<Home className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Home Care Operations</h4>
						<p className="text-xs text-slate-500 mt-1">
							Client service contracts, field caregiver allocations, scheduled vs completed visits, and service status.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('security')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
								<ShieldCheck className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Visitor & Security Audit</h4>
						<p className="text-xs text-slate-500 mt-1">
							Daily gate movements, visitor pass analytics, vehicle logs, and resident outing returns.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('donors')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
								<Heart className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Donors & Funding Projects</h4>
						<p className="text-xs text-slate-500 mt-1">
							Contribution records, receipt distribution, project grants, allocations, and expenditures.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('hr')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
								<Briefcase className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">HR & Workforce Operations</h4>
						<p className="text-xs text-slate-500 mt-1">
							Attendance registers, leave governance, read-only payroll previews, tasks, and facility maintenance.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('ambulance')}
						className="bg-white border border-slate-200 hover:border-primary-400 rounded-xl p-5 shadow-sm cursor-pointer transition group"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-rose-50 text-rose-700">
								<Ambulance className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition" />
						</div>
						<h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition">Ambulance & Transport</h4>
						<p className="text-xs text-slate-500 mt-1">
							Trip sheets, run telemetry, odometer logs, emergency dispatches, and transport billing revenue.
						</p>
					</div>

					<div
						onClick={() => onNavigateTab('cross-domain')}
						className="bg-white border border-primary-200 hover:border-primary-500 rounded-xl p-5 shadow-sm cursor-pointer transition group bg-primary-50/20"
					>
						<div className="flex items-center justify-between mb-2">
							<span className="p-2.5 rounded-lg bg-primary-100 text-primary-700">
								<TrendingUp className="w-5 h-5" />
							</span>
							<ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-0.5 transition" />
						</div>
						<h4 className="font-bold text-primary-900">Cross-Domain Action Center</h4>
						<p className="text-xs text-primary-700 mt-1">
							Consolidated executive view of items requiring action across all 9 integrated operational domains.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
