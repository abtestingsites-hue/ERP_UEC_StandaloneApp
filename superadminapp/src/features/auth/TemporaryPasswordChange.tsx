import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { changeTemporaryPassword } from './auth.service'

export function TemporaryPasswordChange() {
	const { session, logout } = useAuth()
	const navigate = useNavigate()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	if (!session) return <Navigate to="/login" replace />
	if (!session.user.mustChangePassword) return <Navigate to="/dashboard" replace />

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')
		setSubmitting(true)

		try {
			await changeTemporaryPassword(currentPassword, newPassword, confirmPassword)
			logout()
			navigate('/login', { replace: true, state: { passwordChanged: true } })
		} catch (changeError) {
			setError(changeError instanceof Error ? changeError.message : 'Unable to update the password.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form className="auth-form" onSubmit={handleSubmit}>
			<label>
				<span>Current temporary password</span>
				<input
					autoComplete="current-password"
					type="password"
					value={currentPassword}
					onChange={(event) => setCurrentPassword(event.target.value)}
					required
				/>
			</label>
			<label>
				<span>New password</span>
				<input
					autoComplete="new-password"
					type="password"
					value={newPassword}
					onChange={(event) => setNewPassword(event.target.value)}
					minLength={8}
					required
				/>
			</label>
			<label>
				<span>Confirm new password</span>
				<input
					autoComplete="new-password"
					type="password"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					minLength={8}
					required
				/>
			</label>
			{error && <p className="auth-form__error" role="alert">{error}</p>}
			<button className="auth-form__submit" type="submit" disabled={submitting}>
				{submitting ? 'Updating password…' : 'Update password'}
			</button>
			<p className="auth-form__note">The ERP requires at least 8 characters, including a letter and a number. You will sign in again after the update.</p>
		</form>
	)
}