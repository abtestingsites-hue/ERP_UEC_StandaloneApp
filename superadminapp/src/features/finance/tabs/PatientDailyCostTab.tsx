import { useState, useMemo } from 'react'
import {
	CheckCircle2,
	FileText,
	IndianRupee,
	Plus,
	Receipt,
	Search,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { PatientDailyCost, PatientService } from '../finance.types'

type PatientDailyCostTabProps = {
	entries: PatientDailyCost[]
	services: PatientService[]
	isLoading: boolean
	onRefresh: () => void
	onInvoiceGenerated: () => void
}

const CATEGORIES = [
	'Care Service Charges',
	'Medicine Charges',
	'Doctor Consultation Charges',
	'Consumable Charges',
	'Lab Charges',
	'Accommodation Charges',
	'Other Charges',
]

export function PatientDailyCostTab({
	entries,
	services,
	isLoading,
	onRefresh,
	onInvoiceGenerated,
}: PatientDailyCostTabProps) {
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [selectedServiceId, setSelectedServiceId] = useState<string>('ALL')
	const [statusFilter, setStatusFilter] = useState<string>('ALL')

	// Add Expense Modal State
	const [showAddModal, setShowAddModal] = useState<boolean>(false)
	const [newAllocationId, setNewAllocationId] = useState<string>(
		services[0]?.allocationId || '',
	)
	const [newCostDate, setNewCostDate] = useState<string>(
		new Date().toISOString().split('T')[0],
	)
	const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0])
	const [newDescription, setNewDescription] = useState<string>('')
	const [newQuantity, setNewQuantity] = useState<number>(1)
	const [newRate, setNewRate] = useState<number>(0)
	const [isAdding, setIsAdding] = useState<boolean>(false)
	const [addError, setAddError] = useState<string | null>(null)

	// Invoicing Selection State
	const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])
	const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false)
	const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<string | null>(null)

	const filteredEntries = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		return entries.filter((e) => {
			if (selectedServiceId !== 'ALL' && e.allocationId !== selectedServiceId) {
				return false
			}
			if (statusFilter !== 'ALL' && e.status !== statusFilter) {
				return false
			}

			if (!query) return true

			const patient = (e.patientName || '').toLowerCase()
			const client = (e.clientName || '').toLowerCase()
			const costNo = (e.costNo || '').toLowerCase()
			const cat = (e.category || '').toLowerCase()
			const desc = (e.description || '').toLowerCase()

			return (
				patient.includes(query) ||
				client.includes(query) ||
				costNo.includes(query) ||
				cat.includes(query) ||
				desc.includes(query)
			)
		})
	}, [entries, searchQuery, selectedServiceId, statusFilter])

	// Unbilled entries for batch selection
	const unbilledEntries = useMemo(() => {
		return filteredEntries.filter(
			(e) => e.status === 'DRAFT' || e.status === 'REVIEWED',
		)
	}, [filteredEntries])

	const toggleSelectEntry = (id: string) => {
		setSelectedEntryIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		)
	}

	const toggleSelectAllUnbilled = () => {
		if (selectedEntryIds.length === unbilledEntries.length) {
			setSelectedEntryIds([])
		} else {
			setSelectedEntryIds(unbilledEntries.map((e) => e.id))
		}
	}

	const handleAddEntry = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newAllocationId) {
			setAddError('Please select a patient service allocation.')
			return
		}
		if (!newDescription.trim()) {
			setAddError('Please enter a description for this expense item.')
			return
		}
		if (newRate <= 0) {
			setAddError('Charge rate must be greater than zero.')
			return
		}

		setIsAdding(true)
		setAddError(null)

		try {
			await financeService.createPatientDailyCost({
				allocationId: newAllocationId,
				costDate: newCostDate,
				category: newCategory,
				description: newDescription.trim(),
				quantity: newQuantity,
				rate: newRate,
			})
			setShowAddModal(false)
			setNewDescription('')
			setNewRate(0)
			onRefresh()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setAddError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to record daily patient expense.',
			)
		} finally {
			setIsAdding(false)
		}
	}

	const handleGenerateMonthlyInvoice = async () => {
		if (selectedEntryIds.length === 0) return
		setIsGeneratingInvoice(true)
		setInvoiceSuccessMsg(null)

		try {
			const res = await financeService.generatePatientInvoice({
				entryIds: selectedEntryIds,
				notes: `Consolidated patient invoice for ${selectedEntryIds.length} daily entries`,
			})
			setInvoiceSuccessMsg(
				`Monthly invoice ${res?.invoice?.refNo || ''} posted to accounting ledger!`,
			)
			setSelectedEntryIds([])
			onInvoiceGenerated()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			alert(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to generate monthly invoice.',
			)
		} finally {
			setIsGeneratingInvoice(false)
		}
	}

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
			{/* Filters Header */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '1rem',
					justifyContent: 'space-between',
					alignItems: 'center',
					backgroundColor: '#ffffff',
					padding: '1rem 1.25rem',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
					<div className="search-box" style={{ minWidth: '220px', flex: 1 }}>
						<Search size={16} />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search patient, item, or cost #..."
						/>
					</div>

					<select
						className="filter-select"
						value={selectedServiceId}
						onChange={(e) => setSelectedServiceId(e.target.value)}
						style={{ height: '38px', maxWidth: '240px' }}
					>
						<option value="ALL">All Patients & Services</option>
						{services.map((s) => (
							<option key={s.allocationId} value={s.allocationId}>
								{s.patientName} ({s.serviceType})
							</option>
						))}
					</select>

					<select
						className="filter-select"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{ height: '38px' }}
					>
						<option value="ALL">All Statuses</option>
						<option value="DRAFT">Draft / Unbilled</option>
						<option value="REVIEWED">Reviewed</option>
						<option value="INVOICED">Invoiced</option>
						<option value="PAID">Paid</option>
					</select>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{selectedEntryIds.length > 0 && (
						<button
							type="button"
							className="button primary button--small"
							onClick={handleGenerateMonthlyInvoice}
							disabled={isGeneratingInvoice}
							style={{ backgroundColor: '#0F969C' }}
						>
							<Receipt size={14} />
							{isGeneratingInvoice
								? 'Generating...'
								: `Invoice Selected (${selectedEntryIds.length})`}
						</button>
					)}
					<button
						type="button"
						className="button primary button--small"
						onClick={() => setShowAddModal(true)}
					>
						<Plus size={14} />
						+ Add Daily Expense
					</button>
				</div>
			</div>

			{invoiceSuccessMsg && (
				<div
					style={{
						backgroundColor: '#f0fdfa',
						border: '1px solid #99f6e4',
						borderRadius: '8px',
						padding: '0.85rem 1rem',
						fontSize: '0.85rem',
						color: '#0f766e',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<CheckCircle2 size={16} />
					{invoiceSuccessMsg}
				</div>
			)}

			{/* Ledger Table */}
			<div
				style={{
					backgroundColor: '#ffffff',
					borderRadius: '12px',
					border: '1px solid #e2e8f0',
					overflow: 'hidden',
				}}
			>
				{isLoading ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<FileText size={32} className="spin" />
						<p>Loading patient expense entries...</p>
					</div>
				) : filteredEntries.length === 0 ? (
					<div className="empty-state" style={{ padding: '3rem 1rem' }}>
						<FileText size={36} color="#94a3b8" />
						<h3>No patient daily expense entries found</h3>
						<p>Record a new daily expense item or adjust your search filter.</p>
					</div>
				) : (
					<div className="erp-table-responsive" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
						<table className="erp-table data-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' }}>
							<thead>
								<tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
									<th style={{ width: '48px', textAlign: 'center', padding: '0.65rem 0.5rem' }}>
										<input
											type="checkbox"
											checked={
												unbilledEntries.length > 0 &&
												selectedEntryIds.length === unbilledEntries.length
											}
											onChange={toggleSelectAllUnbilled}
											disabled={unbilledEntries.length === 0}
											title="Select all unbilled"
										/>
									</th>
									<th style={{ width: '110px', padding: '0.65rem 0.85rem' }}>Cost #</th>
									<th style={{ width: '110px', padding: '0.65rem 0.85rem' }}>Date</th>
									<th style={{ width: '18%', padding: '0.65rem 0.85rem' }}>Patient / Resident</th>
									<th style={{ width: '12%', padding: '0.65rem 0.85rem' }}>Service</th>
									<th style={{ width: '22%', padding: '0.65rem 0.85rem' }}>Category & Item</th>
									<th style={{ width: '60px', textAlign: 'right', padding: '0.65rem 0.85rem' }}>Qty</th>
									<th style={{ width: '100px', textAlign: 'right', padding: '0.65rem 0.85rem' }}>Rate (₹)</th>
									<th style={{ width: '110px', textAlign: 'right', padding: '0.65rem 0.85rem' }}>Amount (₹)</th>
									<th style={{ width: '110px', textAlign: 'center', padding: '0.65rem 0.85rem' }}>Status</th>
									<th style={{ width: '120px', padding: '0.65rem 0.85rem' }}>Invoice Ref</th>
								</tr>
							</thead>
							<tbody>
								{filteredEntries.map((e) => {
									const isUnbilled = e.status === 'DRAFT' || e.status === 'REVIEWED'
									return (
										<tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
											<td style={{ textAlign: 'center', padding: '0.65rem 0.5rem' }}>
												{isUnbilled ? (
													<input
														type="checkbox"
														checked={selectedEntryIds.includes(e.id)}
														onChange={() => toggleSelectEntry(e.id)}
													/>
												) : (
													<span title="Billed" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
														<CheckCircle2 size={15} color="#0F969C" />
													</span>
												)}
											</td>
											<td style={{ padding: '0.65rem 0.85rem' }}>
												<strong style={{ color: '#0F969C', fontSize: '0.85rem' }}>{e.costNo}</strong>
											</td>
											<td style={{ whiteSpace: 'nowrap', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#475569' }}>
												{e.costDate ? new Date(e.costDate).toLocaleDateString('en-IN') : '-'}
											</td>
											<td style={{ padding: '0.65rem 0.85rem' }}>
												<span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
													{e.patientName}
												</span>
											</td>
											<td style={{ padding: '0.65rem 0.85rem' }}>
												<span style={{ fontSize: '0.825rem', color: '#475569' }}>
													{e.serviceType}
												</span>
											</td>
											<td style={{ padding: '0.65rem 0.85rem' }}>
												<div>
													<span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#1e293b' }}>{e.category}</span>
													{e.description && (
														<p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
															{e.description}
														</p>
													)}
												</div>
											</td>
											<td style={{ textAlign: 'right', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>{e.quantity}</td>
											<td style={{ textAlign: 'right', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#475569' }}>₹{Number(e.rate || 0).toFixed(2)}</td>
											<td style={{ textAlign: 'right', fontWeight: 700, padding: '0.65rem 0.85rem', fontSize: '0.875rem', color: '#0F969C' }}>
												₹{Number(e.amount || 0).toFixed(2)}
											</td>
											<td style={{ textAlign: 'center', padding: '0.65rem 0.85rem' }}>
												<span
													className={`status-badge status-badge--${
														e.status === 'INVOICED' || e.status === 'PAID'
															? 'active'
															: 'pending'
													}`}
													style={{ display: 'inline-block' }}
												>
													{e.status}
												</span>
											</td>
											<td style={{ padding: '0.65rem 0.85rem' }}>
												<span style={{ fontSize: '0.8rem', color: e.invoiceRefNo ? '#0F969C' : '#94a3b8', fontWeight: e.invoiceRefNo ? 600 : 400 }}>
													{e.invoiceRefNo || 'Unbilled'}
												</span>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Add Daily Expense Modal */}
			{showAddModal && (
				<div className="modal-overlay" role="dialog" aria-modal="true">
					<div className="modal-card">
						<div className="modal-header">
							<div className="modal-title-wrap">
								<span className="section-kicker">PATIENT BILLING</span>
								<h2>Add Daily Expense Item</h2>
								<p className="field-hint">
									Record medication, consumable, nursing procedure, or doctor visit.
								</p>
							</div>
							<button
								type="button"
								className="icon-button"
								onClick={() => setShowAddModal(false)}
							>
								×
							</button>
						</div>

						{addError && <div className="error-banner">{addError}</div>}

						<form onSubmit={handleAddEntry} className="modal-form">
							<div className="form-grid">
								<label className="form-field form-field--span-2">
									<span className="field-label">Patient Service Allocation *</span>
									<select
										className="filter-select"
										value={newAllocationId}
										onChange={(e) => setNewAllocationId(e.target.value)}
										style={{ width: '100%', height: '42px' }}
										required
									>
										{services.map((s) => (
											<option key={s.allocationId} value={s.allocationId}>
												{s.patientName} — {s.serviceType} ({s.allocationRef || s.allocationId.slice(0, 8)})
											</option>
										))}
									</select>
								</label>

								<label className="form-field">
									<span className="field-label">Cost Date *</span>
									<input
										type="date"
										required
										value={newCostDate}
										onChange={(e) => setNewCostDate(e.target.value)}
									/>
								</label>

								<label className="form-field">
									<span className="field-label">Category *</span>
									<select
										className="filter-select"
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value)}
										style={{ width: '100%', height: '42px' }}
									>
										{CATEGORIES.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</label>

								<label className="form-field form-field--span-2">
									<span className="field-label">Item Description / Procedure *</span>
									<input
										type="text"
										required
										value={newDescription}
										onChange={(e) => setNewDescription(e.target.value)}
										placeholder="e.g. Paracetamol 500mg, wound dressing, catheter change..."
									/>
								</label>

								<label className="form-field">
									<span className="field-label">Quantity *</span>
									<input
										type="number"
										min="1"
										required
										value={newQuantity}
										onChange={(e) => setNewQuantity(Number(e.target.value))}
									/>
								</label>

								<label className="form-field">
									<span className="field-label">Unit Rate (₹) *</span>
									<div className="search-box" style={{ width: '100%' }}>
										<IndianRupee size={15} />
										<input
											type="number"
											step="0.01"
											min="0.01"
											required
											value={newRate || ''}
											onChange={(e) => setNewRate(Number(e.target.value))}
											placeholder="0.00"
										/>
									</div>
								</label>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="button secondary"
									onClick={() => setShowAddModal(false)}
									disabled={isAdding}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="button primary"
									disabled={isAdding}
								>
									<CheckCircle2 size={16} />
									{isAdding ? 'Saving...' : 'Add Expense Item'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
