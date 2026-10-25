import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="mx-auto h-dvh min-h-dvh w-full max-w-[2560px] bg-[#F7FAFC] dark:bg-[#05161A] font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden overflow-y-auto relative flex flex-col p-1 sm:p-1.5 md:p-2 box-border">
            <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden mt-1 sm:mt-1.5 md:mt-2 gap-1 sm:gap-1.5 md:gap-2">
                <Sidebar />

                <main className={`app-scrollbar flex-1 min-w-0 min-h-0 w-full overscroll-contain rounded-none sm:rounded-2xl md:rounded-[28px] overflow-x-hidden overflow-y-auto`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
