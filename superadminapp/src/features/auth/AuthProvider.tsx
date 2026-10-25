import { useEffect, useState, type ReactNode } from 'react'
import type { AuthSession } from '../../types/auth'
import { loginWithCredentials, loginWithCrmCredentials } from './auth.service'
import { AuthContext } from './auth.context'
import {
	AUTH_SESSION_EXPIRED_EVENT,
	clearAuthSession,
	readAuthSession,
	writeAuthSession,
} from './authStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<AuthSession | null>(() => readAuthSession())

	useEffect(() => {
		const expireSession = () => setSession(null)
		window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession)
		return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession)
	}, [])

	async function login(email: string, password: string, provider: 'erp' | 'crm' = 'erp'): Promise<AuthSession> {
		const nextSession = provider === 'crm' 
			? await loginWithCrmCredentials(email, password)
			: await loginWithCredentials(email, password)
		writeAuthSession(nextSession)
		setSession(nextSession)
		return nextSession
	}

	function logout() {
		clearAuthSession()
		setSession(null)
	}

	return (
		<AuthContext.Provider value={{ session, login, logout }}>
			{children}
		</AuthContext.Provider>
	)
}