import { useState } from 'react'
import { UserPlus, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'

type AddCandidateModalProps = {
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
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

const ROLES = [
	'Staff Nurse',
	'Senior Caregiver',
	'Home Care Attendant',
	'Physiotherapist',
	'Medical Officer',
	'Maintenance Technician',
	'Security Guard',
	'Operations Executive',
]

export function AddCandidateModal({
	onClose,
	onSuccess,
	isOpen = true,
}: AddCandidateModalProps) {
	const [name, setName] = useState<string>('')
	const [mobileNo, setMobileNo] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [preferredRole, setPreferredRole] = useState<string>(ROLES[0])
	const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
	const [experienceYears, setExperienceYears] = useState<number>(2)
	const [expectedSalary, setExpectedSalary] = useState<number>(25000)
	const [stage, setStage] = useState<string>('APPLIED')

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) {
			setError('Please enter candidate name.')
			return
		}
		if (!mobileNo.trim()) {
			setError('Please enter contact mobile number.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.createCandidate({
				name: name.trim(),
				mobileNo: mobileNo.trim(),
				email: email.trim() || undefined,
				preferredRole,
				department,
				experienceYears: Number(experienceYears) || 0,
				expectedSalary: Number(expectedSalary) || 0,
				stage,
			})
			onSuccess?.()
			onClose()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to register job candidate.',
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
						<span className="section-kicker">TALENT RECRUITMENT</span>
						<h2>Add Candidate to Pipeline</h2>
						<p className="field-hint">
							Capture applicant details, role match, and target stage.
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
							<span className="field-label">Candidate Full Name *</span>
							<input
								type="text"
								className="text-input"
								placeholder="e.g. Priyadarshini Sundaram"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Mobile Number *</span>
							<input
								type="tel"
								className="text-input"
								placeholder="+91 98765 43210"
								value={mobileNo}
								onChange={(e) => setMobileNo(e.target.value)}
								required
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Email Address</span>
							<input
								type="email"
								className="text-input"
								placeholder="candidate@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Role Applied *</span>
							<select
								className="filter-select"
								value={preferredRole}
								onChange={(e) => setPreferredRole(e.target.value)}
								required
							>
								{ROLES.map((r) => (
									<option key={r} value={r}>
										{r}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Department *</span>
							<select
								className="filter-select"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								required
							>
								{DEPARTMENTS.map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Relevant Experience (Years)</span>
							<input
								type="number"
								min={0}
								max={40}
								className="text-input"
								value={experienceYears}
								onChange={(e) => setExperienceYears(Number(e.target.value))}
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Expected Monthly Pay (₹)</span>
							<input
								type="number"
								min={0}
								step={500}
								className="text-input"
								value={expectedSalary}
								onChange={(e) => setExpectedSalary(Number(e.target.value))}
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Initial Recruitment Stage *</span>
							<select
								className="filter-select"
								value={stage}
								onChange={(e) => setStage(e.target.value)}
								required
							>
								<option value="APPLIED">Applied (Lead Received)</option>
								<option value="SCREENING">Screening (Profile Evaluated)</option>
								<option value="INTERVIEW">Interview Scheduled</option>
								<option value="OFFERED">Offer Extended</option>
							</select>
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
							<UserPlus size={16} />
							<span>{isSubmitting ? 'Saving...' : 'Add Candidate'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
