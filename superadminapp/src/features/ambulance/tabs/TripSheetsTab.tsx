import React, { useState, useMemo } from 'react'
import { ClipboardList, Gauge, RefreshCw, Eye, ArrowRight, Play, CheckCircle2, Navigation } from 'lucide-react'
import type { AmbulanceTrip } from '../ambulance.types'

interface TripSheetsTabProps {
	trips: AmbulanceTrip[]
	isLoading: boolean
	onRefresh: () => void
	onOpenActionModal: (trip: AmbulanceTrip, action: 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED') => void
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

export const TripSheetsTab: React.FC<TripSheetsTabProps> = ({
	trips,
	isLoading,
	onRefresh,
	onOpenActionModal,
	onSelectTrip,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')

	// Focus trips that are or were dispatched
	const tripsheetCandidates = useMemo(() => {
		return trips.filter((t) =>
			['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'BILLED'].includes(t.status)
		)
	}, [trips])

	const filteredTrips = useMemo(() => {
		return tripsheetCandidates.filter((t) => {
			const matchesSearch =
				t.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.vehicle?.vehicleNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())

			let matchesStatus = true
			if (statusFilter === 'ACTIVE') {
				matchesStatus = ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)
			} else if (statusFilter === 'CLOSED') {
				matchesStatus = ['COMPLETED', 'BILLED'].includes(t.status)
			} else if (statusFilter !== 'ALL') {
				matchesStatus = t.status === statusFilter
			}

			return matchesSearch && matchesStatus
		})
	}, [tripsheetCandidates, searchTerm, statusFilter])

	const activeCount = trips.filter((t) => ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(t.status)).length
	const completedCount = trips.filter((t) => ['COMPLETED', 'BILLED'].includes(t.status)).length
	const totalKmLogged = useMemo(() => {
		return trips.reduce((acc, t) => {
			if (t.kmStart != null && t.kmEnd != null && t.kmEnd >= t.kmStart) {
				return acc + (t.kmEnd - t.kmStart)
			}
			return acc
		}, 0)
	}, [trips])

	return (
		<div className="space-y-6">
			{/* Quick KPI summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Road Trips</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</p>
					</div>
					<span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
						<Navigation className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closed Trips</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
					</div>
					<span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
						<CheckCircle2 className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Distance Recorded</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">{totalKmLogged.toLocaleString()} KM</p>
					</div>
					<span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
						<Gauge className="w-5 h-5" />
					</span>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
				<div className="flex flex-1 gap-3 w-full md:w-auto">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search by ref no, vehicle, driver, or patient..."
						className="w-full max-w-sm px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
					>
						<option value="ACTIVE">Active in Field (Dispatched, En Route, Arrived)</option>
						<option value="ALL">All Tripsheet Records</option>
						<option value="DISPATCHED">Dispatched Only</option>
						<option value="EN_ROUTE">En Route Only</option>
						<option value="ARRIVED">Arrived Only</option>
						<option value="COMPLETED">Completed Only</option>
						<option value="BILLED">Billed Only</option>
						<option value="CLOSED">All Closed (Completed & Billed)</option>
					</select>
				</div>
				<button
					onClick={onRefresh}
					disabled={isLoading}
					className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
				>
					<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
					Refresh
				</button>
			</div>

			{/* Trip Sheets Table */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ClipboardList className="w-5 h-5 text-primary-600" />
						<h3 className="font-bold text-slate-800">Trip Sheets & Field Telemetry</h3>
						<span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
							{filteredTrips.length} records
						</span>
					</div>
				</div>

				{filteredTrips.length === 0 ? (
					<div className="p-12 text-center text-slate-500">
						<p className="text-base font-semibold">No trip sheet records found.</p>
						<p className="text-xs text-slate-400 mt-1">
							Trips appear here once they are dispatched from the booking or dispatch queue.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm text-slate-700">
							<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
								<tr>
									<th className="px-6 py-3">Trip / Client</th>
									<th className="px-6 py-3">Assigned Fleet & Crew</th>
									<th className="px-6 py-3">Route Details</th>
									<th className="px-6 py-3">Odometer Telemetry</th>
									<th className="px-6 py-3">Timeline</th>
									<th className="px-6 py-3">Status</th>
									<th className="px-6 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredTrips.map((trip) => {
									const kmDiff =
										trip.kmStart != null && trip.kmEnd != null
											? trip.kmEnd - trip.kmStart
											: null

									return (
										<tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
											<td className="px-6 py-4">
												<div className="font-bold text-slate-900">{trip.refNo}</div>
												<div className="text-xs text-slate-500">{trip.clientName || 'General Transit'}</div>
												{trip.mobile && (
													<div className="text-xs text-slate-400">{trip.mobile}</div>
												)}
											</td>
											<td className="px-6 py-4">
												{trip.vehicle ? (
													<div className="font-semibold text-slate-800">
														{trip.vehicle.vehicleNo}
														<span className="text-xs font-normal text-slate-500 ml-1.5">
															({trip.vehicle.type})
														</span>
													</div>
												) : (
													<span className="text-xs text-amber-600 font-medium">Unassigned Vehicle</span>
												)}
												<div className="text-xs text-slate-500">
													Driver: {trip.driver?.name || 'Unassigned'}
												</div>
											</td>
											<td className="px-6 py-4 max-w-xs">
												<div className="text-xs">
													<span className="text-slate-400 font-medium">From:</span>{' '}
													<span className="font-medium text-slate-700">{trip.pickupLocation || '—'}</span>
												</div>
												<div className="text-xs flex items-center gap-1 mt-0.5">
													<ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
													<span className="text-slate-400 font-medium">To:</span>{' '}
													<span className="font-medium text-slate-700">{trip.destination || '—'}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<Gauge className="w-4 h-4 text-slate-400" />
													<div>
														<div className="text-xs">
															<span className="text-slate-400">Start:</span>{' '}
															<span className="font-semibold text-slate-800">
																{trip.kmStart != null ? `${trip.kmStart} km` : '—'}
															</span>
														</div>
														<div className="text-xs">
															<span className="text-slate-400">End:</span>{' '}
															<span className="font-semibold text-slate-800">
																{trip.kmEnd != null ? `${trip.kmEnd} km` : '—'}
															</span>
														</div>
														{kmDiff != null && (
															<div className="text-xs text-primary-600 font-bold mt-0.5">
																Net: {kmDiff} km
															</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 text-xs text-slate-500">
												{trip.dispatchTime && (
													<div>
														<span className="text-slate-400">Disp:</span>{' '}
														{new Date(trip.dispatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</div>
												)}
												{trip.completionTime && (
													<div>
														<span className="text-slate-400">Comp:</span>{' '}
														{new Date(trip.completionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</div>
												)}
												{!trip.dispatchTime && !trip.completionTime && (
													<span className="text-slate-400">Pending</span>
												)}
											</td>
											<td className="px-6 py-4">
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
														statusBadgeClasses[trip.status] || 'bg-slate-100 text-slate-700 border-slate-200'
													}`}
												>
													{trip.status}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-1.5">
													{trip.status === 'DISPATCHED' && (
														<button
															onClick={() => onOpenActionModal(trip, 'EN_ROUTE')}
															className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
															title="Start Transport (En Route)"
														>
															<Play className="w-3.5 h-3.5" />
															Start Run
														</button>
													)}
													{trip.status === 'EN_ROUTE' && (
														<>
															<button
																onClick={() => onOpenActionModal(trip, 'ARRIVED')}
																className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded transition-colors"
																title="Mark Arrived"
															>
																Arrived
															</button>
															<button
																onClick={() => onOpenActionModal(trip, 'COMPLETED')}
																className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
																title="Complete Trip"
															>
																<CheckCircle2 className="w-3.5 h-3.5" />
																Complete
															</button>
														</>
													)}
													{trip.status === 'ARRIVED' && (
														<button
															onClick={() => onOpenActionModal(trip, 'COMPLETED')}
															className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
															title="Complete Trip"
														>
															<CheckCircle2 className="w-3.5 h-3.5" />
															Complete
														</button>
													)}
													<button
														onClick={() => onSelectTrip(trip)}
														className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
														title="View Trip Dossier"
													>
														<Eye className="w-4 h-4" />
													</button>
												</div>
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
	)
}
