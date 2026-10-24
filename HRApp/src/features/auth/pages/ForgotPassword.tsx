import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../lib/axios'
import { Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

export function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setMessage('')

        try {
            await api.post('/auth/forgot-password', { email })
            setStatus('success')
            setMessage('Password reset instructions have been sent.')
        } catch (err: any) {
            console.error('Forgot password error:', err)
            setStatus('error')
            setMessage(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || err.response?.data?.error || 'Failed to send reset link.'
                    : 'Failed to send reset link.'
            )
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm pointer-events-none" />

            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#072E33] p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100 dark:border-[#6DA5C0]/15">
                <div>
                    <button 
                        onClick={() => navigate('/login')}
                        className="mb-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-[#8FB7C8] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        Back to Login
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Forgot Password
                    </h2>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-[#B8D9E8]">
                        Enter your registered email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/50 dark:bg-green-900/20">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Check your email</h3>
                        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
                    </div>
                ) : (
                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>{message}</span>
                            </div>
                        )}

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
                                    placeholder="Enter your email"
                                    className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-4 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:focus:bg-[#0B2A30]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#0F969C] hover:bg-[#0C7075] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] dark:focus:ring-offset-[#072E33] transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Sending...</span>
                                </span>
                            ) : (
                                <span>Send Reset Link</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
