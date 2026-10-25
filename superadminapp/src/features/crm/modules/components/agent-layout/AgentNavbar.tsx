"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from '../../nextShim';
import { Search, Bell, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentNavbar() {
  const [time, setTime] = useState<Date | null>(null);
  const [user, setUser] = useState<{name: string, email: string, avatarUrl?: string} | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mockNotifications: any[] = [];

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('crm_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
    }
  }, []);

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
    <header className="h-[60px] border-b border-[#E1E6E1] bg-[#FFFFFF] flex items-center justify-between px-6 shrink-0 relative z-50 text-[#202020]">
      
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6962] group-focus-within:text-[#039A01] transition-colors" />
          <input 
            aria-label="Search tasks, customers, or calls"
            type="text" 
            id="agent-navbar-search"
            placeholder="Search tasks, customers, or calls..." 
            className="w-full bg-[#FAFCFA] border border-[#E1E6E1] focus:border-[#039A01] rounded-lg pl-10 pr-4 py-1.5 text-xs outline-none text-[#202020] transition-all placeholder-[#849389]"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 ml-6">
        
        {/* Clock */}
        {time && (
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-[#202020] tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-[#5F6962] uppercase tracking-wider font-semibold">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        <div className="h-6 w-px bg-[#E1E6E1] hidden md:block"></div>

        {/* Notification */}
        <div className="relative" ref={notificationsRef}>
          <button 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FAFCFA] border border-[#E1E6E1] hover:border-[#039A01] hover:bg-[#E7F4E8] text-[#5F6962] hover:text-[#026601] transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#039A01] rounded-full border-2 border-[#FFFFFF]"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-lg overflow-hidden z-50 text-[#202020]"
              >
                <div className="p-3 border-b border-[#E1E6E1] flex justify-between items-center bg-[#FAFCFA]">
                  <h3 className="font-bold text-[#202020] text-xs">Notifications</h3>
                  <button className="text-[10px] text-[#039A01] hover:underline font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-4 text-center text-xs text-[#5F6962]">
                  No new notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#202020] leading-tight">{user?.name || 'Agent'}</p>
            <p className="text-[10px] text-[#5F6962]">{user?.email || 'agent@eldercare.com'}</p>
          </div>
          <div className="relative cursor-pointer">
            <img 
              alt="Profile" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Agent')}&background=039a01&color=fff`} 
              className="w-8 h-8 rounded-full border border-[#E1E6E1] object-cover hover:border-[#039A01] transition-colors"
            />
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#FFFFFF] border border-[#E1E6E1] rounded-xl shadow-lg overflow-hidden transition-all z-50 text-[#202020]">
                 <Link
                   href="/agent/profile"
                   onClick={() => setShowProfileDropdown(false)}
                   className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#FAFCFA] hover:text-[#039A01] text-[#202020] text-xs font-medium transition-colors border-b border-[#E1E6E1]"
                 >
                   My Profile
                 </Link>
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

      </div>
    </header>
  );
}
