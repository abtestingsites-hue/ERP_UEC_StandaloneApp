import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  FileText,
  Calendar,
  Receipt,
  FileSpreadsheet,
  LogOut,
  Building2,
  User,
  IndianRupee,
  Menu,
  X,
  Building,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, activeUnitId, units, setActiveUnitId, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out of Finance & Billing Portal.',
    });
    navigate('/login');
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setActiveUnitId(newUnit);
    toast({
      type: 'info',
      title: 'Active Unit Changed',
      message: `Active unit set to ${newUnit}`,
    });
  };

  const getUserDisplayName = () => {
    if (!user) return 'Finance User';
    if (user.name && user.name.trim()) return user.name;
    const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (full) return full;
    return user.email || 'Finance Manager';
  };

  const getUserRoleName = () => {
    if (!user?.role) return 'Finance Manager';
    if (typeof user.role === 'object' && user.role.name) return user.role.name;
    if (typeof user.role === 'string') return user.role;
    return 'Finance Manager';
  };

  const navGroups = [
    {
      title: 'Finance & Accounts',
      items: [
        { name: 'Finance Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
        { name: 'Elder Finance Dashboard', href: '/finance/elder-dashboard', icon: LayoutDashboard },
        { name: 'Cashbox Ledger', href: '/finance/cashbox', icon: Wallet },
        { name: 'Pending Approvals', href: '/finance/pending-approvals', icon: Clock },
        { name: 'Income Log', href: '/finance/income', icon: TrendingUp },
        { name: 'Expense Log', href: '/finance/expense', icon: TrendingDown },
        { name: 'In-House Expense', href: '/finance/inhouse-expense', icon: Building2 },
        { name: 'Invoice Registry', href: '/finance/invoice', icon: FileText },
        { name: 'Pending Payments', href: '/finance/pending-payments', icon: IndianRupee },
        { name: 'Allowance Tracking', href: '/finance/allowance-tracking', icon: Landmark },
        { name: 'Contract Renewals', href: '/finance/renewals', icon: Calendar },
        { name: 'Elder Care Billing', href: '/finance/elder-billing', icon: Receipt },
      ],
    },
    {
      title: 'Patient Billing',
      items: [
        { name: 'Patient Daily Cost', href: '/billing/patient-daily-cost', icon: Receipt },
        { name: 'Manual Patient Billing', href: '/billing/manual-billing', icon: FileSpreadsheet },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#F5F8FA] text-slate-800 dark:text-slate-200 overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#072E33] text-white flex flex-col border-r border-[#6DA5C0]/15 transition-transform duration-300 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-[#6DA5C0]/15 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base text-[#0F969C] tracking-wide">Finance & Billing</h1>
            <p className="text-[11px] text-slate-400">Healthcare ERP Standalone</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.title}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#0F969C] text-white shadow-sm font-semibold'
                            : 'text-[#B8D9E8] hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-[#0F969C] flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-[#6DA5C0]/15 bg-[#042024]">
          <div className="flex items-center gap-2 text-xs text-[#B8D9E8] mb-2">
            <User className="w-4 h-4 text-[#0F969C] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{getUserDisplayName()}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{getUserRoleName()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-rose-900/40 text-[#B8D9E8] hover:text-rose-400 rounded-lg transition-colors font-medium text-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-[#6DA5C0]/15 px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-600 dark:text-[#B8D9E8] hover:text-slate-900 dark:hover:text-white"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F969C]/10 text-[#0F969C] dark:bg-emerald-950/60 dark:text-[#0F969C] border border-[#0F969C]/20 dark:border-emerald-800">
              Standalone Port 5180
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Unit Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
              <Building className="w-3.5 h-3.5 text-[#0F969C]" />
              <label htmlFor="unit-selector" className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                Unit:
              </label>
              <select
                id="unit-selector"
                value={activeUnitId || 'ALL'}
                onChange={handleUnitChange}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {units.length > 0 ? (
                  units.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#072E33] text-white">
                      {u.name || u.code || u.id}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="UNIT_A" className="bg-[#072E33] text-white">Unit A (Care Home)</option>
                    <option value="UNIT_B" className="bg-slate-950 text-white">Unit B (Clinical Branch)</option>
                    <option value="ALL" className="bg-[#072E33] text-white">ALL (Facility Wide)</option>
                  </>
                )}
              </select>
            </div>

            {/* Profile Avatar / Badge */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 dark:border-[#6DA5C0]/15 pl-4 text-xs">
              <span className="font-semibold text-slate-700 dark:text-[#B8D9E8]">{getUserDisplayName()}</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
