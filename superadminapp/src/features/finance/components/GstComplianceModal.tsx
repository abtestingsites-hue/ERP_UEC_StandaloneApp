import React, { useState, useEffect } from 'react'
import {
	X,
	FileSpreadsheet,
	Download,
	RefreshCw,
	AlertCircle,
} from 'lucide-react'
import { financeService } from '../finance.service'
import type { GstSummaryResponse } from '../finance.types'

interface GstComplianceModalProps {
	isOpen: boolean
	onClose: () => void
	activeUnitId?: string
}

export const GstComplianceModal: React.FC<GstComplianceModalProps> = ({
	isOpen,
	onClose,
	activeUnitId,
}) => {
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [summary, setSummary] = useState<GstSummaryResponse | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isExporting, setIsExporting] = useState<boolean>(false)

	const now = new Date()
	const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
	const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
	const [fromDate, setFromDate] = useState<string>(defaultFrom)
	const [toDate, setToDate] = useState<string>(defaultTo)

	const fetchSummary = async () => {
		setIsLoading(true)
		setErrorMessage(null)
		try {
			const data = await financeService.getGstSummary({
				fromDate,
				toDate,
				unitId: activeUnitId,
			})
			setSummary(data)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to fetch GST summary'
			setErrorMessage(msg)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (isOpen) {
			fetchSummary()
		}
	}, [isOpen, fromDate, toDate, activeUnitId])

	if (!isOpen) return null

	const handleDownloadJson = async () => {
		setIsExporting(true)
		try {
			const data = await financeService.exportGstEInvoices({
				fromDate,
				toDate,
				format: 'json',
				unitId: activeUnitId,
			})
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `GST_E_INVOICES_${fromDate}_TO_${toDate}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'JSON export failed'
			setErrorMessage(msg)
		} finally {
			setIsExporting(false)
		}
	}

	const handleDownloadCsv = async () => {
		setIsExporting(true)
		try {
			const data = await financeService.exportGstEInvoices({
				fromDate,
				toDate,
				format: 'csv',
				unitId: activeUnitId,
			})
			const blob = new Blob([data], { type: 'text/csv' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `GST_GSTR1_SALES_${fromDate}_TO_${toDate}.csv`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'CSV export failed'
			setErrorMessage(msg)
		} finally {
			setIsExporting(false)
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
					maxWidth: '880px',
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
								backgroundColor: '#ecfdf5',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#059669',
							}}
						>
							<FileSpreadsheet size={22} />
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
								GST Tax Compliance & E-Invoice Portal Export
							</h3>
							<p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
								GSTR-1 healthcare sales audit, taxable vs exempt turnover, and NIC E-Invoice Schema 1.03 batches
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
					{/* Date Range Picker */}
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
							<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Return Period:</span>
							<input
								type="date"
								value={fromDate}
								onChange={(e) => setFromDate(e.target.value)}
								style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
							/>
							<span style={{ color: '#64748b', fontSize: '0.85rem' }}>to</span>
							<input
								type="date"
								value={toDate}
								onChange={(e) => setToDate(e.target.value)}
								style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
							/>
						</div>
						<button
							type="button"
							onClick={fetchSummary}
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
							Refresh
						</button>
					</div>

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

					{/* KPI Summary Cards */}
					{summary && (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
								gap: '1rem',
							}}
						>
							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL GROSS TURNOVER</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
									₹{summary.totalGrossTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									{summary.totalInvoices} invoice(s)
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>EXEMPT HEALTHCARE</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
									₹{summary.exemptTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									HSN 999312 (Inpatient/Boarding)
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>TAXABLE COMMERCIAL</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
									₹{summary.taxableTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									Pharmacy & consumables
								</div>
							</div>

							<div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>TOTAL GST LIABILITY</div>
								<div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
									₹{summary.taxBreakdown.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
									CGST: ₹{summary.taxBreakdown.cgst} | SGST: ₹{summary.taxBreakdown.sgst}
								</div>
							</div>
						</div>
					)}

					{/* HSN Breakdown Table */}
					{summary && (
						<div>
							<h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
								HSN/SAC Classification Summary
							</h4>
							<div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
									<thead>
										<tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
											<th style={{ padding: '0.65rem 0.75rem' }}>HSN / SAC</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Description</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>Taxable Base</th>
											<th style={{ padding: '0.65rem 0.75rem' }}>GST Rate</th>
											<th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Tax Amount</th>
										</tr>
									</thead>
									<tbody>
										{summary.topHsnCodes.map((hsn) => (
											<tr key={hsn.hsn} style={{ borderBottom: '1px solid #f1f5f9' }}>
												<td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>
													{hsn.hsn}
												</td>
												<td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
													{hsn.description}
												</td>
												<td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
													₹{hsn.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
												</td>
												<td style={{ padding: '0.65rem 0.75rem' }}>
													<span
														style={{
															padding: '0.15rem 0.45rem',
															borderRadius: '4px',
															fontSize: '0.72rem',
															fontWeight: 700,
															backgroundColor: hsn.taxRate === 0 ? '#dcfce7' : '#fef3c7',
															color: hsn.taxRate === 0 ? '#15803d' : '#b45309',
														}}
													>
														{hsn.taxRate === 0 ? 'Exempt (0%)' : `${hsn.taxRate}%`}
													</span>
												</td>
												<td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
													₹{hsn.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Export Actions Bar */}
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '1rem',
							padding: '1rem',
							backgroundColor: '#f8fafc',
							borderRadius: '10px',
							border: '1px solid #e2e8f0',
							marginTop: '0.5rem',
						}}
					>
						<div>
							<strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
								Download Standard Tax Compliance Exports
							</strong>
							<span style={{ fontSize: '0.75rem', color: '#64748b' }}>
								Generate JSON for GST E-Invoice IRN portal or CSV for accountant audit filing
							</span>
						</div>
						<div style={{ display: 'flex', gap: '0.75rem' }}>
							<button
								type="button"
								onClick={handleDownloadCsv}
								disabled={isExporting}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.35rem',
									padding: '0.55rem 1rem',
									backgroundColor: '#ffffff',
									border: '1px solid #cbd5e1',
									borderRadius: '8px',
									fontSize: '0.82rem',
									fontWeight: 600,
									color: '#334155',
									cursor: isExporting ? 'not-allowed' : 'pointer',
								}}
							>
								<Download size={14} />
								GSTR-1 Report (CSV)
							</button>

							<button
								type="button"
								onClick={handleDownloadJson}
								disabled={isExporting}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.35rem',
									padding: '0.55rem 1.15rem',
									backgroundColor: '#059669',
									color: '#ffffff',
									border: 'none',
									borderRadius: '8px',
									fontSize: '0.82rem',
									fontWeight: 600,
									cursor: isExporting ? 'not-allowed' : 'pointer',
								}}
							>
								<Download size={14} />
								NIC E-Invoice (JSON)
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
