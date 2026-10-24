import { useState } from 'react'
import { Wrench, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'

type LogMaintenanceModalProps = {
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
	activeUnitId?: string | null
	onCreated?: () => void
}

const MAINTENANCE_TYPES = [
	'Air Conditioning & HVAC',
	'Electrical & Wiring',
	'Plumbing & Water Supply',
	'Generator Backup Service',
	'Medical Bed & Wheelchair Service',
	'Civil & Carpentry Repairs',
	'Fire & Safety Equipment',
	'Kitchen Equipment Maintenance',
]

export function LogMaintenanceModal({
	onClose,
	onSuccess,
	isOpen = true,
	activeUnitId,
	onCreated,
}: LogMaintenanceModalProps) {
	const [type, setType] = useState<string>(MAINTENANCE_TYPES[0])
	const [description, setDescription] = useState<string>('')
	const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
	const [location, setLocation] = useState<string>('')
	const [vendorName, setVendorName] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!description.trim()) {
			setError('Please provide maintenance issue description.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.createMaintenanceTicket({
				type,
				description: description.trim(),
				priority,
				location: location.trim() || undefined,
				vendorName: vendorName.trim() || undefined,
				unitId: activeUnitId || undefined,
			})
			if (onCreated) {
				onCreated()
			} else if (onSuccess) {
				onSuccess()
			}
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to log maintenance request.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card">
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">FACILITY MANAGEMENT</span>
						<h2>Log Maintenance Request</h2>
						<p className="field-hint">
							Report a physical facility, equipment, or electrical issue.
						</p>
					</div>
					<button
						type="button"
						className="icon-button"
						onClick={onClose}
						aria-label="Close modal"
					>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					{error && (
						<div className="error-banner">
							<AlertCircle size={16} />
							<span>{error}</span>
						</div>
					)}

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Issue Category *</span>
							<select
								className="filter-select"
								value={type}
								onChange={(e) => setType(e.target.value)}
								required
							>
								{MAINTENANCE_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Priority Level *</span>
							<select
								className="filter-select"
								value={priority}
								onChange={(e) =>
									setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
								}
							>
								<option value="LOW">Low (Routine)</option>
								<option value="MEDIUM">Medium (Normal)</option>
								<option value="HIGH">High (Urgent)</option>
								<option value="URGENT">Critical (Immediate SLA)</option>
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Location / Wing / Bed</span>
							<input
								type="text"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="e.g. Ward 2B, Kitchen Area, Room 104"
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">External Contractor / Service Vendor</span>
							<input
								type="text"
								value={vendorName}
								onChange={(e) => setVendorName(e.target.value)}
								placeholder="Optional service contractor or AMC vendor name"
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Problem Description & Symptoms *</span>
							<textarea
								className="text-input"
								rows={3}
								required
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Describe what is broken, leaking, or malfunctioning..."
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
							<Wrench size={16} />
							<span>{isSubmitting ? 'Logging...' : 'Log Ticket'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
