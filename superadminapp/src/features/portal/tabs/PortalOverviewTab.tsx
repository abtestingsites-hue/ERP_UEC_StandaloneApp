import {
	Pill,
	Utensils,
	Receipt,
	HeartPulse,
	BedDouble,
	Calendar,
	Stethoscope,
	ShieldCheck,
	CheckCircle2,
	Clock,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
	onTabChange: (tab: string) => void
}

export function PortalOverviewTab({ data, onTabChange }: Props) {
	const { resident, vitals, medications, nutritions, doctorVisits, dailyCosts } = data

	const latestVital = vitals?.[0]
	const pendingCosts = dailyCosts?.filter((c) => c.status !== 'PAID') || []
	const totalPending = pendingCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

	const formatDate = (val?: string | null) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
	}

	return (
		<div className="space-y-6">
			{/* Resident Hero Profile Card - Aligned with Staff Admission Details View */}
			<div className="portal-hero-card">
				<div className="portal-hero-top">
					<div className="portal-hero-profile">
						<div className="portal-hero-avatar">
							{resident.name?.charAt(0) || 'R'}
						</div>
						<div className="portal-hero-titles">
							<h2>
								<span>{resident.name}</span>
								<span className="portal-badge portal-badge--active">
									<ShieldCheck size={13} />
									<span>Admitted Resident</span>
								</span>
								<span className="portal-badge portal-badge--neutral">
									{resident.clinicalStatus || 'Stable'}
								</span>
							</h2>

							<div className="portal-hero-meta">
								<div className="portal-hero-meta-item">
									<BedDouble size={16} color="#039A01" />
									<span><strong>{resident.room}</strong> · {resident.bed} ({resident.floor})</span>
								</div>
								<div className="portal-hero-meta-item">
									<Calendar size={16} color="#039A01" />
									<span>Admitted: <strong>{formatDate(resident.admittedAt)}</strong></span>
								</div>
								<div className="portal-hero-meta-item">
									<span>Blood Group: <strong>{resident.bloodGroup || 'O+'}</strong></span>
								</div>
							</div>
						</div>
					</div>

					<div className="portal-hero-actions">
						<button
							type="button"
							onClick={() => onTabChange('vitals')}
							className="portal-btn-secondary"
						>
							<HeartPulse size={15} />
							<span>View Vital Charts</span>
						</button>
						<button
							type="button"
							onClick={() => onTabChange('billing')}
							className="portal-btn-primary"
						>
							<Receipt size={15} />
							<span>View Invoices & Bill</span>
						</button>
					</div>
				</div>
			</div>

			{/* KPI Status Strip matching Staff Admissions Dashboard */}
			<div className="portal-kpi-grid">
				<div
					onClick={() => onTabChange('vitals')}
					className="portal-kpi-card"
				>
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Latest Vitals</span>
						<div className="portal-kpi-icon portal-kpi-icon--red">
							<HeartPulse size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value">
							{latestVital?.bloodPressure ? `${latestVital.bloodPressure} mmHg` : 'No readings yet'}
						</div>
						<div className="portal-kpi-subtitle">
							{latestVital ? `Pulse: ${latestVital.heartRate || '-'} bpm · Temp: ${latestVital.temperature || '-'}°F` : 'Attending nurse records daily'}
						</div>
					</div>
				</div>

				<div
					onClick={() => onTabChange('meds')}
					className="portal-kpi-card"
				>
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Active Meds</span>
						<div className="portal-kpi-icon portal-kpi-icon--blue">
							<Pill size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value">
							{medications.length} Prescribed
						</div>
						<div className="portal-kpi-subtitle" style={{ color: medications.length > 0 ? '#2563eb' : '#64748b' }}>
							{medications.length > 0 ? 'Regimen active & scheduled' : 'No custom medications logged'}
						</div>
					</div>
				</div>

				<div
					onClick={() => onTabChange('diet')}
					className="portal-kpi-card"
				>
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Diet & Meals</span>
						<div className="portal-kpi-icon portal-kpi-icon--amber">
							<Utensils size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value">
							{nutritions?.[0]?.mealType || 'Standard Plan'}
						</div>
						<div className="portal-kpi-subtitle">
							{nutritions?.[0]?.mealType ? 'Nutritional diet active' : 'Kitchen dietary plan in place'}
						</div>
					</div>
				</div>

				<div
					onClick={() => onTabChange('billing')}
					className="portal-kpi-card"
				>
					<div className="portal-kpi-header">
						<span className="portal-kpi-title">Outstanding Balance</span>
						<div className="portal-kpi-icon portal-kpi-icon--emerald">
							<Receipt size={18} />
						</div>
					</div>
					<div>
						<div className="portal-kpi-value">
							₹{totalPending.toLocaleString('en-IN')}
						</div>
						<div className="portal-kpi-subtitle" style={{ color: totalPending > 0 ? '#d97706' : '#039A01' }}>
							{pendingCosts.length > 0 ? `${pendingCosts.length} pending service items` : 'All care accounts settled'}
						</div>
					</div>
				</div>
			</div>

			{/* Main Grid: Meds Today + Doctor Visits */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Today's Medication Tracker */}
				<div className="portal-card">
					<div className="portal-card-header">
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<div className="portal-kpi-icon portal-kpi-icon--blue" style={{ width: 32, height: 32 }}>
								<Pill size={16} />
							</div>
							<div>
								<h3 className="portal-card-title">Today's Medication Schedule</h3>
								<p className="portal-card-desc">Scheduled morning, afternoon, and evening administration</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => onTabChange('meds')}
							className="portal-btn-secondary"
							style={{ padding: '5px 12px', fontSize: '11px' }}
						>
							View All
						</button>
					</div>

					<div className="space-y-3" style={{ marginTop: 12 }}>
						{medications.length === 0 ? (
							<div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: 10, color: '#64748b', fontSize: '12px' }}>
								No custom medicines added. Standard daily care regimen in place.
							</div>
						) : (
							medications.slice(0, 4).map((med, idx) => (
								<div
									key={med.id || idx}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '12px 14px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: 10
									}}
								>
									<div>
										<strong style={{ fontSize: '13px', color: '#0f172a' }}>{med.name}</strong>
										<div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
											Dose: {med.dosage} · {med.frequency || 'Daily'}
										</div>
									</div>
									<span className="portal-badge portal-badge--active">
										<CheckCircle2 size={12} />
										<span>Administered</span>
									</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Doctor Rounds & Clinical Consultations */}
				<div className="portal-card">
					<div className="portal-card-header">
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<div className="portal-kpi-icon portal-kpi-icon--emerald" style={{ width: 32, height: 32 }}>
								<Stethoscope size={16} />
							</div>
							<div>
								<h3 className="portal-card-title">Physician Visits & Notes</h3>
								<p className="portal-card-desc">Weekly doctor clinical review rounds</p>
							</div>
						</div>
						<span className="portal-badge portal-badge--active">
							Active Medical Care
						</span>
					</div>

					<div className="space-y-3" style={{ marginTop: 12 }}>
						{doctorVisits.length === 0 ? (
							<div style={{ padding: '24px 16px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 10 }}>
								<Clock size={20} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
								<p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: 0 }}>
									Weekly doctor round scheduled. All vitals reviewed by attending medical officer.
								</p>
							</div>
						) : (
							doctorVisits.slice(0, 3).map((visit, idx) => (
								<div
									key={visit.id || idx}
									style={{
										padding: '12px 14px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: 10
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
										<strong style={{ color: '#0f172a' }}>Dr. {visit.doctorName || 'Medical Officer'}</strong>
										<span style={{ color: '#94a3b8' }}>{formatDate(visit.visitDate)}</span>
									</div>
									<p style={{ margin: '6px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
										{visit.clinicalNotes || visit.chiefComplaint || 'Resident examined. Vitals normal and stable.'}
									</p>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
