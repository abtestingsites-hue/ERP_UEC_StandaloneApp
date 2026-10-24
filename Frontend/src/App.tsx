import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Users, Wallet } from 'lucide-react'
import DashboardLayout from './layouts/DashboardLayout'
import { ToastProvider } from './components/Toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SkeletonLoader, GlobalSpinner } from './components/SkeletonLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import CRMAppLauncher from './components/CRMAppLauncher'
import { NursingAppLauncher, HomeCareAppLauncher, VisitorAppLauncher, InventoryAppLauncher } from './components/WorkspaceLaunchers'

// Auth
import { Login } from './features/auth/pages/Login'
import { ChangePassword } from './features/auth/pages/ChangePassword'
import { ForgotPassword } from './features/auth/pages/ForgotPassword'
import { ResetPassword } from './features/auth/pages/ResetPassword'

// Lazy loaded modules
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const OrganizationDashboard = lazy(() => import('./pages/OrganizationDashboard').then(m => ({ default: m.OrganizationDashboard })))
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard').then(m => ({ default: m.ReportsDashboard })))
const ModuleCommandCenter = lazy(() => import('./pages/ModuleCommandCenter').then(m => ({ default: m.ModuleCommandCenter })))
const FinanceManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.FinanceManagerDashboard })))
const ElderCareAdminDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.ElderCareAdminDashboard })))
const MedicalMonitorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.MedicalMonitorDashboard })))
const EmergencyCallDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.EmergencyCallDashboard })))
const MasterDataManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.MasterDataManagerDashboard })))
const HRManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.HRManagerDashboard })))
const SecuritySupervisorDashboard = lazy(() => import('./features/security/pages/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })))
const CMSManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.CMSManagerDashboard })))
const AdminFilesManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.AdminFilesManagerDashboard })))
const ProfileTaskDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.ProfileTaskDashboard })))
const InHouseCareManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.InHouseCareManagerDashboard })))
const ElderOperationsManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.ElderOperationsManagerDashboard })))
const TaskLogCoordinatorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.TaskLogCoordinatorDashboard })))
const ElderFinanceManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.ElderFinanceManagerDashboard })))
const PatientCareManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.PatientCareManagerDashboard })))
const CareAllocationManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.CareAllocationManagerDashboard })))
const AmbulanceBookingCoordinatorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.AmbulanceBookingCoordinatorDashboard })))
const DispatchManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.DispatchManagerDashboard })))
const FleetManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.FleetManagerDashboard })))
const AmbulanceBillingManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.AmbulanceBillingManagerDashboard })))
const FollowUpCoordinatorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.FollowUpCoordinatorDashboard })))
const CustomerRelationsManagerDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.CustomerRelationsManagerDashboard })))
const OmnichannelCoordinatorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.OmnichannelCoordinatorDashboard })))
const AdmissionsCoordinatorDashboard = lazy(() => import('./pages/RoleDashboards').then(m => ({ default: m.AdmissionsCoordinatorDashboard })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const UserManagement = lazy(() => import('./features/super_admin/pages/UserManagement').then(m => ({ default: m.UserManagement })))

// Master
const CityMaster = lazy(() => import('./features/master/pages/CityMaster').then(m => ({ default: m.CityMaster })))
const UnitMaster = lazy(() => import('./features/master/pages/UnitMaster').then(m => ({ default: m.UnitMaster })))
const AdminFileRegister = lazy(() => import('./features/admin/pages/AdminFileRegister').then(m => ({ default: m.AdminFileRegister })))
const PaymentCategoryMaster = lazy(() => import('./features/master/pages/PaymentCategoryMaster').then(m => ({ default: m.PaymentCategoryMaster })))
const ClientServicesMaster = lazy(() => import('./features/master/pages/ClientServicesMaster').then(m => ({ default: m.ClientServicesMaster })))
const DepartmentMaster = lazy(() => import('./features/master/pages/DepartmentMaster').then(m => ({ default: m.DepartmentMaster })))
const DesignationMaster = lazy(() => import('./features/master/pages/DesignationMaster').then(m => ({ default: m.DesignationMaster })))
const LabourServicesMaster = lazy(() => import('./features/master/pages/LabourServicesMaster').then(m => ({ default: m.LabourServicesMaster })))
const VendorMaster = lazy(() => import('./features/master/pages/VendorMaster').then(m => ({ default: m.VendorMaster })))
const RoomManagementMaster = lazy(() => import('./features/master/pages/RoomManagementMaster').then(m => ({ default: m.RoomManagementMaster })))

// Enquiry & Allocation
const ExistingPatient = lazy(() => import('./features/resident_management/pages/ExistingPatient').then(m => ({ default: m.ExistingPatient })))
const AllClients = lazy(() => import('./features/enquiry/pages/AllClients').then(m => ({ default: m.AllClients })))
const HomeCare = lazy(() => import('./features/allocation/pages/HomeCare').then(m => ({ default: m.HomeCare })))
const ClinicalCare = lazy(() => import('./features/allocation/pages/ClinicalCare').then(m => ({ default: m.ClinicalCare })))
const AllocInHouseCare = lazy(() => import('./features/allocation/pages/InHouseCare').then(m => ({ default: m.InHouseCare })))
const OthersAllocation = lazy(() => import('./features/allocation/pages/Others').then(m => ({ default: m.OthersAllocation })))

// Business & Customer Care
const ClientPortalDashboard = lazy(() => import('./features/client_portal/pages/ClientPortalDashboard').then(m => ({ default: m.ClientPortalDashboard })))
const ClientPortalProfile = lazy(() => import('./features/client_portal/pages/ClientPortalProfile').then(m => ({ default: m.ClientPortalProfile })))
const ClientPortalServices = lazy(() => import('./features/client_portal/pages/ClientPortalServices').then(m => ({ default: m.ClientPortalServices })))
const ClientPortalMedicines = lazy(() => import('./features/client_portal/pages/ClientPortalMedicines').then(m => ({ default: m.ClientPortalMedicines })))
const ClientPortalHealthRecords = lazy(() => import('./features/client_portal/pages/ClientPortalHealthRecords').then(m => ({ default: m.ClientPortalHealthRecords })))
const ClientPortalComplaints = lazy(() => import('./features/client_portal/pages/ClientPortalComplaints').then(m => ({ default: m.ClientPortalComplaints })))
const ClientPortalNotifications = lazy(() => import('./features/client_portal/pages/ClientPortalNotifications').then(m => ({ default: m.ClientPortalNotifications })))
const ClientPortalAccess = lazy(() => import('./features/client_portal/pages/ClientPortalAccess').then(m => ({ default: m.ClientPortalAccess })))

// Dashboard Internal Drill-downs (Finance & Customer Care)
const PendingPaymentsView = lazy(() => import('./features/finance/pages/PendingPaymentsView').then(m => ({ default: m.PendingPaymentsView })))
const IncomeSummaryView = lazy(() => import('./features/finance/pages/IncomeSummaryView').then(m => ({ default: m.IncomeSummaryView })))
const PendingFeedbackView = lazy(() => import('./features/customer_care/pages/PendingFeedbackView').then(m => ({ default: m.PendingFeedbackView })))
const ComplaintsListView = lazy(() => import('./features/customer_care/pages/ComplaintsListView').then(m => ({ default: m.ComplaintsListView })))

// In-House & Accounts
const Revenue = lazy(() => import('./features/inhouse_care/pages/Revenue').then(m => ({ default: m.Revenue })))
const ElderADL = lazy(() => import('./features/inhouse_care/pages/ElderADL').then(m => ({ default: m.ElderADL })))
const EventCalendar = lazy(() => import('./features/inhouse_care/pages/EventCalendar').then(m => ({ default: m.EventCalendar })))
const IncidentReports = lazy(() => import('./features/patient_care/pages/IncidentReports').then(m => ({ default: m.IncidentReports })))
const Vitals = lazy(() => import('./features/nursing_care/pages/Vitals').then(m => ({ default: m.Vitals })))
// HR Launcher Handoff Component
function HRAppLauncher() {
    useEffect(() => {
        const hrUrl = import.meta.env.VITE_HR_APP_URL || 'http://127.0.0.1:5178';
        const pathname = window.location.pathname;
        const targetPath = pathname.startsWith('/hr') ? pathname : '/hr/dashboard';
        window.location.href = `${hrUrl}${targetPath}`;
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0F969C]/10 dark:bg-[#0F969C]/20 flex items-center justify-center text-[#0F969C] animate-pulse">
                <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Launching HR & Workforce Application...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Transferring session to the dedicated HR Standalone App.
            </p>
        </div>
    );
}

// Finance & Patient Billing Standalone App Launcher Handoff Component
function FinanceBillingAppLauncher() {
    useEffect(() => {
        const financeUrl = import.meta.env.VITE_FINANCE_BILLING_APP_URL || 'http://127.0.0.1:5180';
        const pathname = window.location.pathname;
        let targetPath = pathname;
        if (pathname === '/finance' || pathname === '/finance/') {
            targetPath = '/finance/dashboard';
        } else if (pathname === '/accounts' || pathname === '/accounts/' || pathname === '/accounts/cashbox') {
            targetPath = '/finance/cashbox';
        } else if (pathname === '/accounts/pending') {
            targetPath = '/finance/pending-approvals';
        } else if (pathname === '/accounts/income') {
            targetPath = '/finance/income';
        } else if (pathname === '/accounts/expense') {
            targetPath = '/finance/expense';
        } else if (pathname === '/accounts/inhouse-expense') {
            targetPath = '/finance/inhouse-expense';
        } else if (pathname === '/billing' || pathname === '/billing/') {
            targetPath = '/billing/patient-daily-cost';
        }
        window.location.href = `${financeUrl}${targetPath}`;
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0F969C]/10 dark:bg-[#0F969C]/20 flex items-center justify-center text-[#0F969C] animate-pulse">
                <Wallet className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Launching Finance & Patient Billing Application...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Transferring session to the dedicated Finance & Patient Billing Standalone App.
            </p>
        </div>
    );
}

const Blogs = lazy(() => import('./features/cms/pages/Blogs').then(m => ({ default: m.Blogs })))
const FAQPage = lazy(() => import('./features/cms/pages/FAQ').then(m => ({ default: m.FAQPage })))
const Events = lazy(() => import('./features/cms/pages/Events').then(m => ({ default: m.Events })))
const Notifications = lazy(() => import('./features/profile/pages/Notifications').then(m => ({ default: m.Notifications })))
const AssignDailyTask = lazy(() => import('./features/task_log/pages/AssignDailyTask').then(m => ({ default: m.AssignDailyTask })))
const AssignScheduleTask = lazy(() => import('./features/task_log/pages/AssignScheduleTask').then(m => ({ default: m.AssignScheduleTask })))
const DailyTaskApproval = lazy(() => import('./features/task_log/pages/DailyTaskApproval').then(m => ({ default: m.DailyTaskApproval })))
const ScheduleTaskApproval = lazy(() => import('./features/task_log/pages/ScheduleTaskApproval').then(m => ({ default: m.ScheduleTaskApproval })))
const MyProfile = lazy(() => import('./features/profile/pages/MyProfile').then(m => ({ default: m.MyProfile })))
const MyTasks = lazy(() => import('./features/profile/pages/MyTasks').then(m => ({ default: m.MyTasks })))
const MyLeave = lazy(() => import('./features/profile/pages/MyLeave').then(m => ({ default: m.MyLeave })))
const MyAttendance = lazy(() => import('./features/profile/pages/MyAttendance').then(m => ({ default: m.MyAttendance })))
const AutomationDashboard = lazy(() => import('./features/automation/pages/AutomationDashboard').then(m => ({ default: m.AutomationDashboard })))
const EnterpriseIntelligence = lazy(() => import('./features/automation/pages/EnterpriseIntelligence').then(m => ({ default: m.EnterpriseIntelligence })))
const RuleBuilder = lazy(() => import('./features/automation/pages/RuleBuilder').then(m => ({ default: m.RuleBuilder })))
const WorkflowTimeline = lazy(() => import('./features/workflow/pages/WorkflowTimeline').then(m => ({ default: m.WorkflowTimeline })))

// Resident Management Modules
const AdmissionTracking = lazy(() => import('./features/resident_management/pages/AdmissionTracking').then(m => ({ default: m.AdmissionTracking })))
const AdmissionForms = lazy(() => import('./features/resident_management/pages/AdmissionForms').then(m => ({ default: m.AdmissionForms })))

// Healthcare New Modules
const CriticalPatients = lazy(() => import('./features/healthcare/pages/CriticalPatients').then(m => ({ default: m.CriticalPatients })))
const PatientDashboard = lazy(() => import('./features/resident_management/pages/PatientDashboard').then(m => ({ default: m.PatientDashboard })))
const NurseDashboard = lazy(() => import('./features/healthcare/pages/NurseDashboard').then(m => ({ default: m.NurseDashboard })))
// Operations New Modules
const PatientRegistration = lazy(() => import('./features/resident_management/pages/PatientRegistration').then(m => ({ default: m.default })))
const Admission = lazy(() => import('./features/resident_management/pages/Admission').then(m => ({ default: m.default })))
const Discharge = lazy(() => import('./features/resident_management/pages/Discharge').then(m => ({ default: m.default })))
const MedicineRequests = lazy(() => import('./features/nursing_care/pages/MedicineRequests').then(m => ({ default: m.MedicineRequests })))
const MedicineIssueLog = lazy(() => import('./features/nursing_care/pages/MedicineIssueLog').then(m => ({ default: m.MedicineIssueLog })))
const MedicationSchedule = lazy(() => import('./features/nursing_care/pages/MedicationSchedule').then(m => ({ default: m.MedicationSchedule })))
const NutritionDiet = lazy(() => import('./features/patient_care/pages/NutritionDiet').then(m => ({ default: m.NutritionDiet })))
const ADL = lazy(() => import('./features/patient_care/pages/ADL').then(m => ({ default: m.ADLDailyLiving })))
const MedicalMonitor = lazy(() => import('./features/medical/pages/MedicalMonitor').then(m => ({ default: m.MedicalMonitor })))
const MedicalDashboard = lazy(() => import('./features/medical/pages/MedicalDashboard').then(m => ({ default: m.MedicalDashboard })))
const ResidentClinicalView = lazy(() => import('./features/medical/pages/ResidentClinicalView').then(m => ({ default: m.ResidentClinicalView })))
const DoctorDuty = lazy(() => import('./features/medical/pages/DoctorDuty').then(m => ({ default: m.DoctorDuty })))
const DoctorVisits = lazy(() => import('./features/medical/pages/DoctorVisits').then(m => ({ default: m.DoctorVisits })))
const MyShiftDashboard = lazy(() => import('./features/medical/pages/MyShiftDashboard').then(m => ({ default: m.MyShiftDashboard })))

// Operations New Modules
const FoodPreparation = lazy(() => import('./features/operations/pages/FoodPreparation').then(m => ({ default: m.FoodPreparation })))
const NutritionPlanning = lazy(() => import('./features/operations/pages/NutritionPlanning').then(m => ({ default: m.NutritionPlanning })))
const LaundryManagement = lazy(() => import('./features/operations/pages/LaundryManagement').then(m => ({ default: m.LaundryManagement })))
const Maintenance = lazy(() => import('./features/operations/pages/Maintenance').then(m => ({ default: m.Maintenance })))
const WasteManagement = lazy(() => import('./features/operations/pages/WasteManagement').then(m => ({ default: m.WasteManagement })))
const DailyOperations = lazy(() => import('./features/daily_operations/pages/DailyOperations').then(m => ({ default: m.DailyOperations })))

// Inventory New Modules
const InventoryCommandCenter = lazy(() => import('./features/inventory/pages/InventoryCommandCenter').then(m => ({ default: m.InventoryCommandCenter })))

// Security New Modules
const GateManagement = lazy(() => import('./features/security/pages/GateManagement').then(m => ({ default: m.GateManagement })))

const StaffRegister = lazy(() => import('./features/security/pages/StaffRegister').then(m => ({ default: m.StaffRegister })))
const VehicleRegister = lazy(() => import('./features/security/pages/VehicleRegister').then(m => ({ default: m.VehicleRegister })))
const EntryLogs = lazy(() => import('./features/security/pages/EntryLogs').then(m => ({ default: m.EntryLogs })))
const SecurityReports = lazy(() => import('./features/security/pages/SecurityReports').then(m => ({ default: m.SecurityReports })))

const ActionHistory = lazy(() => import('./features/security/pages/ActionHistory').then(m => ({ default: m.ActionHistory })))

// Omnichannel New Modules
const UnifiedInbox = lazy(() => import('./features/omnichannel/pages/UnifiedInbox').then(m => ({ default: m.UnifiedInbox })))
const Email = lazy(() => import('./features/omnichannel/pages/Email').then(m => ({ default: m.Email })))
const WhatsApp = lazy(() => import('./features/omnichannel/pages/WhatsApp').then(m => ({ default: m.WhatsApp })))
const SMS = lazy(() => import('./features/omnichannel/pages/SMS').then(m => ({ default: m.SMS })))
const Calls = lazy(() => import('./features/omnichannel/pages/Calls').then(m => ({ default: m.Calls })))
const MissedCalls = lazy(() => import('./features/omnichannel/pages/MissedCalls').then(m => ({ default: m.MissedCalls })))

// Ambulance Services
const AmbulanceBookings = lazy(() => import('./features/ambulance/pages/AmbulanceBookings').then(m => ({ default: m.AmbulanceBookings })))
const DispatchManagement = lazy(() => import('./features/ambulance/pages/DispatchManagement').then(m => ({ default: m.DispatchManagement })))
const VehicleFleet = lazy(() => import('./features/ambulance/pages/VehicleFleet').then(m => ({ default: m.VehicleFleet })))
const AmbulanceStaffAssignment = lazy(() => import('./features/ambulance/pages/AmbulanceStaffAssignment').then(m => ({ default: m.AmbulanceStaffAssignment })))
const TripSheets = lazy(() => import('./features/ambulance/pages/TripSheets').then(m => ({ default: m.TripSheets })))
const AmbulanceMaintenance = lazy(() => import('./features/ambulance/pages/AmbulanceMaintenance').then(m => ({ default: m.AmbulanceMaintenance })))
const AmbulanceBilling = lazy(() => import('./features/ambulance/pages/AmbulanceBilling').then(m => ({ default: m.AmbulanceBilling })))
const EmergencyCallLogs = lazy(() => import('./features/ambulance/pages/EmergencyCallLogs').then(m => ({ default: m.EmergencyCallLogs })))

const VisitorManagement = lazy(() => import('./features/visitor/pages/VisitorManagement').then(m => ({ default: m.VisitorManagement })))
const VisitorDashboard = lazy(() => import('./features/visitor/pages/VisitorDashboard').then(m => ({ default: m.VisitorDashboard })))
const VisitorSelfCheckIn = lazy(() => import('./features/visitor/pages/VisitorSelfCheckIn').then(m => ({ default: m.VisitorSelfCheckIn })))
const VisitorReports = lazy(() => import('./features/visitor/pages/VisitorReports').then(m => ({ default: m.VisitorReports })))

// Patient Portal
const PatientPortalLogin = lazy(() => import('./features/patient_portal/pages/PatientPortalLogin'))
const PatientPortalLayout = lazy(() => import('./features/patient_portal/pages/PatientPortalLayout'))
const PortalPatientDashboard = lazy(() => import('./features/patient_portal/pages/PatientDashboard'))

// App Routing
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<GlobalSpinner />}>
            <Routes>
              {/* Public Route */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/change-password" element={<ChangePassword />} />
              <Route path="/visitor-checkin" element={<Suspense fallback={<GlobalSpinner />}><VisitorSelfCheckIn /></Suspense>} />
              
              {/* Patient Portal Routes */}
              <Route path="/patient-portal/login" element={<Suspense fallback={<GlobalSpinner />}><PatientPortalLogin /></Suspense>} />
              <Route path="/patient-portal" element={<Suspense fallback={<GlobalSpinner />}><PatientPortalLayout /></Suspense>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<PortalPatientDashboard />} />
              </Route>

              {/* Protected Routes Wrapper */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  <Route path="dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><Dashboard /></Suspense>
                  } />
                  <Route path="reports/dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><ReportsDashboard /></Suspense>
                  } />
                  <Route path="reports/generate" element={
                    <Suspense fallback={<SkeletonLoader />}><ReportsDashboard /></Suspense>
                  } />
                    <Route path=":org/dashboard" element={
                      <Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>
                    } />
                    <Route path=":org/projects" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                    <Route path=":org/funding" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                    <Route path=":org/outreach" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                    <Route path=":org/people" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                    <Route path=":org/reports" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                    <Route path=":org/admin" element={<Suspense fallback={<SkeletonLoader />}><OrganizationDashboard /></Suspense>} />
                  <Route path="module/:hub" element={
                    <Suspense fallback={<SkeletonLoader />}><ModuleCommandCenter /></Suspense>
                  } />
                  <Route path="finance/dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><FinanceManagerDashboard /></Suspense>
                  } />
                  <Route path="uec/elder-care-dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><ElderCareAdminDashboard /></Suspense>
                  } />
                  <Route path="healthcare/medical-monitor-dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><MedicalMonitorDashboard /></Suspense>
                  } />
                  <Route path="ambulance/emergency-dashboard" element={
                    <Suspense fallback={<SkeletonLoader />}><EmergencyCallDashboard /></Suspense>
                  } />
                  <Route path="master/dashboard" element={<Suspense fallback={<SkeletonLoader />}><MasterDataManagerDashboard /></Suspense>} />
                  <Route path="hr/manager-dashboard" element={<Suspense fallback={<SkeletonLoader />}><HRManagerDashboard /></Suspense>} />
                  <Route path="security/dashboard" element={<Suspense fallback={<SkeletonLoader />}><SecuritySupervisorDashboard /></Suspense>} />
                  <Route path="cms/dashboard" element={<Suspense fallback={<SkeletonLoader />}><CMSManagerDashboard /></Suspense>} />
                  <Route path="admin-files/dashboard" element={<Suspense fallback={<SkeletonLoader />}><AdminFilesManagerDashboard /></Suspense>} />
                  <Route path="task-user/dashboard" element={<Suspense fallback={<SkeletonLoader />}><ProfileTaskDashboard /></Suspense>} />
                  <Route path="inhouse-care/dashboard" element={<Suspense fallback={<SkeletonLoader />}><InHouseCareManagerDashboard /></Suspense>} />
                  <Route path="operations/dashboard" element={<Suspense fallback={<SkeletonLoader />}><ElderOperationsManagerDashboard /></Suspense>} />
                  <Route path="inventory/elder-dashboard" element={<Navigate to="/inventory" replace />} />
                  <Route path="task-log/dashboard" element={<Suspense fallback={<SkeletonLoader />}><TaskLogCoordinatorDashboard /></Suspense>} />
                  <Route path="finance/elder-dashboard" element={<Suspense fallback={<SkeletonLoader />}><ElderFinanceManagerDashboard /></Suspense>} />
                  <Route path="healthcare/patient-care-dashboard" element={<Suspense fallback={<SkeletonLoader />}><PatientCareManagerDashboard /></Suspense>} />
                  <Route path="allocation/dashboard" element={<Suspense fallback={<SkeletonLoader />}><CareAllocationManagerDashboard /></Suspense>} />
                  <Route path="inventory/medical-dashboard" element={<Navigate to="/inventory" replace />} />
                  <Route path="ambulance/booking-dashboard" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceBookingCoordinatorDashboard /></Suspense>} />
                  <Route path="ambulance/dispatch-dashboard" element={<Suspense fallback={<SkeletonLoader />}><DispatchManagerDashboard /></Suspense>} />
                  <Route path="ambulance/fleet-dashboard" element={<Suspense fallback={<SkeletonLoader />}><FleetManagerDashboard /></Suspense>} />
                  <Route path="ambulance/billing-dashboard" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceBillingManagerDashboard /></Suspense>} />
                  <Route path="crm/follow-up-dashboard" element={<Suspense fallback={<SkeletonLoader />}><FollowUpCoordinatorDashboard /></Suspense>} />
                  <Route path="customer-care/dashboard" element={<Suspense fallback={<SkeletonLoader />}><CustomerRelationsManagerDashboard /></Suspense>} />
                  <Route path="omnichannel/dashboard" element={<Suspense fallback={<SkeletonLoader />}><OmnichannelCoordinatorDashboard /></Suspense>} />
                  <Route path="crm/admissions-dashboard" element={<Suspense fallback={<SkeletonLoader />}><AdmissionsCoordinatorDashboard /></Suspense>} />
                  <Route path="settings" element={
                    <Suspense fallback={<SkeletonLoader />}><Settings /></Suspense>
                  } />
                  <Route path="super-admin/users" element={
                    <Suspense fallback={<SkeletonLoader />}><UserManagement /></Suspense>
                  } />
                  <Route path="/medical/monitor" element={<MedicalMonitor />} />
                    <Route path="/medical/doctor-dashboard" element={<Suspense fallback={<SkeletonLoader />}><MedicalDashboard /></Suspense>} />
                  <Route path="/medical/clinical-view" element={<Suspense fallback={<SkeletonLoader />}><ResidentClinicalView /></Suspense>} />
                  <Route path="/medical/doctor-duty" element={<Suspense fallback={<SkeletonLoader />}><DoctorDuty /></Suspense>} />
                  <Route path="/medical/doctor-visits" element={<Suspense fallback={<SkeletonLoader />}><DoctorVisits /></Suspense>} />
                  <Route path="/medical/my-shift" element={<Suspense fallback={<SkeletonLoader />}><MyShiftDashboard /></Suspense>} />
                            
                  {/* Healthcare Routes */}
                  <Route path="/healthcare/registration" element={<PatientRegistration />} />
                  <Route path="/healthcare/admission" element={<Admission />} />
                  <Route path="/healthcare/discharge" element={<Discharge />} />
                    <Route path="/healthcare/critical-patients" element={<CriticalPatients />} />
                    <Route path="/healthcare/nurse-dashboard" element={<NurseDashboard />} />

                  {/* Master Module */}
                  <Route path="master/city" element={<Suspense fallback={<SkeletonLoader />}><CityMaster /></Suspense>} />
                  <Route path="master/unit" element={<Suspense fallback={<SkeletonLoader />}><UnitMaster /></Suspense>} />
                  <Route path="master/admin-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="uec/admin-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/uncf-documents" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/uec-documents" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/staff-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/client-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/finance-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/uec-licence-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/record-books" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/nursing-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="admin-files/watchman-files" element={<Suspense fallback={<SkeletonLoader />}><AdminFileRegister /></Suspense>} />
                  <Route path="master/client-services" element={<Suspense fallback={<SkeletonLoader />}><ClientServicesMaster /></Suspense>} />
                  <Route path="master/department" element={<Suspense fallback={<SkeletonLoader />}><DepartmentMaster /></Suspense>} />
                  <Route path="master/designation" element={<Suspense fallback={<SkeletonLoader />}><DesignationMaster /></Suspense>} />

                  {/* Automation Module */}
                  <Route path="workflow/timeline" element={<Suspense fallback={<SkeletonLoader />}><WorkflowTimeline /></Suspense>} />
                  <Route path="automation/dashboard" element={<Suspense fallback={<SkeletonLoader />}><AutomationDashboard /></Suspense>} />
                  <Route path="automation/intelligence" element={<Suspense fallback={<SkeletonLoader />}><EnterpriseIntelligence /></Suspense>} />
                  <Route path="automation/rules" element={<Suspense fallback={<SkeletonLoader />}><RuleBuilder /></Suspense>} />
                  <Route path="master/labour-services" element={<Suspense fallback={<SkeletonLoader />}><LabourServicesMaster /></Suspense>} />
                  <Route path="master/payment-category" element={<Suspense fallback={<SkeletonLoader />}><PaymentCategoryMaster /></Suspense>} />
                  <Route path="master/vendor" element={<Suspense fallback={<SkeletonLoader />}><VendorMaster /></Suspense>} />
                  <Route path="master/room" element={<Suspense fallback={<SkeletonLoader />}><RoomManagementMaster /></Suspense>} />

                  {/* Enquiry & CRM Handoff Routes */}
                  <Route path="enquiry/follow-up" element={<CRMAppLauncher customPath="/crm/enquiry-follow-up" />} />
                  <Route path="enquiry/follow-up/*" element={<CRMAppLauncher />} />
                  <Route path="enquiry/new" element={<CRMAppLauncher customPath="/crm/new-enquiry" />} />
                  <Route path="enquiry/clients" element={<Suspense fallback={<SkeletonLoader />}><AllClients /></Suspense>} />
                  <Route path="crm/enquiry-follow-up" element={<CRMAppLauncher customPath="/crm/enquiry-follow-up" />} />
                  <Route path="crm/enquiry-follow-up/*" element={<CRMAppLauncher />} />
                  <Route path="crm/new-enquiry" element={<CRMAppLauncher customPath="/crm/new-enquiry" />} />
                  <Route path="crm/existing-patient" element={<Suspense fallback={<SkeletonLoader />}><ExistingPatient /></Suspense>} />
                  <Route path="crm/clients" element={<Suspense fallback={<SkeletonLoader />}><AllClients /></Suspense>} />

                  {/* Allocation Module */}
                  <Route path="allocation/home-care" element={<Suspense fallback={<SkeletonLoader />}><HomeCare /></Suspense>} />
                  <Route path="allocation/clinical-care" element={<Suspense fallback={<SkeletonLoader />}><ClinicalCare /></Suspense>} />
                  <Route path="allocation/inhouse-care" element={<Suspense fallback={<SkeletonLoader />}><AllocInHouseCare /></Suspense>} />
                  <Route path="allocation/others" element={<Suspense fallback={<SkeletonLoader />}><OthersAllocation /></Suspense>} />
                  <Route path="visitor" element={<VisitorAppLauncher customPath="/visitor" />} />
                  <Route path="visitor/dashboard" element={<Suspense fallback={<SkeletonLoader />}><VisitorDashboard /></Suspense>} />
                  <Route path="visitor/reports" element={<Suspense fallback={<SkeletonLoader />}><VisitorReports /></Suspense>} />
                  <Route path="visitor/*" element={<VisitorAppLauncher />} />
                  <Route path="visitor-module" element={<VisitorAppLauncher customPath="/visitor-module" />} />

                  {/* Business & Customer Care Handoff Routes */}
                  <Route path="business/welcome-call" element={<CRMAppLauncher customPath="/crm/customer-care/welcome-calls" />} />
                  <Route path="customer-care/pending-feedback" element={<Suspense fallback={<SkeletonLoader />}><PendingFeedbackView /></Suspense>} />
                  <Route path="customer-care/complaints" element={<Suspense fallback={<SkeletonLoader />}><ComplaintsListView /></Suspense>} />
                  <Route path="customer-care/service-history" element={<CRMAppLauncher customPath="/crm/customer-care/service-history" />} />
                  <Route path="client-portal/access" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalAccess /></Suspense>} />
                  <Route path="client-portal/dashboard" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalDashboard /></Suspense>} />
                  <Route path="client-portal/profile" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalProfile /></Suspense>} />
                  <Route path="client-portal/services" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalServices /></Suspense>} />
                  <Route path="client-portal/medicines" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalMedicines /></Suspense>} />
                  <Route path="client-portal/health-records" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalHealthRecords /></Suspense>} />
                  <Route path="client-portal/complaints" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalComplaints /></Suspense>} />
                  <Route path="client-portal/notifications" element={<Suspense fallback={<SkeletonLoader />}><ClientPortalNotifications /></Suspense>} />

                  {/* In-House Care */}
                  <Route path="inhouse-care/revenue" element={<Suspense fallback={<SkeletonLoader />}><Revenue /></Suspense>} />
                  <Route path="inhouse-care/vitals" element={<Suspense fallback={<SkeletonLoader />}><Vitals /></Suspense>} />
                  <Route path="inhouse-care/adl" element={<Suspense fallback={<SkeletonLoader />}><ElderADL /></Suspense>} />
                  <Route path="inhouse-care/events" element={<Suspense fallback={<SkeletonLoader />}><EventCalendar /></Suspense>} />
                  <Route path="inhouse-care/incidents" element={<Suspense fallback={<SkeletonLoader />}><IncidentReports /></Suspense>} />
                  <Route path="healthcare/vitals" element={<Suspense fallback={<SkeletonLoader />}><Vitals /></Suspense>} />

                  {/* Internal Finance Dashboard Drill-downs */}
                  <Route path="finance/pending-payments" element={<Suspense fallback={<SkeletonLoader />}><PendingPaymentsView /></Suspense>} />
                  <Route path="finance/income" element={<Suspense fallback={<SkeletonLoader />}><IncomeSummaryView /></Suspense>} />

                  {/* Standalone Finance & Patient Billing App Launchers */}
                  <Route path="accounts/*" element={<FinanceBillingAppLauncher />} />
                  <Route path="finance/*" element={<FinanceBillingAppLauncher />} />
                  <Route path="billing/*" element={<FinanceBillingAppLauncher />} />

                  {/* HR Standalone App Launcher Handoff */}
                  <Route path="hr/*" element={<HRAppLauncher />} />

                  {/* CMS Module */}
                  <Route path="cms/blogs" element={<Suspense fallback={<SkeletonLoader />}><Blogs /></Suspense>} />
                  <Route path="cms/faq" element={<Suspense fallback={<SkeletonLoader />}><FAQPage /></Suspense>} />
                  <Route path="cms/events" element={<Suspense fallback={<SkeletonLoader />}><Events /></Suspense>} />

                  {/* Profile Module */}
                  <Route path="profile/notifications" element={<Suspense fallback={<SkeletonLoader />}><Notifications /></Suspense>} />
                  <Route path="profile/me" element={<Suspense fallback={<SkeletonLoader />}><MyProfile /></Suspense>} />
                  <Route path="profile/tasks" element={<Suspense fallback={<SkeletonLoader />}><MyTasks /></Suspense>} />
                  <Route path="profile/leave" element={<Suspense fallback={<SkeletonLoader />}><MyLeave /></Suspense>} />
                  <Route path="profile/attendance" element={<Suspense fallback={<SkeletonLoader />}><MyAttendance /></Suspense>} />

                  {/* Task Log Module */}
                  <Route path="task-log/assign-daily" element={<Suspense fallback={<SkeletonLoader />}><AssignDailyTask /></Suspense>} />
                  <Route path="task-log/assign-schedule" element={<Suspense fallback={<SkeletonLoader />}><AssignScheduleTask /></Suspense>} />
                  <Route path="task-log/daily-approval" element={<Suspense fallback={<SkeletonLoader />}><DailyTaskApproval /></Suspense>} />
                  <Route path="task-log/schedule-approval" element={<Suspense fallback={<SkeletonLoader />}><ScheduleTaskApproval /></Suspense>} />

                  {/* CRM Handoff Routes */}
                  <Route path="crm/dashboard" element={<CRMAppLauncher customPath="/crm/dashboard" />} />
                  <Route path="crm/active-enquiries" element={<CRMAppLauncher customPath="/crm/active-enquiries" />} />
                  <Route path="crm/admission-tracking" element={<Suspense fallback={<SkeletonLoader />}><AdmissionTracking /></Suspense>} />
                  <Route path="crm/customer-care" element={<CRMAppLauncher customPath="/crm/customer-care" />} />
                  <Route path="crm/feedback" element={<CRMAppLauncher customPath="/crm/customer-care/pending-feedback" />} />
                  <Route path="crm/admission-forms" element={<Suspense fallback={<SkeletonLoader />}><AdmissionForms /></Suspense>} />
                  <Route path="crm/b2p" element={<CRMAppLauncher customPath="/crm/b2p" />} />
                  <Route path="crm/marketing" element={<CRMAppLauncher customPath="/crm/marketing" />} />
                  <Route path="crm/*" element={<CRMAppLauncher />} />

                  {/* Nursing Care New Routes */}
                  <Route path="nursing-care/critical-patients" element={<Suspense fallback={<SkeletonLoader />}><CriticalPatients /></Suspense>} />
                  <Route path="nursing-care/medicine-requests" element={<NursingAppLauncher customPath="/nursing-care/medicine-requests" />} />
                  <Route path="nursing-care/medicine-issue-log" element={<NursingAppLauncher customPath="/nursing-care/medicine-issue-log" />} />
                  <Route path="nursing-care/medication-schedule" element={<NursingAppLauncher customPath="/nursing-care/medication-schedule" />} />
                  <Route path="nursing-care/vitals" element={<NursingAppLauncher customPath="/nursing-care/vitals" />} />
                  <Route path="nursing-care/*" element={<NursingAppLauncher />} />

                  {/* Patient Care New Routes */}
                  <Route path="patient-care/dashboard" element={<Suspense fallback={<SkeletonLoader />}><PatientDashboard /></Suspense>} />
                  <Route path="patient-care/nutrition-diet" element={<Suspense fallback={<SkeletonLoader />}><NutritionDiet /></Suspense>} />
                  <Route path="patient-care/adl" element={<Suspense fallback={<SkeletonLoader />}><ADL /></Suspense>} />
                  <Route path="patient-care/incidents" element={<Suspense fallback={<SkeletonLoader />}><IncidentReports /></Suspense>} />
                  <Route path="healthcare/medical-monitor" element={<Suspense fallback={<SkeletonLoader />}><MedicalMonitor /></Suspense>} />

                  {/* Operations New Routes */}
                  <Route path="daily-operations" element={<Suspense fallback={<SkeletonLoader />}><DailyOperations /></Suspense>} />
                  <Route path="operations/food-preparation" element={<Suspense fallback={<SkeletonLoader />}><FoodPreparation /></Suspense>} />
                  <Route path="operations/nutrition-planning" element={<Suspense fallback={<SkeletonLoader />}><NutritionPlanning /></Suspense>} />
                  <Route path="operations/laundry-management" element={<Suspense fallback={<SkeletonLoader />}><LaundryManagement /></Suspense>} />
                  <Route path="operations/maintenance" element={<Suspense fallback={<SkeletonLoader />}><Maintenance /></Suspense>} />
                  <Route path="operations/waste-management" element={<Suspense fallback={<SkeletonLoader />}><WasteManagement /></Suspense>} />

                  {/* Inventory Standalone App Launcher & Legacy Fallback Routes */}
                  <Route path="inventory" element={<InventoryAppLauncher />} />
                  <Route path="inventory/legacy" element={<Suspense fallback={<SkeletonLoader />}><InventoryCommandCenter /></Suspense>} />
                  <Route path="inventory/low-stock-alerts" element={<InventoryAppLauncher customPath="/app/low-stock" />} />
                  <Route path="inventory/products/ration" element={<InventoryAppLauncher customPath="/app/products" />} />
                  <Route path="inventory/products/stationary" element={<InventoryAppLauncher customPath="/app/products" />} />
                  <Route path="inventory/products/electrical-plumbing" element={<InventoryAppLauncher customPath="/app/products" />} />
                  <Route path="inventory/products/assets" element={<InventoryAppLauncher customPath="/app/products" />} />
                  <Route path="inventory/stock" element={<InventoryAppLauncher customPath="/app/stock" />} />
                  <Route path="inventory/stock-issue" element={<InventoryAppLauncher customPath="/app/issues" />} />
                  <Route path="inventory/stock-movements" element={<InventoryAppLauncher customPath="/app/movements" />} />
                  <Route path="inventory/purchase-orders" element={<InventoryAppLauncher customPath="/app/purchases" />} />
                  <Route path="inventory/vendors" element={<InventoryAppLauncher customPath="/app/vendors" />} />

                  {/* Security New Routes */}
                  <Route path="security/gate-management" element={<Suspense fallback={<SkeletonLoader />}><GateManagement /></Suspense>} />
                  <Route path="visitor-module" element={<Suspense fallback={<SkeletonLoader />}><VisitorManagement /></Suspense>} />

                  <Route path="visitor-module/dashboard" element={<Suspense fallback={<SkeletonLoader />}><VisitorDashboard /></Suspense>} />
                  <Route path="security/visitor-reports" element={<Suspense fallback={<SkeletonLoader />}><VisitorReports /></Suspense>} />
                  <Route path="security/staff-register" element={<Suspense fallback={<SkeletonLoader />}><StaffRegister /></Suspense>} />
                  <Route path="security/vehicle-register" element={<Suspense fallback={<SkeletonLoader />}><VehicleRegister /></Suspense>} />
                  <Route path="security/entry-logs" element={<Suspense fallback={<SkeletonLoader />}><EntryLogs /></Suspense>} />
                  <Route path="security/reports" element={<Suspense fallback={<SkeletonLoader />}><SecurityReports /></Suspense>} />

                  <Route path="security/action-history" element={<Suspense fallback={<SkeletonLoader />}><ActionHistory /></Suspense>} />

                  {/* Omnichannel New Routes */}
                  <Route path="omnichannel/conversations" element={<Suspense fallback={<SkeletonLoader />}><UnifiedInbox /></Suspense>} />
                  <Route path="omnichannel/email" element={<Suspense fallback={<SkeletonLoader />}><Email /></Suspense>} />
                  <Route path="omnichannel/whatsapp" element={<Suspense fallback={<SkeletonLoader />}><WhatsApp /></Suspense>} />
                  <Route path="omnichannel/sms" element={<Suspense fallback={<SkeletonLoader />}><SMS /></Suspense>} />
                  <Route path="omnichannel/missed-calls" element={<Suspense fallback={<SkeletonLoader />}><MissedCalls /></Suspense>} />
                  <Route path="omnichannel/calls" element={<Suspense fallback={<SkeletonLoader />}><Calls /></Suspense>} />

                  {/* Ambulance Services Routes */}
                  <Route path="ambulance/bookings" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceBookings /></Suspense>} />
                  <Route path="ambulance/dispatch" element={<Suspense fallback={<SkeletonLoader />}><DispatchManagement /></Suspense>} />
                  <Route path="ambulance/fleet" element={<Suspense fallback={<SkeletonLoader />}><VehicleFleet /></Suspense>} />
                  <Route path="ambulance/staff-assignment" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceStaffAssignment /></Suspense>} />
                  <Route path="ambulance/trip-sheets" element={<Suspense fallback={<SkeletonLoader />}><TripSheets /></Suspense>} />
                  <Route path="ambulance/maintenance" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceMaintenance /></Suspense>} />
                  <Route path="ambulance/billing" element={<Suspense fallback={<SkeletonLoader />}><AmbulanceBilling /></Suspense>} />
                  <Route path="ambulance/call-logs" element={<Suspense fallback={<SkeletonLoader />}><EmergencyCallLogs /></Suspense>} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App


