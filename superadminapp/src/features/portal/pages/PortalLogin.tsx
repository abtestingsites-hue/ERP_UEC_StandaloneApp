import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
	ShieldCheck,
	Lock,
	Phone,
	ArrowRight,
	AlertCircle,
} from 'lucide-react'
import { PortalService } from '../portal.service'
import { setPortalSession, getPortalToken } from '../portalStorage'
import '../portal.css'

export function PortalLogin() {
	const navigate = useNavigate()
	const [mobile, setMobile] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		// If already logged in, navigate straight to portal dashboard
		if (getPortalToken()) {
			navigate('/portal/dashboard', { replace: true })
		}
	}, [navigate])

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!mobile.trim()) {
			setError('Please enter your registered mobile number, username, or email')
			return
		}
		if (!password.trim()) {
			setError('Please enter your portal password / access PIN')
			return
		}

		setLoading(true)
		setError('')

		try {
			const { token, account } = await PortalService.login(mobile.trim(), password.trim())
			setPortalSession(token, account)
			navigate('/portal/dashboard', { replace: true })
		} catch (err: any) {
			setError(err?.message || 'Login failed. Please check credentials or contact facility administration.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="portal-root" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '32px 16px' }}>
			<div style={{ maxWidth: '440px', width: '100%' }}>
				{/* Brand Mark matching Staff Login */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
					<span style={{ background: '#ffffff', padding: '4px', border: '1px solid #e1e6e1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}>
						<img src="/logo.png" alt="UNCF Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
					</span>
					<div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#039A01',
							fontSize: '18px',
							fontWeight: 900,
							letterSpacing: '2px',
							textTransform: 'uppercase'
						}}>
							UNIVERSAL
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#202020',
							fontSize: '9px',
							fontWeight: 700,
							letterSpacing: '0.8px',
							textTransform: 'uppercase',
							whiteSpace: 'nowrap'
						}}>
							NATURE CARE & CURE FOUNDATION
						</span>
						<span style={{
							fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
							color: '#633B32',
							fontSize: '7.5px',
							fontWeight: 600,
							letterSpacing: '0.6px',
							textTransform: 'uppercase',
							whiteSpace: 'nowrap'
						}}>
							(UNCF TRUST - SINCE 2015)
						</span>
					</div>
				</div>

				<div style={{ textAlign: 'center', marginBottom: '20px' }}>
					<h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
						Family & Guardian Portal
					</h1>
					<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
						Real-time access to resident health vitals, daily care, medications, and billing.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
					<form className="space-y-4" onSubmit={handleLogin}>
						{error && (
							<div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 flex items-start gap-2">
								<AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
								<span>{error}</span>
							</div>
						)}

						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Guardian Mobile, Username or Email
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
									<Phone className="h-4 w-4" />
								</div>
								<input
									type="text"
									required
									placeholder="e.g. 9867879650 or guardian_username"
									value={mobile}
									onChange={(e) => setMobile(e.target.value)}
									className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Portal Password / Access PIN
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
									<Lock className="h-4 w-4" />
								</div>
								<input
									type="password"
									required
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:opacity-50"
						>
							{loading ? (
								'Verifying resident records…'
							) : (
								<>
									Access Resident Portal <ArrowRight className="h-4 w-4" />
								</>
							)}
						</button>
					</form>

					{/* Security trust badge */}
					<div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 border-t border-slate-100 pt-4">
						<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
						<span>256-Bit Encrypted Healthcare Records</span>
					</div>

					{/* Switch to Staff ERP login */}
					<div className="mt-4 text-center">
						<Link
							to="/login"
							className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
						>
							Looking for Staff & Admin Login? <span className="underline">Sign in here →</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
