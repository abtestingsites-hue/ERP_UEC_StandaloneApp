# ERP PHASE 01 — INTERACTION CONTROL MATRIX

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Status Baseline:** VERIFIED from active source code

---

## 1. GLOBAL INTERACTIVE CONTROLS

| Control Label | Location | Component | Type | Visual Style | Event Handler | Target API / State Mutation |
|---|---|---|---|---|---|---|
| **Toggle navigation** | Topbar (Left) | [src/components/Topbar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Topbar.tsx) | Button (`Menu` icon) | Borderless icon button (`36x36px`) | `onClick={onToggleSidebar}` | Toggles `collapsed` / `mobileOpen` state |
| **Workspace Navigation Link** | Sidebar | [src/components/Sidebar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Sidebar.tsx) | `NavLink` | `sidebar-link` pill, 18px icon | `onClick={onNavigate}` | React Router navigation (`/dashboard`, `/inventory`, etc.) |
| **Operating Unit Selector** | Topbar (Right) | [src/components/OperatingUnitSelector.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/OperatingUnitSelector.tsx) | Custom Select Dropdown | White background, border `#E1E6E1`, 12px text | `onChange={(unitId) => setActiveUnit(unitId)}` | Updates `useActiveUnit()` context & localStorage |
| **Attendance Trigger** | Topbar (Right) | [src/components/Topbar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Topbar.tsx) | Action Pill Button | Green surface (`#E7F4E8`), green text (`#026601`), `Clock` icon | `onClick={() => setIsProfileModalOpen(true)}` | Opens `MyProfileModal` |
| **Sign Out** | Topbar (Right) | [src/components/Topbar.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/Topbar.tsx) | Icon Button | Borderless icon button, `LogOut` icon | `onClick={logout}` | Clears session tokens, redirects to `/login` |
| **Domain Switcher** | PageHeader | [src/components/DomainSwitcher.tsx](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/components/DomainSwitcher.tsx) | Dropdown Button | Rounded outline pill button with chevron | `onClick={toggleOpen}` | Quick switch across 10 business domains |

---

## 2. DOMAIN-SPECIFIC INTERACTIVE CONTROLS

### 2.1 Inventory Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Refresh** | `InventoryOverviewTab.tsx` | Secondary Button (`RefreshCw` icon) | Reloads live stock metrics and alerts | `GET /api/v1/inventory/products`, `GET /api/v1/inventory/valuation` |
| **+ Add Product** | `ProductMasterTab.tsx` | Primary Button (`#039A01`) | Opens product creation modal | `POST /api/v1/inventory/products` |
| **Search Catalog** | `ProductMasterTab.tsx` | Search Input | Debounced client/server text filter | `GET /api/v1/inventory/products?search=...` |
| **Category Filter** | `ProductMasterTab.tsx` | Select Dropdown | Filters table by category | Local state filter / API parameter |
| **Approve Requisition** | `StockIssueRequestsTab.tsx` | Action Button (`Check` icon) | Approves departmental indent | `PATCH /api/v1/inventory/issue-requests/:id/approve` |
| **Dispatch Stock** | `StockIssueRequestsTab.tsx` | Success Button | Records warehouse dispatch | `POST /api/v1/inventory/stock-movements` |
| **Create Purchase Order** | `PurchasesProcurementTab.tsx` | Wizard Trigger | Initiates PO generation | `POST /api/v1/inventory/purchase-orders` |
| **Receive GRN** | `PurchasesProcurementTab.tsx` | Modal Trigger | Records goods receipt note | `POST /api/v1/inventory/grn` |
| **Initiate Stock Audit** | `PhysicalAuditsTab.tsx` | Primary Button | Creates physical stocktaking session | `POST /api/v1/inventory/audits` |
| **Reconcile Variance** | `PhysicalAuditsTab.tsx` | Warning Button | Submits variance adjustment | `POST /api/v1/inventory/audits/:id/reconcile` |

### 2.2 Finance & Billing Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Run Monthly Billing** | `ElderBillingTab.tsx` | Primary Action Button | Generates batch care fees for all active residents | `POST /api/v1/finance/billing/batch-run` |
| **Create Manual Invoice** | `ManualBillingTab.tsx` | Primary Button | Submits itemized invoice form | `POST /api/v1/finance/invoices/manual` |
| **Download Invoice PDF** | `InvoicesLedgerTab.tsx` | Icon Button (`Download` icon) | Downloads printable PDF receipt | `GET /api/v1/finance/invoices/:id/pdf` |
| **Record Cash In/Out** | `CashboxLedgerTab.tsx` | Modal Trigger | Disburses petty cash voucher | `POST /api/v1/finance/cashbox/transactions` |
| **Approve Vendor Bill** | `VendorBillsTab.tsx` | Success Button | Authorizes accounts payable payment | `PATCH /api/v1/finance/vendor-bills/:id/approve` |
| **Authorize Expenditure** | `PendingApprovalsTab.tsx` | Double-check Modal | Tier-2 authorization for large payments | `POST /api/v1/finance/approvals/:id` |

### 2.3 Admissions Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Submit Admission** | `NewAdmissionTab.tsx` | Primary CTA Button | Submits 4-stage resident intake wizard | `POST /api/v1/admissions/admit` |
| **Allocate Room** | `NewAdmissionTab.tsx` | Selection Modal | Assigns ward bed to resident | `POST /api/v1/admissions/allocate-bed` |
| **Initiate Relieving** | `RelievingDischargeTab.tsx` | Modal Trigger | Starts discharge clearance workflow | `POST /api/v1/admissions/relieve` |
| **Export Case Sheet** | `HistoricalArchiveTab.tsx` | Action Button | Downloads complete medical case records | `GET /api/v1/admissions/:id/case-sheet` |

### 2.4 Inhouse Care & Nursing Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Record Vitals** | `DailyOperationsTab.tsx` | Fast-entry Form Button | Records BP, Pulse, SPO2, Temp, Glucose | `POST /api/v1/care/vitals` |
| **Administer Med** | `MedicationTab.tsx` | Toggle Button with Nurse PIN | Confirms medication administration in eMAR | `POST /api/v1/care/medications/administer` |
| **Indent Medicines** | `MedicineRequestsTab.tsx` | Modal Trigger | Sends ward requisition to pharmacy | `POST /api/v1/care/medicine-requests` |
| **Report Incident** | `IncidentsTab.tsx` | Warning Button (`AlertTriangle` icon) | Logs fall or emergency clinical event | `POST /api/v1/care/incidents` |
| **Clinical Sign-off** | `DutyApprovalTab.tsx` | Primary Button | Doctor / supervisor shift sign-off | `POST /api/v1/care/shift-approvals` |

### 2.5 Home Care Operations Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Schedule Visit** | `MyVisitsTab.tsx` | Primary Button | Dispatches home visit to nurse | `POST /api/v1/homecare/visits` |
| **Check In (GPS)** | `MyVisitsTab.tsx` | Touch Button | Records GPS coordinates & arrival timestamp | `POST /api/v1/homecare/visits/:id/checkin` |
| **Complete Visit** | `CareDeliveryTab.tsx` | Signature Pad CTA | Saves digital signature and care delivery notes | `POST /api/v1/homecare/visits/:id/complete` |

### 2.6 Security & Gate Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Issue Visitor Pass** | `VisitorPassesTab.tsx` | Primary Button | Captures photo and issues badge | `POST /api/v1/security/passes` |
| **Check Out Visitor** | `GateQueueTab.tsx` | Action Button | Logs exit timestamp and releases escort | `PATCH /api/v1/security/passes/:id/checkout` |
| **Authorize Resident Outing**| `ResidentOutingsTab.tsx` | Security Modal | Confirms doctor/guardian outing approval | `POST /api/v1/security/outings` |

### 2.7 Philanthropy & Foundation Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Record Donation** | `DonationsRegisterTab.tsx` | Primary Button | Records gift, logs PAN, computes 80G deduction | `POST /api/v1/donations/record` |
| **Generate 80G Receipt** | `DonationsRegisterTab.tsx` | PDF Trigger | Issues signed 80G tax receipt | `GET /api/v1/donations/:id/80g-receipt` |
| **Create Campaign** | `FundingProjectsTab.tsx` | Modal Trigger | Launches targeted fundraising project | `POST /api/v1/donations/projects` |

### 2.8 HR & Operations Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Manual Punch In/Out** | `AttendanceRosterTab.tsx` | Action Button | Adjusts staff biometric punch | `POST /api/v1/hr/attendance/punch` |
| **Approve Leave** | `LeaveGovernanceTab.tsx` | Success Button | Approves employee leave request | `PATCH /api/v1/hr/leaves/:id/approve` |
| **Generate Portal Password** | `ClientPortalAccessTab.tsx`| Action Button | Issues PIN for family sponsor account | `POST /api/v1/hr/portal-accounts/generate` |

### 2.9 Ambulance Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Dispatch Ambulance** | `DispatchManagementTab.tsx`| Critical CTA Button | Alerts driver and dispatches emergency unit | `POST /api/v1/ambulance/dispatch` |
| **Update Trip Status** | `DispatchManagementTab.tsx`| Segmented Control | Cycles: Dispatched -> On Scene -> Transporting | `PATCH /api/v1/ambulance/trips/:id/status` |
| **Close Trip Sheet** | `TripSheetsTab.tsx` | Form Submit | Records ending odometer, fuel, oxygen used | `POST /api/v1/ambulance/trips/:id/close` |

### 2.10 Central Reports Controls
| Control Label | Tab / Component | Type | Behavior & State Mutation | API Endpoint Traced |
|---|---|---|---|---|
| **Select Date Range** | `CentralReportsWorkspace.tsx`| Dropdown / Date Picker | Filters BI analytics timeframe | Modifies component state and queries API |
| **Export Excel / CSV** | `CentralReportsWorkspace.tsx`| Secondary Button | Exports active dataset to spreadsheet | Client-side CSV generator / API download |
| **Print BI Summary** | `CentralReportsWorkspace.tsx`| Secondary Button | Triggers browser print styles | `window.print()` |
