"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "../../nextShim";
import { Sidebar } from "../../components/layout/Sidebar";
import { Navbar } from "../../components/layout/Navbar";
import { SocketProvider } from "../../providers/SocketProvider";
import { IncomingCallModal } from "../../components/call-center/IncomingCallModal";
import { LiveCallPanel } from "../../components/call-center/LiveCallPanel";
import { AgentSidebar } from "../../components/agent-layout/AgentSidebar";
import { AgentNavbar } from "../../components/agent-layout/AgentNavbar";
import { useAuthStore } from "../../store/authStore";
import { AdminTicketToast } from "../../components/tickets/AdminTicketToast";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { MobileBottomNav } from "./MobileBottomNav";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const userRole = useAuthStore((state) => state.user?.role);

  useEffect(() => {
    // Check if token was passed via URL hash / params from ERP SuperAdmin Universal Gateway
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      let ssoToken = params.get("sso_token");
      let ssoUserStr = params.get("sso_user");

      if (!ssoToken && hash.includes("sso_token=")) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        ssoToken = hashParams.get("sso_token");
        ssoUserStr = hashParams.get("sso_user");
      }

      if (ssoToken) {
        localStorage.setItem("crm_token", ssoToken);
        localStorage.setItem("paramantra_access_token", ssoToken);
        if (ssoUserStr) {
          try {
            const parsed = JSON.parse(decodeURIComponent(ssoUserStr));
            localStorage.setItem("crm_user", JSON.stringify(parsed));
            localStorage.setItem("paramantra_user", JSON.stringify(parsed));
          } catch (_) {}
        }
        // Clean URL without full reload
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    let token = localStorage.getItem("crm_token");
    let userStr = localStorage.getItem("crm_user");

    // 1. First check if ERP session exists in sessionStorage
    const erpSessionStr = typeof window !== "undefined" ? sessionStorage.getItem("superadmin-erp-session") : null;
    let erpRole = '';
    if (erpSessionStr) {
      try {
        const erpSession = JSON.parse(erpSessionStr);
        if (erpSession?.accessToken) {
          token = erpSession.accessToken;
          localStorage.setItem("crm_token", token);
          localStorage.setItem("paramantra_access_token", token);
          if (erpSession.user) {
            const rawRole = erpSession.user.role 
              ? (typeof erpSession.user.role === 'string' ? erpSession.user.role : erpSession.user.role.name) 
              : 'ADMIN';
            erpRole = rawRole.toUpperCase();
            const uObj = {
              id: erpSession.user.id,
              email: erpSession.user.email,
              name: erpSession.user.name,
              role: erpRole,
            };
            userStr = JSON.stringify(uObj);
            localStorage.setItem("crm_user", userStr);
            localStorage.setItem("paramantra_user", userStr);
          }
        }
      } catch (e) {
        console.warn('Could not read ERP session:', e);
      }
    }

    // 2. Parse current user & normalize role
    let activeUser: any = null;
    if (userStr) {
      try {
        activeUser = JSON.parse(userStr);
        if (activeUser?.role) {
          activeUser.role = String(activeUser.role).toUpperCase();
        }
        const currentUserInStore = useAuthStore.getState().user;
        if (!currentUserInStore || currentUserInStore.id !== activeUser.id || currentUserInStore.role !== activeUser.role) {
          useAuthStore.getState().setUser(activeUser);
        }
      } catch (e) { 
        console.warn('[UI Exception Swallowed Fixed]:', e); 
      }
    }

    const currentRole = (activeUser?.role || erpRole || 'ADMIN').toUpperCase();
    const isAgent = currentRole === 'AGENT';

    if (!token && pathname !== "/login") {
      router.replace("/login");
      return;
    } 
    
    if (token && pathname === "/login") {
      if (isAgent) {
        router.replace("/agent/dashboard");
      } else {
        router.replace("/dashboard");
      }
      return;
    } 
    
    if (token && (pathname === "/" || pathname === "/dashboard" || pathname === "/index.html")) {
      if (isAgent) {
        if (pathname !== "/agent/dashboard") {
          router.replace("/agent/dashboard");
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(true);
      }
      return;
    } 
    
    if (token && pathname !== "/login") {
      const isAgentPortalPath = pathname === '/agent' || (pathname.startsWith('/agent/') && pathname !== '/agent/profile');
      const isSharedPath = 
        pathname.startsWith('/calendar') || 
        pathname.startsWith('/targets') || 
        pathname.startsWith('/call-logs') || 
        pathname.startsWith('/call-history') || 
        pathname.startsWith('/call-center') ||
        pathname.startsWith('/omnichannel') ||
        pathname.startsWith('/leads') ||
        pathname.startsWith('/customers') ||
        pathname.startsWith('/tickets') ||
        pathname.startsWith('/sop') ||
        pathname === '/agent/profile';
      
      // If user is Agent, restrict them to agent routes and shared routes
      if (isAgent && !isAgentPortalPath && !isSharedPath) {
        if (pathname !== '/agent/dashboard') {
          router.replace('/agent/dashboard');
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-[#039A01]/20 border-t-[#039A01] rounded-full animate-spin"></span>
    </div>;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Determine active role dynamically from auth store or storage
  const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('crm_user') : null;
  let activeRole = (userRole || '').toUpperCase();
  if (!activeRole && storedUserStr) {
    try {
      activeRole = (JSON.parse(storedUserStr).role || '').toUpperCase();
    } catch (_) {}
  }

  // Only show the Agent shell if the user is genuinely an AGENT
  // Super Admins and Admins ALWAYS see the full admin Sidebar & Navbar
  const isExplicitAgent = activeRole === 'AGENT';
  const shouldShowAgentShell = isExplicitAgent;

  return (
    <SocketProvider>
      {/* Desktop Shell */}
      <div className="hidden md:flex h-screen overflow-hidden bg-[#F5F7F5] text-[#202020]">
        {shouldShowAgentShell ? <AgentSidebar /> : <Sidebar />}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {shouldShowAgentShell ? <AgentNavbar /> : <Navbar />}
          <main className="flex-1 flex flex-col overflow-hidden bg-[#F5F7F5] relative text-[#202020]">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Shell */}
      <div 
        data-crm-mobile-shell="true"
        className="crm-mobile-shell flex md:hidden flex-col h-screen overflow-hidden bg-[#000000] text-white relative"
      >
        <MobileHeader 
          shouldShowAgentShell={shouldShowAgentShell} 
          onOpenMenu={() => setIsDrawerOpen(true)} 
        />
        
        <MobileDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          shouldShowAgentShell={shouldShowAgentShell}
        />
        
        <main className="flex-1 overflow-y-auto bg-[#000000] text-white relative pb-16">
          {children}
        </main>

        <MobileBottomNav 
          shouldShowAgentShell={shouldShowAgentShell} 
        />
      </div>

      <IncomingCallModal />
      <LiveCallPanel />
      <AdminTicketToast />
    </SocketProvider>
  );
}
