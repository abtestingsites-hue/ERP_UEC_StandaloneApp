import { useState, useEffect } from 'react'
import { CalendarCheck, X, AlertCircle, AlertTriangle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { StaffMember } from '../hrOperations.types'

type RecordAttendanceModalProps = {
	staffList: StaffMember[]
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
	initialDate?: string
}

const SHIFT_OPTIONS = [
	{ label: 'General Shift (09:00 - 18:00)', in: '09:00', out: '18:00' },
	{ label: 'Morning Shift (07:00 - 15:00)', in: '07:00', out: '15:00' },
	{ label: 'Evening Shift (15:00 - 23:00)', in: '15:00', out: '23:00' },
	{ label: 'Night Shift (23:00 - 07:00)', in: '23:00', out: '07:00' },
]

export function RecordAttendanceModal({
	staffList = [],
	onClose,
	onSuccess,
	isOpen = true,
	initialDate,
}: RecordAttendanceModalProps) {
	const [staffId, setStaffId] = useState<string>(staffList[0]?.id || '')
	const [date, setDate] = useState<string>(
		initialDate || new Date().toISOString().slice(0, 10),
	)
	const [status, setStatus] = useState<string>('PRESENT')
	const [checkIn, setCheckIn] = useState<string>('09:00')
	const [checkOut, setCheckOut] = useState<string>('18:00')
	const [notes, setNotes] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if ((!staffId || !staffList.some((s) => s.id === staffId)) && staffList.length > 0) {
			setStaffId(staffList[0].id)
		}
	}, [staffList, staffId])

	if (!isOpen) return null

	const handleShiftSelect = (idx: number) => {
		const s = SHIFT_OPTIONS[idx]
		if (s) {
			setCheckIn(s.in)
			setCheckOut(s.out)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!staffId) {
			setError('Please select an employee from the staff directory.')
			return
		}
		if (!date) {
			setError('Please select attendance date.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.recordAttendance({
				staffId,
				date,
				status,
				checkIn: status === 'ABSENT' || status === 'ON_LEAVE' ? undefined : checkIn || undefined,
				checkOut: status === 'ABSENT' || status === 'ON_LEAVE' ? undefined : checkOut || undefined,
				notes: notes.trim() || undefined,
			})
			onSuccess?.()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to record staff attendance.',
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
						<span className="section-kicker">ROSTER & TIMEKEEPING</span>
						<h2>Record Staff Attendance</h2>
						<p className="field-hint">
							Log or override daily check-in, check-out, and roster attendance status.
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
							<span>No active staff records found. Please onboard staff members first.</span>
						</div>
					)}

					<div className="form-grid">
						<label className="form-field form-field--span-2">
							<span className="field-label">Staff Member *</span>
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
											{s.name} ({s.empId || 'No ID'}) — {s.role || s.department}
										</option>
									))
								)}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Attendance Date *</span>
							<input
								type="date"
								className="text-input"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Attendance Status *</span>
							<select
								className="filter-select"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								required
							>
								<option value="PRESENT">Present (Full Day)</option>
								<option value="HALF_DAY">Half Day</option>
								<option value="ON_LEAVE">On Approved Leave</option>
								<option value="ABSENT">Absent / Unplanned</option>
							</select>
						</label>

						{status !== 'ABSENT' && status !== 'ON_LEAVE' && (
							<>
								<div className="form-field form-field--span-2">
									<span className="field-label">Quick Shift Preset</span>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
										{SHIFT_OPTIONS.map((s, idx) => (
											<button
												key={s.label}
												type="button"
												onClick={() => handleShiftSelect(idx)}
												className="button secondary"
												style={{ padding: '4px 10px', fontSize: '11px', height: 'auto' }}
											>
												{s.label.split(' (')[0]}
											</button>
										))}
									</div>
								</div>

								<label className="form-field">
									<span className="field-label">Clock In Time</span>
									<input
										type="time"
										className="text-input"
										value={checkIn}
										onChange={(e) => setCheckIn(e.target.value)}
									/>
								</label>

								<label className="form-field">
									<span className="field-label">Clock Out Time</span>
									<input
										type="time"
										className="text-input"
										value={checkOut}
										onChange={(e) => setCheckOut(e.target.value)}
									/>
								</label>
							</>
						)}

						<label className="form-field form-field--span-2">
							<span className="field-label">Manager Remarks / Shift Notes</span>
							<textarea
								className="text-input"
								rows={2}
								placeholder="Optional remarks, override justification, or shift notes..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
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
							disabled={isSubmitting || staffList.length === 0}
						>
							<CalendarCheck size={16} />
							<span>{isSubmitting ? 'Recording...' : 'Save Attendance'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
