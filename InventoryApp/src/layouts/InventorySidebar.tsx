import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Send,
  AlertTriangle,
  History,
  Users,
  X,
  Boxes,
  LogOut,
  Clock,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { hasPermission, INVENTORY_PERMISSIONS } from '../lib/permissions';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

export const InventorySidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems: NavItem[] = [
    {
      name: 'Command Center',
      href: '/app/dashboard',
      icon: LayoutDashboard,
      permission: INVENTORY_PERMISSIONS.VIEW_ALL,
    },
    {
      name: 'Product Master',
      href: '/app/products',
      icon: Package,
      permission: INVENTORY_PERMISSIONS.PRODUCTS_VIEW,
    },
    {
      name: 'Stock & Batches',
      href: '/app/stock',
      icon: Layers,
      permission: INVENTORY_PERMISSIONS.STOCK_VIEW,
    },
    {
      name: 'Purchase Orders',
      href: '/app/purchases',
      icon: ShoppingCart,
      permission: INVENTORY_PERMISSIONS.PURCHASES_VIEW,
    },
    {
      name: 'Issue Requests',
      href: '/app/issues',
      icon: Send,
      permission: INVENTORY_PERMISSIONS.ISSUES_VIEW,
    },
    {
      name: 'Low Stock Alerts',
      href: '/app/low-stock',
      icon: AlertTriangle,
      permission: INVENTORY_PERMISSIONS.STOCK_VIEW,
    },
    {
      name: 'Expiry Alerts',
      href: '/app/expiry-alerts',
      icon: Clock,
      permission: INVENTORY_PERMISSIONS.STOCK_VIEW,
    },
    {
      name: 'Stock Movements',
      href: '/app/movements',
      icon: History,
      permission: INVENTORY_PERMISSIONS.MOVEMENTS_VIEW,
    },
    {
      name: 'Valuation & Analytics',
      href: '/app/analytics',
      icon: TrendingUp,
      permission: INVENTORY_PERMISSIONS.STOCK_VIEW,
    },
    {
      name: 'Physical Stock Audit',
      href: '/app/audit',
      icon: ClipboardCheck,
      permission: INVENTORY_PERMISSIONS.STOCK_VIEW,
    },
    {
      name: 'Vendor Directory',
      href: '/app/vendors',
      icon: Users,
      permission: INVENTORY_PERMISSIONS.VENDOR_VIEW,
    },
  ];

  // Filter items based on user's permissions
  const visibleNavItems = navItems.filter((item) => hasPermission(user, item.permission));

  const getRoleLabel = () => {
    if (!user?.role) return 'Inventory User';
    if (typeof user.role === 'object') return (user.role as any).name || 'Inventory User';
    return String(user.role);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-600/10">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">InventoryApp</h1>
            <p className="text-[11px] text-slate-400 font-medium">Logistics Workspace</p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Inventory Sections
        </div>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/60 font-semibold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Card & Logout in Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0">
        <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl mb-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-500 truncate">{getRoleLabel()}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/40 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-300 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
