import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

export function SuperAdminLayout() {
	const [collapsed, setCollapsed] = useState(false)
	const [mobileOpen, setMobileOpen] = useState(false)

	function toggleSidebar() {
		if (window.matchMedia('(max-width: 760px)').matches) {
			setMobileOpen((open) => !open)
			return
		}

		setCollapsed((isCollapsed) => !isCollapsed)
	}

	return (
		<div
			className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}${mobileOpen ? ' app-shell--mobile-open' : ''}`}
		>
			<Sidebar
				collapsed={collapsed}
				mobileOpen={mobileOpen}
				onToggle={toggleSidebar}
				onNavigate={() => setMobileOpen(false)}
			/>
			{mobileOpen && (
				<button
					className="sidebar-scrim"
					type="button"
					aria-label="Close navigation"
					onClick={() => setMobileOpen(false)}
				/>
			)}
			<div className="app-main">
				<Topbar onToggleSidebar={toggleSidebar} />
				<main className="content-area">
					<div className="content-inner">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	)
}
