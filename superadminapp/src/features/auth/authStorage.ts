import type { AuthSession } from '../../types/auth'

export const AUTH_STORAGE_KEY = 'superadmin-erp-session'
export const AUTH_SESSION_EXPIRED_EVENT = 'superadmin:session-expired'

export function readAuthSession(): AuthSession | null {
	if (typeof window === 'undefined') return null

	try {
		const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
		if (!stored) return null

		const session = JSON.parse(stored) as AuthSession
		if (!session?.accessToken || !session.user?.id) {
			window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
			return null
		}

		return session
	} catch {
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
		return null
	}
}

export function writeAuthSession(session: AuthSession): void {
	window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
	if (typeof window !== 'undefined') {
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
	}
}