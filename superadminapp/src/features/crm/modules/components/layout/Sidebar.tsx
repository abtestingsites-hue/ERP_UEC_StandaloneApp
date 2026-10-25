"use client";

import React, { useState } from 'react';
import Link from '../../nextShim';
import { usePathname } from '../../nextShim';
import { Phone, PhoneCall, History, Users, LayoutDashboard, MessageSquare, FileText, Settings, HeartPulse, Activity, LogOut, ChevronDown, Mic, Target, UploadCloud, Kanban, Calendar as CalendarIcon, Megaphone, Workflow, ClipboardCheck, CalendarCheck, ShieldCheck, CheckSquare } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

export function Sidebar() {
  const pathname = usePathname();
  const { status, setStatus } = useCallStore();
  const { user } = useAuthStore();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isLeadsOpen, setIsLeadsOpen] = useState(false);
  const [isSopOpen, setIsSopOpen] = useState(pathname.startsWith('/sop'));
  const [userRole, setUserRole] = useState<string>('');

  React.useEffect(() => {
    // Fallback if useAuthStore doesn't persist on reload
    if (user?.role) {
      setUserRole(user.role);
    } else {
      const savedUser = localStorage.getItem('crm_user');
      if (savedUser) {
        try {
          setUserRole(JSON.parse(savedUser).role);
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
      }
    }
  }, [user]);

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'AVAILABLE': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'BUSY': return 'bg-amber-500 shadow-amber-500/50';
      case 'ON_CALL': return 'bg-rose-500 shadow-rose-500/50';
      case 'WRAP_UP': return 'bg-purple-500 shadow-purple-500/50';
      default: return 'bg-slate-500 shadow-slate-500/50';
    }
  };

  type NavItem = { icon: any, label: string, href: string, badge?: string | number };
  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Phone, label: 'Call Center', href: '/call-center' },
    { icon: PhoneCall, label: 'Call Logs', href: '/call-logs' },
    { icon: MessageSquare, label: 'Messaging Hub', href: '/omnichannel' },
    { icon: FileText, label: 'Tickets', href: '/tickets' },
    { icon: Activity, label: 'AI Call Summary', href: '/ai-summary' },
    { icon: Users, label: 'AI Agents', href: '/ai-agents' },
    { icon: Mic, label: 'AI Auto Call Record', href: '/ai-records' },
    { icon: Users, label: 'Agents', href: '/agents' },
    { icon: Megaphone, label: 'Marketing Hub', href: '/marketing' },
    { icon: Settings, label: 'Messaging Hub Admin', href: '/automation' },
    { icon: CalendarIcon, label: 'Calendar Log', href: '/calendar' },
    { icon: Target, label: 'Target Management', href: '/targets' },
    { icon: FileText, label: 'Reports', href: '/reports' },
  ];

  const bottomNavItems = [
    { icon: Workflow, label: 'Automation', href: '/automation' },
    { icon: ClipboardCheck, label: 'Approvals', href: '/approvals' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const canManageAppointments = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (canManageAppointments) {
    navItems.push({ icon: CalendarCheck, label: 'Appointments', href: '/appointments' });
  }

  if (userRole === 'SUPER_ADMIN') {
    navItems.push({ icon: ShieldCheck, label: 'Super Admin Console', href: '/super-admin' });
  }

  const leadItems = [
    { label: 'Lead Data', href: '/leads/pool' },
    { label: 'Conversion Board', href: '/leads/conversion' },
    { label: 'Follow Ups', href: '/leads/follow-ups' },
    { label: 'Leads Timeline', href: '/customers' },
  ];

  const sopItems = [
    { label: 'SOP Overview', href: '/sop' },
    { label: 'Daily Operations', href: '/sop/daily-operations' },
    { label: 'HR SOP', href: '/sop/hr' },
    { label: 'CCR SOP', href: '/sop/ccr' },
    { label: 'Sales SOP', href: '/sop/sales' },
    { label: 'Data Entry SOP', href: '/sop/data-entry' },
    { label: 'SOP Builder', href: '/sop/builder' },
    { label: 'SOP Documents', href: '/sop/documents' },
    { label: 'Reports & Audit', href: '/sop/reports' },
  ];

  const statuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'BUSY', label: 'Busy' },
    { value: 'ON_CALL', label: 'On Call' },
    { value: 'WRAP_UP', label: 'Wrap Up' },
    { value: 'OFFLINE', label: 'Offline' },
  ];

  return (
    <div className="w-[220px] h-screen border-r border-[#E1E6E1] bg-[#FFFFFF] flex flex-col pt-5 pb-5 shrink-0 relative z-20">
      {/* Brand */}
      <div className="px-4 flex items-center gap-2.5 mb-6">
        <img
          src="/logo.png"
          alt="UNCF Logo"
          className="w-7 h-7 rounded-lg object-contain shadow-sm border border-[#E1E6E1] p-0.5 bg-white"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div>
          <h1 className="font-bold text-base tracking-tight text-[#202020]">ElderCare</h1>
          <p className="text-[9px] text-[#039A01] font-semibold uppercase tracking-wider">Enterprise CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/dashboard');
          
          return (
            <Link href={item.href} key={i}>
              <div
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group ${
                  isActive 
                  ? 'bg-[#E7F4E8] border-l-2 border-[#039A01] text-[#026601] font-semibold' 
                  : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020]'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#039A01]' : 'text-[#849389] group-hover:text-[#202020] transition-colors'}`} />
                <span className="font-medium text-xs">{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[#039A01] text-white' : 'border border-[#C8E6CA] text-[#026601]'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {/* SOP & Daily Operations Collapsible */}
        <div className="pt-2">
          <button 
            onClick={() => setIsSopOpen(!isSopOpen)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group ${pathname.startsWith('/sop') ? 'bg-[#E7F4E8] border-l-2 border-[#039A01] text-[#026601] font-semibold' : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020]'}`}
          >
            <CheckSquare className={`w-4 h-4 ${pathname.startsWith('/sop') ? 'text-[#039A01]' : 'text-[#849389] group-hover:text-[#202020]'}`} />
            <span className="font-medium text-xs">SOP & Daily Ops</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isSopOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isSopOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pl-8 pr-2 py-1 space-y-1"
            >
              {sopItems.map((item, idx) => (
                <Link href={item.href} key={idx}>
                  <div className={`text-xs py-1.5 transition-colors ${pathname === item.href ? 'text-[#039A01] font-semibold' : 'text-[#5F6962] hover:text-[#202020]'}`}>
                    {item.label}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        {/* Leads Module Collapsible */}
        <div className="pt-2">
          <button 
            onClick={() => setIsLeadsOpen(!isLeadsOpen)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group ${pathname.startsWith('/leads') ? 'bg-[#E7F4E8] border-l-2 border-[#039A01] text-[#026601] font-semibold' : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020]'}`}
          >
            <Target className={`w-4 h-4 ${pathname.startsWith('/leads') ? 'text-[#039A01]' : 'text-[#849389] group-hover:text-[#202020]'}`} />
            <span className="font-medium text-xs">Leads</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isLeadsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLeadsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pl-8 pr-2 py-1 space-y-1"
            >
              {leadItems.map((item, idx) => (
                <Link href={item.href} key={idx}>
                  <div className={`text-xs py-1.5 transition-colors ${pathname === item.href ? 'text-[#039A01] font-semibold' : 'text-[#5F6962] hover:text-[#202020]'}`}>
                    {item.label}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bottom Nav Items (Settings) */}
        <div className="pt-2">
          {bottomNavItems.map((item, i) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link href={item.href} key={i}>
                <div
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group ${isActive ? 'bg-[#E7F4E8] border-l-2 border-[#039A01] text-[#026601] font-semibold' : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020]'}`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-[#039A01]' : 'text-[#849389] group-hover:text-[#202020] transition-colors'}`} />
                  <span className="font-medium text-xs">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

      </nav>
      
      {/* Return to ERP & Logout Buttons */}
      <div className="px-3 mt-auto pt-3 border-t border-[#E1E6E1] space-y-2">
        <a 
          href="/dashboard"
          className="w-full flex justify-center items-center gap-2 bg-[#F5F7F5] hover:bg-[#E7F4E8] text-[#5F6962] hover:text-[#026601] border border-[#E1E6E1] hover:border-[#C8E6CA] py-2 rounded-lg transition-colors font-semibold text-xs no-underline"
        >
          Return to ERP Workspace →
        </a>
        <button 
          onClick={() => {
            localStorage.removeItem('crm_token');
            localStorage.removeItem('crm_user');
            localStorage.removeItem('paramantra_access_token');
            localStorage.removeItem('paramantra_refresh_token');
            sessionStorage.removeItem('superadmin-erp-session');
            window.location.href = '/login';
          }}
          className="w-full flex justify-center items-center gap-2 bg-[#FFFFFF] hover:bg-[#FDF2F2] text-[#849389] hover:text-[#B91C1C] border border-[#E1E6E1] hover:border-[#F8C8C8] py-2 rounded-lg transition-colors font-medium text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout Session
        </button>
      </div>
    </div>
  );
}
