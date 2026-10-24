import { useState, useEffect } from 'react'
import { CheckSquare, X, AlertCircle } from 'lucide-react'
import { hrOperationsService } from '../hrOperations.service'
import type { StaffMember } from '../hrOperations.types'

const getInitialDueDate = (): string => {
	const d = new Date()
	d.setDate(d.getDate() + 2)
	return d.toISOString().split('T')[0]
}

type CreateTaskModalProps = {
	staffList: StaffMember[]
	onClose: () => void
	onSuccess?: () => void
	isOpen?: boolean
	activeUnitId?: string | null
	onCreated?: () => void
}

export function CreateTaskModal({
	staffList = [],
	onClose,
	onSuccess,
	isOpen = true,
	activeUnitId,
	onCreated,
}: CreateTaskModalProps) {
	const [title, setTitle] = useState<string>('')
	const [description, setDescription] = useState<string>('')
	const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
	const [dueDate, setDueDate] = useState<string>(getInitialDueDate)
	const [assignedStaffId, setAssignedStaffId] = useState<string>(
		staffList[0]?.id || '',
	)

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if ((!assignedStaffId || !staffList.some((s) => s.id === assignedStaffId)) && staffList.length > 0) {
			setAssignedStaffId(staffList[0].id)
		}
	}, [staffList, assignedStaffId])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!title.trim()) {
			setError('Please enter task title.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await hrOperationsService.createTask({
				title: title.trim(),
				description: description.trim() || undefined,
				priority,
				dueDate: dueDate || undefined,
				assigneeId: assignedStaffId || undefined,
				assignedStaffId: assignedStaffId || undefined,
				unitId: activeUnitId || undefined,
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
					'Failed to create operational task.',
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
						<span className="section-kicker">FACILITY OPERATIONS</span>
						<h2>Assign Operational Task</h2>
						<p className="field-hint">
							Dispatch an operational work order or checklist task to staff.
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
							<span className="field-label">Task Title / Work Order *</span>
							<input
								type="text"
								required
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Inspect Room 204 AC unit, restock clean linen cart..."
							/>
						</label>

						<label className="form-field">
							<span className="field-label">Priority Level *</span>
							<select
								className="filter-select"
								value={priority}
								onChange={(e) =>
									setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
								}
							>
								<option value="LOW">Low</option>
								<option value="MEDIUM">Medium</option>
								<option value="HIGH">High</option>
								<option value="URGENT">Urgent / Critical</option>
							</select>
						</label>

						<label className="form-field">
							<span className="field-label">Target Due Date *</span>
							<input
								type="date"
								required
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Assigned Staff Member</span>
							<select
								className="filter-select"
								value={assignedStaffId}
								onChange={(e) => setAssignedStaffId(e.target.value)}
							>
								<option value="">Unassigned (Queue for pick up)</option>
								{staffList.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} ({s.empId || 'No ID'}) — {s.department}
									</option>
								))}
							</select>
						</label>

						<label className="form-field form-field--span-2">
							<span className="field-label">Detailed Scope / Instructions</span>
							<textarea
								className="text-input"
								rows={3}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Enter procedures, safety precautions, checklist items..."
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
							<CheckSquare size={16} />
							<span>{isSubmitting ? 'Creating...' : 'Assign Task'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
