export const hasConfiguredMenuPrivilege = (metadata?: Record<string, any>) => {
    if (!metadata || typeof metadata !== 'object') return false

    const menuPrivilege = metadata.menuPrivilege
    if (!menuPrivilege || typeof menuPrivilege !== 'object') return false

    const selectedUnitIds = Array.isArray(menuPrivilege.selectedUnitIds) ? menuPrivilege.selectedUnitIds : []
    const permissions = menuPrivilege.permissions && typeof menuPrivilege.permissions === 'object'
        ? Object.values(menuPrivilege.permissions)
        : []

    if (menuPrivilege.unitAccessMode === 'all') return true
    if (selectedUnitIds.length > 0) return true

    return permissions.some((permission) => (
        permission && typeof permission === 'object' && ((permission as any).view || (permission as any).createUpdate)
    ))
}
