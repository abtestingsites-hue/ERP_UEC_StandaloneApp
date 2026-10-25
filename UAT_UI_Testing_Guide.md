# ERP UAT UI Testing Guide

This is a step-by-step User Acceptance Testing (UAT) guide to help you manually verify and test the newly built workflows directly from your UI at `http://localhost:5173`.

## 🩺 1. Testing the Medical & Doctor Workflow
This flow tests how doctors receive shift assignments, clock in, and log clinical consultations.

**Step A: Assign a Duty & Clock-in**
1. Navigate to **Module Command Center → Healthcare Command Center → Doctor Duty**.
2. Assuming you are logged in as a Super Admin or Medical Manager, you will see a list of assignments. If the list is empty, quickly create a new assignment linking a Doctor to a Duty Type (e.g., "Medical Round").
3. As a doctor, find your "Assigned" task and click the **Start (Play icon)** button. Notice the status shifts to `IN_PROGRESS`.
4. Click the **Complete (Checkmark icon)** button to clock out. 

**Step B: Log a Clinical Consultation**
1. Navigate to **Healthcare Command Center → Doctor Visits**.
2. Click the **"Log New Visit"** button to open the form.
3. Select a resident from the dropdown and assign a doctor.
4. Fill in the **Chief Complaint**, write detailed **Clinical Notes**, and add some **Medical Orders** (e.g., "Monitor BP every 4 hours").
5. Toggle the **Charge Consultation** checkbox on, and enter an amount (e.g., $150). 
6. Click **Save Visit**. Verify that it appears in the grid.

**Step C: View the Resident's Full History**
1. Navigate to **Healthcare Command Center → Clinical View**.
2. Search and select the resident you just created the visit for.
3. Verify that the consultation you just logged appears in their chronological timeline. Click **Full Record** to view the detailed pop-out modal containing your clinical notes and the $150 charge.

---

## 🤝 2. Testing the CRM (Business-to-Partner) Workflow
This flow tests how the facility manages leads coming from external hospitals or clinics.

1. Navigate to **Module Command Center → CRM & Enquiries → B2P Dashboard** (or go to `/crm/b2p`).
2. First, click **"Add Partner"** to register a new referring hospital (e.g., "City General Hospital") and provide a contact person.
3. Once the partner is created, click **"Log Referral"** on their card.
4. Enter the details of a prospective resident referred by them, setting the status to **"Contacted"** or **"Admitted"**.
5. Verify that the B2P Dashboard KPIs update to reflect the newly generated lead and the partner's conversion metrics.

---

## 📈 3. Testing the Marketing Campaign Workflow
This flow tests how your team tracks marketing spend versus leads generated.

1. Navigate to **Module Command Center → CRM & Enquiries → Marketing Dashboard** (or go to `/crm/marketing`).
2. Click **"New Campaign"** to create a marketing effort (e.g., "Summer Elder Care Promo"). Set a budget (e.g., $5,000) and define the start/end dates.
3. Expand the newly created campaign in the list and click **"Add Lead"**.
4. Enter dummy lead details (e.g., "John Doe - Interested in Premium Care").
5. Verify that the dashboard automatically recalculates the **Cost Per Lead (CPL)** based on your $5,000 budget and the number of leads you've added.

---

## 🏢 4. Testing the Visitor Reporting Workflow
This flow tests physical facility check-ins for family members and tours.

1. Navigate to **Module Command Center → Security & Audit → Visitor Reports** (or go to `/security/visitor-reports`).
2. Click **"Log Visitor"**.
3. Select **"Family Visit"** as the purpose, and link them to an existing Resident using the search dropdown. 
4. Fill in the visitor's name, phone number, and ID details, then click save.
5. In the main grid, find the visitor and click the **Check-Out** button to stamp their exit time. Verify that their status changes from "Checked In" to "Completed".

---

## 🔒 5. Testing Global Audit & Action History
Finally, verify that the ERP is tracking all the actions you just performed above.

1. Navigate to **Module Command Center → Security & Audit → Action History** (or go to `/security/action-history`).
2. Look at the timeline grid. You should see system-generated audit logs for:
   - `CREATE_DOCTOR_VISIT`
   - `CREATE_REFERRAL_PARTNER`
   - `CREATE_MARKETING_CAMPAIGN`
   - `VISITOR_CHECK_IN`
3. Click on the **Metadata / Details** button next to any of these logs to prove that the system cryptographically captured the exact JSON payload of the actions you performed.
