import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { api } from '../../../lib/axios'
import { LogIn, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export function Login() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const response = await api.post('/auth/login', { email, password })
            const payload = response.data?.data
            const accessToken = payload?.accessToken ?? payload?.token ?? response.data?.accessToken ?? response.data?.token
            const user = payload?.user ?? response.data?.user

            if (!user || !accessToken) {
                throw new Error('Login response did not include user or token.')
            }

            const sessionUser = {
                id: user.id,
                name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                email: user.email,
                role: typeof user.role === 'string' ? user.role : user.role?.name || 'HR Manager',
                permissions: Array.isArray(user.permissions) ? user.permissions : [],
                unitAccess: Array.isArray(user.unitAccess) ? user.unitAccess : [user.unitId].filter(Boolean),
                unitId: user.unitId,
                staffId: user.staffId || null,
            }

            setAuth(accessToken, sessionUser)
            navigate('/hr/dashboard', { replace: true })
        } catch (err: any) {
            console.error('HRApp login error:', err)
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Invalid credentials or server error.'
                : err instanceof Error
                    ? err.message
                    : 'Login failed.'
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm pointer-events-none" />

            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#072E33] p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100 dark:border-[#6DA5C0]/15">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-[#0F969C]/10 dark:bg-[#0F969C]/20 rounded-2xl flex items-center justify-center shadow-inner text-[#0F969C] dark:text-[#D8EEF5]">
                        <LogIn className="h-8 w-8 text-[#0F969C] dark:text-[#D8EEF5]" />
                    </div>

                    <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        HR & Workforce Portal
                    </h2>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-[#B8D9E8]">
                        Sign in to manage employee operations & workforce
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#6DA5C0]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="uncf.hr@unisenth.local"
                                    className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-4 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:focus:bg-[#0B2A30]"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                                    Password
                                </label>
                                <a 
                                    href="/forgot-password" 
                                    className="text-xs font-semibold text-[#0F969C] hover:text-[#0C7075] dark:text-[#6DA5C0] dark:hover:text-[#D8EEF5]"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        navigate('/forgot-password')
                                    }}
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#6DA5C0]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-10 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:focus:bg-[#0B2A30]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition-colors hover:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#0F969C] hover:bg-[#0C7075] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] dark:focus:ring-offset-[#072E33] transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Authenticating...</span>
                                </span>
                            ) : (
                                <span>Sign In Securely</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

