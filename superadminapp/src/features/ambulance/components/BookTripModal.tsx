import React, { useState } from 'react'
import { Ambulance, X } from 'lucide-react'
import { ambulanceService } from '../ambulance.service'

interface BookTripModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
	activeUnitId?: string | null
}

const PRIORITIES = [
	{ id: 'NORMAL', label: 'Normal / Scheduled', color: 'text-slate-700 bg-slate-100' },
	{ id: 'URGENT', label: 'Urgent Non-Critical', color: 'text-amber-700 bg-amber-50' },
	{ id: 'EMERGENCY', label: 'Critical Emergency', color: 'text-rose-700 bg-rose-50' },
]

export const BookTripModal: React.FC<BookTripModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	activeUnitId,
}) => {
	const [clientName, setClientName] = useState('')
	const [mobile, setMobile] = useState('')
	const [pickupLocation, setPickupLocation] = useState('')
	const [destination, setDestination] = useState('')
	const [priority, setPriority] = useState('NORMAL')
	const [tripNotes, setTripNotes] = useState('')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!clientName.trim() && !pickupLocation.trim()) {
			setError('Please specify either client name or pickup location.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await ambulanceService.createTrip(
				{
					clientName: clientName.trim() || undefined,
					mobile: mobile.trim() || undefined,
					pickupLocation: pickupLocation.trim() || undefined,
					destination: destination.trim() || undefined,
					priority,
					tripNotes: tripNotes.trim() || undefined,
					status: 'REQUESTED',
				},
				{ unitId: activeUnitId },
			)

			// Reset form
			setClientName('')
			setMobile('')
			setPickupLocation('')
			setDestination('')
			setPriority('NORMAL')
			setTripNotes('')

			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError.response?.data?.message ||
					axiosError.message ||
					'Failed to request transport booking.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card" style={{ maxWidth: '540px' }}>
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">AMBULANCE TRANSPORT</span>
						<h2>Book Transport Trip</h2>
						<p className="field-hint">
							Intake a scheduled patient transfer or emergency ambulance dispatch request.
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
							<span className="field-label">Patient / Client Name *</span>
							<input
								type="text"
								placeholder="e.g. Ramesh Kumar or Transfer Patient"
								value={clientName}
								onChange={(e) => setClientName(e.target.value)}
								className="text-input"
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Contact Mobile</span>
							<input
								type="tel"
								placeholder="+91 98765 43210"
								value={mobile}
								onChange={(e) => setMobile(e.target.value)}
								className="text-input"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Transport Priority</span>
							<select
								value={priority}
								onChange={(e) => setPriority(e.target.value)}
								className="select-input"
							>
								{PRIORITIES.map((p) => (
									<option key={p.id} value={p.id}>
										{p.label}
									</option>
								))}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Pickup Location *</span>
							<input
								type="text"
								placeholder="e.g. Residence, Ward 3 Bed 12, or Scene address"
								value={pickupLocation}
								onChange={(e) => setPickupLocation(e.target.value)}
								className="text-input"
								required
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Destination Facility / Hospital</span>
							<input
								type="text"
								placeholder="e.g. City General Hospital, ICU block"
								value={destination}
								onChange={(e) => setDestination(e.target.value)}
								className="text-input"
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Clinical / Trip Notes</span>
							<textarea
								rows={2}
								placeholder="Oxygen support required, stretcher needed, caller remarks..."
								value={tripNotes}
								onChange={(e) => setTripNotes(e.target.value)}
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
							disabled={isSubmitting}
						>
							<Ambulance size={16} />
							<span>{isSubmitting ? 'Requesting...' : 'Confirm Transport Request'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
