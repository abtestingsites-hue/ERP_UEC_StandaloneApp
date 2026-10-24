import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader'
import { DataTable, type Column } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { useApprovalTasks } from '../hooks/useTasks'
import { useUpdateTaskStatus } from '../hooks/useTasks'
import { useStaff } from '../../../hooks/useHRData'
import { Drawer } from '../../../components/Drawer'
import type { Task } from '../types'

type TaskGroup = {
    id: string
    staffId: string
    staffName: string
    date: string
    tasks: Task[]
    status: string
}

export function DailyTaskApproval() {
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
    const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null)
    const [approvedTask, setApprovedTask] = useState<Task | null>(null)

    const closeReviewDrawer = () => {
        setSelectedGroup(null)
        if (focusTaskId || routeUnitId || routeSearch) {
            const params = new URLSearchParams()
            if (routeUnitId) params.set('unitId', routeUnitId)
            if (routeSearch) params.set('search', routeSearch)
            navigate(`/task-log/daily-approval${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
        }
    }

    const dailyTasks = useMemo(() => allTasks.filter(t => (t as any).type === 'DAILY'), [allTasks])
    const scheduledCompletedCount = useMemo(
        () => allTasks.filter(t => t.type === 'SCHEDULED' && t.status === 'COMPLETED').length,
        [allTasks]
    )

    const approvalPendingCount = dailyTasks.filter(t => t.status === 'COMPLETED').length
    const rejectedCount = dailyTasks.filter(t => t.status === 'REJECTED').length

    const groupedStaffTasks = useMemo(() => {
        const groups: Record<string, TaskGroup> = {}

        dailyTasks.forEach(task => {
            if (task.status === 'APPROVED') return

            const staff = taskStaffList.find(s =>
                s.id === task.assignedStaffId ||
                s.user?.id === task.assigneeId
            )
            const staffName = staff?.name || task.assignedTo

            const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'
            const groupStaffId = staff?.empId || task.assignedTo
            const key = `${groupStaffId}-${dateStr}`

            let status = 'Assigned'
            if (task.status === 'COMPLETED') status = 'Approval Pending'
            else if (task.status === 'IN_PROGRESS') status = 'In Progress'
            else if (task.status === 'REJECTED') status = 'Rejected'

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    staffId: groupStaffId,
                    staffName,
                    date: dateStr,
                    tasks: [],
                    status
                }
            }
            groups[key].tasks.push(task)
            if (groups[key].status !== 'Approval Pending' && status === 'Approval Pending') {
                groups[key].status = status
            } else if (groups[key].status === 'Assigned' && status === 'In Progress') {
                groups[key].status = status
            }
        })

        return Object.values(groups)
    }, [dailyTasks, taskStaffList])

    const filteredGroups = groupedStaffTasks.filter(g =>
        g.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tasks.some((task) =>
            task.id === focusTaskId ||
            task.refNo === searchQuery ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    useEffect(() => {
        const routeSearchLower = (routeSearch || '').toLowerCase()
        const focusedTask = focusTaskId
            ? allTasks.find((task) => task.id === focusTaskId)
            : routeSearchLower
                ? allTasks.find((task) =>
                    task.type === 'SCHEDULED' &&
                    (
                        task.refNo?.toLowerCase() === routeSearchLower ||
                        task.title.toLowerCase().includes(routeSearchLower) ||
                        task.description.toLowerCase().includes(routeSearchLower)
                    )
                )
                : null
        if (focusedTask && focusedTask.type === 'SCHEDULED') {
            const params = new URLSearchParams()
            params.set('taskId', focusedTask.id)
            if (routeUnitId) params.set('unitId', routeUnitId)
            if (routeSearch) params.set('search', routeSearch)
            navigate(`/task-log/schedule-approval?${params.toString()}`, { replace: true })
            return
        }
        if (!focusTaskId || selectedGroup || groupedStaffTasks.length === 0) return
        const matchedGroup = groupedStaffTasks.find((group) => group.tasks.some((task) => task.id === focusTaskId))
        if (matchedGroup) {
            setSelectedGroup(matchedGroup)
            setSearchQuery(matchedGroup.staffName)
        }
    }, [allTasks, focusTaskId, groupedStaffTasks, navigate, routeSearch, routeUnitId, selectedGroup])

    const getApprovalStatusLabel = (status: string) => {
        if (status === 'APPROVED') return 'Approved'
        if (status === 'COMPLETED') return 'Approval Pending'
        if (status === 'REJECTED') return 'Rejected'
        if (status === 'IN_PROGRESS') return 'In Progress'
        return 'Assigned'
    }

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

    const handleReviewAction = (taskId: string, status: 'APPROVED' | 'REJECTED') => {
        const reviewedTask = selectedGroup?.tasks.find((task) => task.id === taskId) || null
        closeReviewDrawer()
        updateTaskStatus.mutate({ id: taskId, status }, {
            onSuccess: () => {
                if (status === 'APPROVED' && reviewedTask) {
                    setApprovedTask(reviewedTask)
                    navigate(`/workflow/timeline?search=${encodeURIComponent(reviewedTask.refNo || reviewedTask.id)}`)
                }
            }
        })
    }

    const handleApproveCompletedGroup = () => {
        if (!selectedGroup) return
        const completedTasks = selectedGroup.tasks.filter((task) => task.status === 'COMPLETED')
        if (completedTasks.length === 0) return
        const firstTask = completedTasks[0]
        closeReviewDrawer()
        completedTasks.forEach((task) => {
            updateTaskStatus.mutate({ id: task.id, status: 'APPROVED' }, {
                onSuccess: () => {
                    setApprovedTask(firstTask)
                    navigate(`/workflow/timeline?search=${encodeURIComponent(firstTask.refNo || firstTask.id)}`)
                }
            })
        })
    }

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
            key: 'taskDate',
            header: 'Task Date',
            cell: (row) => <span className="text-sm font-medium text-gray-800">{row.date}</span>
        },
        {
            key: 'totalTask',
            header: 'Total Task',
            cell: (row) => <span className="text-sm font-bold text-gray-900">{row.tasks.length}</span>
        },
        {
            key: 'approvalStatus',
            header: 'Approval Status',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm uppercase ${
                    row.status === 'Approval Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : row.status === 'In Progress'
                            ? 'bg-gray-100 text-gray-700'
                            : row.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                }`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'action',
            header: 'Action',
            cell: (row) => (
                <button
                    onClick={() => setSelectedGroup(row)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                    View Details
                </button>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900">
            <PageHeader
                title="Daily Task Approval"
                breadcrumbs={[
                    { label: 'Home' },
                    { label: 'Daily Task Approval' }
                ]}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 overflow-hidden">
                {/* Summary Banner */}
                <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200 py-6">
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-blue-600">Approval Pending - {approvalPendingCount.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-center items-center">
                        <span className="text-xl font-medium text-red-500">Rejected - {rejectedCount.toString().padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="p-4">
                    {focusTaskId && (
                        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800">
                            Opened from notification. Review the highlighted completed duty, then continue the workflow after approval.
                        </div>
                    )}

                    {approvedTask && (
                        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-extrabold text-emerald-900">Duty approved</p>
                                <p className="text-sm font-semibold text-emerald-700">
                                    Continue to the workflow timeline to complete healthcare monitoring, billing, customer care, renewal, and repeat service.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/workflow/timeline?search=${encodeURIComponent(approvedTask.refNo || approvedTask.id)}`)}
                                    className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-emerald-800"
                                >
                                    Continue Workflow
                                </button>
                                <Link
                                    to="/finance/invoice"
                                    className="rounded-md border border-emerald-300 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
                                >
                                    Open Billing
                                </Link>
                            </div>
                        </div>
                    )}

                    <FilterSection
                        searchQuery={searchQuery}
                        onSearchChange={(e) => setSearchQuery(e.target.value)}
                        searchPlaceholder="Search..."
                    />

                    {isLoadingTasks || isLoadingStaff ? (
                        <div className="animate-pulse bg-white border border-gray-200 shadow-sm rounded-lg h-64 p-6 mt-4">
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <DataTable
                                data={filteredGroups}
                                columns={columns}
                                keyExtractor={(g) => g.id}
                                emptyStateMessage={
                                    dailyTasks.length === 0 && scheduledCompletedCount > 0
                                        ? `No daily tasks found. ${scheduledCompletedCount} completed scheduled task(s) are available in Scheduled Task Approval.`
                                        : 'No daily task data available in table'
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Standard Detail Drawer */}
            <Drawer
                isOpen={!!selectedGroup}
                onClose={closeReviewDrawer}
                title="Review Tasks"
            >
                <div className="space-y-5 p-6">
                    {selectedGroup ? (
                        <>
                            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Staff Task Review</p>
                                <h3 className="mt-2 text-lg font-extrabold text-slate-900">{selectedGroup.staffName}</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-600">
                                    {selectedGroup.staffId} | {selectedGroup.date} | {selectedGroup.tasks.length} task(s)
                                </p>
                            </div>

                            <div className="space-y-3">
                                {selectedGroup.tasks.map((task, index) => (
                                    <div key={task.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Task {index + 1}</p>
                                                <h4 className="mt-1 text-base font-extrabold text-slate-900">{task.title}</h4>
                                                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                                    {task.description || 'No description added.'}
                                                </p>
                                            </div>
                                            <span className={`w-fit rounded px-2 py-1 text-xs font-bold uppercase ${
                                                task.status === 'COMPLETED'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : task.status === 'APPROVED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : task.status === 'REJECTED'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {getApprovalStatusLabel(task.status)}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-xs font-bold uppercase text-gray-400">Due Date</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">{formatLongDate(task.dueDate)}</p>
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-xs font-bold uppercase text-gray-400">Priority</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">{task.priority || 'MEDIUM'}</p>
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-xs font-bold uppercase text-gray-400">Assigned By</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">{task.assignedBy || 'System'}</p>
                                            </div>
                                        </div>

                                        {task.status === 'COMPLETED' ? (
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleReviewAction(task.id, 'REJECTED')}
                                                    disabled={updateTaskStatus.isPending}
                                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReviewAction(task.id, 'APPROVED')}
                                                    disabled={updateTaskStatus.isPending}
                                                    className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                                Approval is enabled after staff marks this task as completed.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Task details unavailable.</p>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={closeReviewDrawer}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleApproveCompletedGroup}
                            disabled={!selectedGroup?.tasks.some((task) => task.status === 'COMPLETED') || updateTaskStatus.isPending}
                            className="rounded-md bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Approve Completed
                        </button>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}
