# Phase SOP-02 — Clarification Review & Manual Testing Readiness Report

**Project:** SuperAdminApp (`C:\Users\Victus\Desktop\ERP BACKUP\superadminapp`)  
**Backend:** ERP Express API (`http://127.0.0.1:4000/api/v1`)  
**Associated Apps:** `CRMApp`, `HRApp`, `HomeCareApp`, `InventoryApp`  
**Date:** October 15, 2026  
**Status:** Complete Audit & Readiness Assessment  
**Mode:** Read-Only Planning & Verification Protocol (No source code or DB changes)  
**Reference Documents:**
1. `docs/SOP_CLIENT_CLARIFICATIONS.md`
2. `docs/SOP_PHASE_RECOMMENDATION.md`
3. `docs/SOP_MANUAL_TEST_PLAN.md`
4. `docs/SOP_ERP_GAP_MATRIX.md`
5. `docs/SOP_WORKFLOW_MAPS.md`
6. `docs/INVENTORY_CRUD_TEST_REPORT.md`

---

## 1. Client Decisions Register & Testing Impact

Based on the four source SOPs (`HR SOP`, `DATA ENTRY SOP`, `SALES TEAM FINAL SOP`, `CCR SOP`), six fundamental business policy decisions are currently pending client determination. 

In strict adherence to governance constraints, **no business rules have been invented or assumed as approved**. The table below details each decision, the exact policy required, and whether manual testing can proceed in its absence.

| # | Operational Domain | Unresolved Client Decision | Exact Decision Required from Client | Can Testing Proceed Without It? | Technical & Testing Impact |
|---|---|---|---|:---:|---|
| **1** | **HR Operations** | **Staffing Targets & Standby Buffers** | Is the **"Target 35"** an agency-wide ready pool across all 12 categories combined, or 35 staff *per category*? Does the **"5 standby backup staff"** buffer apply to *all 12 categories* (requiring 60 standby staff) or only high-turnover roles (Patient Care, Baby Care, Nursing)? | **YES (with baseline scope)** | Testing basic candidate registration (`HR-01`) can proceed immediately using existing fields. However, testing automated quota warning meters and deficit alarms (`HR-02`) is **BLOCKED** until target numbers are confirmed. |
| **2** | **Commercial Sales** | **Standard Tariffs & Pricing Approval** | Are standard rates (Patient Care ₹25k/₹28k, Nursing ₹35k–₹40k, Baby Care ₹25k/₹35k, Office Service Charges ₹7.5k/₹15k/₹18k) **mandatory locked minimums** in the UI, or can sales agents negotiate custom pricing? If overrides are permitted, who holds approving authority? | **YES (with baseline scope)** | Testing existing contract creation with manual price entry can proceed. However, testing SOP automated rate lock and override enforcement (`SL-01`) is **BLOCKED** until pricing policy is confirmed. |
| **3** | **Commercial Sales** | **Business Closure & Deployment Approval** | Is MD & PCRT (Patient Care Review Team) clearance mandatory for *all* home care admissions or *only critical/ICU patients*? Does the ERP require sequential digital sign-offs from TLM -> BM -> PCRT before caregiver allocation unlocks? | **NO (for multi-tier flow)** | Basic caregiver allocation (`AssignCaregiverModal`) can be verified in its current state. Testing a multi-stage approval pipeline (`SL-02`) is **BLOCKED** because the UI currently operates on single-step manager approval. |
| **4** | **Cross-Domain Ops** | **Three-Day Follow-Up Ownership** | Are the 3-day post-placement follow-up calls split between HR (calling staff for welfare/attendance) and CCR/Sales (calling client for satisfaction), or managed as a unified care record? Where should the action queue reside? | **YES (for manual logs)** | Basic manual creation of follow-up tasks in `TasksRegisterTab` can be verified. Automated 72-hour trigger testing (`HR-03`) is **BLOCKED** until departmental ownership is defined. |
| **5** | **CCR & Finance** | **Refund Approval Rules & Authority** | What is the exact formula for cancellation deductions (e.g. forfeiture of Office Service Charge vs pro-rata staff days)? What is the refund threshold that CCR can authorize before requiring Finance Manager / Director approval? | **NO (for refund flow)** | Testing dispute status transitions can be verified in CRMApp. Testing the priority refund financial handoff (`CR-03`) is **BLOCKED** because no programmatic credit-note bridge currently links CCR disputes to Finance disbursements. |
| **6** | **Architecture** | **CRM Scope & Boundary Placement** | Should Customer Care & Relations (CCR / Complaints) remain in the standalone `CRMApp`, or should a dedicated 10th domain tab (`Customer Care & Complaints`) be introduced inside `SuperAdminApp`? | **YES (by testing CRMApp)** | If testing is restricted to `SuperAdminApp`, testing complaint triage (`CR-01`, `CR-02`) is **BLOCKED** because no Complaints tab exists in SuperAdminApp. If testing is permitted across standalone `CRMApp`, testing can proceed immediately. |

---

## 2. Manual Testing Reconciliation & Sequencing

### 2.1 Reconciliation with Inventory Status and ERP Roadmap
1. **Inventory CRUD Baseline (`ACCEPT FOR PRODUCTION UAT`):** As documented in [INVENTORY_CRUD_TEST_REPORT.md](file:///c:/Users/Victus/Desktop/ERP%20BACKUP/superadminapp/docs/INVENTORY_CRUD_TEST_REPORT.md), the Inventory domain has completed full static analysis, production bundle verification, and non-destructive live reading. Live write mutations were intentionally withheld to protect live production collections until isolated UAT.
2. **SOP Enhancement Reality:** The SOP gap analysis ([SOP_ERP_GAP_MATRIX.md](file:///c:/Users/Victus/Desktop/ERP%20BACKUP/superadminapp/docs/SOP_ERP_GAP_MATRIX.md)) established that 70% of SOP requirements are `PARTIALLY IMPLEMENTED` (present in database schema and backend endpoints, but lacking specialized SOP frontend controls like auto-calculated tariff cards or 12-category dropdowns).
3. **Testing Objective:** Manual testing at this stage must evaluate **As-Is ERP Baseline Capabilities** against client SOP expectations to establish an empirical test baseline before coding UI refinements.

### 2.2 Classification of the 10 SOP Manual Test Cases

| Test Case ID | Test Name | Readiness Classification | Dependency / Blocker Explanation |
|---|---|:---:|---|
| **DE-01** | Multi-Stream Lead Deduplication Engine | **READY TO START IMMEDIATELY** | **No blockers.** `EnquiriesTab` and `EnquiryFormModal` are active in `HomeCareWorkspace`. Backend unique indexing and phone lookup services exist and can be safely tested using a non-destructive test probe. |
| **HR-01** | Candidate Intake & Identity Validation | **READY WITH PREREQUISITES** | Existing `AddStaffModal` supports staff creation, but currently displays 11 generic designations rather than the 12 SOP categories. Can be tested to verify baseline registration and unique `empId` persistence. |
| **DE-02** | BPR Referral Partner Channel Tagging | **BLOCKED BY ARCHITECTURE** | `ReferralPartner` model exists in backend, but partner attribution dropdown is currently implemented in standalone `CRMApp/b2p/B2PDashboard.tsx`, not in SuperAdminApp's intake modal. |
| **SL-01** | Standard Tariff & Office Charge Auto-Math | **BLOCKED BY CLIENT DECISION #2** | `CreateContractModal` currently accepts free-text rate inputs. Auto-population of ₹28k / ₹15k fees is not yet implemented and requires client confirmation on pricing rigidity. |
| **SL-02** | 10-Stage Pipeline & 3-Way Conference Gate | **BLOCKED BY CLIENT DECISION #3** | Mandatory 3-way conference call checkbox and multi-stage approval gates do not yet exist in the UI. |
| **HR-02** | 5-Standby Backup Buffer Alarm | **BLOCKED BY CLIENT DECISION #1** | Quota target calculations (Target 35) and shortage alarm badges are not present in `HrOverviewTab`. |
| **HR-03** | Post-Joining 3-Day Adaptation Follow-Up | **BLOCKED BY CLIENT DECISION #4** | Automated 72-hour scheduling engine is not active; requires client decision on HR vs Care Coordinator ownership. |
| **CR-01** | Priority Grievance Triage | **BLOCKED BY CLIENT DECISION #6** | `SuperAdminApp` has no dedicated Complaints workspace tab (currently resides in standalone `CRMApp` and backend Express routes). |
| **CR-02** | Rapid Staff Replacement & DCN Generation | **BLOCKED BY CODE COMPLETION** | Caregiver reassignment exists in `StaffAllocationsTab`, but automated DCN (Delivery Confirmation Note) slip generation is not implemented. |
| **CR-03** | Priority Refund Handoff to Finance Desk | **BLOCKED BY CLIENT DECISION #5** | Formal refund bridge ticket between CCR complaints and Finance payouts is not implemented. |

---

## 3. Recommended First Test Case Preparation

### Test Case: `DE-01` — Multi-Stream Lead Deduplication & Intake Verification

* **Business Purpose:**  
  Validate that the client intake engine in `SuperAdminApp` (`HomeCareWorkspace`) correctly captures customer leads, sanitizes contact data, validates mandatory fields, enforces data integrity, and prevents accidental duplication of existing customer profiles across incoming business streams.

* **Exact Starting Screen & Navigation Path:**  
  1. Open running SuperAdminApp: `http://127.0.0.1:5172`.
  2. Verify active domain is set to **Home Care Services**.
  3. Navigate to: `http://127.0.0.1:5172/home-care?tab=enquiries`.
  4. Header must display: `BUSINESS DOMAIN · HOME CARE SERVICES` / `Home Care & Domiciliary Operations`.

* **Required Login Role:**  
  - Primary: `SUPER_ADMIN` (`admin@example.com`) or `CARE_COORDINATOR`.
  - Permission Boundary: User must possess `manage:homecare` or `view:homecare` permissions.

* **Prerequisite Records & Safe Test-Data Strategy:**  
  - **Zero Probe Interference:** Under no circumstances shall the 28 preserved probe records identified in Phase 19A2 be selected, edited, or modified.
  - **Dedicated Safe Test Identifier:** All test entries must strictly follow the prefix convention:  
    `Name: TEST_SOP_DOE_JOHN`  
    `Mobile: 9110009999` (dedicated non-production test range)  
    `Email: test_sop_intake@example.internal`  
    `Address: 123 Test Verification Way, Unit QA`

* **Step-by-Step Test Actions:**  
  1. **Inspection Step:** Review the existing list in `EnquiriesTab` to confirm initial row count and ensure no record with phone `9110009999` exists.
  2. **Intake Trigger:** Click the **`+ New Enquiry`** button in the top action bar.
  3. **Modal Verification:** Confirm `EnquiryFormModal` renders with fields:
     - Client Name, Mobile, Email, Mode (Call/WhatsApp/Walk-in/Referral).
     - Patient Name, Patient Age, Gender, Health Condition, Address.
     - Staff Required, Shift, Frequency, Special Instructions.
  4. **Data Input:** Enter safe test parameters:
     - Client Name: `TEST_SOP_DOE_JOHN`
     - Mobile: `9110009999`
     - Mode: `Call`
     - Patient Name: `TEST_SOP_PATIENT_ELDER`
     - Patient Health Condition: `Post-operative recovery; requires mobility assistance`
     - Shift: `12 Hours Day`
  5. **Submission:** Click **Submit Enquiry**.
  6. **Persistence Inspection:** Verify modal closes, list reloads, and `TEST_SOP_DOE_JOHN` appears in the table with status `Open`.
  7. **Deduplication Check (Collision Test):** Click **`+ New Enquiry`** again. Enter identical phone number `9110009999` with name `TEST_SOP_COLLISION`. Click **Submit Enquiry**.

* **Expected UI Behaviour:**  
  - Initial submission: Displays loading indicator on button, succeeds with zero network errors, and appends record to list.
  - Secondary duplicate submission: UI must intercept duplicate phone entry or backend must return HTTP 409 Conflict with user-friendly alert: *"Existing customer found with mobile 9110009999"*.

* **Expected Backend Status Transitions & Persistence:**  
  - Record created in Prisma table `Enquiry` with `status: "Open"`, `mobile: "9110009999"`, `createdAt: <timestamp>`.
  - Unit isolation verified: `unitId` correctly associated with current active unit.

* **Permission & Negative Tests:**  
  - **Negative Test DE-01-N1 (Mandatory Field Enforcement):** Open modal, leave Client Name and Mobile blank, click Submit. Modal must prevent submission and highlight: *"Client name and mobile number are required."*.
  - **Negative Test DE-01-N2 (Whitespace Sanitization):** Enter mobile with extra spaces: `"  9110009999  "`. System must trim whitespace before evaluation.
  - **Permission Check DE-01-P:** Switch user session to an unauthorized role (e.g. `INVENTORY_STAFF`). Attempt to access `/home-care?tab=enquiries`. Workspace access must be blocked with an Access Denied message.

* **Evidence to Capture:**  
  - Browser console logs confirming zero Axios/preflight errors.
  - Network tab payload for `POST /api/v1/enquiry`.
  - Screenshot of `EnquiriesTab` displaying the newly created safe test record.
  - Screenshot of the deduplication / validation error dialog.

* **Pass / Fail Criteria:**  
  - **PASS:** Form validates required fields, creates test enquiry with HTTP 201, updates UI table reactively, isolates tenant by `unitId`, and prevents duplicate creation on existing phone number.
  - **FAIL:** Network error (CORS/500), empty mobile accepted, unhandled duplicate collision, or UI crash.

* **Cleanup Requirements:**  
  - Following verification and evidence capture, the test record `TEST_SOP_DOE_JOHN` (`9110009999`) must be safely updated to status `Cancelled` or removed using the authorized service endpoint, ensuring zero persistent test clutter in production tables.

---

## 4. Safety & Governance Confirmation

1. **Read-Only Planning:** No application source code was modified during this review.
2. **Database Integrity:** No database migrations, seeds, resets, or write operations were performed.
3. **Probe Protection:** All 28 historic probe records documented in Phase 19A2 remain intact and unreferenced by test cases.
4. **App Isolation:** Standalone applications (`CRMApp`, `HRApp`, `HomeCareApp`, `InventoryApp`) remain untouched and running independently.

---

## 5. Explicit Recommendation & Actionable Next Step

### Final Recommendation:
# **READY WITH PREREQUISITES**

### Rationale:
The application codebase is stable, Vite dev servers and Express backend are actively running with zero compile errors, and Inventory CRUD testing is fully closed out. 

However, because 7 of the 10 SOP manual test cases depend directly on pending client policy decisions (rigid tariffs, multi-stage approval hierarchies, staffing buffer definitions, and CRM placement), full end-to-end SOP test execution cannot proceed across all modules simultaneously. 

Testing can safely and immediately begin on **Test Case `DE-01` (Lead Deduplication & Intake Verification)** once the tester satisfies the prerequisites below.

---

### Exact First Action for the Tester:

1. **Prerequisite Step 1:** Open the browser at `http://127.0.0.1:5172` and authenticate as `admin@example.com`.
2. **Prerequisite Step 2:** Ensure the active unit in the top navigation is selected (e.g., `Headquarters` or primary test unit).
3. **Execution Step:** Navigate directly to `http://127.0.0.1:5172/home-care?tab=enquiries` and execute **Test Case `DE-01`** using the dedicated safe test parameters (`TEST_SOP_DOE_JOHN` / `9110009999`).
4. **Stakeholder Action:** Concurrently submit [SOP_CLIENT_CLARIFICATIONS.md](file:///c:/Users/Victus/Desktop/ERP%20BACKUP/superadminapp/docs/SOP_CLIENT_CLARIFICATIONS.md) to client management to unlock Test Cases `SL-01`, `SL-02`, and `HR-02`.
