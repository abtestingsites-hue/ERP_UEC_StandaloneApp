import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './features/auth/pages/Login';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { ResetPassword } from './features/auth/pages/ResetPassword';
import DashboardLayout from './layouts/DashboardLayout';

import Patients from './features/patients/pages/Patients';
import Vitals from './features/vitals/pages/Vitals';
import Medication from './features/medication/pages/Medication';
import ADL from './features/adl/pages/ADL';
import Nutrition from './features/nutrition/pages/Nutrition';
import CriticalPatients from './features/critical-patients/pages/CriticalPatients';
import MyShift from './features/my-shift/pages/MyShift';
import ClinicalDutyWorkspace from './features/clinical-duty/pages/ClinicalDutyWorkspace';
import Revenue from './features/revenue/pages/Revenue';


import NursingManagerDashboard from './features/manager/pages/NursingManagerDashboard';
import StaffList from './features/manager/pages/StaffList';
import Assignments from './features/manager/pages/Assignments';
import ManagerRevenue from './features/manager/pages/ManagerRevenue';
import ManagerMonitoring from './features/manager/pages/ManagerMonitoring';

import StaffDashboard from './features/dashboard/pages/StaffDashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuthStore();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isManager = userRole === 'NURSING_MANAGER' || userRole === 'SUPER_ADMIN' || userRole === 'MEDICAL_MANAGER';

  if (isManager) {
    return <Navigate to="/manager" replace />;
  }
  return <StaffDashboard />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user } = useAuthStore();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<RoleBasedDashboard />} />
          
          <Route path="manager" element={
            <RoleProtectedRoute allowedRoles={['NURSING_MANAGER', 'SUPER_ADMIN', 'MEDICAL_MANAGER']}>
              <NursingManagerDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="manager/staff" element={
            <RoleProtectedRoute allowedRoles={['NURSING_MANAGER', 'SUPER_ADMIN', 'MEDICAL_MANAGER']}>
              <StaffList />
            </RoleProtectedRoute>
          } />
          <Route path="manager/assignments" element={
            <RoleProtectedRoute allowedRoles={['NURSING_MANAGER', 'SUPER_ADMIN', 'MEDICAL_MANAGER']}>
              <Assignments />
            </RoleProtectedRoute>
          } />
          <Route path="manager/monitoring" element={
            <RoleProtectedRoute allowedRoles={['NURSING_MANAGER', 'SUPER_ADMIN', 'MEDICAL_MANAGER']}>
              <ManagerMonitoring />
            </RoleProtectedRoute>
          } />
          <Route path="manager/revenue" element={
            <RoleProtectedRoute allowedRoles={['NURSING_MANAGER', 'SUPER_ADMIN', 'MEDICAL_MANAGER']}>
              <ManagerRevenue />
            </RoleProtectedRoute>
          } />

          
          <Route path="patients" element={<Patients />} />
          <Route path="vitals" element={<Vitals />} />
          <Route path="medication" element={<Medication />} />
          <Route path="adl" element={<ADL />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="critical-patients" element={<CriticalPatients />} />
          <Route path="my-shift" element={<MyShift />} />
          <Route path="clinical-duty/:assignmentId" element={<ClinicalDutyWorkspace />} />
          <Route path="revenue" element={<Revenue />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
