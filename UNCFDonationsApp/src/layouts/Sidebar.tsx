import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sun,
    Moon,
    HeartHandshake,
    FolderKanban,
    PiggyBank,
    Receipt,
    Users,
    X,
    Heart,
    LayoutDashboard,
    LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { UNCF_BRANDING, UNCF_LOGO_SRC } from '../assets/branding';

interface SidebarProps {
    isMobileOpen?: boolean;
    onClose?: () => void;
}

interface SidebarItem {
    name: string;
    href: string;
    icon: any;
}

const navItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Donations', href: '/donations', icon: HeartHandshake },
    { name: 'Donors', href: '/donors', icon: Users },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Funding', href: '/funding', icon: PiggyBank },
    { name: 'Expenditures', href: '/expenditures', icon: Receipt },
];

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileOpen && onClose) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileOpen, onClose]);

    const toggleTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    };

    const handleLogout = () => {
        logout();
        if (onClose) onClose();
        navigate('/login');
    };

    const renderNavLinks = (links: SidebarItem[], label: string) => (
        <div className="w-full space-y-1">
            <div className="hidden group-hover:block text-[10px] font-bold text-gray-400 dark:text-[#6DA5C0] uppercase tracking-wider px-3 py-1 truncate">
                {label}
            </div>
            {links.map((link) => {
                const isActive =
                    location.pathname === link.href ||
                    (link.href !== '/dashboard' && location.pathname.startsWith(`${link.href}/`));

                return (
                    <Link
                        key={link.href}
                        to={link.href}
                        title={link.name}
                        onClick={onClose}
                        className={cn(
                            "h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0",
                            isActive
                                ? "bg-[#0F969C] text-white shadow-[0_10px_24px_rgba(15,150,156,0.28)] relative"
                                : "text-gray-500 dark:text-[#B8D9E8] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white relative border border-transparent dark:hover:border-white/10"
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
    );

    return (
        <>
            {/* Desktop 3-Split Floating Sidebar */}
            <aside className="hidden md:flex md:w-[68px] md:hover:w-[220px] transition-[width] duration-300 ease-in-out shrink-0 h-full relative z-40 group">
                <div className="w-full h-full flex flex-col items-start gap-3 pointer-events-none">
                    {/* Split 1: Theme Toggle Container (RIGID) */}
                    <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-full w-full flex flex-col items-center py-2 shrink-0 pointer-events-auto transition-all">
                        <button
                            type="button"
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
                            type="button"
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
                    <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_22px_54px_rgba(5,22,26,0.16)] rounded-[28px] w-full flex-1 flex flex-col items-center py-3 px-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-0 pointer-events-auto transition-all duration-300 gap-4">
                        {renderNavLinks(navItems, 'Donations & Funding')}
                    </div>

                    {/* Split 3: Bottom Actions Container (RIGID) */}
                    <div className="bg-white dark:bg-[#072E33] border border-gray-100 dark:border-[#6DA5C0]/15 shadow-sm dark:shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-[28px] w-full flex flex-col items-center py-2 px-1.5 shrink-0 pointer-events-auto transition-all gap-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0 text-gray-500 dark:text-[#B8D9E8] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                            title="Logout"
                        >
                            <LogOut className="w-[16px] h-[16px] shrink-0" />
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#072E33] text-gray-900 dark:text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#0F969C] font-bold text-sm">
                        <img src={UNCF_LOGO_SRC} alt={UNCF_BRANDING.shortName} className="h-7 w-auto object-contain shrink-0" />
                        <span>{UNCF_BRANDING.shortName}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Menu"
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                    <div>
                        <div className="text-xs font-bold text-gray-400 dark:text-[#6DA5C0] uppercase tracking-wider px-3 py-1.5 mb-1">
                            Donations & Funding
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                        location.pathname === link.href
                                            ? "bg-[#0F969C] text-white shadow-md"
                                            : "text-gray-700 dark:text-[#D8EEF5] hover:bg-gray-100 dark:hover:bg-white/10"
                                    )}
                                >
                                    <link.icon className="w-4 h-4 shrink-0" />
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleTheme(false)}
                            className={cn("p-2 rounded-lg text-xs font-bold", !isDark ? "bg-[#0F969C] text-white" : "text-gray-400")}
                        >
                            Light
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleTheme(true)}
                            className={cn("p-2 rounded-lg text-xs font-bold", isDark ? "bg-[#0F969C] text-white" : "text-gray-400")}
                        >
                            Dark
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;

