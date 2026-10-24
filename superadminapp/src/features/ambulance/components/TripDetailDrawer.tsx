import React from 'react'
import {
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	MapPin,
	Phone,
	Receipt,
	Truck,
	User,
	Users,
	X,
} from 'lucide-react'
import type { AmbulanceTrip } from '../ambulance.types'

interface TripDetailDrawerProps {
	trip: AmbulanceTrip | null
	isOpen: boolean
	onClose: () => void
	onGenerateInvoice?: (trip: AmbulanceTrip, amount?: number) => void
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

export const TripDetailDrawer: React.FC<TripDetailDrawerProps> = ({
	trip,
	isOpen,
	onClose,
	onGenerateInvoice,
}) => {
	if (!isOpen || !trip) return null

	const handleInvoice = () => {
		if (!onGenerateInvoice || !trip) return
		let billingAmount: number | undefined = trip.totalAmount && trip.totalAmount > 0 ? trip.totalAmount : undefined

		if (!billingAmount) {
			const distance =
				trip.kmStart != null && trip.kmEnd != null && trip.kmEnd >= trip.kmStart
					? trip.kmEnd - trip.kmStart
					: 0
			const suggestedAmount = distance > 0 ? distance * 20 : 500
			const promptMsg =
				`Trip ${trip.refNo} has ${distance > 0 ? `${distance} km logged` : 'no distance logged'}.\n` +
				`Standard rate (₹20/km): ₹${suggestedAmount}.\n\n` +
				`Enter billing amount in ₹ for Finance Invoice:`

			const input = window.prompt(promptMsg, String(suggestedAmount))
			if (input === null) return
			const parsed = parseFloat(input.trim())
			if (isNaN(parsed) || parsed <= 0) {
				alert('Please enter a valid billing amount greater than ₹0.')
				return
			}
			billingAmount = parsed
		} else {
			if (
				!window.confirm(
					`Generate authoritative Finance Invoice for ambulance transport trip ${trip.refNo} for ₹${billingAmount.toLocaleString()}?`
				)
			) {
				return
			}
		}

		onGenerateInvoice(trip, billingAmount)
	}

	const statusCls =
		statusBadgeClasses[trip.status] || 'bg-slate-100 text-slate-700 border-slate-200'

	const distanceKm =
		trip.kmStart !== null && trip.kmEnd !== null && trip.kmEnd >= trip.kmStart
			? (trip.kmEnd - trip.kmStart).toFixed(1)
			: null

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer">
				<div className="drawer-header">
					<div className="receipt-header-branding">
						<span className="section-kicker">AMBULANCE TRANSPORT DOSSIER</span>
						<h2>{trip.refNo}</h2>
						<p className="field-hint">
							{trip.clientName || 'Patient Transport'} · Logged on{' '}
							{new Date(trip.createdAt).toLocaleDateString()}
						</p>
					</div>
					<div className="receipt-actions-top">
						<button
							type="button"
							className="icon-button"
							onClick={onClose}
							aria-label="Close dossier"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				<div className="receipt-body space-y-5" style={{ padding: '1.25rem' }}>
					{/* Status Ribbon */}
					<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
						<div className="flex items-center gap-2">
							<span className="text-slate-500 font-medium">Status:</span>
							<span
								className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}
							>
								{trip.status.replace('_', ' ')}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-slate-500 font-medium">Priority:</span>
							<span
								className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
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
					</div>

					{/* Client & Route Section */}
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
						<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
							<MapPin size={14} className="text-indigo-600" />
							<span>Patient & Route Logistics</span>
						</div>

						<div className="grid grid-cols-2 gap-3 text-xs">
							<div>
								<span className="text-slate-400">Client / Caller:</span>
								<div className="font-semibold text-slate-900 mt-0.5">
									{trip.clientName || 'Unspecified'}
								</div>
							</div>
							<div>
								<span className="text-slate-400">Contact:</span>
								<div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
									<Phone size={12} className="text-slate-400" />
									{trip.mobile || '—'}
								</div>
							</div>

							<div className="col-span-2">
								<span className="text-slate-400">Pickup Location:</span>
								<div className="font-medium text-slate-900 mt-0.5">
									{trip.pickupLocation || '—'}
								</div>
							</div>

							<div className="col-span-2">
								<span className="text-slate-400">Destination:</span>
								<div className="font-medium text-slate-900 mt-0.5">
									{trip.destination || '—'}
								</div>
							</div>

							{trip.tripNotes && (
								<div className="col-span-2 rounded-lg bg-slate-50 p-2 text-slate-600">
									<span className="font-semibold text-slate-700">Trip Notes:</span> {trip.tripNotes}
								</div>
							)}
						</div>
					</div>

					{/* Vehicle & Assigned Crew */}
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
						<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
							<Truck size={14} className="text-indigo-600" />
							<span>Assigned Vehicle & Crew</span>
						</div>

						{trip.vehicle ? (
							<div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-mono font-bold text-xs">
									AMB
								</div>
								<div className="flex-1">
									<div className="font-mono text-sm font-bold text-slate-900">
										{trip.vehicle.vehicleNo}
									</div>
									<div className="text-xs text-slate-500">
										{trip.vehicle.type} · Base: {trip.vehicle.baseLocation || 'Base Station'}
									</div>
								</div>
							</div>
						) : (
							<p className="text-xs italic text-slate-400">No ambulance vehicle allocated yet.</p>
						)}

						<div className="grid grid-cols-2 gap-3 text-xs pt-1">
							<div>
								<span className="text-slate-400 flex items-center gap-1">
									<User size={12} /> Driver:
								</span>
								<div className="font-semibold text-slate-800 mt-0.5">
									{trip.driver ? trip.driver.name : 'Unassigned'}
								</div>
								{trip.driver?.empId && (
									<div className="font-mono text-slate-400 text-[11px]">{trip.driver.empId}</div>
								)}
							</div>

							<div>
								<span className="text-slate-400 flex items-center gap-1">
									<Users size={12} /> Support Paramedic:
								</span>
								<div className="font-semibold text-slate-800 mt-0.5">
									{trip.supportStaff ? trip.supportStaff.name : 'None'}
								</div>
							</div>
						</div>
					</div>

					{/* Telemetry & Odometer Readings */}
					<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
						<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
							<Clock size={14} className="text-indigo-600" />
							<span>Trip Telemetry & Distance</span>
						</div>

						<div className="grid grid-cols-3 gap-2 text-center text-xs">
							<div className="rounded-lg bg-slate-50 p-2.5">
								<span className="text-slate-400 block text-[11px]">Start Odometer</span>
								<strong className="text-sm font-mono text-slate-900 mt-1 block">
									{trip.kmStart !== null ? `${trip.kmStart} km` : '—'}
								</strong>
							</div>

							<div className="rounded-lg bg-slate-50 p-2.5">
								<span className="text-slate-400 block text-[11px]">End Odometer</span>
								<strong className="text-sm font-mono text-slate-900 mt-1 block">
									{trip.kmEnd !== null ? `${trip.kmEnd} km` : '—'}
								</strong>
							</div>

							<div className="rounded-lg bg-indigo-50/70 p-2.5">
								<span className="text-indigo-700 block text-[11px] font-semibold">Total Distance</span>
								<strong className="text-sm font-mono text-indigo-900 mt-1 block">
									{distanceKm ? `${distanceKm} km` : '—'}
								</strong>
							</div>
						</div>

						{trip.dispatchTime && (
							<div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
								<Calendar size={12} />
								<span>Dispatched at: {new Date(trip.dispatchTime).toLocaleString()}</span>
							</div>
						)}
					</div>

					{/* Authoritative Finance Billing Section */}
					<div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
								<Receipt size={14} className="text-indigo-600" />
								<span>Finance Integration</span>
							</div>
							<span
								className={`rounded-full px-2 py-0.5 text-xs font-bold ${
									trip.status === 'BILLED'
										? 'bg-emerald-100 text-emerald-800'
										: 'bg-amber-100 text-amber-800'
								}`}
							>
								{trip.status === 'BILLED' ? 'BILLED TO LEDGER' : 'PENDING INVOICE'}
							</span>
						</div>

						<div className="flex items-baseline justify-between pt-1">
							<span className="text-xs text-slate-600">Total Trip Fee:</span>
							<span className="text-xl font-bold font-mono text-slate-900">
								₹{Number(trip.totalAmount || 0).toLocaleString('en-IN')}
							</span>
						</div>

						{trip.status === 'COMPLETED' && onGenerateInvoice && (
							<button
								type="button"
								onClick={handleInvoice}
								className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
							>
								<FileText size={14} />
								<span>Generate Finance Invoice (Authoritative)</span>
							</button>
						)}

						{trip.status === 'BILLED' && (
							<p className="text-[11px] text-emerald-700 flex items-center gap-1">
								<CheckCircle2 size={13} />
								<span>Posted into Enterprise General Ledger category "Ambulance Services".</span>
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
