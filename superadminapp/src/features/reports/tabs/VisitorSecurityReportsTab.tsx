import React, { useState, useMemo } from 'react'
import { ShieldCheck, Users, Truck, UserCheck } from 'lucide-react'
import type {
	GateEntry,
	VisitorPass,
	VehicleMovement,
	SecurityDashboardSummary,
	PassAnalytics,
} from '../../visitor-security/visitorSecurity.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'
import { formatVisitorPassNumber } from '../../../utils/idFormatters'

interface VisitorSecurityReportsTabProps {
	dailyMovement: GateEntry[]
	passes: VisitorPass[]
	vehicles: VehicleMovement[]
	dashboardSummary: SecurityDashboardSummary | null
	analytics: PassAnalytics | null
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const VisitorSecurityReportsTab: React.FC<VisitorSecurityReportsTabProps> = ({
	dailyMovement,
	passes,
	vehicles,
	dashboardSummary,
	analytics,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'MOVEMENT' | 'PASSES' | 'VEHICLES'>('MOVEMENT')

	// Filter movement entries
	const filteredMovement = useMemo(() => {
		if (!searchTerm.trim()) return dailyMovement
		return dailyMovement.filter((m) => {
			const name = m.visitorName || m.staffName || ''
			const num = m.id ? String(m.id).slice(0, 8) : ''
			return name.toLowerCase().includes(searchTerm.toLowerCase()) || num.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [dailyMovement, searchTerm])

	// Filter passes
	const filteredPasses = useMemo(() => {
		if (!searchTerm.trim()) return passes
		return passes.filter((p) => {
			const name = p.visitor?.name || ''
			const formattedId = formatVisitorPassNumber(p.passNumber || p.id)
			return name.toLowerCase().includes(searchTerm.toLowerCase()) || formattedId.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [passes, searchTerm])

	// Filter vehicles
	const filteredVehicles = useMemo(() => {
		if (!searchTerm.trim()) return vehicles
		return vehicles.filter((v) => {
			const vNo = v.vehicleNo || ''
			const dName = v.driverName || ''
			return vNo.toLowerCase().includes(searchTerm.toLowerCase()) || dName.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [vehicles, searchTerm])

	const handleExport = () => {
		if (activeSubView === 'MOVEMENT') {
			exportToCsv(
				'Security_Daily_Movement_Report',
				[
					{ key: 'id', label: 'Entry ID' },
					{ key: 'visitorName', label: 'Name' },
					{ key: 'category', label: 'Category' },
					{ key: 'checkInAt', label: 'Check In' },
					{ key: 'status', label: 'Status' },
				],
				filteredMovement as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'PASSES') {
			exportToCsv(
				'Visitor_Passes_Report',
				[
					{ key: 'id', label: 'Pass ID' },
					{ key: 'visitorName', label: 'Visitor' },
					{ key: 'passType', label: 'Pass Type' },
					{ key: 'status', label: 'Status' },
					{ key: 'createdAt', label: 'Date' },
				],
				filteredPasses as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Vehicle_Movements_Report',
				[
					{ key: 'vehicleNo', label: 'Vehicle No' },
					{ key: 'driverName', label: 'Driver' },
					{ key: 'purpose', label: 'Purpose' },
					{ key: 'entryAt', label: 'Entry Time' },
					{ key: 'status', label: 'Status' },
				],
				filteredVehicles as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Active Campus Visitors"
					value={dashboardSummary?.activeVisitors ?? 0}
					subtitle={`${analytics?.totalVisitorsToday ?? 0} Visitors Today`}
					icon={Users}
					accentColor="indigo"
				/>
				<ReportMetricCard
					title="Active Visitor Passes"
					value={passes.filter((p) => p.status === 'ACTIVE').length}
					subtitle={`${passes.length} Total Passes Issued`}
					icon={UserCheck}
					accentColor="primary"
				/>
				<ReportMetricCard
					title="Vehicles on Campus"
					value={dashboardSummary?.activeVehicles ?? 0}
					subtitle={`${vehicles.length} Total Vehicle Movements`}
					icon={Truck}
					accentColor="cyan"
				/>
				<ReportMetricCard
					title="Daily Movement Logs"
					value={dailyMovement.length}
					subtitle="Gate Check-In / Audit Trail"
					icon={ShieldCheck}
					accentColor="emerald"
				/>
			</div>

			{/* Filter Bar */}
			<ReportFilterBar
				period={period}
				onPeriodChange={setPeriod}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				activeUnitName={activeUnitName}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onExportCsv={handleExport}
				searchPlaceholder="Search visitor names, pass numbers, or vehicle registration..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('MOVEMENT')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'MOVEMENT'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Gate Movements Log ({filteredMovement.length})
				</button>
				<button
					onClick={() => setActiveSubView('PASSES')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'PASSES'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Visitor Passes Registry ({filteredPasses.length})
				</button>
				<button
					onClick={() => setActiveSubView('VEHICLES')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'VEHICLES'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Vehicle Gate Journal ({filteredVehicles.length})
				</button>
			</div>

			{/* Movement Table */}
			{activeSubView === 'MOVEMENT' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredMovement.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No gate movement records found for this period.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Entry Ref</th>
										<th className="px-6 py-3">Individual / Visitor</th>
										<th className="px-6 py-3">Category</th>
										<th className="px-6 py-3">Check-In Time</th>
										<th className="px-6 py-3">Check-Out Time</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredMovement.map((m) => (
										<tr key={m.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">
												{m.id ? String(m.id).slice(0, 8) : 'LOG'}
											</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												{m.visitorName || m.staffName || 'Campus Visitor'}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{m.category || m.entryType || 'General'}</td>
											<td className="px-6 py-3.5 text-slate-500">{m.checkInAt ? String(m.checkInAt).slice(11, 16) : '—'}</td>
											<td className="px-6 py-3.5 text-slate-500">{m.checkOutAt ? String(m.checkOutAt).slice(11, 16) : 'Inside Campus'}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
													{m.status || 'LOGGED'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Passes Table */}
			{activeSubView === 'PASSES' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredPasses.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No visitor passes found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Pass ID</th>
										<th className="px-6 py-3">Visitor Name</th>
										<th className="px-6 py-3">Type</th>
										<th className="px-6 py-3">Created / Expected</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredPasses.map((p) => (
										<tr key={p.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{formatVisitorPassNumber(p.passNumber || p.id)}</td>
											<td className="px-6 py-3.5 font-semibold text-slate-800">
												{p.visitor?.name || 'Guest'}
											</td>
											<td className="px-6 py-3.5 text-slate-600">{p.passType}</td>
											<td className="px-6 py-3.5 text-slate-500">{p.expectedAt ? String(p.expectedAt).slice(0, 10) : String(p.createdAt).slice(0, 10)}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
													{p.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Vehicles Table */}
			{activeSubView === 'VEHICLES' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredVehicles.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No vehicle movement records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Vehicle Number</th>
										<th className="px-6 py-3">Driver Name</th>
										<th className="px-6 py-3">Transit Purpose</th>
										<th className="px-6 py-3">Entry Time</th>
										<th className="px-6 py-3">Exit Time</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredVehicles.map((v) => (
										<tr key={v.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{v.vehicleNo}</td>
											<td className="px-6 py-3.5 text-slate-700">{v.driverName}</td>
											<td className="px-6 py-3.5 text-slate-600">{v.purpose || 'Transport'}</td>
											<td className="px-6 py-3.5 text-slate-500">{v.entryAt ? String(v.entryAt).slice(11, 16) : '—'}</td>
											<td className="px-6 py-3.5 text-slate-500">{v.exitAt ? String(v.exitAt).slice(11, 16) : 'Parked'}</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
													{v.status || 'ENTERED'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
