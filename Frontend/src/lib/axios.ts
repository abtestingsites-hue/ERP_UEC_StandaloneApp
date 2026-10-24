import axios from 'axios'
import { useAuthStore } from '../store/authStore'

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipAuthLogout?: boolean
    }

    export interface InternalAxiosRequestConfig {
        skipAuthLogout?: boolean
    }
}

const isAuthDebugEnabled = () => import.meta.env.VITE_AUTH_DEBUG === 'true'
let isRedirectingToLogin = false

const getApiBaseUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_URL || "https://backend-erp-jp2x.onrender.com/api/v1"

    if (typeof window === 'undefined') {
        return configuredUrl
    }

    const hasConfiguredUrl = Boolean(import.meta.env.VITE_API_URL)

    try {
        const appUrl = new URL(window.location.origin)
        if (!hasConfiguredUrl && ['localhost', '127.0.0.1'].includes(appUrl.hostname)) {
            return "https://backend-erp-jp2x.onrender.com/api/v1"
        }

        const apiUrl = new URL(configuredUrl)

        if (apiUrl.port === '3000' && appUrl.port === '3000') {
            apiUrl.port = '4000'
            return apiUrl.toString().replace(/\/$/, '')
        }
    } catch {
        return configuredUrl
    }

    return configuredUrl
}

export const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor: Attach token
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData && config.headers) {
            delete config.headers['Content-Type']
        }

        const { token, activeUnitId, user } = useAuthStore.getState()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        const explicitUnitId = config.headers?.['x-unit-id'] || config.headers?.['X-Unit-Id']
        const resolvedUnitId = explicitUnitId || activeUnitId || user?.unitId
        if (resolvedUnitId && !explicitUnitId) {
            config.headers['x-unit-id'] = resolvedUnitId
        }

        if (isAuthDebugEnabled()) {
            console.debug('[AUTH][request]', {
                url: config.url,
                hasToken: Boolean(token),
                hasUser: Boolean(user),
                activeUnitId: resolvedUnitId || null,
                explicitUnitId: explicitUnitId || null,
            })
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor: Handle global errors (401, etc.)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error.config?.url || '')
        const isLoginRequest = requestUrl.includes('/auth/login')
        const status = error.response?.status
        const hadAuthHeader = Boolean(error.config?.headers?.Authorization)
        const shouldLogout = status === 401 && !isLoginRequest && !error.config?.skipAuthLogout && hadAuthHeader

        if (isAuthDebugEnabled() && status === 401) {
            console.debug('[AUTH][401]', {
                url: requestUrl,
                hadAuthHeader,
                skipAuthLogout: Boolean(error.config?.skipAuthLogout),
                willLogout: shouldLogout,
                message: error.response?.data?.message,
            })
        }

        if (shouldLogout && !isRedirectingToLogin) {
            isRedirectingToLogin = true
            useAuthStore.getState().logout()
            if (window.location.pathname !== '/auth/login') {
                window.location.assign('/auth/login')
            }
        }

        if (status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
            if (window.location.pathname !== '/auth/change-password') {
                window.location.assign('/auth/change-password')
            }
        }

        return Promise.reject(error)
    }
)
