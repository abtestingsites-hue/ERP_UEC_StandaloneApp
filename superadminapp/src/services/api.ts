import axios from 'axios'
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession, readAuthSession } from '../features/auth/authStorage'

export function getApiBaseUrl(): string {
	if (import.meta.env?.VITE_API_URL) {
		return import.meta.env.VITE_API_URL
	}
	if (typeof window !== 'undefined') {
		const host = window.location.hostname
		if (host.includes('render.com') || host !== 'localhost' && host !== '127.0.0.1') {
			return 'https://backend-erp-jp2x.onrender.com/api/v1'
		}
	}
	return 'http://127.0.0.1:4000/api/v1'
}

const api = axios.create({
	baseURL: getApiBaseUrl(),
	timeout: 15000,
	headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
	const requestUrl = String(config.url || '')
	const isAuthRequest = requestUrl.includes('/auth/')

	// Do not attach session tokens, unit context, or custom domain headers to authentication requests
	if (isAuthRequest) {
		return config
	}

	const session = readAuthSession()
	if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`

	const explicitUnitId = config.headers['x-unit-id'] || config.headers['X-Unit-Id']
	if (explicitUnitId) {
		config.headers['x-unit-id'] = explicitUnitId
	} else if (typeof window !== 'undefined') {
		const storedUnit = window.sessionStorage.getItem('superadmin-active-unit')
		if (storedUnit === 'ALL_UNITS' || !storedUnit) {
			// Explicit All Units mode or root superadmin global view: query facility-wide across all units
			delete config.headers['x-unit-id']
			delete config.headers['X-Unit-Id']
			if (config.method?.toUpperCase() === 'GET') {
				config.params = config.params || {}
				config.params.allUnits = 'true'
				if (!config.params.scope) {
					config.params.scope = 'all'
				}
			}
		} else if (storedUnit) {
			config.headers['x-unit-id'] = storedUnit
		} else if (session?.user.unitId) {
			config.headers['x-unit-id'] = session.user.unitId
		}
	} else if (session?.user.unitId) {
		config.headers['x-unit-id'] = session.user.unitId
	}

	// Attach active inventory domain (Medical vs Food & Ration) for inventory, product, stock, and procurement requests
	if (typeof window !== 'undefined' && (requestUrl.includes('/inventory') || requestUrl.includes('/product') || requestUrl.includes('/stock') || requestUrl.includes('/purchase-orders') || requestUrl.includes('/goods-receipts'))) {
		const storedDomain = window.sessionStorage.getItem('superadmin-inventory-domain') || 'medical'
		config.params = config.params || {}
		if (!config.params.domain && !config.params.inventoryScope) {
			config.params.domain = storedDomain
		}
	}

	return config
})

api.interceptors.response.use(
	(response) => response,
	(error) => {
		const requestUrl = String(error.config?.url || '')
		const isLoginRequest = requestUrl.includes('/auth/login')
		const hasAuthHeader = Boolean(error.config?.headers?.Authorization)
		const shouldExpireSession = error.response?.status === 401 && !isLoginRequest && hasAuthHeader

		if (shouldExpireSession) {
			clearAuthSession()
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
			}
		}

		return Promise.reject(error)
	},
)

export { api }
