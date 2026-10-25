export type AuthRole = string | { id?: string; name?: string | null } | null

export type AuthUser = {
	id: string
	name: string
	email: string
	role: AuthRole
	permissions: string[]
	unitAccess: string[]
	mustChangePassword: boolean
	tenantId: string
	unitId: string | null
	staffId?: string | null
	unit?: { id: string; name: string; code?: string | null } | null
	provider?: 'erp' | 'crm' | 'portal'
}

export type AuthSession = {
	user: AuthUser
	accessToken: string
}

export type LoginResponse = {
	user: AuthUser
	accessToken: string
	refreshToken?: string
}
