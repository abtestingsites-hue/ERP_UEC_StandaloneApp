import type { PortalAccount } from './portal.types'

const PORTAL_TOKEN_KEY = 'uncf_portal_session_token'
const PORTAL_ACCOUNT_KEY = 'uncf_portal_account'

export function getPortalToken(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(PORTAL_TOKEN_KEY)
}

export function getPortalAccount(): PortalAccount | null {
	if (typeof window === 'undefined') return null
	const raw = localStorage.getItem(PORTAL_ACCOUNT_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as PortalAccount
	} catch {
		return null
	}
}

export function setPortalSession(token: string, account: PortalAccount): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(PORTAL_TOKEN_KEY, token)
	localStorage.setItem(PORTAL_ACCOUNT_KEY, JSON.stringify(account))
}

export function clearPortalSession(): void {
	if (typeof window === 'undefined') return
	localStorage.removeItem(PORTAL_TOKEN_KEY)
	localStorage.removeItem(PORTAL_ACCOUNT_KEY)
}

export interface ProvisionedPortalUser {
	admissionId: string
	patientId: string
	patientName: string
	guardianName: string
	username?: string
	mobile: string
	email?: string
	password: string
	room?: string
	bed?: string
	floor?: string
	unitId?: string
	unitName?: string
	createdAt: string
	status?: 'ACTIVE' | 'SUSPENDED'
}

const PROVISIONED_PORTAL_USERS_KEY = 'uncf_provisioned_portal_users'

export function saveProvisionedPortalUser(user: ProvisionedPortalUser): void {
	if (typeof window === 'undefined') return
	try {
		const existing = getProvisionedPortalUsers()
		const filtered = existing.filter(
			(u) =>
				u.mobile !== user.mobile &&
				(!user.username || u.username !== user.username) &&
				u.admissionId !== user.admissionId
		)
		filtered.unshift({ ...user, status: user.status || 'ACTIVE' })
		localStorage.setItem(PROVISIONED_PORTAL_USERS_KEY, JSON.stringify(filtered))
	} catch (e) {
		console.error('Failed to save provisioned portal user', e)
	}
}

export function getProvisionedPortalUsers(): ProvisionedPortalUser[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = localStorage.getItem(PROVISIONED_PORTAL_USERS_KEY)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}

export function findProvisionedPortalUser(identifier: string, password?: string): ProvisionedPortalUser | undefined {
	const users = getProvisionedPortalUsers()
	const cleanId = identifier.trim().toLowerCase()
	return users.find((u) => {
		if (u.status === 'SUSPENDED') return false
		const matchId =
			u.mobile.trim() === cleanId ||
			(u.username && u.username.trim().toLowerCase() === cleanId) ||
			(u.email && u.email.trim().toLowerCase() === cleanId)
		if (!matchId) return false
		if (password !== undefined) {
			return u.password === password
		}
		return true
	})
}

export function updateProvisionedPortalUserPin(identifier: string, newPin: string): boolean {
	const users = getProvisionedPortalUsers()
	const cleanId = identifier.trim().toLowerCase()
	let updated = false
	const next = users.map((u) => {
		const matchId =
			u.mobile.trim() === cleanId ||
			(u.username && u.username.trim().toLowerCase() === cleanId) ||
			(u.email && u.email.trim().toLowerCase() === cleanId)
		if (matchId) {
			updated = true
			return { ...u, password: newPin }
		}
		return u
	})
	if (updated && typeof window !== 'undefined') {
		localStorage.setItem(PROVISIONED_PORTAL_USERS_KEY, JSON.stringify(next))
	}
	return updated
}

export function toggleProvisionedPortalUserStatus(identifier: string): 'ACTIVE' | 'SUSPENDED' | null {
	const users = getProvisionedPortalUsers()
	const cleanId = identifier.trim().toLowerCase()
	let nextStatus: 'ACTIVE' | 'SUSPENDED' | null = null
	const next = users.map((u) => {
		const matchId =
			u.mobile.trim() === cleanId ||
			(u.username && u.username.trim().toLowerCase() === cleanId) ||
			(u.email && u.email.trim().toLowerCase() === cleanId)
		if (matchId) {
			const toggled: 'ACTIVE' | 'SUSPENDED' = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
			nextStatus = toggled
			return { ...u, status: toggled }
		}
		return u
	})
	if (nextStatus && typeof window !== 'undefined') {
		localStorage.setItem(PROVISIONED_PORTAL_USERS_KEY, JSON.stringify(next))
	}
	return nextStatus
}



