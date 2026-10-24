import { Sun, Moon, LayoutDashboard, LogOut, FileText, Users, ClipboardList, UserCheck, FileSignature, UserPlus, Calendar, CheckSquare } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    };

    const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
    const normalizedRole = String(userRole || '').trim().toUpperCase().replace(/\s+/g, '_');
    const isManager = ['HOME_CARE_MANAGER', 'SUPER_ADMIN', 'CARE_ALLOCATION_MANAGER'].includes(normalizedRole);

    const staffLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'My Clients', icon: UserCheck, href: '/my-clients' },
        { name: 'My Roster', icon: Calendar, href: '/my-roster' },
        { name: 'My Visits', icon: CheckSquare, href: '/my-visits' },
    ];

    const managerLinks = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/manager' },
        { name: 'Enquiries', icon: FileText, href: '/manager/enquiries' },
        { name: 'Clients', icon: Users, href: '/manager/clients' },
        { name: 'Requirements', icon: ClipboardList, href: '/manager/service-requirements' },
        { name: 'Contracts', icon: FileSignature, href: '/manager/contracts' },
        { name: 'Allocations', icon: UserPlus, href: '/manager/allocations' },
        { name: 'Roster', icon: Calendar, href: '/manager/roster' },
    ];

    const visibleLinks = isManager ? managerLinks : staffLinks;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="hidden md:flex md:w-[68px] md:hover:w-[220px] transition-[width] duration-300 ease-in-out shrink-0 h-full relative z-40 group">
            <div className="w-full h-full flex flex-col items-start gap-3 pointer-events-none">
                
                {/* Split 1: Theme Toggle Container (RIGID) */}
                <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-full w-full flex flex-col items-center py-2 shrink-0 pointer-events-auto transition-all">
                    <button
                        onClick={() => toggleTheme(false)}
                        className={cn(
                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-full mb-1 transition-all",
                            !isDark 
                                ? "bg-[#0F969C] text-white shadow-sm" 
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-[#B8D9E8]"
                        )}
                        title="Light Theme"
                    >
                        <Sun className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                        onClick={() => toggleTheme(true)}
                        className={cn(
                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all",
                            isDark 
                                ? "bg-[#0F969C] text-white shadow-sm" 
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-[#B8D9E8]"
                        )}
                        title="Dark Theme"
                    >
                        <Moon className="w-3.5 h-3.5 shrink-0" />
                    </button>
                </div>

                {/* Split 2: Menu Icons Container (EXPANDS) */}
                <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_22px_54px_rgba(5,22,26,0.16)] rounded-[28px] w-full flex-1 flex flex-col items-center py-3 px-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-0 pointer-events-auto transition-all duration-300">
                    <div className="flex flex-col gap-2 w-full">
                        {visibleLinks.map((link) => {
                            const isActive = location.pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    title={link.name}
                                    className={cn(
                                        "h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0",
                                        isActive ? "bg-[#0F969C] text-white shadow-[0_10px_24px_rgba(15,150,156,0.28)] relative" : "text-gray-500 dark:text-[#B8D9E8] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white relative border border-transparent dark:hover:border-white/10"
                                    )}
                                >
                                    <link.icon className="w-[16px] h-[16px] shrink-0" />
                                    <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Split 3: Bottom Actions Container (RIGID) */}
                <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-[28px] w-full flex flex-col items-center py-2 px-1.5 shrink-0 pointer-events-auto transition-all gap-1">
                    <button onClick={handleLogout} className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0 text-gray-500 dark:text-[#B8D9E8] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white" title="Logout">
                        <LogOut className="w-[16px] h-[16px] shrink-0" />
                        <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                            Logout
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
