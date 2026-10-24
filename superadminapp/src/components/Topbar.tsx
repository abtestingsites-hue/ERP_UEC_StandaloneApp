import { useState } from 'react'
import { Clock, LogOut, Menu, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getRoleName } from '../utils/permissions'
import { OperatingUnitSelector } from './OperatingUnitSelector'
import { MyProfileModal } from './MyProfileModal'

type TopbarProps = {
	onToggleSidebar: () => void
}

function getWorkspaceTitle(pathname: string): string {
	if (pathname.startsWith('/inhouse-care') || pathname.startsWith('/inhouse_care') || pathname.startsWith('/inhouse%20care') || pathname.startsWith('/inhouse care')) return 'INHOUSE CARE & NURSING WORKSPACE'
	if (pathname.startsWith('/home-care')) return 'HOME CARE OPERATIONS WORKSPACE'
	if (pathname.startsWith('/inventory')) return 'INVENTORY & SUPPLY CHAIN WORKSPACE'
	if (pathname.startsWith('/finance')) return 'FINANCE & BILLING WORKSPACE'
	if (pathname.startsWith('/hr-operations')) return 'HR & OPERATIONS WORKSPACE'
	if (pathname.startsWith('/ambulance')) return 'AMBULANCE SERVICES WORKSPACE'
	if (pathname.startsWith('/admission')) return 'ADMISSIONS & ENQUIRIES WORKSPACE'
	if (pathname.startsWith('/visitor-security')) return 'SECURITY & VISITOR WORKSPACE'
	if (pathname.startsWith('/donors-volunteers')) return 'DONATIONS & VOLUNTEERS WORKSPACE'
	if (pathname.startsWith('/reports')) return 'CENTRAL ERP REPORTS'
	return 'UNCF CENTRAL COMMAND CENTER'
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
	const { session, logout } = useAuth()
	const location = useLocation()
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

	const userName = session?.user.name || session?.user.email || 'Administrator'
	const roleDisplay = getRoleName(session?.user) || 'Authorized User'
	const workspaceTitle = getWorkspaceTitle(location.pathname)

	const initials = userName
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.substring(0, 2)
		.toUpperCase() || 'SA'

	return (
		<header className="topbar">
			<div className="topbar__identity">
				<button
					className="icon-button topbar__menu"
					type="button"
					onClick={onToggleSidebar}
					aria-label="Toggle navigation"
					title="Toggle navigation"
				>
					<Menu size={19} />
				</button>
				<div>
					<span className="topbar__eyebrow">{workspaceTitle}</span>
					<strong>{roleDisplay} · {userName}</strong>
				</div>
			</div>
			<div className="topbar__right">
				<OperatingUnitSelector />
				
				{/* Quick Staff Attendance / Profile Trigger */}
				<button
					type="button"
					onClick={() => setIsProfileModalOpen(true)}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						padding: '5px 11px',
						background: 'var(--brand-green-surface)',
						border: '1px solid var(--brand-green-border)',
						borderRadius: 'var(--radius-sm)',
						color: 'var(--brand-green-text)',
						fontSize: '11px',
						fontWeight: 600,
						cursor: 'pointer',
						transition: 'all 120ms ease'
					}}
					title="Check In / Out & Request Leave"
				>
					<Clock size={13} />
					<span>Attendance</span>
				</button>

				<button
					className="topbar__avatar"
					type="button"
					onClick={() => setIsProfileModalOpen(true)}
					aria-label="My Profile & Attendance"
					title={`My Profile & Attendance - ${userName} (${roleDisplay})`}
					style={{ cursor: 'pointer', border: '1px solid var(--brand-green-border)' }}
				>
					{initials}
				</button>
				<button
					className="icon-button topbar__logout"
					type="button"
					onClick={logout}
					aria-label="Sign out"
					title="Sign out"
				>
					<LogOut size={17} />
				</button>
			</div>

			{/* My Profile & Attendance Modal */}
			<MyProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
			/>
		</header>
	)
}

