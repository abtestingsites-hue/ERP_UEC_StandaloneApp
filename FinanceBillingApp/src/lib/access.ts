import type { User } from '../store/authStore'

export const hasAllAccess = (user: User | null | undefined) => {
    if (!user) return false
    return Boolean(user?.permissions?.includes('ALL_ACCESS') && !user?.staffId)
}

export const hasUnitAccess = (user: User | null | undefined, unitId: string) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    return user.unitAccess?.includes('*') || user.unitAccess?.includes(unitId)
}
