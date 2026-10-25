import { createContext } from 'react'
import type { AuthSession } from '../../types/auth'

export type AuthContextValue = {
	session: AuthSession | null
	login: (email: string, password: string, provider?: 'erp' | 'crm') => Promise<AuthSession>
	logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)