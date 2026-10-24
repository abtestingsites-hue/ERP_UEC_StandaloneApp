import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/Toast';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/pages/Login';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { ResetPassword } from './features/auth/pages/ResetPassword';
import { useAuthStore } from './store/authStore';

// HR Pages
import { HRDashboard } from './features/hr/pages/HRDashboard';
import { StaffManagement } from './features/hr/pages/StaffManagement';
import { RolesPermissions } from './features/hr/pages/RolesPermissions';
import { StaffPrivilege } from './features/hr/pages/StaffPrivilege';
import { StaffMenuPrivilege } from './features/hr/pages/StaffMenuPrivilege';
import { LeaveManagement } from './features/hr/pages/LeaveManagement';
import { Attendance } from './features/hr/pages/Attendance';
import { ShiftRoster } from './features/hr/pages/ShiftRoster';
import { Payroll } from './features/hr/pages/Payroll';
import { CandidatePipeline } from './features/hr/pages/CandidatePipeline';
import { CandidateForm } from './features/hr/pages/CandidateForm';
import { JobEnquiry } from './features/hr/pages/JobEnquiry';
import { DocumentTracker } from './features/hr/pages/DocumentTracker';
import { LabourManagement } from './features/hr/pages/LabourManagement';
import { HRReports } from './features/hr/pages/HRReports';
import { FieldDuty } from './features/hr/pages/FieldDuty';
import { HolidayMapping } from './features/hr/pages/HolidayMapping';
import { TrainingCompliance } from './features/hr/pages/TrainingCompliance';

// Profile Pages
import { MyProfile } from './features/profile/pages/MyProfile';
import { MyLeave } from './features/profile/pages/MyLeave';
import { MyAttendance } from './features/profile/pages/MyAttendance';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="/hr/dashboard" replace />} />
                            <Route path="hr/dashboard" element={<HRDashboard />} />
                            <Route path="hr/staff" element={<StaffManagement />} />
                            <Route path="hr/roles" element={<RolesPermissions />} />
                            <Route path="hr/staff-privileges" element={<StaffPrivilege />} />
                            <Route path="hr/menu-privileges" element={<StaffMenuPrivilege />} />
                            <Route path="hr/menu-privileges/:id" element={<StaffMenuPrivilege />} />
                            <Route path="hr/leaves" element={<LeaveManagement />} />
                            <Route path="hr/attendance" element={<Attendance />} />
                            <Route path="hr/shift-roster" element={<ShiftRoster />} />
                            <Route path="hr/payroll" element={<Payroll />} />
                            <Route path="hr/recruitment/pipeline" element={<CandidatePipeline />} />
                            <Route path="hr/recruitment/candidate/new" element={<CandidateForm />} />
                            <Route path="hr/recruitment/candidate/edit/:id" element={<CandidateForm />} />
                            <Route path="hr/recruitment/job-enquiry" element={<JobEnquiry />} />
                            <Route path="hr/document-tracker" element={<DocumentTracker />} />
                            <Route path="hr/labour-management" element={<LabourManagement />} />
                            <Route path="hr/reports" element={<HRReports />} />
                            <Route path="hr/field-duty" element={<FieldDuty />} />
                            <Route path="hr/holiday-mapping" element={<HolidayMapping />} />
                            <Route path="hr/training-compliance" element={<TrainingCompliance />} />

                            {/* Self Service Profile */}
                            <Route path="profile/me" element={<MyProfile />} />
                            <Route path="profile/leaves" element={<MyLeave />} />
                            <Route path="profile/attendance" element={<MyAttendance />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </QueryClientProvider>
    );
}

export default App;
