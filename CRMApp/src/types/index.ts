export * from './auth';

export interface BaseEntity {
  id: string;
  tenantId: string;
  unitId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | number;
}
