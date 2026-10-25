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

	if (session) return <Navigate to={session.user.mustChangePassword ? '/change-temporary-password' : getDefaultRouteForUser(session.user)} replace />
	if (getPortalToken() && getPortalAccount()) return <Navigate to="/portal/dashboard" replace />

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')
		setSubmitting(true)
		const cleanIdentifier = identifier.trim()
		const lowerId = cleanIdentifier.toLowerCase()
		const isStaffEmail = cleanIdentifier.includes('@')
		const isPhoneNumber = /^[0-9+\-\s()]{7,15}$/.test(cleanIdentifier)

		// Invisible provider determination:
		// Known CRM agent patterns route to CRM identity store first
		const isCrmPattern = lowerId.includes('customercare') || lowerId.includes('crm') || lowerId.includes('agent')

		if (isCrmPattern) {
			try {
				const nextSession = await login(cleanIdentifier, password, 'crm')
				const requestedPath = (location.state as LoginLocationState | null)?.from?.pathname
				const defaultLanding = getDefaultRouteForUser(nextSession.user)
				const destination = (requestedPath?.startsWith('/') && canAccessDomain(requestedPath.replace(/^\//, '').split('/')[0] || '', nextSession.user))
					? requestedPath
					: defaultLanding
				navigate(destination, { replace: true })
				return
			} catch {
				// If CRM authentication fails, try ERP before giving final error
				try {
					const erpSession = await login(cleanIdentifier, password, 'erp')
					const defaultLanding = getDefaultRouteForUser(erpSession.user)
					navigate(defaultLanding, { replace: true })
					return
				} catch {
					setError('Invalid credentials. Please verify your staff email and password.')
					setSubmitting(false)
					return
				}
			}
		}

		// Standard staff login (ERP first)
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
			// If ERP login failed, verify if credentials match CRM before concluding
			if (isStaffEmail) {
				try {
					const crmSession = await login(cleanIdentifier, password, 'crm')
					const defaultLanding = getDefaultRouteForUser(crmSession.user)
					navigate(defaultLanding, { replace: true })
					return
				} catch {
					// Fall through to safe error
				}
			}

			// Third attempt: Family / Guardian Portal account (phone number or non-email username only)
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
