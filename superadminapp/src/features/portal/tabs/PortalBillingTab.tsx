import {
	Receipt,
	CreditCard,
	QrCode,
	CheckCircle2,
	Building2,
	Sparkles,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
}

export function PortalBillingTab({ data }: Props) {
	const { dailyCosts, resident } = data

	const totalBilled = dailyCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
	const paidItems = dailyCosts.filter((c) => c.status === 'PAID')
	const totalPaid = paidItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
	const balanceDue = Math.max(0, totalBilled - totalPaid)

	const formatDate = (val?: string) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime())
			? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
			: '—'
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
					In-House Care Billing & Statements
				</h2>
				<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
					Itemized daily charges, accommodation, care fees, payments, and statements for{' '}
					<strong>{resident.name}</strong>.
				</p>
			</div>

			{/* KPI Summary Cards */}
			<div className="portal-kpi-grid">
				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Total Charges</span>
						<div className="portal-kpi-icon portal-kpi-icon--blue">
							<Receipt size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value">
							₹{totalBilled.toLocaleString('en-IN')}
						</div>
						<div className="portal-kpi-subtitle">
							{dailyCosts.length > 0 ? `${dailyCosts.length} itemized charges recorded` : 'No charges billed yet'}
						</div>
					</div>
				</div>

				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Total Paid</span>
						<div className="portal-kpi-icon portal-kpi-icon--emerald">
							<CheckCircle2 size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ color: '#039A01' }}>
							₹{totalPaid.toLocaleString('en-IN')}
						</div>
						<div className="portal-kpi-subtitle">
							{totalPaid > 0 ? 'Payments cleared & verified' : 'No payments recorded'}
						</div>
					</div>
				</div>

				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Outstanding Due</span>
						<div className="portal-kpi-icon portal-kpi-icon--amber">
							<CreditCard size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ color: balanceDue > 0 ? '#d97706' : '#039A01' }}>
							₹{balanceDue.toLocaleString('en-IN')}
						</div>
						<div className="portal-kpi-subtitle">
							{balanceDue > 0 ? 'Payable for current care cycle' : 'All accounts fully settled'}
						</div>
					</div>
				</div>
			</div>

			{/* Bank & Payment Instructions + Bhagavad Gita Quote */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
				{/* Payment Bank Details */}
				<div className="portal-card" style={{ flex: 2 }}>
					<div className="portal-card-header">
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<div
								style={{
									background: '#f0fdf4',
									color: '#039A01',
									borderRadius: '10px',
									padding: '8px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Building2 size={18} />
							</div>
							<div>
								<h3 className="portal-card-title">Official Facility Bank & Remittance</h3>
								<p className="portal-card-desc">Transfer fees securely via NEFT, RTGS, or IMPS</p>
							</div>
						</div>
					</div>

					<div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
						<div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px 14px' }}>
							<span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Bank Name</span>
							<p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Axis Bank</p>
							<span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginTop: '8px' }}>Beneficiary Name</span>
							<p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Universal Elder Care Trust</p>
						</div>

						<div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px 14px' }}>
							<span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Account Number</span>
							<p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>924020012345678</p>
							<span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginTop: '8px' }}>IFSC Code</span>
							<p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>UTIB0000123</p>
						</div>
					</div>

					{/* Bhagavad Gita Quote */}
					<div
						style={{
							marginTop: '16px',
							border: '1px solid #dcfce7',
							background: '#f0fdf4',
							borderRadius: '12px',
							padding: '14px 16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
							<Sparkles size={15} color="#039A01" />
							<span>Bhagavad Gita 17.20 — The Spirit of Care</span>
						</div>
						<p style={{ margin: '6px 0 0', fontSize: '12px', fontStyle: 'italic', color: '#14532d', lineHeight: 1.5 }}>
							"dātavyam iti yad dānaṁ dīyate ’nupakāriṇe, deśhe kāle cha pātre cha tad dānaṁ sāttvikaṁ smṛitam"
						</p>
						<p style={{ margin: '4px 0 0', fontSize: '11px', color: '#166534' }}>
							Duty performed with devotion, offered in rightful place and time to those who need our care, is the purest form of service.
						</p>
					</div>
				</div>

				{/* UPI QR Code Container */}
				<div
					className="portal-card"
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						textAlign: 'center',
						padding: '24px',
					}}
				>
					<div
						style={{
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '16px',
							padding: '16px',
							display: 'inline-flex',
						}}
					>
						<QrCode size={110} color="#0f172a" />
					</div>
					<h4 style={{ margin: '14px 0 2px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
						Instant UPI Payment
					</h4>
					<p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
						Scan via Google Pay, PhonePe, Paytm, or BHIM
					</p>
					<span
						style={{
							marginTop: '10px',
							background: '#f1f5f9',
							padding: '4px 12px',
							borderRadius: '999px',
							fontFamily: 'monospace',
							fontSize: '11px',
							fontWeight: 700,
							color: '#334155',
						}}
					>
						uncf.eldercare@axisbank
					</span>
				</div>
			</div>

			{/* Itemized Cost Ledger Table */}
			<div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
				<div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
					<h3 className="portal-card-title">Itemized Care & Daily Ledger</h3>
					<p className="portal-card-desc">Detailed resident statements and service charges</p>
				</div>

				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
						<thead>
							<tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
								<th style={{ padding: '12px 16px' }}>Date</th>
								<th style={{ padding: '12px 16px' }}>Category</th>
								<th style={{ padding: '12px 16px' }}>Description</th>
								<th style={{ padding: '12px 16px', textAlign: 'right' }}>Qty</th>
								<th style={{ padding: '12px 16px', textAlign: 'right' }}>Rate (₹)</th>
								<th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount (₹)</th>
								<th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
							</tr>
						</thead>
						<tbody>
							{dailyCosts.length === 0 ? (
								<tr>
									<td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
										<Receipt size={28} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
										<p style={{ margin: 0, fontWeight: 600, fontSize: '12px', color: '#475569' }}>
											No billing charges logged for this resident yet.
										</p>
										<span style={{ fontSize: '11px', color: '#94a3b8' }}>
											Daily room, care, and medical charges will be itemized here upon generation.
										</span>
									</td>
								</tr>
							) : (
								dailyCosts.map((c) => (
									<tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
										<td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
											{formatDate(c.costDate)}
										</td>
										<td style={{ padding: '12px 16px' }}>
											<span
												style={{
													background: '#f1f5f9',
													color: '#334155',
													padding: '2px 8px',
													borderRadius: '6px',
													fontSize: '11px',
													fontWeight: 700,
												}}
											>
												{c.category}
											</span>
										</td>
										<td style={{ padding: '12px 16px', color: '#475569' }}>{c.description}</td>
										<td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>{c.quantity}</td>
										<td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
											₹{Number(c.rate).toLocaleString('en-IN')}
										</td>
										<td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
											₹{Number(c.amount).toLocaleString('en-IN')}
										</td>
										<td style={{ padding: '12px 16px', textAlign: 'center' }}>
											<span
												className={
													c.status === 'PAID'
														? 'portal-badge portal-badge--active'
														: 'portal-badge portal-badge--neutral'
												}
											>
												{c.status}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
