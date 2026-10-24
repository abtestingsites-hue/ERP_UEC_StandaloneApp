import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'

interface RequirePermissionProps {
    permissions: string | string[]
    children: ReactNode
    fallback?: ReactNode
}

export function RequirePermission({ permissions, children, fallback = null }: RequirePermissionProps) {
    const { hasPermission } = usePermissions()

    if (hasPermission(permissions)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
