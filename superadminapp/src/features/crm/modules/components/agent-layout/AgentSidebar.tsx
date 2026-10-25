"use client";

import React, { useState } from 'react';
import Link from '../../nextShim';
import { usePathname } from '../../nextShim';
import { 
  Phone, PhoneCall, History, Users, LayoutDashboard, MessageSquare, 
  FileText, Activity, LogOut, Mic, UserRound, Target, ChevronDown, Calendar, CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export function AgentSidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/agent/dashboard' },
    { icon: CheckSquare, label: 'SOP & Daily Ops', href: '/sop' },
    { icon: Phone, label: 'Call Center', href: '/agent/call-center' },
    { icon: PhoneCall, label: 'Call Logs', href: '/call-logs' },
    { icon: MessageSquare, label: 'Messaging Hub', href: '/agent/omnichannel' },
    { icon: FileText, label: 'Tickets', href: '/agent/tickets' },
    { icon: Activity, label: 'AI Call Summary', href: '/agent/ai-summary' },
    { icon: Mic, label: 'AI Call Record', href: '/agent/ai-records' },
    { icon: Calendar, label: 'Calendar Log', href: '/calendar' },
    { icon: Target, label: 'Target Management', href: '/targets' },
    { icon: FileText, label: 'Reports', href: '/agent/reports' },
    { icon: UserRound, label: 'Customer Data', href: '/agent/customers' },
  ];

  const leadItems = [
    { label: 'Lead Data', href: '/agent/leads/pool' },
    { label: 'Conversion Board', href: '/agent/leads/conversion' },
    { label: 'Follow Ups', href: '/agent/leads/follow-ups' },
    { label: 'Leads Timeline', href: '/agent/customers' },
  ];

  const [user, setUser] = useState<{name: string, department: string} | null>(null);
  const [isLeadsOpen, setIsLeadsOpen] = useState(false);

  React.useEffect(() => {
    const userStr = localStorage.getItem('crm_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
    }
  }, []);

  return (
    <div className="w-[240px] h-screen border-r border-[#E1E6E1] bg-[#FFFFFF] flex flex-col pt-5 pb-5 shrink-0 relative z-20">
      {/* Brand */}
      <div className="px-5 flex items-center gap-3 mb-6">
        <img
          src="/logo.png"
          alt="UNCF Logo"
          className="w-8 h-8 rounded-lg object-contain shadow-sm border border-[#E1E6E1] p-0.5 bg-white"
          onError={(e) => {
            // Fallback icon if logo image not found
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div>
          <h1 className="font-bold text-base tracking-tight text-[#202020] leading-none">ElderCare</h1>
          <p className="text-[10px] text-[#039A01] font-bold uppercase tracking-widest mt-1">Agent Portal</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <p className="text-[11px] font-bold text-[#849389] uppercase tracking-wider pl-2">Menu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link href={item.href} key={i}>
              <div
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive 
                  ? 'bg-[#E7F4E8] border border-[#C8E6CA] text-[#026601] shadow-sm font-semibold' 
                  : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020] border border-transparent'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#039A01] text-white' : 'bg-[#EFF3EF] text-[#5F6962] group-hover:bg-[#E1E6E1] group-hover:text-[#202020]'
                }`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* Leads Module Collapsible */}
        <div className="pt-2">
          <button 
            onClick={() => setIsLeadsOpen(!isLeadsOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
              pathname.startsWith('/agent/leads') 
              ? 'bg-[#E7F4E8] border border-[#C8E6CA] text-[#026601] shadow-sm font-semibold' 
              : 'text-[#5F6962] hover:bg-[#F5F7F5] hover:text-[#202020] border border-transparent'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              pathname.startsWith('/agent/leads') ? 'bg-[#039A01] text-white' : 'bg-[#EFF3EF] text-[#5F6962] group-hover:bg-[#E1E6E1] group-hover:text-[#202020]'
            }`}>
              <Target className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-xs">Leads</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isLeadsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLeadsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pl-11 pr-3 py-1 space-y-1"
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
      </nav>

      {/* Footer Navigation: Return to ERP Workspace & Logout */}
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
          Logout
        </button>
      </div>
    </div>
  );
}
