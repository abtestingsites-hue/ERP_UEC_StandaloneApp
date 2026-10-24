import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { canAccessPath, getDefaultRouteForUser, getRolePreferredRedirectPath, hasPermissionAccess } from '../lib/access'
import { GlobalSpinner } from './SkeletonLoader'

interface ProtectedRouteProps {
    requiredPermissions?: string[]
}

export function ProtectedRoute({ requiredPermissions }: ProtectedRouteProps) {
    const { hasHydrated, isAuthenticated, token, user } = useAuthStore()
    const location = useLocation()

    if (!hasHydrated) {
        return <GlobalSpinner />
    }

    if (!isAuthenticated || !token || !user) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />
    }

    const preferredRedirectPath = getRolePreferredRedirectPath(user, location.pathname)
    if (preferredRedirectPath && preferredRedirectPath !== location.pathname) {
        return <Navigate to={preferredRedirectPath} replace />
    }

    // Basic RBAC check if requiredPermissions are passed at route level
    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermission = hasPermissionAccess(user, requiredPermissions)

        if (!hasPermission) {
            return <Navigate to={getDefaultRouteForUser(user)} replace />
        }
    }

    if (!canAccessPath(user, location.pathname)) {
        return <Navigate to={getDefaultRouteForUser(user)} replace />
    }

    return <Outlet />
}
