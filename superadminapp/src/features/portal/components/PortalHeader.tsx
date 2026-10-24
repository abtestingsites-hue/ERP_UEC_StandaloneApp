import { useNavigate } from 'react-router-dom'
import {
	BedDouble,
	LogOut,
	Phone,
} from 'lucide-react'
import type { PortalAccount, PortalResident } from '../portal.types'
import { PortalService } from '../portal.service'

interface Props {
	account: PortalAccount
	resident?: PortalResident
	onLogout: () => void
}

export function PortalHeader({ account, resident, onLogout }: Props) {
	const navigate = useNavigate()

	const handleLogout = async () => {
		await PortalService.logout()
		onLogout()
		navigate('/login', { replace: true })
	}

	const residentName = resident?.name || account.patientName
	const roomBed = `${resident?.room || account.room} · ${resident?.bed || account.bed}`

	return (
		<header className="portal-header">
			<div className="portal-header-inner">
				{/* Official UNCF Brand Mark matching Staff Topbar & Sidebar */}
				<div className="portal-brand">
					<span className="portal-brand-logo">
						<img src="/logo.png" alt="UNCF Logo" />
					</span>
					<div className="portal-brand-text">
						<span className="portal-brand-title">UNIVERSAL</span>
						<span className="portal-brand-sub">NATURE CARE & CURE FOUNDATION</span>
						<span className="portal-brand-trust">(UNCF TRUST - SINCE 2015)</span>
					</div>
					<div style={{ width: '1px', height: '28px', background: '#e2e8f0', margin: '0 4px' }} />
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<span style={{ fontSize: '11px', fontWeight: 800, color: '#028001', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
							Client & Family Portal
						</span>
						<span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>
							In-House Care & Resident Monitoring
						</span>
					</div>
				</div>

				{/* Center: Active Admitted Resident Badge */}
				<div className="portal-resident-chip">
					<BedDouble size={16} />
					<span>
						Resident: <strong>{residentName}</strong> ({roomBed})
					</span>
					<span className="portal-badge portal-badge--active" style={{ fontSize: '10px', padding: '1px 7px' }}>
						ACTIVE
					</span>
				</div>

				{/* Right Controls */}
				<div className="portal-header-right">
					<div className="portal-guardian-meta">
						<span className="portal-guardian-name">{account.name}</span>
						<span className="portal-guardian-phone">
							<Phone size={11} /> {account.mobile}
						</span>
					</div>

					<button
						type="button"
						onClick={handleLogout}
						title="Sign out of portal"
						className="portal-btn-signout"
					>
						<LogOut size={14} />
						<span>Sign Out</span>
					</button>
				</div>
			</div>
		</header>
	)
}
