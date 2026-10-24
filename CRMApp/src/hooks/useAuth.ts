import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, activeUnitId, units, isAuthenticated, login, logout, setActiveUnitId, setUnits } = useAuthStore();

  return {
    user,
    token,
    activeUnitId,
    units,
    isAuthenticated,
    login,
    logout,
    setActiveUnitId,
    setUnits,
  };
};
