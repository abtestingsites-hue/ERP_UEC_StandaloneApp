import { useState } from 'react'
import {
	HeartPulse,
	CalendarDays,
	Clock,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
}

export function PortalVitalsTab({ data }: Props) {
	const { vitals, caregiverVitalCharts } = data
	const [activeView, setActiveView] = useState<'chart' | 'log'>('chart')

	const formatDateTime = (val?: string) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime())
			? d.toLocaleString('en-IN', {
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
			{/* Header with Switcher */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
				<div>
					<h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
						Health Vitals & Nursing Chart
					</h2>
					<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
						Live measurements recorded twice daily by attending caregivers and floor nurses.
					</p>
				</div>
				<div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
					<button
						type="button"
						onClick={() => setActiveView('chart')}
						style={{
							padding: '6px 14px',
							borderRadius: '8px',
							fontSize: '12px',
							fontWeight: 700,
							border: 'none',
							cursor: 'pointer',
							background: activeView === 'chart' ? '#ffffff' : 'transparent',
							color: activeView === 'chart' ? '#166534' : '#64748b',
							boxShadow: activeView === 'chart' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
						}}
					>
						Monthly Caregiver Chart
					</button>
					<button
						type="button"
						onClick={() => setActiveView('log')}
						style={{
							padding: '6px 14px',
							borderRadius: '8px',
							fontSize: '12px',
							fontWeight: 700,
							border: 'none',
							cursor: 'pointer',
							background: activeView === 'log' ? '#ffffff' : 'transparent',
							color: activeView === 'log' ? '#166534' : '#64748b',
							boxShadow: activeView === 'log' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
						}}
					>
						Timeline Log
					</button>
				</div>
			</div>

			{activeView === 'chart' ? (
				/* Monthly Caregiver Vital Charts */
				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{caregiverVitalCharts.length === 0 ? (
						vitals.length > 0 ? (
							<div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
								<div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div>
											<h3 className="portal-card-title">Recorded In-House Care Vitals</h3>
											<p className="portal-card-desc">Live clinical observations</p>
										</div>
										<span className="portal-badge portal-badge--active">
											Live Monitoring
										</span>
									</div>
								</div>

								<div style={{ overflowX: 'auto' }}>
									<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
										<thead>
											<tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
												<th style={{ padding: '12px 16px' }}>Recorded Time</th>
												<th style={{ padding: '12px 16px' }}>Temp (°F)</th>
												<th style={{ padding: '12px 16px' }}>BP (mmHg)</th>
												<th style={{ padding: '12px 16px' }}>Pulse (bpm)</th>
												<th style={{ padding: '12px 16px' }}>Sugar Level</th>
											</tr>
										</thead>
										<tbody>
											{vitals.map((row) => (
												<tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
													<td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{formatDateTime(row.recordedAt)}</td>
													<td style={{ padding: '12px 16px', color: '#334155' }}>{row.temperature ? `${row.temperature}°F` : '—'}</td>
													<td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{row.bloodPressure ? `${row.bloodPressure} mmHg` : '—'}</td>
													<td style={{ padding: '12px 16px', color: '#334155' }}>{row.heartRate ? `${row.heartRate} bpm` : '—'}</td>
													<td style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>{row.sugarLevel ? `${row.sugarLevel} mg/dL` : '—'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div
								style={{
									padding: '40px 20px',
									textAlign: 'center',
									background: '#ffffff',
									border: '1px dashed #cbd5e1',
									borderRadius: '16px',
								}}
							>
								<HeartPulse size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
								<h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
									No Vital Recordings Logged Yet
								</h3>
								<p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
									Attending floor nurses record resident temperature, pulse, and BP during morning and evening shifts. Records will update here automatically.
								</p>
							</div>
						)
					) : (
						caregiverVitalCharts.map((chart) => (
							<div
								key={chart.id}
								className="portal-card"
								style={{ padding: 0, overflow: 'hidden' }}
							>
								<div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
									<h3 className="portal-card-title">
										Caregiver Chart — {chart.month}
									</h3>
									<p className="portal-card-desc">
										Resident: {chart.patientName}
									</p>
								</div>
								<div style={{ padding: '16px' }}>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
										{chart.entries?.slice(0, 10).map((entry, idx) => (
											<div
												key={idx}
												style={{
													background: '#f8fafc',
													border: '1px solid #f1f5f9',
													borderRadius: '10px',
													padding: '12px',
													fontSize: '12px',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e293b' }}>
													<CalendarDays size={14} color="#039A01" />
													<span>Day {entry.day}</span>
												</div>
												<div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#475569' }}>
													<div>
														<span style={{ color: '#94a3b8' }}>BP:</span> {entry.bpMor || '—'} / {entry.bpEve || '—'}
													</div>
													<div>
														<span style={{ color: '#94a3b8' }}>Temp:</span> {entry.tempMor || '—'} / {entry.tempEve || '—'}
													</div>
													<div>
														<span style={{ color: '#94a3b8' }}>Pulse:</span> {entry.pulseMor || '—'} / {entry.pulseEve || '—'}
													</div>
													<div>
														<span style={{ color: '#94a3b8' }}>SpO2:</span> {entry.spo2Mor || '—'} / {entry.spo2Eve || '—'}
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			) : (
				/* Detailed Timeline Log */
				<div className="portal-card">
					{vitals.length === 0 ? (
						<div style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
							No recorded readings yet.
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{vitals.map((v) => (
								<div
									key={v.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: '12px',
										padding: '14px 16px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<div
											style={{
												background: '#fef2f2',
												color: '#dc2626',
												borderRadius: '10px',
												padding: '8px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<HeartPulse size={18} />
										</div>
										<div>
											<div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
												BP: {v.bloodPressure ? `${v.bloodPressure} mmHg` : '—'}
											</div>
											<div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#64748b' }}>
												<span>Pulse: {v.heartRate ? `${v.heartRate} bpm` : '—'}</span>
												<span>Temperature: {v.temperature ? `${v.temperature}°F` : '—'}</span>
												<span>Sugar: {v.sugarLevel ? `${v.sugarLevel} mg/dL` : '—'}</span>
											</div>
										</div>
									</div>
									<div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
										<Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
										{formatDateTime(v.recordedAt)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
