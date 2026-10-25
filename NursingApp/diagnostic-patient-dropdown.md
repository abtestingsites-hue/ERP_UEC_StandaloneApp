# Phase 10C - Empty Patient Dropdown Diagnostic

## Root Cause Confirmed

The Nursing Manager's `Assign Medical Duty` drawer shows "No patient linked" because the hook it relies on (`useMedicalPatients`) fetches from the `GET /api/v1/patient` endpoint, which returns **0 records** for the Nursing Manager.

### Why does `/patient` return 0 records?
1. The **ERP Medical Monitor** (the source of truth for assignment creation) uses `GET /api/v1/patient` to populate its patient dropdown. 
2. However, the ERP Medical Monitor is primarily used by Doctors and Receptionists who are logged into the **Registration Unit**. 
3. The `Patient` master table assigns the patient's `unitId` to the Registration Unit when they are onboarded. 
4. The Nursing Manager is logged into the **Nursing Care Unit**. When the manager calls `GET /api/v1/patient`, the backend filters by the manager's `unitId` and finds exactly 0 master records.

### The Correct Patient Source
Patients are linked to the Nursing Care Unit via the **`Admission`** entity, not the Patient master entity. 
This is why in Phase 2, the standalone NursingApp used `GET /api/v1/enquiry/admissions?status=ACTIVE` to establish the nursing roster.

To fix the empty patient dropdown without breaking the assignment workflow, we must update the `useMedicalPatients` hook in the Nursing Manager workspace to fetch from the admissions endpoint and map the returned `Admission` objects into `Patient` objects for the UI dropdown.
