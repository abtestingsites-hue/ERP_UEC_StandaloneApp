"use client";

import React, { useState, useEffect } from "react";
import Link from "../../nextShim";
import { usePathname } from "../../nextShim";
import { 
  Phone, Users, LayoutDashboard, MessageSquare, FileText, Settings, 
  HeartPulse, Activity, LogOut, ChevronDown, Mic, Target, 
  Calendar as CalendarIcon, Megaphone, X, Shield, UserRound, CheckSquare
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shouldShowAgentShell: boolean;
}

export function MobileDrawer({ isOpen, onClose, shouldShowAgentShell }: MobileDrawerProps) {
  const pathname = usePathname();
  const { status, setStatus } = useCallStore();
  const user = useAuthStore((state) => state.user);
  const [isLeadsOpen, setIsLeadsOpen] = useState(false);
  const [isSopOpen, setIsSopOpen] = useState(pathname.startsWith('/sop'));

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Phone, label: "Call Center", href: "/call-center" },
    { icon: MessageSquare, label: "Messaging Hub", href: "/omnichannel" },
    { icon: FileText, label: "Tickets", href: "/tickets" },
    { icon: Activity, label: "AI Call Summary", href: "/ai-summary" },
    { icon: Users, label: "AI Agents", href: "/ai-agents" },
    { icon: Mic, label: "AI Auto Call Record", href: "/ai-records" },
    { icon: Users, label: "Agents", href: "/agents" },
    { icon: Megaphone, label: "Marketing Hub", href: "/marketing" },
    { icon: Settings, label: "Messaging Hub Admin", href: "/automation" },
    { icon: CalendarIcon, label: "Calendar Log", href: "/calendar" },
    { icon: Target, label: "Target Management", href: "/targets" },
    { icon: FileText, label: "Reports", href: "/reports" },
  ];

  const agentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/agent/dashboard" },
    { icon: CheckSquare, label: "SOP & Daily Ops", href: "/sop" },
    { icon: Phone, label: "Call Center", href: "/agent/call-center" },
    { icon: MessageSquare, label: "Messaging Hub", href: "/agent/omnichannel" },
    { icon: FileText, label: "Tickets", href: "/agent/tickets" },
    { icon: Activity, label: "AI Call Summary", href: "/agent/ai-summary" },
    { icon: Mic, label: "AI Call Record", href: "/agent/ai-records" },
    { icon: CalendarIcon, label: "Calendar Log", href: "/calendar" },
    { icon: Target, label: "Target Management", href: "/targets" },
    { icon: FileText, label: "Reports", href: "/agent/reports" },
    { icon: UserRound, label: "Customer Data", href: "/agent/customers" },
  ];

  const adminLeads = [
    { label: "Lead Data", href: "/leads/pool" },
    { label: "Conversion Board", href: "/leads/conversion" },
    { label: "Follow Ups", href: "/leads/follow-ups" },
    { label: "Leads Timeline", href: "/customers" },
  ];

  const agentLeads = [
    { label: "Lead Data", href: "/agent/leads/pool" },
    { label: "Conversion Board", href: "/agent/leads/conversion" },
    { label: "Follow Ups", href: "/agent/leads/follow-ups" },
    { label: "Leads Timeline", href: "/customers" },
  ];

  const navItems = shouldShowAgentShell ? agentNavItems : adminNavItems;
  const leadItems = shouldShowAgentShell ? agentLeads : adminLeads;

  const handleLogout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    localStorage.removeItem("paramantra_access_token");
    localStorage.removeItem("paramantra_refresh_token");
    sessionStorage.removeItem("superadmin-erp-session");
    window.location.href = "/login";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs md:hidden"
          />

          {/* Drawer content */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#FFFFFF] flex md:hidden flex-col pt-5 pb-5 shadow-2xl border-r border-[#E1E6E1] text-[#202020]"
          >
            {/* Header / Brand */}
            <div className="px-5 flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E1E6E1] p-1 flex items-center justify-center shadow-2xs">
                  <img src="/logo.png" alt="UNCF Logo" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h2 className="font-bold text-sm tracking-tight text-[#202020]">ElderCare</h2>
                  <p className="text-[9px] text-[#039A01] font-bold uppercase tracking-wider">
                    {shouldShowAgentShell ? "Agent Workspace" : "Enterprise CRM"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#FAFCFA] border border-[#E1E6E1] text-[#5F6962] hover:text-[#202020]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
              {navItems.map((item, idx) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link href={item.href} key={idx} onClick={onClose}>
                    <div
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#E7F4E8] text-[#026601] font-bold border-l-2 border-[#039A01]"
                          : "text-[#202020] hover:bg-[#F5F7F5]"
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-[#5F6962]" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* Leads Drawer Section */}
              <div className="pt-2">
                <button
                  onClick={() => setIsLeadsOpen(!isLeadsOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname.includes("/leads")
                      ? "bg-[#E7F4E8] text-[#026601] font-bold"
                      : "text-[#202020] hover:bg-[#F5F7F5]"
                  }`}
                >
                  <Target className="w-4 h-4 text-[#5F6962]" />
                  <span className="text-xs">Leads</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto text-[#5F6962] transition-transform ${isLeadsOpen ? "rotate-180" : ""}`} />
                </button>

                {isLeadsOpen && (
                  <div className="pl-8 pr-2 py-1 space-y-1">
                    {leadItems.map((item, idx) => (
                      <Link href={item.href} key={idx} onClick={onClose}>
                        <div className={`text-xs py-1.5 ${pathname === item.href ? "text-[#039A01] font-bold" : "text-[#5F6962] hover:text-[#202020]"}`}>
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="px-3 pt-3 mt-auto border-t border-[#E1E6E1] space-y-2">
              <a
                href="/dashboard"
                onClick={onClose}
                className="w-full flex justify-center items-center gap-2 bg-[#F5F7F5] hover:bg-[#E7F4E8] text-[#202020] hover:text-[#026601] border border-[#E1E6E1] py-2 rounded-lg text-xs font-semibold no-underline"
              >
                Return to ERP Workspace →
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center items-center gap-2 bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#B91C1C] border border-[#F8C8C8] py-2 rounded-lg text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
