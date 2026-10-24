# Client SOP Clarification Register & Unresolved Business Rules

**Phase:** SOP-01 — Client SOP Mapping & ERP Gap Analysis  
**Date:** October 15, 2026  
**Document Status:** Pending Client Clarification  
**Scope:** Policy Ambiguities, Authority Thresholds, and Workflow Rules Identified from Client SOP Documents

---

## Executive Summary

During the systematic gap analysis of the four client-provided SOP documents:
1. `HR SOP AND REPORT SHEET.docx`
2. `DATA ENTRY SOP 2026.docx`
3. `SALES TEAM FINAL sop.docx`
4. `CCR SOP.docx`

against the existing ERP database schema and SuperAdminApp frontend interfaces, six fundamental operational questions emerged. These require explicit client confirmation before proceeding to technical implementation or database schema adjustments.

---

## Clarification Register

### 1. Staffing Target & Standby Buffer Baselines (HR & Data Entry SOP)

* **SOP Observation:**
  - The HR SOP specifies: *"Staff categories Target 35"* and *"5 standby staff back for TLM"*.
  - The Data Entry SOP specifies an alarm condition for *"Wanted Staff List"*.
* **Ambiguity:**
  - Is the "Target 35" an organization-wide active verified pool target across all 12 staff categories combined, or is there a target of 35 verified staff *per individual category*?
  - Does the "5 standby backup staff" rule apply to *every* one of the 12 categories (requiring 12 × 5 = 60 standby staff), or only to high-turnover categories (e.g., Patient Care, Baby Care, Nursing)?
* **Impact on ERP Implementation:**
  - Determines dashboard KPI calculations, threshold warning colors (Green/Amber/Red), and automated notifications for HR recruitment deficits.
* **Client Decision Options:**
  - **Option A:** Target of 35 verified active standby staff across the entire agency, with at least 2–5 standby candidates in the top 3 high-demand categories.
  - **Option B:** Strict target of 35 active deployed staff per category, with an automated alert whenever any category's ready pool falls below 5.

---

### 2. Standard Tariff Card & Commercial Override Rules (Sales SOP)

* **SOP Observation:**
  - The Sales SOP outlines rigid rates:
    - *Patient Care:* ₹25,000/mo (without cooking) / ₹28,000/mo (with cooking)
    - *Nursing Care:* ₹35,000 – ₹40,000/mo
    - *Baby Care:* ₹25,000 (sitter) / ₹35,000 (premature/special care)
    - *Doctor / Physiotherapist Visit:* Minimum ₹300/day
    - *Office Service Charges:* 1 month = ₹7,500; 3 months = ₹15,000; 6 months = ₹18,000; 8 months = 1 month staff salary equivalent.
* **Ambiguity:**
  - Are these rates mandatory fixed platform minimums that cannot be lowered by sales telecallers?
  - If a customer negotiates a discount or custom package, who has the system authority to approve the override?
* **Impact on ERP Implementation:**
  - Determines whether quotation fields in the `HomeCareWorkspace` should auto-calculate based on dropdown selection with locked inputs, or whether custom pricing inputs can be submitted pending an approval workflow.
* **Client Decision Options:**
  - **Option A (Strict):** Standard tariffs are locked in the UI. Any deviation triggers an "Approval Required" state that locks invoice generation until a Branch Manager or Director clicks "Approve".
  - **Option B (Flexible):** Sales agents can manually input rates, but any rate below standard baseline is flagged in the sales audit report.

---

### 3. Management Approval Hierarchy (Sales & Clinical Intake)

* **SOP Observation:**
  - The Sales SOP outlines a multi-tiered approval chain:
    1. *Business Close*
    2. *TLM / Manager Approval*
    3. *MD & PCRT (Patient Care Review Team) Approval*
    4. *Staff Matching & 3-Way Conference*
    5. *Branch Manager Payment Collection*
* **Ambiguity:**
  - Is MD & PCRT review mandatory for *all* sales deals, or only for critical/ventilator/ICU home-care admissions?
  - Does the ERP need formal cryptographic/system approval buttons for each of these four distinct roles before a caregiver can be physically allocated?
* **Impact on ERP Implementation:**
  - Dictates whether `Allocation` records can be created immediately by a Care Coordinator, or if an approval gate engine (`PENDING_TLM` -> `PENDING_CLINICAL` -> `APPROVED`) must precede allocation.
* **Client Decision Options:**
  - **Option A (Conditional Gateway):** Routine elderly and baby-care cases require only TLM commercial approval. High-risk nursing/ICU cases require secondary PCRT clearance.
  - **Option B (Full Sequential Pipeline):** Every contract must pass through TLM -> PCRT -> BM before allocation status unlocks.

---

### 4. Ownership of 3-Day Post-Placement Follow-Up Calls (HR vs Sales vs CCR)

* **SOP Observation:**
  - All three operational SOPs mention a 3-day follow-up:
    - *HR SOP:* 3-day follow-up with staff to evaluate adaptation, welfare, and attendance.
    - *Sales SOP:* 3-day post-delivery check with client to ensure satisfaction and service stability.
    - *CCR SOP:* 3-day follow-up post-complaint resolution and replacement deployment.
* **Ambiguity:**
  - Are the HR staff check call and the Sales/CCR customer check call conducted independently by separate departments, or combined into a unified client-staff care follow-up record?
  - Where in the ERP should these follow-up logs reside?
* **Impact on ERP Implementation:**
  - Determines whether `FollowUp` entities in the database are split into `StaffFollowUp` (in HR module) and `ClientFollowUp` (in HomeCare/CCR module), or linked to the central `Allocation` record.
* **Client Decision Options:**
  - **Option A (Separated):** HR conducts and logs staff-side welfare calls in the HR workspace. CCR/Sales conducts and logs customer-side satisfaction calls in the HomeCare/CCR workspace.
  - **Option B (Unified Allocation Card):** A unified "72-Hour Onboarding & Welfare" tab on each active Allocation record showing both staff and client feedback side-by-side.

---

### 5. CCR Priority Refund Authority & Calculation Formulas (CCR & Finance SOP)

* **SOP Observation:**
  - The CCR SOP specifies: *"Dispute / Non-resolution -> Priority Refund File Submitted to Finance"*.
* **Ambiguity:**
  - What is the exact formula for refund deductions? (e.g., Does the client forfeit the Office Service Charge entirely? Are staff duty days billed pro-rata at daily rates?).
  - What refund limit (if any) can a Customer Care Lead disburse without Finance Director sign-off?
* **Impact on ERP Implementation:**
  - Dictates the refund request form fields, validation logic, and whether a refund automatically creates a credit note in the `Finance` module.
* **Client Decision Options:**
  - **Option A:** Office Service Charge is 100% non-refundable after 48 hours of service; staff daily wage is deducted pro-rata; balance refunded via Finance Manager approval.
  - **Option B:** Custom refund amounts entered manually by CCR with attached dispute explanation, routed directly to Finance approval queue.

---

### 6. Architectural Boundary of CRM / CCR Module (SuperAdminApp vs CRMApp)

* **SOP Observation:**
  - The client has a dedicated `CCR SOP` and `DATA ENTRY SOP` with heavy CRM touchpoints.
  - The codebase currently features a standalone `CRMApp` (`C:\Users\Victus\Desktop\ERP BACKUP\CRMApp`) containing `Complaints.tsx`, `CustomerCareDashboard.tsx`, and `EnquiryFollowUp.tsx`.
  - `SuperAdminApp` currently has 9 business domains (`inventory`, `admission`, `inhouse-care`, `home-care`, `visitor-security`, `donors-volunteers`, `finance`, `hr-operations`, `ambulance`) plus `central-reports`.
* **Ambiguity:**
  - Should CCR / Customer Care remain a standalone portal (`CRMApp`), or should a dedicated 10th domain tab (`Customer Care & Complaints`) be introduced inside `SuperAdminApp` for unified administrative oversight?
* **Impact on ERP Implementation:**
  - Core governance and navigation boundary decision.
* **Client Decision Options:**
  - **Option A:** Keep `CRMApp` as the primary operational portal for CCR telecallers, and expose an executive complaint overview widget inside SuperAdminApp's `CentralReportsWorkspace`.
  - **Option B:** Migrate/integrate a full `Customer Care & Relations` workspace into `SuperAdminApp` as a first-class domain.

---

## Proposed Next Steps
Upon client feedback on these six key items, the technical design specifications and permission matrices will be updated accordingly prior to coding.
