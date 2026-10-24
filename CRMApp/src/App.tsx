import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';

import { ClientDirectory } from './features/clients/pages/ClientDirectory';

import { NewEnquiry } from './features/enquiry/pages/NewEnquiry';
import { EnquiryFollowUp } from './features/enquiry/pages/EnquiryFollowUp';
import { FollowUpView } from './features/enquiry/pages/FollowUpView';

import { EnquiryDeskDashboard } from './features/crm/pages/EnquiryDeskDashboard';
import { ActiveEnquiries } from './features/crm/pages/ActiveEnquiries';
import { B2PDashboard } from './features/b2p/pages/B2PDashboard';
import { MarketingDashboard } from './features/marketing/pages/MarketingDashboard';

import { CustomerCareDashboard } from './features/customer-care/pages/CustomerCareDashboard';
import { Complaints } from './features/customer-care/pages/Complaints';
import { PendingFeedback } from './features/customer-care/pages/PendingFeedback';
import { ServiceHistory } from './features/customer-care/pages/ServiceHistory';
import { WelcomeCall } from './features/customer-care/pages/WelcomeCall';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes inside DashboardLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Extracted Core Enquiry & CRM Routes */}
                <Route path="/crm/dashboard" element={<EnquiryDeskDashboard />} />
                <Route path="/crm/new-enquiry" element={<NewEnquiry />} />
                <Route path="/crm/active-enquiries" element={<ActiveEnquiries />} />
                <Route path="/crm/enquiry-follow-up" element={<EnquiryFollowUp />} />
                <Route path="/crm/enquiry-follow-up/:id" element={<FollowUpView />} />
                <Route path="/crm/b2p" element={<B2PDashboard />} />
                <Route path="/crm/marketing" element={<MarketingDashboard />} />

                {/* Extracted Customer Care Routes */}
                <Route path="/crm/customer-care" element={<CustomerCareDashboard />} />
                <Route path="/crm/customer-care/complaints" element={<Complaints />} />
                <Route path="/crm/customer-care/pending-feedback" element={<PendingFeedback />} />
                <Route path="/crm/customer-care/service-history" element={<ServiceHistory />} />
                <Route path="/crm/customer-care/welcome-calls" element={<WelcomeCall />} />

                {/* Client Master Directory Route */}
                <Route path="/crm/clients" element={<ClientDirectory />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
