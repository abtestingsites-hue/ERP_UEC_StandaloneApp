import React, { useMemo } from 'react'
import { Radio, Truck, Clock } from 'lucide-react'
import type { AmbulanceTrip, AmbulanceVehicle } from '../ambulance.types'

interface DispatchManagementTabProps {
	trips: AmbulanceTrip[]
	vehicles: AmbulanceVehicle[]
	isLoading: boolean
	onRefresh: () => void
	onOpenDispatchModal: (trip: AmbulanceTrip) => void
	onOpenActionModal: (trip: AmbulanceTrip, action: 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED') => void
	onSelectTrip: (trip: AmbulanceTrip) => void
}

export const DispatchManagementTab: React.FC<DispatchManagementTabProps> = ({
	trips,
	vehicles,
	isLoading,
	onRefresh,
	onOpenDispatchModal,
	onOpenActionModal,
	onSelectTrip,
}) => {
	const pendingTrips = useMemo(
		() => trips.filter((t) => ['REQUESTED', 'DISPATCH_READY'].includes(t.status)),
		[trips],
	)

	const activeDispatches = useMemo(
		() => trips.filter((t) => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)),
		[trips],
	)

	const availableVehicles = useMemo(
		() => vehicles.filter((v) => v.status === 'AVAILABLE'),
		[vehicles],
	)

	return (
		<div className="space-y-6">
			{/* Top Dispatch KPI Bar */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-amber-700">
						Trips Awaiting Dispatch
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-800">{pendingTrips.length}</div>
					<div className="mt-0.5 text-xs text-amber-600">
						{pendingTrips.filter((t) => t.priority === 'EMERGENCY').length} critical emergency
					</div>
				</div>

				<div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-indigo-700">
						Active Ambulances On Run
					</div>
					<div className="mt-1 text-2xl font-bold text-indigo-800">
						{activeDispatches.length}
					</div>
					<div className="mt-0.5 text-xs text-indigo-600">Dispatched, en route, or on site</div>
				</div>

				<div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
					<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
						Fleet Available to Dispatch
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-800">
						{availableVehicles.length}
					</div>
					<div className="mt-0.5 text-xs text-emerald-600">
						of {vehicles.length} registered vehicles ready
					</div>
				</div>
			</div>

			{/* Section 1: Pending Queue */}
			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<Radio className="h-4 w-4 text-amber-600" />
						<h3 className="text-sm font-bold text-slate-900">
							Dispatch Queue — Needs Vehicle & Driver Allocation ({pendingTrips.length})
						</h3>
					</div>
					<button
						type="button"
						onClick={onRefresh}
						disabled={isLoading}
						className="text-xs font-medium text-slate-500 hover:text-slate-800"
					>
						Refresh
					</button>
				</div>

				{pendingTrips.length === 0 ? (
					<div className="py-8 text-center text-xs text-slate-400">
						No pending transport trips in queue. All requests have been dispatched or completed.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
						{pendingTrips.map((trip) => (
							<div
								key={trip.id}
								className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 hover:border-indigo-300 transition"
							>
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs font-bold text-slate-900">
										{trip.refNo}
									</span>
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
											trip.priority === 'EMERGENCY'
												? 'bg-rose-100 text-rose-800'
												: trip.priority === 'URGENT'
													? 'bg-amber-100 text-amber-800'
													: 'bg-slate-200 text-slate-700'
										}`}
									>
										{trip.priority || 'NORMAL'}
									</span>
								</div>

								<div className="text-xs space-y-1">
									<div className="font-semibold text-slate-800">
										{trip.clientName || 'Patient Transfer'}
									</div>
									<div className="text-slate-500 line-clamp-1">
										<strong>From:</strong> {trip.pickupLocation || '—'}
									</div>
									<div className="text-slate-500 line-clamp-1">
										<strong>To:</strong> {trip.destination || '—'}
									</div>
									{trip.tripNotes && (
										<div className="text-[11px] text-slate-400 italic line-clamp-1">
											"{trip.tripNotes}"
										</div>
									)}
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
									<button
										type="button"
										onClick={() => onSelectTrip(trip)}
										className="text-xs text-slate-500 hover:text-slate-800 font-medium"
									>
										Details
									</button>

									<button
										type="button"
										onClick={() => onOpenDispatchModal(trip)}
										disabled={availableVehicles.length === 0}
										className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
									>
										<Radio size={12} />
										<span>Dispatch Now</span>
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Section 2: Active Dispatches Console */}
			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<Truck className="h-4 w-4 text-indigo-600" />
						<h3 className="text-sm font-bold text-slate-900">
							Active Runs in Progress ({activeDispatches.length})
						</h3>
					</div>
				</div>

				{activeDispatches.length === 0 ? (
					<div className="py-8 text-center text-xs text-slate-400">
						No ambulances currently on an active run.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-100 text-left text-xs">
							<thead>
								<tr className="text-slate-400 font-medium">
									<th className="pb-2.5">Trip & Patient</th>
									<th className="pb-2.5">Assigned Vehicle</th>
									<th className="pb-2.5">Assigned Driver</th>
									<th className="pb-2.5">Dispatch Time</th>
									<th className="pb-2.5">Status</th>
									<th className="pb-2.5 text-right">Telemetry Progression</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-slate-700">
								{activeDispatches.map((trip) => (
									<tr
										key={trip.id}
										className="hover:bg-slate-50/70 transition cursor-pointer"
										onClick={() => onSelectTrip(trip)}
									>
										<td className="py-3">
											<div className="font-mono font-bold text-slate-900">{trip.refNo}</div>
											<div className="text-slate-500">{trip.clientName || 'Patient Run'}</div>
										</td>

										<td className="py-3">
											<div className="font-mono font-bold text-slate-800">
												{trip.vehicle?.vehicleNo || 'Unassigned'}
											</div>
											<div className="text-slate-400 text-[11px]">{trip.vehicle?.type}</div>
										</td>

										<td className="py-3">
											<div className="font-medium text-slate-800">
												{trip.driver ? trip.driver.name : 'No driver logged'}
											</div>
											{trip.driver?.empId && (
												<div className="text-slate-400 text-[10px] font-mono">
													{trip.driver.empId}
												</div>
											)}
										</td>

										<td className="py-3 text-slate-500">
											{trip.dispatchTime ? (
												<div className="flex items-center gap-1">
													<Clock size={11} className="text-slate-400" />
													<span>{new Date(trip.dispatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
												</div>
											) : (
												'—'
											)}
										</td>

										<td className="py-3">
											<span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
												{trip.status.replace('_', ' ')}
											</span>
										</td>

										<td
											className="py-3 text-right"
											onClick={(e) => e.stopPropagation()}
										>
											<div className="inline-flex items-center gap-1.5">
												{trip.status === 'DISPATCHED' && (
													<button
														type="button"
														onClick={() => onOpenActionModal(trip, 'EN_ROUTE')}
														className="rounded border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
													>
														Start En Route
													</button>
												)}
												{trip.status === 'EN_ROUTE' && (
													<button
														type="button"
														onClick={() => onOpenActionModal(trip, 'ARRIVED')}
														className="rounded border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
													>
														Mark Arrived
													</button>
												)}
												{trip.status === 'ARRIVED' && (
													<button
														type="button"
														onClick={() => onOpenActionModal(trip, 'COMPLETED')}
														className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
													>
														Complete Run
													</button>
												)}
												<button
													type="button"
													onClick={() => onOpenActionModal(trip, 'CANCELLED')}
													className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
												>
													Cancel
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
