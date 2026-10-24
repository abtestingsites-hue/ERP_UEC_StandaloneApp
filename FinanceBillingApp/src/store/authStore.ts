import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Role {
  id?: string;
  name?: string;
}

export interface UnitInfo {
  id: string;
  name: string;
  code?: string;
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

interface AuthState {
  token: string | null;
  user: User | null;
  activeUnitId: string | null;
  units: UnitInfo[];
  isAuthenticated: boolean;
  isInitialized: boolean;

  login: (token: string, user: User, units?: UnitInfo[], activeUnitId?: string) => void;
  logout: () => void;
  setActiveUnitId: (unitId: string | null) => void;
  setUnits: (units: UnitInfo[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeUnitId: null,
      units: [],
      isAuthenticated: false,
      isInitialized: true,

      login: (token: string, user: User, units: UnitInfo[] = [], activeUnitId?: string) => {
        const initialUnitId = activeUnitId || user.unitId || (units.length > 0 ? units[0].id : null);
        set({
          token,
          user,
          units,
          activeUnitId: initialUnitId,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      logout: () =>
        set({
          token: null,
          user: null,
          activeUnitId: null,
          units: [],
          isAuthenticated: false,
          isInitialized: true,
        }),

      setActiveUnitId: (unitId: string | null) =>
        set({ activeUnitId: unitId }),

      setUnits: (units: UnitInfo[]) =>
        set({ units }),
    }),
    {
      name: 'financebilling-auth-storage',
    }
  )
);
