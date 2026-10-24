import { CheckCircle2, Clock, Printer, X, XCircle } from 'lucide-react'
import type { CashboxTransaction } from '../finance.types'

type TransactionDetailDrawerProps = {
	transaction: CashboxTransaction
	onClose: () => void
	onApprove?: () => void
}

export function TransactionDetailDrawer({
	transaction,
	onClose,
	onApprove,
}: TransactionDetailDrawerProps) {
	const handlePrint = () => {
		window.print()
	}

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer">
				<div className="drawer-header">
					<div className="receipt-header-branding">
						<span className="section-kicker">FINANCIAL VOUCHER</span>
						<h2>Voucher #{transaction.receiptNo}</h2>
						<p className="field-hint">General Ledger / Cashbox Entry Details</p>
					</div>
					<div className="receipt-actions-top">
						<button
							type="button"
							className="button secondary button--small"
							onClick={handlePrint}
						>
							<Printer size={15} />
							Print Voucher
						</button>
						<button
							type="button"
							className="icon-button"
							onClick={onClose}
							aria-label="Close voucher details"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				<div className="receipt-body">
					<div
						className={`donation-receipt-card print-target`}
						style={{
							border: '1px solid #cbd5e1',
							borderRadius: '12px',
							padding: '1.5rem',
							backgroundColor: '#ffffff',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								borderBottom: '2px solid #0F969C',
								paddingBottom: '0.75rem',
								marginBottom: '1rem',
							}}
						>
							<div>
								<h3
									style={{
										margin: 0,
										fontSize: '1.15rem',
										fontWeight: 800,
										color: '#0F969C',
									}}
								>
									UNIVERSAL ELDER & HEALTH CARE FOUNDATION
								</h3>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontSize: '0.8rem',
										color: '#64748b',
									}}
								>
									Finance & Accounts Central Ledger
								</p>
							</div>
							<div style={{ textAlign: 'right' }}>
								<span
									className={`status-badge status-badge--${
										transaction.status === 'APPROVED' || transaction.status === 'PAID'
											? 'active'
											: transaction.status === 'PENDING_APPROVAL' ||
												  transaction.status === 'CREATED'
												? 'pending'
												: 'warning'
									}`}
								>
									{transaction.status}
								</span>
								<p
									style={{
										margin: '0.35rem 0 0',
										fontSize: '0.8rem',
										color: '#64748b',
										fontWeight: 600,
									}}
								>
									{transaction.date}
								</p>
							</div>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '1rem',
								marginBottom: '1.25rem',
							}}
						>
							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Voucher Type & Flow
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 800,
										fontSize: '1rem',
										color:
											transaction.type === 'INCOME' ||
											String(transaction.type).toUpperCase() === 'RECEIPT'
												? '#0F969C'
												: '#dc2626',
									}}
								>
									{transaction.type === 'INCOME' ||
									String(transaction.type).toUpperCase() === 'RECEIPT'
										? 'RECEIPT (INFLOW)'
										: 'EXPENSE (PAYMENT)'}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Amount
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 900,
										fontSize: '1.25rem',
										color:
											transaction.type === 'INCOME' ||
											String(transaction.type).toUpperCase() === 'RECEIPT'
												? '#0F969C'
												: '#dc2626',
									}}
								>
									{transaction.type === 'INCOME' ||
									String(transaction.type).toUpperCase() === 'RECEIPT'
										? '+'
										: '-'}
									₹{Math.abs(transaction.amount).toFixed(2)}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Party (Payer / Payee)
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 600,
										color: '#0f172a',
									}}
								>
									{transaction.clientName === 'Unknown' || !transaction.clientName
										? 'General Cashbox Counter'
										: transaction.clientName}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Payment Mode
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 600,
										color: '#0f172a',
									}}
								>
									{transaction.mode}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Accounting Category
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 600,
										color: '#0f172a',
									}}
								>
									{transaction.category}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Recorded By
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										fontWeight: 600,
										color: '#0f172a',
									}}
								>
									{transaction.recordedBy}
								</p>
							</div>
						</div>

						{transaction.notes && (
							<div
								style={{
									borderTop: '1px solid #e2e8f0',
									paddingTop: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<span
									style={{
										fontSize: '0.725rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Notes & Purpose
								</span>
								<p
									style={{
										margin: '0.2rem 0 0',
										color: '#334155',
										fontSize: '0.875rem',
									}}
								>
									{transaction.notes}
								</p>
							</div>
						)}

						{transaction.metadata && Object.keys(transaction.metadata).length > 0 && (() => {
							const meta = transaction.metadata as Record<string, unknown>
							const ignoredKeys = new Set([
								'projectId',
								'issuedById',
								'projectExpenditureId',
								'allocationId',
								'taskId',
								'taskRefNo',
								'invoiceId',
								'tenantId',
								'unitId',
								'ledgerEntryIds',
								'allocationRefs',
								'costNos',
								'aiAnomalyScore',
								'amount',
							])

							const entries = Object.entries(meta).filter(([key, val]) => {
								if (ignoredKeys.has(key)) return false
								if (val === null || val === undefined || val === '') return false
								if (key === 'aiAnomalies') return false
								if (Array.isArray(val) && val.length === 0) return false
								return true
							})

							const anomalies = Array.isArray(meta.aiAnomalies)
								? (meta.aiAnomalies as Array<{ message?: string; type?: string; severity?: string }>)
								: []

							if (entries.length === 0 && anomalies.length === 0) return null

							const formatLabel = (k: string) => {
								switch (k) {
									case 'projectName': return 'Project / Program'
									case 'voucherRef': return 'Voucher Reference'
									case 'invoiceRefNo': return 'Settled Invoice Ref'
									case 'paymentMode': return 'Transfer Channel'
									case 'source': return 'Transaction Source'
									case 'sentVia': return 'Dispatch Channel'
									case 'familyContact': return 'Family Contact'
									case 'paymentStatus': return 'Settlement Status'
									case 'serviceType': return 'Service Domain'
									case 'paidAmount': return 'Paid Amount'
									case 'balanceAmount': return 'Balance Amount'
									case 'serviceDeliveredAt': return 'Service Delivery Date'
									default:
										return k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
								}
							}

							const formatValue = (k: string, v: unknown) => {
								if (typeof v === 'string' && (v.includes('T') || v.includes('-')) && !isNaN(Date.parse(v)) && v.length >= 10) {
									return new Date(v).toLocaleDateString('en-IN')
								}
								if (typeof v === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('rate'))) {
									return `₹${v.toFixed(2)}`
								}
								return String(v).replace(/_/g, ' ')
							}

							return (
								<div
									style={{
										borderTop: '1px solid #e2e8f0',
										paddingTop: '0.85rem',
										marginBottom: '1rem',
									}}
								>
									<span
										style={{
											fontSize: '0.725rem',
											color: '#64748b',
											textTransform: 'uppercase',
											letterSpacing: '0.05em',
											fontWeight: 700,
										}}
									>
										Audit & Reference Details
									</span>

									{anomalies.length > 0 && (
										<div
											style={{
												marginTop: '0.4rem',
												backgroundColor: '#fffbeb',
												border: '1px solid #fde68a',
												borderRadius: '6px',
												padding: '0.5rem 0.75rem',
												fontSize: '0.75rem',
												color: '#92400e',
											}}
										>
											<strong>Audit Notice:</strong>{' '}
											{anomalies.map((a) => a.message || a.type).join(' | ')}
										</div>
									)}

									{entries.length > 0 && (
										<div
											style={{
												marginTop: '0.4rem',
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
												gap: '0.6rem',
												backgroundColor: '#f8fafc',
												padding: '0.75rem 1rem',
												borderRadius: '8px',
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
														{formatLabel(k)}
													</span>
													<p
														style={{
															margin: '0.1rem 0 0',
															fontSize: '0.825rem',
															fontWeight: 600,
															color: '#1e293b',
														}}
													>
														{formatValue(k, v)}
													</p>
												</div>
											))}
										</div>
									)}
								</div>
							)
						})()}

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
								<span>Cashier / Accountant:</span>
								<p style={{ marginTop: '1.5rem', fontWeight: 600 }}>Verified & Logged</p>
							</div>
							<div style={{ textAlign: 'right' }}>
								<span>Finance Approver:</span>
								<p style={{ marginTop: '1.5rem', fontWeight: 600 }}>
									{transaction.status === 'APPROVED' ? (
										<span style={{ color: '#0F969C' }}>
											<CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
											Authorized
										</span>
									) : transaction.status === 'REJECTED' ? (
										<span style={{ color: '#dc2626' }}>
											<XCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
											Rejected
										</span>
									) : (
										<span style={{ color: '#d97706' }}>
											<Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
											Pending Authorization
										</span>
									)}
								</p>
							</div>
						</div>
					</div>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
						<button
							type="button"
							className="button secondary"
							style={{ flex: 1 }}
							onClick={onClose}
						>
							Close
						</button>
						{onApprove && transaction.status === 'PENDING_APPROVAL' && (
							<button
								type="button"
								className="button primary"
								style={{ flex: 1 }}
								onClick={onApprove}
							>
								Approve / Reject Voucher
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
