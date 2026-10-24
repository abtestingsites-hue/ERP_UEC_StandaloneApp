import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { useApprovalTasks } from '../hooks/useTasks'
import { useUpdateTaskStatus } from '../hooks/useTasks'
import { useStaff } from '../../../hooks/useHRData'
import { Drawer } from '../../../components/Drawer'

export function ScheduleTaskApproval() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const focusTaskId = searchParams.get('taskId')
    const routeUnitId = searchParams.get('unitId')
    const routeSearch = searchParams.get('search')
    const { data: allTasks = [], isLoading: isLoadingTasks } = useApprovalTasks(routeUnitId)
    const { data: staffList = [], isLoading: isLoadingStaff } = useStaff()
    const updateTaskStatus = useUpdateTaskStatus()
    const taskStaffList = staffList

    const [searchQuery, setSearchQuery] = useState(routeSearch || '')
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

    const closeTaskDrawer = () => {
        setSelectedTaskId(null)
        if (focusTaskId || routeUnitId || routeSearch) {
            const params = new URLSearchParams()
            if (routeUnitId) params.set('unitId', routeUnitId)
            if (routeSearch) params.set('search', routeSearch)
            navigate(`/task-log/schedule-approval${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
        }
    }

    const getCompletedStatusLabel = (status: string) => {
        if (status === 'APPROVED' || status === 'COMPLETED') return 'Completed'
        if (status === 'IN_PROGRESS') return 'In Progress'
        return 'Pending'
    }

    const getApprovalStatusLabel = (status: string) => {
        if (status === 'APPROVED') return 'Approved'
        if (status === 'COMPLETED') return 'Approval Pending'
        if (status === 'REJECTED') return 'Rejected'
        if (status === 'IN_PROGRESS') return 'In Progress'
        return 'Assigned'
    }

    // Filter to only scheduled tasks
    const scheduledTasks = useMemo(() => allTasks.filter(t => (t as any).type === 'SCHEDULED'), [allTasks])

    const approvalPendingCount = scheduledTasks.filter(t => t.status === 'COMPLETED').length
    const approvedCount = scheduledTasks.filter(t => t.status === 'APPROVED').length
    const rejectedCount = scheduledTasks.filter(t => t.status === 'REJECTED').length

    const tableData = useMemo(() => {
        return scheduledTasks.map(task => {
            const staff = taskStaffList.find(s =>
                s.id === task.assignedStaffId ||
                s.user?.id === task.assigneeId
            )
            return {
                ...task,
                staffName: staff?.name || task.assignedTo,
                staffId: staff?.empId || task.assignedTo,
                dateStr: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date',
            }
        })
    }, [scheduledTasks, taskStaffList])

    const selectedTask = useMemo(
        () => tableData.find((task) => task.id === selectedTaskId) || null,
        [tableData, selectedTaskId]
    )

    useEffect(() => {
        if (!focusTaskId || selectedTaskId || tableData.length === 0) return
        const matchedTask = tableData.find((task) => task.id === focusTaskId)
        if (matchedTask) {
            setSelectedTaskId(matchedTask.id)
            setSearchQuery(matchedTask.staffName || matchedTask.title || '')
        }
    }, [focusTaskId, selectedTaskId, tableData])

    const filteredTasks = tableData.filter(t =>
        t.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.refNo?.toLowerCase() === searchQuery.toLowerCase() ||
        t.id === focusTaskId
    )

    const columns: Column<any>[] = [
        {
            key: 'sno',
            header: 'S.No',
            cell: (_, index) => <span className="text-gray-500 font-medium text-sm">{index + 1}</span>
        },
        {
            key: 'staffDetails',
            header: 'Staff Details',
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">{row.staffName}</span>
                    <span className="text-xs text-primary-600">ID: {row.staffId}</span>
                </div>
            )
        },
        {
            key: 'taskDetails',
            header: 'Task Details',
            cell: (row) => <span className="text-sm font-medium text-gray-800">{row.title}</span>
        },
        {
            key: 'taskDueDate',
            header: 'Task Due Date',
            cell: (row) => <span className="text-sm text-gray-600">{row.dateStr}</span>
        },
        {
            key: 'taskCompletedStatus',
            header: 'Task Completed Status',
            cell: (row) => (
                <span className={`text-sm font-bold ${
                    getCompletedStatusLabel(row.status) === 'Completed'
                        ? 'text-green-600'
                        : getCompletedStatusLabel(row.status) === 'In Progress'
                            ? 'text-amber-600'
                            : 'text-gray-500'
                }`}>
                    {getCompletedStatusLabel(row.status)}
                </span>
            )
        },
        {
            key: 'approvalStatus',
            header: 'Approval Status',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm uppercase
                    ${row.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                    ${row.status === 'COMPLETED' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${row.status === 'REJECTED' ? 'bg-red-100 text-red-700' : ''}
                    ${row.status === 'ASSIGNED' || row.status === 'IN_PROGRESS' ? 'bg-gray-100 text-gray-700' : ''}
               `}>
                    {getApprovalStatusLabel(row.status)}
                </span>
            )
        },
        {
            key: 'action',
            header: 'Action',
            cell: (row) => (
                <button
                    onClick={() => setSelectedTaskId(row.id)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                    View Details
                </button>
            )
        }
    ]

    const formatLongDate = (value?: string) => {
        if (!value) return 'No due date'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'No due date'
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleReviewAction = (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedTask) return
        const reviewedTask = selectedTask
        updateTaskStatus.mutate({ id: selectedTask.id, status }, {
            onSuccess: () => {
                closeTaskDrawer()
                if (status === 'APPROVED') {
                    navigate(`/workflow/timeline?search=${encodeURIComponent(reviewedTask.refNo || reviewedTask.id)}`)
                }
            }
        })
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900">
            <PageHeader
                title="Scheduled Task Approval"
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'Scheduled Task Approval' }
                ]}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 overflow-hidden">
                {/* 3-Metric Summary Banner */}
                <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200 py-6">
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-[#0F969C]">Approval Pending - {approvalPendingCount.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-[#28a745]">Approved - {approvedCount.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-[#dc3545]">Rejected - {rejectedCount.toString().padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="p-4">
                    {focusTaskId && (
                        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800">
                            Opened from notification. Review the highlighted completed follow-up task, then approve or reject it.
                        </div>
                    )}

                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search task by title or staff..."
                    />

                    {isLoadingTasks || isLoadingStaff ? (
                        <div className="animate-pulse bg-white border border-gray-200 shadow-sm rounded-lg h-64 p-6 mt-4">
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <DataTable
                                data={filteredTasks}
                                columns={columns}
                                keyExtractor={(t) => t.id}
                                emptyStateMessage="No data available in table"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Standard Detail Drawer */}
            <Drawer
                isOpen={!!selectedTaskId}
                onClose={closeTaskDrawer}
                title="Review Scheduled Task"
            >
                <div className="space-y-5 p-6">
                    {selectedTask ? (
                        <>
                            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Task</p>
                                <h3 className="mt-2 text-lg font-extrabold text-slate-900">{selectedTask.title}</h3>
                                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                    {selectedTask.description || 'No description added.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-xs font-bold uppercase text-gray-400">Staff</p>
                                    <p className="mt-1 text-sm font-bold text-gray-900">{selectedTask.staffName}</p>
                                    <p className="text-xs text-gray-500">{selectedTask.staffId}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-xs font-bold uppercase text-gray-400">Due Date</p>
                                    <p className="mt-1 text-sm font-bold text-gray-900">{formatLongDate(selectedTask.dueDate)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                                    <p className="mt-1 text-sm font-bold text-gray-900">{getApprovalStatusLabel(selectedTask.status)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="text-xs font-bold uppercase text-gray-400">Priority</p>
                                    <p className="mt-1 text-sm font-bold text-gray-900">{selectedTask.priority || 'MEDIUM'}</p>
                                </div>
                            </div>

                            {selectedTask.status !== 'COMPLETED' && (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                    {selectedTask.status === 'APPROVED'
                                        ? 'This task is already approved. You can close this review.'
                                        : 'Approval is enabled after staff marks the duty as completed.'}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Task details unavailable.</p>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={closeTaskDrawer}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => handleReviewAction('REJECTED')}
                            disabled={!selectedTask || selectedTask.status !== 'COMPLETED' || updateTaskStatus.isPending}
                            className="px-4 py-2 rounded-md border border-red-200 bg-red-50 font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => handleReviewAction('APPROVED')}
                            disabled={!selectedTask || selectedTask.status !== 'COMPLETED' || updateTaskStatus.isPending}
                            className="px-4 py-2 rounded-md bg-primary-600 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}
