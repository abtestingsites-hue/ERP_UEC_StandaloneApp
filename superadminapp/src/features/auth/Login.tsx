import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { canAccessDomain, getDefaultRouteForUser } from '../../utils/permissions'
import { PortalService } from '../portal/portal.service'
import { getPortalToken, getPortalAccount, setPortalSession } from '../portal/portalStorage'

type LoginLocationState = {
	from?: { pathname?: string }
}

export function Login() {
	const { session, login } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const [activeWorkspace, setActiveWorkspace] = useState<'auto' | 'erp' | 'crm'>('auto')

	if (session) return <Navigate to={session.user.mustChangePassword ? '/change-temporary-password' : getDefaultRouteForUser(session.user)} replace />
	if (getPortalToken() && getPortalAccount()) return <Navigate to="/portal/dashboard" replace />

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')
		setSubmitting(true)
		const cleanIdentifier = identifier.trim()
		const lowerId = cleanIdentifier.toLowerCase()

		// Provider-aware determination
		// 1. Explicitly chosen workspace or known CRM naming conventions
		const isCrmIntent = activeWorkspace === 'crm' || lowerId.includes('customercare') || lowerId.includes('crm') || lowerId.includes('agent')
		const isErpExplicit = activeWorkspace === 'erp'

		// Authenticate against CRM if requested or targeted
		if (isCrmIntent && !isErpExplicit) {
			try {
				const nextSession = await login(cleanIdentifier, password, 'crm')
				const requestedPath = (location.state as LoginLocationState | null)?.from?.pathname
				const defaultLanding = getDefaultRouteForUser(nextSession.user)
				const destination = (requestedPath?.startsWith('/') && canAccessDomain(requestedPath.replace(/^\//, '').split('/')[0] || '', nextSession.user))
					? requestedPath
					: defaultLanding
				navigate(destination, { replace: true })
				return
			} catch (crmErr: any) {
				if (activeWorkspace === 'crm') {
					setError(crmErr?.message || 'Invalid CRM credentials. Please verify your CRM agent email and password.')
					setSubmitting(false)
					return
				}
				// If in auto mode, let it fall through to check standard ERP
			}
		}

		// Authenticate against ERP Identity Provider
		try {
			const nextSession = await login(cleanIdentifier, password, 'erp')
			const requestedPath = (location.state as LoginLocationState | null)?.from?.pathname
			const defaultLanding = getDefaultRouteForUser(nextSession.user)
			const requestedDomain = requestedPath?.replace(/^\//, '').split('/')[0] || ''
			const isRequestedAllowed = Boolean(
				requestedPath?.startsWith('/') &&
				requestedPath !== '/dashboard' &&
				canAccessDomain(requestedDomain, nextSession.user)
			)
			const destination = nextSession.user.mustChangePassword
				? '/change-temporary-password'
				: (isRequestedAllowed && requestedPath ? requestedPath : defaultLanding)
			navigate(destination, { replace: true })
			return
		} catch (staffError: any) {
			// If user was not detected as CRM in auto mode, try CRM before failing
			if (activeWorkspace === 'auto' && !isCrmIntent) {
				try {
					const crmSession = await login(cleanIdentifier, password, 'crm')
					const defaultLanding = getDefaultRouteForUser(crmSession.user)
					navigate(defaultLanding, { replace: true })
					return
				} catch {
					// Fall through to error
				}
			}

			const isStaffEmail = cleanIdentifier.includes('@')
			const isPhoneNumber = /^[0-9+\-\s()]{7,15}$/.test(cleanIdentifier)

			// Second attempt: Family / Guardian Portal account (phone number or non-email username only)
			if (!isStaffEmail || isPhoneNumber) {
				try {
					const portalRes = await PortalService.login(cleanIdentifier, password)
					if (portalRes && portalRes.token && portalRes.account) {
						setPortalSession(portalRes.token, portalRes.account)
						navigate('/portal/dashboard', { replace: true })
						return
					}
				} catch {
					// Portal attempt failed
				}
			}

			setError(
				staffError instanceof Error && !staffError.message.includes('401') && !staffError.message.toLowerCase().includes('credential')
					? staffError.message
					: 'Invalid credentials. Please verify your staff email or registered phone and password.'
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form className="auth-form" onSubmit={handleSubmit}>
			{(location.state as { passwordChanged?: boolean } | null)?.passwordChanged && (
				<p className="auth-form__success" role="status">Password updated. Sign in with your new password.</p>
			)}

			{/* Workspace Provider Selector */}
			<div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
				<button
					type="button"
					onClick={() => setActiveWorkspace('auto')}
					style={{
						flex: 1,
						padding: '6px 8px',
						fontSize: '11px',
						fontWeight: 700,
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						background: activeWorkspace === 'auto' ? '#ffffff' : 'transparent',
						color: activeWorkspace === 'auto' ? '#0f172a' : '#64748b',
						boxShadow: activeWorkspace === 'auto' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
						transition: 'all 120ms ease'
					}}
				>
					Universal Sign In
				</button>
				<button
					type="button"
					onClick={() => setActiveWorkspace('erp')}
					style={{
						flex: 1,
						padding: '6px 8px',
						fontSize: '11px',
						fontWeight: 700,
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						background: activeWorkspace === 'erp' ? '#039A01' : 'transparent',
						color: activeWorkspace === 'erp' ? '#ffffff' : '#64748b',
						boxShadow: activeWorkspace === 'erp' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
						transition: 'all 120ms ease'
					}}
				>
					UNCF ERP
				</button>
				<button
					type="button"
					onClick={() => setActiveWorkspace('crm')}
					style={{
						flex: 1,
						padding: '6px 8px',
						fontSize: '11px',
						fontWeight: 700,
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						background: activeWorkspace === 'crm' ? '#ea580c' : 'transparent',
						color: activeWorkspace === 'crm' ? '#ffffff' : '#64748b',
						boxShadow: activeWorkspace === 'crm' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
						transition: 'all 120ms ease'
					}}
				>
					ElderCare CRM
				</button>
			</div>

			<label>
				<span>Username, Email or Mobile</span>
				<input
					autoComplete="username"
					type="text"
					placeholder="Enter staff email, username, or portal mobile"
					value={identifier}
					onChange={(event) => setIdentifier(event.target.value)}
					required
				/>
			</label>
			<label>
				<span>Password</span>
				<input
					autoComplete="current-password"
					type="password"
					placeholder="••••••••"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>
			</label>
			{error && <p className="auth-form__error" role="alert">{error}</p>}
			<button className="auth-form__submit" type="submit" disabled={submitting}>
				{submitting ? 'Authenticating…' : 'Sign In to Workspace'}
			</button>
			<p className="auth-form__note">
				Single sign-on automatically directs you to your authorized workspace: Super Admin Dashboard, CRM, Inhouse Care, Home Care, Finance, HR, Inventory, Ambulance, Security, or the Family Portal.
			</p>

			<div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e9e2', textAlign: 'center' }}>
				<Link to="/portal/login" style={{ color: '#028001', fontSize: '11px', fontWeight: '750', textDecoration: 'none' }}>
					Family & Guardian Direct Portal Sign In →
				</Link>
			</div>
		</form>
	)
}
