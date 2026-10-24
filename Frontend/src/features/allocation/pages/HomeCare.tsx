import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useHomeCareAllocations, useUpdateAllocation } from '../hooks/useAllocation'
import { AssignStaffModal } from '../components/AssignStaffModal'

// Local mock data since we are focusing on UI templating for now
export function HomeCare() {
    const [searchParams] = useSearchParams()
    const routeUnitId = searchParams.get('unitId')
    const { data: allocations, isLoading } = useHomeCareAllocations(routeUnitId)
    const updateAllocation = useUpdateAllocation()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null)

    const filteredData = (allocations || []).filter((item: any) => {
        const query = searchQuery.toLowerCase()
        return [
            item.ref,
            item.allocationRef,
            item.enquiryRef,
            item.service,
            item.clientName,
            item.mobile,
            item.patient,
            item.staffName,
            item.status
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span> },
        { key: 'serviceDetails', header: 'Service Details', cell: (row) => <span className="text-sm dark:text-gray-300">{row.service || '-'}</span> },
        { key: 'clientDetails', header: 'Client Details', cell: (row) => <span className="text-sm font-medium dark:text-gray-200">{row.clientName || '-'}</span> },
        { key: 'allocatedStatus', header: 'Allocated Status', cell: (row) => <StatusHighlighter value={row.status} /> },
        { key: 'contractDetails', header: 'Contract Details', cell: (row) => <span className="text-sm">{row.contract || '-'}</span> },
        {
            key: 'allocatedStaff',
            header: 'Allocated Staff',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{row.staffName || 'Not Assigned'}</p>
                    <p className="mt-1 text-xs text-gray-500">{row.scheduleText || '-'}</p>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedAllocation(row)}
                        className="px-3 py-1.5 bg-[#0F969C] hover:bg-[#294D61] text-white text-xs font-bold rounded shadow-sm transition-all active:scale-95"
                    >
                        {row.status === 'Allocated' ? 'Reassign' : 'Allocate'}
                    </button>
                    <button className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded shadow-sm transition-all active:scale-95">
                        View History
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black">
            <PageHeader
                title="Service Desk - Home Care (Staff Allocation)"
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'Home Care (Staff Allocation)' }
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
                        keyExtractor={(item: any) => item.id}
                        emptyStateMessage="No allocations found"
                        isLoading={isLoading}
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
