import { useState, useEffect } from 'react'
import { UserPlus, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'

type AddStaffModalProps = {
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
	onCreated?: () => void
	activeUnitId?: string | null
}

const DEPARTMENTS = [
	'Nursing & Patient Care',
	'Home Care Services',
	'Dietary & Kitchen',
	'Housekeeping & Linen',
	'Facility Maintenance',
	'Administration & Security',
	'Finance & Accounts',
]

const DESIGNATIONS = [
	'Staff Nurse',
	'Nursing Manager',
	'Senior Caregiver',
	'Home Care Attendant',
	'Physiotherapist',
	'Medical Officer',
	'Dietician / Cook',
	'Maintenance Technician',
	'Security Guard',
	'Operations Executive',
	'Accountant',
]

const UNIT_OPTIONS = [
	{ id: '5c83400d-d805-4f7a-9629-9e370d7f4618', name: 'UNCF' },
	{ id: 'bba40046-4e27-41ef-b5b1-743d7e04713f', name: 'Universal Health Care' },
	{ id: '67863389-afea-4f4b-a8d8-24dc15193176', name: 'Universal Elder Care' },
	{ id: 'e168935f-c8b0-437b-9643-4f05f70b5976', name: 'Universal Ambulance' },
	{ id: '91fa9308-fb1f-4e39-a67b-f9e6b7eb8a44', name: 'Universal Enquiry Office' },
	{ id: '5d117c8d-8b1f-4940-8cc0-ed430c5ab987', name: 'Headquarters' },
]

export function AddStaffModal({
	onClose,
	onSuccess,
	isOpen = true,
	onCreated,
	activeUnitId,
}: AddStaffModalProps) {
	const defaultUnit =
		activeUnitId && activeUnitId !== 'ALL_UNITS'
			? activeUnitId
			: '5c83400d-d805-4f7a-9629-9e370d7f4618'

	const [unitId, setUnitId] = useState<string>(defaultUnit)
	const [empId, setEmpId] = useState<string>('')
	const [name, setName] = useState<string>('')
	const [role, setRole] = useState<string>(DESIGNATIONS[0])
	const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
	const [phone, setPhone] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [joiningDate, setJoiningDate] = useState<string>(() =>
		new Date().toISOString().split('T')[0],
	)
	const [status, setStatus] = useState<string>('Working')

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (activeUnitId && activeUnitId !== 'ALL_UNITS') {
			setUnitId(activeUnitId)
		}
	}, [activeUnitId])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) {
			setError('Please enter employee name.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.createStaff({
				unitId,
				empId: empId.trim() || undefined,
				name: name.trim(),
				role,
				department,
				phone: phone.trim() || undefined,
				email: email.trim() || undefined,
				joiningDate,
				status,
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
					'Failed to onboard new staff member.',
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
						<span className="section-kicker">HR RECRUITMENT & ONBOARDING</span>
						<h2>Onboard New Staff Member</h2>
						<p className="field-hint">
							Creates an authoritative employee record in the organizational workforce database.
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
							<span className="field-label">Assigned Operating Unit *</span>
							<select
								className="filter-select"
								value={unitId}
								onChange={(e) => setUnitId(e.target.value)}
								required
							>
								{UNIT_OPTIONS.map((u) => (
									<option key={u.id} value={u.id}>
										{u.name}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Employee ID (Optional)</span>
							<input
								type="text"
								value={empId}
								onChange={(e) => setEmpId(e.target.value)}
								placeholder="e.g. EMP-101 (Auto-generated if empty)"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Full Name *</span>
							<input
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="First and Last name"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Department *</span>
							<select
								className="filter-select"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								required
							>
								{DEPARTMENTS.map((dept) => (
									<option key={dept} value={dept}>
										{dept}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Role / Designation *</span>
							<select
								className="filter-select"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								required
							>
								{DESIGNATIONS.map((desig) => (
									<option key={desig} value={desig}>
										{desig}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Contact Phone</span>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="Mobile or phone number"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Official Email</span>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="employee@domain.com"
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Joining Date *</span>
							<input
								type="date"
								required
								value={joiningDate}
								onChange={(e) => setJoiningDate(e.target.value)}
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Initial Employment Status *</span>
							<select
								className="filter-select"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								required
							>
								<option value="Working">Working (Active)</option>
								<option value="Probation">Probationary</option>
								<option value="Contract">Contractual</option>
								<option value="On Leave">On Leave</option>
							</select>
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
							<UserPlus size={16} />
							<span>{isSubmitting ? 'Onboarding...' : 'Onboard Employee'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
