import { useState, useRef, useEffect } from 'react'
import {
	Clock,
	LayoutDashboard,
	LogOut,
	User as UserIcon,
	X
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { domainModules } from '../services/moduleRegistry'
import { useAuth } from '../features/auth/useAuth'
import { canAccessDomain, getRoleName, getDefaultRouteForUser, isSuperAdmin } from '../utils/permissions'
import { MyProfileModal } from './MyProfileModal'

type SidebarProps = {
	collapsed: boolean
	mobileOpen: boolean
	onToggle: () => void
	onNavigate: () => void
}

export function Sidebar({
	collapsed,
	mobileOpen,
	onNavigate,
}: SidebarProps) {
	const { session, logout } = useAuth()
	const user = session?.user

	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
	const footerRef = useRef<HTMLDivElement>(null)

	const accessibleModules = domainModules.filter((m) => canAccessDomain(m.id, user))
	const roleDisplay = getRoleName(user) || 'Authorized User'
	const userName = user?.name || user?.email?.split('@')[0] || 'Administrator'
	const unitCode = user?.unit?.code || (user?.unitAccess?.includes('*') ? 'All Facilities' : 'Local Unit')
	const defaultHome = getDefaultRouteForUser(user)

	const initials = userName
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.substring(0, 2)
		.toUpperCase() || 'SA'

	// Close user menu on outside click or escape
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
				setIsUserMenuOpen(false)
			}
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setIsUserMenuOpen(false)
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	return (
		<aside
			className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}
			aria-label="Main navigation"
		>
			{/* Brand Lockup Row */}
			<div className="sidebar__brand-row">
				<NavLink
					className="brand-lockup"
					to={defaultHome}
					onClick={onNavigate}
					title="UNCF ERP Home"
				>
					<span className="brand-mark" aria-hidden="true" style={{ background: '#ffffff', padding: 2, border: '1px solid #e1e6e1', borderRadius: '8px' }}>
						<img src="/logo.png" alt="UNCF Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
					</span>
					<span className="brand-copy">
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#039A01',
							fontSize: '15px',
							fontWeight: 900,
							letterSpacing: '2px',
							lineHeight: 1.1,
							textTransform: 'uppercase'
						}}>
							UNIVERSAL
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#202020',
							fontSize: '7.8px',
							fontWeight: 700,
							letterSpacing: '0.8px',
							lineHeight: 1.15,
							textTransform: 'uppercase',
							whiteSpace: 'nowrap'
						}}>
							NATURE CARE & CURE FOUNDATION
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#633B32',
							fontSize: '7px',
							fontWeight: 600,
							letterSpacing: '0.6px',
							lineHeight: 1.1,
							textTransform: 'uppercase',
							whiteSpace: 'nowrap',
							opacity: 0.95
						}}>
							(UNCF TRUST - SINCE 2015)
						</span>
					</span>
				</NavLink>
			</div>

			<div className="sidebar__section-label">WORKSPACE</div>
			<nav className="sidebar__nav">
				{isSuperAdmin(user) && (
					<NavLink
						className={({ isActive }) =>
							`sidebar-link${isActive ? ' sidebar-link--active' : ''}`
						}
						to="/dashboard"
						onClick={onNavigate}
						title="Dashboard"
					>
						<LayoutDashboard size={18} strokeWidth={1.8} />
						<span>Dashboard</span>
					</NavLink>
				)}
				{accessibleModules.map(({ id, path, shortLabel, Icon }) => (
					<NavLink
						key={id}
						className={({ isActive }) =>
							`sidebar-link${isActive ? ' sidebar-link--active' : ''}`
						}
						to={path}
						onClick={onNavigate}
						title={shortLabel}
					>
						<Icon size={18} strokeWidth={1.8} />
						<span>{shortLabel}</span>
					</NavLink>
				))}
			</nav>

			{/* Interactive Footer & User Profile Popover */}
			<div ref={footerRef} style={{ position: 'relative', marginTop: 'auto', width: '100%' }}>
				{isUserMenuOpen && (
					<div
						className="sidebar-user-popover animate-in fade-in duration-150"
						style={{
							position: 'absolute',
							bottom: 'calc(100% + 10px)',
							left: collapsed ? '4px' : '0',
							width: collapsed ? '240px' : '100%',
							minWidth: '220px',
							background: '#FFFFFF',
							border: '1px solid #E1E6E1',
							borderRadius: '12px',
							boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
							padding: '14px',
							zIndex: 70,
							display: 'flex',
							flexDirection: 'column',
							gap: '12px'
						}}
					>
						{/* User Info Header */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								<span
									style={{
										width: '36px',
										height: '36px',
										borderRadius: '50%',
										background: '#E7F4E8',
										color: '#026601',
										border: '1px solid #C8E6CA',
										display: 'grid',
										placeItems: 'center',
										fontWeight: 800,
										fontSize: '12px'
									}}
								>
									{initials}
								</span>
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									<strong style={{ color: '#202020', fontSize: '13px', lineHeight: 1.2 }}>{userName}</strong>
									<span style={{ color: '#039A01', fontSize: '11px', fontWeight: 600 }}>{roleDisplay}</span>
								</div>
							</div>
							<button
								type="button"
								onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(false); }}
								style={{ background: 'transparent', border: 'none', color: '#5F6962', cursor: 'pointer', padding: 2 }}
								title="Close"
							>
								<X size={15} />
							</button>
						</div>

						{/* Detail Rows */}
						<div
							style={{
								padding: '8px 10px',
								background: '#F5F7F5',
								border: '1px solid #E1E6E1',
								borderRadius: '8px',
								fontSize: '11px',
								color: '#5F6962',
								display: 'flex',
								flexDirection: 'column',
								gap: '4px'
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span>Facility Scope:</span>
								<span style={{ color: '#202020', fontWeight: 600 }}>{unitCode}</span>
							</div>
							{user?.email && (
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<span>Email:</span>
									<span style={{ color: '#202020', fontWeight: 500 }}>{user.email}</span>
								</div>
							)}
						</div>

						{/* My Profile & Attendance Action */}
						<button
							type="button"
							onClick={() => {
								setIsUserMenuOpen(false)
								setIsProfileModalOpen(true)
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								padding: '9px 12px',
								background: '#E7F4E8',
								border: '1px solid #C8E6CA',
								color: '#026601',
								borderRadius: '8px',
								fontSize: '12px',
								fontWeight: 600,
								cursor: 'pointer',
								transition: 'all 150ms ease'
							}}
							onMouseOver={(e) => { e.currentTarget.style.background = '#DBEEDB'; }}
							onMouseOut={(e) => { e.currentTarget.style.background = '#E7F4E8'; }}
						>
							<Clock size={15} />
							<span>My Profile & Attendance</span>
						</button>

						{/* Sign Out Action */}
						<button
							type="button"
							onClick={() => logout()}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								padding: '9px 12px',
								background: '#FDF2F2',
								border: '1px solid #F8C8C8',
								color: '#B91C1C',
								borderRadius: '8px',
								fontSize: '12px',
								fontWeight: 600,
								cursor: 'pointer',
								transition: 'all 150ms ease'
							}}
							onMouseOver={(e) => { e.currentTarget.style.background = '#FDE8E8'; }}
							onMouseOut={(e) => { e.currentTarget.style.background = '#FDF2F2'; }}
						>
							<LogOut size={15} />
							<span>Sign Out</span>
						</button>
					</div>
				)}

				{/* Clickable Footer Bar */}
				<div
					className="sidebar__footer"
					onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
					title="Click for user details and logout"
					role="button"
					tabIndex={0}
					style={{
						cursor: 'pointer',
						userSelect: 'none',
						transition: 'background 150ms ease'
					}}
				>
					<span className="sidebar__footer-mark">
						{initials}
					</span>
					<span className="sidebar__footer-copy">
						<strong>{roleDisplay}</strong>
						<small>{unitCode}</small>
					</span>
				</div>
			</div>

			{/* My Profile & Attendance Modal */}
			<MyProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
			/>
		</aside>
	)
}
