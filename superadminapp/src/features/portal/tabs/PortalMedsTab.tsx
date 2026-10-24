import {
	Pill,
	CheckCircle2,
	FileText,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
}

export function PortalMedsTab({ data }: Props) {
	const { medications, prescriptions, resident } = data

	const formatDate = (val?: string) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime())
			? d.toLocaleDateString('en-IN', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
			  })
			: '—'
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
					Medications & Prescriptions
				</h2>
				<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
					Current drug regimen, dosage times, and clinical administration logs for{' '}
					<strong>{resident.name}</strong>.
				</p>
			</div>

			{/* Prescribed Medicines List */}
			<div className="portal-card">
				<div className="portal-card-header">
					<div>
						<h3 className="portal-card-title">Active Medications</h3>
						<p className="portal-card-desc">Administered under registered floor nurse supervision</p>
					</div>
					<span className="portal-badge portal-badge--active">
						{medications.length > 0 ? `${medications.length} Active` : 'No Prescriptions'}
					</span>
				</div>

				<div style={{ marginTop: '16px' }}>
					{medications.length === 0 ? (
						<div
							style={{
								padding: '40px 20px',
								textAlign: 'center',
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: '12px',
							}}
						>
							<Pill size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
							<h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
								No Active Medications Logged
							</h4>
							<p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
								There are currently no active pharmaceutical medications entered for this resident. Any prescribed drugs entered by the attending physician or nursing station will appear here.
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
							{medications.map((m) => (
								<div
									key={m.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '14px 16px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: '12px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<div
											style={{
												background: '#eff6ff',
												color: '#2563eb',
												borderRadius: '10px',
												padding: '8px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<Pill size={18} />
										</div>
										<div>
											<strong style={{ fontSize: '13px', color: '#0f172a' }}>{m.name}</strong>
											<div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
												Dosage: <strong>{m.dosage}</strong> {m.frequency ? `· ${m.frequency}` : ''}
											</div>
											{m.notes && (
												<div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
													Instructions: {m.notes}
												</div>
											)}
										</div>
									</div>
									<div style={{ textAlign: 'right' }}>
										<span className="portal-badge portal-badge--active">
											<CheckCircle2 size={12} />
											<span>Active</span>
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Clinical Prescriptions / Doctor Orders */}
			<div className="portal-card">
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
							<FileText size={18} />
						</div>
						<div>
							<h3 className="portal-card-title">Physician Clinical Orders</h3>
							<p className="portal-card-desc">Doctor notes and treatment protocols</p>
						</div>
					</div>
				</div>

				<div style={{ marginTop: '16px' }}>
					{prescriptions.length === 0 ? (
						<div
							style={{
								padding: '30px 20px',
								textAlign: 'center',
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: '12px',
							}}
						>
							<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
								No written clinical orders attached to this profile. Weekly rounds records are maintained on file.
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
							{prescriptions.map((p) => (
								<div
									key={p.id}
									style={{
										padding: '14px 16px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: '12px',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
										<strong style={{ fontSize: '13px', color: '#0f172a' }}>
											{p.doctorName ? `Dr. ${p.doctorName}` : 'Attending Physician'}
										</strong>
										<span style={{ fontSize: '11px', color: '#94a3b8' }}>
											{formatDate(p.createdAt)}
										</span>
									</div>
									{p.diagnosis && (
										<div style={{ fontSize: '12px', color: '#334155', marginBottom: 4 }}>
											<strong>Diagnosis / Clinical Impression:</strong> {p.diagnosis}
										</div>
									)}
									{p.instructions && (
										<div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
											{p.instructions}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
