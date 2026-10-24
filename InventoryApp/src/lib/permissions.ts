import type { User } from '../store/useAuthStore';

export const INVENTORY_PERMISSIONS = {
  VIEW_ALL: 'inventory.view',
  MANAGE_ALL: 'inventory.manage',
  PRODUCTS_VIEW: 'inventory.products.view',
  PRODUCTS_MANAGE: 'inventory.products.manage',
  STOCK_VIEW: 'inventory.stock.view',
  STOCK_MANAGE: 'inventory.stock.manage',
  PURCHASES_VIEW: 'inventory.purchases.view',
  PURCHASES_MANAGE: 'inventory.purchases.manage',
  ISSUES_VIEW: 'inventory.issues.view',
  ISSUES_MANAGE: 'inventory.issues.manage',
  MOVEMENTS_VIEW: 'inventory.movements.view',
  MOVEMENTS_MANAGE: 'inventory.movements.manage',
  VENDOR_VIEW: 'vendor.view',
} as const;

export const ERP_PERMISSION_MAP: Record<string, string[]> = {
  'inventory.view': [
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'Stock',
    'Products',
    'Inventory Products',
    'Purchase Orders',
    'inventory.view',
  ],
  'inventory.manage': [
    'Stock Issue Approval',
    'Stock',
    'Purchase Orders',
    'inventory.manage',
  ],
  'inventory.products.view': [
    'Products',
    'Inventory Products',
    'Ration Products',
    'Stationary Products',
    'Electrical & Plumbing',
    'Stock',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'inventory.products.view',
  ],
  'inventory.products.manage': [
    'Products',
    'Inventory Products',
    'inventory.products.manage',
  ],
  'inventory.stock.view': [
    'Stock',
    'Low Stock Alerts',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'inventory.stock.view',
  ],
  'inventory.stock.manage': [
    'Stock',
    'inventory.stock.manage',
  ],
  'inventory.purchases.view': [
    'Purchase Orders',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'Stock',
    'inventory.purchases.view',
  ],
  'inventory.purchases.manage': [
    'Purchase Orders',
    'inventory.purchases.manage',
  ],
  'inventory.issues.view': [
    'Stock Issue',
    'Stock Issue Request',
    'Stock Issue Approval',
    'Medicine Requests',
    'Medicine Issue Log',
    'Medication Schedule',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'inventory.issues.view',
  ],
  'inventory.issues.manage': [
    'Stock Issue Approval',
    'Stock Issue Request',
    'Stock Issue',
    'inventory.issues.manage',
  ],
  'inventory.movements.view': [
    'Stock Movements',
    'Stock',
    'Elder Inventory Dashboard',
    'Medical Inventory Dashboard',
    'inventory.movements.view',
  ],
  'inventory.movements.manage': [
    'Stock Movements',
    'inventory.movements.manage',
  ],
  'vendor.view': [
    'Vendor Master',
    'Purchase Orders',
    'vendor.view',
  ],
};

export function hasPermission(user: User | null | undefined, permission?: string | string[]): boolean {
  if (!user) return false;

  const roleName =
    typeof user.role === 'string'
      ? user.role
      : typeof user.role === 'object' && user.role !== null && 'name' in user.role
      ? (user.role as { name?: string }).name
      : '';

  const normalizedRole = String(roleName || '').trim().toUpperCase();

  // SuperAdmins, Admins, and Inventory Managers have full operational access
  const adminRoles = [
    'ADMIN',
    'SUPER_ADMIN',
    'SUPERADMIN',
    'SYSTEM_ADMIN',
    'UNCF_ADMIN',
    'INVENTORY_MANAGER',
    'INVENTORY MANAGER',
    'ELDER_INVENTORY_MANAGER',
    'MEDICAL_INVENTORY_MANAGER',
    'ELDER_CARE_ADMIN',
    'UHC_ADMIN',
  ];
  if (adminRoles.includes(normalizedRole)) {
    return true;
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  if (permissions.includes('ALL_ACCESS') || permissions.includes('*')) {
    return true;
  }

  if (!permission) return true;

  const requiredPermissions = Array.isArray(permission) ? permission : [permission];

  return requiredPermissions.some((reqPerm) => {
    // 1. Direct match
    if (permissions.includes(reqPerm)) return true;

    // 2. Mapped legacy ERP permission labels
    const mappedLabels = ERP_PERMISSION_MAP[reqPerm];
    if (mappedLabels && mappedLabels.some((label) => permissions.includes(label))) {
      return true;
    }

    // 3. Check wildcard prefix e.g. "inventory.*" matches "inventory.view"
    const prefix = reqPerm.split('.')[0];
    if (permissions.includes(`${prefix}.*`) || permissions.includes(`${prefix}.manage`)) {
      return true;
    }

    return false;
  });
}
