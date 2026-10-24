import { LogOut, User as UserIcon, ChevronDown, Menu, X, Users, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ERP_LOGO_SRC, ERP_ORG_TITLE_IMAGE_SRC, ERP_BRAND_NAME } from '../assets/branding';

export function Navbar({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen: boolean, setIsMobileMenuOpen: (v: boolean) => void }) {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="flex h-[60px] w-full shrink-0 items-center justify-between gap-3 overflow-visible relative min-w-0 lg:grid lg:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)] bg-white dark:bg-[#061e23] border-b border-gray-100 dark:border-[#6DA5C0]/15 px-4 md:px-6">
            <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3 lg:w-auto lg:justify-self-start">
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#072E33] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0F969C] transition-colors border border-gray-100 dark:border-transparent cursor-pointer"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <img src={ERP_LOGO_SRC} alt={ERP_BRAND_NAME} className="h-9 md:h-11 w-auto object-contain shrink-0" />
                <img src={ERP_ORG_TITLE_IMAGE_SRC} alt={ERP_BRAND_NAME} className="h-8 md:h-9.5 w-auto object-contain shrink-0" />
            </div>

            {/* Center: Module Pill */}
            <div className="hidden lg:flex flex-none w-fit items-center justify-center gap-1 bg-white dark:bg-[#072E33] rounded-full p-1.5 shadow-sm dark:shadow-[0_18px_42px_rgba(5,22,26,0.14)] border border-gray-100 dark:border-[#6DA5C0]/15 overflow-visible whitespace-nowrap relative z-30 lg:justify-self-center">
                <div className="h-9 px-5 rounded-full text-[12px] font-bold transition-all shrink-0 flex items-center gap-2 bg-[#0F969C] text-white shadow-[0_10px_24px_rgba(15,150,156,0.28)]">
                    <Users className="w-4 h-4" />
                    <span>HR & Workforce Management</span>
                </div>
            </div>

            {/* Right: User tools */}
            <div className="flex shrink-0 items-center justify-end gap-2 xl:gap-3 relative z-20 lg:justify-self-end">
                <div 
                    className="relative"
                    onMouseEnter={() => setShowUserMenu(true)}
                    onMouseLeave={() => setShowUserMenu(false)}
                >
                    <button
                        type="button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex h-11 items-center gap-2 rounded-full border border-gray-100 dark:border-[#6DA5C0]/15 bg-white dark:bg-[#072E33] px-5 text-[12px] font-bold text-gray-700 dark:text-[#D8EEF5] shadow-sm dark:shadow-[0_14px_34px_rgba(5,22,26,0.12)] transition-colors hover:bg-gray-50 dark:hover:bg-[#0F969C] hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                        <UserIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="max-w-[120px] truncate">{user?.name || 'HR Portal'}</span>
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-[46px] z-50 w-52 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 bg-white dark:bg-[#072E33] p-2 shadow-lg dark:shadow-[0_22px_54px_rgba(5,22,26,0.24)]">
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name || 'HR Portal'}</p>
                                <p className="text-[10px] font-semibold text-gray-500 dark:text-[#B8D9E8] capitalize truncate">
                                    {typeof user?.role === 'string' ? user.role : user?.role?.name || 'Staff'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { navigate('/profile/me'); setShowUserMenu(false); }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-[#D8EEF5] hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                            >
                                <UserCheck className="h-4 w-4 shrink-0" />
                                My Profile
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
