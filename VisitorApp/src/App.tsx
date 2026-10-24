import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/pages/Login';
import { VisitorDashboard } from './features/visitor/pages/VisitorDashboard';
import { VisitorManagement } from './features/visitor/pages/VisitorManagement';
import { VisitorReports } from './features/visitor/pages/VisitorReports';
import { VisitorSelfCheckIn } from './features/visitor/pages/VisitorSelfCheckIn';
import { VisitorPassVerification } from './features/visitor/pages/VisitorPassVerification';

import { SecurityDashboard } from './features/security/pages/SecurityDashboard';
import { GateManagement } from './features/security/pages/GateManagement';
import { EntryLogs } from './features/security/pages/EntryLogs';
import { VehicleRegister } from './features/security/pages/VehicleRegister';
import { StaffRegister } from './features/security/pages/StaffRegister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/visitor-checkin" element={<VisitorSelfCheckIn />} />
            <Route path="/visitor/verify/:id" element={<VisitorPassVerification />} />

            {/* Protected Visitor & Security Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Visitor Submenu */}
                <Route path="/visitor/dashboard" element={<VisitorDashboard />} />
                <Route path="/visitor" element={<VisitorManagement />} />
                <Route path="/visitor/reports" element={<VisitorReports />} />

                {/* Security & Gate Submenu */}
                <Route path="/security/dashboard" element={<SecurityDashboard />} />
                <Route path="/security/gate-management" element={<GateManagement />} />
                <Route path="/security/entry-logs" element={<EntryLogs />} />
                <Route path="/security/vehicle-register" element={<VehicleRegister />} />
                <Route path="/security/staff-register" element={<StaffRegister />} />
                
                {/* Alias routes for Security compatibility */}
                <Route path="/security" element={<Navigate to="/security/dashboard" replace />} />
                <Route path="/security/active-visitors" element={<Navigate to="/security/gate-management" replace />} />
                <Route path="/security/logs" element={<Navigate to="/security/entry-logs" replace />} />
              </Route>
            </Route>

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/visitor/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/visitor/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
