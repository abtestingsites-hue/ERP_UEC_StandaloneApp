import { useState } from 'react'
import { CheckCircle2, IndianRupee, X } from 'lucide-react'
import { financeService } from '../finance.service'

type AddTransactionModalProps = {
	defaultType?: 'INCOME' | 'EXPENSE'
	onClose: () => void
	onSuccess: () => void
}

const INCOME_CATEGORIES = [
	'Resident Boarding Fee',
	'Medical & Nursing Care Fee',
	'Day Care Service',
	'Physiotherapy Fee',
	'Ambulance Service Fee',
	'Donation / Philanthropy Contribution',
	'Consultation Fee',
	'Miscellaneous Income',
]

const EXPENSE_CATEGORIES = [
	'Medical Supplies & Consumables',
	'Food & Dietary Groceries',
	'Staff Advance & Welfare',
	'Facility Utilities & Maintenance',
	'Housekeeping & Linen',
	'Equipment Repairs',
	'Fuel & Vehicle Running Cost',
	'Administrative & Printing',
	'Miscellaneous Expense',
]

export function AddTransactionModal({
	defaultType = 'EXPENSE',
	onClose,
	onSuccess,
}: AddTransactionModalProps) {
	const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType)
	const [amount, setAmount] = useState<number | ''>('')
	const [paymentMode, setPaymentMode] = useState<string>('Cash')
	const [category, setCategory] = useState<string>(
		defaultType === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
	)
	const [clientName, setClientName] = useState<string>('')
	const [notes, setNotes] = useState<string>('')
	const [date, setDate] = useState<string>(
		new Date().toISOString().split('T')[0],
	)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
		setType(newType)
		setCategory(
			newType === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
		)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!amount || Number(amount) <= 0) {
			setError('Please enter a valid transaction amount.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		const payload = {
			amount: Number(amount),
			paymentMode,
			category,
			clientName: clientName.trim() || undefined,
			notes: notes.trim() || undefined,
			date: date ? new Date(date).toISOString() : undefined,
		}

		try {
			if (type === 'INCOME') {
				await financeService.addIncome(payload)
			} else {
				await financeService.addExpense(payload)
			}
			onSuccess()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					`Failed to record ${type.toLowerCase()}.`,
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
						<span className="section-kicker">CASHBOX & TRANSACTIONS</span>
						<h2>Record New {type === 'INCOME' ? 'Income' : 'Expense'}</h2>
						<p className="field-hint">
							Create a cashbox voucher. All vouchers remain pending approval until verified.
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

				<div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.25rem 0.5rem' }}>
					<button
						type="button"
						className={`button ${type === 'INCOME' ? 'primary' : 'secondary'}`}
						style={{ flex: 1 }}
						onClick={() => handleTypeChange('INCOME')}
					>
						+ Record Income
					</button>
					<button
						type="button"
						className={`button ${type === 'EXPENSE' ? 'primary' : 'secondary'}`}
						style={{ flex: 1 }}
						onClick={() => handleTypeChange('EXPENSE')}
					>
						- Record Expense
					</button>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					{error && <div className="error-banner">{error}</div>}

					<div className="form-grid">
						<label className="form-field">
							<span className="field-label">Amount (₹) *</span>
							<div className="search-box" style={{ width: '100%' }}>
								<IndianRupee size={16} />
								<input
									type="number"
									step="0.01"
									min="1"
									required
									value={amount}
									onChange={(e) =>
										setAmount(e.target.value === '' ? '' : Number(e.target.value))
									}
									placeholder="0.00"
								/>
							</div>
						</label>

						<label className="form-field">
							<span className="field-label">Payment Mode *</span>
							<select
								value={paymentMode}
								onChange={(e) => setPaymentMode(e.target.value)}
								className="filter-select"
								style={{ width: '100%', height: '42px' }}
								required
							>
								<option value="Cash">Cash</option>
								<option value="UPI">UPI / GPay / PhonePe</option>
								<option value="Bank Transfer">Bank Transfer / NEFT</option>
								<option value="Cheque">Cheque</option>
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Category *</span>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="filter-select"
								style={{ width: '100%', height: '42px' }}
								required
							>
								{(type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
									(cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									),
								)}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Date *</span>
							<input
								type="date"
								required
								value={date}
								onChange={(e) => setDate(e.target.value)}
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">
								{type === 'INCOME' ? 'Payer / Client Name' : 'Payee / Vendor Name'}
							</span>
							<input
								type="text"
								value={clientName}
								onChange={(e) => setClientName(e.target.value)}
								placeholder={
									type === 'INCOME'
										? 'Resident family, donor, or guest'
										: 'Pharmacy, utility vendor, supplier, or staff'
								}
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Description / Purpose / Bill Details</span>
							<textarea
								rows={2}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Purpose of transaction, invoice references, bill serial numbers..."
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
							{isSubmitting ? 'Saving...' : `Save ${type === 'INCOME' ? 'Income' : 'Expense'}`}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
