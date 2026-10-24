import React, { useState, useEffect } from 'react'
import {
	X,
	CalendarDays,
	CheckCircle2,
	AlertCircle,
	RefreshCw,
	Sparkles,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { RecurringBillingPreviewResponse } from '../finance.types'

interface RecurringBillingModalProps {
	isOpen: boolean
	onClose: () => void
	activeUnitId?: string
	onSuccess?: () => void
}

export const RecurringBillingModal: React.FC<RecurringBillingModalProps> = ({
	isOpen,
	onClose,
	activeUnitId,
	onSuccess,
}) => {
	const now = new Date()
	const [month, setMonth] = useState<number>(now.getMonth() + 1)
	const [year, setYear] = useState<number>(now.getFullYear())

	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [preview, setPreview] = useState<RecurringBillingPreviewResponse | null>(null)
	const [isExecuting, setIsExecuting] = useState<boolean>(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	]

	const fetchPreview = async () => {
		setIsLoading(true)
		setErrorMessage(null)
		try {
			const res = await financeService.getRecurringBillingPreview({
				month,
				year,
				unitId: activeUnitId,
			})
			setPreview(res)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to fetch recurring billing preview'
			setErrorMessage(msg)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (isOpen) {
			fetchPreview()
		}
	}, [isOpen, month, year, activeUnitId])

	if (!isOpen) return null

	const handleExecuteCycle = async () => {
		setIsExecuting(true)
		setErrorMessage(null)
		setSuccessMessage(null)
		try {
			const res = await financeService.runRecurringBillingCycle({
				month,
				year,
				unitId: activeUnitId,
			})
			setSuccessMessage(
				`Successfully generated ${res.invoicesGenerated} monthly recurring invoice(s) totaling ₹${res.totalAmountBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${res.cycleLabel}.`
			)
			fetchPreview()
			if (onSuccess) onSuccess()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to execute billing cycle'
			setErrorMessage(msg)
		} finally {
			setIsExecuting(false)
		}
	}

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 9999,
				backgroundColor: 'rgba(15, 23, 42, 0.65)',
				backdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '1rem',
			}}
		>
			<div
				style={{
					backgroundColor: '#ffffff',
					borderRadius: '16px',
					width: '100%',
					maxWidth: '920px',
					maxHeight: '90vh',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
					overflow: 'hidden',
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: '1.25rem 1.5rem',
						borderBottom: '1px solid #e2e8f0',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						<div
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '10px',
								backgroundColor: '#eff6ff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#2563eb',
							}}
						>
							<CalendarDays size={22} />
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
								Automated Monthly Recurring Billing Engine
							</h3>
							<p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
								Batch generate monthly resident boarding and care tariff invoices with idempotency guards
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							border: 'none',
							background: 'transparent',
							cursor: 'pointer',
							color: '#64748b',
							padding: '0.25rem',
						}}
					>
						<X size={20} />
					</button>
				</div>

				{/* Body */}
				<div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
					{/* Cycle Picker */}
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '1rem',
							padding: '0.75rem 1rem',
							backgroundColor: '#f8fafc',
							borderRadius: '10px',
							border: '1px solid #e2e8f0',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
							<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Billing Cycle:</span>
							<select
								value={month}
								onChange={(e) => setMonth(parseInt(e.target.value, 10))}
								style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
							>
								{months.map((m, idx) => (
									<option key={m} value={idx + 1}>{m}</option>
								))}
							</select>

							<select
								value={year}
								onChange={(e) => setYear(parseInt(e.target.value, 10))}
								style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
							>
								{[2025, 2026, 2027].map((y) => (
									<option key={y} value={y}>{y}</option>
								))}
							</select>
						</div>

						<button
							type="button"
							onClick={fetchPreview}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.35rem',
								padding: '0.35rem 0.75rem',
								backgroundColor: '#ffffff',
								border: '1px solid #cbd5e1',
								borderRadius: '6px',
								fontSize: '0.8rem',
								cursor: 'pointer',
								fontWeight: 600,
								color: '#334155',
							}}
						>
							<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
							Re-scan Active Residents
						</button>
					</div>

					{/* Feedback Alerts */}
					{errorMessage && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1rem',
								backgroundColor: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '8px',
								color: '#991b1b',
								fontSize: '0.85rem',
							}}
						>
							<AlertCircle size={18} />
							<span>{errorMessage}</span>
						</div>
					)}

					{successMessage && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1rem',
								backgroundColor: '#f0fdf4',
								border: '1px solid #bbf7d0',
								borderRadius: '8px',
								color: '#166534',
								fontSize: '0.85rem',
							}}
						>
							<CheckCircle2 size={18} />
							<span>{successMessage}</span>
						</div>
					)}

					{/* Summary Statistics */}
					{preview && (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
								gap: '1rem',
							}}
						>
							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL ELIGIBLE RESIDENTS</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
									{preview.totalEligible}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									Active elder care admissions
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>READY TO INVOICE</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>
									{preview.readyToBillCount}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									Awaiting monthly bill generation
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>ALREADY BILLED</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
									{preview.alreadyBilledCount}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									Protected by idempotency guard
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#0F969C', fontWeight: 600 }}>ESTIMATED CYCLE BILLING</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F969C', marginTop: '0.25rem' }}>
									₹{preview.estimatedTotalBilling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									Boarding + Nursing tariff
								</div>
							</div>
						</div>
					)}

					{/* Residents Breakdown Table */}
					{preview && (
						<div>
							<h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
								Resident Billing Breakdown ({preview.cycleLabel})
							</h4>
							<div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
									<thead>
										<tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
											<th style={{ padding: '0.65rem 0.75rem' }}>Resident & Client</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Boarding Tariff</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Nursing Fee</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Total Monthly Amount</th>
											<th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Status</th>
										</tr>
									</thead>
									<tbody>
										{preview.items.length === 0 ? (
											<tr>
												<td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
													No active elder care allocations found for this operating unit.
												</td>
											</tr>
										) : (
											preview.items.map((item) => (
												<tr key={item.allocationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
													<td style={{ padding: '0.65rem 0.75rem' }}>
														<div style={{ fontWeight: 600, color: '#0f172a' }}>{item.patientName}</div>
														<div style={{ fontSize: '0.72rem', color: '#64748b' }}>Client: {item.clientName}</div>
													</td>
													<td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
														₹{item.monthlyBoardingFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</td>
													<td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
														₹{item.careTariffFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</td>
													<td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
														₹{item.totalMonthlyFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</td>
													<td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
														{item.status === 'ALREADY_BILLED' ? (
															<span
																style={{
																	display: 'inline-flex',
																	alignItems: 'center',
																	gap: '0.25rem',
																	padding: '0.2rem 0.5rem',
																	backgroundColor: '#dcfce7',
																	color: '#15803d',
																	borderRadius: '4px',
																	fontSize: '0.7rem',
																	fontWeight: 700,
																}}
															>
																<CheckCircle2 size={12} />
																{item.existingInvoiceRef || 'Billed'}
															</span>
														) : (
															<span
																style={{
																	padding: '0.2rem 0.5rem',
																	backgroundColor: '#dbeafe',
																	color: '#1e40af',
																	borderRadius: '4px',
																	fontSize: '0.7rem',
																	fontWeight: 700,
																}}
															>
																Ready to Bill
															</span>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Action Bar */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '1rem',
							backgroundColor: '#f8fafc',
							borderRadius: '10px',
							border: '1px solid #e2e8f0',
							marginTop: '0.5rem',
						}}
					>
						<div>
							<strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
								Execute Billing Cycle
							</strong>
							<span style={{ fontSize: '0.75rem', color: '#64748b' }}>
								Generates official general ledger invoices for all ready residents in one idempotent transaction
							</span>
						</div>

						<button
							type="button"
							onClick={handleExecuteCycle}
							disabled={isExecuting || !preview || preview.readyToBillCount === 0}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.6rem 1.25rem',
								backgroundColor: preview?.readyToBillCount === 0 ? '#94a3b8' : '#2563eb',
								color: '#ffffff',
								border: 'none',
								borderRadius: '8px',
								fontSize: '0.85rem',
								fontWeight: 600,
								cursor: isExecuting || !preview || preview.readyToBillCount === 0 ? 'not-allowed' : 'pointer',
							}}
						>
							{isExecuting ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
							{isExecuting ? 'Generating Invoices...' : `Run ${preview?.cycleLabel || ''} Billing Cycle`}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
