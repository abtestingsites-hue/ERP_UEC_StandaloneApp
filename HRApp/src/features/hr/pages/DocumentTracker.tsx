import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useDocumentTracker, useVerifyStaffDocument } from '../hooks/useHR'

export function DocumentTracker() {
    const { data: documents = [], isLoading } = useDocumentTracker()
    const verifyDoc = useVerifyStaffDocument()
    const [searchQuery, setSearchQuery] = useState('')

    const filteredData = useMemo(() => {
        return documents.filter((row: any) =>
            row.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.empId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [documents, searchQuery])

    const columns: Column<any>[] = [
        { key: 'empId', header: 'Emp ID', sortable: true },
        { key: 'name', header: 'Staff Name', sortable: true },
        { key: 'documentType', header: 'Document Type', sortable: true, cell: (row) => row.documentType === 'aadhaarDocument' ? 'Aadhaar' : row.documentType === 'resumeDocument' ? 'Resume' : row.documentType },
        { 
            key: 'fileName', 
            header: 'File',
            cell: (row) => row.fileUrl ? (
                <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    {row.fileName || 'View Document'}
                </a>
            ) : '-'
        },
        { key: 'uploadedAt', header: 'Uploaded At', cell: (row) => row.uploadedAt ? new Date(row.uploadedAt).toLocaleDateString() : '-' },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status || 'UPLOADED'} /> },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.fileUrl && (
                        <a 
                            href={row.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors inline-block text-center"
                        >
                            View
                        </a>
                    )}
                    {row.status === 'PENDING_VERIFICATION' && (
                        <button
                            type="button"
                            onClick={() => verifyDoc.mutate({ staffId: row.staffId, documentId: row.id, status: 'VERIFIED' })}
                            disabled={verifyDoc.isPending}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {verifyDoc.isPending ? 'Verifying...' : 'Verify'}
                        </button>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Document Tracker"
                subtitle="Monitor staff documents, view uploads, and track verification status."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Document Tracker' }]}
            />
            <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search documents..." />
            <DataTable
                data={filteredData}
                columns={columns}
                keyExtractor={(row) => row.id}
                emptyStateMessage="No document records found"
                isLoading={isLoading}
            />
        </div>
    )
}
