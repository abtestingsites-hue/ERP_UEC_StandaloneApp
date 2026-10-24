const fs = require('fs');

let content = fs.readFileSync('src/features/hr/pages/StaffManagement.tsx', 'utf8');

// Import hooks
content = content.replace(
    "import { useAddStaff, useDeleteStaff, useRoles, useStaff, useUpdateStaff } from '../hooks/useHR'",
    "import { useAddStaff, useDeleteStaff, useRoles, useStaff, useUpdateStaff, useUploadStaffDocument, useDocumentTracker } from '../hooks/useHR'"
);

// Add hooks inside component
const hooksMatch = `    const deleteStaff = useDeleteStaff()`;
const hooksReplace = `    const deleteStaff = useDeleteStaff()
    const uploadStaffDocument = useUploadStaffDocument()
    const { data: allDocs = [] } = useDocumentTracker()`;
content = content.replace(hooksMatch, hooksReplace);

// Update getStaffDocument to use allDocs if available, otherwise fallback to metadata (legacy)
const getStaffDocumentMatch = `const getStaffDocument = (staff: Staff, key: 'aadhaarDocument' | 'resumeDocument') => {
    const metadata = getStaffMetadata(staff)
    return metadata.documents?.[key]
}`;
const getStaffDocumentReplace = `const getStaffDocument = (staff: Staff, key: 'aadhaarDocument' | 'resumeDocument', allDocs: any[] = []) => {
    const relationalDoc = allDocs.find(d => d.empId === staff.empId && d.documentType === key)
    if (relationalDoc) {
        return {
            fileName: relationalDoc.fileName,
            fileUrl: relationalDoc.fileUrl,
            status: relationalDoc.status
        }
    }
    const metadata = getStaffMetadata(staff)
    return metadata.documents?.[key]
}`;
content = content.replace(getStaffDocumentMatch, getStaffDocumentReplace);

// Update all getStaffDocument calls to pass allDocs
content = content.replaceAll("!getStaffDocument(staff, 'aadhaarDocument') || !getStaffDocument(staff, 'resumeDocument')", "!getStaffDocument(staff, 'aadhaarDocument', allDocs) || !getStaffDocument(staff, 'resumeDocument', allDocs)");
content = content.replaceAll("getStaffDocument(selectedStaff, 'aadhaarDocument')", "getStaffDocument(selectedStaff, 'aadhaarDocument', allDocs)");
content = content.replaceAll("getStaffDocument(selectedStaff, 'resumeDocument')", "getStaffDocument(selectedStaff, 'resumeDocument', allDocs)");

// Handle upload chain inside onSubmit
const onSubmitMatch = `        if (editingStaffId) {
            updateStaff.mutate({ staffId: editingStaffId, data: payload }, {
                onSuccess: () => setIsDrawerOpen(false),
                onError: applyServerErrors
            })
        } else {
            addStaff.mutate(payload, {
                onSuccess: (createdStaff) => {
                    if (createdStaff.unitId) {
                        setActiveUnitId(createdStaff.unitId)
                    }
                    setIsDrawerOpen(false)
                },
                onError: applyServerErrors
            })
        }`;

const onSubmitReplace = `        if (editingStaffId) {
            updateStaff.mutate({ staffId: editingStaffId, data: payload }, {
                onSuccess: () => {
                    const aadhaarDoc = getValues('aadhaarDocument');
                    if (aadhaarDoc instanceof File) {
                        uploadStaffDocument.mutate({ staffId: editingStaffId, documentType: 'aadhaarDocument', file: aadhaarDoc });
                    }
                    const resumeDoc = getValues('resumeDocument');
                    if (resumeDoc instanceof File) {
                        uploadStaffDocument.mutate({ staffId: editingStaffId, documentType: 'resumeDocument', file: resumeDoc });
                    }
                    setIsDrawerOpen(false);
                },
                onError: applyServerErrors
            })
        } else {
            addStaff.mutate(payload, {
                onSuccess: (createdStaff) => {
                    if (createdStaff.id) {
                        const aadhaarDoc = getValues('aadhaarDocument');
                        if (aadhaarDoc instanceof File) {
                            uploadStaffDocument.mutate({ staffId: createdStaff.id, documentType: 'aadhaarDocument', file: aadhaarDoc });
                        }
                        const resumeDoc = getValues('resumeDocument');
                        if (resumeDoc instanceof File) {
                            uploadStaffDocument.mutate({ staffId: createdStaff.id, documentType: 'resumeDocument', file: resumeDoc });
                        }
                    }
                    if (createdStaff.unitId) {
                        setActiveUnitId(createdStaff.unitId)
                    }
                    setIsDrawerOpen(false)
                },
                onError: applyServerErrors
            })
        }`;
content = content.replace(onSubmitMatch, onSubmitReplace);

fs.writeFileSync('src/features/hr/pages/StaffManagement.tsx', content);
console.log('Frontend replacements complete');
