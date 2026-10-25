"use client";

import { useState, useEffect, useRef } from 'react';
import Link from '../../nextShim';
import { Search, Bell, Clock, AlertTriangle, Activity, CheckCircle2, Users, LogOut } from 'lucide-react';
import { useQueueStore } from '../../store/queueStore';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function Navbar() {
  const { callsInQueue, emergencyAlerts } = useQueueStore();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState('Enterprise CRM');
  const [userInitials, setUserInitials] = useState('AD');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeAgentsCount, setActiveAgentsCount] = useState<number | null>(null);
  const [agentBreakdown, setAgentBreakdown] = useState<{ available: number; busy: number; wrapUp: number }>({ available: 0, busy: 0, wrapUp: 0 });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('crm_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const emailPrefix = user.email ? user.email.split('@')[0] : 'Admin';
        const displayName = user.name || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
        setUserName(displayName);
        setUserInitials(displayName.substring(0, 2).toUpperCase());
        if (user.role) {
          const formattedRole = user.role.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
          setUserRole(formattedRole);
          if (user.role === 'SUPER_ADMIN') {
            setIsSuperAdmin(true);
          }
        }
      }
    } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let isMounted = true;

    const fetchActiveCount = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('paramantra_access_token') || localStorage.getItem('crm_token');
        if (!token) return;
        const res = await apiFetch('/api/v1/super-admin/active-agents');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && typeof data.count === 'number') {
            setActiveAgentsCount(data.count);
            if (data.breakdown) {
              setAgentBreakdown(data.breakdown);
            }
          }
        }
      } catch (err) {
        // Silently preserve existing state
      }
    };

    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('paramantra_access_token');
    localStorage.removeItem('paramantra_refresh_token');
    sessionStorage.removeItem('superadmin-erp-session');
    window.location.href = '/login';
  };

  return (
    <header className="h-[60px] bg-[#FFFFFF] border-b border-[#E1E6E1] flex items-center justify-between px-6 z-50 sticky top-0 text-[#202020]">
      {/* Global Search */}
      <div className="max-w-md w-full relative group">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962] group-focus-within:text-[#039A01] transition-colors" />
        <input 
          aria-label="Global search" 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers, cases, or tickets (Press /)" 
          className="w-full bg-[#FAFCFA] border border-[#E1E6E1] focus:border-[#039A01] rounded-lg pl-10 pr-4 py-1.5 text-xs outline-none text-[#202020] transition-all placeholder-[#849389]"
        />
      </div>

      {/* Right Utility Stats & Profile */}
      <div className="flex items-center gap-4">
        {callsInQueue > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8E6] border border-[#FBE5AC] text-[#78350F] text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{callsInQueue} In Queue</span>
          </div>
        )}

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FAFCFA] border border-[#E1E6E1] hover:border-[#039A01] hover:bg-[#E7F4E8] text-[#5F6962] hover:text-[#026601] transition-all relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#202020] leading-tight">{userName}</p>
            <p className="text-[10px] text-[#5F6962]">{userRole}</p>
          </div>
          <div 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-8 h-8 rounded-full bg-[#039A01] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs hover:scale-105 transition-transform"
          >
            {userInitials}
          </div>

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-lg overflow-hidden transition-all z-50 text-[#202020]">
              <a
                href="/dashboard"
                onClick={() => setShowProfileDropdown(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#E7F4E8] text-[#026601] text-xs font-medium transition-colors border-b border-[#E1E6E1] no-underline"
              >
                Return to ERP Workspace →
              </a>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#FDF2F2] hover:text-[#B91C1C] text-[#5F6962] text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
