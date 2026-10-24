import { useState } from 'react'
import { CheckCircle2, IndianRupee, X } from 'lucide-react'
import { financeService } from '../finance.service'
import type { AccountTransaction } from '../finance.types'

type RecordPaymentModalProps = {
	invoice: AccountTransaction
	onClose: () => void
	onSuccess: () => void
}

export function RecordPaymentModal({
	invoice,
	onClose,
	onSuccess,
}: RecordPaymentModalProps) {
	const currentBalance = Number(
		invoice.metadata?.balanceAmount !== undefined
			? invoice.metadata.balanceAmount
			: invoice.amount,
	)

	const [amount, setAmount] = useState<number>(currentBalance > 0 ? currentBalance : Number(invoice.amount || 0))
	const [mode, setMode] = useState<string>('Cash')
	const [remarks, setRemarks] = useState<string>(
		`Payment received for ${invoice.refNo}`,
	)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (amount <= 0) {
			setError('Please enter a valid payment amount greater than zero.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await financeService.recordInvoicePayment(invoice.id, {
				amount,
				mode,
				remarks,
			})
			onSuccess()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to record invoice payment.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card">
				<div className="modal-header">
					<div className="modal-title-wrap">
						<span className="section-kicker">COLLECTIONS & BILLING</span>
						<h2>Record Invoice Payment</h2>
						<p className="field-hint">
							Collect partial or full settlement for Invoice <strong>{invoice.refNo}</strong>
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
						padding: '0.85rem 1rem',
						backgroundColor: '#f8fafc',
						borderRadius: '8px',
						border: '1px solid #e2e8f0',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<div>
							<span
								style={{
									fontSize: '0.75rem',
									color: '#64748b',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									fontWeight: 700,
								}}
							>
								Client / Resident
							</span>
							<p
								style={{
									margin: '0.2rem 0 0',
									fontWeight: 700,
									color: '#0f172a',
								}}
							>
								{invoice.clientName || 'Patient Family'}
							</p>
						</div>
						<div style={{ textAlign: 'right' }}>
							<span
								style={{
									fontSize: '0.75rem',
									color: '#64748b',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									fontWeight: 700,
								}}
							>
								Total / Outstanding
							</span>
							<p
								style={{
									margin: '0.2rem 0 0',
									fontWeight: 800,
									color: '#0F969C',
								}}
							>
								₹{currentBalance.toFixed(2)}{' '}
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										fontWeight: 400,
									}}
								>
									(of ₹{Number(invoice.amount || 0).toFixed(2)})
								</span>
							</p>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					{error && <div className="error-banner">{error}</div>}

					<div className="form-grid">
						<label className="form-field">
							<span className="field-label">Payment Amount (₹) *</span>
							<div className="search-box" style={{ width: '100%' }}>
								<IndianRupee size={16} />
								<input
									type="number"
									step="0.01"
									min="1"
									max={currentBalance > 0 ? currentBalance : undefined}
									required
									value={amount}
									onChange={(e) => setAmount(Number(e.target.value))}
									placeholder="Amount to collect"
								/>
							</div>
						</label>

						<label className="form-field">
							<span className="field-label">Payment Mode *</span>
							<select
								value={mode}
								onChange={(e) => setMode(e.target.value)}
								className="filter-select"
								style={{ width: '100%', height: '42px' }}
								required
							>
								<option value="Cash">Cash</option>
								<option value="UPI / Online">UPI / Online Transfer</option>
								<option value="Bank Transfer">Bank Transfer / NEFT</option>
								<option value="Cheque">Cheque / Demand Draft</option>
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Remarks / Transaction Reference</span>
							<input
								type="text"
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								placeholder="e.g. UPI Txn ID, cheque number, or bank branch"
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
							<CheckCircle2 size={16} />
							{isSubmitting ? 'Recording...' : 'Collect & Issue Receipt'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
