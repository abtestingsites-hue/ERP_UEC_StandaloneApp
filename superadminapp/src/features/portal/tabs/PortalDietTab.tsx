import {
	Utensils,
	GlassWater,
	CheckCircle2,
} from 'lucide-react'
import type { PortalDashboardData } from '../portal.types'

interface Props {
	data: PortalDashboardData
}

export function PortalDietTab({ data }: Props) {
	const { resident, nutritions } = data

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
					Dietary & Nutrition Plan
				</h2>
				<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
					Nutritional diet records and daily culinary regimens tailored for <strong>{resident.name}</strong>.
				</p>
			</div>

			{/* Nutrition Banner */}
			<div
				style={{
					border: '1px solid #fde68a',
					background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #ffffff 100%)',
					borderRadius: '16px',
					padding: '20px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: '16px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
					<div
						style={{
							background: '#d97706',
							color: '#ffffff',
							borderRadius: '12px',
							padding: '10px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Utensils size={20} />
					</div>
					<div>
						<h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
							Diet Regimen: {nutritions?.[0]?.mealType || 'Standard Nutritious Care Plan'}
						</h3>
						<p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>
							{nutritions?.[0]?.items || 'Fresh daily culinary meals prepared under nutritionist supervision.'}
						</p>
					</div>
				</div>

				<div>
					<span
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
							padding: '4px 12px',
							borderRadius: '999px',
							fontSize: '11px',
							fontWeight: 700,
							background: '#dcfce7',
							color: '#166534',
						}}
					>
						<CheckCircle2 size={13} />
						Prepared Fresh Daily
					</span>
				</div>
			</div>

			{/* Meal Schedule / Recorded Logs */}
			<div className="portal-card">
				<div className="portal-card-header">
					<div>
						<h3 className="portal-card-title">Daily Meal Records</h3>
						<p className="portal-card-desc">Dietary logs and nutritional entries updated by kitchen staff</p>
					</div>
					<span className="portal-badge portal-badge--active">
						{nutritions.length > 0 ? `${nutritions.length} Recorded` : 'Standard Regimen'}
					</span>
				</div>

				<div style={{ marginTop: '16px' }}>
					{nutritions.length === 0 ? (
						<div
							style={{
								padding: '36px 20px',
								textAlign: 'center',
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: '12px',
							}}
						>
							<Utensils size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
							<h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
								Standard Daily Dining Active
							</h4>
							<p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
								No custom medical dietary restrictions logged. Resident receives standard elderly-balanced breakfast, lunch, tea, and dinner prepared fresh in the facility kitchen.
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
							{nutritions.map((item) => (
								<div
									key={item.id}
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
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
											<Utensils size={16} />
										</div>
										<div>
											<strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.mealType}</strong>
											<p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 0' }}>
												{item.items}
											</p>
											{item.notes && (
												<span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
													Notes: {item.notes}
												</span>
											)}
										</div>
									</div>
									<div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
										<span>{formatDate(item.createdAt || item.date)}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Fluid & Hydration Tracking */}
			<div
				style={{
					border: '1px solid #bfdbfe',
					background: '#eff6ff',
					borderRadius: '16px',
					padding: '18px 20px',
					display: 'flex',
					alignItems: 'center',
					gap: '14px',
				}}
			>
				<div
					style={{
						background: '#0284c7',
						color: '#ffffff',
						borderRadius: '12px',
						padding: '10px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<GlassWater size={20} />
				</div>
				<div>
					<h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
						Hydration & Fluid Intake
					</h4>
					<p style={{ fontSize: '12px', color: '#475569', margin: '3px 0 0' }}>
						Adequate water, tender coconut water, herbal infusions, and fresh broths are served during morning and evening rounds under attendant nurse assistance.
					</p>
				</div>
			</div>
		</div>
	)
}
