import type { AuthUser } from '../types/auth'

export function getRoleName(user: AuthUser | null | undefined): string {
	if (!user?.role) return ''
	if (typeof user.role === 'string') return user.role
	return user.role.name || ''
}

export function normalizeRole(user: AuthUser | null | undefined): string {
	return getRoleName(user).toUpperCase().replace(/[\s-]+/g, '_').trim()
}

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
	if (!user) return false
	if (user.permissions?.includes('ALL_ACCESS')) return true
	const roleName = normalizeRole(user)
	return (
		roleName === 'ADMIN' ||
		roleName === 'SUPER_ADMIN' ||
		roleName === 'SUPERADMIN' ||
		roleName === 'UNCF_ADMIN' ||
		roleName === 'UEO_ADMIN' ||
		roleName === 'ADMINISTRATIVE'
	)
}

/**
 * Returns the exact list of domain IDs permitted for the authenticated user's navigation.
 * Implements the strict, authorization-aware navigation policy required by Phase 16B:
 *
 * - SuperAdmin: Dashboard + all 9 business domains + Central Reports
 * - Nursing Manager: Inhouse Care ONLY
 * - Nursing Staff: Inhouse Care staff workspace ONLY
 * - Home Care Manager: Home Care ONLY
 * - Home Care Caregiver: Home Care caregiver workspace ONLY
 * - Inventory Manager: Inventory ONLY
 * - Finance Manager: Finance ONLY
 * - HR Manager: HR & Operations ONLY
 * - Ambulance Coordinator: Ambulance ONLY
 * - Other dedicated roles (Admissions, Security, Donors): their respective single domain
 */
export function getPermittedDomainsForUser(user: AuthUser | null | undefined): string[] {
	if (!user) return []

	if (isSuperAdmin(user)) {
		return [
			'crm',
			'inventory',
			'admission',
			'inhouse-care',
			'home-care',
			'visitor-security',
			'donors-volunteers',
			'finance',
			'hr-operations',
			'ambulance',
			'reports',
		]
	}

	const roleName = normalizeRole(user)
	const unitCode = (user.unit?.code || '').toUpperCase().trim()

	// 1. Nursing Manager: Inhouse Care ONLY
	if (
		roleName === 'NURSING_MANAGER' ||
		roleName === 'IN_HOUSE_CARE_MANAGER' ||
		roleName === 'PATIENT_CARE_MANAGER' ||
		roleName === 'MEDICAL_MANAGER' ||
		roleName === 'MEDICAL_DOCTOR' ||
		roleName === 'ELDER_CARE_ADMIN'
	) {
		return ['inhouse-care']
	}

	// 2. Nursing Staff: Inhouse Care staff workspace ONLY
	if (
		roleName === 'NURSING_CARE_STAFF' ||
		roleName === 'NURSING_STAFF' ||
		roleName === 'NURSE' ||
		roleName === 'STAFF_NURSE'
	) {
		return ['inhouse-care']
	}

	// 3. Home Care Manager: Home Care ONLY
	if (
		roleName === 'HOME_CARE_MANAGER' ||
		roleName === 'CARE_ALLOCATION_MANAGER'
	) {
		return ['home-care']
	}

	// 4. Home Care Caregiver / Patient Care Staff:
	// If caregiver role or assigned to UHC / home care: Home Care ONLY
	if (
		roleName === 'CAREGIVER' ||
		(roleName === 'PATIENT_CARE_STAFF' && (unitCode === 'UHC' || roleName.includes('HOME')))
	) {
		return ['home-care']
	}

	// Inhouse Patient Care Staff (if not home care): Inhouse Care ONLY
	if (roleName === 'PATIENT_CARE_STAFF') {
		return ['inhouse-care']
	}

	// 5. Inventory Manager & Pharmacy Staff: Inventory ONLY
	if (roleName.includes('INVENTORY')) {
		return ['inventory']
	}

	// 6. Finance Manager & Billing Staff: Finance ONLY
	if (roleName.includes('FINANCE')) {
		return ['finance']
	}

	// 7. HR Manager & Operations Staff: HR & Operations ONLY
	if (
		roleName.includes('HR') ||
		roleName.includes('OPERATIONS') ||
		roleName === 'EMPLOYEE'
	) {
		return ['hr-operations']
	}

	// 8. Ambulance Coordinator / Dispatch / Fleet: Ambulance ONLY
	if (
		roleName.includes('AMBULANCE') ||
		roleName.includes('DISPATCH') ||
		roleName.includes('FLEET') ||
		roleName === 'UA_ADMIN' ||
		roleName.includes('EMERGENCY_CALL')
	) {
		return ['ambulance']
	}

	// 9. Dedicated Admission / CRM / Enquiry Officers / CRM Agents: Admission & CRM
	if (
		roleName.includes('CRM') ||
		roleName === 'AGENT' ||
		roleName.includes('AGENT') ||
		roleName.includes('SUPERVISOR') ||
		roleName.includes('CUSTOMERCARE') ||
		roleName.includes('CUSTOMER_CARE')
	) {
		return ['crm', 'admission']
	}
	if (
		roleName.includes('ADMISSION') ||
		roleName.includes('ENQUIRY')
	) {
		return ['admission', 'crm']
	}

	// 10. Security Supervisor & Staff / Front Desk: Visitor & Security ONLY
	if (
		roleName.includes('SECURITY') ||
		roleName === 'FRONTDESK' ||
		roleName.includes('FRONT_DESK')
	) {
		return ['visitor-security']
	}

	// 11. Donors & Volunteers: Donors & Volunteers ONLY
	if (
		roleName.includes('DONAT') ||
		roleName.includes('DONOR') ||
		roleName.includes('VOLUNTEER')
	) {
		return ['donors-volunteers']
	}

	// Unknown or unrecognized roles do not receive permissive fallbacks
	return []
}

export function canAccessDomain(domainId: string, user: AuthUser | null | undefined): boolean {
	if (!user) return false
	if (isSuperAdmin(user)) return true
	const roleName = normalizeRole(user)
	if (domainId === 'portal' && (roleName.includes('GUARDIAN') || roleName.includes('FAMILY') || roleName.includes('PORTAL'))) {
		return true
	}
	return getPermittedDomainsForUser(user).includes(domainId)
}

export function getDefaultRouteForUser(user: AuthUser | null | undefined): string {
	if (!user) return '/login'
	if (user.mustChangePassword) return '/change-temporary-password'
	if (isSuperAdmin(user)) return '/dashboard'

	const roleName = normalizeRole(user)
	if (roleName.includes('GUARDIAN') || roleName.includes('FAMILY') || roleName.includes('PORTAL')) {
		return '/portal/dashboard'
	}

	const permitted = getPermittedDomainsForUser(user)
	if (permitted.length > 0) {
		return `/${permitted[0]}`
	}

	return '/login'
}

