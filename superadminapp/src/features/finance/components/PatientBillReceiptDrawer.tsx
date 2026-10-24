import { useState } from 'react'
import { CheckCircle2, Download, Edit2, MessageSquare, Printer, X } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { UNCF_BRANDING } from '../../../constants/branding'
import type { AccountTransaction } from '../finance.types'

type PatientBillReceiptDrawerProps = {
	invoice: AccountTransaction
	onClose: () => void
	onMarkSent?: (contact?: string) => void
}

export function PatientBillReceiptDrawer({
	invoice,
	onClose,
	onMarkSent,
}: PatientBillReceiptDrawerProps) {
	const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)

	const handlePrint = () => {
		window.print()
	}

	const metadata = invoice.metadata || {}
	const chargeSummary = metadata.chargeSummary || []
	const paidAmount = Number(metadata.paidAmount || 0)
	const totalAmount = Number(invoice.amount || 0)
	const balanceAmount = Number(
		metadata.balanceAmount !== undefined
			? metadata.balanceAmount
			: totalAmount - paidAmount,
	)

	const initialContact = String(
		metadata.familyContact ||
			metadata.guardianContact ||
			metadata.contact ||
			'',
	).trim()

	const [familyPhone, setFamilyPhone] = useState<string>(initialContact)
	const [isEditingPhone, setIsEditingPhone] = useState<boolean>(!initialContact)
	const [phoneError, setPhoneError] = useState<string | null>(null)

	const patientDisplayName =
		invoice.clientName ||
		invoice.allocation?.patientName ||
		(metadata.patientName as string) ||
		'Resident'

	const handleDownloadPdf = async (): Promise<boolean> => {
		const element = document.getElementById('printable-bill-receipt')
		if (!element) return false

		setIsGeneratingPdf(true)
		try {
			const safePatientName = patientDisplayName.replace(/[^a-zA-Z0-9_-]/g, '_')
			const opt = {
				margin: [8, 8, 8, 8],
				filename: `Bill_${safePatientName}_${invoice.refNo}.pdf`,
				image: { type: 'jpeg', quality: 0.98 },
				html2canvas: { scale: 2, useCORS: true, logging: false },
				jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
			}
			await html2pdf().set(opt).from(element).save()
			return true
		} catch (err) {
			console.error('Failed to generate statement PDF', err)
			return false
		} finally {
			setIsGeneratingPdf(false)
		}
	}

	const formatWhatsAppMessage = () => {
		const guardianName = (metadata.guardianName as string) || 'Family / Guardian'
		const refNo = invoice.refNo || 'N/A'
		const service = (metadata.serviceType as string) || 'Elder / Patient Care'
		const period =
			metadata.billingPeriodFrom && metadata.billingPeriodTo
				? `${String(metadata.billingPeriodFrom)} to ${String(metadata.billingPeriodTo)}`
				: `Statement Date: ${new Date(invoice.createdAt || invoice.date).toLocaleDateString('en-IN')}`
		const gross = totalAmount.toFixed(2)
		const due = balanceAmount.toFixed(2)
		const upi = String(metadata.upiId || UNCF_BRANDING.bankDetails.upiId)

		return (
			`*Universal Nature Care & Cure Foundation (UNCF Trust)*\n` +
			`*Resident Care Statement & Payment Advice*\n\n` +
			`Dear ${guardianName},\n` +
			`Please find the care statement details for *${patientDisplayName}*:\n\n` +
			`• *Statement Ref:* ${refNo}\n` +
			`• *Service:* ${service}\n` +
			`• *Contract / Billing Period:* ${period}\n` +
			`• *Total Due:* ₹${due} (Gross: ₹${gross})\n\n` +
			`• *UPI ID for Payment:* ${upi}\n` +
			`• *Bank:* ${UNCF_BRANDING.bankDetails.bankName} | A/C: ${UNCF_BRANDING.bankDetails.accountNumber} | IFSC: ${UNCF_BRANDING.bankDetails.ifscCode}\n\n` +
			`📄 *Official Bill PDF Attached:*\n` +
			`The itemized statement with the scannable UPI QR code has been generated. You can scan the QR code directly to complete the transfer.\n\n` +
			`🙏 _"${UNCF_BRANDING.gitaQuotes[0].quote} — ${UNCF_BRANDING.gitaQuotes[0].verse}"_\n\n` +
			`Thank you for your trust and support in elder welfare.`
		)
	}

	const handleSendWhatsApp = async () => {
		const raw = familyPhone.trim()
		if (!raw) {
			setIsEditingPhone(true)
			setPhoneError('Please enter family WhatsApp number')
			return
		}

		let cleanPhone = raw.replace(/[^0-9]/g, '')
		if (cleanPhone.length === 10) {
			cleanPhone = `91${cleanPhone}`
		}

		if (cleanPhone.length < 10) {
			setIsEditingPhone(true)
			setPhoneError('Valid 10-digit mobile number required')
			return
		}

		setPhoneError(null)

		// First, automatically trigger PDF bill download so it is on the user's computer ready to attach
		await handleDownloadPdf()

		const message = formatWhatsAppMessage()
		const targetUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

		// Direct anchor click ensures browser popup blockers NEVER block WhatsApp Web
		const a = document.createElement('a')
		a.href = targetUrl
		a.target = '_blank'
		a.rel = 'noopener noreferrer'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)

		if (onMarkSent) {
			onMarkSent(cleanPhone)
		}
	}

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer" style={{ maxWidth: '780px' }}>
				<div className="drawer-header">
					<div className="receipt-header-branding">
						<span className="section-kicker">PATIENT / SERVICE BILL</span>
						<h2>Bill #{invoice.refNo}</h2>
						<p className="field-hint">
							{metadata.serviceType
								? `${metadata.serviceType} Monthly Statement`
								: 'Patient Care Service Statement'}
						</p>
					</div>
					<div className="receipt-actions-top" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
						<button
							type="button"
							className="button secondary button--small"
							onClick={handleDownloadPdf}
							disabled={isGeneratingPdf}
							style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
						>
							<Download size={14} />
							{isGeneratingPdf ? 'Generating...' : 'Download PDF'}
						</button>
						<button
							type="button"
							className="button secondary button--small"
							onClick={handlePrint}
							style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
						>
							<Printer size={14} />
							Print
						</button>
						<button
							type="button"
							className="icon-button"
							onClick={onClose}
							aria-label="Close statement"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				<div className="receipt-body">
					<div
						id="printable-bill-receipt"
						className="donation-receipt-card print-target"
						style={{
							border: '1px solid #cbd5e1',
							borderRadius: '12px',
							padding: '1.75rem',
							backgroundColor: '#ffffff',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								borderBottom: '2px solid #0F969C',
								paddingBottom: '1rem',
								marginBottom: '1.25rem',
							}}
						>
							<div>
								<div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F969C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
									{UNCF_BRANDING.organizationName}
								</div>
								<h3
									style={{
										margin: '0.2rem 0 0',
										fontSize: '1.25rem',
										fontWeight: 800,
										color: '#0f172a',
									}}
								>
									UNIVERSAL ELDER & PATIENT CARE
								</h3>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontSize: '0.8rem',
										color: '#64748b',
									}}
								>
									{UNCF_BRANDING.regNumber} • {UNCF_BRANDING.taxExemptionText}
								</p>
							</div>
							<div style={{ textAlign: 'right' }}>
								<span
									className={`status-badge status-badge--${
										invoice.status === 'PAID'
											? 'active'
											: invoice.status === 'PARTIALLY_PAID'
												? 'warning'
												: 'pending'
									}`}
								>
									{invoice.status}
								</span>
								<p
									style={{
										margin: '0.35rem 0 0',
										fontSize: '0.8rem',
										color: '#64748b',
										fontWeight: 600,
									}}
								>
									Date: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : '-'}
								</p>
							</div>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '1.25rem',
								marginBottom: '1.5rem',
								backgroundColor: '#f8fafc',
								padding: '1rem',
								borderRadius: '8px',
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
									Patient / Beneficiary
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 700,
										fontSize: '1rem',
										color: '#0f172a',
									}}
								>
									{String(metadata.patientName || invoice.clientName || 'Patient')}
								</p>
								{metadata.clientName ? (
									<p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
										Sponsor / Client: {String(metadata.clientName)}
									</p>
								) : null}
							</div>

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
									Billing Period & Service Contract
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 700,
										fontSize: '0.95rem',
										color: '#0f172a',
									}}
								>
									{String(metadata.serviceType || 'Elder / Nursing Care')}
								</p>
								<p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
									{metadata.billingPeriodFrom && metadata.billingPeriodTo
										? `${String(metadata.billingPeriodFrom)} to ${String(metadata.billingPeriodTo)}`
										: `Generated on ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`}
								</p>
							</div>
						</div>

						{chargeSummary && chargeSummary.length > 0 && (
							<div style={{ marginBottom: '1.5rem' }}>
								<h4
									style={{
										margin: '0 0 0.5rem',
										fontSize: '0.85rem',
										fontWeight: 700,
										color: '#334155',
										textTransform: 'uppercase',
									}}
								>
									Itemized Charge Breakdown
								</h4>
								<table className="data-table" style={{ width: '100%', fontSize: '0.825rem' }}>
									<thead>
										<tr>
											<th>Category</th>
											<th>Description</th>
											<th style={{ textAlign: 'right' }}>Qty</th>
											<th style={{ textAlign: 'right' }}>Rate (₹)</th>
											<th style={{ textAlign: 'right' }}>Amount (₹)</th>
										</tr>
									</thead>
									<tbody>
										{chargeSummary.map((item, idx) => (
											<tr key={idx}>
												<td>{item.category}</td>
												<td>{item.description || '-'}</td>
												<td style={{ textAlign: 'right' }}>{item.quantity || 1}</td>
												<td style={{ textAlign: 'right' }}>
													{Number(item.rate || item.amount || 0).toFixed(2)}
												</td>
												<td style={{ textAlign: 'right', fontWeight: 600 }}>
													{Number(item.amount || 0).toFixed(2)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-end',
								borderTop: '2px solid #e2e8f0',
								paddingTop: '1rem',
								marginBottom: '1.25rem',
							}}
						>
							<div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										padding: '0.2rem 0',
										fontSize: '0.85rem',
									}}
								>
									<span style={{ color: '#64748b' }}>Gross Total:</span>
									<span style={{ fontWeight: 600 }}>₹{totalAmount.toFixed(2)}</span>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										padding: '0.2rem 0',
										fontSize: '0.85rem',
									}}
								>
									<span style={{ color: '#64748b' }}>Paid to Date:</span>
									<span style={{ fontWeight: 600, color: '#0F969C' }}>
										- ₹{paidAmount.toFixed(2)}
									</span>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										padding: '0.4rem 0',
										borderTop: '1px solid #cbd5e1',
										fontSize: '1rem',
										fontWeight: 800,
										color: balanceAmount > 0 ? '#d97706' : '#0F969C',
									}}
								>
									<span>Balance Due:</span>
									<span>₹{balanceAmount.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Bank & Payment Details + Dynamic UPI QR Code */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr auto',
								gap: '1.25rem',
								alignItems: 'center',
								backgroundColor: '#f8fafc',
								border: '1px solid #cbd5e1',
								borderRadius: '8px',
								padding: '1.1rem 1.25rem',
								marginBottom: '1.25rem',
							}}
						>
							<div>
								<span
									style={{
										fontSize: '0.72rem',
										color: '#0F969C',
										fontWeight: 800,
										textTransform: 'uppercase',
										letterSpacing: '0.06em',
									}}
								>
									OFFICIAL PAYMENT & TRANSFER DETAILS
								</span>
								<div style={{ marginTop: '0.4rem', fontSize: '0.825rem', color: '#1e293b', lineHeight: 1.55 }}>
									<div><strong>Account Name:</strong> {UNCF_BRANDING.bankDetails.accountName}</div>
									<div><strong>Bank:</strong> {UNCF_BRANDING.bankDetails.bankName} | <strong>A/C No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{UNCF_BRANDING.bankDetails.accountNumber}</span></div>
									<div><strong>IFSC Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{UNCF_BRANDING.bankDetails.ifscCode}</span></div>
									<div><strong>UPI ID:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F969C' }}>{String(metadata.upiId || UNCF_BRANDING.bankDetails.upiId)}</span></div>
									<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
										* Please quote Statement Ref <strong>{invoice.refNo}</strong> during transfer.
									</div>
								</div>
							</div>

							<div
								style={{
									textAlign: 'center',
									backgroundColor: '#ffffff',
									padding: '0.65rem 0.85rem',
									borderRadius: '8px',
									border: '1px solid #e2e8f0',
									boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
								}}
							>
								<img
									src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
										`upi://pay?pa=${String(metadata.upiId || UNCF_BRANDING.bankDetails.upiId)}&pn=${encodeURIComponent(
											UNCF_BRANDING.bankDetails.accountName,
										)}&am=${balanceAmount.toFixed(2)}&cu=INR&tn=Bill-${invoice.refNo}`,
									)}`}
									alt="UPI Payment QR Code"
									style={{ width: '120px', height: '120px', display: 'block', margin: '0 auto' }}
								/>
								<div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
									Scan to Pay ₹{balanceAmount.toFixed(2)}
								</div>
								<div style={{ fontSize: '0.65rem', color: '#64748b' }}>Google Pay • PhonePe • BHIM</div>
							</div>
						</div>

						{/* Bhagavad Gita Wisdom on Selfless Service, Love & Humanity */}
						<div
							style={{
								marginBottom: '1.25rem',
								backgroundColor: '#fffbeb',
								border: '1px solid #fde68a',
								borderRadius: '8px',
								padding: '0.85rem 1.1rem',
								textAlign: 'center',
							}}
						>
							<div
								style={{
									fontSize: '0.72rem',
									fontWeight: 800,
									color: '#92400e',
									textTransform: 'uppercase',
									letterSpacing: '0.08em',
									marginBottom: '0.35rem',
								}}
							>
								🌸 BHAGAVAD GITA — SERVICE, COMPASSION & HUMANITY 🌸
							</div>
							<p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontStyle: 'italic', color: '#78350f', fontWeight: 600 }}>
								{UNCF_BRANDING.gitaQuotes[0].quote} — <strong style={{ fontStyle: 'normal' }}>{UNCF_BRANDING.gitaQuotes[0].verse}</strong>
							</p>
							<div
								style={{
									fontSize: '0.675rem',
									color: '#b45309',
									borderTop: '1px dashed #fcd34d',
									paddingTop: '0.3rem',
									marginTop: '0.3rem',
								}}
							>
								Dedicated with humility to the well-being, dignity, and peaceful sustenance of our respected elders and patients.
							</div>
						</div>

						<div
							style={{
								backgroundColor: '#f0fdfa',
								border: '1px solid #99f6e4',
								borderRadius: '8px',
								padding: '0.85rem 1rem',
								fontSize: '0.8rem',
								color: '#0f766e',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<strong>WhatsApp Dispatch Status:</strong>{' '}
								{metadata.invoiceWorkflowStatus === 'SENT' ? 'Already Dispatched' : 'Ready to Send'}
							</div>
							<div style={{ textAlign: 'right', minWidth: '180px' }}>
								<span style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
									Family WhatsApp:
								</span>
								{isEditingPhone ? (
									<div style={{ marginTop: '0.2rem' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
											<input
												type="tel"
												value={familyPhone}
												onChange={(e) => {
													setFamilyPhone(e.target.value)
													setPhoneError(null)
												}}
												placeholder="10-digit mobile"
												style={{
													padding: '0.2rem 0.4rem',
													fontSize: '0.8rem',
													borderRadius: '4px',
													border: phoneError ? '1px solid #ef4444' : '1px solid #0F969C',
													width: '130px',
													outline: 'none',
												}}
											/>
											{initialContact ? (
												<button
													type="button"
													className="button secondary button--small"
													style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
													onClick={() => setIsEditingPhone(false)}
												>
													Done
												</button>
											) : null}
										</div>
										{phoneError && (
											<p style={{ margin: '0.2rem 0 0', color: '#ef4444', fontSize: '0.7rem' }}>
												{phoneError}
											</p>
										)}
									</div>
								) : (
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'flex-end',
											gap: '0.4rem',
											marginTop: '0.1rem',
										}}
									>
										<p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
											{familyPhone || 'None on file'}
										</p>
										{metadata.invoiceWorkflowStatus !== 'SENT' && (
											<button
												type="button"
												onClick={() => setIsEditingPhone(true)}
												style={{
													background: 'none',
													border: 'none',
													cursor: 'pointer',
													color: '#0F969C',
													padding: '2px',
													display: 'flex',
													alignItems: 'center',
												}}
												title="Change mobile number"
											>
												<Edit2 size={12} />
											</button>
										)}
									</div>
								)}
							</div>
						</div>

						<div
							style={{
								marginTop: '2rem',
								display: 'flex',
								justifyContent: 'space-between',
								paddingTop: '1.5rem',
								borderTop: '1px dashed #cbd5e1',
								fontSize: '0.8rem',
								color: '#64748b',
							}}
						>
							<div>
								<span>Prepared By: Accounts Dept</span>
								<p style={{ marginTop: '1.5rem', fontWeight: 600 }}>
									Authorized System Bill
								</p>
							</div>
							<div style={{ textAlign: 'right' }}>
								<span>Family Dispatch Status:</span>
								<p style={{ marginTop: '1.5rem', fontWeight: 600 }}>
									{metadata.invoiceWorkflowStatus === 'SENT' ? (
										<span style={{ color: '#0F969C' }}>
											<CheckCircle2
												size={14}
												style={{
													display: 'inline',
													verticalAlign: 'middle',
													marginRight: '4px',
												}}
											/>
											Dispatched via {String(metadata.sentVia || 'WhatsApp')}
										</span>
									) : (
										<span style={{ color: '#d97706' }}>Statement Ready for Delivery</span>
									)}
								</p>
							</div>
						</div>
					</div>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
						<button
							type="button"
							className="button secondary"
							style={{ flex: 1 }}
							onClick={onClose}
						>
							Close
						</button>
						<button
							type="button"
							className="button secondary"
							style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
							onClick={handleDownloadPdf}
							disabled={isGeneratingPdf}
						>
							<Download size={15} />
							{isGeneratingPdf ? 'Generating...' : 'Download PDF'}
						</button>
						{metadata.invoiceWorkflowStatus === 'SENT' ? (
							<button
								type="button"
								className="button"
								disabled
								style={{
									flex: 1.5,
									backgroundColor: '#f1f5f9',
									borderColor: '#cbd5e1',
									color: '#0f766e',
									fontWeight: 700,
									cursor: 'not-allowed',
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.4rem',
									opacity: 0.9,
								}}
								title="Statement has already been dispatched to family via WhatsApp"
							>
								<CheckCircle2 size={16} color="#0F969C" />
								Dispatched via WhatsApp
							</button>
						) : (
							onMarkSent && (
								<>
									<button
										type="button"
										className="button secondary"
										style={{ flex: 1 }}
										onClick={() => onMarkSent(familyPhone)}
										title="Mark as sent in ledger without launching WhatsApp"
									>
										<CheckCircle2 size={15} />
										Mark Sent
									</button>
									<button
										type="button"
										className="button primary"
										style={{
											flex: 1.5,
											backgroundColor: '#25D366',
											borderColor: '#22bf5b',
											color: '#ffffff',
											fontWeight: 700,
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.4rem',
										}}
										onClick={handleSendWhatsApp}
										title="Open WhatsApp Web and send statement to family"
									>
										<MessageSquare size={15} />
										Send via WhatsApp to Family
									</button>
								</>
							)
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
