import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UnitInfo } from '../types/auth';

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
      name: 'crm_auth_storage', // Unique local storage key for CRMApp
    }
  )
);
