"use client";

import React from "react";
import Link from "../../nextShim";
import { usePathname } from "../../nextShim";
import { LayoutDashboard, Phone, Users, Calendar, Menu } from "lucide-react";

interface MobileBottomNavProps {
  shouldShowAgentShell: boolean;
}

export function MobileBottomNav({ shouldShowAgentShell }: MobileBottomNavProps) {
  const pathname = usePathname();

  const getDashboardHref = () => shouldShowAgentShell ? "/agent/dashboard" : "/dashboard";
  const getCallsHref = () => shouldShowAgentShell ? "/agent/call-center" : "/call-center";
  const getContactsHref = () => shouldShowAgentShell ? "/agent/customers" : "/leads/pool";
  const getTasksHref = () => shouldShowAgentShell ? "/agent/leads/follow-ups" : "/leads/follow-ups";

  const isTabActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav 
      data-crm-mobile-bottom-nav="true"
      aria-label="Mobile Navigation"
      className="crm-mobile-bottom-nav h-16 fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E1E6E1] px-4 flex md:hidden items-center justify-between pb-safe shadow-md"
    >
      {/* Dashboard */}
      <Link href={getDashboardHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getDashboardHref()) ? "text-[#039A01]" : "text-[#5F6962] hover:text-[#202020]"}`}>
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getDashboardHref()) ? "text-[#039A01]" : "text-[#5F6962]"}`}>
          Dash
        </span>
      </Link>

      {/* Calls */}
      <Link href={getCallsHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getCallsHref()) ? "text-[#039A01]" : "text-[#5F6962] hover:text-[#202020]"}`}>
          <Phone className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getCallsHref()) ? "text-[#039A01]" : "text-[#5F6962]"}`}>
          Calls
        </span>
      </Link>

      {/* Contacts */}
      <Link href={getContactsHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getContactsHref()) ? "text-[#039A01]" : "text-[#5F6962] hover:text-[#202020]"}`}>
          <Users className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getContactsHref()) ? "text-[#039A01]" : "text-[#5F6962]"}`}>
          Contacts
        </span>
      </Link>

      {/* Tasks */}
      <Link href={getTasksHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getTasksHref()) ? "text-[#039A01]" : "text-[#5F6962] hover:text-[#202020]"}`}>
          <Calendar className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getTasksHref()) ? "text-[#039A01]" : "text-[#5F6962]"}`}>
          Tasks
        </span>
      </Link>
    </nav>
  );
}
