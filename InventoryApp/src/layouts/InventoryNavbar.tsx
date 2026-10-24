import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, User, ShieldCheck, Boxes } from 'lucide-react';
import { UnitSwitcher } from '../components/UnitSwitcher';
import { DomainSwitcher } from '../components/DomainSwitcher';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const InventoryNavbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleLabel = () => {
    if (!user?.role) return 'Inventory User';
    if (typeof user.role === 'object') return (user.role as any).name || 'Inventory User';
    return String(user.role);
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Left: Mobile hamburger & branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100">Inventory Management</span>
            <span className="hidden sm:inline-block text-[11px] text-emerald-400 font-medium ml-2 px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/40 rounded-full">
              Standalone App
            </span>
          </div>
        </div>
      </div>

      {/* Center: System status indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Multi-Tenant & Unit Isolated Engine</span>
      </div>

      {/* Right: Domain Switcher, Unit Switcher & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Domain Switcher (Medical vs Food & Ration) */}
        <DomainSwitcher />

        {/* Dynamic Unit Switcher */}
        <UnitSwitcher />

        {/* User Card */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-right">
          <div>
            <p className="text-xs font-semibold text-slate-200 max-w-[130px] truncate">
              {user?.name || user?.email || 'Admin'}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium truncate uppercase">
              {getRoleLabel()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/30 border border-transparent rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
