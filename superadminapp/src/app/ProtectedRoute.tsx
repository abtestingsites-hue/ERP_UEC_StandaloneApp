import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function ProtectedRoute() {
	const { session } = useAuth()
	const location = useLocation()

	if (!session) {
		return <Navigate to="/login" replace state={{ from: location }} />
	}

	const changePasswordPath = '/change-temporary-password'
	if (session.user.mustChangePassword && location.pathname !== changePasswordPath) {
		return <Navigate to={changePasswordPath} replace />
	}
	if (!session.user.mustChangePassword && location.pathname === changePasswordPath) {
		return <Navigate to="/dashboard" replace />
	}

	return <Outlet />
}
