import { Sun, Moon, LayoutDashboard, Users, Calendar, HeartPulse, LogOut, Settings, HelpCircle, Database, Briefcase, FileBox, IndianRupee, Activity, ClipboardList, ClipboardCheck, Headset, Receipt, CreditCard, PenTool, User, Bell, MessageSquare, PhoneCall, FileText, HandHelping, MapPin, Building2, Network, Badge, Bed, TrendingUp, TrendingDown, Wallet, Landmark, UserCog, GraduationCap, Clock, DoorOpen, ListChecks, Pill, Ambulance, Radio, FilePenLine, FolderArchive, FolderKanban, PiggyBank, Megaphone, HeartHandshake, FileBarChart, AlertTriangle, Stethoscope, UserPlus, LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { canAccessPath } from '../lib/access'

type MenuLink = { name: string, icon: any, href: string, external?: boolean }

const uncfAppUrl = import.meta.env.VITE_UNCF_APP_URL || ''
const hrAppUrl = import.meta.env.VITE_HR_APP_URL || 'http://127.0.0.1:5178'
const crmAppUrl = import.meta.env.VITE_CRM_APP_URL || 'http://127.0.0.1:5181'

const roleDashboardOwners: Record<string, string | string[]> = {
    '/master/dashboard': 'master data manager',
    '/finance/dashboard': 'finance manager',
    '/hr/manager-dashboard': 'hr manager',
    '/security/dashboard': 'security supervisor',
    '/cms/dashboard': 'cms manager',
    '/admin-files/dashboard': 'admin files manager',
    '/task-user/dashboard': 'profile task user',
    '/uec/elder-care-dashboard': 'elder care admin',
    '/inhouse-care/dashboard': 'in-house care manager',
    '/operations/dashboard': 'elder operations manager',
    '/inventory': ['inventory manager', 'elder inventory manager', 'medical inventory manager'],
    '/inventory/elder-dashboard': 'elder inventory manager',
    '/task-log/dashboard': 'task log coordinator',
    '/finance/elder-dashboard': 'elder finance manager',
    '/module/patient-care': ['patient_care_manager', 'caregiver'],
    '/module/nursing-care': ['nursing_manager', 'nurse'],
    '/healthcare/medical-monitor-dashboard': 'medical monitor coordinator',
    '/allocation/dashboard': 'care allocation manager',
    '/inventory/medical-dashboard': 'medical inventory manager',
    '/ambulance/booking-dashboard': 'ambulance booking coordinator',
    '/ambulance/dispatch-dashboard': 'dispatch manager',
    '/ambulance/fleet-dashboard': 'fleet manager',
    '/ambulance/billing-dashboard': 'ambulance billing manager',
    '/ambulance/emergency-dashboard': 'emergency call coordinator',
    '/crm/dashboard': 'enquiry desk manager',
    '/crm/follow-up-dashboard': 'follow-up coordinator',
    '/customer-care/dashboard': 'customer relations manager',
    '/omnichannel/dashboard': 'omnichannel coordinator',
    '/crm/admissions-dashboard': 'admissions coordinator',
    '/visitor/dashboard': 'visitor receptionist',
    '/visitor-module/dashboard': 'visitor receptionist'
}

const withoutRoleDashboards = (links: MenuLink[]) =>
    links.filter((link) => !roleDashboardOwners[link.href])

const getNormalizedRole = (role: unknown) => {
    if (!role) return ''
    if (typeof role === 'string') return role.trim().toLowerCase()
    if (typeof role === 'object' && 'name' in role) {
        const roleName = (role as { name?: unknown }).name
        return typeof roleName === 'string' ? roleName.trim().toLowerCase() : ''
    }
    return ''
}

const getRoleDashboardLink = (role: string) => {
    const entry = Object.entries(roleDashboardOwners).find(([, ownerRole]) => 
        Array.isArray(ownerRole) ? ownerRole.includes(role) : ownerRole === role
    )
    if (!entry) return null

    const [href] = entry
    return Object.values(subMenus).flat().find((link) => link.href === href) || null
}

const masterMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/master/dashboard' },
    { name: 'City Master', icon: MapPin, href: '/master/city' },
    { name: 'Unit Master', icon: Building2, href: '/master/unit' },
    { name: 'Client Services', icon: HandHelping, href: '/master/client-services' },
    { name: 'Department Master', icon: Network, href: '/master/department' },
    { name: 'Designation Master', icon: Badge, href: '/master/designation' },
    { name: 'Labour Services', icon: Users, href: '/master/labour-services' },
    { name: 'Payment Category', icon: CreditCard, href: '/master/payment-category' },
    { name: 'Vendor Master', icon: Briefcase, href: '/master/vendor' },
    { name: 'Room Management', icon: Bed, href: '/master/room' }
]

const financeMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/finance/dashboard' },
    { name: 'Cashbox', icon: Wallet, href: '/finance/cashbox' },
    { name: 'Income', icon: TrendingUp, href: '/finance/income' },
    { name: 'Expense', icon: TrendingDown, href: '/finance/expense' },
    { name: 'Pending Payments', icon: IndianRupee, href: '/finance/pending-payments' },
    { name: 'Allowance Tracking', icon: Landmark, href: '/finance/allowance-tracking' },
    { name: 'Patient Daily Cost', icon: Receipt, href: '/finance/patient-daily-cost' },
    { name: 'Manual Patient Billing', icon: Receipt, href: '/finance/manual-billing' },
    { name: 'Invoice', icon: Receipt, href: '/finance/invoice' },
    { name: 'Renewals', icon: Calendar, href: '/finance/renewals' }
]

const hrMenus: MenuLink[] = [
    { name: 'HR Dashboard', icon: Activity, href: hrAppUrl ? `${hrAppUrl}/hr/dashboard` : '/hr/dashboard', external: Boolean(hrAppUrl) },
    { name: 'Staff Management', icon: Users, href: hrAppUrl ? `${hrAppUrl}/hr/staff` : '/hr/staff', external: Boolean(hrAppUrl) },
    { name: 'Staff Privileges', icon: UserCog, href: hrAppUrl ? `${hrAppUrl}/hr/staff-privileges` : '/hr/staff-privileges', external: Boolean(hrAppUrl) },
    { name: 'Leave Management', icon: FilePenLine, href: hrAppUrl ? `${hrAppUrl}/hr/leaves` : '/hr/leaves', external: Boolean(hrAppUrl) },
    { name: 'Shift Roster', icon: Clock, href: hrAppUrl ? `${hrAppUrl}/hr/shift-roster` : '/hr/shift-roster', external: Boolean(hrAppUrl) },
    { name: 'Document Tracker', icon: FileBox, href: hrAppUrl ? `${hrAppUrl}/hr/document-tracker` : '/hr/document-tracker', external: Boolean(hrAppUrl) },
    { name: 'Training Compliance', icon: GraduationCap, href: hrAppUrl ? `${hrAppUrl}/hr/training-compliance` : '/hr/training-compliance', external: Boolean(hrAppUrl) },
    { name: 'Labour Management', icon: HandHelping, href: hrAppUrl ? `${hrAppUrl}/hr/labour-management` : '/hr/labour-management', external: Boolean(hrAppUrl) },
    { name: 'Recruitment', icon: Briefcase, href: hrAppUrl ? `${hrAppUrl}/hr/recruitment/pipeline` : '/hr/recruitment/pipeline', external: Boolean(hrAppUrl) },
    { name: 'Attendance', icon: ListChecks, href: hrAppUrl ? `${hrAppUrl}/hr/attendance` : '/hr/attendance', external: Boolean(hrAppUrl) },
    { name: 'Holiday Mapping', icon: Calendar, href: hrAppUrl ? `${hrAppUrl}/hr/holiday-mapping` : '/hr/holiday-mapping', external: Boolean(hrAppUrl) },
    { name: 'Payroll', icon: CreditCard, href: hrAppUrl ? `${hrAppUrl}/hr/payroll` : '/hr/payroll', external: Boolean(hrAppUrl) },
    { name: 'HR Reports', icon: FileText, href: hrAppUrl ? `${hrAppUrl}/hr/reports` : '/hr/reports', external: Boolean(hrAppUrl) }
]

const cmsMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/cms/dashboard' },
    { name: 'Blogs', icon: PenTool, href: '/cms/blogs' },
    { name: 'FAQ', icon: HelpCircle, href: '/cms/faq' },
    { name: 'Events', icon: Calendar, href: '/cms/events' }
]

// Preserve CMS route definitions for later, but keep them out of the daily operations menu.
void cmsMenus

const profileMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/task-user/dashboard' },
    { name: 'My Profile', icon: User, href: '/profile/me' },
    { name: 'Daily Task', icon: ClipboardList, href: '/profile/tasks' },
    { name: 'My Attendance', icon: ListChecks, href: '/profile/attendance' },
    { name: 'My Leave', icon: Calendar, href: '/profile/leave' },
    { name: 'Notifications', icon: Bell, href: '/profile/notifications' }
]

const clientPortalMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/client-portal/dashboard' },
    { name: 'My Profile', icon: User, href: '/client-portal/profile' },
    { name: 'My Services', icon: HandHelping, href: '/client-portal/services' },
    { name: 'Health Records', icon: Activity, href: '/client-portal/health-records' },
    { name: 'My Medicines', icon: Pill, href: '/client-portal/medicines' },
    { name: 'My Complaints', icon: MessageSquare, href: '/client-portal/complaints' },
    { name: 'Notifications', icon: Bell, href: '/client-portal/notifications' }
]

const superAdminMenus: MenuLink[] = [
    { name: 'Employee Management', icon: User, href: '/super-admin/users' }
]

const inHouseCareMenus: MenuLink[] = [
    { name: 'In-House Care', icon: Activity, href: '/module/uec-inhouse-care' }
]

const organizationDashboardMenus: Record<string, MenuLink> = {
    UNCF: { name: 'UNCF Dashboard', icon: LayoutDashboard, href: '/uncf/dashboard' },
    ElderCare: { name: 'Dashboard', icon: LayoutDashboard, href: '/uec/elder-care-dashboard' },
    UEC: { name: 'UEC Dashboard', icon: LayoutDashboard, href: '/uec/dashboard' },
    UHC: { name: 'UHC Dashboard', icon: LayoutDashboard, href: '/uhc/dashboard' },
    UA: { name: 'UA Dashboard', icon: LayoutDashboard, href: '/ua/dashboard' },
    UEO: { name: 'UEO Dashboard', icon: LayoutDashboard, href: '/ueo/dashboard' }
}

const adminFileMenus: MenuLink[] = [
    { name: 'Admin Files', icon: FolderArchive, href: '/admin-files' }
]

const elderOperationsMenus: MenuLink[] = [
    { name: 'Elder Operations', icon: Settings, href: '/module/uec-operations' }
]

const elderInventoryMenus: MenuLink[] = [
    { name: 'Elder Inventory', icon: Database, href: '/inventory' }
]

const taskLogMenus: MenuLink[] = [
    { name: 'Task Log', icon: ClipboardList, href: '/module/uec-task-log' }
]

const healthcareMenus: MenuLink[] = [
    { name: 'Healthcare', icon: HeartPulse, href: '/module/uhc-healthcare' },
    { name: 'Patient Registration', icon: UserPlus, href: '/healthcare/registration' },
    { name: 'Admission', icon: LogIn, href: '/healthcare/admission' },
    { name: 'Discharge', icon: LogOut, href: '/healthcare/discharge' }
]

const allocationMenus: MenuLink[] = [
    { name: 'Care Allocation', icon: Users, href: '/module/uhc-allocation' }
]

const medicalInventoryMenus: MenuLink[] = [
    { name: 'Medical Inventory', icon: Database, href: '/inventory' }
]

const inventoryMenus: MenuLink[] = [
    { name: 'Inventory & Logistics', icon: Database, href: '/inventory' }
]

const ambulanceServiceMenus: MenuLink[] = [
    { name: 'Ambulance Services', icon: Ambulance, href: '/module/ua-services' }
]

const ambulanceSupportMenus: MenuLink[] = [
    { name: 'Ambulance Support', icon: PhoneCall, href: '/module/ua-support' }
]

const enquiryMenus: MenuLink[] = [
    { name: 'Enquiry Desk', icon: Headset, href: crmAppUrl ? `${crmAppUrl}/crm/dashboard` : '/crm/dashboard', external: Boolean(crmAppUrl) },
    { name: 'Client Management', icon: Users, href: '/crm/clients' }
]

const customerCareMenus: MenuLink[] = [
    { name: 'Customer Relations', icon: MessageSquare, href: crmAppUrl ? `${crmAppUrl}/crm/customer-care` : '/crm/customer-care', external: Boolean(crmAppUrl) }
]

const omnichannelMenus: MenuLink[] = [
    { name: 'Omnichannel', icon: Radio, href: '/module/ueo-omnichannel' }
]

const securityCommandMenus: MenuLink[] = [
    { name: 'Security Dashboard', icon: LayoutDashboard, href: '/security/dashboard' },
    { name: 'Gate Management', icon: DoorOpen, href: '/security/gate-management' },
    { name: 'Staff Register', icon: User, href: '/security/staff-register' },
    { name: 'Vehicle Register', icon: DoorOpen, href: '/security/vehicle-register' },
    { name: 'Entry Logs', icon: ClipboardList, href: '/security/entry-logs' }
]

const visitorMenus: MenuLink[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/visitor/dashboard' },
    { name: 'Visitor Management', icon: Users, href: '/visitor' },
    { name: 'Visitor Reports', icon: FileText, href: '/visitor/reports' }
]

const patientCareMenus: MenuLink[] = [
    { name: 'Patient Care Dashboard', icon: LayoutDashboard, href: '/module/patient-care' },
    { name: 'My Shift', icon: Clock, href: '/medical/my-shift' },
    { name: 'Patient Overview', icon: Stethoscope, href: '/patient-care/dashboard' },
    { name: 'Daily Living (ADL)', icon: HeartHandshake, href: '/patient-care/adl' },
    { name: 'Nutrition & Diet', icon: ClipboardList, href: '/patient-care/nutrition-diet' },
    { name: 'Incident Reports', icon: AlertTriangle, href: '/patient-care/incidents' }
]

const nursingCareMenus: MenuLink[] = [
    { name: 'Nursing Dashboard', icon: LayoutDashboard, href: '/module/nursing-care' },
    { name: 'My Shift', icon: Clock, href: '/medical/my-shift' },
    { name: 'Medication Schedule', icon: Pill, href: '/nursing-care/medication-schedule' },
    { name: 'Medicine Issue Log', icon: FileText, href: '/nursing-care/medicine-issue-log' },
    { name: 'Medicine Requests', icon: MessageSquare, href: '/nursing-care/medicine-requests' },
    { name: 'Vitals Monitoring', icon: HeartPulse, href: '/nursing-care/vitals' },
    { name: 'Critical Patients', icon: Activity, href: '/nursing-care/critical-patients' }
]

export const subMenus: Record<string, MenuLink[]> = {
    'Home': [
        { name: 'Home', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'City Master', icon: MapPin, href: '/master/city' },
        { name: 'Unit Master', icon: Building2, href: '/master/unit' },
        { name: 'Finance', icon: Wallet, href: '/finance/cashbox' },
        { name: 'Patient Daily Cost', icon: Receipt, href: '/finance/patient-daily-cost' },
        { name: 'Manual Patient Billing', icon: Receipt, href: '/finance/manual-billing' },
        { name: 'Invoice', icon: Receipt, href: '/finance/invoice' },
        { name: 'Daily Operations', icon: ClipboardCheck, href: '/daily-operations' },
        { name: 'Human Resource', icon: Users, href: hrAppUrl ? `${hrAppUrl}/hr/dashboard` : 'http://127.0.0.1:5178/hr/dashboard', external: Boolean(hrAppUrl) },
        { name: 'Workflow Timeline', icon: Activity, href: '/workflow/timeline' },
        { name: 'Reports', icon: FileText, href: '/reports/dashboard' },
        ...adminFileMenus
    ],
    'UNCF': [
        { name: 'Foundation Command Center', icon: HandHelping, href: uncfAppUrl || '/uncf/dashboard', external: Boolean(uncfAppUrl) },
        { name: 'Projects', icon: FolderKanban, href: uncfAppUrl ? `${uncfAppUrl}/projects` : '/uncf/projects', external: Boolean(uncfAppUrl) },
        { name: 'Funding', icon: PiggyBank, href: uncfAppUrl ? `${uncfAppUrl}/funding` : '/uncf/funding', external: Boolean(uncfAppUrl) },
        { name: 'Outreach', icon: Megaphone, href: uncfAppUrl ? `${uncfAppUrl}/outreach` : '/uncf/outreach', external: Boolean(uncfAppUrl) },
        { name: 'People', icon: Users, href: uncfAppUrl ? `${uncfAppUrl}/donors` : '/uncf/people', external: Boolean(uncfAppUrl) },
        { name: 'Donations', icon: HeartHandshake, href: uncfAppUrl ? `${uncfAppUrl}/donations` : '/uncf/donations', external: Boolean(uncfAppUrl) },
        { name: 'Reports', icon: FileBarChart, href: uncfAppUrl ? `${uncfAppUrl}/reports` : '/uncf/reports', external: Boolean(uncfAppUrl) },
        { name: 'Admin', icon: Settings, href: uncfAppUrl || '/uncf/admin', external: Boolean(uncfAppUrl) },
        ...inventoryMenus
    ],

    'Super Admin': superAdminMenus,
    'Master': masterMenus,
    'Finance': financeMenus,
    'Human Resource': hrMenus,
    'Profile': profileMenus,
    'Client Portal': clientPortalMenus,
    'Admin Files': adminFileMenus,

    'UEC': [
        organizationDashboardMenus.UEC,
        ...withoutRoleDashboards(inHouseCareMenus),
        ...withoutRoleDashboards(elderOperationsMenus),
        ...withoutRoleDashboards(elderInventoryMenus),
        { name: 'Elder Finance', icon: Receipt, href: '/module/uec-finance' },
        ...withoutRoleDashboards(taskLogMenus)
    ],
    'In-House Care': inHouseCareMenus,
    'Elder Operations': elderOperationsMenus,
    'Elder Inventory': elderInventoryMenus,
    'Elder Finance': [{ name: 'Elder Finance', icon: Receipt, href: '/module/uec-finance' }],
    'Task Log': taskLogMenus,

    'UHC': [
        organizationDashboardMenus.UHC,
        ...withoutRoleDashboards(healthcareMenus),
        ...withoutRoleDashboards(allocationMenus),
        ...withoutRoleDashboards(medicalInventoryMenus)
    ],
    'Healthcare': healthcareMenus,
    'Care Allocation': allocationMenus,
    'Medical Inventory': medicalInventoryMenus,

    'UA': [
        organizationDashboardMenus.UA,
        ...withoutRoleDashboards(ambulanceServiceMenus),
        ...withoutRoleDashboards(ambulanceSupportMenus)
    ],
    'Ambulance Services': ambulanceServiceMenus,
    'Ambulance Support': ambulanceSupportMenus,

    'UEO': [
        organizationDashboardMenus.UEO,
        ...withoutRoleDashboards(enquiryMenus),
        ...withoutRoleDashboards(customerCareMenus),
        ...withoutRoleDashboards(omnichannelMenus),
        ...visitorMenus
    ],
    'Enquiry Desk': enquiryMenus,
    'Customer Relations': customerCareMenus,
    'Omnichannel': omnichannelMenus,
    'Visitor Management': visitorMenus,
    'Security': securityCommandMenus,
    
    'Patient Care': patientCareMenus,
    'Nursing Care': nursingCareMenus,
    'Inventory': inventoryMenus
}

export function Sidebar({ activeMenu }: { activeMenu: string }) {
    const location = useLocation()
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const normalizedRole = getNormalizedRole(user?.role)
    const isClientPortal = ['family member', 'client', 'client family member'].includes(normalizedRole)
    const canShowLink = (link: MenuLink) => {
        const ownerRole = roleDashboardOwners[link.href]
        if (link.href === '/task-user/dashboard' && user?.staffId) return canAccessPath(user, link.href)
        if (ownerRole) {
            if (Array.isArray(ownerRole)) {
                if (!ownerRole.includes(normalizedRole)) return false
            } else {
                if (ownerRole !== normalizedRole) return false
            }
        }
        return canAccessPath(user, link.href)
    }

    const homeLinks = subMenus['Home'].filter(canShowLink)
    const uncfLinks = subMenus['UNCF'].filter(canShowLink)
    const fallbackLinks = homeLinks.length > 0 ? homeLinks : uncfLinks
    const currentLinks = (isClientPortal ? clientPortalMenus : (subMenus[activeMenu] || [])).filter(canShowLink)
    const baseVisibleLinks = currentLinks.length > 0 ? currentLinks : fallbackLinks
    const roleDashboardLink = getRoleDashboardLink(normalizedRole)
    const combinedLinks = roleDashboardLink && canShowLink(roleDashboardLink) && !baseVisibleLinks.some((link) => link.href === roleDashboardLink.href)
        ? [roleDashboardLink, ...baseVisibleLinks]
        : baseVisibleLinks
    const visibleLinks = Array.from(new Map(combinedLinks.map((link) => [link.href, link])).values())
    const canAccessSettings = canAccessPath(user, '/settings')
    const profileRoute = isClientPortal ? '/client-portal/profile' : '/profile/me'
    const canAccessProfile = canAccessPath(user, profileRoute)

    return (
        <aside className="hidden md:flex md:w-[68px] md:hover:w-[220px] transition-[width] duration-300 ease-in-out shrink-0 h-full relative z-40 group">
            <div className="w-full h-full flex flex-col items-start gap-3 pointer-events-none">

                {/* Split 1: Theme Toggle Container (RIGID) */}
                <div className="bg-[#072E33] border border-[#6DA5C0]/15 shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-full w-full flex flex-col items-center py-2 shrink-0 pointer-events-auto transition-all">
                    <button
                        onClick={() => document.documentElement.classList.remove('dark')}
                        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#0F969C] text-white shadow-sm mb-1 transition-all dark:bg-[#0F969C] dark:text-white"
                        title="Light Theme"
                    >
                        <Sun className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                        onClick={() => document.documentElement.classList.add('dark')}
                        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-[#B8D9E8] hover:bg-white/10 hover:text-white transition-all dark:bg-[#294D61] dark:text-white dark:shadow-sm"
                        title="Dark Theme"
                    >
                        <Moon className="w-3.5 h-3.5 shrink-0" />
                    </button>
                </div>

                {/* Split 2: Menu Icons Container (EXPANDS) */}
                <div className="bg-[#072E33] border border-[#6DA5C0]/15 shadow-[0_22px_54px_rgba(5,22,26,0.16)] rounded-[28px] w-full flex-1 flex flex-col items-center py-3 px-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-0 pointer-events-auto transition-all duration-300">
                    <div className="flex flex-col gap-2 w-full">
                        {visibleLinks.map((link) => {
                            const isActive = location.pathname === link.href ||
                                (link.href !== '/' && location.pathname.startsWith(`${link.href}/`)) ||
                                (link.href === '/dashboard' && location.pathname === '/')

                            if (link.external) {
                                return (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={link.name}
                                        className={cn(
                                            "h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0",
                                            "text-[#B8D9E8] hover:bg-white/10 hover:text-white relative border border-transparent hover:border-white/10"
                                        )}
                                    >
                                        <link.icon className="w-[16px] h-[16px] shrink-0" />
                                        <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                            {link.name}
                                        </span>
                                    </a>
                                )
                            }

                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    title={link.name}
                                    className={cn(
                                        "h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0",
                                        isActive ? "bg-[#0F969C] text-white shadow-[0_10px_24px_rgba(15,150,156,0.28)] relative" : "text-[#B8D9E8] hover:bg-white/10 hover:text-white relative border border-transparent hover:border-white/10"
                                    )}
                                >
                                    <link.icon className="w-[16px] h-[16px] shrink-0" />
                                    {/* Auto-expand text snippet */}
                                    <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                        {link.name}
                                    </span>
                                </Link>
                            )
                        })}

                    </div>
                </div>

                {/* Split 3: Bottom Actions Container (RIGID) */}
                <div className="bg-[#072E33] border border-[#6DA5C0]/15 shadow-[0_18px_40px_rgba(5,22,26,0.14)] rounded-[28px] w-full flex flex-col items-center py-2 px-1.5 shrink-0 pointer-events-auto transition-all gap-1">
                    {canAccessProfile ? (
                        <Link
                            to={profileRoute}
                            className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0 text-[#B8D9E8] hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"
                            title="Profile"
                        >
                            <User className="w-[16px] h-[16px] shrink-0" />
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                Profile
                            </span>
                        </Link>
                    ) : null}
                    {canAccessSettings ? (
                        <button onClick={() => navigate('/settings')} className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0 text-[#B8D9E8] hover:bg-white/10 hover:text-white" title="Settings">
                            <Settings className="w-[16px] h-[16px] shrink-0" />
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                                Settings
                            </span>
                        </button>
                    ) : null}
                    <button onClick={() => { logout(); window.location.href = '/auth/login'; }} className="h-10 w-full rounded-full flex items-center justify-center group-hover:justify-start group-hover:px-3.5 transition-all shrink-0 text-[#B8D9E8] hover:bg-white/10 hover:text-white" title="Logout">
                        <LogOut className="w-[16px] h-[16px] shrink-0" />
                        <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[160px] transition-all overflow-hidden whitespace-nowrap text-[12px] font-bold ml-0 group-hover:ml-2.5">
                            Logout
                        </span>
                    </button>
                </div>

            </div>
        </aside>
    )
}
