import React, { useState, useEffect, useMemo } from 'react'
import {
	AlertTriangle,
	ArrowRight,
	Calculator,
	CheckCircle2,
	ChevronRight,
	Plus,
	RotateCw,
	ShieldAlert,
	UserPlus,
	Users,
} from 'lucide-react'
import type { CandidateItem, PayrollPreviewItem } from '../hrOperations.types'
import { hrOperationsService } from '../hrOperations.service'
import { AddCandidateModal } from '../components/AddCandidateModal'

interface RecruitmentPayrollTabProps {
	hasExplicitAllUnits: boolean
}

const candidateStatusBadges: Record<string, string> = {
	APPLIED: 'bg-slate-100 text-slate-700 border-slate-300',
	SCREENING: 'bg-blue-50 text-blue-700 border-blue-200',
	INTERVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
	OFFERED: 'bg-purple-50 text-purple-700 border-purple-200',
	PLACED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
}

const NEXT_STAGES: Record<string, string[]> = {
	APPLIED: ['SCREENING', 'REJECTED'],
	SCREENING: ['INTERVIEW', 'REJECTED'],
	INTERVIEW: ['OFFERED', 'REJECTED'],
	OFFERED: ['PLACED', 'REJECTED'],
	PLACED: [],
	REJECTED: ['APPLIED'],
}

export const RecruitmentPayrollTab: React.FC<RecruitmentPayrollTabProps> = ({
	hasExplicitAllUnits,
}) => {
	const [activeSubSection, setActiveSubSection] = useState<'PAYROLL' | 'CANDIDATES'>('PAYROLL')

	// Payroll state
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const now = new Date()
		const y = now.getFullYear()
		const m = String(now.getMonth() + 1).padStart(2, '0')
		return `${y}-${m}`
	})
	const [payrollItems, setPayrollItems] = useState<PayrollPreviewItem[]>([])
	const [isPayrollLoading, setIsPayrollLoading] = useState(false)
	const [payrollError, setPayrollError] = useState<string | null>(null)
	const [payrollSuccess, setPayrollSuccess] = useState<string | null>(null)
	const [processingStaffId, setProcessingStaffId] = useState<string | null>(null)
	const [onlyExceptions, setOnlyExceptions] = useState(false)

	// Candidates state
	const [candidates, setCandidates] = useState<CandidateItem[]>([])
	const [isCandidatesLoading, setIsCandidatesLoading] = useState(false)
	const [candidatesError, setCandidatesError] = useState<string | null>(null)
	const [candidateSearch, setCandidateSearch] = useState('')
	const [candidateStageFilter, setCandidateStageFilter] = useState('ALL')
	const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
	const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null)

	const [refreshTrigger, setRefreshTrigger] = useState(0)

	useEffect(() => {
		let isMounted = true

		const loadData = async () => {
			if (activeSubSection === 'PAYROLL') {
				try {
					setIsPayrollLoading(true)
					const data = await hrOperationsService.getPayrollPreview({
						month: selectedMonth,
						scope: hasExplicitAllUnits ? 'all' : undefined,
					})
					if (isMounted) {
						setPayrollItems(data)
						setIsPayrollLoading(false)
					}
				} catch (err: unknown) {
					const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
					if (isMounted) {
						setPayrollError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch payroll calculations')
						setIsPayrollLoading(false)
					}
				}
			} else {
				try {
					setIsCandidatesLoading(true)
					const data = await hrOperationsService.getCandidates()
					if (isMounted) {
						setCandidates(data)
						setIsCandidatesLoading(false)
					}
				} catch (err: unknown) {
					const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
					if (isMounted) {
						setCandidatesError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch candidate pipeline')
						setIsCandidatesLoading(false)
					}
				}
			}
		}

		void loadData()

		return () => {
			isMounted = false
		}
	}, [activeSubSection, selectedMonth, hasExplicitAllUnits, refreshTrigger])

	const handleRefresh = () => {
		if (activeSubSection === 'PAYROLL') {
			setIsPayrollLoading(true)
		} else {
			setIsCandidatesLoading(true)
		}
		setRefreshTrigger((p) => p + 1)
	}

	const handleProcessPayroll = async (staffId: string) => {
		try {
			setProcessingStaffId(staffId)
			setPayrollError(null)
			setPayrollSuccess(null)
			await hrOperationsService.processPayroll({
				staffId,
				month: selectedMonth,
			})
			setPayrollSuccess('Payroll preview computed and verified for staff.')
			handleRefresh()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setPayrollError(axiosError.response?.data?.message || axiosError.message || 'Failed to compute payroll')
		} finally {
			setProcessingStaffId(null)
		}
	}

	const handleStageTransition = async (candidateId: string, newStage: string) => {
		try {
			setUpdatingCandidateId(candidateId)
			await hrOperationsService.updateCandidate(candidateId, { stage: newStage })
			handleRefresh()
		} catch (err: unknown) {
			const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
			setCandidatesError(axiosError.response?.data?.message || axiosError.message || 'Failed to advance candidate stage')
		} finally {
			setUpdatingCandidateId(null)
		}
	}

	// Filter exceptions
	const isException = (p: PayrollPreviewItem) => {
		return Number(p.absentDays) >= 3 || Number(p.presentDays) === 0 || Number(p.deductions) > 2000
	}

	const exceptionCount = useMemo(() => {
		return payrollItems.filter(isException).length
	}, [payrollItems])

	const displayedPayroll = useMemo(() => {
		if (!onlyExceptions) return payrollItems
		return payrollItems.filter(isException)
	}, [payrollItems, onlyExceptions])

	const payrollTotals = useMemo(() => {
		let totalGross = 0
		let totalDeductions = 0
		let totalNet = 0
		payrollItems.forEach((p) => {
			totalGross += Number(p.grossPay) || 0
			totalDeductions += Number(p.deductions) || 0
			totalNet += Number(p.netPay) || 0
		})
		return { totalGross, totalDeductions, totalNet, count: payrollItems.length }
	}, [payrollItems])

	const filteredCandidates = useMemo(() => {
		return candidates.filter((c) => {
			const matchesSearch =
				(c.name || '').toLowerCase().includes(candidateSearch.toLowerCase()) ||
				(c.designationApplied || '').toLowerCase().includes(candidateSearch.toLowerCase()) ||
				(c.department || '').toLowerCase().includes(candidateSearch.toLowerCase()) ||
				(c.phone || '').includes(candidateSearch)
			const matchesStage = candidateStageFilter === 'ALL' || c.status.toUpperCase() === candidateStageFilter
			return matchesSearch && matchesStage
		})
	}, [candidates, candidateSearch, candidateStageFilter])

	return (
		<div className="space-y-6">
			{/* Section switcher */}
			<div className="flex border-b border-slate-200">
				<button
					type="button"
					onClick={() => setActiveSubSection('PAYROLL')}
					className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
						activeSubSection === 'PAYROLL'
							? 'border-indigo-600 text-indigo-600'
							: 'border-transparent text-slate-500 hover:text-slate-800'
					}`}
				>
					Salary Computation & Preview
				</button>
				<button
					type="button"
					onClick={() => setActiveSubSection('CANDIDATES')}
					className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
						activeSubSection === 'CANDIDATES'
							? 'border-indigo-600 text-indigo-600'
							: 'border-transparent text-slate-500 hover:text-slate-800'
					}`}
				>
					Recruitment & Talent Pipeline ({candidates.length})
				</button>
			</div>

			{/* ========================================================================= */}
			{/* SECTION 1: PAYROLL COMPUTATION & PREVIEW                                   */}
			{/* ========================================================================= */}
			{activeSubSection === 'PAYROLL' && (
				<div className="space-y-6">
					{/* Explicit Preview-Only Banner */}
					<div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-sm flex items-start gap-3">
						<ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
						<div>
							<div className="font-bold text-amber-950">
								Preview & Pre-Processing Audit Mode Only
							</div>
							<p className="mt-0.5 text-amber-800">
								Calculations are computed dynamically from verified attendance logs and contractual pay bases. Automated fund disbursement and payment gateway execution are restricted to the <strong>Finance Domain</strong> upon operational audit sign-off.
							</p>
						</div>
					</div>

					{/* KPI Summary Cards */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
							<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
								Eligible Staff
							</div>
							<div className="mt-1 text-2xl font-bold text-slate-900">{payrollTotals.count}</div>
						</div>

						<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
							<div className="text-xs font-medium uppercase tracking-wider text-slate-500">
								Gross Pay Total
							</div>
							<div className="mt-1 text-2xl font-bold text-slate-900">
								₹{payrollTotals.totalGross.toLocaleString('en-IN')}
							</div>
						</div>

						<div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
							<div className="text-xs font-medium uppercase tracking-wider text-rose-700">
								Total Deductions
							</div>
							<div className="mt-1 text-2xl font-bold text-rose-700">
								₹{payrollTotals.totalDeductions.toLocaleString('en-IN')}
							</div>
						</div>

						<div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
							<div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
								Net Payable
							</div>
							<div className="mt-1 text-2xl font-bold text-emerald-700">
								₹{payrollTotals.totalNet.toLocaleString('en-IN')}
							</div>
						</div>
					</div>

					{/* Controls & Exception Filter */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<label htmlFor="payroll-month" className="text-xs font-medium text-slate-700">
									Month:
								</label>
								<input
									id="payroll-month"
									type="month"
									value={selectedMonth}
									onChange={(e) => setSelectedMonth(e.target.value)}
									className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
								/>
							</div>

							<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
								<button
									type="button"
									onClick={() => setOnlyExceptions(false)}
									className={`rounded-md px-3 py-1 transition ${
										!onlyExceptions
											? 'bg-white font-semibold text-slate-900 shadow-sm'
											: 'text-slate-600 hover:text-slate-900'
									}`}
								>
									All Staff ({payrollItems.length})
								</button>
								<button
									type="button"
									onClick={() => setOnlyExceptions(true)}
									className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition ${
										onlyExceptions
											? 'bg-amber-500 font-semibold text-white shadow-sm'
											: 'text-amber-800 hover:bg-amber-100'
									}`}
								>
									<AlertTriangle size={12} />
									Inspect Exceptions ({exceptionCount})
								</button>
							</div>
						</div>

						<button
							type="button"
							onClick={handleRefresh}
							disabled={isPayrollLoading}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
						>
							<RotateCw className={`h-3.5 w-3.5 ${isPayrollLoading ? 'animate-spin' : ''}`} />
							Refresh
						</button>
					</div>

					{payrollError && (
						<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
							{payrollError}
						</div>
					)}
					{payrollSuccess && (
						<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
							{payrollSuccess}
						</div>
					)}

					{/* Payroll Table */}
					<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
									<tr>
										<th className="px-4 py-3.5">Staff Member</th>
										<th className="px-4 py-3.5">Department</th>
										<th className="px-4 py-3.5 text-center">Days (Pres / Lv / Abs)</th>
										<th className="px-4 py-3.5 text-right">Base Salary</th>
										<th className="px-4 py-3.5 text-right">Allowances</th>
										<th className="px-4 py-3.5 text-right">Deductions</th>
										<th className="px-4 py-3.5 text-right">Net Pay</th>
										<th className="px-4 py-3.5 text-right">Audit Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-700">
									{isPayrollLoading && payrollItems.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-12 text-center text-slate-400">
												Calculating attendance-based payroll preview...
											</td>
										</tr>
									) : displayedPayroll.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-12 text-center text-slate-400">
												{onlyExceptions
													? '✓ No payroll exceptions found for this month.'
													: `No payroll records generated for ${selectedMonth}.`}
											</td>
										</tr>
									) : (
										displayedPayroll.map((p) => {
											const hasEx = isException(p)
											return (
												<tr
													key={p.id || p.staffId}
													className={`hover:bg-slate-50/70 ${hasEx ? 'bg-amber-50/20' : ''}`}
												>
													<td className="px-4 py-3.5">
														<div className="font-semibold text-slate-900">{p.name}</div>
														<div className="text-xs text-slate-400 font-mono">
															{p.empId} · {p.role}
														</div>
													</td>
													<td className="px-4 py-3.5 text-xs text-slate-600">{p.department}</td>
													<td className="px-4 py-3.5 text-center text-xs">
														<span className="font-semibold text-emerald-700">{p.presentDays}</span>
														{' / '}
														<span className="font-semibold text-blue-700">{p.approvedLeaveDays}</span>
														{' / '}
														<span
															className={`font-semibold ${
																p.absentDays > 0 ? 'text-rose-700' : 'text-slate-400'
															}`}
														>
															{p.absentDays}
														</span>
													</td>
													<td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700">
														₹{Number(p.baseSalary || 0).toLocaleString('en-IN')}
													</td>
													<td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700">
														₹{Number(p.fixedAllowance || 0).toLocaleString('en-IN')}
													</td>
													<td className="px-4 py-3.5 text-right font-mono text-xs text-rose-600">
														-₹{Number(p.deductions || 0).toLocaleString('en-IN')}
													</td>
													<td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-700">
														₹{Number(p.netPay || 0).toLocaleString('en-IN')}
													</td>
													<td className="px-4 py-3.5 text-right">
														<button
															type="button"
															onClick={() => handleProcessPayroll(p.staffId)}
															disabled={processingStaffId === p.staffId}
															className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 text-xs font-medium text-slate-700 transition"
														>
															{processingStaffId === p.staffId ? 'Auditing...' : 'Audit / Recalc'}
														</button>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* SECTION 2: RECRUITMENT & TALENT PIPELINE                                  */}
			{/* ========================================================================= */}
			{activeSubSection === 'CANDIDATES' && (
				<div className="space-y-4">
					{/* Search & Actions Bar */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-1 flex-wrap items-center gap-3">
							<div className="relative min-w-[220px] flex-1">
								<input
									type="text"
									placeholder="Search candidates by name, role, department..."
									value={candidateSearch}
									onChange={(e) => setCandidateSearch(e.target.value)}
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
								/>
							</div>

							<select
								value={candidateStageFilter}
								onChange={(e) => setCandidateStageFilter(e.target.value)}
								className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
							>
								<option value="ALL">All Stages</option>
								<option value="APPLIED">Applied</option>
								<option value="SCREENING">Screening</option>
								<option value="INTERVIEW">Interview</option>
								<option value="OFFERED">Offered</option>
								<option value="PLACED">Placed</option>
								<option value="REJECTED">Rejected</option>
							</select>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleRefresh}
								disabled={isCandidatesLoading}
								className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
							>
								<RotateCw className={`h-3.5 w-3.5 ${isCandidatesLoading ? 'animate-spin' : ''}`} />
								Refresh
							</button>

							<button
								type="button"
								onClick={() => setIsAddCandidateOpen(true)}
								className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
							>
								<UserPlus className="h-3.5 w-3.5" />
								Add Candidate
							</button>
						</div>
					</div>

					{candidatesError && (
						<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
							{candidatesError}
						</div>
					)}

					{/* Candidate Register Table */}
					<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
									<tr>
										<th className="px-4 py-3.5">Candidate Name</th>
										<th className="px-4 py-3.5">Role Applied</th>
										<th className="px-4 py-3.5">Department</th>
										<th className="px-4 py-3.5">Contact Details</th>
										<th className="px-4 py-3.5">Experience</th>
										<th className="px-4 py-3.5">Current Stage</th>
										<th className="px-4 py-3.5 text-right">Workflow Progression</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-700">
									{isCandidatesLoading && candidates.length === 0 ? (
										<tr>
											<td colSpan={7} className="py-12 text-center text-slate-400">
												Loading talent pipeline...
											</td>
										</tr>
									) : filteredCandidates.length === 0 ? (
										<tr>
											<td colSpan={7} className="py-12 text-center text-slate-400">
												No candidates found matching criteria. Use "Add Candidate" to register applicants.
											</td>
										</tr>
									) : (
										filteredCandidates.map((c) => {
											const stUpper = (c.status || 'APPLIED').toUpperCase()
											const badgeCls =
												candidateStatusBadges[stUpper] ||
												'bg-slate-100 text-slate-700 border-slate-200'
											const nextSteps = NEXT_STAGES[stUpper] || []
											const isUpdating = updatingCandidateId === c.id

											return (
												<tr key={c.id} className="hover:bg-slate-50/70">
													<td className="px-4 py-3.5">
														<div className="font-semibold text-slate-900">{c.name}</div>
														<div className="text-xs text-slate-400">
															Added {c.createdAt ? c.createdAt.slice(0, 10) : 'Recent'}
														</div>
													</td>
													<td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
														{c.designationApplied || 'Staff'}
													</td>
													<td className="px-4 py-3.5 text-xs text-slate-500">{c.department || 'General'}</td>
													<td className="px-4 py-3.5 text-xs text-slate-600">
														<div>{c.phone || '—'}</div>
														<div className="text-slate-400">{c.email || '—'}</div>
													</td>
													<td className="px-4 py-3.5 text-xs text-slate-600">
														{c.experienceYears ? `${c.experienceYears} yrs` : 'Entry level'}
													</td>
													<td className="px-4 py-3.5">
														<span
															className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}
														>
															{stUpper}
														</span>
													</td>
													<td className="px-4 py-3.5 text-right">
														{nextSteps.length > 0 ? (
															<div className="inline-flex items-center gap-1.5">
																{nextSteps.map((step) => (
																	<button
																		key={step}
																		type="button"
																		disabled={isUpdating}
																		onClick={() => handleStageTransition(c.id, step)}
																		className={`rounded px-2 py-1 text-xs font-semibold transition ${
																			step === 'REJECTED'
																				? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
																				: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
																		}`}
																	>
																		{step === 'REJECTED' ? 'Reject' : `➔ ${step}`}
																	</button>
																))}
															</div>
														) : (
															<span className="text-xs text-emerald-700 font-semibold">
																✓ Placed
															</span>
														)}
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* Add Candidate Modal */}
			{isAddCandidateOpen && (
				<AddCandidateModal
					isOpen={isAddCandidateOpen}
					onClose={() => setIsAddCandidateOpen(false)}
					onSuccess={handleRefresh}
				/>
			)}
		</div>
	)
}
