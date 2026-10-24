import React, { useState } from 'react'
import { Truck, X } from 'lucide-react'
import { ambulanceService } from '../ambulance.service'
import type { VehicleStatus } from '../ambulance.types'

interface AddVehicleModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
	activeUnitId?: string | null
}

const VEHICLE_TYPES = [
	'Advanced Life Support (ALS)',
	'Basic Life Support (BLS)',
	'Patient Transport Vehicle (PTV)',
	'Critical Care Cardiac Ambulance',
	'Neonatal Intensive Care Ambulance',
]

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	activeUnitId,
}) => {
	const [vehicleNo, setVehicleNo] = useState('')
	const [type, setType] = useState(VEHICLE_TYPES[0])
	const [baseLocation, setBaseLocation] = useState('')
	const [status, setStatus] = useState<VehicleStatus>('AVAILABLE')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!vehicleNo.trim()) {
			setError('Please enter registration/vehicle number.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await ambulanceService.createVehicle(
				{
					vehicleNo: vehicleNo.trim().toUpperCase(),
					type,
					baseLocation: baseLocation.trim() || undefined,
					status,
				},
				{ unitId: activeUnitId },
			)

			// Reset
			setVehicleNo('')
			setType(VEHICLE_TYPES[0])
			setBaseLocation('')
			setStatus('AVAILABLE')

			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError.response?.data?.message ||
					axiosError.message ||
					'Failed to register fleet vehicle.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card" style={{ maxWidth: '480px' }}>
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">FLEET ASSET REGISTRATION</span>
						<h2>Add Ambulance Vehicle</h2>
						<p className="field-hint">
							Register a medical emergency vehicle into the unit fleet inventory.
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

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Vehicle Registration Number *</span>
							<input
								type="text"
								placeholder="e.g. DL-01-AM-5521 or KA-04-E-108"
								value={vehicleNo}
								onChange={(e) => setVehicleNo(e.target.value)}
								className="text-input uppercase font-mono"
								required
								autoFocus
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Vehicle Classification *</span>
							<select
								value={type}
								onChange={(e) => setType(e.target.value)}
								className="select-input"
								required
							>
								{VEHICLE_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Base Station / Bay</span>
							<input
								type="text"
								placeholder="e.g. Emergency Bay 2"
								value={baseLocation}
								onChange={(e) => setBaseLocation(e.target.value)}
								className="text-input"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Initial Status</span>
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value as VehicleStatus)}
								className="select-input"
							>
								<option value="AVAILABLE">Available for Dispatch</option>
								<option value="MAINTENANCE">Maintenance / Service</option>
							</select>
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
							disabled={isSubmitting}
						>
							<Truck size={16} />
							<span>{isSubmitting ? 'Registering...' : 'Add Vehicle to Fleet'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
