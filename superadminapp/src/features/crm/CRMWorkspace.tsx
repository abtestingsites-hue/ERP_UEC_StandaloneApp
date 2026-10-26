import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import {
    BarChart3,
    Building2,
    CalendarDays,
    CheckSquare,
    Headset,
    LayoutDashboard,
    MessageSquare,
    PhoneCall,
    RefreshCw,
    ShieldCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useActiveUnit } from '../../context/useActiveUnit';
import { readAuthSession } from '../auth/authStorage';
import { isSuperAdmin } from '../../utils/permissions';
import { useAuthStore } from './modules/store/authStore';
import { AuthWrapper } from './modules/components/layout/AuthWrapper';

// Real CRM Page Modules
const DashboardSwitcher = lazy(() =>
    import('./modules/components/dashboard/DashboardSwitcher').then((m) => ({ default: m.DashboardSwitcher }))
);
const SuperAdminConsolePage = lazy(() => import('./modules/pages/super-admin/page'));
const LeadPoolPage = lazy(() => import('./modules/pages/leads/pool/page'));
const CallCenterPage = lazy(() => import('./modules/pages/call-center/page'));
const CallLogsPage = lazy(() => import('./modules/pages/call-logs/page'));
const OmnichannelPage = lazy(() => import('./modules/pages/omnichannel/page'));
const CustomersPage = lazy(() => import('./modules/pages/customers/page'));
const TicketsPage = lazy(() => import('./modules/pages/tickets/page'));
const CalendarPage = lazy(() => import('./modules/pages/calendar/page'));
const ReportsPage = lazy(() => import('./modules/pages/reports/page'));

function CrmTabLoading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span
                    style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(3, 154, 1, 0.2)',
                        borderTopColor: '#039A01',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                ></span>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: '#5F6962' }}>
                    LOADING CRM MODULE...
                </span>
            </div>
        </div>
    );
}

export function CRMWorkspace() {
    const session = readAuthSession();
    const isSuperAdminUser = isSuperAdmin(session?.user);
    const isCrmUser = session?.user?.provider === 'crm' || (session?.user?.role === 'AGENT' || session?.user?.role === 'CRM');

    // If an Agent lands directly on /crm, redirect them to dedicated CRM Agent portal
    if (isCrmUser && !isSuperAdminUser) {
        return <Navigate to="/crm/agent/dashboard" replace />;
    }

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const { activeUnitName, hasExplicitAllUnits, activeUnitId } = useActiveUnit();
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Synchronize SSO tokens and role into localStorage for CRM modules
    useEffect(() => {
        if (session?.accessToken) {
            localStorage.setItem('crm_token', session.accessToken);
            localStorage.setItem('paramantra_access_token', session.accessToken);
            const rawRole = session.user?.role
                ? typeof session.user.role === 'string'
                    ? session.user.role
                    : session.user.role.name
                : 'ADMIN';
            const role = String(rawRole).toUpperCase();
            const uObj = {
                id: session.user?.id || 'erp-superadmin',
                email: session.user?.email || 'admin@uec.com',
                name: session.user?.name || 'Administrator',
                role: role,
            };
            const uStr = JSON.stringify(uObj);
            localStorage.setItem('crm_user', uStr);
            localStorage.setItem('paramantra_user', uStr);
            useAuthStore.getState().setUser(uObj);
        }
    }, [session?.accessToken]);

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey((k) => k + 1);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const tabs = [
        { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'superadmin', label: 'Super Admin Console', icon: ShieldCheck },
        { id: 'leads', label: 'Lead Management', icon: UserPlus },
        { id: 'telephony', label: 'Live Telephony & PBX', icon: PhoneCall },
        { id: 'call-logs', label: 'Call Recordings & Logs', icon: Headset },
        { id: 'omnichannel', label: 'Omnichannel Messaging', icon: MessageSquare },
        { id: 'customers', label: 'Customer Directory', icon: Users },
        { id: 'tickets', label: 'Service Tickets', icon: CheckSquare },
        { id: 'calendar', label: 'Appointments & Schedule', icon: CalendarDays },
        { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
    ];

    return (
        <div className="crm-workspace inventory-workspace" style={{ width: '100%', minHeight: '100%' }}>
            <PageHeader
                eyebrow="BUSINESS DOMAIN · CLIENT RELATIONS & CRM"
                title="Client Relations & CRM"
                description="Client relationship lifecycle, omnichannel communications, live telephony telemetry, and multi-unit governance."
                action={
                    <div className="inv-header-action-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="inv-scope-badge" title="Active Operating Scope">
                            <Building2 size={14} />
                            <span>{activeUnitName}</span>
                            {activeUnitId === null && hasExplicitAllUnits && (
                                <span className="inv-badge inv-badge--success" style={{ marginLeft: 6 }}>
                                    Organization Wide
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="inv-btn inv-btn--outline"
                            onClick={handleManualRefresh}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid #DCE5DD',
                                background: '#FFFFFF',
                                color: '#273C32',
                                cursor: 'pointer',
                            }}
                            title="Refresh CRM telemetry and records"
                        >
                            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* Navigation Tabs Bar */}
            <div className="inv-tabs-nav-bar" style={{ marginTop: '16px', borderBottom: '1px solid #DCE5DD' }}>
                <nav className="inv-tabs-list" aria-label="CRM Workspaces">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={`inv-tab-btn ${isActive ? 'inv-tab-btn--active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                                type="button"
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Body: Renders the real CRM module inside AuthWrapper */}
            <div className="inv-tab-body" key={refreshKey} style={{ marginTop: '16px', minHeight: '500px' }}>
                <AuthWrapper>
                    <Suspense fallback={<CrmTabLoading />}>
                        {activeTab === 'overview' && (
                            <DashboardSwitcher defaultType="overall" />
                        )}
                        {activeTab === 'superadmin' && (
                            <SuperAdminConsolePage />
                        )}
                        {activeTab === 'leads' && (
                            <LeadPoolPage />
                        )}
                        {activeTab === 'telephony' && (
                            <CallCenterPage />
                        )}
                        {activeTab === 'call-logs' && (
                            <CallLogsPage />
                        )}
                        {activeTab === 'omnichannel' && (
                            <OmnichannelPage />
                        )}
                        {activeTab === 'customers' && (
                            <CustomersPage />
                        )}
                        {activeTab === 'tickets' && (
                            <TicketsPage />
                        )}
                        {activeTab === 'calendar' && (
                            <CalendarPage />
                        )}
                        {activeTab === 'reports' && (
                            <ReportsPage />
                        )}
                    </Suspense>
                </AuthWrapper>
            </div>
        </div>
    );
}

export default CRMWorkspace;
