import {
	Footprints,
	Sparkles,
	Utensils,
	Moon,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
}

export function PortalAdlTab({ data }: Props) {
	const { adlRecords, resident } = data

	const formatDate = (val?: string) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime())
			? d.toLocaleDateString('en-IN', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
			  })
			: '—'
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
					Activities of Daily Living (ADL)
				</h2>
				<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
					Routine personal care, mobility, hygiene, and caregiver assistance updates for{' '}
					<strong>{resident.name}</strong>.
				</p>
			</div>

			{/* Core Routine Status Cards */}
			<div className="portal-kpi-grid">
				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Hygiene & Grooming</span>
						<div className="portal-kpi-icon portal-kpi-icon--blue">
							<Sparkles size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ fontSize: '15px' }}>
							Daily Routine
						</div>
						<div className="portal-kpi-subtitle">
							Assisted bathing & oral care
						</div>
					</div>
				</div>

				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Mobility Classification</span>
						<div className="portal-kpi-icon portal-kpi-icon--emerald">
							<Footprints size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ fontSize: '15px' }}>
							{resident.clinicalStatus || 'Ambulatory'}
						</div>
						<div className="portal-kpi-subtitle">
							Attendant supervised support
						</div>
					</div>
				</div>

				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Dining Protocol</span>
						<div className="portal-kpi-icon portal-kpi-icon--amber">
							<Utensils size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ fontSize: '15px' }}>
							Assisted Meals
						</div>
						<div className="portal-kpi-subtitle">
							Dining assistance as needed
						</div>
					</div>
				</div>

				<div className="portal-kpi-card">
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Night Observation</span>
						<div className="portal-kpi-icon portal-kpi-icon--emerald">
							<Moon size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value" style={{ fontSize: '15px' }}>
							Floor Rounds
						</div>
						<div className="portal-kpi-subtitle">
							Night attendant on-call
						</div>
					</div>
				</div>
			</div>

			{/* Detailed ADL Log Entries */}
			<div className="portal-card">
				<div className="portal-card-header">
					<div>
						<h3 className="portal-card-title">Attendant Care Logs</h3>
						<p className="portal-card-desc">Shift-by-shift daily living assistance observations</p>
					</div>
					<span className="portal-badge portal-badge--active">
						{adlRecords.length > 0 ? `${adlRecords.length} Entries` : 'Shift Active'}
					</span>
				</div>

				<div style={{ marginTop: '16px' }}>
					{adlRecords.length === 0 ? (
						<div
							style={{
								padding: '40px 20px',
								textAlign: 'center',
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: '12px',
							}}
						>
							<Footprints size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
							<h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
								No Care Logs Recorded Yet
							</h4>
							<p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
								Attendant nursing and personal care assistance logs will be listed here as shifts are completed by the on-duty care staff.
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
							{adlRecords.map((r) => (
								<div
									key={r.id}
									style={{
										padding: '14px 16px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: '12px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
										<strong style={{ color: '#0f172a' }}>
											Mobility: {r.mobility || 'Normal'} · Hygiene: {r.hygiene || 'Assisted'}
										</strong>
										<span style={{ color: '#94a3b8', fontSize: '11px' }}>{formatDate(r.createdAt)}</span>
									</div>
									<p style={{ margin: '6px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
										{r.notes || 'Daily living assistance provided.'}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
