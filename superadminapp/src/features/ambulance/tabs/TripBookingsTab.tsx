import React, { useState, useMemo } from 'react'
import { Plus, RefreshCw, Radio, Search } from 'lucide-react'
import type { AmbulanceTrip } from '../ambulance.types'

interface TripBookingsTabProps {
	trips: AmbulanceTrip[]
	isLoading: boolean
	onRefresh: () => void
	onOpenBookModal: () => void
	onOpenDispatchModal: (trip: AmbulanceTrip) => void
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

export const TripBookingsTab: React.FC<TripBookingsTabProps> = ({
	trips,
	isLoading,
	onRefresh,
	onOpenBookModal,
	onOpenDispatchModal,
	onOpenActionModal,
	onSelectTrip,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedPriority, setSelectedPriority] = useState('ALL')
	const [selectedStatus, setSelectedStatus] = useState('ALL')

	const filteredTrips = useMemo(() => {
		return trips.filter((t) => {
			const matchesSearch =
				t.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.mobile || '').includes(searchTerm) ||
				(t.pickupLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(t.destination || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesPriority =
				selectedPriority === 'ALL' || (t.priority || 'NORMAL') === selectedPriority

			const matchesStatus =
				selectedStatus === 'ALL' || t.status === selectedStatus

			return matchesSearch && matchesPriority && matchesStatus
		})
	}, [trips, searchTerm, selectedPriority, selectedStatus])

	return (
		<div className="space-y-6">
			{/* Filter & Action Controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-3">
					<div className="relative min-w-[240px] flex-1">
						<input
							type="text"
							placeholder="Search by ref no, client, mobile, pickup, dest..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
						/>
						<Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
					</div>

					<select
						value={selectedPriority}
						onChange={(e) => setSelectedPriority(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Priorities</option>
						<option value="EMERGENCY">Emergency</option>
						<option value="URGENT">Urgent</option>
						<option value="NORMAL">Normal / Scheduled</option>
					</select>

					<select
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
						className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
					>
						<option value="ALL">All Statuses</option>
						<option value="REQUESTED">Requested</option>
						<option value="DISPATCHED">Dispatched</option>
						<option value="EN_ROUTE">En Route</option>
						<option value="ARRIVED">Arrived</option>
						<option value="COMPLETED">Completed</option>
						<option value="BILLED">Billed</option>
						<option value="CANCELLED">Cancelled</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onRefresh}
						disabled={isLoading}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
					>
						<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
						<span>Refresh</span>
					</button>

					<button
						type="button"
						onClick={onOpenBookModal}
						className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
					>
						<Plus size={16} />
						<span>Book Transport</span>
					</button>
				</div>
			</div>

			{/* Trips Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
							<tr>
								<th className="px-4 py-3.5">Ref No & Date</th>
								<th className="px-4 py-3.5">Patient / Contact</th>
								<th className="px-4 py-3.5">Route (Pickup → Destination)</th>
								<th className="px-4 py-3.5">Priority</th>
								<th className="px-4 py-3.5">Assigned Fleet</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{isLoading && trips.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										<div className="inline-flex items-center gap-2">
											<RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
											<span>Loading transport trips...</span>
										</div>
									</td>
								</tr>
							) : filteredTrips.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										No transport trips match the selected criteria.
									</td>
								</tr>
							) : (
								filteredTrips.map((trip) => {
									const statusCls =
										statusBadgeClasses[trip.status] ||
										'bg-slate-100 text-slate-700 border-slate-200'

									const isDispatchable = ['REQUESTED', 'DISPATCH_READY'].includes(trip.status)

									return (
										<tr
											key={trip.id}
											className="hover:bg-slate-50/70 transition cursor-pointer"
											onClick={() => onSelectTrip(trip)}
										>
											<td className="px-4 py-3.5">
												<div className="font-mono font-bold text-slate-900">{trip.refNo}</div>
												<div className="text-xs text-slate-400">
													{new Date(trip.createdAt).toLocaleDateString()}
												</div>
											</td>

											<td className="px-4 py-3.5">
												<div className="font-medium text-slate-900">
													{trip.clientName || 'Patient Transport'}
												</div>
												<div className="text-xs text-slate-400">{trip.mobile || '—'}</div>
											</td>

											<td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs">
												<div className="font-medium text-slate-800 truncate">
													{trip.pickupLocation || '—'}
												</div>
												<div className="text-slate-400 truncate">
													→ {trip.destination || 'Unspecified dest'}
												</div>
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
														trip.priority === 'EMERGENCY'
															? 'bg-rose-100 text-rose-800'
															: trip.priority === 'URGENT'
																? 'bg-amber-100 text-amber-800'
																: 'bg-slate-100 text-slate-700'
													}`}
												>
													{trip.priority || 'NORMAL'}
												</span>
											</td>

											<td className="px-4 py-3.5 text-xs">
												{trip.vehicle ? (
													<div>
														<span className="font-mono font-bold text-slate-800">
															{trip.vehicle.vehicleNo}
														</span>
														<div className="text-slate-400">
															{trip.driver ? trip.driver.name : 'Crew unassigned'}
														</div>
													</div>
												) : (
													<span className="text-slate-400 italic">Not Dispatched</span>
												)}
											</td>

											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCls}`}
												>
													{trip.status.replace('_', ' ')}
												</span>
											</td>

											<td
												className="px-4 py-3.5 text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<div className="inline-flex items-center gap-1.5">
													{isDispatchable && (
														<button
															type="button"
															onClick={() => onOpenDispatchModal(trip)}
															className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
														>
															<Radio size={12} />
															<span>Dispatch</span>
														</button>
													)}

													{trip.status === 'DISPATCHED' && (
														<button
															type="button"
															onClick={() => onOpenActionModal(trip, 'EN_ROUTE')}
															className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
														>
															En Route
														</button>
													)}

													{trip.status === 'EN_ROUTE' && (
														<button
															type="button"
															onClick={() => onOpenActionModal(trip, 'ARRIVED')}
															className="inline-flex items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
														>
															Arrived
														</button>
													)}

													{trip.status === 'ARRIVED' && (
														<button
															type="button"
															onClick={() => onOpenActionModal(trip, 'COMPLETED')}
															className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
														>
															Complete
														</button>
													)}

													<button
														type="button"
														onClick={() => onSelectTrip(trip)}
														className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
													>
														Dossier
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
					<span>
						Showing <strong>{filteredTrips.length}</strong> of <strong>{trips.length}</strong> transport trips
					</span>
					<span>Authorized Emergency Transport Registry</span>
				</div>
			</div>
		</div>
	)
}
