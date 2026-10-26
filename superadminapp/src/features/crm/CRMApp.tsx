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
const LeadConversionPage = lazy(() => import('./modules/pages/agent/leads/conversion/page'));
const LeadFollowUpsPage = lazy(() => import('./modules/pages/agent/leads/follow-ups/page'));
const CalendarPage = lazy(() => import('./modules/pages/calendar/page'));
const ReportsPage = lazy(() => import('./modules/pages/reports/page'));
const AgentReportsPage = lazy(() => import('./modules/pages/agent/reports/page'));
const SettingsPage = lazy(() => import('./modules/pages/settings/page'));
const SuperAdminPage = lazy(() => import('./modules/pages/super-admin/page'));
const SopPage = lazy(() => import('./modules/pages/sop/page'));
const DailyOperationsPage = lazy(() => import('./modules/pages/sop/daily-operations/page'));
const HrSopPage = lazy(() => import('./modules/pages/sop/hr/page'));
const CcrSopPage = lazy(() => import('./modules/pages/sop/ccr/page'));
const SalesSopPage = lazy(() => import('./modules/pages/sop/sales/page'));
const DataEntrySopPage = lazy(() => import('./modules/pages/sop/data-entry/page'));
const BuilderSopPage = lazy(() => import('./modules/pages/sop/builder/page'));
const DocumentsSopPage = lazy(() => import('./modules/pages/sop/documents/page'));
const SopReportsPage = lazy(() => import('./modules/pages/sop/reports/page'));

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
const AiAgentsPage = lazy(() => import('./modules/pages/ai-agents/page'));
const CarePlansPage = lazy(() => import('./modules/pages/care-plans/page'));
const EmergencyAlertsPage = lazy(() => import('./modules/pages/emergency-alerts/page'));
const FeedbackPage = lazy(() => import('./modules/pages/feedback/page'));

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
    <div className="crm-root crm-light-theme" style={{ width: '100%', height: '100%', background: '#F5F7F5', color: '#202020', minHeight: '100vh', position: 'relative' }}>
      <AuthWrapper>
        <Suspense fallback={<CrmLoadingFallback />}>
          <Routes>
            <Route index element={<Navigate to="/crm/agent/dashboard" replace />} />
            
            {/* Core Dashboards */}
            <Route path="dashboard" element={<AgentDashboardPage />} />
            <Route path="agent/dashboard" element={<AgentDashboardPage />} />
            <Route path="admin/dashboard" element={<DashboardPage />} />
            
            {/* Telephony & Call Center */}
            <Route path="call-center" element={<AgentCallCenterPage />} />
            <Route path="agent/call-center" element={<AgentCallCenterPage />} />
            <Route path="call-logs" element={<CallLogsPage />} />
            <Route path="agent/call-logs" element={<CallLogsPage />} />
            <Route path="call-history" element={<CallLogsPage />} />
            <Route path="agent/call-history" element={<CallLogsPage />} />
            
            {/* Omnichannel Hub */}
            <Route path="omnichannel" element={<AgentOmnichannelPage />} />
            <Route path="agent/omnichannel" element={<AgentOmnichannelPage />} />
            
            {/* Customer Timelines & Relationships */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="agent/customers" element={<CustomersPage />} />
            
            {/* Leads Management (Agent original CRM styling) */}
            <Route path="leads" element={<Navigate to="/crm/agent/leads/pool" replace />} />
            <Route path="agent/leads" element={<Navigate to="/crm/agent/leads/pool" replace />} />
            <Route path="leads/pool" element={<AgentLeadPoolPage />} />
            <Route path="agent/leads/pool" element={<AgentLeadPoolPage />} />
            <Route path="leads/duplicates" element={<DuplicateLeadsPage />} />
            <Route path="leads/conversion" element={<LeadConversionPage />} />
            <Route path="agent/leads/conversion" element={<LeadConversionPage />} />
            <Route path="leads/follow-ups" element={<LeadFollowUpsPage />} />
            <Route path="agent/leads/follow-ups" element={<LeadFollowUpsPage />} />
            
            {/* Operations, Calendar & Targets */}
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="agent/calendar" element={<CalendarPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="agent/appointments" element={<AppointmentsPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="targets" element={<TargetsPage />} />
            <Route path="agent/targets" element={<TargetsPage />} />
            <Route path="tickets" element={<AgentTicketsPage />} />
            <Route path="agent/tickets" element={<AgentTicketsPage />} />
            
            {/* SOP & Protocols (Complete sub-module routing) */}
            <Route path="sop" element={<SopPage />} />
            <Route path="agent/sop" element={<SopPage />} />
            <Route path="sop/daily-operations" element={<DailyOperationsPage />} />
            <Route path="agent/sop/daily-operations" element={<DailyOperationsPage />} />
            <Route path="sop/hr" element={<HrSopPage />} />
            <Route path="agent/sop/hr" element={<HrSopPage />} />
            <Route path="sop/ccr" element={<CcrSopPage />} />
            <Route path="agent/sop/ccr" element={<CcrSopPage />} />
            <Route path="sop/sales" element={<SalesSopPage />} />
            <Route path="agent/sop/sales" element={<SalesSopPage />} />
            <Route path="sop/data-entry" element={<DataEntrySopPage />} />
            <Route path="agent/sop/data-entry" element={<DataEntrySopPage />} />
            <Route path="sop/builder" element={<BuilderSopPage />} />
            <Route path="agent/sop/builder" element={<BuilderSopPage />} />
            <Route path="sop/documents" element={<DocumentsSopPage />} />
            <Route path="agent/sop/documents" element={<DocumentsSopPage />} />
            <Route path="sop/reports" element={<SopReportsPage />} />
            <Route path="agent/sop/reports" element={<SopReportsPage />} />
            <Route path="sop/*" element={<SopPage />} />
            <Route path="agent/sop/*" element={<SopPage />} />
            
            {/* AI Intelligence & Records */}
            <Route path="ai-agents" element={<AiAgentsPage />} />
            <Route path="agent/ai-agents" element={<AiAgentsPage />} />
            <Route path="ai-records" element={<AgentAiRecordsPage />} />
            <Route path="agent/ai-records" element={<AgentAiRecordsPage />} />
            <Route path="ai-summary" element={<AgentAiSummaryPage />} />
            <Route path="agent/ai-summary" element={<AgentAiSummaryPage />} />

            {/* Healthcare Operations */}
            <Route path="care-plans" element={<CarePlansPage />} />
            <Route path="emergency-alerts" element={<EmergencyAlertsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            
            {/* Team Directory & Administration */}
            <Route path="agents" element={<AgentsDirectoryPage />} />
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="reports" element={<AgentReportsPage />} />
            <Route path="agent/reports" element={<AgentReportsPage />} />
            <Route path="settings/*" element={<SettingsPage />} />
            <Route path="super-admin" element={<SuperAdminPage />} />
            <Route path="automation" element={<AutomationPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/crm/agent/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthWrapper>
    </div>
  );
}

export default CRMApp;

