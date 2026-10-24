const fs = require('fs');
const file = 'src/features/hr/hooks/useHR.ts';
let content = fs.readFileSync(file, 'utf-8');

// Find all exports
const regex = /export const (\w+) = [\s\S]*?(?=(?:export const \w+ = )|$)/g;

let header = content.substring(0, content.indexOf('export const'));
let match;
let hooks = new Map();

while ((match = regex.exec(content)) !== null) {
    if (!hooks.has(match[1])) {
        hooks.set(match[1], match[0]);
    }
}

// Ensure the DeleteJobApplication is correct since it got corrupted earlier
const deleteJob = `export const useDeleteJobApplication = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: hrService.deleteJobApplication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-applications'] })
            toast({ type: 'success', title: 'Deleted', message: 'Job application deleted' })
        },
        onError: () => toast({ type: 'error', title: 'Error', message: 'Failed to delete application' })
    })
}
`;

hooks.set('useDeleteJobApplication', deleteJob);

// Let's add useUploadStaffDocument and useVerifyStaffDocument if they are not correctly formatted or missing
hooks.set('useUploadStaffDocument', `export const useUploadStaffDocument = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ staffId, documentType, file }: { staffId: string, documentType: string, file: File }) =>
            hrService.uploadStaffDocument(staffId, documentType, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] })
            queryClient.invalidateQueries({ queryKey: ['document-tracker'] })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to upload document') })
        }
    })
}
`);

hooks.set('useVerifyStaffDocument', `export const useVerifyStaffDocument = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ staffId, documentId, status }: { staffId: string, documentId: string, status: 'VERIFIED' }) =>
            hrService.verifyStaffDocument(staffId, documentId, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] })
            queryClient.invalidateQueries({ queryKey: ['document-tracker'] })
            toast({ type: 'success', title: 'Success', message: 'Document verified successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Error', message: resolveApiErrorMessage(error, 'Failed to verify document') })
        }
    })
}
`);

let finalContent = header;
for (let [key, value] of hooks) {
    finalContent += value + '\n';
}

fs.writeFileSync(file, finalContent, 'utf-8');
console.log("Successfully deduplicated useHR.ts");
