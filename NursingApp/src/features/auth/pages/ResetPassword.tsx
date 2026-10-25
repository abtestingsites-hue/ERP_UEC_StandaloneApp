import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../../lib/axios'
import { Lock, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Invalid or missing reset token.')
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Passwords do not match.')
            return
        }

        setStatus('loading')
        setMessage('')

        try {
            await api.post('/auth/reset-password', { token, newPassword: password })
            setStatus('success')
            setMessage('Your password has been successfully reset.')
        } catch (err: any) {
            console.error('Reset password error:', err)
            setStatus('error')
            setMessage(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || err.response?.data?.error || 'Failed to reset password.'
                    : 'Failed to reset password.'
            )
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm pointer-events-none" />

            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#072E33] p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100 dark:border-[#6DA5C0]/15">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Reset Password
                    </h2>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-[#B8D9E8]">
                        Create a new secure password for your account.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-900/20">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                            <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Password Reset Successful</h3>
                            <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#0F969C] hover:bg-[#0C7075] transition-colors shadow-xs"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#6DA5C0]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        disabled={!token || status === 'loading'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-10 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 disabled:opacity-50 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition-colors hover:text-gray-800 focus:outline-none dark:text-gray-400 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#6DA5C0]" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        disabled={!token || status === 'loading'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-10 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 disabled:opacity-50 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition-colors hover:text-gray-800 focus:outline-none dark:text-gray-400 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!token || status === 'loading'}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#0F969C] hover:bg-[#0C7075] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] dark:focus:ring-offset-[#072E33] transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Resetting...</span>
                                </span>
                            ) : (
                                <span>Reset Password</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
