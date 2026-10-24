import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { InventoryNavbar } from './InventoryNavbar';
import { InventorySidebar } from './InventorySidebar';

export const InventoryLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Sidebar */}
      <InventorySidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <InventoryNavbar onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default InventoryLayout;
