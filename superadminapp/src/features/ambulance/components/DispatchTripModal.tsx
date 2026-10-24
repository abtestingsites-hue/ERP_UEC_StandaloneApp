import React, { useState, useMemo } from 'react'
import { Radio, X, AlertCircle } from 'lucide-react'
import { ambulanceService } from '../ambulance.service'
import type { AmbulanceTrip, AmbulanceVehicle } from '../ambulance.types'

interface DispatchTripModalProps {
	trip: AmbulanceTrip | null
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
	vehicles: AmbulanceVehicle[]
	staffList: Array<{ id: string; name: string; role: string; empId: string }>
}

export const DispatchTripModal: React.FC<DispatchTripModalProps> = ({
	trip,
	isOpen,
	onClose,
	onSuccess,
	vehicles,
	staffList,
}) => {
	const availableVehicles = useMemo(
		() => vehicles.filter((v) => v.status === 'AVAILABLE'),
		[vehicles],
	)

	const [selectedVehicleId, setSelectedVehicleId] = useState('')
	const [selectedDriverId, setSelectedDriverId] = useState('')
	const [selectedSupportStaffId, setSelectedSupportStaffId] = useState('')
	const [dispatchTime, setDispatchTime] = useState(() => {
		const now = new Date()
		now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
		return now.toISOString().slice(0, 16)
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen || !trip) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedVehicleId) {
			setError('Please select an available ambulance vehicle.')
			return
		}
		if (!selectedDriverId) {
			setError('Please designate an authorized driver.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await ambulanceService.updateTripStatus(trip.id, {
				status: 'DISPATCHED',
				vehicleId: selectedVehicleId,
				driverId: selectedDriverId,
				supportStaffId: selectedSupportStaffId || undefined,
				dispatchTime: dispatchTime ? new Date(dispatchTime).toISOString() : new Date().toISOString(),
			})

			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError.response?.data?.message ||
					axiosError.message ||
					'Failed to dispatch ambulance.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card" style={{ maxWidth: '520px' }}>
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">EMERGENCY DISPATCH CONSOLE</span>
						<h2>Dispatch Ambulance</h2>
						<p className="field-hint">
							Assign vehicle & crew to trip <strong>{trip.refNo}</strong> for {trip.clientName || 'Client'}.
						</p>
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

					{/* Trip Summary Mini-Card */}
					<div
						style={{
							backgroundColor: '#f8fafc',
							borderRadius: '8px',
							border: '1px solid #e2e8f0',
							padding: '0.75rem 1rem',
							fontSize: '0.825rem',
						}}
					>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
							<div>
								<span style={{ color: '#64748b' }}>Pickup:</span>{' '}
								<strong style={{ color: '#0f172a' }}>{trip.pickupLocation || '—'}</strong>
							</div>
							<div>
								<span style={{ color: '#64748b' }}>Destination:</span>{' '}
								<strong style={{ color: '#0f172a' }}>{trip.destination || '—'}</strong>
							</div>
							<div>
								<span style={{ color: '#64748b' }}>Priority:</span>{' '}
								<span style={{ color: trip.priority === 'EMERGENCY' ? '#e11d48' : '#0F969C', fontWeight: 700 }}>
									{trip.priority || 'NORMAL'}
								</span>
							</div>
							<div>
								<span style={{ color: '#64748b' }}>Contact:</span>{' '}
								<span style={{ color: '#334155' }}>{trip.mobile || '—'}</span>
							</div>
						</div>
					</div>

					{availableVehicles.length === 0 ? (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
							<AlertCircle size={16} className="text-amber-600 shrink-0" />
							<span>No ambulances currently in <strong>AVAILABLE</strong> status. Return an active trip or check maintenance.</span>
						</div>
					) : null}

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Assign Vehicle *</span>
							<select
								value={selectedVehicleId}
								onChange={(e) => setSelectedVehicleId(e.target.value)}
								className="select-input"
								required
							>
								<option value="">Select available ambulance...</option>
								{availableVehicles.map((v) => (
									<option key={v.id} value={v.id}>
										{v.vehicleNo} — {v.type} ({v.baseLocation || 'Base'})
									</option>
								))}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Designated Driver *</span>
							<select
								value={selectedDriverId}
								onChange={(e) => setSelectedDriverId(e.target.value)}
								className="select-input"
								required
							>
								<option value="">Select driver from authorized staff...</option>
								{staffList.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} ({s.role} · {s.empId})
									</option>
								))}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Support Crew / Paramedic (Optional)</span>
							<select
								value={selectedSupportStaffId}
								onChange={(e) => setSelectedSupportStaffId(e.target.value)}
								className="select-input"
							>
								<option value="">None / Solo transport</option>
								{staffList
									.filter((s) => s.id !== selectedDriverId)
									.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name} ({s.role} · {s.empId})
										</option>
									))}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Dispatch Timestamp</span>
							<input
								type="datetime-local"
								value={dispatchTime}
								onChange={(e) => setDispatchTime(e.target.value)}
								className="text-input"
							/>
						</label>
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
							className="button primary"
							disabled={isSubmitting || availableVehicles.length === 0}
						>
							<Radio size={16} />
							<span>{isSubmitting ? 'Dispatching...' : 'Confirm Ambulance Dispatch'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
