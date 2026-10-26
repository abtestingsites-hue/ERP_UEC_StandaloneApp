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

    // Also check session storage fallback if user authenticated via ERP login
    if (!token) {
      try {
        const erpSessionStr = sessionStorage.getItem("superadmin-erp-session");
        if (erpSessionStr) {
          const erpSession = JSON.parse(erpSessionStr);
          if (erpSession?.accessToken) {
            token = erpSession.accessToken;
            localStorage.setItem("crm_token", token);
            localStorage.setItem("paramantra_access_token", token);
            if (erpSession.user) {
              const uObj = {
                id: erpSession.user.id,
                email: erpSession.user.email,
                name: erpSession.user.name,
                role: erpSession.user.role ? (typeof erpSession.user.role === 'string' ? erpSession.user.role : erpSession.user.role.name) : 'ADMIN',
              };
              userStr = JSON.stringify(uObj);
              localStorage.setItem("crm_user", userStr);
              localStorage.setItem("paramantra_user", userStr);
            }
          }
        }
      } catch (e) {
        console.warn('Could not read ERP session fallback:', e);
      }
    }
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        useAuthStore.getState().setUser(user);
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
    }

    if (!token && pathname !== "/login") {
      router.push("/login");
    } else if (token && pathname === "/login") {
      let role = 'ADMIN';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          role = user.role || 'ADMIN';
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
      }
      
      if (role === 'AGENT') {
        router.push("/agent/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else if (token && pathname === "/") {
      let role = 'ADMIN';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          role = user.role || 'ADMIN';
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
      }
      if (role === 'AGENT') {
        router.push("/agent/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else if (token && pathname !== "/login") {
      let role = 'ADMIN';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          role = user.role || 'ADMIN';
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
      }
      
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
      
      if (role === 'AGENT' && !isAgentPortalPath && !isSharedPath) {
        router.push('/agent/dashboard');
      } else if (role !== 'AGENT' && isAgentPortalPath) {
        router.push('/dashboard');
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>
    </div>;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Use the actual role to determine the shell, defaulting to path check if role isn't loaded yet
  const shouldShowAgentShell = userRole === 'AGENT' || (!userRole && (pathname === '/agent' || pathname.startsWith('/agent/')));

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
