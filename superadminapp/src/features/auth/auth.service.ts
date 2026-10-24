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
	}

	return { user, accessToken }
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
