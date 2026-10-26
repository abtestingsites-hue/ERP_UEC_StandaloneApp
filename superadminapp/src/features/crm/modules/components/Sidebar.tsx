"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from '../nextShim';
import { Phone, Users, LayoutDashboard, MessageSquare, FileText, Settings, Shield, Activity, Calendar, LogOut, History, CopyCheck } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import Link from '../nextShim';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { status, setStatus } = useCallStore();
  const { user, logout } = useAuthStore();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Read user from store or fallback to local storage
    if (user) {
      setCurrentUser(user);
    } else {
      try {
        const stored = localStorage.getItem('paramantra_user') || localStorage.getItem('crm_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('paramantra_access_token');
    localStorage.removeItem('paramantra_refresh_token');
    sessionStorage.removeItem('superadmin-erp-session');
    router.push('/login');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'BUSY': return 'bg-amber-500 shadow-amber-500/50';
      case 'ON_CALL': return 'bg-rose-500 shadow-rose-500/50';
      case 'WRAP_UP': return 'bg-purple-500 shadow-purple-500/50';
      default: return 'bg-slate-500 shadow-slate-500/50';
    }
  };

  // Dynamic menu filtration based on user roles
  const userRole = currentUser?.role || 'AGENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'SUPERVISOR';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Command Center', href: isAdmin ? '/dashboard' : '/agent/dashboard', visible: true },
    { icon: Phone, label: 'Call Center', href: '/call-center', visible: true },
    { icon: History, label: 'Call Logs', href: '/call-logs', visible: true },
    { icon: MessageSquare, label: 'Omnichannel', href: '/omnichannel', visible: true },
    { icon: Users, label: 'Customers', href: '/customers', visible: true },
    { icon: Shield, label: 'Lead Pool', href: '/leads/pool', visible: true },
    { icon: CopyCheck, label: 'Duplicate Leads', href: '/leads/duplicates', visible: true },
    { icon: Calendar, label: 'Calendar Log', href: '/calendar', visible: true },
    { icon: FileText, label: 'Reports', href: '/reports', visible: isAdmin },
    { icon: Settings, label: 'Org Settings', href: '/settings', visible: isAdmin },
  ];

  return (
    <div className="w-72 h-screen border-r border-[#E1E6E1] bg-white text-[#202020] flex flex-col pt-6 pb-4 shrink-0 shadow-sm">
      {/* Brand */}
      <div className="px-6 flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#039A01] to-[#028001] flex items-center justify-center shadow-md shadow-[#039A01]/20">
          <Shield className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-[#202020]">ElderCare</h1>
          <p className="text-[9px] text-[#5F6962] font-bold tracking-wider uppercase">CRM Enterprise</p>
        </div>
      </div>

      {/* Agent Status Component */}
      <div className="px-6 mb-6">
        <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E1E6E1]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#5F6962]">Agent Queue Status</span>
            <div className="relative flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${getStatusColor()}`}></span>
              {status !== 'OFFLINE' && (
                <span className={`absolute w-2.5 h-2.5 rounded-full animate-ping opacity-75 ${getStatusColor()}`}></span>
              )}
            </div>
          </div>
          <select
            aria-label="Agent availability status" value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-white border border-[#E1E6E1] rounded-lg px-2.5 py-1.5 text-xs text-[#202020] outline-none focus:border-[#039A01]"
          >
            <option value="AVAILABLE">🟢 Available</option>
            <option value="BUSY">🟠 Busy (Break)</option>
            <option value="ON_CALL">🔴 On Call</option>
            <option value="WRAP_UP">🟣 Wrap Up</option>
            <option value="OFFLINE">⚫ Offline</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
        {menuItems
          .filter((item) => item.visible)
          .map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link href={item.href} key={i}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 group text-left mb-1 ${
                    isActive
                      ? 'bg-[#E7F4E8] border border-[#C8E6CA] text-[#026601] shadow-sm'
                      : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020] border border-transparent'
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#039A01]' : 'text-[#849389] group-hover:text-[#039A01] transition-colors'
                    }`}
                  />
                  <span className="font-semibold text-xs tracking-wide">{item.label}</span>
                </button>
              </Link>
            );
          })}
      </div>

      {/* Return to ERP Workspace */}
      <div className="px-4 mb-2">
        <a 
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#E7F4E8] hover:bg-[#039A01] border border-[#C8E6CA] text-[#026601] hover:text-white text-xs font-semibold transition-all no-underline shadow-sm"
        >
          Return to ERP Workspace →
        </a>
      </div>

      {/* User Profile Footer */}
      <div className="px-4 mt-auto border-t border-[#E1E6E1] pt-4">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7F5] transition-colors relative group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#039A01] to-[#028001] flex items-center justify-center font-bold text-white text-sm shadow">
            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-bold text-[#202020] truncate">{currentUser?.email?.split('@')[0] || 'Agent Smith'}</p>
            <p className="text-[10px] text-[#5F6962] font-bold tracking-wider uppercase truncate">{currentUser?.role || 'CRM Agent'}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log Out Session"
            className="p-1.5 rounded-lg text-[#849389] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
