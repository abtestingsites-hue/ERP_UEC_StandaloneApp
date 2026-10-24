import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { LogIn, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { UNCF_BRANDING } from '../../../assets/branding';

export function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            const payload = res.data?.data;
            const accessToken = payload?.accessToken ?? payload?.token ?? res.data?.accessToken ?? res.data?.token;
            const user = payload?.user ?? res.data?.user;

            if (accessToken && user) {
                setAuth(accessToken, user);
                navigate('/dashboard', { replace: true });
            } else {
                setError('Invalid login response from backend.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please check credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center relative">
            {/* Background Overlay Matching VisitorApp */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm pointer-events-none" />

            {/* Login Card */}
            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#072E33] p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100 dark:border-[#6DA5C0]/15">
                {/* Organization Brand Header Block */}
                <div className="text-center">
                    {/* Visitor-style Login/Entry Icon */}
                    <div className="mx-auto h-16 w-16 bg-[#0F969C]/10 dark:bg-[#0F969C]/20 rounded-2xl flex items-center justify-center shadow-inner text-[#0F969C] dark:text-[#D8EEF5]">
                        <LogIn className="h-8 w-8 text-[#0F969C] dark:text-[#D8EEF5]" />
                    </div>
                    
                    <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        {UNCF_BRANDING.shortName}
                    </h1>
                    <p className="mt-1 text-[11px] font-bold text-[#0F969C] dark:text-[#6DA5C0] uppercase tracking-wider">
                        {UNCF_BRANDING.tagline}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                        <h2 className="text-base font-bold text-gray-800 dark:text-[#D8EEF5]">
                            Sign In to UNCF Foundation
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#B8D9E8]">
                            Donations, Funding & Project Management Portal
                        </p>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
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
                                    placeholder="Raghav@uec.com"
                                    className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] pl-10 pr-4 py-2 text-sm font-medium text-[#05161A] shadow-xs outline-none transition-all placeholder:text-gray-400 hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:focus:bg-[#0B2A30]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">
                                Password
                            </label>
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
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#0F969C] hover:bg-[#0C7075] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F969C] dark:focus:ring-offset-[#072E33] transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Authenticating...</span>
                                </span>
                            ) : (
                                <span>Sign In to UNCF Foundation</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Subtext */}
                <div className="border-t border-gray-100 dark:border-white/10 pt-4 text-center text-xs text-gray-400 dark:text-[#6DA5C0]">
                    <p className="font-semibold">{UNCF_BRANDING.regNumber}</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
