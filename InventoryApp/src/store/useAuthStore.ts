import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/axios';

export interface UnitInfo {
  id: string;
  name: string;
  code?: string;
  unitType?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string | { name?: string | null };
  permissions: string[];
  unitAccess: string[];
  unitId?: string;
  unit?: UnitInfo;
  tenantId?: string;
  mobile?: string | null;
  staffId?: string | null;
  empId?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  activeUnitId: string | null;
  units: UnitInfo[];
  login: (user: User, token: string, activeUnitId?: string | null) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setActiveUnitId: (unitId: string | null) => void;
  setUnits: (units: UnitInfo[]) => void;
  fetchAuthorizedUnits: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      activeUnitId: null,
      units: [],

      login: (user, token, preferredUnitId) => {
        // Resolve initial unit
        const initialUnitId =
          preferredUnitId !== undefined
            ? preferredUnitId
            : user.unitId ||
              (user.unitAccess && user.unitAccess.length > 0 && user.unitAccess[0] !== '*'
                ? user.unitAccess[0]
                : null);

        // Prepopulate units if user has unit info
        const initialUnits: UnitInfo[] = user.unit
          ? [user.unit]
          : [];

        set({
          user,
          token,
          isAuthenticated: true,
          isInitialized: true,
          activeUnitId: initialUnitId,
          units: initialUnits,
        });

        // Eagerly fetch full authorized units list in background
        get().fetchAuthorizedUnits();
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
          activeUnitId: null,
          units: [],
        });
      },

      setUser: (user) => {
        const state = get();
        set({
          user,
          isAuthenticated: Boolean(user && state.token),
          activeUnitId: user
            ? state.activeUnitId && (user.unitAccess?.includes('*') || user.unitAccess?.includes(state.activeUnitId))
              ? state.activeUnitId
              : user.unitId || state.activeUnitId || null
            : null,
        });
      },

      setToken: (token) => {
        const state = get();
        set({
          token,
          isAuthenticated: Boolean(state.user && token),
        });
      },

      setActiveUnitId: (unitId: string | null) => {
        set({ activeUnitId: unitId });
      },

      setUnits: (units: UnitInfo[]) => {
        set({ units });
      },

      fetchAuthorizedUnits: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await api.get('/master/units/authorized');
          if (res.data?.success && Array.isArray(res.data?.data)) {
            const unitsList: UnitInfo[] = res.data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              code: u.code,
              unitType: u.unitType,
            }));
            set({ units: unitsList });

            // If activeUnitId is not set, set it to the first unit if available
            const currentActive = get().activeUnitId;
            if (!currentActive && unitsList.length > 0) {
              set({ activeUnitId: unitsList[0].id });
            }
          }
        } catch (err) {
          // If authorized endpoint fails, fallback gracefully to existing units in store
          console.warn('Failed to load authorized units in InventoryApp:', err);
        }
      },
    }),
    {
      name: 'inventory-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: Boolean(state.user && state.token),
        activeUnitId: state.activeUnitId,
        units: state.units,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
          // Refresh authorized units on rehydration if logged in
          if (state.isAuthenticated && state.token) {
            state.fetchAuthorizedUnits();
          }
        }
      },
    }
  )
);

export const authStore = useAuthStore;
