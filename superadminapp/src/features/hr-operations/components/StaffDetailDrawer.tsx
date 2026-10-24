import {
	Briefcase,
	Building,
	Calendar,
	CheckCircle2,
	Mail,
	Phone,
	User,
	X,
} from 'lucide-react'
import type { StaffMember } from '../hrOperations.types'

type StaffDetailDrawerProps = {
	staff: StaffMember | null
	onClose: () => void
	isOpen?: boolean
	onUpdated?: () => void
}

export function StaffDetailDrawer({
	staff,
	onClose,
	isOpen = true,
}: StaffDetailDrawerProps) {
	if (!staff || !isOpen) return null

	return (
		<div className="receipt-overlay" role="dialog" aria-modal="true">
			<div className="receipt-drawer">
				<div className="drawer-header">
					<div className="receipt-header-branding">
						<span className="section-kicker">WORKFORCE DOSSIER</span>
						<h2>{staff.name}</h2>
						<p className="field-hint">Employee ID: {staff.empId || 'Unassigned'}</p>
					</div>
					<div className="receipt-actions-top">
						<button
							type="button"
							className="icon-button"
							onClick={onClose}
							aria-label="Close employee dossier"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				<div className="receipt-body">
					<div
						className="donation-receipt-card"
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
								alignItems: 'center',
								borderBottom: '2px solid #0F969C',
								paddingBottom: '0.75rem',
								marginBottom: '1.25rem',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
								<div
									style={{
										width: '48px',
										height: '48px',
										borderRadius: '50%',
										backgroundColor: '#0F969C',
										color: '#fff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: 800,
										fontSize: '1.1rem',
									}}
								>
									{staff.name.charAt(0)}
								</div>
								<div>
									<h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
										{staff.name}
									</h3>
									<p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
										{staff.role} · {staff.department}
									</p>
								</div>
							</div>
							<span
								className={`status-badge status-badge--${
									staff.status === 'Working'
										? 'active'
										: staff.status === 'On Leave'
											? 'warning'
											: 'pending'
								}`}
							>
								{staff.status}
							</span>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '1.25rem',
								marginBottom: '1.25rem',
							}}
						>
							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Designation & Role
								</span>
								<p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0f172a' }}>
									<Briefcase size={14} style={{ display: 'inline', marginRight: '6px', color: '#0F969C' }} />
									{staff.role}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Department
								</span>
								<p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#0f172a' }}>
									<Building size={14} style={{ display: 'inline', marginRight: '6px', color: '#0F969C' }} />
									{staff.department}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Contact Phone
								</span>
								<p style={{ margin: '0.2rem 0 0', color: '#0f172a' }}>
									<Phone size={14} style={{ display: 'inline', marginRight: '6px', color: '#64748b' }} />
									{staff.phone || 'No phone recorded'}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Official Email
								</span>
								<p style={{ margin: '0.2rem 0 0', color: '#0f172a' }}>
									<Mail size={14} style={{ display: 'inline', marginRight: '6px', color: '#64748b' }} />
									{staff.email || 'No email recorded'}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Joining Date
								</span>
								<p style={{ margin: '0.2rem 0 0', color: '#0f172a' }}>
									<Calendar size={14} style={{ display: 'inline', marginRight: '6px', color: '#64748b' }} />
									{staff.joiningDate || '-'}
								</p>
							</div>

							<div>
								<span
									style={{
										fontSize: '0.75rem',
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										fontWeight: 700,
									}}
								>
									Performance Index
								</span>
								<p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: '#0F969C' }}>
									{staff.performanceScore || 50} / 100
								</p>
							</div>
						</div>

						{/* System Account Status */}
						<div
							style={{
								borderTop: '1px solid #e2e8f0',
								paddingTop: '1rem',
								backgroundColor: '#f8fafc',
								padding: '0.85rem 1rem',
								borderRadius: '8px',
							}}
						>
							<span
								style={{
									fontSize: '0.75rem',
									color: '#64748b',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									fontWeight: 700,
								}}
							>
								ERP User Account Linkage
							</span>
							<div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								{staff.user ? (
									<>
										<CheckCircle2 size={16} color="#0F969C" />
										<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
											Provisioned System Account (User ID: {staff.user.id.slice(0, 8)}...)
										</span>
										{staff.user.role && (
											<span className="status-badge status-badge--active" style={{ fontSize: '0.7rem' }}>
												{staff.user.role}
											</span>
										)}
									</>
								) : (
									<>
										<User size={16} color="#64748b" />
										<span style={{ fontSize: '0.85rem', color: '#64748b' }}>
											No active system login account linked to this staff profile.
										</span>
									</>
								)}
							</div>
						</div>
					</div>

					<div style={{ marginTop: '1.25rem' }}>
						<button
							type="button"
							className="button secondary"
							style={{ width: '100%' }}
							onClick={onClose}
						>
							Close Dossier
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
