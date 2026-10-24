import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../../store/authStore'
import { Input } from '../../../components/Input'
import { api } from '../../../lib/axios'
import { canAccessPath, getDefaultRouteForUser, getRolePreferredRedirectPath } from '../../../lib/access'
import { LogIn } from 'lucide-react'
import axios from 'axios'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const getRoleName = (role: unknown) => {
    if (!role) return 'Employee'
    if (typeof role === 'string') return role
    if (typeof role === 'object' && 'name' in role) {
        const roleName = (role as { name?: unknown }).name
        return typeof roleName === 'string' && roleName.trim() ? roleName : 'Employee'
    }
    return 'Employee'
}

export function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const login = useAuthStore((state) => state.login)
    const authDebug = import.meta.env.VITE_AUTH_DEBUG === 'true'

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await api.post('/auth/login', data)
            const loginData = response.data?.data
            const user = loginData?.user
            const accessToken = loginData?.accessToken || loginData?.token

            if (!user || !accessToken) {
                throw new Error('Login response did not include a user and access token.')
            }

            const sessionUser = {
                id: user.id,
                name: user.name || `${user.firstName} ${user.lastName || ''}`.trim(),
                email: user.email,
                role: getRoleName(user.role),
                permissions: Array.isArray(user.permissions) ? user.permissions : [],
                unitAccess: Array.isArray(user.unitAccess) ? user.unitAccess : [user.unitId].filter(Boolean),
                unitId: user.unitId,
                staffId: user.staffId || null,
                empId: user.empId || null,
                menuPrivilege: user.menuPrivilege || null
            }

            login(sessionUser, accessToken)

            if (authDebug) {
                console.debug('[AUTH][login-success]', {
                    hasToken: Boolean(accessToken),
                    userId: user.id,
                    email: user.email,
                    unitId: user.unitId || null,
                    permissions: Array.isArray(user.permissions) ? user.permissions.length : 0,
                    persistedStorage: localStorage.getItem('erp-auth-storage'),
                })
            }

            const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
            const defaultRoute = getDefaultRouteForUser(sessionUser)
            const preferredRequestedPath = requestedPath
                ? getRolePreferredRedirectPath(sessionUser, requestedPath) || requestedPath
                : null
            const commonDashboardPaths = new Set(['/dashboard', '/uec/dashboard', '/uhc/dashboard', '/ua/dashboard', '/ueo/dashboard'])
            const shouldRestoreRequestedPath = Boolean(
                preferredRequestedPath &&
                !commonDashboardPaths.has(preferredRequestedPath) &&
                !preferredRequestedPath.startsWith('/profile') &&
                !preferredRequestedPath.startsWith('/settings') &&
                canAccessPath(sessionUser, preferredRequestedPath)
            )
            const redirectTo = shouldRestoreRequestedPath && preferredRequestedPath
                ? preferredRequestedPath
                : defaultRoute
            navigate(redirectTo, { replace: true })
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Login request timed out. Check that the backend is running.' : 'Unable to reach the backend.')
                : error instanceof Error
                    ? error.message
                : 'Login failed. Please try again.'

            if (!axios.isAxiosError(error) || error.response?.status !== 401) {
                console.error('Login failed', error)
            }

            setError('root', { type: 'server', message })
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100">
                <div>
                    <div className="mx-auto h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center shadow-inner">
                        <LogIn className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Sign in to ERP
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Secure portal for staff & management
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            autoComplete="email"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password')}
                            error={errors.password?.message}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                role="checkbox"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="font-medium text-primary-600 hover:text-primary-500">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        {errors.root?.message && (
                            <p className="mb-3 text-sm font-medium text-red-600">
                                {errors.root.message}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Authenticating...' : 'Sign in securely'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
