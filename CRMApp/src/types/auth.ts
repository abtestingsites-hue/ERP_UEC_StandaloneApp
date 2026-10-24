export interface Role {
  id?: string;
  name?: string;
}

export interface UnitInfo {
  id: string;
  name: string;
  code?: string;
  unitType?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string | Role | null;
  tenantId: string;
  unitId?: string | null;
  unit?: UnitInfo | null;
  unitAccess?: string[];
  permissions?: string[];
  staffId?: string;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  user?: User;
  data?: any;
}
