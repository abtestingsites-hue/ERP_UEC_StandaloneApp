import React, { useState, useMemo } from 'react'
import { Ambulance, Truck, Gauge, DollarSign } from 'lucide-react'
import type { AmbulanceTrip, AmbulanceVehicle } from '../../ambulance/ambulance.types'
import type { ReportingPeriod } from '../reports.types'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportMetricCard } from '../components/ReportMetricCard'
import { exportToCsv } from '../utils/exportCsv'

interface AmbulanceReportsTabProps {
	trips: AmbulanceTrip[]
	vehicles: AmbulanceVehicle[]
	isLoading: boolean
	onRefresh: () => void
	activeUnitName: string
}

export const AmbulanceReportsTab: React.FC<AmbulanceReportsTabProps> = ({
	trips,
	vehicles,
	isLoading,
	onRefresh,
	activeUnitName,
}) => {
	const [period, setPeriod] = useState<ReportingPeriod>('ALL_TIME')
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSubView, setActiveSubView] = useState<'TRIPS' | 'FLEET' | 'BILLING'>('TRIPS')

	// Filter trips
	const filteredTrips = useMemo(() => {
		if (!searchTerm.trim()) return trips
		return trips.filter((t) => {
			const ref = t.refNo || ''
			const client = t.clientName || ''
			const dest = t.destination || ''
			return (
				ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
				client.toLowerCase().includes(searchTerm.toLowerCase()) ||
				dest.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})
	}, [trips, searchTerm])

	// Filter vehicles
	const filteredVehicles = useMemo(() => {
		if (!searchTerm.trim()) return vehicles
		return vehicles.filter((v) => {
			const vNo = v.vehicleNo || ''
			const type = v.type || ''
			return vNo.toLowerCase().includes(searchTerm.toLowerCase()) || type.toLowerCase().includes(searchTerm.toLowerCase())
		})
	}, [vehicles, searchTerm])

	// Filter billing
	const billableTrips = useMemo(() => {
		return filteredTrips.filter((t) => ['COMPLETED', 'BILLED'].includes(t.status))
	}, [filteredTrips])

	const availableVehiclesCount = useMemo(
		() => vehicles.filter((v) => v.status === 'AVAILABLE').length,
		[vehicles]
	)
	const activeTripsCount = useMemo(
		() => trips.filter((t) => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)).length,
		[trips]
	)
	const totalKmLogged = useMemo(() => {
		return trips.reduce((acc, t) => {
			if (t.kmStart != null && t.kmEnd != null && t.kmEnd >= t.kmStart) {
				return acc + (t.kmEnd - t.kmStart)
			}
			return acc
		}, 0)
	}, [trips])
	const totalBilledRevenue = useMemo(() => {
		return trips
			.filter((t) => t.status === 'BILLED')
			.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
	}, [trips])

	const handleExport = () => {
		if (activeSubView === 'TRIPS') {
			exportToCsv(
				'Ambulance_Trips_Report',
				[
					{ key: 'refNo', label: 'Trip Ref' },
					{ key: 'clientName', label: 'Client / Patient' },
					{ key: 'priority', label: 'Priority' },
					{ key: 'pickupLocation', label: 'Pickup' },
					{ key: 'destination', label: 'Destination' },
					{ key: 'status', label: 'Status' },
				],
				filteredTrips as unknown as Record<string, unknown>[]
			)
		} else if (activeSubView === 'FLEET') {
			exportToCsv(
				'Ambulance_Fleet_Report',
				[
					{ key: 'vehicleNo', label: 'Vehicle Number' },
					{ key: 'type', label: 'Type' },
					{ key: 'baseLocation', label: 'Base Location' },
					{ key: 'status', label: 'Operational Status' },
				],
				filteredVehicles as unknown as Record<string, unknown>[]
			)
		} else {
			exportToCsv(
				'Ambulance_Billing_Report',
				[
					{ key: 'refNo', label: 'Trip Ref' },
					{ key: 'clientName', label: 'Client' },
					{ key: 'totalAmount', label: 'Billed Amount (INR)' },
					{ key: 'status', label: 'Billing Status' },
				],
				billableTrips as unknown as Record<string, unknown>[]
			)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric Ribbon */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<ReportMetricCard
					title="Ambulances Ready"
					value={`${availableVehiclesCount} / ${vehicles.length}`}
					subtitle="Emergency Fleet Stationed"
					icon={Truck}
					accentColor="rose"
				/>
				<ReportMetricCard
					title="Active Road Dispatches"
					value={activeTripsCount}
					subtitle={`${trips.length} Total Registered Trips`}
					icon={Ambulance}
					accentColor="indigo"
				/>
				<ReportMetricCard
					title="Odometer Mileage Logged"
					value={`${totalKmLogged.toLocaleString()} KM`}
					subtitle="Field Transit Telemetry"
					icon={Gauge}
					accentColor="cyan"
				/>
				<ReportMetricCard
					title="Invoiced Transit Revenue"
					value={`₹${totalBilledRevenue.toLocaleString()}`}
					subtitle={`${trips.filter((t) => t.status === 'BILLED').length} Trips Settled`}
					icon={DollarSign}
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
				searchPlaceholder="Search trips by reference, client name, or destination..."
			/>

			{/* Sub-view switcher */}
			<div className="flex items-center gap-2 border-b border-slate-200 pb-3">
				<button
					onClick={() => setActiveSubView('TRIPS')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'TRIPS'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Transport Trips Log ({filteredTrips.length})
				</button>
				<button
					onClick={() => setActiveSubView('FLEET')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'FLEET'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Fleet Readiness ({filteredVehicles.length})
				</button>
				<button
					onClick={() => setActiveSubView('BILLING')}
					className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
						activeSubView === 'BILLING'
							? 'bg-primary-600 text-white'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}`}
				>
					Transport Billing ({billableTrips.length})
				</button>
			</div>

			{/* Trips Table */}
			{activeSubView === 'TRIPS' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredTrips.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No ambulance trip records found for this unit.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Trip Ref</th>
										<th className="px-6 py-3">Client / Patient</th>
										<th className="px-6 py-3">Route (From → To)</th>
										<th className="px-6 py-3">Vehicle & Driver</th>
										<th className="px-6 py-3">Priority</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredTrips.map((t) => (
										<tr key={t.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{t.refNo}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">
												{t.clientName || 'General Transit'}
											</td>
											<td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
												{t.pickupLocation || '—'} → {t.destination || '—'}
											</td>
											<td className="px-6 py-3.5 text-slate-700">
												{t.vehicle?.vehicleNo || 'Unassigned'}
												{t.driver?.name ? ` (${t.driver.name})` : ''}
											</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
														t.priority === 'EMERGENCY'
															? 'bg-rose-100 text-rose-800'
															: t.priority === 'URGENT'
																? 'bg-amber-100 text-amber-800'
																: 'bg-slate-100 text-slate-700'
													}`}
												>
													{t.priority || 'NORMAL'}
												</span>
											</td>
											<td className="px-6 py-3.5">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
													{t.status}
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

			{/* Fleet Table */}
			{activeSubView === 'FLEET' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{filteredVehicles.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No ambulance vehicles registered.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Vehicle Number</th>
										<th className="px-6 py-3">Vehicle Type</th>
										<th className="px-6 py-3">Station / Base</th>
										<th className="px-6 py-3">Operational Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredVehicles.map((v) => (
										<tr key={v.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">{v.vehicleNo}</td>
											<td className="px-6 py-3.5 text-slate-600">{v.type}</td>
											<td className="px-6 py-3.5 text-slate-700">{v.baseLocation || 'Emergency Bay'}</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
														v.status === 'AVAILABLE'
															? 'bg-emerald-50 text-emerald-700 border-emerald-200'
															: v.status === 'ON_TRIP'
																? 'bg-indigo-50 text-indigo-700 border-indigo-200'
																: 'bg-amber-50 text-amber-700 border-amber-200'
													}`}
												>
													{v.status}
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

			{/* Billing Table */}
			{activeSubView === 'BILLING' && (
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					{billableTrips.length === 0 ? (
						<div className="p-12 text-center text-slate-500 text-sm">
							No completed or billed transport trips recorded.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
									<tr>
										<th className="px-6 py-3">Trip Ref</th>
										<th className="px-6 py-3">Client</th>
										<th className="px-6 py-3">Fare Amount</th>
										<th className="px-6 py-3">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{billableTrips.map((b) => (
										<tr key={b.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-mono font-bold text-slate-900">{b.refNo}</td>
											<td className="px-6 py-3.5 font-bold text-slate-800">{b.clientName}</td>
											<td className="px-6 py-3.5 font-bold text-slate-900">
												₹{Number(b.totalAmount || 0).toLocaleString()}
											</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
														b.status === 'BILLED'
															? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
															: 'bg-amber-50 text-amber-700 border border-amber-200'
													}`}
												>
													{b.status === 'BILLED' ? 'Invoiced to Finance' : 'Pending Invoicing'}
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
