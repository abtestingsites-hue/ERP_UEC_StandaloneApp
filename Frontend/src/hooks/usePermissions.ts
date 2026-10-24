import { useAuthStore } from '../store/authStore'
import { useMemo } from 'react'
import { hasAllAccess, hasUnitAccess as hasUnitAccessForUser } from '../lib/access'

export function usePermissions() {
    const user = useAuthStore(state => state.user)

    const hasPermission = (requiredPermission: string | string[]) => {
        if (!user) return false

        // System-wide admin bypass
        if (hasAllAccess(user)) return true

        if (Array.isArray(requiredPermission)) {
            return requiredPermission.some(req => user.permissions.includes(req))
        }

        return user.permissions.includes(requiredPermission)
    }

    const hasUnitAccess = (unitId: string) => {
        return hasUnitAccessForUser(user, unitId)
    }

    // Pre-computed common checks for UI convenience
    const isAccountsViewable = useMemo(() => hasPermission(['ACCOUNTS_VIEW', 'ACCOUNTS_MANAGE']), [user])
    const isHRViewable = useMemo(() => hasPermission(['HR_VIEW', 'HR_MANAGE']), [user])
    const isMasterViewable = useMemo(() => hasPermission('MASTER_MANAGE'), [user])

    return {
        hasPermission,
        hasUnitAccess,
        isAccountsViewable,
        isHRViewable,
        isMasterViewable
    }
}
