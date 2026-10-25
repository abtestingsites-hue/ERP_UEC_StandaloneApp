# ERP PHASE 01 — COMPLETE ROUTE & MODULE INVENTORY

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp` (Standalone Enterprise ERP)  
**Audit Date:** October 25, 2026  
**Auditor Mode:** Senior Frontend Architect & Systems Auditor (Read-Only)  
**Status Baseline:** Git commit `65c1f10b`

---

## 1. Executive Route Summary

The ElderCare ERP application defines **2 public entry points**, **1 authenticated shell structure**, **10 dedicated full-stack business domain workspaces**, **1 central executive command center**, and **1 dedicated client/family portal shell**.

- **Total Base ERP Routes (React Router v7):** 18
- **Total Functional Workspace Sub-Tabs:** 88 individual functional modules
- **Shared Top-Level Layouts:** 
  1. `AuthLayout` (Staff Login & Temporary Password Change)
  2. `SuperAdminLayout` (Enterprise ERP Desktop/Laptop/Tablet Application Shell)
  3. `PortalLayout` (ElderCare Family & Client Portal Shell)
  4. `CRMWorkspace` (Standalone ElderCare CRM Shell with dedicated dark theme)

---

## 2. Global Route & Module Register

| # | Route Path | Page Title / Workspace | Physical Source File | Layout Shell | Auth Guard | Applicable Roles / Permissions | Status |
|---|---|---|---|---|---|---|---|
| **1** | `/login` | Staff Enterprise Login | [src/features/auth/Login.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/auth/Login.tsx) | `AuthLayout` | Public | All Users / Unauthenticated | VERIFIED |
| **2** | `/change-temporary-password` | Force Password Update | [src/features/auth/TemporaryPasswordChange.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/auth/TemporaryPasswordChange.tsx) | `AuthLayout` | Protected | Users with `mustChangePassword: true` | VERIFIED |
| **3** | `/portal/login` | Family & Client Portal Login | [src/features/portal/pages/PortalLogin.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/pages/PortalLogin.tsx) | Independent | Public | Family Members / Sponsor Accounts | VERIFIED |
| **4** | `/portal/*` | Family Care & Billing Portal | [src/features/portal/pages/PortalLayout.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/pages/PortalLayout.tsx) | `PortalLayout` | Portal Token | Registered Sponsors / Families | VERIFIED |
| **5** | `/` | Index Auto-Redirect | [src/app/routes.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/app/routes.tsx) | `SuperAdminLayout` | Protected | Redirects to role default home route | VERIFIED |
| **6** | `/dashboard` | Enterprise Command Center | [src/features/dashboard/Dashboard.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/dashboard/Dashboard.tsx) | `SuperAdminLayout` | Protected | `SUPER_ADMIN`, `DIRECTOR` | VERIFIED |
| **7** | `/inventory/*` | Inventory & Supply Chain | [src/features/inventory/InventoryWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/InventoryWorkspace.tsx) | `SuperAdminLayout` | Protected (`inventory`) | `SUPER_ADMIN`, `STORE_MANAGER`, `PROCUREMENT` | VERIFIED |
| **8** | `/admission/*` | Admission & Relieving | [src/features/admissions/AdmissionWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/AdmissionWorkspace.tsx) | `SuperAdminLayout` | Protected (`admission`) | `SUPER_ADMIN`, `ADMISSION_COUNSELOR`, `ADMIN` | VERIFIED |
| **9** | `/inhouse-care/*` | Inhouse Care & Nursing | [src/features/care/CareWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/CareWorkspace.tsx) | `SuperAdminLayout` | Protected (`inhouse-care`) | `SUPER_ADMIN`, `DOCTOR`, `HEAD_NURSE`, `CAREGIVER` | VERIFIED |
| **10** | `/home-care/*` | Home Care Operations | [src/features/home-care/HomeCareWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/HomeCareWorkspace.tsx) | `SuperAdminLayout` | Protected (`home-care`) | `SUPER_ADMIN`, `HOMECARE_COORD`, `FIELD_STAFF` | VERIFIED |
| **11** | `/visitor-security/*` | Security & Visitor Gate | [src/features/visitor-security/VisitorSecurityWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/VisitorSecurityWorkspace.tsx) | `SuperAdminLayout` | Protected (`visitor-security`) | `SUPER_ADMIN`, `SECURITY_GUARD`, `RECEPTIONIST` | VERIFIED |
| **12** | `/donors-volunteers/*` | Philanthropy & Foundation | [src/features/donors-volunteers/DonorsVolunteersWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/DonorsVolunteersWorkspace.tsx) | `SuperAdminLayout` | Protected (`donors-volunteers`) | `SUPER_ADMIN`, `DONOR_RELATIONS`, `TRUSTEE` | VERIFIED |
| **13** | `/finance/*` | Finance, Billing & P2P | [src/features/finance/FinanceWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/FinanceWorkspace.tsx) | `SuperAdminLayout` | Protected (`finance`) | `SUPER_ADMIN`, `FINANCE_CONTROLLER`, `ACCOUNTANT` | VERIFIED |
| **14** | `/hr-operations/*` | HR, Staffing & Attendance | [src/features/hr-operations/HrOperationsWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/HrOperationsWorkspace.tsx) | `SuperAdminLayout` | Protected (`hr-operations`) | `SUPER_ADMIN`, `HR_MANAGER`, `OPS_DIRECTOR` | VERIFIED |
| **15** | `/ambulance/*` | Ambulance & Fleet Logistics | [src/features/ambulance/AmbulanceWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/AmbulanceWorkspace.tsx) | `SuperAdminLayout` | Protected (`ambulance`) | `SUPER_ADMIN`, `DISPATCHER`, `AMBULANCE_DRIVER` | VERIFIED |
| **16** | `/reports/*` | Central ERP BI & Reports | [src/features/reports/CentralReportsWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/CentralReportsWorkspace.tsx) | `SuperAdminLayout` | Protected (`reports`) | `SUPER_ADMIN`, `DIRECTOR`, `AUDITOR` | VERIFIED |
| **17** | `/crm/*` | Integrated CRM Workspace | [src/features/crm/CRMWorkspace.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/crm/CRMWorkspace.tsx) | Independent CRM Shell | Protected (`crm`) | `SUPER_ADMIN`, `CRM_AGENT`, `TELECALLER` | VERIFIED |
| **18** | `*` | Page Not Found Handler | [src/app/routes.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/app/routes.tsx#L92-L100) | `SuperAdminLayout` | Fallback | Unmatched authenticated URLs | VERIFIED |

---

## 3. Detailed Workspace Sub-Tab Inventory

### 3.1 Inventory Workspace (`/inventory?tab=...`)
1. `overview` — **Command Center**: Product KPIs, stock valuation summary, audit status, critical alerts ([tabs/InventoryOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/InventoryOverviewTab.tsx)).
2. `products` — **Product Master**: SKUs, categories, reorder levels, unit conversions, drug classification ([tabs/ProductMasterTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/ProductMasterTab.tsx)).
3. `stock` — **Stock & Batches**: Batch number, expiration date, rack locations, quantity on hand ([tabs/StockBatchesTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/StockBatchesTab.tsx)).
4. `issues` — **Issue Requests**: Departmental stock requisitions, approvals, and dispatch verification ([tabs/StockIssueRequestsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/StockIssueRequestsTab.tsx)).
5. `vendors` — **Vendor Directory**: Supplier Master, GSTIN, contacts, payment terms, and vendor performance ([tabs/VendorDirectoryTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/VendorDirectoryTab.tsx)).
6. `purchases` — **Purchases & Procurement**: Requisitions (PR), Purchase Orders (PO), Goods Receipt Notes (GRN), and 3-way match ([tabs/PurchasesProcurementTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/PurchasesProcurementTab.tsx)).
7. `valuation` — **Stock Valuation**: Moving average and FIFO stock valuation across multi-unit warehouses ([tabs/StockValuationTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/StockValuationTab.tsx)).
8. `consumption` — **Consumption Analytics**: Departmental burn rate, nursing ward dispensing, wastage analytics ([tabs/ConsumptionAnalyticsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/ConsumptionAnalyticsTab.tsx)).
9. `audits` — **Physical Audits**: Stock-taking reconciliation, variance capture, supervisor sign-offs ([tabs/PhysicalAuditsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/PhysicalAuditsTab.tsx)).
10. `movements` — **Movements Ledger**: Stock audit trail, transfers, returns, write-offs ([tabs/StockMovementsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/tabs/StockMovementsTab.tsx)).

### 3.2 Finance Workspace (`/finance?tab=...`)
1. `overview` — **Finance Command Center**: Revenue, receivables, monthly billing run status ([tabs/FinanceOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/FinanceOverviewTab.tsx)).
2. `billing` — **Elder Billing**: Monthly resident care fee generation, room charges, medicine dues ([tabs/ElderBillingTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/ElderBillingTab.tsx)).
3. `manual-billing` — **Manual Billing Engine**: Custom debit/credit notes, emergency adjustments, itemized receipts ([tabs/ManualBillingTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/ManualBillingTab.tsx)).
4. `invoices` — **Invoices Ledger**: Formal GST invoices, payment collection status, PDF export ([tabs/InvoicesLedgerTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/InvoicesLedgerTab.tsx)).
5. `cashbox` — **Cashbox Ledger**: Facility petty cash, voucher disbursements, balance reconciliation ([tabs/CashboxLedgerTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/CashboxLedgerTab.tsx)).
6. `p2p-overview` — **P2P Overview**: Procure-to-Pay pipeline, pending receipts, and invoice verification ([tabs/P2POverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/P2POverviewTab.tsx)).
7. `grn-accruals` — **GRN Accruals**: Uninvoiced goods receipts ledger for financial matching ([tabs/P2PGRNAccrualsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/P2PGRNAccrualsTab.tsx)).
8. `vendor-bills` — **Vendor Bills**: Accounts Payable ledger, GST input tax credits, vendor payouts ([tabs/VendorBillsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/VendorBillsTab.tsx)).
9. `approvals` — **Pending Approvals**: Two-tier financial authorization for expenses > threshold ([tabs/PendingApprovalsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/PendingApprovalsTab.tsx)).
10. `patient-cost` — **Patient Daily Cost**: Granular per-resident operational cost breakdown ([tabs/PatientDailyCostTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/tabs/PatientDailyCostTab.tsx)).

### 3.3 Admission & Relieving Workspace (`/admission?tab=...`)
1. `list` — **Admissions List**: Active residents, room allocations, admission status filters ([tabs/AdmissionsListTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/AdmissionsListTab.tsx)).
2. `new` — **New Admission Form**: Multi-step resident intake, primary contacts, medical history, room assignment ([tabs/NewAdmissionTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/NewAdmissionTab.tsx)).
3. `registration` — **Patient Registration**: Basic KYC, national identity records, emergency contacts ([tabs/PatientRegistrationTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/PatientRegistrationTab.tsx)).
4. `existing` — **Existing Patient Re-Admission**: Rapid re-intake for recurring residents ([tabs/ExistingPatientTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/ExistingPatientTab.tsx)).
5. `relieving` — **Relieving & Discharge**: Clearance protocols, security pass cancellation, security deposit settlement ([tabs/RelievingDischargeTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/RelievingDischargeTab.tsx)).
6. `archive` — **Historical Archive**: Discharge history, archival documents, case notes ([tabs/HistoricalArchiveTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/tabs/HistoricalArchiveTab.tsx)).

### 3.4 Inhouse Care & Nursing Workspace (`/inhouse-care?tab=...`)
1. `overview` — **Manager Overview**: Census, critical alerts, nurse on-duty roster ([tabs/ManagerOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/ManagerOverviewTab.tsx)).
2. `daily-ops` — **Daily Care Operations**: Vitals logging, shift handover, nursing notes ([tabs/DailyOperationsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/DailyOperationsTab.tsx)).
3. `adl-nutrition` — **ADL & Nutrition**: Activities of Daily Living, mobility levels, dietary schedules ([tabs/AdlNutritionTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/AdlNutritionTab.tsx)).
4. `medication` — **Medication Administration**: eMAR, dosage schedules, missed dose tracking ([tabs/MedicationTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/MedicationTab.tsx)).
5. `medicine-requests` — **Pharmacy Indents**: Nursing ward requests to central inventory ([tabs/MedicineRequestsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/MedicineRequestsTab.tsx)).
6. `monitoring` — **Monitoring Alerts**: Critical vitals thresholds (BP, SPO2, Pulse) alert center ([tabs/MonitoringAlertsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/MonitoringAlertsTab.tsx)).
7. `nurse-shifts` — **Nurse Shift Management**: Station allocations, handover checklists ([tabs/NurseShiftTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/NurseShiftTab.tsx)).
8. `assignments` — **Staff Assignments**: Resident-to-caregiver mapping ([tabs/AssignmentsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/AssignmentsTab.tsx)).
9. `incidents` — **Incidents Register**: Resident falls, injuries, emergency escalations ([tabs/IncidentsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/IncidentsTab.tsx)).
10. `approvals` — **Duty Approval**: Clinical approvals and medical supervisor sign-offs ([tabs/DutyApprovalTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/DutyApprovalTab.tsx)).
11. `revenue-sheet` — **Revenue Sheet**: Itemized service billing tally from nursing care ([tabs/RevenueSheetTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/tabs/RevenueSheetTab.tsx)).

### 3.5 Home Care Operations (`/home-care?tab=...`)
1. `overview` — **Manager Command**: Active home-care packages, daily scheduled visits ([tabs/ManagerOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/ManagerOverviewTab.tsx)).
2. `clients` — **Client Directory**: Patient home addresses, GPS pins, family contacts ([tabs/MyClientsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/MyClientsTab.tsx)).
3. `visits` — **Visit Logs & Dispatch**: Nurse/physio visits, check-in timestamps, GPS tracking ([tabs/MyVisitsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/MyVisitsTab.tsx)).
4. `contracts` — **Service Contracts**: Home care packages (12h/24h nursing, physiotherapy) ([tabs/ServiceContractsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/ServiceContractsTab.tsx)).
5. `requirements` — **Service Requirements**: Specialized clinical equipment and nurse skills ([tabs/ServiceRequirementsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/ServiceRequirementsTab.tsx)).
6. `allocations` — **Staff Allocations**: Matching nurses to home clients ([tabs/StaffAllocationsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/StaffAllocationsTab.tsx)).
7. `roster` — **Manager Roster**: Scheduling calendar for off-site workforce ([tabs/ManagerRosterTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/ManagerRosterTab.tsx)).
8. `delivery` — **Care Delivery Verification**: Digital signatures, photo proof of visit ([tabs/CareDeliveryTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/CareDeliveryTab.tsx)).
9. `enquiries` — **Enquiries Pipeline**: Inbound leads for home-based elder care ([tabs/EnquiriesTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/EnquiriesTab.tsx)).
10. `staff-overview` — **Staff Overview**: Field nurse availability and performance ([tabs/StaffOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/tabs/StaffOverviewTab.tsx)).

### 3.6 Security & Visitor Gate (`/visitor-security?tab=...`)
1. `dashboard` — **Security Command Center**: Live head-count, active visitor passes on campus ([tabs/VisitorDashboardTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/VisitorDashboardTab.tsx)).
2. `passes` — **Visitor Passes**: Digital badge generation, photo capture, escort assignment ([tabs/VisitorPassesTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/VisitorPassesTab.tsx)).
3. `queue` — **Gate Queue**: Real-time gate waiting queue for vehicle/pedestrian access ([tabs/GateQueueTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/GateQueueTab.tsx)).
4. `vehicles` — **Vehicle Gate Register**: Commercial delivery trucks, ambulances, private cars ([tabs/VehicleGateTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/VehicleGateTab.tsx)).
5. `outings` — **Resident Outings & Gate-Pass**: Authorization for residents leaving campus ([tabs/ResidentOutingsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/ResidentOutingsTab.tsx)).
6. `staff-movements` — **Staff Gate Movements**: Biometric / NFC shift punch verification ([tabs/StaffMovementsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/StaffMovementsTab.tsx)).
7. `reports` — **Daily Gate Reports**: Security incident audit, unauthorized entry attempts ([tabs/DailyReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/tabs/DailyReportsTab.tsx)).

### 3.7 Philanthropy & Foundation (`/donors-volunteers?tab=...`)
1. `overview` — **Foundation Command**: Total donations collected, active foundation campaigns ([tabs/FoundationOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/FoundationOverviewTab.tsx)).
2. `donors` — **Donor Directory**: Philanthropist KYC, PAN cards, giving history ([tabs/DonorDirectoryTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/DonorDirectoryTab.tsx)).
3. `donations` — **Donations Register**: Cash, cheque, NEFT receipts, 80G tax certificates ([tabs/DonationsRegisterTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/DonationsRegisterTab.tsx)).
4. `projects` — **Funding Projects**: Earmarked projects (e.g., Elder ICU wing, Solar generator) ([tabs/FundingProjectsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/FundingProjectsTab.tsx)).
5. `financials` — **Project Financials**: Budget vs actual spend, audit trail ([tabs/ProjectFinancialsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/ProjectFinancialsTab.tsx)).
6. `volunteers` — **Volunteers & Community**: Volunteer roster, campus event assignments ([tabs/VolunteersCommunityTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/tabs/VolunteersCommunityTab.tsx)).

### 3.8 HR & Operations (`/hr-operations?tab=...`)
1. `overview` — **Workforce Command Center**: Total staff, headcount on-site, attendance rate ([tabs/HrOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/HrOverviewTab.tsx)).
2. `directory` — **Staff Directory**: Employee files, designations, contact details, documents ([tabs/StaffDirectoryTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/StaffDirectoryTab.tsx)).
3. `attendance` — **Attendance Roster**: Punch-in/out logs, shifts, overtime hours ([tabs/AttendanceRosterTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/AttendanceRosterTab.tsx)).
4. `leave` — **Leave Governance**: Leave requests, casual/earned leave balance, manager approval ([tabs/LeaveGovernanceTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/LeaveGovernanceTab.tsx)).
5. `payroll` — **Recruitment & Payroll**: Salary slips, PF, ESI calculations, candidate pipeline ([tabs/RecruitmentPayrollTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/RecruitmentPayrollTab.tsx)).
6. `tasks` — **Tasks Register**: Operational action items, facility work orders, SLAs ([tabs/TasksRegisterTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/TasksRegisterTab.tsx)).
7. `maintenance` — **Facility Maintenance**: Plant, medical gas, generator maintenance logs ([tabs/FacilityMaintenanceTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/FacilityMaintenanceTab.tsx)).
8. `portal-access` — **Client Portal Access Manager**: Generating and resetting family sponsor access ([tabs/ClientPortalAccessTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/tabs/ClientPortalAccessTab.tsx)).

### 3.9 Ambulance & Fleet Logistics (`/ambulance?tab=...`)
1. `overview` — **Fleet Command Center**: Active dispatches, available emergency units ([tabs/AmbulanceOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/AmbulanceOverviewTab.tsx)).
2. `fleet` — **Vehicle Fleet**: Ambulance registration, oxygen cylinder status, maintenance expiry ([tabs/VehicleFleetTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/VehicleFleetTab.tsx)).
3. `bookings` — **Trip Bookings**: Scheduled medical transport appointments ([tabs/TripBookingsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/TripBookingsTab.tsx)).
4. `dispatch` — **Dispatch Management**: Real-time driver/paramedic dispatch alerts ([tabs/DispatchManagementTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/DispatchManagementTab.tsx)).
5. `tripsheets` — **Trip Sheets**: Odometer readings, toll slips, run telemetry, oxygen consumed ([tabs/TripSheetsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/TripSheetsTab.tsx)).
6. `billing` — **Ambulance Billing**: Emergency transport invoice generation ([tabs/AmbulanceBillingTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/tabs/AmbulanceBillingTab.tsx)).

### 3.10 Central Reports & Business Intelligence (`/reports?tab=...`)
1. `overview` — **Executive BI Overview**: High-level cross-domain performance summary ([tabs/ExecutiveOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/ExecutiveOverviewTab.tsx)).
2. `inventory` — **Inventory Reports**: Consumption vs budget, dead stock, wastage audits ([tabs/InventoryReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/InventoryReportsTab.tsx)).
3. `admissions` — **Admissions & Care Reports**: Census trajectory, occupancy rate, mortality/discharge ([tabs/AdmissionsCareReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/AdmissionsCareReportsTab.tsx)).
4. `finance` — **Finance Reports**: Profit & Loss, ledger reconciliation, tax deductions ([tabs/FinanceReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/FinanceReportsTab.tsx)).
5. `hr` — **HR & Operations Reports**: Staff turnover, overtime expenditure, leave utilization ([tabs/HROperationsReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/HROperationsReportsTab.tsx)).
6. `homecare` — **Home Care Reports**: Client retention, field nurse utilization ([tabs/HomeCareReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/HomeCareReportsTab.tsx)).
7. `visitor` — **Security Reports**: Campus footfall, vehicle logs, security exceptions ([tabs/VisitorSecurityReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/VisitorSecurityReportsTab.tsx)).
8. `donors` — **Philanthropy Reports**: 80G audit report, donor tier breakdown ([tabs/DonorsFundingReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/DonorsFundingReportsTab.tsx)).
9. `ambulance` — **Ambulance Reports**: Response times, vehicle maintenance costs ([tabs/AmbulanceReportsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/AmbulanceReportsTab.tsx)).
10. `cross-domain` — **Cross-Domain Telemetry**: End-to-end data pipelines and operational latency ([tabs/CrossDomainWorkflowTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/tabs/CrossDomainWorkflowTab.tsx)).

### 3.11 ElderCare Client & Family Portal (`/portal?tab=...`)
1. `overview` — **Family Care Summary**: Resident health status, assigned nurse, emergency contact ([tabs/PortalOverviewTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalOverviewTab.tsx)).
2. `vitals` — **Health & Vitals Charting**: Live charts for BP, Heart Rate, Temperature, Glucose ([tabs/PortalVitalsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalVitalsTab.tsx)).
3. `adl` — **Daily Living Activities**: Bathing, mobility, sleep logs, social engagement ([tabs/PortalAdlTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalAdlTab.tsx)).
4. `meds` — **Medication Schedule**: Prescribed medicines, administration timestamps ([tabs/PortalMedsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalMedsTab.tsx)).
5. `diet` — **Diet & Nutrition**: Daily meal plan, dietary restrictions, fluid intake ([tabs/PortalDietTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalDietTab.tsx)).
6. `billing` — **Invoices & Online Payments**: Monthly fee breakdowns, receipts download ([tabs/PortalBillingTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalBillingTab.tsx)).
7. `complaints` — **Care Desk & Requests**: Feedback, special care requests, incident ticketing ([tabs/PortalComplaintsTab.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/tabs/PortalComplaintsTab.tsx)).
