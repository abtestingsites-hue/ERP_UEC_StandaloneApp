import type { AuthSession } from '../../types/auth'

export const AUTH_STORAGE_KEY = 'superadmin-erp-session'
export const AUTH_SESSION_EXPIRED_EVENT = 'superadmin:session-expired'

export function readAuthSession(): AuthSession | null {
	if (typeof window === 'undefined') return null

	try {
		let stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
		if (!stored) {
			stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
			if (stored) {
				window.sessionStorage.setItem(AUTH_STORAGE_KEY, stored)
			}
		}
		if (!stored) return null

		const session = JSON.parse(stored) as AuthSession
		if (!session?.accessToken || !session.user?.id) {
			window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
			window.localStorage.removeItem(AUTH_STORAGE_KEY)
			return null
		}

		return session
	} catch {
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
		window.localStorage.removeItem(AUTH_STORAGE_KEY)
		return null
	}
}

export function writeAuthSession(session: AuthSession): void {
	if (typeof window !== 'undefined') {
		const val = JSON.stringify(session)
		window.sessionStorage.setItem(AUTH_STORAGE_KEY, val)
		window.localStorage.setItem(AUTH_STORAGE_KEY, val)
	}
}

export function clearAuthSession(): void {
	if (typeof window !== 'undefined') {
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
		window.localStorage.removeItem(AUTH_STORAGE_KEY)
		localStorage.removeItem('paramantra_access_token')
		localStorage.removeItem('paramantra_refresh_token')
		localStorage.removeItem('paramantra_user')
		localStorage.removeItem('crm_token')
		localStorage.removeItem('crm_user')
	}
}