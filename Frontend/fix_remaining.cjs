const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(filePath, content);
}

// 1. Discharge.tsx
replaceInFile('src/features/healthcare/pages/Discharge.tsx', [
    ['import React, {', 'import {'],
    ['import React from \'react\';', ''],
    ['AlertCircle, ', ''],
    ['description="Discharge patients and generate summaries."', 'subtitle="Discharge patients and generate summaries."'],
    ['<DataTable columns={columns} data={discharges} isLoading={isLoading} />', '<DataTable columns={columns} data={discharges} isLoading={isLoading} keyExtractor={(row: any) => row.id} />']
]);

// 2. PatientRegistration.tsx
replaceInFile('src/features/healthcare/pages/PatientRegistration.tsx', [
    ['Save, ', ''],
    ['import { Toast } from \'../../../components/Toast\'', 'import { useToast } from \'../../../components/Toast\''],
    ['description="Register a new patient into the system."', 'subtitle="Register a new patient into the system."']
]);

// 3. CandidatePipeline.tsx
replaceInFile('src/features/hr/pages/CandidatePipeline.tsx', [
    ['UserCheck, ', ''],
    ['const loading = false;', ''],
    ['for (let i = 0; i < 5; i++)', 'for (let _i = 0; _i < 5; _i++)']
]);

// 4. LeaveManagement.tsx
replaceInFile('src/features/hr/pages/LeaveManagement.tsx', [
    ['XCircle, ', ''],
    ['const comments = \'\';', '']
]);

// 5. StaffMenuPrivilege.tsx
replaceInFile('src/features/hr/pages/StaffMenuPrivilege.tsx', [
    ['useQuery, ', '']
]);

// 6. StockIssue.tsx
replaceInFile('src/features/inventory/pages/StockIssue.tsx', [
    ['const comments = \'\';', '']
]);

// 7. MarketingDashboard.tsx
replaceInFile('src/features/marketing/pages/MarketingDashboard.tsx', [
    ['icon={Megaphone}', '']
]);

// 8. useNursingCare.ts
replaceInFile('src/features/nursing_care/hooks/useNursingCare.ts', [
    ['addToast(', 'toast('],
    [', variables)', ')'],
    [', variables) =>', ') =>']
]);

// 9. MedicationSchedule.tsx & Vitals.tsx (reverting key to cell)
replaceInFile('src/features/nursing_care/pages/MedicationSchedule.tsx', [
    ['key: (row', 'cell: (row'],
    ['actions={', 'action={'],
    ['icon={CalendarClock}', ''],
    ['loadingAdmissions', '']
]);
replaceInFile('src/features/nursing_care/pages/Vitals.tsx', [
    ['key: (row', 'cell: (row'],
    ['actions={', 'action={'],
    ['Activity, ', ''],
    ['icon={Activity}', '']
]);

// 10. PatientManualBilling.tsx
replaceInFile('src/features/patient_billing/pages/PatientManualBilling.tsx', [
    ['image: { type: \'jpeg\', quality: 0.98 }', 'image: { type: \'jpeg\' as const, quality: 0.98 }']
]);

// 11. PatientDashboard.tsx & PatientPortalLayout.tsx
replaceInFile('src/features/patient_portal/pages/PatientDashboard.tsx', [
    ['AlertCircle, ', '']
]);
replaceInFile('src/features/patient_portal/pages/PatientPortalLayout.tsx', [
    ['User, ', '']
]);

// 12. useFundingProjects.ts
replaceInFile('src/hooks/useFundingProjects.ts', [
    [', variables)', ')'],
    [', variables) =>', ') =>']
]);

// 13. OrganizationDashboard.tsx
replaceInFile('src/pages/OrganizationDashboard.tsx', [
    ['ProjectManagement ? <ProjectManagement /> :', ''],
    ['import { ProjectTable } from \'../features/uncf_donations/components/ProjectTable\';', '']
]);

console.log('Fix script applied.');
