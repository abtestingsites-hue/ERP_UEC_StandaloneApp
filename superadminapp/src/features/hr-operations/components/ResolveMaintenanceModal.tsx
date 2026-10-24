import { useState } from 'react'
import { CheckCircle2, Wrench, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { MaintenanceTicket } from '../hrOperations.types'

type ResolveMaintenanceModalProps = {
	ticket: MaintenanceTicket | null
	isOpen?: boolean
	onClose: () => void
	onSuccess: () => void
}

export function ResolveMaintenanceModal({
	ticket,
	isOpen = true,
	onClose,
	onSuccess,
}: ResolveMaintenanceModalProps) {
	const [resolutionNotes, setResolutionNotes] = useState<string>('')
	const [resolvedBy, setResolvedBy] = useState<string>('')
	const [partsReplaced, setPartsReplaced] = useState<string>('')
	const [cost, setCost] = useState<number | string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	if (!ticket || !isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!resolutionNotes.trim()) {
			setError('Please enter resolution summary.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.resolveMaintenance(ticket.id, {
				status: 'RESOLVED',
				resolvedBy: resolvedBy.trim() || undefined,
				resolutionNotes: resolutionNotes.trim(),
				partsReplaced: partsReplaced.trim() || undefined,
				cost: cost ? Number(cost) : undefined,
			})
			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to resolve maintenance ticket.',
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
						<span className="section-kicker">FACILITY MAINTENANCE</span>
						<h2>Verify & Resolve Maintenance Ticket</h2>
						<p className="field-hint">
							{ticket.type} — Priority: <strong>{ticket.priority || 'MEDIUM'}</strong>
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

				<div
					style={{
						margin: '0.75rem 1.25rem',
						padding: '0.75rem 1rem',
						backgroundColor: '#f8fafc',
						borderRadius: '8px',
						border: '1px solid #e2e8f0',
						fontSize: '0.825rem',
					}}
				>
					<span style={{ color: '#64748b' }}>Original Issue:</span>{' '}
					<strong style={{ color: '#0f172a' }}>{ticket.description || 'No description logged'}</strong>
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
							<span className="field-label">Resolution Work Summary *</span>
							<textarea
								className="text-input"
								rows={2}
								placeholder="Describe what repairs, servicing, or rectifications were conducted..."
								value={resolutionNotes}
								onChange={(e) => setResolutionNotes(e.target.value)}
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Technician / Vendor Name</span>
							<input
								type="text"
								className="text-input"
								placeholder="e.g. Ramesh (Technician) / CoolTech Air"
								value={resolvedBy}
								onChange={(e) => setResolvedBy(e.target.value)}
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Repair Cost (₹)</span>
							<input
								type="number"
								min={0}
								step={50}
								className="text-input"
								placeholder="0.00"
								value={cost}
								onChange={(e) => setCost(e.target.value)}
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Parts / Consumables Replaced (Optional)</span>
							<input
								type="text"
								className="text-input"
								placeholder="e.g. 5A fuse, copper pipe valve, LED tube..."
								value={partsReplaced}
								onChange={(e) => setPartsReplaced(e.target.value)}
							/>
						</label>
					</div>

					<div className="modal-actions">
						<button
							type="button"
							className="secondary-button"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="primary-button"
							disabled={isSubmitting}
						>
							<CheckCircle2 size={16} />
							<span>{isSubmitting ? 'Resolving...' : 'Confirm Resolution & Close'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
