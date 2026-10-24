import type { User } from '../store/authStore'

const OPEN_PATH_PREFIXES: string[] = []

const UNCF_DASHBOARD_ROLES = [
    'uncf admin',
    'master data manager',
    'finance manager',
    'hr manager',
    'cms manager'
]

const UHC_DASHBOARD_ROLES = ['uhc admin']
const UA_DASHBOARD_ROLES = ['ua admin']
const UEO_DASHBOARD_ROLES = ['ueo admin']
const STAFF_SELF_SERVICE_PERMISSIONS = ['My Profile', 'Daily Task', 'My Attendance', 'My Leave', 'Profile Task Dashboard', 'Notifications']
const CLIENT_PORTAL_ROLES = ['family member', 'client', 'client family member']
const CLIENT_PORTAL_PERMISSIONS = ['Client Portal Dashboard', 'My Services', 'My Complaints']
const REPORT_PERMISSIONS = ['Reports', 'Workflow Timeline', 'ALL_ACCESS']

const roleDefaultRoutes: Record<string, string> = {
    'super_admin': '/dashboard',
    'super admin': '/dashboard',
    'master data manager': '/master/dashboard',
    'finance manager': '/finance/dashboard',
    'hr manager': '/hr/manager-dashboard',
    'security supervisor': '/security/dashboard',
    'cms manager': '/cms/dashboard',
    'admin files manager': '/admin-files/dashboard',
    'profile task user': '/task-user/dashboard',
    'family member': '/client-portal/dashboard',
    'client': '/client-portal/dashboard',
    'client family member': '/client-portal/dashboard',
    'elder care admin': '/uec/elder-care-dashboard',
    'in-house care manager': '/inhouse-care/dashboard',
    'elder operations manager': '/operations/dashboard',
    'inventory manager': '/inventory',
    'elder inventory manager': '/inventory',
    'task log coordinator': '/task-log/dashboard',
    'elder finance manager': '/finance/elder-dashboard',
    'uhc admin': '/uhc/dashboard',
    'patient care manager': '/module/patient-care',
    'patient_care_manager': '/module/patient-care',
    'caregiver': '/module/patient-care',
    'nursing manager': '/nursing-care/dashboard',
    'nursing_manager': '/nursing-care/dashboard',
    'nurse': '/nursing-care/dashboard',
    'nursing care staff': '/nursing-care/dashboard',
    'nursing_care_staff': '/nursing-care/dashboard',
    'medical monitor coordinator': '/healthcare/medical-monitor-dashboard',
    'care allocation manager': '/allocation/dashboard',
    'medical inventory manager': '/inventory',
    'ua admin': '/ua/dashboard',
    'ambulance booking coordinator': '/ambulance/booking-dashboard',
    'dispatch manager': '/ambulance/dispatch-dashboard',
    'fleet manager': '/ambulance/fleet-dashboard',
    'ambulance billing manager': '/ambulance/billing-dashboard',
    'emergency call coordinator': '/ambulance/emergency-dashboard',
    'ueo admin': '/ueo/dashboard',
    'enquiry desk manager': '/crm/dashboard',
    'follow-up coordinator': '/crm/follow-up-dashboard',
    'customer relations manager': '/customer-care/dashboard',
    'omnichannel coordinator': '/omnichannel/dashboard',
    'admissions coordinator': '/crm/admissions-dashboard',
    'visitor receptionist': '/visitor-module/dashboard'
}

const roleDashboardAccess: Record<string, string[]> = {
    '/master/dashboard': ['master data manager'],
    '/finance/dashboard': ['finance manager'],
    '/hr/manager-dashboard': ['hr manager'],
    '/security/dashboard': ['security supervisor'],
    '/cms/dashboard': ['cms manager'],
    '/admin-files/dashboard': ['admin files manager'],
    '/task-user/dashboard': ['profile task user'],
    '/uec/elder-care-dashboard': ['elder care admin'],
    '/inhouse-care/dashboard': ['in-house care manager'],
    '/operations/dashboard': ['elder operations manager'],
    '/inventory': ['inventory manager', 'elder inventory manager', 'medical inventory manager'],
    '/inventory/elder-dashboard': ['elder inventory manager'],
    '/task-log/dashboard': ['task log coordinator'],
    '/finance/elder-dashboard': ['elder finance manager'],
    '/module/patient-care': ['patient care manager', 'patient_care_manager', 'caregiver'],
    '/module/nursing-care': ['nursing manager', 'nursing_manager', 'nurse', 'nursing care staff', 'nursing_care_staff'],
    '/nursing-care/dashboard': ['nursing manager', 'nursing_manager', 'nurse', 'nursing care staff', 'nursing_care_staff'],
    '/healthcare/medical-monitor-dashboard': ['medical monitor coordinator'],
    '/allocation/dashboard': ['care allocation manager'],
    '/inventory/medical-dashboard': ['medical inventory manager'],
    '/ambulance/booking-dashboard': ['ambulance booking coordinator'],
    '/ambulance/dispatch-dashboard': ['dispatch manager'],
    '/ambulance/fleet-dashboard': ['fleet manager'],
    '/ambulance/billing-dashboard': ['ambulance billing manager'],
    '/ambulance/emergency-dashboard': ['emergency call coordinator'],
    '/crm/dashboard': ['enquiry desk manager'],
    '/crm/follow-up-dashboard': ['follow-up coordinator'],
    '/customer-care/dashboard': ['customer relations manager'],
    '/omnichannel/dashboard': ['omnichannel coordinator'],
    '/crm/admissions-dashboard': ['admissions coordinator']
}

const rolePreferredPathRedirects: Record<string, Record<string, string>> = {
    'follow-up coordinator': {
        '/enquiry/follow-up': '/crm/follow-up-dashboard'
    }
}

const rolePermissionFallbacks: Record<string, string[]> = {
    'super_admin': ['ALL_ACCESS'],
    'super admin': ['ALL_ACCESS'],
    'master data manager': [
        'Master Dashboard', 'City Master', 'Unit Master', 'Client Services', 'Department Master', 'Designation Master',
        'Labour Services', 'Payment Category', 'Vendor Master', 'Room Management'
    ],
    'finance manager': [
        'Finance Dashboard', 'Cashbox', 'Income', 'Expense', 'Pending Payments', 'Cashbox Pending',
        'Allowance Tracking', 'Invoice', 'Renewals', 'Workflow Timeline'
    ],
    'hr manager': [
        'HR Manager Dashboard', 'Human Resource', 'Staff Management', 'Staff Privilege',
        'Leave Management', 'Shift Roster', 'Document Tracker', 'Training Compliance', 'Labour Mgt',
        'Recruitment', 'Job Enquiry', 'Attendance', 'Holiday Mapping', 'Payroll', 'HR Reports'
    ],
    'security supervisor': [
        'Security Dashboard', 'Gate Management', 'Visitor Management', 'Staff Register', 'Vehicle Register', 'Entry Logs', 'Security Reports', 'OTP Logs', 'Security'
    ],
    'visitor receptionist': [
        'Visitor Management'
    ],
    'cms manager': [
        'CMS Dashboard', 'Blogs', 'FAQ', 'Events', 'CMS'
    ],
    'admin files manager': [
        'Admin Files Dashboard', 'Admin Files', 'Document Tracker', 'In-House Expense'
    ],
    'profile task user': [
        'My Profile', 'Daily Task', 'My Attendance', 'My Leave', 'Profile Task Dashboard', 'Notifications'
    ],
    'inventory manager': [
        'Inventory Dashboard', 'Elder Inventory Dashboard', 'Medical Inventory Dashboard', 'Ration Products', 'Stationary Products', 'Electrical & Plumbing', 'Medical Assets', 'Assets', 'Products', 'Inventory Products', 'Stock', 'Stock Issue', 'Medicine Requests', 'Medicine Issue Log', 'Medication Schedule', 'Stock Issue Approval', 'Stock Movements', 'Purchase Orders', 'Low Stock Alerts', 'Workflow Timeline'
    ],
    'family member': CLIENT_PORTAL_PERMISSIONS,
    'client': CLIENT_PORTAL_PERMISSIONS,
    'client family member': CLIENT_PORTAL_PERMISSIONS,
    'elder care admin': [
        'Elder Care Dashboard', 'In-House Care', 'Revenue Form', 'Vital Form', 'ADL',
        'Food Preparation', 'Nutrition Planning', 'Laundry Management', 'Maintenance', 'Waste Management', 'Waste (Rag) Management',
        'Ration Products', 'Stationary Products', 'Electrical & Plumbing', 'Products', 'Inventory Products', 'Stock', 'Stock Issue', 'Stock Issue Request', 'Stock Issue Approval', 'Stock Movements', 'Low Stock Alerts',
        'In-House Expense',
        'Assign Daily Task', 'Assign Schedule Task', 'Daily Task Approval', 'Schedule Task Approval', 'Task Log'
    ],
    'in-house care manager': [
        'In-House Care Dashboard', 'In-House Care', 'Revenue Form', 'Vital Form', 'ADL', 'Stock Issue Request'
    ],
    'elder operations manager': [
        'Elder Operations Dashboard', 'Food Preparation', 'Nutrition Planning', 'Laundry Management', 'Maintenance', 'Waste Management', 'Waste (Rag) Management', 'Stock Issue Request'
    ],
    'elder inventory manager': [
        'Elder Inventory Dashboard', 'Ration Products', 'Stationary Products', 'Electrical & Plumbing', 'Products', 'Inventory Products', 'Stock', 'Stock Issue', 'Medicine Requests', 'Medicine Issue Log', 'Medication Schedule', 'Stock Issue Approval', 'Stock Movements', 'Purchase Orders', 'Low Stock Alerts', 'Workflow Timeline'
    ],
    'task log coordinator': [
        'Task Log Dashboard', 'Assign Daily Task', 'Assign Schedule Task', 'Daily Task Approval', 'Schedule Task Approval', 'Task Log'
    ],
    'elder finance manager': [
        'Elder Finance Dashboard', 'In-House Expense', 'Invoice', 'Cashbox', 'Renewals', 'Pending Payments', 'Cashbox Pending'
    ],
    'uhc admin': [
        'UHC Dashboard', 'Healthcare', 'Critical Patients', 'Patient Dashboard', 'Vital Form',
        'Medical Monitor', 'Medication Management', 'Medicine Requests', 'Medicine Issue Log', 'Medication Schedule', 'Nutrition & Diet',
        'Clinical Care', 'Home Care', 'Others',
        'Medical Assets', 'Assets', 'Purchase Orders', 'Stock', 'Stock Issue', 'Stock Issue Request', 'Stock Issue Approval', 'Stock Movements', 'Products', 'Inventory Products'
    ],
    'patient care manager': [
        'Patient Care Dashboard', 'Patient Overview', 'Daily Living (ADL)', 'Nutrition & Diet', 'Incident Reports', 'Vital Form', 'Stock Issue Request'
    ],
    'patient_care_manager': [
        'Patient Care Dashboard', 'Patient Overview', 'Daily Living (ADL)', 'Nutrition & Diet', 'Incident Reports', 'Vital Form', 'Stock Issue Request'
    ],
    'caregiver': [
        'Patient Care Dashboard', 'Patient Overview', 'Daily Living (ADL)', 'Nutrition & Diet', 'Incident Reports', 'Vital Form'
    ],
    'nursing manager': [
        'Nursing Dashboard', 'Medication Schedule', 'Medicine Issue Log', 'Medicine Requests', 'Vitals Monitoring', 'Critical Patients', 'Vital Form'
    ],
    'nursing_manager': [
        'Nursing Dashboard', 'Medication Schedule', 'Medicine Issue Log', 'Medicine Requests', 'Vitals Monitoring', 'Critical Patients', 'Vital Form'
    ],
    'nurse': [
        'Nursing Dashboard', 'Medication Schedule', 'Medicine Requests', 'Vitals Monitoring', 'Vital Form'
    ],
    'nursing care staff': [
        'Nursing Dashboard', 'Medication Schedule', 'Medicine Requests', 'Vitals Monitoring', 'Vital Form', 'Critical Patients'
    ],
    'nursing_care_staff': [
        'Nursing Dashboard', 'Medication Schedule', 'Medicine Requests', 'Vitals Monitoring', 'Vital Form', 'Critical Patients'
    ],
    'medical monitor coordinator': [
        'Medical Monitor Dashboard', 'Healthcare', 'Medical Monitor', 'Critical Patients', 'Patient Dashboard', 'Vital Form', 'Stock Issue Request'
    ],
    'care allocation manager': [
        'Care Allocation Dashboard', 'Clinical Care', 'Home Care', 'In-House Care', 'Others', 'Stock Issue Request'
    ],
    'medical inventory manager': [
        'Medical Inventory Dashboard', 'Medical Assets', 'Assets', 'Purchase Orders', 'Stock', 'Stock Issue', 'Medicine Requests', 'Medicine Issue Log', 'Medication Schedule', 'Stock Issue Approval', 'Stock Movements', 'Products', 'Inventory Products', 'Low Stock Alerts', 'Workflow Timeline'
    ],
    'ua admin': [
        'UA Dashboard', 'Ambulance Services', 'Ambulance Bookings', 'Dispatch Management',
        'Vehicle & Fleet', 'Driver & Staff Assignment', 'Trip Sheets', 'Ambulance Maintenance',
        'Ambulance Billing', 'Emergency Call Logs', 'Field Duty'
    ],
    'ambulance booking coordinator': [
        'Booking Dashboard', 'Ambulance Services', 'Ambulance Bookings', 'Trip Sheets'
    ],
    'dispatch manager': [
        'Dispatch Dashboard', 'Ambulance Services', 'Dispatch Management', 'Driver & Staff Assignment', 'Field Duty'
    ],
    'fleet manager': [
        'Fleet Dashboard', 'Ambulance Services', 'Vehicle & Fleet', 'Ambulance Maintenance'
    ],
    'ambulance billing manager': [
        'Ambulance Billing Dashboard', 'Ambulance Services', 'Ambulance Billing', 'Trip Sheets'
    ],
    'emergency call coordinator': [
        'Emergency Dashboard', 'Ambulance Services', 'Emergency Call Logs', 'Dispatch Management', 'Ambulance Bookings', 'Field Duty'
    ],
    'ueo admin': [
        'UEO Dashboard', 'Active Enquiries', 'Enquiry Follow-up', 'New Enquiry', 'New Enquiry Form',
        'All Client Details', 'Admission Tracking', 'Admission Forms',
        'Welcome Call', 'Customer Care', 'Pending Feedbacks', 'Pending Feedback',
        'Customer Complaints', 'Feedback', 'Service History',
        'Conversations', 'Email', 'WhatsApp', 'SMS', 'Missed Calls', 'Calls', 'Omnichannel', 'Workflow Timeline'
    ],
    'enquiry desk manager': [
        'Enquiry Dashboard', 'Active Enquiries', 'Enquiry Follow-up', 'New Enquiry', 'New Enquiry Form',
        'All Client Details', 'Admission Tracking', 'Admission Forms'
    ],
    'follow-up coordinator': [
        'Follow-up Dashboard', 'Active Enquiries', 'Enquiry Follow-up', 'Welcome Call', 'Customer Care', 'Feedback'
    ],
    'customer relations manager': [
        'Customer Relations Dashboard', 'Customer Care', 'Welcome Call', 'Pending Feedbacks', 'Pending Feedback',
        'Customer Complaints', 'Feedback', 'Service History'
    ],
    'omnichannel coordinator': [
        'Omnichannel Dashboard', 'Conversations', 'Email', 'WhatsApp', 'SMS', 'Missed Calls', 'Calls', 'Omnichannel'
    ],
    'admissions coordinator': [
        'Admissions Dashboard', 'Admission Tracking', 'Admission Forms', 'All Client Details', 'Active Enquiries', 'Workflow Timeline'
    ]
}

const pathPermissionMap: Array<{ prefix: string; permissions: string[] }> = [
    { prefix: '/healthcare/registration', permissions: ['Patient Registration', 'Admission', 'ALL_ACCESS'] },
    { prefix: '/healthcare/admission', permissions: ['Admission', 'ALL_ACCESS'] },
    { prefix: '/healthcare/discharge', permissions: ['Discharge', 'Admission', 'ALL_ACCESS'] },
    { prefix: '/hr/staff-privilege', permissions: ['Staff Privilege'] },
    { prefix: '/reports', permissions: REPORT_PERMISSIONS },
    { prefix: '/workflow/timeline', permissions: ['Workflow Timeline', 'ALL_ACCESS'] },
    { prefix: '/master/dashboard', permissions: ['Master Dashboard'] },
    { prefix: '/master/city', permissions: ['City Master'] },
    { prefix: '/master/unit', permissions: ['Unit Master'] },
    { prefix: '/master/admin-files', permissions: ['Admin Files', 'Document Tracker'] },
    { prefix: '/uec/admin-files', permissions: ['Admin Files', 'Document Tracker'] },
    { prefix: '/admin-files/dashboard', permissions: ['Admin Files Dashboard'] },
    { prefix: '/admin-files', permissions: ['Admin Files', 'Document Tracker'] },
    { prefix: '/master/client-services', permissions: ['Client Services'] },
    { prefix: '/master/department', permissions: ['Department', 'Department Master'] },
    { prefix: '/master/designation', permissions: ['Designation Master'] },
    { prefix: '/master/labour-services', permissions: ['Labour Services'] },
    { prefix: '/master/payment-category', permissions: ['Payment Category'] },
    { prefix: '/master/vendor', permissions: ['Vendor Master'] },
    { prefix: '/master/room', permissions: ['Room Mgt', 'Room Management'] },
    { prefix: '/enquiry/follow-up', permissions: ['Enquiry Follow-up'] },
    { prefix: '/enquiry/new', permissions: ['New Enquiry', 'New Enquiry Form'] },
    { prefix: '/enquiry/clients', permissions: ['All Client Details'] },
    { prefix: '/crm/dashboard', permissions: ['Enquiry Dashboard', 'Active Enquiries', 'Enquiry Follow-up'] },
    { prefix: '/crm/follow-up-dashboard', permissions: ['Follow-up Dashboard'] },
    { prefix: '/crm/admissions-dashboard', permissions: ['Admissions Dashboard'] },
    { prefix: '/crm/active-enquiries', permissions: ['Active Enquiries', 'Enquiry Follow-up'] },
    { prefix: '/crm/enquiry-follow-up', permissions: ['Enquiry Follow-up'] },
    { prefix: '/crm/new-enquiry', permissions: ['New Enquiry', 'New Enquiry Form'] },
    { prefix: '/crm/clients', permissions: ['All Client Details'] },
    { prefix: '/crm/admission-tracking', permissions: ['Admission Tracking', 'All Client Details'] },
    { prefix: '/crm/customer-care', permissions: ['Customer Care', 'Enquiry Follow-up'] },
    { prefix: '/crm/feedback', permissions: ['Feedback', 'Enquiry Follow-up'] },
    { prefix: '/crm/admission-forms', permissions: ['Admission Forms', 'All Client Details'] },
    { prefix: '/allocation/home-care', permissions: ['Home Care'] },
    { prefix: '/allocation/dashboard', permissions: ['Care Allocation Dashboard'] },
    { prefix: '/allocation/clinical-care', permissions: ['Clinical Care'] },
    { prefix: '/allocation/inhouse-care', permissions: ['In-House Care'] },
    { prefix: '/allocation/others', permissions: ['Others'] },
    { prefix: '/business/welcome-call', permissions: ['Welcome Call'] },
    { prefix: '/customer-care/dashboard', permissions: ['Customer Relations Dashboard'] },
    { prefix: '/customer-care/pending-feedback', permissions: ['Pending Feedbacks', 'Pending Feedback'] },
    { prefix: '/customer-care/complaints', permissions: ['Customer Complaints'] },
    { prefix: '/customer-care/service-history', permissions: ['Service History'] },
    { prefix: '/inhouse-care/dashboard', permissions: ['In-House Care Dashboard'] },
    { prefix: '/inhouse-care/revenue', permissions: ['Revenue Form'] },
    { prefix: '/inhouse-care/vitals', permissions: ['Vital Form'] },
    { prefix: '/inhouse-care/adl', permissions: ['In-House Care', 'ADL'] },
    { prefix: '/inhouse-care/events', permissions: ['In-House Care', 'Events'] },
    { prefix: '/inhouse-care/incidents', permissions: ['In-House Care', 'Incident Reports'] },
    { prefix: '/healthcare/critical-patients', permissions: ['Critical Patients', 'Vital Form'] },
    { prefix: '/module/patient-care', permissions: ['Patient Care Dashboard'] },
    { prefix: '/module/nursing-care', permissions: ['Nursing Dashboard'] },
    { prefix: '/nursing-care/dashboard', permissions: ['Nursing Dashboard'] },
    { prefix: '/medical/my-shift', permissions: ['Nursing Dashboard', 'Patient Care Dashboard'] },
    { prefix: '/nursing-care/critical-patients', permissions: ['Critical Patients', 'Vital Form'] },
    { prefix: '/nursing-care/vitals', permissions: ['Vitals Monitoring', 'Vital Form'] },
    { prefix: '/nursing-care/medication-schedule', permissions: ['Medication Schedule'] },
    { prefix: '/nursing-care/medicine-issue-log', permissions: ['Medicine Issue Log'] },
    { prefix: '/nursing-care/medicine-requests', permissions: ['Medicine Requests'] },
    { prefix: '/patient-care/dashboard', permissions: ['Patient Overview', 'Patient Dashboard', 'Vital Form'] },
    { prefix: '/patient-care/adl', permissions: ['Daily Living (ADL)', 'ADL', 'Vital Form'] },
    { prefix: '/patient-care/nutrition-diet', permissions: ['Nutrition & Diet', 'Vital Form'] },
    { prefix: '/patient-care/incidents', permissions: ['Incident Reports', 'Vital Form'] },
    { prefix: '/healthcare/medical-monitor-dashboard', permissions: ['Medical Monitor Dashboard', 'Medical Monitor', 'Healthcare'] },
    { prefix: '/healthcare/medical-monitor', permissions: ['Medical Monitor', 'Healthcare', 'Vital Form'] },
    { prefix: '/operations/dashboard', permissions: ['Elder Operations Dashboard'] },
    { prefix: '/operations/food-preparation', permissions: ['Food Preparation'] },
    { prefix: '/operations/nutrition-planning', permissions: ['Nutrition Planning'] },
    { prefix: '/operations/laundry-management', permissions: ['Laundry Management'] },
    { prefix: '/operations/maintenance', permissions: ['Maintenance'] },
    { prefix: '/operations/waste-management', permissions: ['Waste Management', 'Waste (Rag) Management'] },
    { prefix: '/module/uec-inhouse-care', permissions: ['In-House Care', 'Revenue Form', 'Vital Form', 'ADL'] },
    { prefix: '/module/uec-operations', permissions: ['Elder Operations Dashboard', 'Food Preparation', 'Nutrition Planning', 'Laundry Management', 'Maintenance', 'Waste Management'] },
    { prefix: '/module/uec-finance', permissions: ['Elder Finance Dashboard', 'In-House Expense', 'Cashbox'] },
    { prefix: '/module/uec-task-log', permissions: ['Task Log Dashboard', 'Task Log', 'Assign Daily Task', 'Assign Schedule Task', 'Daily Task Approval'] },
    { prefix: '/module/uhc-healthcare', permissions: ['Healthcare', 'Patient Care Dashboard', 'Medical Monitor', 'Critical Patients', 'Patient Dashboard', 'Medication Management'] },
    { prefix: '/module/uhc-allocation', permissions: ['Care Allocation Dashboard', 'Clinical Care', 'Home Care', 'In-House Care', 'Others'] },
    { prefix: '/module/ua-services', permissions: ['Ambulance Services', 'Ambulance Bookings', 'Dispatch Management', 'Vehicle & Fleet', 'Trip Sheets'] },
    { prefix: '/module/ua-support', permissions: ['Ambulance Services', 'Ambulance Maintenance', 'Ambulance Billing', 'Emergency Call Logs', 'Field Duty'] },
    { prefix: '/module/ueo-enquiry', permissions: ['Enquiry Desk Dashboard', 'Active Enquiries', 'Enquiry Follow-up', 'New Enquiry', 'Admissions Dashboard'] },
    { prefix: '/module/ueo-customer', permissions: ['Customer Care', 'Customer Relations Dashboard', 'Pending Feedback', 'Complaints', 'Service History'] },
    { prefix: '/module/ueo-omnichannel', permissions: ['Omnichannel Dashboard', 'Omnichannel', 'Calls', 'Missed Calls'] },
    { prefix: '/module/ueo-security', permissions: ['Security Dashboard', 'Gate Management', 'Visitor Management', 'Staff Register', 'Vehicle Register', 'Entry Logs', 'Security Reports', 'OTP Logs', 'Security'] },
    { prefix: '/inventory', permissions: ['Elder Inventory Dashboard', 'Medical Inventory Dashboard', 'Stock', 'Inventory Products'] },
    { prefix: '/inventory/elder-dashboard', permissions: ['Elder Inventory Dashboard'] },
    { prefix: '/inventory/medical-dashboard', permissions: ['Medical Inventory Dashboard'] },
    { prefix: '/inventory/low-stock-alerts', permissions: ['Low Stock Alerts', 'Stock'] },
    { prefix: '/inventory/products/ration', permissions: ['Ration Products', 'Products', 'Inventory Products', 'Stock'] },
    { prefix: '/inventory/products/stationary', permissions: ['Stationary Products', 'Products', 'Inventory Products', 'Stock'] },
    { prefix: '/inventory/products/electrical-plumbing', permissions: ['Electrical & Plumbing', 'Products', 'Inventory Products', 'Stock'] },
    { prefix: '/inventory/products/assets', permissions: ['Assets', 'Medical Assets', 'Products', 'Inventory Products', 'Stock'] },
    { prefix: '/inventory/products', permissions: ['Products', 'Inventory Products', 'Stock'] },
    { prefix: '/inventory/stock-issue', permissions: ['Stock Issue', 'Stock Issue Request', 'Stock Issue Approval', 'Stock'] },
    { prefix: '/inventory/stock-movements', permissions: ['Stock Movements', 'Stock'] },
    { prefix: '/inventory/stock', permissions: ['Stock'] },
    { prefix: '/inventory/purchase-orders', permissions: ['Purchase Orders'] },
    { prefix: '/inventory/vendors', permissions: ['Vendor Master'] },
    { prefix: '/accounts/cashbox', permissions: ['Cashbox'] },
    { prefix: '/accounts/pending', permissions: ['Cashbox Pending'] },
    { prefix: '/accounts/income', permissions: ['Income'] },
    { prefix: '/accounts/expense', permissions: ['Expense'] },
    { prefix: '/accounts/inhouse-expense', permissions: ['In-house Expense', 'In-House Expense'] },
    { prefix: '/finance/pending-payments', permissions: ['Pending Payments', 'Cashbox Pending'] },
    { prefix: '/finance/dashboard', permissions: ['Finance Dashboard', 'Cashbox', 'Income', 'Expense', 'Pending Payments'] },
    { prefix: '/finance/elder-dashboard', permissions: ['Elder Finance Dashboard'] },
    { prefix: '/uncf/dashboard', permissions: ['UNCF Dashboard', 'Master Dashboard', 'Finance Dashboard', 'Security Dashboard', 'CMS Dashboard'] },
    { prefix: '/finance/cashbox', permissions: ['Cashbox'] },
    { prefix: '/finance/income', permissions: ['Income'] },
    { prefix: '/finance/expense', permissions: ['Expense'] },
    { prefix: '/finance/inhouse-expense', permissions: ['In-house Expense', 'In-House Expense'] },
    { prefix: '/finance/allowance-tracking', permissions: ['Allowance Tracking'] },
    { prefix: '/finance/patient-daily-cost', permissions: ['Invoice', 'Cashbox', 'Patient Dashboard', 'Healthcare', 'ALL_ACCESS'] },
    { prefix: '/finance/manual-billing', permissions: ['Invoice', 'Cashbox', 'Patient Dashboard', 'Healthcare', 'ALL_ACCESS'] },
    { prefix: '/finance/invoice', permissions: ['Invoice'] },
    { prefix: '/finance/renewals', permissions: ['Renewals'] },
    { prefix: '/uec/elder-care-dashboard', permissions: ['Elder Care Dashboard', 'UEC Dashboard', 'In-House Care', 'Task Log'] },
    { prefix: '/uec/dashboard', permissions: ['UEC Dashboard', 'In-House Care', 'Revenue Form', 'Vital Form', 'Task Log'] },
    { prefix: '/uhc/dashboard', permissions: ['UHC Dashboard', 'Healthcare', 'Medical Monitor', 'Critical Patients', 'Patient Dashboard'] },
    { prefix: '/ua/dashboard', permissions: ['UA Dashboard', 'Ambulance Services'] },
    { prefix: '/ueo/dashboard', permissions: ['UEO Dashboard', 'Active Enquiries', 'Enquiry Follow-up', 'Customer Care', 'Omnichannel'] },
    { prefix: '/ambulance/booking-dashboard', permissions: ['Booking Dashboard'] },
    { prefix: '/ambulance/bookings', permissions: ['Ambulance Bookings', 'Ambulance Services'] },
    { prefix: '/ambulance/dispatch-dashboard', permissions: ['Dispatch Dashboard'] },
    { prefix: '/ambulance/dispatch', permissions: ['Dispatch Management', 'Ambulance Services'] },
    { prefix: '/ambulance/fleet-dashboard', permissions: ['Fleet Dashboard'] },
    { prefix: '/ambulance/fleet', permissions: ['Vehicle & Fleet', 'Ambulance Services'] },
    { prefix: '/ambulance/staff-assignment', permissions: ['Driver & Staff Assignment', 'Ambulance Services'] },
    { prefix: '/ambulance/trip-sheets', permissions: ['Trip Sheets', 'Ambulance Services'] },
    { prefix: '/ambulance/maintenance', permissions: ['Ambulance Maintenance', 'Ambulance Services'] },
    { prefix: '/ambulance/billing-dashboard', permissions: ['Ambulance Billing Dashboard'] },
    { prefix: '/ambulance/billing', permissions: ['Ambulance Billing', 'Ambulance Services'] },
    { prefix: '/ambulance/emergency-dashboard', permissions: ['Emergency Dashboard', 'Emergency Call Logs', 'Ambulance Services'] },
    { prefix: '/ambulance/call-logs', permissions: ['Emergency Call Logs', 'Ambulance Services'] },
    { prefix: '/daily-operations', permissions: ['Daily Operations', 'ALL_ACCESS', 'Human Resource', 'Elder Operations'] },
    { prefix: '/hr/manager-dashboard', permissions: ['HR Manager Dashboard'] },
    { prefix: '/hr/dashboard', permissions: ['HR Dashboard', 'Human Resource'] },
    { prefix: '/hr/staff', permissions: ['Staff Management'] },
    { prefix: '/hr/field-duty', permissions: ['Field Duty'] },
    { prefix: '/hr/leave', permissions: ['Leave Management'] },
    { prefix: '/hr/roster', permissions: ['Shift Roster'] },
    { prefix: '/hr/documents', permissions: ['Document Tracker'] },
    { prefix: '/hr/training', permissions: ['Training Compliance'] },
    { prefix: '/hr/labour', permissions: ['Labour Mgt'] },
    { prefix: '/hr/recruitment', permissions: ['Recruitment', 'Job Enquiry'] },
    { prefix: '/hr/job-enquiry', permissions: ['Job Enquiry', 'Recruitment'] },
    { prefix: '/hr/attendance', permissions: ['Attendance'] },
    { prefix: '/hr/holiday', permissions: ['Holiday Mapping'] },
    { prefix: '/hr/reports', permissions: ['HR Reports', 'Payroll', 'Attendance', 'Leave Management'] },
    { prefix: '/hr/payroll', permissions: ['Payroll'] },
    { prefix: '/profile/me', permissions: ['My Profile', 'Profile Task Dashboard'] },
    { prefix: '/profile/tasks', permissions: ['Daily Task', 'Profile Task Dashboard'] },
    { prefix: '/profile/attendance', permissions: ['My Attendance', 'Profile Task Dashboard'] },
    { prefix: '/profile/leave', permissions: ['My Leave', 'Profile Task Dashboard'] },
    { prefix: '/profile/notifications', permissions: ['Notifications', 'My Profile', 'Profile Task Dashboard'] },
    { prefix: '/task-user/dashboard', permissions: ['Profile Task Dashboard'] },
    { prefix: '/client-portal/access', permissions: ['ALL_ACCESS'] },
    { prefix: '/client-portal/dashboard', permissions: ['Client Portal Dashboard'] },
    { prefix: '/client-portal/profile', permissions: ['Client Portal Dashboard'] },
    { prefix: '/client-portal/services', permissions: ['My Services'] },
    { prefix: '/client-portal/medicines', permissions: ['Client Portal Dashboard'] },
    { prefix: '/client-portal/health-records', permissions: ['Client Portal Dashboard'] },
    { prefix: '/client-portal/complaints', permissions: ['My Complaints'] },
    { prefix: '/client-portal/notifications', permissions: ['Client Portal Dashboard'] },
    { prefix: '/super-admin/users', permissions: ['ALL_ACCESS'] },
    { prefix: '/security/dashboard', permissions: ['Security Dashboard'] },
    { prefix: '/security/visitor-dashboard', permissions: ['Security Dashboard', 'Visitor Management', 'Security'] },
    { prefix: '/security/gate-management', permissions: ['Gate Management', 'Security'] },

    { prefix: '/visitor', permissions: ['Visitor Management', 'Security'] },
    { prefix: '/visitor-module', permissions: ['Visitor Management', 'Security'] },
    { prefix: '/security/staff-register', permissions: ['Staff Register', 'Security'] },
    { prefix: '/security/vehicle-register', permissions: ['Vehicle Register', 'Gate Management', 'Security'] },
    { prefix: '/security/entry-logs', permissions: ['Entry Logs', 'Security'] },
    { prefix: '/security/reports', permissions: ['Security Reports', 'Security'] },

    { prefix: '/omnichannel/dashboard', permissions: ['Omnichannel Dashboard'] },
    { prefix: '/omnichannel/conversations', permissions: ['Conversations', 'Omnichannel'] },
    { prefix: '/omnichannel/email', permissions: ['Email', 'Omnichannel'] },
    { prefix: '/omnichannel/whatsapp', permissions: ['WhatsApp', 'Omnichannel'] },
    { prefix: '/omnichannel/sms', permissions: ['SMS', 'Omnichannel'] },
    { prefix: '/omnichannel/missed-calls', permissions: ['Missed Calls', 'Calls', 'Omnichannel'] },
    { prefix: '/omnichannel/calls', permissions: ['Calls', 'Omnichannel'] },
    { prefix: '/automation/dashboard', permissions: ['Automation Hub', 'Automation'] },
    { prefix: '/automation/intelligence', permissions: ['Predictive Sales', 'Automation'] },
    { prefix: '/automation/rules', permissions: ['Rule Builder', 'Automation'] },
    { prefix: '/cms/dashboard', permissions: ['CMS Dashboard'] },
    { prefix: '/cms/blogs', permissions: ['Blogs', 'CMS'] },
    { prefix: '/cms/faq', permissions: ['FAQ', 'CMS'] },
    { prefix: '/cms/events', permissions: ['Events', 'CMS'] },
    { prefix: '/task-log/dashboard', permissions: ['Task Log Dashboard'] },
    { prefix: '/task-log/assign-daily', permissions: ['Assign Daily Task', 'Task Log'] },
    { prefix: '/task-log/assign-schedule', permissions: ['Assign Schedule Task', 'Task Log'] },
    { prefix: '/task-log/daily-approval', permissions: ['Daily Task Approval', 'Task Log'] },
    { prefix: '/task-log/schedule-approval', permissions: ['Schedule Task Approval', 'Task Log'] }
]

const normalizePath = (pathname: string) => pathname === '/' ? '/dashboard' : pathname.replace(/\/+$/, '') || '/dashboard'

export const hasAllAccess = (user: User | null | undefined) => Boolean(user?.permissions?.includes('ALL_ACCESS') && !user?.staffId)

const getNormalizedRole = (user: User | null | undefined) => {
    if (!user?.role) return ''

    if (typeof user.role === 'string') {
        return user.role.trim().toLowerCase()
    }

    return String(user.role.name || '').trim().toLowerCase()
}

const getPermissionSet = (user: User | null | undefined) => {
    const permissions = new Set(user?.permissions || [])
    if (user?.staffId) {
        STAFF_SELF_SERVICE_PERMISSIONS.forEach((permission) => permissions.add(permission))
    }
    if (CLIENT_PORTAL_ROLES.includes(getNormalizedRole(user))) {
        CLIENT_PORTAL_PERMISSIONS.forEach((permission) => permissions.add(permission))
    }

    if (user?.menuPrivilege) {
        return permissions
    }

    const fallbackPermissions = rolePermissionFallbacks[getNormalizedRole(user)] || []
    fallbackPermissions.forEach((permission) => permissions.add(permission))
    return permissions
}

export const getRolePreferredRedirectPath = (user: User | null | undefined, pathname: string) => {
    const normalizedPath = normalizePath(pathname)
    return rolePreferredPathRedirects[getNormalizedRole(user)]?.[normalizedPath] || null
}

export const hasPermissionAccess = (user: User | null | undefined, permissions: string[]) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    const permissionSet = getPermissionSet(user)
    return permissions.some((permission) => permissionSet.has(permission))
}

export const canAccessUncfDashboard = (user: User | null | undefined) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    if (user.menuPrivilege) return false
    return UNCF_DASHBOARD_ROLES.includes(getNormalizedRole(user))
}

export const canAccessUhcDashboard = (user: User | null | undefined) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    return UHC_DASHBOARD_ROLES.includes(getNormalizedRole(user))
}

export const canAccessUaDashboard = (user: User | null | undefined) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    return UA_DASHBOARD_ROLES.includes(getNormalizedRole(user))
}

export const canAccessUeoDashboard = (user: User | null | undefined) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    return UEO_DASHBOARD_ROLES.includes(getNormalizedRole(user))
}

export const canAccessPath = (user: User | null | undefined, pathname: string) => {
    if (!user) return false

    const normalizedPath = normalizePath(pathname)

    if (normalizedPath === '/dashboard') {
        return canAccessUncfDashboard(user)
    }

    if (normalizedPath === '/uhc/dashboard') {
        return canAccessUhcDashboard(user)
    }

    if (normalizedPath === '/ua/dashboard') {
        return canAccessUaDashboard(user)
    }

    if (normalizedPath === '/ueo/dashboard') {
        return canAccessUeoDashboard(user)
    }

    const roleDashboardRoles = roleDashboardAccess[normalizedPath]
    if (roleDashboardRoles?.includes(getNormalizedRole(user))) {
        return true
    }

    if (OPEN_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
        return true
    }

    const matchedRule = pathPermissionMap.find((rule) => normalizedPath.startsWith(rule.prefix))
    if (!matchedRule) return hasAllAccess(user)

    return hasPermissionAccess(user, matchedRule.permissions)
}

export const getDefaultRouteForUser = (user: User | null | undefined) => {
    const roleDefaultRoute = roleDefaultRoutes[getNormalizedRole(user)]
    if (roleDefaultRoute && canAccessPath(user, roleDefaultRoute)) {
        return roleDefaultRoute
    }

    if (CLIENT_PORTAL_ROLES.includes(getNormalizedRole(user)) && canAccessPath(user, '/client-portal/dashboard')) {
        return '/client-portal/dashboard'
    }

    if (user?.staffId && canAccessPath(user, '/task-user/dashboard')) {
        return '/task-user/dashboard'
    }

    const preferredRoutes = [
        '/dashboard',
        '/uec/dashboard',
        '/uhc/dashboard',
        '/ua/dashboard',
        '/ueo/dashboard',
        '/hr/dashboard',
        ...pathPermissionMap.map((rule) => rule.prefix),
        '/profile/me'
    ]

    return preferredRoutes.find((route) => canAccessPath(user, route)) || '/profile/me'
}

export const hasUnitAccess = (user: User | null | undefined, unitId: string) => {
    if (!user) return false
    if (hasAllAccess(user)) return true
    return user.unitAccess.includes('*') || user.unitAccess.includes(unitId)
}
