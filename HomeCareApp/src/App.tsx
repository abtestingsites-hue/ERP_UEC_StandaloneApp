import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './features/auth/pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import HomeCareManagerDashboard from './features/manager/pages/HomeCareManagerDashboard';
import HomeCareStaffDashboard from './features/dashboard/pages/HomeCareStaffDashboard';
import Enquiries from './features/enquiries/pages/Enquiries';
import ServiceRequirements from './features/service-requirements/pages/ServiceRequirements';
import Clients from './features/clients/pages/Clients';
import MyClients from './features/clients/pages/MyClients';
import ServiceContracts from './features/contracts/pages/ServiceContracts';
import StaffAllocations from './features/allocations/pages/StaffAllocations';
import ManagerRoster from './features/roster/pages/ManagerRoster';
import MyRoster from './features/roster/pages/MyRoster';
import CaregiverVisits from './features/visits/pages/CaregiverVisits';
import VisitDetails from './features/visits/pages/VisitDetails';
import CareDeliveryLog from './features/care-delivery/pages/CareDeliveryLog';

const MANAGER_ROLES = ['HOME_CARE_MANAGER', 'SUPER_ADMIN', 'CARE_ALLOCATION_MANAGER'];

const RoleBasedDashboard = () => {
  const { user } = useAuthStore();
  const rawRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const userRole = String(rawRole || '').trim().toUpperCase().replace(/\s+/g, '_');
  const isManager = MANAGER_ROLES.includes(userRole);

  if (isManager) {
    return <Navigate to="/manager" replace />;
  }
  return <HomeCareStaffDashboard />;
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
  const rawRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const userRole = String(rawRole || '').trim().toUpperCase().replace(/\s+/g, '_');
  
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
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<RoleBasedDashboard />} />
          <Route path="my-clients" element={<MyClients />} />
          <Route path="my-roster" element={<MyRoster />} />
          <Route path="my-visits" element={<CaregiverVisits />} />
          <Route path="visits/:id" element={<VisitDetails />} />
          <Route path="care-delivery/:patientId" element={<CareDeliveryLog />} />
          
          <Route path="manager" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <HomeCareManagerDashboard />
            </RoleProtectedRoute>
          } />

          <Route path="manager/enquiries" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <Enquiries />
            </RoleProtectedRoute>
          } />

          <Route path="manager/clients" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <Clients />
            </RoleProtectedRoute>
          } />

          <Route path="manager/service-requirements" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <ServiceRequirements />
            </RoleProtectedRoute>
          } />

          <Route path="manager/contracts" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <ServiceContracts />
            </RoleProtectedRoute>
          } />

          <Route path="manager/allocations" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <StaffAllocations />
            </RoleProtectedRoute>
          } />

          <Route path="manager/roster" element={
            <RoleProtectedRoute allowedRoles={MANAGER_ROLES}>
              <ManagerRoster />
            </RoleProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
