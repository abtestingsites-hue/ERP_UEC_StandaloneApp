import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/pages/Login';
import { UNCFDashboard } from './features/dashboard/pages/UNCFDashboard';
import { DonationList } from './features/donations/pages/DonationList';
import { DonationForm } from './features/donations/pages/DonationForm';
import { DonorList } from './features/donors/pages/DonorList';
import { ProjectList } from './features/projects/pages/ProjectList';
import { AllocationList } from './features/funding/pages/AllocationList';
import { ExpenditureList } from './features/expenditures/pages/ExpenditureList';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}

export function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<UNCFDashboard />} />
                <Route path="donations" element={<DonationList />} />
                <Route path="donations/new" element={<DonationForm />} />
                <Route path="donors" element={<DonorList />} />
                <Route path="projects" element={<ProjectList />} />
                <Route path="funding" element={<AllocationList />} />
                <Route path="expenditures" element={<ExpenditureList />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
