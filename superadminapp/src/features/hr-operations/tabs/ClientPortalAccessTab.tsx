import React, { useState, useEffect, useMemo } from 'react'
import {
	ShieldCheck,
	Search,
	KeyRound,
	UserCheck,
	Lock,
	CheckCircle2,
	AlertCircle,
	Copy,
	Sparkles,
	Building2,
	Phone,
	User,
	X,
	Eye,
	Power,
	RefreshCw,
} from 'lucide-react'
import {
	getProvisionedPortalUsers,
	updateProvisionedPortalUserPin,
	toggleProvisionedPortalUserStatus,
	type ProvisionedPortalUser,
} from '../../portal/portalStorage'
import { PortalService } from '../../portal/portal.service'
import type { AdmittedResidentListItem } from '../../portal/portal.types'

interface ClientPortalAccessTabProps {
	activeUnitId?: string | null
	activeUnitName?: string
}

export function ClientPortalAccessTab({
	activeUnitId,
	activeUnitName,
}: ClientPortalAccessTabProps) {
	const [provisionedUsers, setProvisionedUsers] = useState<ProvisionedPortalUser[]>([])
	const [admittedResidents, setAdmittedResidents] = useState<AdmittedResidentListItem[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL')

	// Modals & Action States
	const [selectedUserForView, setSelectedUserForView] = useState<ProvisionedPortalUser | null>(null)
	const [selectedUserForReset, setSelectedUserForReset] = useState<ProvisionedPortalUser | null>(null)
	const [newPinValue, setNewPinValue] = useState('')
	const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
	const [copiedCredentials, setCopiedCredentials] = useState(false)

	const loadAccounts = async () => {
		setLoading(true)
		try {
			// 1. Load locally provisioned portal accounts
			const localUsers = getProvisionedPortalUsers()
			setProvisionedUsers(localUsers)

			// 2. Load live admitted residents from backend
			const liveResidents = await PortalService.getAdmittedResidents()
			setAdmittedResidents(liveResidents || [])
		} catch (err) {
			console.error('Failed to load portal accounts', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAccounts()
	}, [])

	useEffect(() => {
		if (feedbackMessage) {
			const timer = setTimeout(() => setFeedbackMessage(null), 4000)
			return () => clearTimeout(timer)
		}
	}, [feedbackMessage])

	// Merge provisioned accounts and live admitted residents without duplication
	const unifiedAccounts = useMemo(() => {
		const list: ProvisionedPortalUser[] = [...provisionedUsers]
		const existingMobiles = new Set(provisionedUsers.map((u) => u.mobile.trim()))

		// Add live residents who have guardian contact details
		for (const resident of admittedResidents) {
			if (resident.guardianMobile && !existingMobiles.has(resident.guardianMobile.trim())) {
				list.push({
					admissionId: resident.admissionId,
					patientId: resident.patientId,
					patientName: resident.patientName,
					guardianName: resident.guardianName || 'Authorized Family Representative',
					username: resident.guardianMobile,
					mobile: resident.guardianMobile,
					email: resident.guardianEmail || undefined,
					password: '••••••••',
					room: resident.room,
					bed: resident.bed,
					floor: resident.floor,
					unitName: activeUnitName || 'UNCF Facility',
					createdAt: resident.admittedAt || new Date().toISOString(),
					status: 'ACTIVE',
				})
			}
		}

		return list
	}, [provisionedUsers, admittedResidents, activeUnitName])

	// Filter by search & status
	const filteredAccounts = useMemo(() => {
		return unifiedAccounts.filter((account) => {
			if (statusFilter !== 'ALL') {
				const currentStatus = account.status || 'ACTIVE'
				if (currentStatus !== statusFilter) return false
			}

			if (!searchTerm.trim()) return true
			const q = searchTerm.toLowerCase()
			return (
				account.patientName.toLowerCase().includes(q) ||
				account.guardianName.toLowerCase().includes(q) ||
				account.mobile.includes(q) ||
				(account.username && account.username.toLowerCase().includes(q)) ||
				(account.room && account.room.toLowerCase().includes(q))
			)
		})
	}, [unifiedAccounts, searchTerm, statusFilter])

	// Handle PIN reset
	const handleConfirmResetPin = (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedUserForReset || !newPinValue.trim()) return

		const success = updateProvisionedPortalUserPin(selectedUserForReset.mobile, newPinValue.trim())
		if (success) {
			setFeedbackMessage({
				text: `Access PIN updated successfully for ${selectedUserForReset.guardianName} (${selectedUserForReset.mobile}).`,
				type: 'success',
			})
			setSelectedUserForReset(null)
			setNewPinValue('')
			loadAccounts()
		} else {
			setFeedbackMessage({
				text: 'Unable to update PIN. Account may be managed at the central network level.',
				type: 'error',
			})
		}
	}

	// Handle Status Toggle (Suspend / Reactivate)
	const handleToggleStatus = (account: ProvisionedPortalUser) => {
		const next = toggleProvisionedPortalUserStatus(account.mobile)
		if (next) {
			setFeedbackMessage({
				text: `Portal access for ${account.guardianName} is now ${next}.`,
				type: 'success',
			})
			loadAccounts()
		}
	}

	const totalActive = unifiedAccounts.filter((a) => (a.status || 'ACTIVE') === 'ACTIVE').length
	const totalSuspended = unifiedAccounts.filter((a) => a.status === 'SUSPENDED').length

	return (
		<div className="space-y-6">
			{/* Feedback Notification */}
			{feedbackMessage && (
				<div
					className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
						feedbackMessage.type === 'success'
							? 'border-emerald-200 bg-emerald-50 text-emerald-900'
							: 'border-red-200 bg-red-50 text-red-900'
					}`}
				>
					{feedbackMessage.type === 'success' ? (
						<CheckCircle2 className="h-5 w-5 text-emerald-600" />
					) : (
						<AlertCircle className="h-5 w-5 text-red-600" />
					)}
					<span>{feedbackMessage.text}</span>
				</div>
			)}

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
							Total Portal Accounts
						</span>
						<div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
							<ShieldCheck className="h-5 w-5" />
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-black text-slate-900">{unifiedAccounts.length}</span>
						<span className="text-xs font-medium text-slate-500">Registered families</span>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
							Active Login Access
						</span>
						<div className="rounded-lg bg-green-50 p-2 text-green-700">
							<UserCheck className="h-5 w-5" />
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-black text-emerald-700">{totalActive}</span>
						<span className="text-xs font-semibold text-emerald-600">Authorized for portal</span>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
							Suspended Accounts
						</span>
						<div className="rounded-lg bg-amber-50 p-2 text-amber-700">
							<Lock className="h-5 w-5" />
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-black text-slate-900">{totalSuspended}</span>
						<span className="text-xs font-medium text-slate-500">Temporary holds</span>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
							Operating Scope
						</span>
						<div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
							<Building2 className="h-5 w-5" />
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-sm font-bold text-slate-900 truncate">
							{activeUnitName || 'Facility Wide'}
						</span>
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search resident, guardian name, mobile number, username, or room..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
						/>
					</div>

					<div className="flex items-center gap-2">
						<div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
							<button
								type="button"
								onClick={() => setStatusFilter('ALL')}
								className={`rounded-lg px-3 py-1 transition ${
									statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
								}`}
							>
								All ({unifiedAccounts.length})
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter('ACTIVE')}
								className={`rounded-lg px-3 py-1 transition ${
									statusFilter === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
								}`}
							>
								Active ({totalActive})
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter('SUSPENDED')}
								className={`rounded-lg px-3 py-1 transition ${
									statusFilter === 'SUSPENDED' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
								}`}
							>
								Suspended ({totalSuspended})
							</button>
						</div>

						<button
							type="button"
							onClick={loadAccounts}
							title="Refresh directory"
							className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						</button>
					</div>
				</div>
			</div>

			{/* Directory Table */}
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
				<div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
					<span className="text-xs font-bold text-slate-700">
						Client Portal Credentials Register ({filteredAccounts.length})
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead>
							<tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
								<th className="px-5 py-3.5">Client / Resident</th>
								<th className="px-5 py-3.5">Guardian / Account Holder</th>
								<th className="px-5 py-3.5">Login Username / Mobile</th>
								<th className="px-5 py-3.5">Operating Facility</th>
								<th className="px-5 py-3.5">Access Date</th>
								<th className="px-5 py-3.5">Status</th>
								<th className="px-5 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredAccounts.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-12 text-center text-slate-400">
										<ShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
										<p className="font-semibold text-slate-600">No client portal accounts match your query.</p>
										<p className="text-[11px] text-slate-400">
											When in-house admissions are granted portal access, they will appear here automatically.
										</p>
									</td>
								</tr>
							) : (
								filteredAccounts.map((account) => {
									const isSuspended = account.status === 'SUSPENDED'
									return (
										<tr key={`${account.admissionId}-${account.mobile}`} className="hover:bg-slate-50/70 transition">
											<td className="px-5 py-3.5">
												<div className="font-bold text-slate-900">{account.patientName}</div>
												<div className="text-[11px] text-slate-500">
													Room {account.room || '-'} · Bed {account.bed || '-'}
												</div>
											</td>
											<td className="px-5 py-3.5">
												<div className="font-semibold text-slate-800 flex items-center gap-1.5">
													<User className="h-3.5 w-3.5 text-slate-400" />
													<span>{account.guardianName}</span>
												</div>
												{account.email && (
													<div className="text-[11px] text-slate-400">{account.email}</div>
												)}
											</td>
											<td className="px-5 py-3.5">
												<div className="font-mono font-bold text-slate-900 flex items-center gap-1">
													<Phone className="h-3 w-3 text-emerald-600" />
													<span>{account.username || account.mobile}</span>
												</div>
												{account.username && account.username !== account.mobile && (
													<div className="text-[11px] text-slate-400 font-mono">
														Phone: {account.mobile}
													</div>
												)}
											</td>
											<td className="px-5 py-3.5 text-slate-600 font-medium">
												{account.unitName || 'UNCF Health Care'}
											</td>
											<td className="px-5 py-3.5 text-slate-500">
												{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'Active'}
											</td>
											<td className="px-5 py-3.5">
												{isSuspended ? (
													<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
														<Lock className="h-2.5 w-2.5" />
														Suspended
													</span>
												) : (
													<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
														<CheckCircle2 className="h-2.5 w-2.5" />
														Active
													</span>
												)}
											</td>
											<td className="px-5 py-3.5 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onClick={() => setSelectedUserForView(account)}
														title="View Access Pass"
														className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
													>
														<Eye className="h-3.5 w-3.5" />
													</button>

													<button
														type="button"
														onClick={() => {
															setSelectedUserForReset(account)
															setNewPinValue('')
														}}
														title="Reset PIN"
														className="rounded-lg border border-slate-200 p-1.5 text-emerald-700 hover:bg-emerald-50"
													>
														<KeyRound className="h-3.5 w-3.5" />
													</button>

													<button
														type="button"
														onClick={() => handleToggleStatus(account)}
														title={isSuspended ? 'Reactivate Access' : 'Suspend Access'}
														className={`rounded-lg border p-1.5 ${
															isSuspended
																? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
																: 'border-slate-200 text-slate-400 hover:text-amber-700 hover:bg-amber-50'
														}`}
													>
														<Power className="h-3.5 w-3.5" />
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modal 1: View Family Access Pass & Copy */}
			{selectedUserForView && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div className="flex items-center gap-2">
								<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
									<ShieldCheck className="h-5 w-5" />
								</div>
								<div>
									<h3 className="font-bold text-slate-900 text-sm">Family Portal Access Pass</h3>
									<p className="text-[11px] text-slate-500">Live credential status for admitted resident</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedUserForView(null)}
								className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="my-5 space-y-3 text-xs">
							<div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2.5">
								<div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
									<span className="text-slate-500 font-semibold">Resident:</span>
									<strong className="text-slate-900 font-bold">{selectedUserForView.patientName}</strong>
								</div>
								<div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
									<span className="text-slate-500 font-semibold">Account Guardian:</span>
									<strong className="text-slate-900">{selectedUserForView.guardianName}</strong>
								</div>
								<div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
									<span className="text-slate-500 font-semibold">Login Username:</span>
									<code className="font-mono font-bold text-emerald-800">
										{selectedUserForView.username || selectedUserForView.mobile}
									</code>
								</div>
								<div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
									<span className="text-slate-500 font-semibold">Registered Mobile:</span>
									<code className="font-mono font-bold text-emerald-800">{selectedUserForView.mobile}</code>
								</div>
								<div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
									<span className="text-slate-500 font-semibold">Current PIN / Passcode:</span>
									<code className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
										{selectedUserForView.password || '••••••••'}
									</code>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500 font-semibold">Location:</span>
									<span className="text-slate-700">
										Room {selectedUserForView.room || '-'} ({selectedUserForView.bed || '-'})
									</span>
								</div>
							</div>

							<p className="text-[11px] text-slate-500 text-center">
								Family members can sign in directly at{' '}
								<code className="font-mono text-emerald-800 font-bold">/login</code> using this Username/Mobile and PIN.
							</p>
						</div>

						<div className="flex items-center gap-2 pt-2">
							<button
								type="button"
								onClick={() => {
									const text = `Welcome to UNCF Elder Care!\n\nYou can access the live Resident Care & Vitals Portal at ${window.location.origin}/login\nUsername: ${selectedUserForView.username || selectedUserForView.mobile}\nMobile: ${selectedUserForView.mobile}\nPassword / PIN: ${selectedUserForView.password || 'Contact Facility'}\nResident: ${selectedUserForView.patientName}`
									void navigator.clipboard.writeText(text)
									setCopiedCredentials(true)
									setTimeout(() => setCopiedCredentials(false), 3000)
								}}
								className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
							>
								<Copy className="h-4 w-4" />
								<span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Login Details for Family'}</span>
							</button>

							<button
								type="button"
								onClick={() => setSelectedUserForView(null)}
								className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal 2: Reset Access PIN */}
			{selectedUserForReset && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<form
						onSubmit={handleConfirmResetPin}
						className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
					>
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
									<KeyRound className="h-4 w-4" />
								</div>
								<h3 className="font-bold text-slate-900 text-sm">Reset Family Access PIN</h3>
							</div>
							<button
								type="button"
								onClick={() => setSelectedUserForReset(null)}
								className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="my-4 space-y-3 text-xs">
							<p className="text-slate-600">
								Setting a new PIN for <strong>{selectedUserForReset.guardianName}</strong> (Resident:{' '}
								{selectedUserForReset.patientName}).
							</p>

							<div>
								<label className="block font-semibold text-slate-700 mb-1">New Manual PIN / Password</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={newPinValue}
										onChange={(e) => setNewPinValue(e.target.value)}
										placeholder="e.g. 123456 or custom PIN"
										required
										className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
									/>
									<button
										type="button"
										onClick={() => {
											const pin = Math.floor(100000 + Math.random() * 900000).toString()
											setNewPinValue(pin)
										}}
										className="rounded-xl border border-slate-200 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
									>
										PIN
									</button>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setSelectedUserForReset(null)}
								className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
							>
								Save New PIN
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	)
}
