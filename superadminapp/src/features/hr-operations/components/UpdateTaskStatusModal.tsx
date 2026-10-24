import { useState } from 'react'
import { CheckSquare, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { OperationalTask } from '../hrOperations.types'

type UpdateTaskStatusModalProps = {
	task: OperationalTask | null
	targetStatus?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
	isOpen?: boolean
	onClose: () => void
	onSuccess: () => void
}

export function UpdateTaskStatusModal({
	task,
	targetStatus,
	isOpen = true,
	onClose,
	onSuccess,
}: UpdateTaskStatusModalProps) {
	const [status, setStatus] = useState<'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>(
		targetStatus || (task?.status as any) || 'IN_PROGRESS',
	)
	const [remarks, setRemarks] = useState<string>('')
	const [blockerNotes, setBlockerNotes] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	if (!task || !isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			const finalRemarks = [
				remarks.trim(),
				blockerNotes.trim() ? `[Blockers: ${blockerNotes.trim()}]` : null,
			]
				.filter(Boolean)
				.join(' ')

			await hrOperationsService.updateTaskWithDetails(task.id, {
				status,
				remarks: finalRemarks || undefined,
				completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
			})
			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to update operational task status.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card" style={{ maxWidth: '500px' }}>
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">TASK WORKFLOW</span>
						<h2>Update Task Progress & Status</h2>
						<p className="field-hint">
							Ref: <strong>{task.refNo}</strong> — {task.title}
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
							<span className="field-label">Target Status *</span>
							<select
								className="filter-select"
								value={status}
								onChange={(e) => setStatus(e.target.value as any)}
								required
							>
								<option value="ASSIGNED">Assigned (Pending Action)</option>
								<option value="IN_PROGRESS">In Progress (Work Underway)</option>
								<option value="COMPLETED">Completed (Verified Done)</option>
								<option value="CANCELLED">Cancelled / Deferred</option>
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">
								{status === 'COMPLETED'
									? 'Completion Summary / Evidence Notes'
									: 'Progress Notes & Work Updates'}
							</span>
							<textarea
								className="text-input"
								rows={2}
								placeholder={
									status === 'COMPLETED'
										? 'Detail work completed, checks conducted, evidence verified...'
										: 'Record current progress status or steps taken...'
								}
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</label>

						{status !== 'COMPLETED' && (
							<label className="form-field form-field--span-2">
								<span className="field-label">Blockers / Hindrances (Optional)</span>
								<input
									type="text"
									className="text-input"
									placeholder="e.g. Waiting for spare parts, resident unavailable..."
									value={blockerNotes}
									onChange={(e) => setBlockerNotes(e.target.value)}
								/>
							</label>
						)}
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
							<CheckSquare size={16} />
							<span>{isSubmitting ? 'Updating...' : 'Confirm Update'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
