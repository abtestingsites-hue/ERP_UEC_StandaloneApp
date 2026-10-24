import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { DataTable, type Column } from '../../../components/DataTable'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useInHouseAllocations, useUpdateAllocation } from '../hooks/useAllocation'
import { AssignStaffModal } from '../components/AssignStaffModal'

export function InHouseCare() {
    const [searchParams] = useSearchParams()
    const routeUnitId = searchParams.get('unitId')
    const { data = [], isLoading } = useInHouseAllocations(routeUnitId)
    const updateAllocation = useUpdateAllocation()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [unitFilter, setUnitFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null)

    const filteredData = data.filter((item: any) => {
        const matchSearch = [
            item.ref,
            item.allocationRef,
            item.enquiryRef,
            item.service,
            item.clientName,
            item.mobile,
            item.patient,
            item.status
        ].some((value) => String(value || '').toLowerCase().includes(searchQuery.toLowerCase()))
        const matchStatus = statusFilter ? item.status === statusFilter : true
        return matchSearch && matchStatus
    })

    const metrics = {
        occupied: data.filter((item: any) => item.status === 'Allocated').length,
        nonAllocated: data.filter((item: any) => item.status === 'Pending').length
    }

    const columns: Column<any>[] = [
        { key: 'sno', header: 'S.No', cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span> },
        { key: 'serviceDetails', header: 'Service Details', cell: (row) => <span className="text-sm dark:text-gray-300">{row.service || '-'}</span> },
        { key: 'clientDetails', header: 'Client Details', cell: (row) => <span className="text-sm font-medium dark:text-gray-200">{row.clientName || '-'}</span> },
        { key: 'guardianDetails', header: 'Guardian Details', cell: (row) => <span className="text-sm dark:text-gray-400">{row.guardian || '-'}</span> },
        { key: 'allocatedStatus', header: 'Allocated Status', cell: (row) => <StatusHighlighter value={row.status} /> },
        {
            key: 'allocatedStaff',
            header: 'Assigned Staff',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{row.staffName || 'Not Assigned'}</p>
                    <p className="mt-1 text-xs text-gray-500">{row.scheduleText || '-'}</p>
                </div>
            )
        },
        { key: 'paymentDetails', header: 'Payment Details', cell: (row) => <span className="text-sm dark:text-gray-400">{row.payment || '-'}</span> },
        {
            key: 'applicationForm',
            header: 'Actions',
            cell: (row) => (
                <button
                    onClick={() => setSelectedAllocation(row)}
                    className="px-3 py-1.5 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 text-xs font-semibold rounded shadow-sm transition-all active:scale-95"
                >
                    {row.status === 'Allocated' ? 'Reassign Staff' : 'Assign Staff'}
                </button>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black">
            <PageHeader
                title="Service Desk - In-House Care"
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'In-House Care' }
                ]}
            />

            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-white/10 mt-4 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 border-b border-gray-200 dark:border-white/10 py-6">
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-blue-600 dark:text-blue-400">Total Room Occupied - {metrics.occupied.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-red-500 dark:text-red-400">Room Not Allocated - {metrics.nonAllocated.toString().padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <p className="text-sm font-medium text-gray-600 mb-4 ml-1">In-House Care List</p>
                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search..."
                        filters={[
                            {
                                name: 'unitFilter',
                                options: [
                                    { value: '', label: 'UEC - Coimbatore' }
                                ],
                                value: unitFilter,
                                onChange: (e) => setUnitFilter(e.target.value)
                            },
                            {
                                name: 'statusFilter',
                                options: [
                                    { value: '', label: 'All Status' },
                                    { value: 'Pending', label: 'Pending' },
                                    { value: 'Allocated', label: 'Allocated' },
                                    { value: 'On Hold', label: 'On Hold' },
                                    { value: 'Completed', label: 'Completed' }
                                ],
                                value: statusFilter,
                                onChange: (e) => setStatusFilter(e.target.value)
                            }
                        ]}
                    />
                </div>

                <div className="p-4">
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        keyExtractor={(item: any) => item.id}
                        emptyStateMessage="No data available in table"
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
