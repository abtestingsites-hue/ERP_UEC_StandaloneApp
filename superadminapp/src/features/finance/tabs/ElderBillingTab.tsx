import { useState, useMemo, useEffect } from 'react'
import {
	CheckCircle2,
	ChevronDown,
	FileText,
	IndianRupee,
	MessageSquare,
	Printer,
	Receipt,
	Search,
	UserCheck,
	Users,
	X,
} from 'lucide-react'
import { financeService } from '../finance.service'
import { careService } from '../../care/care.service'
import { visitorSecurityService } from '../../visitor-security/visitorSecurity.service'
import { useActiveUnit } from '../../../context/useActiveUnit'
import { UNCF_BRANDING } from '../../../constants/branding'
import { PatientBillReceiptDrawer } from '../components/PatientBillReceiptDrawer'
import { formatElderId } from '../../../utils/idFormatters'
import type { CarePatient } from '../../care/care.types'
import type {
	AccountTransaction,
	InvoiceRecord,
	PatientLookupResult,
} from '../finance.types'

type ElderBillingTabProps = {
	onInvoiceGenerated: () => void
}

export function ElderBillingTab({ onInvoiceGenerated }: ElderBillingTabProps) {
	const { activeUnitId } = useActiveUnit()

	// Active resident patient dropdown state
	const [activeResidents, setActiveResidents] = useState<CarePatient[]>([])
	const [isLoadingResidents, setIsLoadingResidents] = useState<boolean>(true)
	const [residentSearchTerm, setResidentSearchTerm] = useState<string>('')
	const [selectedResident, setSelectedResident] = useState<CarePatient | null>(null)
	const [showManualLookup, setShowManualLookup] = useState<boolean>(false)

	// Patient resolution
	const [patientQuery, setPatientQuery] = useState<string>('')
	const [patientId, setPatientId] = useState<string>('')
	const [selectedPatientName, setSelectedPatientName] = useState<string>('')
	const [searchResults, setSearchResults] = useState<PatientLookupResult[]>([])
	const [isSearching, setIsSearching] = useState<boolean>(false)

	const [amount, setAmount] = useState<number | ''>(25000)
	const [type, setType] = useState<string>('MONTHLY_BOARDING')
	const [description, setDescription] = useState<string>('Monthly Resident Boarding Fee')

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [successInvoice, setSuccessInvoice] = useState<InvoiceRecord | null>(null)
	const [isSent, setIsSent] = useState<boolean>(false)
	const [sentContact, setSentContact] = useState<string>('')
	const [showStatementDrawer, setShowStatementDrawer] = useState<boolean>(false)
	const [isDispatching, setIsDispatching] = useState<boolean>(false)

	// Lookup Bill History
	const [lookupRefNo, setLookupRefNo] = useState<string>('')
	const [isLookingUp, setIsLookingUp] = useState<boolean>(false)
	const [lookedUpInvoice, setLookedUpInvoice] = useState<InvoiceRecord | null>(null)
	const [lookupError, setLookupError] = useState<string | null>(null)

	// Load active residents on mount or unit switch
	useEffect(() => {
		let isMounted = true
		setIsLoadingResidents(true)

		const fetchResidents = async () => {
			try {
				const carePatients = await careService.getActivePatients(activeUnitId)
				if (isMounted && Array.isArray(carePatients) && carePatients.length > 0) {
					setActiveResidents(carePatients)
					setIsLoadingResidents(false)
					return
				}
			} catch {
				// Fallback to visitor security service
			}

			try {
				const fallback = await visitorSecurityService.getResidents(activeUnitId)
				if (isMounted) {
					const mapped: CarePatient[] = (fallback || []).map((r) => ({
						id: r.id,
						name: r.name,
						elderId: r.elderId || null,
					}))
					setActiveResidents(mapped)
				}
			} catch {
				if (isMounted) setActiveResidents([])
			} finally {
				if (isMounted) setIsLoadingResidents(false)
			}
		}

		fetchResidents()

		return () => {
			isMounted = false
		}
	}, [activeUnitId])

	const filteredResidents = useMemo(() => {
		if (!residentSearchTerm.trim()) return activeResidents
		const term = residentSearchTerm.toLowerCase()
		return activeResidents.filter(
			(r) =>
				r.name.toLowerCase().includes(term) ||
				(r.elderId && r.elderId.toLowerCase().includes(term)) ||
				(r.room && String(r.room).toLowerCase().includes(term)) ||
				(r.bed && String(r.bed).toLowerCase().includes(term)),
		)
	}, [activeResidents, residentSearchTerm])

	const handleSelectResident = (resId: string) => {
		if (!resId) {
			setPatientId('')
			setSelectedPatientName('')
			setSelectedResident(null)
			return
		}
		const found = activeResidents.find((r) => r.id === resId)
		if (found) {
			setPatientId(found.id)
			setSelectedPatientName(found.name)
			setSelectedResident(found)
			setDescription(`Monthly Resident Boarding Fee - ${found.name}`)
			if (!amount || Number(amount) <= 0) {
				setAmount(25000)
			}
			if (found.emergencyContact || found.phone) {
				setSentContact(found.emergencyContact || found.phone || '')
			}
			setError(null)
		}
	}

	const handleClearSelectedResident = () => {
		setPatientId('')
		setSelectedPatientName('')
		setSelectedResident(null)
		setResidentSearchTerm('')
	}

	const formatElderWhatsAppMessage = (invoice: InvoiceRecord) => {
		const patientName = selectedPatientName || 'Resident'
		const ref = invoice.refNo || 'N/A'
		const gross = Number(invoice.amount || amount || 0).toFixed(2)

		return (
			`*Universal Nature Care & Cure Foundation (UNCF Trust)*\n` +
			`*Elder Care Resident Statement & Payment Advice*\n\n` +
			`Dear Family / Guardian,\n` +
			`Please find the care statement details for *${patientName}*:\n\n` +
			`• *Statement Ref:* ${ref}\n` +
			`• *Description:* ${description || 'Monthly Resident Boarding Fee'}\n` +
			`• *Total Due:* ₹${gross}\n\n` +
			`• *Payment Mode / UPI:* ${UNCF_BRANDING.bankDetails.upiId}\n` +
			`• *Bank:* ${UNCF_BRANDING.bankDetails.bankName} | A/C: ${UNCF_BRANDING.bankDetails.accountNumber} | IFSC: ${UNCF_BRANDING.bankDetails.ifscCode}\n` +
			`_(Please quote Ref ${ref} when transferring funds)_\n\n` +
			`🙏 _"${UNCF_BRANDING.gitaQuotes[0].quote} — ${UNCF_BRANDING.gitaQuotes[0].verse}"_\n\n` +
			`Thank you for entrusting Universal Health Care with your care.`
		)
	}

	const handleSendWhatsApp = async () => {
		if (!successInvoice) return
		const promptVal = window.prompt(
			'Enter WhatsApp Mobile Number for Family / Guardian (10 digits):',
			sentContact || '',
		)
		if (!promptVal) return
		const cleanPhone = promptVal.replace(/[^0-9]/g, '')
		const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

		if (fullPhone.length < 10) {
			alert('Please enter a valid 10-digit mobile number.')
			return
		}

		const msg = formatElderWhatsAppMessage(successInvoice)
		const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`

		// Reliable direct anchor click prevents browser popup blockers
		const a = document.createElement('a')
		a.href = url
		a.target = '_blank'
		a.rel = 'noopener noreferrer'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)

		setIsDispatching(true)
		try {
			await financeService.markPatientReceiptSent({
				invoiceId: successInvoice.id,
				sentVia: 'WhatsApp',
				familyContact: fullPhone,
			})
			setIsSent(true)
			setSentContact(fullPhone)
		} catch (err) {
			console.error('Failed to record dispatch', err)
		} finally {
			setIsDispatching(false)
		}
	}

	const invoiceAsAccountTransaction = useMemo<AccountTransaction | null>(() => {
		if (!successInvoice) return null
		const net = Number(successInvoice.amount || amount || 0)
		return {
			id: successInvoice.id,
			refNo: successInvoice.refNo || 'UEC-INV',
			type: 'INVOICE',
			amount: net,
			status: 'FINALIZED',
			clientName: selectedPatientName || 'Resident',
			date: new Date().toISOString(),
			tenantId: successInvoice.tenantId || 'DEFAULT',
			unitId: successInvoice.unitId || 'UNIVERSAL_ELDER_CARE',
			createdAt: successInvoice.createdAt || new Date().toISOString(),
			updatedAt: successInvoice.updatedAt || new Date().toISOString(),
			metadata: {
				serviceType: 'Elder Care Boarding',
				patientName: selectedPatientName,
				familyContact: sentContact,
				paidAmount: 0,
				balanceAmount: net,
				upiId: 'mab.037347029020081@axisbank',
				invoiceWorkflowStatus: isSent ? 'SENT' : 'CREATED',
				sentVia: 'WhatsApp',
				chargeSummary: [
					{
						category: 'Monthly Resident Boarding Fee',
						description: description || 'Monthly Boarding and Care Tariff',
						quantity: 1,
						rate: net,
						amount: net,
					},
				],
			},
		}
	}, [successInvoice, amount, selectedPatientName, description, sentContact, isSent])

	const handleSearchPatients = async () => {
		if (!patientQuery.trim() || patientQuery.length < 3) return
		setIsSearching(true)
		try {
			const res = await financeService.lookupPatient(patientQuery)
			setSearchResults(res)
		} catch {
			setSearchResults([])
		} finally {
			setIsSearching(false)
		}
	}

	const handleSelectPatient = (p: PatientLookupResult) => {
		setPatientId(p.id)
		setSelectedPatientName(p.name)
		setSearchResults([])
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!patientId) {
			setError('Please search and select a resident patient first.')
			return
		}
		if (!amount || Number(amount) <= 0) {
			setError('Please enter a valid billing amount.')
			return
		}

		setIsSubmitting(true)
		setError(null)
		setSuccessInvoice(null)

		try {
			const res = await financeService.generateElderBill({
				patientId,
				amount: Number(amount),
				type,
				description,
			})
			setSuccessInvoice(res)
			onInvoiceGenerated()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to generate Elder Care billing invoice.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleLookupHistory = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!lookupRefNo.trim()) return
		setIsLookingUp(true)
		setLookupError(null)
		setLookedUpInvoice(null)

		try {
			const res = await financeService.getElderBillHistory(lookupRefNo.trim())
			if (res) {
				setLookedUpInvoice(res)
			} else {
				setLookupError(`Invoice with Ref "${lookupRefNo}" was not found.`)
			}
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setLookupError(
				axiosError?.response?.data?.message ||
					axiosError?.message ||
					'Failed to retrieve invoice record.',
			)
		} finally {
			setIsLookingUp(false)
		}
	}

	return (
		<div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
				{/* Generation Card */}
				<div
					style={{
						backgroundColor: '#ffffff',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
						padding: '1.5rem',
					}}
				>
					<div style={{ marginBottom: '1.25rem' }}>
						<span className="section-kicker">UEC ELDER BILLING</span>
						<h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
							Generate Elder Care Resident Bill
						</h3>
						<p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
							Creates an authoritative invoice in the database under prefix <code>UEC-INV-YYYY</code>.
						</p>
					</div>

					{error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

					{successInvoice && (
						<div
							style={{
								marginBottom: '1rem',
								backgroundColor: '#f0fdfa',
								border: '2px solid #0F969C',
								borderRadius: '8px',
								padding: '1rem',
								fontSize: '0.825rem',
								color: '#0f766e',
								display: 'flex',
								flexDirection: 'column',
								gap: '0.75rem',
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
									<CheckCircle2 size={16} />
									Invoice Generated Successfully!
								</div>
								{isSent ? (
									<span className="status-badge status-badge--active" style={{ fontSize: '0.75rem' }}>
										Dispatched ({sentContact || 'WhatsApp'})
									</span>
								) : (
									<span className="status-badge status-badge--active" style={{ fontSize: '0.75rem' }}>
										FINALIZED
									</span>
								)}
							</div>
							<p style={{ margin: 0, color: '#334155' }}>
								Invoice Ref: <strong>{successInvoice.refNo}</strong> | Amount:{' '}
								<strong style={{ color: '#0F969C' }}>
									₹{Number(successInvoice.amount || 0).toFixed(2)}
								</strong>
							</p>

							<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #ccfbf1' }}>
								{isSent ? (
									<button
										type="button"
										className="button button--small"
										disabled
										style={{
											backgroundColor: '#f1f5f9',
											borderColor: '#cbd5e1',
											color: '#0f766e',
											fontWeight: 700,
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.4rem',
											cursor: 'not-allowed',
											opacity: 0.9,
										}}
									>
										<CheckCircle2 size={14} color="#0F969C" />
										Dispatched via WhatsApp
									</button>
								) : (
									<button
										type="button"
										className="button primary button--small"
										style={{
											backgroundColor: '#25D366',
											borderColor: '#22bf5b',
											color: '#ffffff',
											fontWeight: 700,
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.4rem',
										}}
										onClick={handleSendWhatsApp}
										disabled={isDispatching}
									>
										<MessageSquare size={14} />
										Send via WhatsApp
									</button>
								)}
								<button
									type="button"
									className="button secondary button--small"
									onClick={() => setShowStatementDrawer(true)}
									style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
								>
									<Printer size={14} />
									Print / View Statement
								</button>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						{/* Active Resident Patient Dropdown & Selector */}
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
								<label className="field-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
									<Users size={14} color="#0F969C" />
									Active Resident Patient *
								</label>
								<button
									type="button"
									onClick={() => setShowManualLookup(!showManualLookup)}
									style={{
										background: 'none',
										border: 'none',
										color: '#0F969C',
										fontSize: '0.75rem',
										cursor: 'pointer',
										fontWeight: 600,
										textDecoration: 'underline',
									}}
								>
									{showManualLookup ? 'Use Active Residents List' : 'Search by Name / Historical'}
								</button>
							</div>

							{selectedPatientName ? (
								<div
									style={{
										backgroundColor: '#f0fdfa',
										border: '1.5px solid #0F969C',
										borderRadius: '8px',
										padding: '0.75rem 1rem',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										gap: '0.75rem',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
										<div
											style={{
												width: '38px',
												height: '38px',
												borderRadius: '50%',
												backgroundColor: '#0F969C',
												color: '#ffffff',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: 800,
												fontSize: '1rem',
											}}
										>
											{selectedPatientName.charAt(0).toUpperCase()}
										</div>
										<div>
											<div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.95rem' }}>
												{selectedPatientName}
											</div>
											<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
												Elder ID:{' '}
												<strong style={{ color: '#0f172a' }}>
													{formatElderId(selectedResident?.elderId, patientId)}
												</strong>
												{selectedResident?.room ? ` • Room: ${selectedResident.room}` : ''}
												{selectedResident?.bed ? ` • Bed: ${selectedResident.bed}` : ''}
												{selectedResident?.age ? ` • Age: ${selectedResident.age}y` : ''}
												{selectedResident?.gender ? ` • ${selectedResident.gender}` : ''}
											</div>
										</div>
									</div>

									<button
										type="button"
										className="button secondary button--small"
										onClick={handleClearSelectedResident}
										style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
									>
										<X size={13} />
										Change
									</button>
								</div>
							) : showManualLookup ? (
								/* Manual Lookup Box */
								<div>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<div className="search-box" style={{ flex: 1 }}>
											<Search size={15} />
											<input
												type="text"
												value={patientQuery}
												onChange={(e) => setPatientQuery(e.target.value)}
												onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPatients())}
												placeholder="Search patient name (e.g. Harish, Naveen)..."
											/>
										</div>
										<button
											type="button"
											className="button secondary button--small"
											onClick={handleSearchPatients}
											disabled={isSearching}
										>
											{isSearching ? 'Searching...' : 'Find'}
										</button>
									</div>

									{searchResults.length > 0 && (
										<div
											style={{
												marginTop: '0.5rem',
												border: '1px solid #cbd5e1',
												borderRadius: '6px',
												maxHeight: '150px',
												overflowY: 'auto',
												backgroundColor: '#f8fafc',
											}}
										>
											{searchResults.map((p) => (
												<div
													key={p.id}
													onClick={() => handleSelectPatient(p)}
													style={{
														padding: '0.5rem 0.75rem',
														borderBottom: '1px solid #e2e8f0',
														cursor: 'pointer',
														fontSize: '0.8rem',
													}}
												>
													<strong>{p.name}</strong> ({p.gender || 'Unknown'}, {p.age ? `${p.age} yrs` : 'No age'})
													<span style={{ color: '#0f172a', fontWeight: 600, marginLeft: '0.5rem' }}>ID: {formatElderId(p.elderId, p.id)}</span>
												</div>
											))}
										</div>
									)}
								</div>
							) : (
								/* Primary Active Residents Dropdown with Quick Filter */
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
									{activeResidents.length > 5 && (
										<div className="search-box" style={{ marginBottom: '0.2rem' }}>
											<Search size={14} />
											<input
												type="text"
												value={residentSearchTerm}
												onChange={(e) => setResidentSearchTerm(e.target.value)}
												placeholder="Quick filter resident list by name, elder ID, or room..."
												style={{ fontSize: '0.8rem' }}
											/>
										</div>
									)}

									<select
										className="filter-select"
										value={patientId}
										onChange={(e) => handleSelectResident(e.target.value)}
										disabled={isLoadingResidents}
										style={{
											width: '100%',
											height: '42px',
											fontWeight: 600,
											fontSize: '0.85rem',
											borderColor: '#cbd5e1',
											backgroundColor: '#ffffff',
										}}
									>
										<option value="">
											{isLoadingResidents
												? 'Loading active resident patients...'
												: `-- Select Active Resident Patient (${filteredResidents.length} Available) --`}
										</option>
										{filteredResidents.map((r) => (
											<option key={r.id} value={r.id}>
												{r.name} {r.elderId ? `(${r.elderId})` : ''} {r.room ? `• Room ${r.room}` : ''}{' '}
												{r.bed ? `• Bed ${r.bed}` : ''}
											</option>
										))}
									</select>

									{!isLoadingResidents && activeResidents.length === 0 && (
										<p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
											No active admitted residents found for current unit.{' '}
											<button
												type="button"
												onClick={() => setShowManualLookup(true)}
												style={{
													background: 'none',
													border: 'none',
													color: '#0F969C',
													cursor: 'pointer',
													fontWeight: 600,
													textDecoration: 'underline',
													padding: 0,
												}}
											>
												Search database directly
											</button>
										</p>
									)}
								</div>
							)}
						</div>

						{/* Amount & Type */}
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
							<div>
								<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
									Billing Amount (₹) *
								</label>
								<div className="search-box">
									<IndianRupee size={15} />
									<input
										type="number"
										step="0.01"
										min="1"
										required
										value={amount}
										onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
										placeholder="e.g. 25000"
									/>
								</div>
							</div>

							<div>
								<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
									Fee Type *
								</label>
								<select
									className="filter-select"
									value={type}
									onChange={(e) => setType(e.target.value)}
									style={{ width: '100%', height: '42px' }}
								>
									<option value="MONTHLY_BOARDING">Monthly Boarding Fee</option>
									<option value="SPECIALIZED_NURSING">Specialized Nursing Fee</option>
									<option value="PHYSIOTHERAPY_PACKAGE">Physiotherapy Package</option>
									<option value="MEDICAL_MAINTENANCE">Medical Maintenance</option>
									<option value="DIETARY_CHARGES">Dietary Supplement Charges</option>
								</select>
							</div>
						</div>

						<div>
							<label className="field-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
								Billing Description / Memo
							</label>
							<input
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="e.g. Room boarding for current calendar month"
							/>
						</div>

						<button
							type="submit"
							className="button primary"
							disabled={isSubmitting}
							style={{ marginTop: '0.5rem' }}
						>
							<Receipt size={16} />
							{isSubmitting ? 'Generating...' : 'Finalize & Post Elder Bill'}
						</button>
					</form>
				</div>

				{/* History & Lookup Card */}
				<div
					style={{
						backgroundColor: '#ffffff',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
						padding: '1.5rem',
					}}
				>
					<div style={{ marginBottom: '1.25rem' }}>
						<span className="section-kicker">INVOICE AUDIT LOOKUP</span>
						<h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
							Inspect UEC Invoice Record
						</h3>
						<p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
							Fetch stored bill metadata and status using the official bill ID.
						</p>
					</div>

					<form onSubmit={handleLookupHistory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
						<div className="search-box" style={{ flex: 1 }}>
							<Receipt size={15} />
							<input
								type="text"
								value={lookupRefNo}
								onChange={(e) => setLookupRefNo(e.target.value)}
								placeholder="Enter Bill Ref (e.g. UEC-INV-2026-0001)..."
							/>
						</div>
						<button
							type="submit"
							className="button secondary"
							disabled={isLookingUp}
						>
							{isLookingUp ? 'Searching...' : 'Inspect'}
						</button>
					</form>

					{lookupError && <div className="error-banner">{lookupError}</div>}

					{lookedUpInvoice ? (
						<div
							style={{
								backgroundColor: '#f8fafc',
								border: '1px solid #cbd5e1',
								borderRadius: '8px',
								padding: '1rem',
								fontSize: '0.825rem',
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
								<strong style={{ color: '#0F969C', fontSize: '1rem' }}>{lookedUpInvoice.refNo}</strong>
								<span
									className={`status-badge status-badge--${
										lookedUpInvoice.status === 'PAID'
											? 'active'
											: lookedUpInvoice.status === 'FINALIZED'
												? 'active'
												: 'pending'
									}`}
								>
									{lookedUpInvoice.status}
								</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
								<div>
									<span style={{ color: '#64748b' }}>Amount:</span>{' '}
									<strong style={{ color: '#0f172a' }}>₹{Number(lookedUpInvoice.amount || 0).toFixed(2)}</strong>
								</div>
								<div>
									<span style={{ color: '#64748b' }}>Finalized:</span>{' '}
									<span>{lookedUpInvoice.isFinalized ? 'Yes (Immutable)' : 'No'}</span>
								</div>
								<div>
									<span style={{ color: '#64748b' }}>Sent to Family:</span>{' '}
									<span>{lookedUpInvoice.isSent ? 'Sent' : 'Draft / Ready'}</span>
								</div>
								<div>
									<span style={{ color: '#64748b' }}>Created At:</span>{' '}
									<span>{new Date(lookedUpInvoice.createdAt).toLocaleDateString('en-IN')}</span>
								</div>
							</div>

							{lookedUpInvoice.metadata && (() => {
								const meta = lookedUpInvoice.metadata as Record<string, unknown>
								const ignored = new Set(['tenantId', 'unitId', 'id', 'invoiceId', 'patientId'])
								const entries = Object.entries(meta).filter(
									([k, v]) => !ignored.has(k) && v !== null && v !== undefined && v !== '',
								)
								if (entries.length === 0) return null

								return (
									<div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
										<span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
											BILL AUDIT & REFERENCE:
										</span>
										<div
											style={{
												marginTop: '0.35rem',
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
												gap: '0.5rem',
												backgroundColor: '#ffffff',
												padding: '0.6rem',
												borderRadius: '6px',
												border: '1px solid #e2e8f0',
											}}
										>
											{entries.map(([k, v]) => (
												<div key={k}>
													<span
														style={{
															fontSize: '0.675rem',
															color: '#64748b',
															textTransform: 'uppercase',
															fontWeight: 600,
														}}
													>
														{k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
													</span>
													<p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
														{typeof v === 'object' ? JSON.stringify(v) : String(v)}
													</p>
												</div>
											))}
										</div>
									</div>
								)
							})()}
						</div>
					) : (
						<div className="empty-state" style={{ padding: '2rem 1rem' }}>
							<FileText size={32} color="#94a3b8" />
							<p>Enter an invoice reference to review verified database record.</p>
						</div>
					)}
				</div>
			</div>

			{showStatementDrawer && invoiceAsAccountTransaction && (
				<PatientBillReceiptDrawer
					invoice={invoiceAsAccountTransaction}
					onClose={() => setShowStatementDrawer(false)}
					onMarkSent={(contact) => {
						setIsSent(true)
						if (contact) setSentContact(contact)
					}}
				/>
			)}
		</div>
	)
}
