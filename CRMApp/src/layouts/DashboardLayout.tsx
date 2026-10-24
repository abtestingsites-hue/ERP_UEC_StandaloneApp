import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../lib/queryClient';
import { canAccessCRMRoute } from '../lib/access';
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  CalendarCheck,
  Users,
  Briefcase,
  Headset,
  TrendingUp,
  LogOut,
  Building2,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, units, activeUnitId, setActiveUnitId, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const handleUnitChange = (newUnitId: string) => {
    setActiveUnitId(newUnitId === 'ALL' ? 'ALL' : newUnitId);
    // Invalidate query cache so unit-sensitive queries refresh cleanly
    queryClient.invalidateQueries();
  };

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Enquiry', href: '/crm/new-enquiry', icon: PlusCircle },
    { name: 'Active Leads', href: '/crm/active-enquiries', icon: Activity },
    { name: 'Follow-ups', href: '/crm/enquiry-follow-up', icon: CalendarCheck },
    { name: 'Clients', href: '/crm/clients', icon: Users },
    { name: 'B2P / Referrals', href: '/crm/b2p', icon: Briefcase },
    { name: 'Customer Care', href: '/crm/customer-care', icon: Headset },
    { name: 'Marketing', href: '/crm/marketing', icon: TrendingUp },
  ];

  // Filter navigation items based on user RBAC permissions
  const navItems = allNavItems.filter((item) => canAccessCRMRoute(item.href, user));

  const getRoleLabel = () => {
    if (!user?.role) return 'CRM User';
    if (typeof user.role === 'object') return (user.role as any).name || 'CRM User';
    return String(user.role);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-600/10">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">CRMApp</h1>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise CRM Desk</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            CRM Modules
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || user?.email || 'CRM Coordinator'}</p>
              <p className="text-xs text-indigo-400 font-medium truncate capitalize">{getRoleLabel()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/40 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-300 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          {/* Left: Mobile Menu Trigger & Security Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standalone CRM Workspace (Port 5181)</span>
            </div>
          </div>

          {/* Right: Active Unit Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={activeUnitId || 'ALL'}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">All Units / Enterprise</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
            <div className="w-64 bg-slate-900 h-full border-r border-slate-800 flex flex-col p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Headset className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-slate-100">CRMApp</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-800 mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 rounded-xl text-xs font-medium text-slate-300 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
