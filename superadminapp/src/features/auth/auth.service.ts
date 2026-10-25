import { api } from '../../services/api'
import type { AuthUser, LoginResponse } from '../../types/auth'

type LoginEnvelope = {
	data?: {
		user?: Partial<AuthUser> & { firstName?: string; lastName?: string; token?: string }
		accessToken?: string
		refreshToken?: string
		token?: string
	}
	message?: string
}

export async function loginWithCredentials(email: string, password: string): Promise<LoginResponse> {
	const response = await api.post<LoginEnvelope>('/auth/login', { email, password })
	const payload = response.data?.data
	const sourceUser = payload?.user
	const accessToken = payload?.accessToken || sourceUser?.token || payload?.token

	if (!sourceUser?.id || !accessToken) {
		throw new Error('The ERP login response did not include a user and access token.')
	}

	const user: AuthUser = {
		id: sourceUser.id,
		name: sourceUser.name || [sourceUser.firstName, sourceUser.lastName].filter(Boolean).join(' ').trim() || sourceUser.email || 'ERP user',
		email: sourceUser.email || '',
		role: sourceUser.role || null,
		permissions: Array.isArray(sourceUser.permissions) ? sourceUser.permissions : [],
		unitAccess: Array.isArray(sourceUser.unitAccess) ? sourceUser.unitAccess : [],
		mustChangePassword: sourceUser.mustChangePassword === true,
		tenantId: sourceUser.tenantId || '',
		unitId: sourceUser.unitId || null,
		staffId: (sourceUser as { staffId?: string | null })?.staffId || null,
		unit: sourceUser.unit || null,
		provider: 'erp',
	}

	return { user, accessToken }
}

export async function loginWithCrmCredentials(email: string, password: string): Promise<LoginResponse> {
	const crmHost = 'https://crm-uec-backend.onrender.com'
	const response = await fetch(`${crmHost}/api/v1/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})

	const data = await response.json()
	if (!response.ok || !data.accessToken) {
		throw new Error(data.message || 'Invalid CRM credentials')
	}

	const session = data.session || {}
	const accessToken = data.accessToken
	const refreshToken = data.refreshToken

	if (typeof window !== 'undefined') {
		localStorage.setItem('paramantra_access_token', accessToken)
		if (refreshToken) localStorage.setItem('paramantra_refresh_token', refreshToken)
		localStorage.setItem('crm_token', accessToken)
		const userObj = {
			id: session.userId || session.id || 'crm-agent',
			email: session.email || email,
			name: session.name || 'CRM Agent',
			role: session.role || 'AGENT',
			agentId: session.agentId || session.userId || session.id,
			department: session.department || 'CRM',
		}
		localStorage.setItem('paramantra_user', JSON.stringify(userObj))
		localStorage.setItem('crm_user', JSON.stringify(userObj))
	}

	const user: AuthUser = {
		id: session.userId || session.id || 'crm-agent',
		name: session.name || 'CRM Agent',
		email: session.email || email,
		role: session.role || 'AGENT',
		permissions: ['crm:access', 'leads:read', 'telephony:access'],
		unitAccess: [],
		mustChangePassword: false,
		tenantId: session.orgId || '',
		unitId: null,
		staffId: session.agentId || null,
		unit: null,
		provider: 'crm',
	}

	return { user, accessToken, refreshToken }
}

export async function changeTemporaryPassword(
	currentPassword: string,
	newPassword: string,
	confirmPassword: string,
): Promise<void> {
	await api.post('/auth/change-temporary-password', {
		currentPassword,
		newPassword,
		confirmPassword,
	})
}
