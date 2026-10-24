import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useOthersAllocations, useUpdateAllocation } from '../hooks/useAllocation'
import { AssignStaffModal } from '../components/AssignStaffModal'

export function OthersAllocation() {
    const [searchParams] = useSearchParams()
    const routeUnitId = searchParams.get('unitId')
    const { data = [], isLoading } = useOthersAllocations(routeUnitId)
    const updateAllocation = useUpdateAllocation()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null)
    const filteredData = data.filter((item: any) =>
        [
            item.ref,
            item.allocationRef,
            item.enquiryRef,
            item.service,
            item.clientName,
            item.mobile,
            item.staffName,
            item.status
        ].some((value) => String(value || '').toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span> },
        { key: 'clientRef', header: 'Client Ref. No.', cell: (row) => <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{row.ref || '-'}</span> },
        { key: 'serviceLookingFor', header: 'Service Looking for', cell: (row) => <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{row.service || '-'}</span> },
        { key: 'clientDetails', header: 'Client Details', cell: (row) => <span className="text-sm font-medium dark:text-gray-300">{row.clientName || '-'}</span> },
        { key: 'status', header: 'Status', cell: (row) => <StatusHighlighter value={row.status} /> },
        {
            key: 'staffName',
            header: 'Assigned Staff',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{row.staffName || 'Not Assigned'}</p>
                    <p className="mt-1 text-xs text-gray-500">{row.scheduleText || '-'}</p>
                </div>
            )
        },
        {
            key: 'followUpHistory',
            header: 'Actions',
            cell: (row) => (
                <button
                    onClick={() => setSelectedAllocation(row)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded shadow-sm transition-all active:scale-95"
                >
                    {row.status === 'Allocated' ? 'Reassign Staff' : 'Assign Staff'}
                </button>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black">
            <PageHeader
                title="Client Followup - Staff Allocation"
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'Staff Allocation' }
                ]}
            />

            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-white/10 mt-4 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <p className="text-sm font-medium text-gray-600 mb-4 ml-1">Staff Allocation List</p>
                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search..."
                    />
                </div>

                <div className="p-4">
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        isLoading={isLoading}
                        keyExtractor={(item: any) => item.id}
                        emptyStateMessage="No data available in table"
                    />
                </div>
            </div>
            <AssignStaffModal
                isOpen={Boolean(selectedAllocation)}
                allocation={selectedAllocation}
                isSaving={updateAllocation.isPending}
                onClose={() => setSelectedAllocation(null)}
                onAssign={(payload) => {
                    if (!selectedAllocation) return
                    updateAllocation.mutate({
                        id: selectedAllocation.id,
                        staffId: payload.staffId,
                        status: 'ALLOCATED',
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                        metadata: { notes: payload.notes || null }
                    }, {
                        onSuccess: () => setSelectedAllocation(null)
                    })
                }}
            />
        </div>
    )
}
