import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthWrapper } from './modules/components/layout/AuthWrapper';
import './modules/pages/globals.css';

// Lazy load CRM page components
const DashboardPage = lazy(() => import('./modules/pages/dashboard/page'));
const AgentDashboardPage = lazy(() => import('./modules/pages/agent/dashboard/page'));
const CallCenterPage = lazy(() => import('./modules/pages/call-center/page'));
const AgentCallCenterPage = lazy(() => import('./modules/pages/agent/call-center/page'));
const CallLogsPage = lazy(() => import('./modules/pages/call-logs/page'));
const OmnichannelPage = lazy(() => import('./modules/pages/omnichannel/page'));
const AgentOmnichannelPage = lazy(() => import('./modules/pages/agent/omnichannel/page'));
const CustomersPage = lazy(() => import('./modules/pages/customers/page'));
const LeadPoolPage = lazy(() => import('./modules/pages/leads/pool/page'));
const AgentLeadPoolPage = lazy(() => import('./modules/pages/agent/leads/pool/page'));
const DuplicateLeadsPage = lazy(() => import('./modules/pages/leads/duplicates/page'));
const LeadConversionPage = lazy(() => import('./modules/pages/leads/conversion/page'));
const LeadFollowUpsPage = lazy(() => import('./modules/pages/leads/follow-ups/page'));
const CalendarPage = lazy(() => import('./modules/pages/calendar/page'));
const ReportsPage = lazy(() => import('./modules/pages/reports/page'));
const AgentReportsPage = lazy(() => import('./modules/pages/agent/reports/page'));
const SettingsPage = lazy(() => import('./modules/pages/settings/page'));
const SuperAdminPage = lazy(() => import('./modules/pages/super-admin/page'));
const SopPage = lazy(() => import('./modules/pages/sop/page'));
const TicketsPage = lazy(() => import('./modules/pages/tickets/page'));
const AgentTicketsPage = lazy(() => import('./modules/pages/agent/tickets/page'));
const TargetsPage = lazy(() => import('./modules/pages/targets/page'));
const AutomationPage = lazy(() => import('./modules/pages/automation/page'));
const AppointmentsPage = lazy(() => import('./modules/pages/appointments/page'));
const ApprovalsPage = lazy(() => import('./modules/pages/approvals/page'));
const MarketingPage = lazy(() => import('./modules/pages/marketing/page'));
const AgentsDirectoryPage = lazy(() => import('./modules/pages/agents/page'));
const AiRecordsPage = lazy(() => import('./modules/pages/ai-records/page'));
const AgentAiRecordsPage = lazy(() => import('./modules/pages/agent/ai-records/page'));
const AiSummaryPage = lazy(() => import('./modules/pages/ai-summary/page'));
const AgentAiSummaryPage = lazy(() => import('./modules/pages/agent/ai-summary/page'));

function CrmLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', background: 'var(--surface-page, #F5F7F5)', color: '#039A01' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(3, 154, 1, 0.2)', borderTopColor: '#039A01', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#5F6962' }}>LOADING ELDERCARE CRM WORKSPACE...</span>
      </div>
    </div>
  );
}

export function CRMApp() {
  return (
    <div className="crm-root" style={{ width: '100%', height: '100%', background: 'var(--surface-page, #F5F7F5)', color: '#202020', minHeight: '100vh', position: 'relative' }}>
      <AuthWrapper>
        <Suspense fallback={<CrmLoadingFallback />}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            
            {/* Core Dashboards */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="agent/dashboard" element={<AgentDashboardPage />} />
            
            {/* Telephony & Call Center */}
            <Route path="call-center" element={<CallCenterPage />} />
            <Route path="agent/call-center" element={<AgentCallCenterPage />} />
            <Route path="call-logs" element={<CallLogsPage />} />
            <Route path="agent/call-logs" element={<CallLogsPage />} />
            <Route path="call-history" element={<CallLogsPage />} />
            
            {/* Omnichannel Hub */}
            <Route path="omnichannel" element={<OmnichannelPage />} />
            <Route path="agent/omnichannel" element={<AgentOmnichannelPage />} />
            
            {/* Customer Timelines & Relationships */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="agent/customers" element={<CustomersPage />} />
            
            {/* Leads Management */}
            <Route path="leads" element={<Navigate to="leads/pool" replace />} />
            <Route path="leads/pool" element={<LeadPoolPage />} />
            <Route path="agent/leads" element={<Navigate to="agent/leads/pool" replace />} />
            <Route path="agent/leads/pool" element={<AgentLeadPoolPage />} />
            <Route path="leads/duplicates" element={<DuplicateLeadsPage />} />
            <Route path="leads/conversion" element={<LeadConversionPage />} />
            <Route path="agent/leads/conversion" element={<LeadConversionPage />} />
            <Route path="leads/follow-ups" element={<LeadFollowUpsPage />} />
            <Route path="agent/leads/follow-ups" element={<LeadFollowUpsPage />} />
            
            {/* Operations & Calendar */}
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="targets" element={<TargetsPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="agent/tickets" element={<AgentTicketsPage />} />
            
            {/* SOP & Protocols */}
            <Route path="sop/*" element={<SopPage />} />
            
            {/* AI Intelligence & Records */}
            <Route path="ai-records" element={<AiRecordsPage />} />
            <Route path="agent/ai-records" element={<AgentAiRecordsPage />} />
            <Route path="ai-summary" element={<AiSummaryPage />} />
            <Route path="agent/ai-summary" element={<AgentAiSummaryPage />} />
            
            {/* Team Directory & Administration */}
            <Route path="agents" element={<AgentsDirectoryPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="agent/reports" element={<AgentReportsPage />} />
            <Route path="settings/*" element={<SettingsPage />} />
            <Route path="super-admin" element={<SuperAdminPage />} />
            <Route path="automation" element={<AutomationPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthWrapper>
    </div>
  );
}

export default CRMApp;
