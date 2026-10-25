# ERP PHASE 01 — COMPONENT INVENTORY & TAXONOMY

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Status Baseline:** VERIFIED from active source code

---

## 1. COMPONENT ARCHITECTURE OVERVIEW

The ERP frontend is constructed using a hybrid component architecture:
1. **Shared Enterprise Shell Primitives** ([src/components/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/))
2. **Context & State Providers** ([src/context/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/context/))
3. **Domain-Specific Workspace Tabs** (under `src/features/<domain>/tabs/`)
4. **Domain-Specific Modals & Sub-Components** (under `src/features/<domain>/components/`)

---

## 2. SHARED ENTERPRISE SHELL COMPONENTS

| Component Name | Physical Source Path | Purpose & Responsibilities | Key Props / State |
|---|---|---|---|
| `Sidebar` | [src/components/Sidebar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Sidebar.tsx) | Fixed left primary navigation bar, UNCF branding, domain module links, profile drawer trigger | `collapsed: boolean`, `mobileOpen: boolean`, `onToggle()`, `onNavigate()` |
| `Topbar` | [src/components/Topbar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Topbar.tsx) | Global header containing workspace context, unit selector, attendance modal trigger, logout | `onToggleSidebar()` |
| `PageHeader` | [src/components/PageHeader.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/PageHeader.tsx) | Standard page header displaying eyebrow hierarchy, page title, description, and action slot | `eyebrow?: string`, `title: string`, `description?: string`, `action?: ReactNode` |
| `DomainSwitcher` | [src/components/DomainSwitcher.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/DomainSwitcher.tsx) | Rapid domain switching dropdown menu embedded within page headers | Internal state for open/close dropdown |
| `OperatingUnitSelector` | [src/components/OperatingUnitSelector.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/OperatingUnitSelector.tsx) | Facility selector switching between specific care homes and "All Facilities" scope | Uses `useActiveUnit()` context |
| `MyProfileModal` | [src/components/MyProfileModal.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/MyProfileModal.tsx) | Modal dialog for staff profile view, daily check-in / check-out, and leave application | `isOpen: boolean`, `onClose()` |
| `StatCard` | [src/components/StatCard.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/StatCard.tsx) | Standardized metric card displaying label, value, trend badge, and accent icon | `label`, `value`, `icon`, `trend`, `accent` |
| `ModuleCard` | [src/components/ModuleCard.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/ModuleCard.tsx) | Interactive tile used on executive dashboard grid for launching workspaces | `domain: DomainModule` |
| `LoadingState` | [src/components/LoadingState.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/LoadingState.tsx) | Centered loading spinner with custom label for asynchronous tab transitions | `message?: string` |
| `ErrorState` | [src/components/ErrorState.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/ErrorState.tsx) | Accessible error alert box with retry button | `error: string`, `onRetry?: () => void` |

---

## 3. DOMAIN-SPECIFIC COMPONENT REGISTERS

### 3.1 Inventory Components ([src/features/inventory/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/inventory/))
- **`InventoryWorkspace.tsx`**: Host container managing tab query parameter and scope badge.
- **`InventoryOverviewTab.tsx`**: Executive metrics grid, valuation summary, alert banners.
- **`ProductMasterTab.tsx`**: Dense catalog table, search and category filters, product creation modal.
- **`StockBatchesTab.tsx`**: Batch expiration calendar, warehouse aisle/bin coordinates.
- **`StockIssueRequestsTab.tsx`**: Internal department requisition approval queue and dispatch logging.
- **`VendorDirectoryTab.tsx`**: Supplier details, GST compliance validation, contact directory.
- **`PurchasesProcurementTab.tsx`**: Full P2P procurement flow (PR -> PO -> GRN -> Invoice matching).
- **`StockValuationTab.tsx`**: Valuation reports with FIFO/Weighted Average breakdowns.
- **`ConsumptionAnalyticsTab.tsx`**: Ward dispensing burn rate and wastage charts.
- **`PhysicalAuditsTab.tsx`**: Physical count sheet, variance calculation, supervisor authorization.
- **`StockMovementsTab.tsx`**: Complete immutable ledger of every stock transaction.

### 3.2 Finance Components ([src/features/finance/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/finance/))
- **`FinanceWorkspace.tsx`**: Main finance hub managing billing runs and ledger views.
- **`ElderBillingTab.tsx`**: Resident care fee automation, recurring monthly invoice generator.
- **`ManualBillingTab.tsx`**: Freeform line-item invoice creation, receipt generation, tax calculator.
- **`InvoicesLedgerTab.tsx`**: Filterable invoice table, payment reconciliation, PDF export.
- **`CashboxLedgerTab.tsx`**: Petty cash book, cash in/out entry modal, voucher upload.
- **`P2POverviewTab.tsx`**: Procurement accounts payable pipeline overview.
- **`P2PGRNAccrualsTab.tsx`**: Unbilled goods receipt matching table.
- **`VendorBillsTab.tsx`**: Vendor invoice approval, TDS deduction, bank transfer tracking.
- **`PendingApprovalsTab.tsx`**: Two-tier authorization queue for expenses > Rs. 10,000.
- **`PatientDailyCostTab.tsx`**: Daily patient cost breakdown across food, nursing, medicine, room.

### 3.3 Admissions Components ([src/features/admissions/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/admissions/))
- **`AdmissionWorkspace.tsx`**: Host container for resident intake and discharge.
- **`AdmissionsListTab.tsx`**: Filterable table of admitted residents with care level pills.
- **`NewAdmissionTab.tsx`**: Comprehensive 4-stage wizard:
  1. Resident KYC & Demographics
  2. Next of Kin & Financial Sponsor
  3. Medical History & Doctor Assessments
  4. Room Allocation, Care Plan & Security Deposit
- **`PatientRegistrationTab.tsx`**: Fast KYC intake for outpatient or temporary care.
- **`ExistingPatientTab.tsx`**: Re-admission workflow retrieving historical records.
- **`RelievingDischargeTab.tsx`**: Formal discharge clearance form, refund calculator.
- **`HistoricalArchiveTab.tsx`**: Searchable archive of closed records and discharge summaries.

### 3.4 Inhouse Care & Nursing Components ([src/features/care/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/care/))
- **`CareWorkspace.tsx`**: Host clinical care shell.
- **`DailyOperationsTab.tsx`**: Real-time nurse station dashboard with shift handover notes.
- **`AdlNutritionTab.tsx`**: ADL scoring (Katz Index), meal consumption percentages.
- **`MedicationTab.tsx`**: eMAR medication administration chart with time slots.
- **`MedicineRequestsTab.tsx`**: Nursing ward requisition table to central pharmacy.
- **`MonitoringAlertsTab.tsx`**: Abnormal vitals table (Hypertension, Hypoxia, Tachycardia).
- **`NurseShiftTab.tsx`**: Daily duty allocations and shift handover checklist.
- **`AssignmentsTab.tsx`**: Resident-caregiver matrix.
- **`IncidentsTab.tsx`**: Incident logging form (Falls, Skin tears, Behavioral events).
- **`DutyApprovalTab.tsx`**: Doctor & head nurse clinical sign-off portal.
- **`RevenueSheetTab.tsx`**: Chargeable clinical services calculation sheet.

### 3.5 Home Care Components ([src/features/home-care/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/home-care/))
- **`HomeCareWorkspace.tsx`**: Host home care operations hub.
- **`ManagerOverviewTab.tsx`**: Daily dispatch map and visit KPI summary.
- **`MyClientsTab.tsx`**: Home-care client directory with address and emergency contact.
- **`MyVisitsTab.tsx`**: Chronological visit ledger with check-in timestamps.
- **`ServiceContractsTab.tsx`**: Active care package agreements and renewal dates.
- **`ServiceRequirementsTab.tsx`**: Special clinical needs (e.g. tracheostomy, catheter).
- **`StaffAllocationsTab.tsx`**: Field nurse assignment calendar.
- **`CareDeliveryTab.tsx`**: Digital signature capture and proof of care completion.
- **`EnquiriesTab.tsx`**: Inbound home-care lead pipeline.

### 3.6 Security & Visitor Components ([src/features/visitor-security/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/visitor-security/))
- **`VisitorSecurityWorkspace.tsx`**: Main security hub.
- **`VisitorDashboardTab.tsx`**: Active visitor headcount, recent entries counter.
- **`VisitorPassesTab.tsx`**: Digital pass generation with web-camera snapshot integration.
- **`GateQueueTab.tsx`**: High-contrast waiting line queue for gate guards.
- **`VehicleGateTab.tsx`**: Commercial and emergency vehicle entry/exit log.
- **`ResidentOutingsTab.tsx`**: Outing authorization gate pass with expected return time.
- **`StaffMovementsTab.tsx`**: Biometric / RFID security gate movement records.
- **`DailyReportsTab.tsx`**: Daily security summary export.

### 3.7 Philanthropy & Foundation Components ([src/features/donors-volunteers/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/donors-volunteers/))
- **`DonorsVolunteersWorkspace.tsx`**: Foundation hub.
- **`FoundationOverviewTab.tsx`**: Philanthropic KPI cards and campaign progress bars.
- **`DonorDirectoryTab.tsx`**: Donor profiles with PAN validation and tax exemption tier.
- **`DonationsRegisterTab.tsx`**: Receipt creation, 80G tax receipt PDF generator.
- **`FundingProjectsTab.tsx`**: Targeted donor funding projects.
- **`ProjectFinancialsTab.tsx`**: Granular budget vs expenditure balance ledger.
- **`VolunteersCommunityTab.tsx`**: Community volunteer database and event rosters.

### 3.8 HR & Operations Components ([src/features/hr-operations/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/hr-operations/))
- **`HrOperationsWorkspace.tsx`**: Workforce management hub.
- **`HrOverviewTab.tsx`**: Attendance percentage, staffing deficit alerts.
- **`StaffDirectoryTab.tsx`**: Employee master data, contracts, certifications.
- **`AttendanceRosterTab.tsx`**: Shift calendar and daily punch card.
- **`LeaveGovernanceTab.tsx`**: Leave request approval queue.
- **`RecruitmentPayrollTab.tsx`**: Salary disbursement and applicant tracking.
- **`TasksRegisterTab.tsx`**: Facility work order and maintenance task board.
- **`FacilityMaintenanceTab.tsx`**: Medical equipment and generator maintenance logs.
- **`ClientPortalAccessTab.tsx`**: Sponsor family account generation and password reset tool.

### 3.9 Ambulance Components ([src/features/ambulance/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/ambulance/))
- **`AmbulanceWorkspace.tsx`**: Fleet management hub.
- **`AmbulanceOverviewTab.tsx`**: Available vs dispatched vehicle telemetry.
- **`VehicleFleetTab.tsx`**: Ambulance asset registry, insurance, FC dates.
- **`TripBookingsTab.tsx`**: Scheduled patient transfer bookings.
- **`DispatchManagementTab.tsx`**: Live emergency response dispatch console.
- **`TripSheetsTab.tsx`**: Driver run sheets, fuel slips, kilometer readings.
- **`AmbulanceBillingTab.tsx`**: Trip invoicing and cash collection.

### 3.10 Central Reports Components ([src/features/reports/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/reports/))
- **`CentralReportsWorkspace.tsx`**: Cross-domain BI reporting hub.
- **`ExecutiveOverviewTab.tsx`**: Cross-functional KPIs and trend lines.
- **`InventoryReportsTab.tsx`**: Stock valuation and dead inventory report.
- **`AdmissionsCareReportsTab.tsx`**: Census, bed occupancy, length of stay.
- **`FinanceReportsTab.tsx`**: Revenue, expense, collections, pending dues.
- **`HROperationsReportsTab.tsx`**: Staffing ratios, overtime expenses.
- **`HomeCareReportsTab.tsx`**: Field visit counts and revenue per nurse.
- **`VisitorSecurityReportsTab.tsx`**: Gate traffic and incident report.
- **`DonorsFundingReportsTab.tsx`**: Donation collections and tax receipt totals.
- **`AmbulanceReportsTab.tsx`**: Average emergency response time analytics.
- **`CrossDomainWorkflowTab.tsx`**: Real-time cross-domain synchronization metrics.

### 3.11 Client & Family Portal Components ([src/features/portal/](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/features/portal/))
- **`PortalLogin.tsx`**: Dedicated login interface for family sponsors.
- **`PortalLayout.tsx`**: White-label portal shell with responsive tab navigation.
- **`PortalHeader.tsx`**: Header showing family account name, resident badge, logout.
- **`PortalOverviewTab.tsx`**: Daily health status snapshot and attending doctor/nurse.
- **`PortalVitalsTab.tsx`**: Visual trend charts for Blood Pressure, Heart Rate, Glucose.
- **`PortalAdlTab.tsx`**: Daily care activity logs (Bathing, Mobility, Nutrition).
- **`PortalMedsTab.tsx`**: Timetable of administered medications.
- **`PortalDietTab.tsx`**: Daily meal and dietary schedule.
- **`PortalBillingTab.tsx`**: Itemized monthly billing invoices and online payment status.
- **`PortalComplaintsTab.tsx`**: Feedback and care request ticketing portal.
