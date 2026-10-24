import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Shield, Lock, Menu as MenuIcon, Calendar, Clock, 
    CalendarCheck, DollarSign, UserPlus, Search, FileText, HardHat, 
    BarChart3, MapPin, Sparkles, Award, UserCheck, ChevronRight, Sun, Moon, LogOut
} from 'lucide-react';
import { Navbar } from './Navbar';
import { useAuthStore } from '../store/authStore';

const navSections = [
    {
        title: 'Core HR',
        items: [
            { path: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
            { path: '/hr/staff', label: 'Staff Directory', icon: Users },
            { path: '/hr/roles', label: 'Roles & Permissions', icon: Shield },
            { path: '/hr/staff-privileges', label: 'Staff Privileges', icon: Lock },
            { path: '/hr/menu-privileges', label: 'Menu Privileges', icon: MenuIcon },
        ]
    },
    {
        title: 'Workforce Operations',
        items: [
            { path: '/hr/leaves', label: 'Leave Management', icon: Calendar },
            { path: '/hr/attendance', label: 'Attendance Tracker', icon: Clock },
            { path: '/hr/shift-roster', label: 'Shift Roster', icon: CalendarCheck },
            { path: '/hr/payroll', label: 'Payroll & Compensation', icon: DollarSign },
        ]
    },
    {
        title: 'Recruitment & Labour',
        items: [
            { path: '/hr/recruitment/pipeline', label: 'Candidate Pipeline', icon: UserPlus },
            { path: '/hr/recruitment/job-enquiry', label: 'Job Enquiries', icon: Search },
            { path: '/hr/labour-management', label: 'Labour Management', icon: HardHat },
            { path: '/hr/document-tracker', label: 'Document Tracker', icon: FileText },
        ]
    },
    {
        title: 'Compliance & Analytics',
        items: [
            { path: '/hr/field-duty', label: 'Field Duty Tracker', icon: MapPin },
            { path: '/hr/holiday-mapping', label: 'Holiday Mapping', icon: Sparkles },
            { path: '/hr/training-compliance', label: 'Training Compliance', icon: Award },
            { path: '/hr/reports', label: 'HR Reports & Analytics', icon: BarChart3 },
        ]
    },
    {
        title: 'Self-Service Profile',
        items: [
            { path: '/profile/me', label: 'My Profile', icon: UserCheck },
            { path: '/profile/leaves', label: 'My Leave Requests', icon: Calendar },
            { path: '/profile/attendance', label: 'My Attendance Logs', icon: Clock },
        ]
    }
];

export function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('hrapp_theme');
        if (saved) return saved === 'dark';
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('hrapp_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('hrapp_theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('hrapp_theme', 'dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('hrapp_theme', 'light');
            setIsDark(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-screen w-full bg-slate-50 dark:bg-[#041619] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-hidden">
            <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex flex-1 h-[calc(100vh-60px)] overflow-hidden relative">
                {/* Sidebar overlay for mobile */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar navigation */}
                <aside className={`
                    fixed md:static inset-y-0 left-0 z-50 h-full p-2
                    w-64 md:w-[68px] md:hover:w-[220px]
                    flex flex-col gap-2 shrink-0 group overflow-x-hidden pointer-events-none md:pointer-events-auto
                    ${isMobileMenuOpen ? 'translate-x-0 w-64 pointer-events-auto' : '-translate-x-full md:translate-x-0'}
                    transition-[width,transform] duration-300 ease-in-out
                `}>
                    <div className="w-full h-full flex flex-col items-start gap-2.5 pointer-events-none">
                        
                        {/* Split 1: Theme Toggle Container (Floating Rounded Top Pill) */}
                        <div className="bg-white dark:bg-[#072E33] border border-slate-200 dark:border-[#6DA5C0]/15 shadow-sm rounded-full w-full flex flex-col items-center py-2 shrink-0 pointer-events-auto transition-all">
                            <button
                                type="button"
                                onClick={() => toggleTheme(false)}
                                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                                    !isDark
                                        ? 'bg-[#0F969C] text-white shadow-sm font-bold'
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-[#B8D9E8]'
                                }`}
                                title="Light Theme"
                            >
                                <Sun className="w-4 h-4 shrink-0" />
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleTheme(true)}
                                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full mt-1 transition-all cursor-pointer ${
                                    isDark
                                        ? 'bg-[#0F969C] text-white shadow-sm font-bold'
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-[#B8D9E8]'
                                }`}
                                title="Dark Theme"
                            >
                                <Moon className="w-4 h-4 shrink-0" />
                            </button>
                        </div>

                        {/* Split 2: Main Navigation Menu (Floating Rounded Center Panel) */}
                        <div className="bg-white dark:bg-[#072E33] border border-slate-200 dark:border-[#6DA5C0]/15 shadow-sm rounded-[28px] w-full flex-1 flex flex-col items-center py-3 px-1.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pointer-events-auto transition-all duration-300">
                            <div className="flex flex-col gap-3 w-full">
                                {navSections.map((section, idx) => (
                                    <div key={idx} className="space-y-1 w-full">
                                        <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#6DA5C0] opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-6 transition-all duration-200 overflow-hidden whitespace-nowrap">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-1 w-full">
                                            {section.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = location.pathname === item.path;
                                                return (
                                                    <NavLink
                                                        key={item.path}
                                                        to={item.path}
                                                        title={item.label}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={`
                                                            h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3 transition-all shrink-0 relative overflow-hidden whitespace-nowrap
                                                            ${isActive 
                                                                ? 'bg-[#0F969C] text-white shadow-[0_10px_24px_rgba(15,150,156,0.28)]' 
                                                                : 'text-slate-500 dark:text-[#B8D9E8] hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-transparent dark:hover:border-white/10'
                                                            }
                                                        `}
                                                    >
                                                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 shrink-0" />
                                                        </div>
                                                        <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[150px] transition-all duration-200 overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                                            {item.label}
                                                        </span>
                                                        {isActive && (
                                                            <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                        )}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Split 3: Bottom Actions Container (Floating Rounded Bottom Pill) */}
                        <div className="bg-white dark:bg-[#072E33] border border-slate-200 dark:border-[#6DA5C0]/15 shadow-sm rounded-[28px] w-full flex flex-col items-center py-2 px-1.5 shrink-0 pointer-events-auto transition-all gap-1">
                            <button 
                                type="button"
                                onClick={handleLogout} 
                                className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3 transition-all shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer overflow-hidden whitespace-nowrap" 
                                title="Logout"
                            >
                                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                    <LogOut className="w-4 h-4 shrink-0" />
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[150px] transition-all duration-200 overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                    Logout
                                </span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
