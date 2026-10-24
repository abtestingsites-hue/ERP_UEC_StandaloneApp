import React, { useState } from 'react'
import {
	MessageSquare,
	Plus,
	CheckCircle2,
	Send,
} from 'lucide-react'
import type { PortalComplaint } from '../portal.types'
import { PortalService } from '../portal.service'

interface Props {
	complaints: PortalComplaint[]
	onRefresh: () => void
}

export function PortalComplaintsTab({ complaints, onRefresh }: Props) {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [category, setCategory] = useState('Care & Nursing Support')
	const [priority] = useState('Normal')
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [feedbackMessage, setFeedbackMessage] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!description.trim()) return

		setSubmitting(true)
		try {
			await PortalService.createComplaint({
				category,
				priority,
				title: title || category,
				description,
			})
			setFeedbackMessage('Your service request has been submitted to the Facility Care Coordinator.')
			setIsModalOpen(false)
			setTitle('')
			setDescription('')
			onRefresh()
		} catch (err: any) {
			alert(err?.message || 'Failed to submit request')
		} finally {
			setSubmitting(false)
		}
	}

	const formatDate = (val?: string) => {
		if (!val) return '—'
		const d = new Date(val)
		return !isNaN(d.getTime())
			? d.toLocaleDateString('en-IN', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
			  })
			: '—'
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
				<div>
					<h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
						Family Care Desk & Requests
					</h2>
					<p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
						Submit special requests, dietary modifications, or feedback directly to facility floor managers.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setIsModalOpen(true)}
					className="portal-btn-primary"
				>
					<Plus size={15} />
					<span>Raise New Request</span>
				</button>
			</div>

			{feedbackMessage && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						background: '#f0fdf4',
						border: '1px solid #bbf7d0',
						padding: '12px 16px',
						borderRadius: '12px',
						fontSize: '12px',
						color: '#166534',
						fontWeight: 600,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<CheckCircle2 size={16} color="#039A01" />
						<span>{feedbackMessage}</span>
					</div>
					<button
						type="button"
						onClick={() => setFeedbackMessage('')}
						style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Service Requests Table / List */}
			<div className="portal-card">
				<div className="portal-card-header">
					<div>
						<h3 className="portal-card-title">Past Requests & Inquiries</h3>
						<p className="portal-card-desc">Status of tickets submitted by guardian or family</p>
					</div>
					<span className="portal-badge portal-badge--active">
						{complaints.length > 0 ? `${complaints.length} Submitted` : 'No Active Tickets'}
					</span>
				</div>

				<div style={{ marginTop: '16px' }}>
					{complaints.length === 0 ? (
						<div
							style={{
								padding: '40px 20px',
								textAlign: 'center',
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: '12px',
							}}
						>
							<MessageSquare size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
							<h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
								No Service Requests Raised Yet
							</h4>
							<p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
								You can submit requests regarding dietary preferences, housekeeping, extra amenities, or nursing support by clicking the "Raise New Request" button.
							</p>
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{complaints.map((c) => (
								<div
									key={c.id}
									style={{
										padding: '16px',
										background: '#f8fafc',
										border: '1px solid #f1f5f9',
										borderRadius: '12px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
											<div
												style={{
													background: '#f0fdf4',
													color: '#039A01',
													padding: '6px',
													borderRadius: '8px',
												}}
											>
												<MessageSquare size={16} />
											</div>
											<div>
												<h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
													{c.title}
												</h4>
												<div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
													Category: <strong>{c.category}</strong> · Priority: {c.priority} · {formatDate(c.createdAt)}
												</div>
											</div>
										</div>

										<span
											className={
												c.status?.toUpperCase() === 'RESOLVED'
													? 'portal-badge portal-badge--active'
													: 'portal-badge portal-badge--neutral'
											}
										>
											{c.status || 'Submitted'}
										</span>
									</div>

									<p style={{ margin: '10px 0 0 36px', fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
										{c.description}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Modal Dialog for raising request */}
			{isModalOpen && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9999,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'rgba(15, 23, 42, 0.45)',
						backdropFilter: 'blur(4px)',
						padding: '16px',
					}}
				>
					<div
						style={{
							width: '100%',
							maxWidth: '480px',
							background: '#ffffff',
							borderRadius: '16px',
							padding: '24px',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
							<h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
								Raise Resident Care Request
							</h3>
							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								style={{ background: 'transparent', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
							>
								✕
							</button>
						</div>

						<form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
							<div>
								<label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
									Category
								</label>
								<select
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									style={{
										width: '100%',
										padding: '9px 12px',
										borderRadius: '10px',
										border: '1px solid #cbd5e1',
										color: '#0f172a',
										fontSize: '12px',
										outline: 'none',
									}}
								>
									<option>Care & Nursing Support</option>
									<option>Dietary & Meal Modification</option>
									<option>Room Cleaning & Housekeeping</option>
									<option>Physiotherapy & Mobility</option>
									<option>Video Call / Visiting Request</option>
									<option>Billing & Accounts Inquiry</option>
									<option>Other Feedback</option>
								</select>
							</div>

							<div>
								<label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
									Subject / Summary
								</label>
								<input
									type="text"
									placeholder="e.g. Request extra blanket or video call coordination"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									style={{
										width: '100%',
										boxSizing: 'border-box',
										padding: '9px 12px',
										borderRadius: '10px',
										border: '1px solid #cbd5e1',
										color: '#0f172a',
										fontSize: '12px',
										outline: 'none',
									}}
								/>
							</div>

							<div>
								<label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
									Details / Message *
								</label>
								<textarea
									rows={4}
									required
									placeholder="Please provide details so our floor manager can assist..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									style={{
										width: '100%',
										boxSizing: 'border-box',
										padding: '9px 12px',
										borderRadius: '10px',
										border: '1px solid #cbd5e1',
										color: '#0f172a',
										fontSize: '12px',
										outline: 'none',
										resize: 'vertical',
									}}
								/>
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="portal-btn-secondary"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="portal-btn-primary"
								>
									<Send size={13} />
									<span>{submitting ? 'Submitting…' : 'Submit to Floor Manager'}</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
