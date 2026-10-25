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
    <header className="h-[64px] border-b border-[#E1E6E1] bg-[#FFFFFF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFFFFF]/80 flex items-center justify-between px-6 shrink-0 relative z-50">
      
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849389] group-focus-within:text-[#039A01] transition-colors" />
          <input aria-label="Search tasks, customers, or calls"
            type="text" 
            id="agent-navbar-search"
            placeholder="Search tasks, customers, or calls..." 
            className="w-full bg-[#F5F7F5] border border-[#E1E6E1] focus:border-[#039A01] focus:bg-white rounded-xl pl-10 pr-4 py-2 text-sm outline-none text-[#202020] transition-all placeholder-[#849389]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#EFF3EF] border border-[#E1E6E1] rounded text-[10px] font-semibold text-[#5F6962]">Ctrl</kbd>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#EFF3EF] border border-[#E1E6E1] rounded text-[10px] font-semibold text-[#5F6962]">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 ml-6">
        
        {/* Clock */}
        {time && (
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#202020] tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-[#5F6962] uppercase tracking-widest font-medium">
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
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F5F7F5] border border-[#E1E6E1] hover:border-[#C8E6CA] hover:bg-[#E7F4E8] text-[#5F6962] hover:text-[#026601] transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#039A01] rounded-full border border-white"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-[#111] border border-[#222] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-[#E1E6E1] flex justify-between items-center bg-[#FAFCFA]">
                  <h3 className="font-bold text-[#202020] text-sm">Notifications</h3>
                  <button className="text-[10px] text-[#039A01] hover:underline font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {mockNotifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-[#E1E6E1] hover:bg-[#F5F7F5] transition-colors cursor-pointer ${n.unread ? 'bg-[#FFFFFF]' : 'opacity-70'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${n.unread ? 'text-[#202020] font-semibold' : 'text-[#5F6962]'}`}>{n.text}</p>
                        {n.unread && <span className="w-2 h-2 rounded-full bg-[#039A01] shrink-0 mt-1.5 ml-2"></span>}
                      </div>
                      <p className="text-[10px] text-[#849389]">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-[#E1E6E1] bg-[#FAFCFA] hover:bg-[#EFF3EF] cursor-pointer transition-colors text-xs text-[#5F6962] font-semibold">
                  View All Notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#202020] leading-tight">{user?.name || 'Agent'}</p>
            <p className="text-[10px] text-[#5F6962]">{user?.email || 'agent@eldercare.com'}</p>
          </div>
          <div className="relative cursor-pointer">
            <img alt="Profile" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Agent')}&background=039a01&color=fff`} 
              className="w-9 h-9 rounded-full border border-[#E1E6E1] object-cover hover:border-[#039A01] transition-colors shadow-sm"
            />
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E1E6E1] rounded-xl shadow-xl overflow-hidden transition-all z-50">
                 <Link
                   href="/agent/profile"
                   onClick={() => setShowProfileDropdown(false)}
                   className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#F5F7F5] hover:text-[#202020] text-[#5F6962] text-xs font-semibold transition-colors border-b border-[#E1E6E1]"
                 >
                   My Profile
                 </Link>
                 <a
                   href="/dashboard"
                   onClick={() => setShowProfileDropdown(false)}
                   className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#E7F4E8] text-[#026601] text-xs font-semibold transition-colors border-b border-[#E1E6E1] no-underline"
                 >
                   Return to ERP Workspace →
                 </a>
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#FDF2F2] hover:text-[#B91C1C] text-[#849389] text-xs font-semibold transition-colors"
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
