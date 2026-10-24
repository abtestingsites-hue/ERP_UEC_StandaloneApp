import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string | { id: string; name: string } | null;
  unitId?: string;
  unitAccess?: string[];
  unitName?: string;
  organizationId?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  activeUnitId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setActiveUnitId: (unitId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeUnitId: null,
      isAuthenticated: false,

      setAuth: (token: string, user: User) => {
        const initialUnitId = user.unitId || (user.unitAccess && user.unitAccess.length > 0 ? user.unitAccess[0] : null);
        set({
          token,
          user,
          activeUnitId: initialUnitId,
          isAuthenticated: true,
        });
      },

      setActiveUnitId: (unitId: string) => {
        set({ activeUnitId: unitId });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          activeUnitId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'visitor-auth-storage',
    }
  )
);
