# Client SOP Manual Verification & Test Plan

**Phase:** SOP-01 — Client SOP Mapping & ERP Gap Analysis  
**Date:** October 15, 2026  
**Document Status:** QA Baseline & Verification Protocol  
**Scope:** SuperAdminApp, Backend API, and Cross-Module Integration  
**Prerequisite:** All existing test probe records and existing database models must remain preserved.

---

## 1. Test Suite Overview & Verification Framework

This test plan defines comprehensive, step-by-step manual test cases covering the four core SOP operational cycles. Every test case details:
- **Test ID & Name**
- **SOP Reference & Business Rule**
- **Assigned User Role & Domain**
- **Pre-Conditions & Prerequisites**
- **Test Steps & Inputs**
- **Expected Visual & System Behavior**
- **Data Persistence Verification**
- **Security & Permission Boundaries**
- **Negative & Edge Cases**

---

## 2. Test Suite HR: Talent Acquisition & Staff Readiness (HR SOP)

### Test Case HR-01: Candidate Registration across 12 Standard Categories
* **Objective:** Verify candidate intake accepts all 12 defined staff categories with Aadhaar validation.
* **SOP Reference:** HR SOP Section: Staff categories (12 types) & phone screening script.
* **Role:** `SUPER_ADMIN`, `HR_MANAGER`, or `HR_STAFF`.
* **Prerequisites:** User logged in with access to `hr-operations` workspace.
* **Test Steps:**
  1. Navigate to `http://127.0.0.1:5172/hr-operations`.
  2. Click **Add New Staff / Register Candidate**.
  3. Enter Test Full Name: `Test Caregiver Sunita`.
  4. In the Staff Category dropdown, verify all 12 SOP categories exist:
     - *Female Attender, Male Attender, Baby Care, NICU, ANM & GNM, BSC Nursing, Certificate Nurse, Emergency Staff, Office Staff, Cook, Maid, House Keeping*.
  5. Select `Female Attender`.
  6. Enter Phone: `9876543210`, Aadhaar: `123456789012`.
  7. Submit form.
* **Expected Outcome:** Candidate created with status `SCREENING` or `ACTIVE`, assigned unique auto-generated `empId`.
* **Persistence Check:** Query database: `SELECT id, name, category, empId FROM "Staff" WHERE phone = '9876543210';` record exists with matching category.
* **Permissions Check:** Non-HR role (e.g. `INVENTORY_MANAGER`) accessing `/hr-operations` sees access denied toast or redirect.
* **Negative Test HR-01N:** Submit registration with invalid 10-digit Aadhaar or empty phone number. Form must block submission and highlight field validation error.

---

### Test Case HR-02: 5-Standby Backup Buffer & Shortage Alarms
* **Objective:** Verify that when a staff category falls below 5 active standby backups, an operational shortage warning triggers.
* **SOP Reference:** HR SOP: *"5 standby staff back for TLM"* & Data Entry SOP: *"Wanted Staff List"*.
* **Role:** `HR_MANAGER`, `TLM`.
* **Prerequisites:** HR workspace open.
* **Test Steps:**
  1. Inspect the Category Readiness KPI cards in the HR workspace.
  2. Filter by `NICU` or `BSC Nursing`.
  3. Check the count of available (unallocated) staff.
* **Expected Outcome:** If available staff count < 5, category indicator turns Amber/Red with an alarm tag: *"Shortage Alert: Below 5 Standby Target"*.
* **Persistence Check:** System alert logged in operational status logs.
* **Negative Test HR-02N:** Allocate the last available standby staff to an active patient. Verify count decrements to 0 and alarm elevates to Critical Red.

---

### Test Case HR-03: Post-Joining 3-Day Adaptation Follow-Up
* **Objective:** Verify that deploying a new staff member automatically queues Day 1, Day 2, and Day 3 welfare check tasks.
* **SOP Reference:** HR SOP: *"3 Days Follow-ups After Staff Handover"*.
* **Role:** `HR_STAFF`.
* **Test Steps:**
  1. Mark newly deployed candidate as `PLACED` with deployment date = Today.
  2. Navigate to HR Follow-Up / Welfare section.
* **Expected Outcome:** 3 scheduled tasks appear:
  - *Day 1 (Arrival & Accommodation Check)*: Due +24h.
  - *Day 2 (Patient Comfort & Routine Check)*: Due +48h.
  - *Day 3 (Placement Stability & Confirmation)*: Due +72h.
* **Persistence Check:** FollowUp records generated with target entity `Staff` and status `PENDING`.
* **Negative Test HR-03N:** Attempt to mark Day 3 complete without completing Day 1 and Day 2 checks. Warning or sequential requirement shown.

---

## 3. Test Suite DE: Data Entry, Deduplication & Roster Management (Data Entry SOP)

### Test Case DE-01: Multi-Stream Lead Deduplication Engine
* **Objective:** Prevent duplicate customer leads across business streams (New Enquiries, BPR, Campaign).
* **SOP Reference:** Data Entry SOP: Multi-stream data intake and phone/Aadhaar deduplication.
* **Role:** `DATA_ENTRY_OPERATOR`, `SUPER_ADMIN`.
* **Prerequisites:** Existing customer in database with phone `9988776655`.
* **Test Steps:**
  1. Navigate to `/home-care?tab=enquiries`.
  2. Click **New Enquiry**.
  3. Enter Customer Name: `Duplicate Test Client`, Phone: `9988776655`.
  4. Attempt to save.
* **Expected Outcome:** System intercepts entry, warns: *"Existing record found for 9988776655 (Client ID #...). Would you like to view existing profile or log follow-up?"*.
* **Persistence Check:** No secondary duplicate `Client` or `Enquiry` row created in the database.
* **Negative Test DE-01N:** Enter whitespace-padded phone number ` 9988776655 `. System sanitizer must strip padding and still detect collision.

---

### Test Case DE-02: BPR Referral Partner Channel Tagging
* **Objective:** Verify that incoming enquiries can be attributed to specific BPR partner categories (Ambulance, Hospital, Physio, Lab).
* **SOP Reference:** Data Entry SOP: *"BPR (Ambulance, Physio, Hospital, Lab)"*.
* **Role:** `DATA_ENTRY_OPERATOR`, `SALES_EXECUTIVE`.
* **Test Steps:**
  1. In Create Enquiry form, select Referral Source = `BPR Partner`.
  2. Select Partner Category: `Hospital`.
  3. Select Partner Name: `Apollo Speciality`.
  4. Submit enquiry.
* **Expected Outcome:** Lead tagged with `referralPartnerId` and partner type `Hospital`.
* **Persistence Check:** `SELECT "referralPartnerId", "source" FROM "Enquiry" WHERE id = '...';` contains foreign key relation.

---

## 4. Test Suite SL: Commercial Sales Pipeline & Tariff Adherence (Sales SOP)

### Test Case SL-01: Standard Tariff Card & Office Service Charge Auto-Computation
* **Objective:** Verify that selecting service packages enforces SOP standard pricing.
* **SOP Reference:** Sales SOP: Standard Tariffs (Patient Care ₹25k/₹28k, Nursing ₹35k–₹40k) and Office Service Charges (1 mo ₹7,500, 3 mo ₹15,000, 6 mo ₹18,000, 8 mo 1 month salary).
* **Role:** `SALES_EXECUTIVE`, `SUPER_ADMIN`.
* **Test Steps:**
  1. In `home-care` workspace, open an active Enquiry.
  2. Click **Generate Quotation / Propose Care Plan**.
  3. Select Service Type: `Patient Care 24h (with cooking)`.
  4. Verify staff monthly wage auto-populates to `₹28,000`.
  5. Select Contract Duration: `3 Months`.
  6. Verify Office Service Charge auto-populates to `₹15,000`.
  7. Verify total upfront billing equals `₹28,000 (Advance Staff) + ₹15,000 (Office Charge) = ₹43,000`.
* **Expected Outcome:** Calculations match SOP rate cards precisely without manual math errors.
* **Persistence Check:** Quotation record stored with itemized breakdown.
* **Negative Test SL-01N:** Sales agent attempts to type `₹10,000` for 3-month Office Service Charge. Input is blocked or requires Manager Approval code.

---

### Test Case SL-02: 10-Stage Pipeline Progression & 3-Way Conference Gate
* **Objective:** Verify a deal cannot be marked "Ready for Deployment" until commercial approval and 3-way conference call are documented.
* **SOP Reference:** Sales SOP: Stages 3, 4, 6 (TLM Approval, PCRT Clearance, 3-Way Conference Call).
* **Role:** `SALES_EXECUTIVE`, `TLM`.
* **Test Steps:**
  1. Move deal from `Proposal` to `Staff Matching`.
  2. Match Candidate A and Alternative Candidate B.
  3. Attempt to click **Dispatch Staff to Patient** before logging 3-way call.
* **Expected Outcome:** System displays mandatory requirement: *"Please conduct and log 3-Way Pre-Deployment Conference Call before physical deployment."*.
* **Step 4:** Log 3-way call notes (Participants: Client, Staff, Telecaller; Outcome: Approved).
* **Step 5:** Proceed to deployment. System now permits caregiver allocation.
* **Persistence Check:** Timestamp and call record logged in `FollowUp` / `AuditLog`.

---

## 5. Test Suite CR: CCR Incident Triage, Replacement & Refund (CCR SOP)

### Test Case CR-01: Priority Grievance Triage (Emergency vs Normal vs Abnormal)
* **Objective:** Verify complaint logging assigns correct SLA and escalates emergency cases immediately.
* **SOP Reference:** CCR SOP: Complaint classification (Emergency, Normal, Abnormal) and Zero-Complaints protocol.
* **Role:** `CCR_EXECUTIVE`, `SUPER_ADMIN`.
* **Test Steps:**
  1. Open Complaints desk (via CRMApp or SuperAdmin central reports).
  2. Click **Log Customer Complaint**.
  3. Select Client: `Active Patient Home #102`.
  4. Select Severity: `Emergency (Patient Safety / Staff Absence)`.
  5. Enter details: *"Caregiver left duty without relief."*.
  6. Submit ticket.
* **Expected Outcome:** Ticket flagged as `CRITICAL_EMERGENCY` with a 2-hour SLA countdown timer; notification dispatched to On-Duty HR Lead.
* **Persistence Check:** `Complaint` record created with `severity = 'EMERGENCY'` and `status = 'OPEN'`.

---

### Test Case CR-02: Rapid Staff Replacement Order & DCN Dispatch
* **Objective:** Verify that an emergency replacement order automatically fetches standby candidates from HR and generates a Delivery Confirmation Note (DCN).
* **SOP Reference:** CCR SOP: Urgent staff replacement and DCN dispatch.
* **Role:** `CCR_EXECUTIVE`, `HR_MANAGER`.
* **Test Steps:**
  1. Open the Emergency Complaint logged in CR-01.
  2. Click **Request Immediate Replacement**.
  3. System queries HR Standby Pool for matching category (`Female Attender`).
  4. Select available Standby Candidate.
  5. Click **Generate DCN (Delivery Confirmation Note)**.
* **Expected Outcome:** New Allocation created with tag `REPLACEMENT`; DCN generated with staff photograph, name, verification badge, and reporting time.
* **Persistence Check:** Previous Allocation closed with reason `REPLACED_DUE_TO_COMPLAINT`; new Allocation created in `PENDING_CONFIRMATION`.

---

### Test Case CR-03: Priority Refund Escalation to Finance
* **Objective:** Verify that an unresolved complaint where customer cancels service transitions cleanly into a Finance refund authorization queue.
* **SOP Reference:** CCR SOP: Priority Refund submission to Finance.
* **Role:** `CCR_EXECUTIVE`, `FINANCE_MANAGER`.
* **Test Steps:**
  1. In an open dispute ticket, select Resolution: `Service Cancelled by Client - Refund Requested`.
  2. Enter refund claim amount: `₹12,500` (unused staff advance).
  3. Attach dispute summary notes.
  4. Submit to Finance.
  5. Log in as `FINANCE_MANAGER` and navigate to `/finance?tab=refunds`.
* **Expected Outcome:** Ticket appears in Finance Refund Approval queue with CCR notes and pro-rata usage breakdown.
* **Step 6:** Click **Approve Refund & Disburse**.
* **Persistence Check:** Credit Note / Payment Disbursement record created in `Transaction` table; Complaint marked `RESOLVED_REFUNDED`.
* **Negative Test CR-03N:** User with role `CCR_EXECUTIVE` attempts to disburse refund funds directly. Action blocked: *"Disbursement requires Finance Manager authorization."*.

---

## 6. Test Execution Matrix Summary

| Test ID | Module / SOP | Test Focus | Role | Criticality |
|---|---|---|---|---|
| **HR-01** | HR SOP | 12 Staff Categories & Aadhaar Validation | HR Staff / Admin | High |
| **HR-02** | HR SOP | 5-Standby Backup Buffer Alarm | HR Manager / TLM | High |
| **HR-03** | HR SOP | 3-Day Adaptation Follow-Up Queue | HR Staff | Medium |
| **DE-01** | Data Entry | Phone & Aadhaar Deduplication Engine | Data Entry / Admin | Critical |
| **DE-02** | Data Entry | BPR Referral Partner Tagging | Data Entry / Sales | Medium |
| **SL-01** | Sales SOP | Standard Tariff & Office Service Charge Auto-Math | Sales / Admin | High |
| **SL-02** | Sales SOP | 10-Stage Pipeline & 3-Way Conference Gate | Sales / TLM | High |
| **CR-01** | CCR SOP | Priority Grievance Triage (Emergency SLA) | CCR Executive | Critical |
| **CR-02** | CCR SOP | Rapid Staff Replacement & DCN Generation | CCR / HR Lead | Critical |
| **CR-03** | CCR SOP | Priority Refund Handoff to Finance Desk | CCR / Finance Mgr | High |
