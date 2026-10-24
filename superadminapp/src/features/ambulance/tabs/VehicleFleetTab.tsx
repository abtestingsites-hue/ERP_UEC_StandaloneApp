import React, { useState, useMemo } from 'react'
import { Truck, Plus, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react'
import type { AmbulanceVehicle, VehicleStatus } from '../ambulance.types'

interface VehicleFleetTabProps {
	vehicles: AmbulanceVehicle[]
	isLoading: boolean
	onRefresh: () => void
	onOpenAddVehicleModal: () => void
	onUpdateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>
}

const statusBadgeClasses: Record<VehicleStatus, string> = {
	AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	ON_TRIP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
	MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
}

export const VehicleFleetTab: React.FC<VehicleFleetTabProps> = ({
	vehicles,
	isLoading,
	onRefresh,
	onOpenAddVehicleModal,
	onUpdateVehicleStatus,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('ALL')
	const [updatingVehicleId, setUpdatingVehicleId] = useState<string | null>(null)

	const filteredVehicles = useMemo(() => {
		return vehicles.filter((v) => {
			const matchesSearch =
				v.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(v.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(v.baseLocation || '').toLowerCase().includes(searchTerm.toLowerCase())

			const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter

			return matchesSearch && matchesStatus
		})
	}, [vehicles, searchTerm, statusFilter])

	const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length
	const onTripCount = vehicles.filter((v) => v.status === 'ON_TRIP').length
	const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length

	const handleStatusSelect = async (vehicleId: string, newStatus: VehicleStatus) => {
		try {
			setUpdatingVehicleId(vehicleId)
			await onUpdateVehicleStatus(vehicleId, newStatus)
		} finally {
			setUpdatingVehicleId(null)
		}
	}

	return (
		<div className="space-y-6">
			{/* Metric KPI cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet Size</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">{vehicles.length}</p>
					</div>
					<span className="p-3 bg-slate-100 text-slate-700 rounded-xl">
						<Truck className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available For Call</p>
						<p className="text-2xl font-bold text-emerald-600 mt-1">{availableCount}</p>
					</div>
					<span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
						<CheckCircle2 className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched / On Trip</p>
						<p className="text-2xl font-bold text-indigo-600 mt-1">{onTripCount}</p>
					</div>
					<span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
						<ShieldCheck className="w-5 h-5" />
					</span>
				</div>
				<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Maintenance</p>
						<p className="text-2xl font-bold text-amber-600 mt-1">{maintenanceCount}</p>
					</div>
					<span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
						<AlertTriangle className="w-5 h-5" />
					</span>
				</div>
			</div>

			{/* Filter & Action Bar */}
			<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
				<div className="flex flex-1 gap-3 w-full md:w-auto">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search by registration number, type, or station..."
						className="w-full max-w-sm px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
					>
						<option value="ALL">All Readiness Statuses</option>
						<option value="AVAILABLE">Available</option>
						<option value="ON_TRIP">On Trip</option>
						<option value="MAINTENANCE">Maintenance</option>
					</select>
				</div>
				<div className="flex items-center gap-3 w-full md:w-auto justify-end">
					<button
						onClick={onRefresh}
						disabled={isLoading}
						className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						Refresh
					</button>
					<button
						onClick={onOpenAddVehicleModal}
						className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
					>
						<Plus className="w-4 h-4" />
						Add Ambulance
					</button>
				</div>
			</div>

			{/* Vehicle Fleet Table */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Truck className="w-5 h-5 text-primary-600" />
						<h3 className="font-bold text-slate-800">Fleet Asset Register</h3>
						<span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
							{filteredVehicles.length} vehicles
						</span>
					</div>
				</div>

				{filteredVehicles.length === 0 ? (
					<div className="p-12 text-center text-slate-500">
						<p className="text-base font-semibold">No ambulance vehicles match your query.</p>
						<p className="text-xs text-slate-400 mt-1">Register a new ambulance vehicle above to get started.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm text-slate-700">
							<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
								<tr>
									<th className="px-6 py-3">Vehicle Details</th>
									<th className="px-6 py-3">Type & Equipment</th>
									<th className="px-6 py-3">Base Location / Station</th>
									<th className="px-6 py-3">Current Status</th>
									<th className="px-6 py-3">Last Updated</th>
									<th className="px-6 py-3 text-right">Operational Status Control</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredVehicles.map((vehicle) => {
									const isUpdating = updatingVehicleId === vehicle.id

									return (
										<tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
														<Truck className="w-5 h-5" />
													</div>
													<div>
														<div className="font-bold text-slate-900">{vehicle.vehicleNo}</div>
														<div className="text-xs text-slate-500">ID: {vehicle.id.slice(0, 8)}...</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
													{vehicle.type || 'Standard Transit'}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-1.5 text-slate-700 text-xs">
													<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span>{vehicle.baseLocation || 'Main Emergency Bay'}</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
														statusBadgeClasses[vehicle.status] || 'bg-slate-100 text-slate-700'
													}`}
												>
													{vehicle.status}
												</span>
											</td>
											<td className="px-6 py-4 text-xs text-slate-500">
												{vehicle.updatedAt
													? new Date(vehicle.updatedAt).toLocaleDateString([], {
															year: 'numeric',
															month: 'short',
															day: 'numeric',
													  })
													: '—'}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="inline-flex items-center gap-2">
													{isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />}
													<select
														value={vehicle.status}
														onChange={(e) => handleStatusSelect(vehicle.id, e.target.value as VehicleStatus)}
														disabled={isUpdating}
														className="text-xs font-medium border border-slate-300 rounded px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
													>
														<option value="AVAILABLE">AVAILABLE</option>
														<option value="ON_TRIP">ON_TRIP</option>
														<option value="MAINTENANCE">MAINTENANCE</option>
													</select>
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
