"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "../../nextShim";
import { Menu, Search, Bell, X, HeartPulse, Phone } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Link from "../../nextShim";

interface MobileHeaderProps {
  shouldShowAgentShell: boolean;
  onOpenMenu: () => void;
}

export function MobileHeader({ shouldShowAgentShell, onOpenMenu }: MobileHeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Agent");
  const [userInitials, setUserInitials] = useState("AG");

  useEffect(() => {
    if (user) {
      const name = user.name || user.email?.split("@")[0] || "Agent";
      setUserName(name);
      setUserInitials(name.substring(0, 2).toUpperCase());
    }
  }, [user]);

  const getModuleTitle = (path: string) => {
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/call-center")) return "Call Center";
    if (path.includes("/omnichannel")) return "Messaging Hub";
    if (path.includes("/tickets")) return "Tickets";
    if (path.includes("/ai-summary")) return "AI Summary";
    if (path.includes("/ai-agents")) return "AI Agents";
    if (path.includes("/ai-records")) return "Call Records";
    if (path.includes("/agents")) return "Agents";
    if (path.includes("/marketing")) return "Marketing";
    if (path.includes("/automation")) return "Automation";
    if (path.includes("/calendar")) return "Calendar Log";
    if (path.includes("/targets")) return "Targets";
    if (path.includes("/reports")) return "Reports";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/customers")) return "Customers";
    if (path.includes("/leads/pool")) return "Lead Pool";
    if (path.includes("/leads/conversion")) return "Lead Board";
    if (path.includes("/leads/follow-ups")) return "Follow Ups";
    if (path.includes("/leads")) return "Leads";
    return "CRM Platform";
  };

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E1E6E1] px-4 flex md:hidden items-center justify-between shrink-0 text-[#202020] shadow-2xs">
      {isSearchOpen ? (
        <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
          <Search className="w-4 h-4 text-[#5F6962] shrink-0" />
          <input 
            aria-label="Search" 
            id="mobile-search-input" 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CRM..."
            className="flex-1 bg-transparent text-xs text-[#202020] outline-none placeholder-[#849389] py-1"
            autoFocus
          />
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className="p-1 text-[#5F6962] hover:text-[#202020]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Menu Toggle */}
          <button
            onClick={onOpenMenu}
            className="p-1.5 -ml-1 text-[#202020] hover:bg-[#F5F7F5] rounded-lg transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-[#202020]" />
          </button>

          {/* CRM Logo & Title */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white border border-[#E1E6E1] p-0.5 flex items-center justify-center shadow-2xs">
              <img src="/logo.png" alt="UNCF Logo" className="w-5 h-5 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="font-bold text-xs tracking-tight text-[#202020] leading-tight">
                {getModuleTitle(pathname)}
              </h1>
              <p className="text-[9px] text-[#039A01] font-bold uppercase tracking-wider leading-none">
                {shouldShowAgentShell ? "Agent Portal" : "ElderCare CRM"}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-[#5F6962] hover:text-[#202020] hover:bg-[#F5F7F5] rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link href="/agent/profile" className="ml-1 shrink-0">
              <div className="w-6 h-6 rounded-full bg-[#039A01] flex items-center justify-center text-white font-bold text-[10px] shadow-2xs">
                {userInitials}
              </div>
            </Link>
          </div>
        </>
      )}
    </header>
  );
}
