import React, { useState } from 'react'
import { CheckCircle2, Navigation, MapPin, XCircle, X } from 'lucide-react'
import { ambulanceService } from '../ambulance.service'
import type { AmbulanceTrip, TripStatus } from '../ambulance.types'

interface TripSheetActionModalProps {
	trip: AmbulanceTrip | null
	action: 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | null
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

export const TripSheetActionModal: React.FC<TripSheetActionModalProps> = ({
	trip,
	action,
	isOpen,
	onClose,
	onSuccess,
}) => {
	const [kmStart, setKmStart] = useState<string>('')
	const [kmEnd, setKmEnd] = useState<string>('')
	const [totalAmount, setTotalAmount] = useState<string>('')
	const [remarks, setRemarks] = useState<string>('')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen || !trip || !action) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			const payload: Record<string, unknown> = { status: action as TripStatus }

			if (action === 'EN_ROUTE') {
				if (kmStart) {
					const km = Number(kmStart)
					if (isNaN(km) || km < 0) throw new Error('Start kilometer reading must be valid.')
					payload.kmStart = km
				}
			} else if (action === 'COMPLETED') {
				if (!kmEnd) throw new Error('End kilometer reading is required to complete trip.')
				const km = Number(kmEnd)
				if (isNaN(km) || km < 0) throw new Error('End kilometer reading must be valid.')
				if (trip.kmStart !== null && km < trip.kmStart) {
					throw new Error(`End KM (${km}) cannot be less than Start KM (${trip.kmStart}).`)
				}
				payload.kmEnd = km

				if (totalAmount) {
					const amt = Number(totalAmount)
					if (isNaN(amt) || amt < 0) throw new Error('Billing amount must be valid.')
					payload.totalAmount = amt
				}
			}

			await ambulanceService.updateTripStatus(trip.id, payload)
			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError.response?.data?.message ||
					axiosError.message ||
					'Failed to update trip progress.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const titles: Record<string, { kicker: string; title: string; desc: string; icon: typeof Navigation; btnColor: string }> = {
		EN_ROUTE: {
			kicker: 'ACTIVE TELEMETRY',
			title: 'Mark Trip En Route',
			desc: `Log initial odometer telemetry for ${trip.refNo} as ambulance departs.`,
			icon: Navigation,
			btnColor: 'primary',
		},
		ARRIVED: {
			kicker: 'DESTINATION REACHED',
			title: 'Confirm Arrival',
			desc: `Confirm ambulance arrival at ${trip.destination || 'destination site'}.`,
			icon: MapPin,
			btnColor: 'primary',
		},
		COMPLETED: {
			kicker: 'SERVICE LOGGING',
			title: 'Complete Transport Trip',
			desc: `Record final odometer reading and finalize transport for billing. This frees vehicle ${trip.vehicle?.vehicleNo || ''} back to available fleet.`,
			icon: CheckCircle2,
			btnColor: 'primary',
		},
		CANCELLED: {
			kicker: 'ABORT TRANSPORT',
			title: 'Cancel Transport Trip',
			desc: `Cancel trip ${trip.refNo} and return vehicle to available pool.`,
			icon: XCircle,
			btnColor: 'secondary',
		},
	}

	const config = titles[action] || titles.EN_ROUTE
	const Icon = config.icon

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card" style={{ maxWidth: '480px' }}>
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">{config.kicker}</span>
						<h2>{config.title}</h2>
						<p className="field-hint">{config.desc}</p>
					</div>
					<button
						type="button"
						className="icon-button"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					{error && <div className="error-banner">{error}</div>}

					<div className="form-grid">
						{action === 'EN_ROUTE' && (
							<label className="form-field form-field--span-2">
								<span className="field-label">Departure Odometer (KM Start)</span>
								<input
									type="number"
									step="0.1"
									placeholder="e.g. 15420"
									value={kmStart}
									onChange={(e) => setKmStart(e.target.value)}
									className="text-input"
									autoFocus
								/>
							</label>
						)}

						{action === 'COMPLETED' && (
							<>
								<label className="form-field">
									<span className="field-label">Departure KM</span>
									<input
										type="text"
										value={trip.kmStart !== null ? `${trip.kmStart} km` : 'Not recorded'}
										disabled
										className="text-input bg-slate-50 text-slate-500"
									/>
								</label>

								<label className="form-field">
									<span className="field-label">Final Odometer (KM End) *</span>
									<input
										type="number"
										step="0.1"
										placeholder="e.g. 15448"
										value={kmEnd}
										onChange={(e) => setKmEnd(e.target.value)}
										className="text-input"
										required
										autoFocus
									/>
								</label>

								<label className="form-field form-field--span-2">
									<span className="field-label">Billing Amount (₹)</span>
									<input
										type="number"
										placeholder="e.g. 2500"
										value={totalAmount}
										onChange={(e) => setTotalAmount(e.target.value)}
										className="text-input"
									/>
								</label>
							</>
						)}

						{action === 'CANCELLED' && (
							<label className="form-field form-field--span-2">
								<span className="field-label">Cancellation Reason / Remarks</span>
								<textarea
									rows={2}
									placeholder="Patient declined, alternate arrangement, caller cancelled..."
									value={remarks}
									onChange={(e) => setRemarks(e.target.value)}
									className="text-input"
								/>
							</label>
						)}
					</div>

					<div className="modal-actions">
						<button
							type="button"
							className="button secondary"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={`button ${config.btnColor}`}
							disabled={isSubmitting}
						>
							<Icon size={16} />
							<span>{isSubmitting ? 'Updating...' : `Confirm ${action.replace('_', ' ')}`}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
