import { Activity } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
	return (
		<main className="auth-shell">
			<div className="auth-shell__grid" aria-hidden="true" />
			<section className="auth-panel">
				<div className="auth-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span className="auth-brand__mark" style={{ background: '#ffffff', padding: 4, width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
						<img src="/logo.png" alt="UNCF Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
					</span>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.15 }}>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#00c832',
							fontSize: '20px',
							fontWeight: 900,
							letterSpacing: '2.5px',
							lineHeight: 1.1,
							textTransform: 'uppercase'
						}}>
							UNIVERSAL
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#00c832',
							fontSize: '10px',
							fontWeight: 700,
							letterSpacing: '1px',
							lineHeight: 1.15,
							textTransform: 'uppercase',
							whiteSpace: 'nowrap'
						}}>
							NATURE CARE & CURE FOUNDATION
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#00b02a',
							fontSize: '8.5px',
							fontWeight: 600,
							letterSpacing: '0.8px',
							lineHeight: 1.1,
							textTransform: 'uppercase',
							whiteSpace: 'nowrap',
							opacity: 0.95
						}}>
							(UNCF TRUST - SINCE 2015)
						</span>
					</div>
				</div>
				<div className="auth-panel__intro">
					<span className="section-kicker">UNIFIED ENTERPRISE GATEWAY</span>
					<h1>Sign in to UNCF ERP</h1>
					<p>Sign in with your credentials to access your authorized domain, workspace, or portal.</p>
				</div>
				<Outlet />
				<div className="auth-panel__footnote">
					<Activity size={14} />
					<span>Universal Role-Based Routing & Session Gateway</span>
				</div>
			</section>
		</main>
	)
}
