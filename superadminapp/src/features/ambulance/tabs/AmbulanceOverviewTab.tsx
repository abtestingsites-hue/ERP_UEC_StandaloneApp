import React, { useMemo } from 'react'
import {
	Ambulance,
	Plus,
	Radio,
	Receipt,
	Truck,
} from 'lucide-react'
import type { AmbulanceTrip, AmbulanceVehicle } from '../ambulance.types'

interface AmbulanceOverviewTabProps {
	trips: AmbulanceTrip[]
	vehicles: AmbulanceVehicle[]
	isLoading: boolean
	onNavigateTab: (tabKey: string) => void
	onOpenBookModal: () => void
	onOpenAddVehicleModal: () => void
	onSelectTrip: (trip: AmbulanceTrip) => void
}

const statusBadgeClasses: Record<string, string> = {
	REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
	DISPATCH_READY: 'bg-blue-50 text-blue-700 border-blue-200',
	DISPATCHED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
	EN_ROUTE: 'bg-purple-50 text-purple-700 border-purple-200',
	ARRIVED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
	COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	BILLED: 'bg-slate-100 text-slate-800 border-slate-300',
	CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
}

const vehicleStatusBadges: Record<string, string> = {
	AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	ON_TRIP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
	MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
}

export const AmbulanceOverviewTab: React.FC<AmbulanceOverviewTabProps> = ({
	trips,
	vehicles,
	isLoading,
	onNavigateTab,
	onOpenBookModal,
	onOpenAddVehicleModal,
	onSelectTrip,
}) => {
	const counts = useMemo(() => {
		const activeDispatches = trips.filter((t) =>
			['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status),
		).length

		const pendingBookings = trips.filter((t) =>
			['REQUESTED', 'DISPATCH_READY'].includes(t.status),
		).length

		const completed = trips.filter((t) => t.status === 'COMPLETED').length
		const billed = trips.filter((t) => t.status === 'BILLED').length

		const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length
		const onTripVehicles = vehicles.filter((v) => v.status === 'ON_TRIP').length
		const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length

		return {
			totalTrips: trips.length,
			activeDispatches,
			pendingBookings,
			completed,
			billed,
			totalVehicles: vehicles.length,
			availableVehicles,
			onTripVehicles,
			maintenanceVehicles,
		}
	}, [trips, vehicles])

	return (
		<div className="space-y-6">
			{/* KPI Ribbon */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
						Total Transport Trips
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-900">{counts.totalTrips}</div>
					<div className="mt-0.5 text-[11px] text-slate-400">
						{counts.pendingBookings} pending dispatch
					</div>
				</div>

				<div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-indigo-700">
						Active Dispatches
					</div>
					<div className="mt-1 text-2xl font-bold text-indigo-700">
						{counts.activeDispatches}
					</div>
					<div className="mt-0.5 text-[11px] text-indigo-500">Ambulances en route / on site</div>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Available Fleet
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700">
						{counts.availableVehicles}
					</div>
					<div className="mt-0.5 text-[11px] text-emerald-600">
						of {counts.totalVehicles} registered vehicles
					</div>
				</div>

				<div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-amber-700">
						In Maintenance
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700">
						{counts.maintenanceVehicles}
					</div>
					<div className="mt-0.5 text-[11px] text-amber-600">Vehicles servicing / inspection</div>
				</div>

				<div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-purple-700">
						Unbilled Completed
					</div>
					<div className="mt-1 text-2xl font-bold text-purple-700">{counts.completed}</div>
					<div className="mt-0.5 text-[11px] text-purple-600">Ready for Finance invoicing</div>
				</div>
			</div>

			{/* Operational Shortcuts Bar */}
			<div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
				<div>
					<h3 className="text-sm font-bold text-slate-900">
						Ambulance Dispatch & Fleet Operations
					</h3>
					<p className="text-xs text-slate-500">
						Coordinate emergency transfers, assign drivers, log trip telemetry, and bill completed runs.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={onOpenBookModal}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
					>
						<Plus size={14} />
						<span>Book Transport</span>
					</button>

					<button
						type="button"
						onClick={onOpenAddVehicleModal}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
					>
						<Truck size={14} className="text-slate-500" />
						<span>Add Vehicle</span>
					</button>

					<button
						type="button"
						onClick={() => onNavigateTab('dispatch')}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
					>
						<Radio size={14} className="text-indigo-600" />
						<span>Dispatch Console</span>
					</button>

					<button
						type="button"
						onClick={() => onNavigateTab('billing')}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
					>
						<Receipt size={14} className="text-purple-600" />
						<span>Billable Trips ({counts.completed})</span>
					</button>
				</div>
			</div>

			{/* Main Grid: Fleet Status + Recent Dispatches */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Fleet Readiness Status */}
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
					<div className="flex items-center justify-between border-b border-slate-100 pb-3">
						<div className="flex items-center gap-2">
							<Truck size={16} className="text-indigo-600" />
							<h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
								Fleet Readiness Status
							</h4>
						</div>
						<button
							type="button"
							onClick={() => onNavigateTab('fleet')}
							className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
						>
							Manage Fleet ({vehicles.length}) →
						</button>
					</div>

					{isLoading && vehicles.length === 0 ? (
						<div className="py-8 text-center text-xs text-slate-400">Loading fleet records...</div>
					) : vehicles.length === 0 ? (
						<div className="py-8 text-center text-xs text-slate-400">
							No ambulance vehicles registered. Use "Add Vehicle" to register fleet.
						</div>
					) : (
						<div className="space-y-2.5">
							{vehicles.map((v) => {
								const badgeCls =
									vehicleStatusBadges[v.status] ||
									'bg-slate-100 text-slate-700 border-slate-200'
								return (
									<div
										key={v.id}
										className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 transition hover:bg-slate-100/70"
									>
										<div>
											<div className="font-mono text-xs font-bold text-slate-900">
												{v.vehicleNo}
											</div>
											<div className="text-[11px] text-slate-500">{v.type}</div>
											{v.baseLocation && (
												<div className="text-[10px] text-slate-400">Base: {v.baseLocation}</div>
											)}
										</div>
										<span
											className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeCls}`}
										>
											{v.status.replace('_', ' ')}
										</span>
									</div>
								)
							})}
						</div>
					)}
				</div>

				{/* Recent Dispatches & Trips */}
				<div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
					<div className="flex items-center justify-between border-b border-slate-100 pb-3">
						<div className="flex items-center gap-2">
							<Ambulance size={16} className="text-indigo-600" />
							<h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
								Recent Transport Dispatches & Runs
							</h4>
						</div>
						<button
							type="button"
							onClick={() => onNavigateTab('bookings')}
							className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
						>
							View All Runs ({trips.length}) →
						</button>
					</div>

					{isLoading && trips.length === 0 ? (
						<div className="py-12 text-center text-xs text-slate-400">Loading trip logs...</div>
					) : trips.length === 0 ? (
						<div className="py-12 text-center text-xs text-slate-400">
							No ambulance transport trips recorded. Click "Book Transport" to create a new run.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-100 text-left text-xs">
								<thead>
									<tr className="text-slate-400 font-medium">
										<th className="pb-2">Trip Ref</th>
										<th className="pb-2">Patient / Route</th>
										<th className="pb-2">Vehicle & Driver</th>
										<th className="pb-2">Status</th>
										<th className="pb-2 text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-700">
									{trips.slice(0, 5).map((trip) => {
										const statusCls =
											statusBadgeClasses[trip.status] ||
											'bg-slate-100 text-slate-700 border-slate-200'
										return (
											<tr
												key={trip.id}
												className="hover:bg-slate-50/70 transition cursor-pointer"
												onClick={() => onSelectTrip(trip)}
											>
												<td className="py-3">
													<div className="font-mono font-bold text-slate-900">{trip.refNo}</div>
													<div className="text-[10px] text-slate-400">
														{new Date(trip.createdAt).toLocaleDateString()}
													</div>
												</td>

												<td className="py-3">
													<div className="font-medium text-slate-900">
														{trip.clientName || 'Patient Transport'}
													</div>
													<div className="text-slate-500 line-clamp-1 max-w-xs">
														{trip.pickupLocation || '—'} → {trip.destination || '—'}
													</div>
												</td>

												<td className="py-3">
													<div className="font-mono font-medium text-slate-800">
														{trip.vehicle ? trip.vehicle.vehicleNo : 'Unallocated'}
													</div>
													<div className="text-slate-400 text-[11px]">
														{trip.driver ? trip.driver.name : 'No driver'}
													</div>
												</td>

												<td className="py-3">
													<span
														className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusCls}`}
													>
														{trip.status.replace('_', ' ')}
													</span>
												</td>

												<td className="py-3 text-right">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation()
															onSelectTrip(trip)
														}}
														className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
													>
														View →
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
