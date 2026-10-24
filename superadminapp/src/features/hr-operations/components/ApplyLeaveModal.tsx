import { useState, useEffect } from 'react'
import { CalendarPlus, X, AlertCircle, AlertTriangle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { StaffMember } from '../hrOperations.types'

type ApplyLeaveModalProps = {
	staffList: StaffMember[]
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
}

const LEAVE_TYPES = [
	'Casual Leave (CL)',
	'Sick / Medical Leave (SL)',
	'Earned / Annual Leave (EL)',
	'Maternity / Paternity Leave',
	'Compensatory Off (Comp-Off)',
	'Bereavement Leave',
	'Unpaid Sabbatical / LOP',
]

export function ApplyLeaveModal({
	staffList = [],
	onClose,
	onSuccess,
	isOpen = true,
}: ApplyLeaveModalProps) {
	const [staffId, setStaffId] = useState<string>(staffList[0]?.id || '')
	const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPES[0])
	const [fromDate, setFromDate] = useState<string>(() => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return d.toISOString().slice(0, 10)
	})
	const [toDate, setToDate] = useState<string>(() => {
		const d = new Date()
		d.setDate(d.getDate() + 2)
		return d.toISOString().slice(0, 10)
	})
	const [reason, setReason] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if ((!staffId || !staffList.some((s) => s.id === staffId)) && staffList.length > 0) {
			setStaffId(staffList[0].id)
		}
	}, [staffList, staffId])

	if (!isOpen) return null

	const calculateDays = () => {
		if (!fromDate || !toDate) return 0
		const start = new Date(fromDate).getTime()
		const end = new Date(toDate).getTime()
		if (end < start) return 0
		return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
	}

	const durationDays = calculateDays()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!staffId) {
			setError('Please select an employee.')
			return
		}
		if (!fromDate || !toDate) {
			setError('Please specify from and to dates.')
			return
		}
		if (new Date(toDate).getTime() < new Date(fromDate).getTime()) {
			setError('To date cannot be earlier than From date.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.createLeaveRequest({
				staffId,
				leaveType,
				fromDate,
				toDate,
				reason: reason.trim() || undefined,
			})
			onSuccess?.()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to submit leave request.',
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
						<span className="section-kicker">LEAVE GOVERNANCE</span>
						<h2>Submit Staff Leave Request</h2>
						<p className="field-hint">
							File a formal leave application on behalf of an employee.
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

					{staffList.length === 0 && (
						<div className="error-banner" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
							<AlertTriangle size={16} />
							<span>No staff members available. Please onboard staff first.</span>
						</div>
					)}

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Employee / Staff Member *</span>
							<select
								className="filter-select"
								value={staffId}
								onChange={(e) => setStaffId(e.target.value)}
								required
								disabled={staffList.length === 0}
							>
								{staffList.length === 0 ? (
									<option value="">No staff members available</option>
								) : (
									staffList.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name} ({s.empId || 'No ID'}) — {s.department} ({s.role})
										</option>
									))
								)}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Leave Category *</span>
							<select
								className="filter-select"
								value={leaveType}
								onChange={(e) => setLeaveType(e.target.value)}
								required
							>
								{LEAVE_TYPES.map((lt) => (
									<option key={lt} value={lt}>
										{lt}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">From Date *</span>
							<input
								type="date"
								className="text-input"
								value={fromDate}
								onChange={(e) => setFromDate(e.target.value)}
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">To Date *</span>
							<input
								type="date"
								className="text-input"
								value={toDate}
								onChange={(e) => setToDate(e.target.value)}
								required
							/>
						</label>

						<div className="form-field form-field--span-2">
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eef2ff', border: '1px solid #e0e7ff', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
								<span style={{ fontWeight: 600, color: '#3730a3' }}>Calculated Absence Window:</span>
								<span style={{ fontWeight: 700, color: '#4338ca' }}>
									{durationDays > 0 ? `${durationDays} Calendar Day(s)` : 'Invalid Date Range'}
								</span>
							</div>
						</div>

						<label className="form-field form-field--span-2">
							<span className="field-label">Reason / Justification</span>
							<textarea
								className="text-input"
								rows={3}
								placeholder="Provide explanation, emergency details, or handover instructions..."
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								required
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
							disabled={isSubmitting || durationDays <= 0 || staffList.length === 0}
						>
							<CalendarPlus size={16} />
							<span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
