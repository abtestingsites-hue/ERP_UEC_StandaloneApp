import { useState } from 'react'
import { CheckCircle2, X, XCircle, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { LeaveRequestItem } from '../hrOperations.types'

type LeaveActionDialogProps = {
	leaveRequest?: LeaveRequestItem | null
	request?: LeaveRequestItem | null
	allRequests?: LeaveRequestItem[]
	isOpen?: boolean
	onClose: () => void
	onSuccess: () => void
}

export function LeaveActionDialog({
	leaveRequest,
	request,
	allRequests = [],
	isOpen = true,
	onClose,
	onSuccess,
}: LeaveActionDialogProps) {
	const req = request || leaveRequest

	const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
	const [remarks, setRemarks] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	if (!req || !isOpen) return null

	const concurrentLeaves = allRequests.filter(
		(r) =>
			r.id !== req.id &&
			r.status === 'APPROVED' &&
			r.department === req.department &&
			!(r.toDate < req.fromDate || r.fromDate > req.toDate),
	)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.updateLeaveRequestStatus(req.id, {
				status,
				remarks: remarks.trim() || undefined,
			})
			onSuccess()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					`Failed to update leave request status to ${status}.`,
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
						<span className="section-kicker">LEAVE GOVERNANCE</span>
						<h2>Review Leave Request</h2>
						<p className="field-hint">
							Decision for <strong>{req.staffName}</strong> ({req.leaveType})
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
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
						<div>
							<span style={{ color: '#64748b' }}>Leave Dates:</span>{' '}
							<strong style={{ color: '#0f172a' }}>
								{req.fromDate} to {req.toDate}
							</strong>
						</div>
						<div>
							<span style={{ color: '#64748b' }}>Department:</span>{' '}
							<span style={{ color: '#0f172a' }}>{req.department}</span>
						</div>
						<div style={{ gridColumn: 'span 2' }}>
							<span style={{ color: '#64748b' }}>Reason / Purpose:</span>{' '}
							<span style={{ color: '#334155' }}>
								{req.reason || 'No specific explanation provided'}
							</span>
						</div>
					</div>

					{/* Staffing Impact Preview */}
					<div
						style={{
							marginTop: '0.75rem',
							padding: '0.5rem 0.75rem',
							borderRadius: '6px',
							fontSize: '0.775rem',
							border: concurrentLeaves.length > 0 ? '1px solid #fde68a' : '1px solid #bbf7d0',
							backgroundColor: concurrentLeaves.length > 0 ? '#fffbeb' : '#f0fdf4',
							color: concurrentLeaves.length > 0 ? '#92400e' : '#166534',
						}}
					>
						{concurrentLeaves.length > 0 ? (
							<div>
								<strong>⚠️ Staffing Impact Alert:</strong> {concurrentLeaves.length} other staff member(s) in{' '}
								<strong>{req.department}</strong> have approved leave during this window (
								{concurrentLeaves.map((c) => c.staffName).join(', ')}). Verify shift coverage.
							</div>
						) : (
							<div>
								<strong>✓ Staffing Impact Check:</strong> No concurrent approved leaves found in{' '}
								{req.department}. Unit coverage policy satisfied.
							</div>
						)}
					</div>
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
							<span className="field-label">Decision *</span>
							<div style={{ display: 'flex', gap: '0.75rem' }}>
								<label
									style={{
										flex: 1,
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.6rem 0.8rem',
										border: status === 'APPROVED' ? '2px solid #0F969C' : '1px solid #e2e8f0',
										borderRadius: '6px',
										cursor: 'pointer',
										backgroundColor: status === 'APPROVED' ? '#f0fdfa' : '#fff',
										fontWeight: 600,
									}}
								>
									<input
										type="radio"
										name="status"
										checked={status === 'APPROVED'}
										onChange={() => setStatus('APPROVED')}
									/>
									<CheckCircle2 size={16} color="#0F969C" />
									Approve Leave
								</label>
								<label
									style={{
										flex: 1,
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.6rem 0.8rem',
										border: status === 'REJECTED' ? '2px solid #dc2626' : '1px solid #e2e8f0',
										borderRadius: '6px',
										cursor: 'pointer',
										backgroundColor: status === 'REJECTED' ? '#fef2f2' : '#fff',
										fontWeight: 600,
									}}
								>
									<input
										type="radio"
										name="status"
										checked={status === 'REJECTED'}
										onChange={() => setStatus('REJECTED')}
									/>
									<XCircle size={16} color="#dc2626" />
									Reject Leave
								</label>
							</div>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Reviewer Notes / Justification</span>
							<input
								type="text"
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								placeholder="Optional reason for approval or rejection"
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
							style={{
								backgroundColor: status === 'APPROVED' ? '#0F969C' : '#dc2626',
								borderColor: status === 'APPROVED' ? '#0F969C' : '#dc2626',
							}}
						>
							{isSubmitting ? 'Confirming...' : `Confirm ${status}`}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
