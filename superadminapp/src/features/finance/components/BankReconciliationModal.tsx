import React, { useState } from 'react'
import {
	X,
	Building2,
	CheckCircle2,
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	Sparkles,
	RefreshCw,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { MatchCandidate, BankReconciliationParseResponse } from '../finance.types'

interface BankReconciliationModalProps {
	isOpen: boolean
	onClose: () => void
	activeUnitId?: string
	onSuccess?: () => void
}

const SAMPLE_CSV = `Date,Description,UTR,Amount,Type
2026-10-18,NEFT Inward Patient Justin Boarding,UTR-AXIS-992104,15000,CR
2026-10-19,Vendor Settlement Medicos Surgicals,UTR-HDFC-332190,4500,DR
2026-10-19,UPI Inward Pharmacy Elder Care,UPI-8849201122,2500,CR`

export const BankReconciliationModal: React.FC<BankReconciliationModalProps> = ({
	isOpen,
	onClose,
	activeUnitId,
	onSuccess,
}) => {
	const [rawText, setRawText] = useState<string>(SAMPLE_CSV)
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
	const [parseResult, setParseResult] = useState<BankReconciliationParseResponse | null>(null)
	const [reconcilingId, setReconcilingId] = useState<string | null>(null)
	const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set())
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	if (!isOpen) return null

	const handleAnalyze = async () => {
		if (!rawText.trim()) {
			setErrorMessage('Please provide bank statement text or CSV rows')
			return
		}
		setIsAnalyzing(true)
		setErrorMessage(null)
		setSuccessMessage(null)
		try {
			const res = await financeService.parseBankStatement({
				rawText: rawText.trim(),
				unitId: activeUnitId,
			})
			setParseResult(res)
			setSuccessMessage(`Parsed ${res.totalLines} statement transactions with ${res.matchedCount} high-confidence match candidate(s).`)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to parse statement'
			setErrorMessage(msg)
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleReconcile = async (candidate: MatchCandidate) => {
		if (!candidate.matchedRecord) return
		setReconcilingId(candidate.lineId)
		setErrorMessage(null)
		try {
			await financeService.reconcileBankRecord({
				statementLine: candidate.statementLine,
				targetRecordId: candidate.matchedRecord.id,
				recordType: candidate.matchedRecord.recordType,
				unitId: activeUnitId,
			})
			setReconciledIds((prev) => new Set(prev).add(candidate.lineId))
			setSuccessMessage(`Successfully reconciled ${candidate.matchedRecord.refNo} against UTR ${candidate.statementLine.utr}`)
			if (onSuccess) onSuccess()
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Reconciliation failed'
			setErrorMessage(msg)
		} finally {
			setReconcilingId(null)
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
					maxWidth: '950px',
					maxHeight: '90vh',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
					overflow: 'hidden',
				}}
			>
				{/* Modal Header */}
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
								backgroundColor: '#e0f2fe',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#0284c7',
							}}
						>
							<Building2 size={22} />
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
								Automated Bank Statement Reconciliation
							</h3>
							<p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
								Match bank statement UTRs and credit/debit lines against patient invoices & vendor liabilities
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
							borderRadius: '6px',
						}}
					>
						<X size={20} />
					</button>
				</div>

				{/* Modal Body */}
				<div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
					{/* Alerts */}
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

					{/* Statement Input Box */}
					<div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
							<label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
								Bank Statement Rows (CSV / Text format: Date, Description, UTR, Amount, Type)
							</label>
							<button
								type="button"
								onClick={() => setRawText(SAMPLE_CSV)}
								style={{
									border: 'none',
									background: 'none',
									color: '#0284c7',
									cursor: 'pointer',
									fontSize: '0.75rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.25rem',
								}}
							>
								<Sparkles size={13} />
								Insert Sample Statement
							</button>
						</div>
						<textarea
							rows={4}
							value={rawText}
							onChange={(e) => setRawText(e.target.value)}
							placeholder="Paste bank statement CSV rows here..."
							style={{
								width: '100%',
								padding: '0.75rem',
								borderRadius: '8px',
								border: '1px solid #cbd5e1',
								fontFamily: 'monospace',
								fontSize: '0.82rem',
								boxSizing: 'border-box',
								backgroundColor: '#f8fafc',
							}}
						/>
					</div>

					{/* Action Button */}
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
						<button
							type="button"
							onClick={handleAnalyze}
							disabled={isAnalyzing}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.6rem 1.25rem',
								backgroundColor: '#0F969C',
								color: '#ffffff',
								border: 'none',
								borderRadius: '8px',
								fontWeight: 600,
								fontSize: '0.875rem',
								cursor: isAnalyzing ? 'not-allowed' : 'pointer',
							}}
						>
							{isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
							{isAnalyzing ? 'Matching Against Ledger...' : 'Auto-Match Statement'}
						</button>
					</div>

					{/* Match Candidates Table */}
					{parseResult && (
						<div>
							<div
								style={{
									display: 'flex',
									gap: '1rem',
									marginBottom: '0.75rem',
									padding: '0.75rem 1rem',
									backgroundColor: '#f8fafc',
									borderRadius: '8px',
									border: '1px solid #e2e8f0',
									fontSize: '0.82rem',
								}}
							>
								<div>Total Lines: <strong>{parseResult.totalLines}</strong></div>
								<div>Matched: <strong style={{ color: '#16a34a' }}>{parseResult.matchedCount}</strong></div>
								<div>Unmatched: <strong style={{ color: '#64748b' }}>{parseResult.unmatchedCount}</strong></div>
							</div>

							<div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
									<thead>
										<tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
											<th style={{ padding: '0.65rem 0.75rem' }}>Date & UTR</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Description</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Amount & Flow</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Matched Ledger Record</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Confidence</th>
											<th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Action</th>
										</tr>
									</thead>
									<tbody>
										{parseResult.candidates.map((cand) => {
											const isReconciled = reconciledIds.has(cand.lineId)
											const isBusy = reconcilingId === cand.lineId

											return (
												<tr
													key={cand.lineId}
													style={{
														borderBottom: '1px solid #f1f5f9',
														backgroundColor: isReconciled ? '#f0fdf4' : '#ffffff',
													}}
												>
													<td style={{ padding: '0.65rem 0.75rem' }}>
														<div style={{ fontWeight: 600, color: '#0f172a' }}>{cand.statementLine.date}</div>
														<div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
															{cand.statementLine.utr}
														</div>
													</td>
													<td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
														{cand.statementLine.description}
													</td>
													<td style={{ padding: '0.65rem 0.75rem' }}>
														<div
															style={{
																display: 'inline-flex',
																alignItems: 'center',
																gap: '0.25rem',
																fontWeight: 700,
																color: cand.statementLine.type === 'CR' ? '#16a34a' : '#d97706',
															}}
														>
															{cand.statementLine.type === 'CR' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
															₹{cand.statementLine.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
														</div>
														<div style={{ fontSize: '0.7rem', color: '#64748b' }}>
															{cand.statementLine.type === 'CR' ? 'Inward Credit' : 'Outward Debit'}
														</div>
													</td>
													<td style={{ padding: '0.65rem 0.75rem' }}>
														{cand.matchedRecord ? (
															<div>
																<span style={{ fontWeight: 600, color: '#0f172a' }}>{cand.matchedRecord.refNo}</span>
																<div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cand.matchedRecord.partyName}</div>
															</div>
														) : (
															<span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No direct ledger match</span>
														)}
													</td>
													<td style={{ padding: '0.65rem 0.75rem' }}>
														{cand.confidence === 'HIGH' && (
															<span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
																High Match
															</span>
														)}
														{cand.confidence === 'MEDIUM' && (
															<span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
																Medium Match
															</span>
														)}
														{cand.confidence === 'NONE' && (
															<span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
																Unmatched
															</span>
														)}
													</td>
													<td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
														{isReconciled ? (
															<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
																<CheckCircle2 size={14} /> Reconciled
															</span>
														) : cand.matchedRecord ? (
															<button
																type="button"
																onClick={() => handleReconcile(cand)}
																disabled={isBusy}
																style={{
																	padding: '0.35rem 0.75rem',
																	backgroundColor: '#0284c7',
																	color: '#ffffff',
																	border: 'none',
																	borderRadius: '6px',
																	fontSize: '0.75rem',
																	fontWeight: 600,
																	cursor: isBusy ? 'not-allowed' : 'pointer',
																}}
															>
																{isBusy ? 'Processing...' : 'Reconcile'}
															</button>
														) : (
															<span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Manual Review</span>
														)}
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
