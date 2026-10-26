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

  return (
    <header className="h-[64px] border-b border-[#E1E6E1] bg-white flex items-center justify-between px-6 shrink-0 relative z-50 text-[#202020]">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849389] group-focus-within:text-[#039A01] transition-colors" />
          <input 
            aria-label="Search tasks, customers, or calls"
            type="text" 
            placeholder="Search tasks, customers, or calls..." 
            className="w-full bg-[#F5F7F5] border border-[#E1E6E1] focus:border-[#039A01] rounded-full pl-9 pr-4 py-1.5 text-xs outline-none text-[#202020] transition-all placeholder-[#849389]"
          />
        </div>
      </div>

      {/* Clock & Profile */}
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-xs font-bold text-[#202020] tracking-tight">
            {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
          </p>
          <p className="text-[10px] text-[#5F6962] uppercase font-semibold">
            {time ? time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '...'}
          </p>
        </div>

        <div className="w-px h-6 bg-[#E1E6E1]"></div>

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-full hover:bg-[#F5F7F5] transition-colors"
          >
            <Bell className="w-4 h-4 text-[#5F6962]" />
          </button>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <h2 className="text-xs font-bold text-[#202020] leading-none">{user?.name || 'Care Coordinator'}</h2>
            <p className="text-[10px] text-[#5F6962] mt-1">{user?.email || 'agent@eldercare.com'}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#039A01] to-[#028001] flex items-center justify-center font-bold text-white text-xs shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AgentNavbar;
