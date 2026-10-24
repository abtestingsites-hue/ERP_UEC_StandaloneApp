const fs = require('fs');
const file = 'src/features/hr/hooks/useHR.ts';
let content = fs.readFileSync(file, 'utf-8');

const anchor = "export const useDeleteJobApplication = () => {";
const processPayrollIdx = content.indexOf("export const useProcessPayroll = () => {");

if (processPayrollIdx > -1) {
    const beforeAnchor = content.substring(0, content.indexOf(anchor));
    const newContent = beforeAnchor + `export const useDeleteJobApplication = () => {
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

export const useStaffDocuments = (staffId: string) => {
    return useQuery({
        queryKey: ['staff-documents', staffId],
        queryFn: () => hrService.getStaffDocuments(staffId),
        enabled: !!staffId
    })
}

export const useDocumentTracker = () => {
    return useQuery({
        queryKey: ['document-tracker'],
        queryFn: hrService.getAllDocuments
    })
}

export const useUploadStaffDocument = () => {
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

export const useVerifyStaffDocument = () => {
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

export const usePayrollPreview = (options?: { month?: string; scope?: 'all' }) => {
    const activeUnitId = useAuthStore((state) => state.activeUnitId || state.user?.unitId || 'no-unit')

    return useQuery({
        queryKey: ['payroll-preview', options?.scope === 'all' ? 'all' : activeUnitId, options?.month || 'current'],
        queryFn: () => hrService.getPayrollPreview(options),
        retry: false
    })
}

` + content.substring(processPayrollIdx);

    fs.writeFileSync(file, newContent, 'utf-8');
    console.log("Fixed useHR.ts");
} else {
    console.log("processPayrollIdx not found");
}
