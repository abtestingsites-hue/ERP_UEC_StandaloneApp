import React, { useEffect, useMemo, useState } from 'react'
import {
	AlertCircle,
	Briefcase,
	Building2,
	Calendar,
	CalendarDays,
	CalendarPlus,
	Check,
	CheckCircle2,
	Clock,
	Edit2,
	LogIn,
	LogOut,
	Mail,
	Phone,
	User,
	X,
	XCircle,
} from 'lucide-react'
import {
	profileService,
	type PersonalAttendanceLog,
	type PersonalLeaveRequest,
	type UserProfile,
} from '../services/profile.service'

interface MyProfileModalProps {
	isOpen: boolean
	onClose: () => void
	initialTab?: 'profile' | 'attendance' | 'leave'
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
	isOpen,
	onClose,
	initialTab = 'profile',
}) => {
	const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leave'>(initialTab)
	const [loading, setLoading] = useState(false)
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [attendanceLogs, setAttendanceLogs] = useState<PersonalAttendanceLog[]>([])
	const [isStaffLinked, setIsStaffLinked] = useState(true)
	const [leaveRequests, setLeaveRequests] = useState<PersonalLeaveRequest[]>([])
	const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	// Phone edit state
	const [isEditingPhone, setIsEditingPhone] = useState(false)
	const [phoneValue, setPhoneValue] = useState('')
	const [isSavingPhone, setIsSavingPhone] = useState(false)

	// Attendance action state
	const [attendanceNote, setAttendanceNote] = useState('')
	const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false)

	// Leave request form state
	const [showLeaveForm, setShowLeaveForm] = useState(false)
	const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)
	const todayDateStr = new Date().toISOString().slice(0, 10)
	const [leaveFormData, setLeaveFormData] = useState({
		leaveType: 'Casual Leave',
		fromDate: todayDateStr,
		toDate: todayDateStr,
		reason: '',
	})

	useEffect(() => {
		if (isOpen) {
			setActiveTab(initialTab)
			loadAllData()
		} else {
			setFeedbackMsg(null)
			setIsEditingPhone(false)
			setShowLeaveForm(false)
		}
	}, [isOpen, initialTab])

	const loadAllData = async () => {
		setLoading(true)
		setFeedbackMsg(null)
		try {
			const [profRes, attRes, leaveRes] = await Promise.all([
				profileService.getProfile().catch(() => null),
				profileService.getMyAttendanceLogs(),
				profileService.getMyLeaveRequests(),
			])

			if (profRes) {
				setProfile(profRes)
				setPhoneValue(profRes.phone || '')
			}
			setAttendanceLogs(attRes.logs)
			setIsStaffLinked(attRes.isStaffLinked && leaveRes.isStaffLinked)
			setLeaveRequests(leaveRes.requests)
		} catch {
			setFeedbackMsg({ type: 'error', text: 'Failed to load profile data.' })
		} finally {
			setLoading(false)
		}
	}

	const todayLog = useMemo(() => {
		if (!attendanceLogs.length) return null
		return attendanceLogs.find((l) => l.date === todayDateStr) || attendanceLogs[0]
	}, [attendanceLogs, todayDateStr])

	const isCheckedInToday = Boolean(todayLog?.checkIn && todayLog.checkIn !== '-')
	const isCheckedOutToday = Boolean(todayLog?.checkOut && todayLog.checkOut !== '-')

	const handleSavePhone = async () => {
		if (!phoneValue.trim()) return
		setIsSavingPhone(true)
		setFeedbackMsg(null)
		try {
			const updated = await profileService.updateProfile({ phone: phoneValue.trim() })
			setProfile(updated)
			setIsEditingPhone(false)
			setFeedbackMsg({ type: 'success', text: 'Contact number updated successfully.' })
		} catch {
			setFeedbackMsg({ type: 'error', text: 'Failed to update contact number.' })
		} finally {
			setIsSavingPhone(false)
		}
	}

	const handleMarkAttendance = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
		setIsSubmittingAttendance(true)
		setFeedbackMsg(null)
		try {
			const res = await profileService.markAttendance(action, attendanceNote.trim() || undefined)
			setFeedbackMsg({ type: 'success', text: res.message })
			setAttendanceNote('')
			// Refresh logs
			const attRes = await profileService.getMyAttendanceLogs()
			setAttendanceLogs(attRes.logs)
		} catch (err: unknown) {
			const errorObj = err as { response?: { data?: { message?: string } } }
			setFeedbackMsg({
				type: 'error',
				text: errorObj.response?.data?.message || `Failed to ${action === 'CHECK_IN' ? 'check in' : 'check out'}.`,
			})
		} finally {
			setIsSubmittingAttendance(false)
		}
	}

	const handleApplyLeave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!leaveFormData.fromDate || !leaveFormData.toDate) {
			setFeedbackMsg({ type: 'error', text: 'Please select both from and to dates.' })
			return
		}
		if (new Date(leaveFormData.fromDate) > new Date(leaveFormData.toDate)) {
			setFeedbackMsg({ type: 'error', text: 'From Date cannot be after To Date.' })
			return
		}

		setIsSubmittingLeave(true)
		setFeedbackMsg(null)
		try {
			await profileService.createLeaveRequest({
				leaveType: leaveFormData.leaveType,
				fromDate: leaveFormData.fromDate,
				toDate: leaveFormData.toDate,
				reason: leaveFormData.reason.trim(),
			})
			setFeedbackMsg({ type: 'success', text: 'Leave request submitted for administrative review.' })
			setShowLeaveForm(false)
			setLeaveFormData({
				leaveType: 'Casual Leave',
				fromDate: todayDateStr,
				toDate: todayDateStr,
				reason: '',
			})
			// Refresh leave requests
			const leaveRes = await profileService.getMyLeaveRequests()
			setLeaveRequests(leaveRes.requests)
		} catch (err: unknown) {
			const errorObj = err as { response?: { data?: { message?: string } } }
			setFeedbackMsg({
				type: 'error',
				text: errorObj.response?.data?.message || 'Failed to submit leave request.',
			})
		} finally {
			setIsSubmittingLeave(false)
		}
	}

	if (!isOpen) return null

	const leaveSummary = {
		total: leaveRequests.length,
		pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
		approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
		rejected: leaveRequests.filter((r) => r.status === 'REJECTED').length,
	}

	return (
		<div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
			<div
				className="modal-card"
				style={{ maxWidth: 720, width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Modal Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '18px 24px',
						borderBottom: '1px solid var(--border-default)',
						background: 'var(--surface-primary)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
						<div
							style={{
								width: 44,
								height: 44,
								borderRadius: '50%',
								background: 'var(--brand-green-surface)',
								color: 'var(--brand-green-text)',
								border: '1px solid var(--brand-green-border)',
								display: 'grid',
								placeItems: 'center',
								fontSize: 16,
								fontWeight: 700,
							}}
						>
							{profile?.name
								? profile.name
										.split(' ')
										.map((n) => n[0])
										.slice(0, 2)
										.join('')
										.toUpperCase()
								: 'ST'}
						</div>
						<div>
							<h2 id="profile-modal-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
								{profile?.name || 'Staff Member'}
							</h2>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
								<span
									style={{
										fontSize: 11,
										fontWeight: 600,
										color: 'var(--brand-green-text)',
										background: 'var(--brand-green-surface)',
										padding: '2px 8px',
										borderRadius: 'var(--radius-xs)',
										textTransform: 'uppercase',
									}}
								>
									{profile?.role || 'Staff'}
								</span>
								<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
									ID: {profile?.empId || 'EMP-USER'}
								</span>
								<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>•</span>
								<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
									{profile?.unitId || 'Universal Nature Care'}
								</span>
							</div>
						</div>
					</div>

					<button
						onClick={onClose}
						className="icon-button"
						style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)' }}
						aria-label="Close modal"
					>
						<X size={18} />
					</button>
				</div>

				{/* Modal Tabs Navigation */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						padding: '0 24px',
						background: 'var(--surface-secondary)',
						borderBottom: '1px solid var(--border-default)',
						gap: 6,
					}}
				>
					<button
						onClick={() => setActiveTab('profile')}
						className={`inv-tab-btn ${activeTab === 'profile' ? 'inv-tab-btn--active' : ''}`}
						style={{ padding: '12px 16px', fontSize: 13, borderBottomWidth: 3 }}
					>
						<User size={15} />
						Profile Details
					</button>
					<button
						onClick={() => setActiveTab('attendance')}
						className={`inv-tab-btn ${activeTab === 'attendance' ? 'inv-tab-btn--active' : ''}`}
						style={{ padding: '12px 16px', fontSize: 13, borderBottomWidth: 3 }}
					>
						<Clock size={15} />
						Daily Attendance
						{isCheckedInToday && !isCheckedOutToday && (
							<span
								style={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									background: 'var(--brand-green)',
									display: 'inline-block',
									marginLeft: 4,
								}}
							/>
						)}
					</button>
					<button
						onClick={() => setActiveTab('leave')}
						className={`inv-tab-btn ${activeTab === 'leave' ? 'inv-tab-btn--active' : ''}`}
						style={{ padding: '12px 16px', fontSize: 13, borderBottomWidth: 3 }}
					>
						<CalendarDays size={15} />
						My Leave Requests
						{leaveSummary.pending > 0 && (
							<span
								style={{
									fontSize: 10,
									fontWeight: 700,
									background: 'var(--status-warning-bg)',
									color: 'var(--status-warning-text)',
									padding: '1px 6px',
									borderRadius: 10,
									border: '1px solid var(--status-warning-border)',
									marginLeft: 4,
								}}
							>
								{leaveSummary.pending}
							</span>
						)}
					</button>
				</div>

				{/* Feedback alerts */}
				{feedbackMsg && (
					<div
						style={{
							margin: '12px 24px 0',
							padding: '10px 14px',
							borderRadius: 'var(--radius-sm)',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							fontSize: 13,
							fontWeight: 500,
							background: feedbackMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
							color: feedbackMsg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)',
							border: `1px solid ${feedbackMsg.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
						}}
					>
						{feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
						<span>{feedbackMsg.text}</span>
					</div>
				)}

				{/* Modal Body */}
				<div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
					{loading ? (
						<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
							Loading profile and attendance records...
						</div>
					) : (
						<>
							{/* =========================================================================
							    TAB 1: PROFILE DETAILS
							    ========================================================================= */}
							{activeTab === 'profile' && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
									{/* Info Grid */}
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
											gap: 14,
										}}
									>
										<div
											style={{
												padding: 16,
												background: 'var(--surface-primary)',
												border: '1px solid var(--border-default)',
												borderRadius: 'var(--radius-md)',
												boxShadow: 'var(--shadow-card)',
											}}
										>
											<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
												Full Name & Identity
											</div>
											<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
												<User size={16} color="var(--brand-green-text)" />
												{profile?.name || 'Staff Member'}
											</div>
											<div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
												Emp ID: <strong>{profile?.empId || 'N/A'}</strong>
											</div>
										</div>

										<div
											style={{
												padding: 16,
												background: 'var(--surface-primary)',
												border: '1px solid var(--border-default)',
												borderRadius: 'var(--radius-md)',
												boxShadow: 'var(--shadow-card)',
											}}
										>
											<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
												Designation & Department
											</div>
											<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
												<Briefcase size={16} color="var(--brand-green-text)" />
												{profile?.role || 'Staff'}
											</div>
											<div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
												Dept: <strong>{profile?.department || 'Operations'}</strong>
											</div>
										</div>
									</div>

									{/* Contact & Unit Information */}
									<div
										style={{
											padding: 18,
											background: 'var(--surface-primary)',
											border: '1px solid var(--border-default)',
											borderRadius: 'var(--radius-md)',
											boxShadow: 'var(--shadow-card)',
											display: 'flex',
											flexDirection: 'column',
											gap: 14,
										}}
									>
										<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
											Official Contact & Workplace Information
										</div>

										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
											<div>
												<div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
													<Mail size={13} /> Official Email
												</div>
												<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
													{profile?.email || 'N/A'}
												</div>
											</div>

											<div>
												<div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
													<Building2 size={13} /> Assigned Unit / Campus
												</div>
												<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
													{profile?.unitId || 'Universal Nature Care'}
												</div>
											</div>

											<div style={{ gridColumn: 'span 2' }}>
												<div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
													<Phone size={13} /> Contact Mobile Number
												</div>
												{isEditingPhone ? (
													<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
														<input
															type="tel"
															value={phoneValue}
															onChange={(e) => setPhoneValue(e.target.value)}
															placeholder="Enter 10-digit mobile number"
															style={{
																flex: 1,
																maxWidth: 240,
																padding: '6px 10px',
																border: '1px solid var(--border-default)',
																borderRadius: 'var(--radius-sm)',
																fontSize: 13,
															}}
														/>
														<button
															onClick={handleSavePhone}
															disabled={isSavingPhone}
															className="inv-btn inv-btn--primary inv-btn--sm"
														>
															<Check size={14} /> {isSavingPhone ? 'Saving...' : 'Save'}
														</button>
														<button
															onClick={() => {
																setIsEditingPhone(false)
																setPhoneValue(profile?.phone || '')
															}}
															className="inv-btn inv-btn--secondary inv-btn--sm"
														>
															Cancel
														</button>
													</div>
												) : (
													<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
														<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
															{profile?.phone || 'Not recorded'}
														</span>
														<button
															onClick={() => setIsEditingPhone(true)}
															style={{
																background: 'none',
																border: 'none',
																cursor: 'pointer',
																color: 'var(--brand-green-text)',
																display: 'inline-flex',
																alignItems: 'center',
																gap: 4,
																fontSize: 11,
																fontWeight: 600,
															}}
														>
															<Edit2 size={12} /> Edit
														</button>
													</div>
												)}
											</div>
										</div>

										<div
											style={{
												marginTop: 6,
												paddingTop: 12,
												borderTop: '1px solid var(--border-light)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												fontSize: 12,
												color: 'var(--text-secondary)',
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
												<Calendar size={13} /> Date of Joining: <strong>{profile?.joiningDate || 'Active Staff'}</strong>
											</div>
											<div>
												Status: <span style={{ color: 'var(--brand-green-text)', fontWeight: 600 }}>Active in Service</span>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* =========================================================================
							    TAB 2: DAILY ATTENDANCE (CHECK-IN / OUT)
							    ========================================================================= */}
							{activeTab === 'attendance' && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
									{!isStaffLinked && (
										<div
											style={{
												padding: '12px 16px',
												borderRadius: 'var(--radius-sm)',
												background: 'var(--status-warning-bg)',
												border: '1px solid var(--status-warning-border)',
												color: 'var(--status-warning-text)',
												fontSize: 12,
												lineHeight: 1.5,
											}}
										>
											<strong>Note for Administrator Login:</strong> Your current user login is an administrative account not directly mapped to an employee record in the Staff directory. Personal check-ins and personal leave requests are tracked for active staff members. You can govern all operational attendance under <strong>HR & Operations → Attendance Roster</strong>.
										</div>
									)}

									{/* Today's Live Attendance Action Card */}
									<div
										style={{
											padding: 20,
											background: 'var(--surface-primary)',
											border: '1px solid var(--border-default)',
											borderRadius: 'var(--radius-md)',
											boxShadow: 'var(--shadow-card)',
											display: 'flex',
											flexDirection: 'column',
											gap: 14,
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
											<div>
												<span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-green-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
													Today&apos;s Shift Attendance
												</span>
												<h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
													{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
												</h3>
											</div>

											{/* Status badge */}
											<div>
												{isCheckedOutToday ? (
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: 6,
															padding: '4px 10px',
															borderRadius: 'var(--radius-xs)',
															fontSize: 12,
															fontWeight: 600,
															background: 'var(--status-neutral-bg)',
															color: 'var(--status-neutral-text)',
															border: '1px solid var(--status-neutral-border)',
														}}
													>
														<CheckCircle2 size={14} /> Completed Shift (Checked Out)
													</span>
												) : isCheckedInToday ? (
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: 6,
															padding: '4px 10px',
															borderRadius: 'var(--radius-xs)',
															fontSize: 12,
															fontWeight: 600,
															background: 'var(--brand-green-surface)',
															color: 'var(--brand-green-text)',
															border: '1px solid var(--brand-green-border)',
														}}
													>
														<Clock size={14} /> Active On Duty (Checked In at {todayLog?.checkIn})
													</span>
												) : (
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: 6,
															padding: '4px 10px',
															borderRadius: 'var(--radius-xs)',
															fontSize: 12,
															fontWeight: 600,
															background: 'var(--status-warning-bg)',
															color: 'var(--status-warning-text)',
															border: '1px solid var(--status-warning-border)',
														}}
													>
														<AlertCircle size={14} /> Not Checked In Yet
													</span>
												)}
											</div>
										</div>

										{/* Clock In / Out action buttons */}
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 12,
												flexWrap: 'wrap',
												paddingTop: 12,
												borderTop: '1px solid var(--border-light)',
											}}
										>
											<div style={{ flex: 1, minWidth: 200 }}>
												<input
													type="text"
													value={attendanceNote}
													onChange={(e) => setAttendanceNote(e.target.value)}
													placeholder="Optional shift note (e.g. morning duty, ward rounds)..."
													style={{
														width: '100%',
														padding: '8px 12px',
														fontSize: 13,
														border: '1px solid var(--border-default)',
														borderRadius: 'var(--radius-sm)',
													}}
													disabled={isSubmittingAttendance}
												/>
											</div>

											{!isCheckedInToday ? (
												<button
													onClick={() => handleMarkAttendance('CHECK_IN')}
													disabled={isSubmittingAttendance}
													className="inv-btn inv-btn--primary"
													style={{ padding: '8px 18px', fontSize: 13 }}
												>
													<LogIn size={15} />
													{isSubmittingAttendance ? 'Processing...' : 'Clock In / Check In'}
												</button>
											) : !isCheckedOutToday ? (
												<button
													onClick={() => handleMarkAttendance('CHECK_OUT')}
													disabled={isSubmittingAttendance}
													className="inv-btn"
													style={{
														background: 'var(--status-error-text)',
														color: '#fff',
														border: '1px solid var(--status-error-text)',
														padding: '8px 18px',
														fontSize: 13,
													}}
												>
													<LogOut size={15} />
													{isSubmittingAttendance ? 'Processing...' : 'Clock Out / Check Out'}
												</button>
											) : (
												<button disabled className="inv-btn inv-btn--secondary" style={{ opacity: 0.6 }}>
													<Check size={14} /> Shift Finished For Today
												</button>
											)}
										</div>
									</div>

									{/* Attendance History Table */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										<h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
											Recent Personal Attendance History
										</h4>

										<div className="inv-table-responsive">
											<table className="inv-table">
												<thead>
													<tr>
														<th>Date</th>
														<th>Check In</th>
														<th>Check Out</th>
														<th>Hours Worked</th>
														<th>Status</th>
														<th>Shift Note</th>
													</tr>
												</thead>
												<tbody>
													{attendanceLogs.length === 0 ? (
														<tr>
															<td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
																No personal attendance logs recorded yet.
															</td>
														</tr>
													) : (
														attendanceLogs.slice(0, 10).map((log) => (
															<tr key={log.id}>
																<td style={{ fontWeight: 600 }}>{log.date}</td>
																<td>{log.checkIn || '—'}</td>
																<td>{log.checkOut || '—'}</td>
																<td style={{ fontVariantNumeric: 'tabular-nums' }}>
																	{log.hoursWorked ? `${log.hoursWorked} hrs` : '—'}
																</td>
																<td>
																	<span
																		style={{
																			display: 'inline-block',
																			fontSize: 10,
																			fontWeight: 700,
																			padding: '2px 7px',
																			borderRadius: 'var(--radius-xs)',
																			background:
																				log.status === 'PRESENT'
																					? 'var(--status-success-bg)'
																					: 'var(--status-neutral-bg)',
																			color:
																				log.status === 'PRESENT'
																					? 'var(--status-success-text)'
																					: 'var(--status-neutral-text)',
																			border: `1px solid ${
																				log.status === 'PRESENT'
																					? 'var(--status-success-border)'
																					: 'var(--status-neutral-border)'
																			}`,
																		}}
																	>
																		{log.status}
																	</span>
																</td>
																<td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
																	{log.note || '—'}
																</td>
															</tr>
														))
													)}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{/* =========================================================================
							    TAB 3: MY LEAVE REQUESTS
							    ========================================================================= */}
							{activeTab === 'leave' && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
									{!isStaffLinked && (
										<div
											style={{
												padding: '12px 16px',
												borderRadius: 'var(--radius-sm)',
												background: 'var(--status-warning-bg)',
												border: '1px solid var(--status-warning-border)',
												color: 'var(--status-warning-text)',
												fontSize: 12,
												lineHeight: 1.5,
											}}
										>
											<strong>Note for Administrator Login:</strong> Personal leave requests require a linked staff profile in the HR register. To review and grant leave for all organizational employees, visit <strong>HR & Operations → Leave Governance</strong>.
										</div>
									)}

									{/* Summary & Apply Header */}
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											flexWrap: 'wrap',
											gap: 12,
										}}
									>
										{/* Status summary pills */}
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<div
												style={{
													padding: '6px 12px',
													background: 'var(--surface-primary)',
													border: '1px solid var(--border-default)',
													borderRadius: 'var(--radius-sm)',
													fontSize: 12,
												}}
											>
												Total: <strong>{leaveSummary.total}</strong>
											</div>
											<div
												style={{
													padding: '6px 12px',
													background: 'var(--status-warning-bg)',
													border: '1px solid var(--status-warning-border)',
													color: 'var(--status-warning-text)',
													borderRadius: 'var(--radius-sm)',
													fontSize: 12,
												}}
											>
												Pending: <strong>{leaveSummary.pending}</strong>
											</div>
											<div
												style={{
													padding: '6px 12px',
													background: 'var(--brand-green-surface)',
													border: '1px solid var(--brand-green-border)',
													color: 'var(--brand-green-text)',
													borderRadius: 'var(--radius-sm)',
													fontSize: 12,
												}}
											>
												Approved: <strong>{leaveSummary.approved}</strong>
											</div>
										</div>

										<button
											onClick={() => setShowLeaveForm(!showLeaveForm)}
											className="inv-btn inv-btn--primary"
											style={{ fontSize: 13 }}
										>
											<CalendarPlus size={15} />
											{showLeaveForm ? 'Cancel Application' : 'Request Leave'}
										</button>
									</div>

									{/* Apply for Leave Collapsible Form */}
									{showLeaveForm && (
										<form
											onSubmit={handleApplyLeave}
											style={{
												padding: 18,
												background: 'var(--surface-primary)',
												border: '1px solid var(--border-default)',
												borderRadius: 'var(--radius-md)',
												boxShadow: 'var(--shadow-card)',
												display: 'flex',
												flexDirection: 'column',
												gap: 14,
											}}
										>
											<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
												Submit Personal Leave Request
											</div>

											<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
												<div>
													<label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
														Leave Type *
													</label>
													<select
														className="inv-select"
														style={{ width: '100%' }}
														value={leaveFormData.leaveType}
														onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
													>
														<option value="Casual Leave">Casual Leave (CL)</option>
														<option value="Sick Leave">Sick Leave (SL)</option>
														<option value="Earned Leave">Earned Leave (EL)</option>
														<option value="Emergency Leave">Emergency Leave</option>
														<option value="Compensatory Off">Compensatory Off</option>
													</select>
												</div>

												<div>
													<label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
														From Date *
													</label>
													<input
														type="date"
														className="inv-search-input"
														style={{ paddingLeft: 10, width: '100%' }}
														value={leaveFormData.fromDate}
														onChange={(e) => setLeaveFormData({ ...leaveFormData, fromDate: e.target.value })}
														required
													/>
												</div>

												<div>
													<label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
														To Date *
													</label>
													<input
														type="date"
														className="inv-search-input"
														style={{ paddingLeft: 10, width: '100%' }}
														value={leaveFormData.toDate}
														onChange={(e) => setLeaveFormData({ ...leaveFormData, toDate: e.target.value })}
														required
													/>
												</div>
											</div>

											<div>
												<label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
													Reason / Operational Justification
												</label>
												<textarea
													value={leaveFormData.reason}
													onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
													placeholder="State the reason for leave and handoff contact if applicable..."
													rows={2}
													style={{
														width: '100%',
														padding: '8px 12px',
														fontSize: 13,
														border: '1px solid var(--border-default)',
														borderRadius: 'var(--radius-sm)',
													}}
												/>
											</div>

											<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
												<button
													type="button"
													onClick={() => setShowLeaveForm(false)}
													className="inv-btn inv-btn--secondary inv-btn--sm"
												>
													Cancel
												</button>
												<button
													type="submit"
													disabled={isSubmittingLeave}
													className="inv-btn inv-btn--primary inv-btn--sm"
												>
													<Check size={14} /> {isSubmittingLeave ? 'Submitting...' : 'Confirm & Apply'}
												</button>
											</div>
										</form>
									)}

									{/* Leave Requests Table */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
										<h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
											My Leave Applications
										</h4>

										<div className="inv-table-responsive">
											<table className="inv-table">
												<thead>
													<tr>
														<th>Leave Type</th>
														<th>From Date</th>
														<th>To Date</th>
														<th>Reason</th>
														<th>Status</th>
														<th>HR Review / Remarks</th>
													</tr>
												</thead>
												<tbody>
													{leaveRequests.length === 0 ? (
														<tr>
															<td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
																No leave requests submitted yet.
															</td>
														</tr>
													) : (
														leaveRequests.map((req) => (
															<tr key={req.id}>
																<td style={{ fontWeight: 600 }}>{req.leaveType}</td>
																<td>{req.fromDate}</td>
																<td>{req.toDate}</td>
																<td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
																	{req.reason || '—'}
																</td>
																<td>
																	<span
																		style={{
																			display: 'inline-flex',
																			alignItems: 'center',
																			gap: 4,
																			fontSize: 10,
																			fontWeight: 700,
																			padding: '2px 7px',
																			borderRadius: 'var(--radius-xs)',
																			background:
																				req.status === 'APPROVED'
																					? 'var(--status-success-bg)'
																					: req.status === 'REJECTED'
																					? 'var(--status-error-bg)'
																					: 'var(--status-warning-bg)',
																			color:
																				req.status === 'APPROVED'
																					? 'var(--status-success-text)'
																					: req.status === 'REJECTED'
																					? 'var(--status-error-text)'
																					: 'var(--status-warning-text)',
																			border: `1px solid ${
																				req.status === 'APPROVED'
																					? 'var(--status-success-border)'
																					: req.status === 'REJECTED'
																					? 'var(--status-error-border)'
																					: 'var(--status-warning-border)'
																			}`,
																		}}
																	>
																		{req.status === 'APPROVED' && <CheckCircle2 size={12} />}
																		{req.status === 'REJECTED' && <XCircle size={12} />}
																		{req.status === 'PENDING' && <Clock size={12} />}
																		{req.status}
																	</span>
																</td>
																<td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
																	{req.remarks || (req.status === 'PENDING' ? 'Under review by management' : '—')}
																</td>
															</tr>
														))
													)}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}
