import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { canAccessDomain, getDefaultRouteForUser } from '../utils/permissions'
import { domainModules } from '../services/moduleRegistry'

interface DomainGuardProps {
	domainId: string
	children: ReactNode
}

export function DomainGuard({ domainId, children }: DomainGuardProps) {
	const { session } = useAuth()
	const user = session?.user

	if (!canAccessDomain(domainId, user)) {
		const domain = domainModules.find((d) => d.id === domainId)
		const domainTitle = domain?.label || domainId
		const homeRoute = getDefaultRouteForUser(user)

		return (
			<div className="not-found" style={{ maxWidth: 640, margin: '4rem auto', textAlign: 'center', padding: '2rem 1.5rem' }}>
				<span className="section-kicker" style={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em' }}>
					ACCESS RESTRICTED
				</span>
				<h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0', color: '#0f172a' }}>
					Access to {domainTitle} is restricted
				</h1>
				<p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
					Your current role and assigned permissions do not permit access to this domain workspace.
					Unauthorized cross-domain access is strictly prevented by ERP security policy.
				</p>
				<Link
					to={homeRoute}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '0.625rem 1.25rem',
						borderRadius: '0.5rem',
						backgroundColor: '#2563eb',
						color: '#ffffff',
						fontWeight: 600,
						fontSize: '0.875rem',
						textDecoration: 'none',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
					}}
				>
					Return to your authorized workspace
				</Link>
			</div>
		)
	}

	return <>{children}</>
}
