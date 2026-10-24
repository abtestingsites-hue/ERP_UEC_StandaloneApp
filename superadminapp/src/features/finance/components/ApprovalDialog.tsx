import { useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { financeService } from '../finance.service'
import type { CashboxTransaction } from '../finance.types'

type ApprovalDialogProps = {
	transaction: CashboxTransaction
	onClose: () => void
	onSuccess: () => void
}

export function ApprovalDialog({
	transaction,
	onClose,
	onSuccess,
}: ApprovalDialogProps) {
	const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
	const [comments, setComments] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			await financeService.approveTransaction(
				transaction.id,
				status,
				comments.trim() || undefined,
			)
			onSuccess()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					`Failed to update transaction status to ${status}.`,
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
						<span className="section-kicker">GOVERNANCE & AUDIT</span>
						<h2>Verify & Approve Voucher</h2>
						<p className="field-hint">
							Review transaction <strong>{transaction.receiptNo}</strong>
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
					}}
				>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.825rem' }}>
						<div>
							<span style={{ color: '#64748b' }}>Type:</span>{' '}
							<strong style={{ color: transaction.type === 'INCOME' ? '#0F969C' : '#dc2626' }}>
								{transaction.type}
							</strong>
						</div>
						<div>
							<span style={{ color: '#64748b' }}>Amount:</span>{' '}
							<strong style={{ fontSize: '1rem', color: '#0f172a' }}>
								₹{transaction.amount.toFixed(2)}
							</strong>
						</div>
						<div style={{ gridColumn: 'span 2' }}>
							<span style={{ color: '#64748b' }}>Party / Notes:</span>{' '}
							<span style={{ color: '#0f172a' }}>
								{transaction.clientName} {transaction.notes ? `(${transaction.notes})` : ''}
							</span>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					{error && <div className="error-banner">{error}</div>}

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Approval Decision *</span>
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
									Approve Voucher
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
									Reject Voucher
								</label>
							</div>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Reviewer Remarks / Audit Note</span>
							<input
								type="text"
								value={comments}
								onChange={(e) => setComments(e.target.value)}
								placeholder="Optional reason or audit verification tag"
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
