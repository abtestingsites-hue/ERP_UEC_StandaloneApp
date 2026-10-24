import { User } from '../types/auth';

/**
 * RBAC Helper for CRMApp
 * Evaluates route access based on authenticated user's role string or permissions.
 */
export const canAccessCRMRoute = (route: string, user: User | null): boolean => {
  if (!user) return false;

  // Extract normalized role string
  let rawRole = user.role;
  if (rawRole && typeof rawRole === 'object' && 'name' in rawRole) {
    rawRole = (rawRole as any).name;
  }
  const role = String(rawRole || '').trim().toLowerCase();

  // Super Admin & Admin have full access
  if (role.includes('super_admin') || role.includes('super admin') || role.includes('admin')) {
    return true;
  }

  // Permissions check if present
  const permissions = user.permissions || [];
  if (permissions.includes('ALL_ACCESS')) {
    return true;
  }

  // Route-specific role authorization
  switch (route) {
    case '/dashboard':
      return true; // All authenticated users can access the landing dashboard

    case '/crm/dashboard':
      return role.includes('enquiry') || role.includes('manager') || role.includes('coordinator') || role.includes('director');

    case '/crm/new-enquiry':
      return role.includes('enquiry') || role.includes('coordinator') || role.includes('admissions') || role.includes('b2p');

    case '/crm/active-enquiries':
      return role.includes('enquiry') || role.includes('follow') || role.includes('manager') || role.includes('b2p');

    case '/crm/enquiry-follow-up':
      return role.includes('follow') || role.includes('enquiry') || role.includes('coordinator') || role.includes('customer');

    case '/crm/clients':
      return true; // Directory is readable across CRM roles

    case '/crm/b2p':
      return role.includes('b2p') || role.includes('marketing') || role.includes('partner') || role.includes('manager');

    case '/crm/customer-care':
      return role.includes('customer') || role.includes('care') || role.includes('relations') || role.includes('feedback') || role.includes('manager');

    case '/crm/marketing':
      return role.includes('marketing') || role.includes('b2p') || role.includes('manager');

    default:
      return true;
  }
};
