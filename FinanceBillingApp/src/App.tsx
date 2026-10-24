import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ToastProvider } from './components/Toast';
import { Login } from './features/auth/pages/Login';
import { NotFound } from './pages/NotFound';
import { useAuthStore } from './store/authStore';

import { Cashbox } from './features/accounts/pages/Cashbox';
import { CashboxPending } from './features/accounts/pages/CashboxPending';
import { Income } from './features/accounts/pages/Income';
import { Expense } from './features/accounts/pages/Expense';
import { InHouseExpense } from './features/accounts/pages/InHouseExpense';

import { FinanceDashboard } from './features/finance/pages/FinanceDashboard';
import { ElderFinanceDashboard } from './features/finance/pages/ElderFinanceDashboard';
import { Invoice } from './features/finance/pages/Invoice';
import { PendingPayments } from './features/finance/pages/PendingPayments';
import { AllowanceTracking } from './features/finance/pages/AllowanceTracking';
import { Renewals } from './features/finance/pages/Renewals';
import { ElderBilling } from './features/finance/pages/ElderBilling';

import { PatientDailyCost } from './features/patient_billing/pages/PatientDailyCost';
import { PatientManualBilling } from './features/patient_billing/pages/PatientManualBilling';

const LoginRouteGuard: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/finance/dashboard" replace />;
  }

  return <Login />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRouteGuard />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/finance/dashboard" replace />} />
              <Route path="/finance/dashboard" element={<FinanceDashboard />} />
              <Route path="/finance/elder-dashboard" element={<ElderFinanceDashboard />} />
              <Route path="/finance/cashbox" element={<Cashbox />} />
              <Route path="/finance/pending-approvals" element={<CashboxPending />} />
              <Route path="/finance/income" element={<Income />} />
              <Route path="/finance/expense" element={<Expense />} />
              <Route path="/finance/inhouse-expense" element={<InHouseExpense />} />
              <Route path="/finance/invoice" element={<Invoice />} />
              <Route path="/finance/pending-payments" element={<PendingPayments />} />
              <Route path="/finance/allowance-tracking" element={<AllowanceTracking />} />
              <Route path="/finance/renewals" element={<Renewals />} />
              <Route path="/finance/elder-billing" element={<ElderBilling />} />

              <Route path="/billing/patient-daily-cost" element={<PatientDailyCost />} />
              <Route path="/billing/manual-billing" element={<PatientManualBilling />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};
