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
    <header className="h-[64px] bg-white border-b border-[#E1E6E1] flex items-center justify-between px-6 shrink-0 relative z-50 text-[#202020]">
      {/* Global Search */}
      <div className="max-w-md w-full relative group">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849389] group-focus-within:text-[#039A01] transition-colors" />
        <input 
          aria-label="Global search" 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers, cases, or tickets (Press /)" 
          className="w-full bg-[#F5F7F5] border border-[#E1E6E1] focus:border-[#039A01] rounded-full pl-10 pr-4 py-1.5 text-xs outline-none text-[#202020] transition-all placeholder-[#849389]"
        />
      </div>

      {/* Right Utility Stats & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#C8E6CA] text-[10px] font-semibold text-[#026601] cursor-pointer bg-[#E7F4E8]"
          >
            <Activity className="w-3 h-3 text-[#039A01]" />
            Live Mode
          </motion.div>

          {isSuperAdmin && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              title={`Active Agents: ${agentBreakdown.available} Available, ${agentBreakdown.busy} Busy`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#C8E6CA] bg-[#E7F4E8] text-[10px] font-medium text-[#026601] cursor-pointer"
            >
              <Users className="w-3 h-3 text-[#039A01]" />
              <span className="font-bold text-[#026601]">{activeAgentsCount !== null ? activeAgentsCount : '2'}</span>
              <span>Active Agents</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#039A01] animate-pulse ml-0.5"></span>
            </motion.div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#F8C8C8] bg-[#FDF2F2] text-[10px] font-medium text-[#B91C1C]">
            <AlertTriangle className="w-3 h-3 text-[#B91C1C]" />
            {emergencyAlerts || 0} Emergencies
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#F3EE7B] bg-[#FEFDE6] text-[10px] font-medium text-[#736902]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#736902]"></div>
            {callsInQueue || 0} in Queue
          </div>
        </div>

        <div className="w-px h-6 bg-[#E1E6E1]"></div>

        {/* Clock & Notifications */}
        <div className="flex items-center gap-4">
          <div className="text-xs font-semibold flex items-center gap-1.5 text-[#202020]">
            <Clock className="w-3.5 h-3.5 text-[#5F6962]" />
            {timeStr}
          </div>

          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Profile Badge */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F5F7F5] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#039A01] to-[#026601] flex items-center justify-center font-bold text-xs text-white shadow-xs">
                {userInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#202020] leading-tight">{userName}</span>
                <span className="text-[10px] text-[#5F6962] leading-tight">{userRole}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E1E6E1] rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3 py-2 border-b border-[#E1E6E1]">
                  <p className="text-xs font-bold text-[#202020] truncate">{userName}</p>
                  <p className="text-[10px] text-[#5F6962] truncate">{userRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
